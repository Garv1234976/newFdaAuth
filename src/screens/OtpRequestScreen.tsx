import { getDeviceSIMs } from '../services/simService';
import { Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  Alert,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import { ChevronDown } from "lucide-react-native";
import { useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import Clipboard from '@react-native-clipboard/clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArrowLeft } from 'lucide-react-native';
import StatusModal from '../StatusModal';

export default function OtpRequestScreen() {
  const { user } = useContext(AuthContext);
  const navigation = useNavigation();
  const pickerRef = React.useRef(null);

  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpType, setOtpType] = useState('');
  const [otpTime, setOtpTime] = useState('');
  const [warning, setWarning] = useState('');
  const [otpTypes, setOtpTypes] = useState<any[]>([]);
  const [modal, setModal] = useState({
    visible: false,
    type: 'success',
    message: ''
  });
  const copyOtp = () => {
    if (!otp) return;

    Clipboard.setString(otp);
    setModal({
      visible: true,
      type: 'success',
      message: 'Copied!'
    })
  };

  const verifyUserSIM = async () => {

    if (Platform.OS !== 'android') return true;

    try {

      const sims = await getDeviceSIMs();

      if (!sims || sims.length === 0) {
        return false;
      }

      const match = sims.find((sim: any) => {

        let number = sim.phoneNumber || '';
        number = number.slice(-10);

        return number === user?.phone;

      });

      return !!match;

    } catch (err) {

      console.log("SIM verify error", err);
      return false;

    }

  };
  const getOTP = async () => {

    setWarning('');
    setOtp('');
    setOtpTime('');

    try {
      const simValid = await verifyUserSIM();

      if (!simValid) {
        setModal({
          visible: true,
          type: 'error',
          message: 'Registered SIM not detected'
        });
        return;
      }

      setLoading(true);

      const body = `act=get_Act_Otp&regnum=${user?.phone}&userid=${user?.userId
        }&idPass=${user?.password}&otp_type=${otpType}&title=${encodeURIComponent(
          title,
        )}`;

      const res = await axios.post(
        'https://futuredigiassets.com/fda/userdash/members/ajaxfuntions-dynamic.php',
        body,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      const data = res.data;

      console.log(data);

      if (data.status === 'success') {

        setOtp(data.otpValue);
        setOtpType(data.siteOtpType);
        setOtpTime(data.otpTime);

        await saveOtpToStorage(data);

      } else {

        // show minimal warning like login screen
        setModal({
          visible: true,
          type: 'warning',
          message: data.message || `${selectedOtpLabel} OTP not available`
        })
        // setWarning(data.message || `${selectedOtpLabel} OTP not available`);

        setOtp('');
        setOtpTime('');

      }

    } catch (err) {

      console.log(err);

      setWarning('Network error. Please try again.');

    } finally {

      setLoading(false);

    }

  };

  const saveOtpToStorage = async data => {
    try {
      const stored = await AsyncStorage.getItem('OTP_LIST');

      let otpList = stored ? JSON.parse(stored) : [];

      const newOtp = {
        id: Date.now(),
        title: data.message,
        otp: data.otpValue,
        type: data.siteOtpType,
        createdAt: new Date(data.curTime).getTime(),
        expireAt: new Date(data.otpTime).getTime(),
      };

      const now = Date.now();

      // remove expired
      otpList = otpList.filter(item => item.expireAt > now);

      // remove previous OTP with same type
      otpList = otpList.filter(item => item.type !== newOtp.type);

      // add latest OTP on top
      otpList.unshift(newOtp);

      await AsyncStorage.setItem('OTP_LIST', JSON.stringify(otpList));
    } catch (err) {
      console.log('OTP Save Error', err);
    }
  };

useEffect(() => {
  if (!user?.otpTypes) return;

  const types = Object.entries(user.otpTypes).map(([key, value]) => ({
    label: value, // shown in dropdown
    value: key,   // used for API
  }));

  setOtpTypes(types);

  if (types.length > 0) {
    setOtpType(types[0].value);
  }
}, [user]);
const selectedOtpLabel =
  otpTypes.find(t => t.value === otpType)?.label || otpType;
  return (
    <>
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F5F7FB" />

        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ArrowLeft size={26} />
          </TouchableOpacity>

          <Text style={styles.title}>Generate OTP</Text>
        </View>

        {/* <Text style={styles.user}>User ID : {user?.userId}</Text> */}

        {/* <Text style={styles.phone}>Phone : +91 {user?.phone}</Text> */}
        {/* <Text style={styles.phone}>Select Site for OTP</Text> */}
        <Text style={{ fontSize: 20, fontWeight: 500, marginBottom: 5 }}>Select One</Text>

        {/* Title Input */}


     <View style={styles.pickerBox}>
  <RNPickerSelect
    ref={pickerRef}
    value={otpType}
    onValueChange={(value) => {
      setOtpType(value);
      setOtp('');
      setOtpTime('');
    }}
    items={otpTypes}
    placeholder={{ label: "---", value: null }}
    useNativeAndroidPickerStyle={false}

    touchableWrapperProps={{
      activeOpacity: 0.7
    }}
    
      pickerProps={{
    itemStyle: {
      color: 'black', 
    },
  }}
Icon={() => (
  <ChevronDown size={20} color="#555" pointerEvents="none" />
)}

    style={{
      
  inputIOS: {
    height: 48,
    width: '100%',
    fontSize: 18,
    paddingVertical: 14,
    paddingHorizontal: 12,
    paddingRight: 40,
    color: '#000', 
    backgroundColor: '#e2e2e2',
    borderWidth: 1,
    borderRadius: 10,
    borderColor : '#7c7c7c'
  },

    placeholder: {
    color: '#fff', // placeholder color
  },
      inputIOSContainer: {
         zIndex: 100,
      height: 48, // Ensure the container has the same height
      width: '100%',
    },
      iconContainer: {
    top: 16,
    right: 12,
  },

}}
  />
</View>

        {/* Button */}

        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.7 }]}
          onPress={getOTP}
          disabled={loading || otpTypes.length === 0}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Get OTP</Text>
          )}
        </TouchableOpacity>

        {warning !== '' && (
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>{warning}</Text>
          </View>
        )}
        {/* Result */}

        {otp !== '' && (
          <View style={styles.card}>
            <Text style={styles.label}>OTP for {selectedOtpLabel}</Text>

            <TouchableOpacity
              onPress={copyOtp}
              style={{ flexDirection: 'column', alignItems: 'center' }}
            >
              <Text style={styles.otp}>{otp}</Text>
              <Text style={styles.copyHint}>Tap to copy</Text>
            </TouchableOpacity>

            {/* <View style={{marginBlock: 20}}>
            <Text style={styles.meta}>Type : {otpType}</Text>

          <Text style={styles.meta}>Time : {otpTime}</Text>
          </View> */}
          </View>
        )}
      </View>
      <StatusModal
        visible={modal.visible}
        type={modal.type}
        message={modal.message}
        onClose={() => setModal({ ...modal, visible: false })}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 68,
    // backgroundColor: '#F5F7FB',
    marginInline: 20
    // marginBlock: 50,
  },

  title: {
    fontSize: 26,
    fontWeight: '700',
    // marginBottom: 20,
  },

  user: {
    fontSize: 16,
  },

  phone: {
    fontSize: 16,
    marginBottom: 20,
  },

  input: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    color: '#333'
  },

  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },

  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 20
  },

  card: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 30,
    elevation: 4,
  },

  label: {
    color: '#777',
  },

  otp: {
    fontSize: 36,
    fontWeight: '700',
    marginVertical: 10,
    letterSpacing: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    paddingInline: 20,
    backgroundColor: '#deeef5',
  },

  meta: {
    color: '#666',
  },
pickerBox: {
  
  borderRadius: 10,
  marginBottom: 15,
  justifyContent: 'center',
  borderWidth: 1,
  borderColor: '#ddd',
  
},
  copyHint: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
    fontWeight: 700,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 20,
    paddingBottom: 40
  },

  backBtn: {
    fontSize: 24,
    marginRight: 15,
    fontWeight: 700,
  },
  warningBox: {
    backgroundColor: '#FFE9E9',
    borderColor: '#FF4D4F',
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    marginTop: 10
  },

  warningText: {
    color: '#D8000C',
    fontSize: 14,
    fontWeight: '500'
  },
});
