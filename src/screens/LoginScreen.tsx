import DeviceInfo from 'react-native-device-info';
import React, { useContext, useEffect, useLayoutEffect, useState } from 'react';
import {
  View,
  Text,
  PermissionsAndroid,
  Platform,
  Modal,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Keyboard
} from 'react-native';

import axios from 'axios';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getDeviceSIMs } from '../services/simService';
import { AuthContext } from '../context/AuthContext';
import StatusModal from '../StatusModal';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {

  const { login } = useContext(AuthContext);

  const [phone, setPhone] = useState('');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [sims, setSims] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [warning, setWarning] = useState('');
  const [deviceInfo, setDeviceInfo] = useState<any>(null)
  const [modal, setModal] = useState({
    visible: false,
    type: 'success',
    message: ''
  });
  useEffect(() => {
    requestPermission();
  }, []);

  const requestPermission = async () => {

    if (Platform.OS !== 'android') return;

    const granted = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
      PermissionsAndroid.PERMISSIONS.READ_PHONE_NUMBERS,
    ]);

    if (granted['android.permission.READ_PHONE_STATE'] === 'granted') {
      loadSIM();
    }
  };

  const loadSIM = async () => {

    const simData = await getDeviceSIMs();

    const formattedSIMs = simData.map((sim: any) => {

      const isEsim =
        sim.isEmbedded === true ||
        sim.cardId === -1 ||
        sim.simSlotIndex === -1;

      return {
        ...sim,
        isEsim
      };

    });

    setSims(formattedSIMs);
  };

  const selectSIM = (sim: any) => {

    let number = sim.phoneNumber || '';

    number = number.slice(-10);

    setPhone(number);
    setWarning('');
    setModalVisible(false);

  };

  const loginUser = async () => {

    if (loading) return;

    if (!phone || !userId || !password) {
      // setWarning("");
      setModal({
        visible: true,
        type: 'error',
        message: 'Please fill all fields'
      })
      return;
    }

    Keyboard.dismiss();

    try {

      setLoading(true);
      setWarning('');

      const deviceId = await DeviceInfo.getUniqueId();
      let body = '';
        if (Platform.OS === 'ios') {
          body = `act=Opt_id_login&regNum=${phone}&regId=${userId}&idPass=${password}&phoneNumber=${phone}&deviceId=${deviceId}&brand=${deviceInfo?.brand}&deviceName=${deviceInfo?.deviceName}&systemName=${deviceInfo?.systemName}`;
        } else {
          body = `act=Opt_id_login&regNum=${phone}&regId=${userId}&idPass=${password}`;
        }
      // const body =
      //   `act=Opt_id_login&regNum=${phone}&regId=${userId}&idPass=${password}&deviceId=${deviceId}&phoneNumber${phone}`;

      // console.log(body);
      
      const res = await axios({
        method: 'POST',
        url: 'https://futuredigiassets.com/fda/userdash/members/ajaxfuntions-dynamic.php',
        data: body,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      const response = res.data;

      if (response?.success === "YES") {

        const userData = {
          phone,
          userId,
          password,
          apiUserId: response.userid,
          logoUrl: response.data?.logoUrl,
          otpTypes: response.data?.otpTypes
        };

        await login(userData);

        // navigation.replace('Dashboard');

      } else {

        setModal({
          visible: true,
          type: 'error',
          message: response?.message
        })
        // setWarning(response?.message || "Login failed");

      }

    } catch (err: any) {

      console.log("Login Error:", err);
      setModal({
        visible: true,
        type: 'error',
        message: 'Network error. Please try again.'
      })
      // setWarning("Network error. Please try again.");

    } finally {

      setLoading(false);

    }

  };


  const debugDeviceAndContacts = async () => {

    try {
      const getRawDeviceInfo = {
        deviceId: await DeviceInfo.getUniqueId(),
        brand: DeviceInfo.getBrand(),
        model: DeviceInfo.getModel(),
        systemName: DeviceInfo.getSystemName(),
        systemVersion: DeviceInfo.getSystemVersion(),
        deviceName: await DeviceInfo.getDeviceName(),
        bundleId: DeviceInfo.getBundleId(),
      };

      setDeviceInfo(getRawDeviceInfo)
console.log(getRawDeviceInfo)

    } catch (error) {
      console.log("DEBUG ERROR:", error);
    }

  };

  useLayoutEffect(() => {
    debugDeviceAndContacts()
  }, [])

  if (!deviceInfo) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4A6CF7" />
      </View>
    );
  }
  return (
    <>
      <KeyboardAvoidingView
        style={{ flex: 1, paddingBlock: 50 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={20}
      >

        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          <StatusBar barStyle="dark-content" backgroundColor="#F5F7FB" />

          <Text style={styles.heading}>Login</Text>

          {warning !== '' && (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>{warning}</Text>
            </View>
          )}
          {Platform.OS === 'android' ? (
            <TouchableOpacity
              style={styles.phoneSelector}
              onPress={() => setModalVisible(true)}
            >
              <Text style={styles.phoneText}>
                {phone ? `+91 ${phone}` : "Select SIM Number"}
              </Text>
            </TouchableOpacity>
          ) : (
            <>
              

              <TextInput
                placeholder="Enter phone number"
                value={phone}
                onChangeText={(text) => {
                  setPhone(text.replace(/[^0-9]/g, '').slice(0, 10));
                  setWarning('');
                }}
                keyboardType="number-pad"
                // style={{ borderWidth: 1, borderRadius: 10, borderColor: '#c4bebe' }}
                style={styles.input}
                placeholderTextColor={'#333'}
              />
            </>
          )}



          <TextInput
            placeholder="User ID"
            value={userId}
            onChangeText={(text) => {
              setUserId(text.replace(/[^0-9]/g, ''));
              setWarning('');
            }}
            keyboardType="number-pad"
            style={styles.input}
            returnKeyType="next"
            placeholderTextColor={'#333'}
          />

          <TextInput
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setWarning('');
            }}
            style={styles.input}
            returnKeyType="done"
            placeholderTextColor={'#333'}
          />

          <TouchableOpacity
            style={[
              styles.loginButton,
              loading && { opacity: 0.7 }
            ]}
            onPress={loginUser}
            disabled={loading}
          >

            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginText}>Login</Text>
            )}

          </TouchableOpacity>

        </ScrollView>

      </KeyboardAvoidingView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>

          <View style={styles.bottomSheet}>

            <Text style={styles.sheetTitle}>Choose SIM</Text>

            <ScrollView
              style={{ maxHeight: 300 }}
              showsVerticalScrollIndicator={false}
            >

              {sims.map((sim, index) => (

                <TouchableOpacity
                  key={index}
                  style={styles.simCard}
                  onPress={() => selectSIM(sim)}
                >

                  <Text style={styles.simCarrier}>
                    {sim.carrierName} {sim.isEsim ? "(eSIM)" : "(Physical SIM)"}
                  </Text>

                  <Text style={styles.simNumber}>
                    {sim.phoneNumber}
                  </Text>

                </TouchableOpacity>

              ))}

            </ScrollView>

            <TouchableOpacity
              style={{ marginTop: 20 }}
              onPress={() => setModalVisible(false)}
            >
              <Text
                style={{
                  textAlign: 'center',
                  fontWeight: '800',
                  fontSize: 16,
                  backgroundColor: '#d6d3d3',
                  paddingVertical: 8,
                  borderRadius: 20
                }}
              >
                Cancel
              </Text>
            </TouchableOpacity>

          </View>

        </View>
      </Modal>
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
    flexGrow: 1,
    padding: 24,
    backgroundColor: '#F5F7FB'
  },

  heading: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 20
  },

  warningBox: {
    backgroundColor: '#FFE9E9',
    borderColor: '#FF4D4F',
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16
  },

  warningText: {
    color: '#D8000C',
    fontSize: 14,
    fontWeight: '500'
  },

  phoneSelector: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
    marginBottom: 16
  },

  phoneText: {
    fontSize: 16
  },

  input: {
    // backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
    marginBottom: 16,
    color: '#333',
    fontSize: 20,
    borderWidth: 1,
    borderColor: '#acaca4'
  },

  loginButton: {
    backgroundColor: '#4A6CF7',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center'
   
  },

  loginText: {
    color: '#fff',
    fontWeight: '600',
     fontSize: 20
  },

  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },

  bottomSheet: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 90
  },

  sheetTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20
  },

  simCard: {
    padding: 15,
    backgroundColor: '#F7F8FA',
    borderRadius: 10,
    marginBottom: 10
  },

  simCarrier: {
    fontWeight: '600'
  },

  simNumber: {
    color: '#777'
  }

});