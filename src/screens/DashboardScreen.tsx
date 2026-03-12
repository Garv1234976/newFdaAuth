import DeviceInfo from 'react-native-device-info';
import React, {
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Image,
  Alert,
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  TextInput,
  Platform
} from 'react-native';

import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { AuthContext } from '../context/AuthContext';

import AsyncStorage from '@react-native-async-storage/async-storage';
import Clipboard from '@react-native-clipboard/clipboard';
import { getDeviceSIMs } from '../services/simService';
import { useFocusEffect } from '@react-navigation/native';
import StatusModal from '../StatusModal';

const drawerWidth = 280;
const screenWidth = Dimensions.get('window').width;

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

export default function DashboardScreen({ navigation }: Props) {
  const { user, logout } = useContext(AuthContext);

  const drawerAnim = useRef(new Animated.Value(-drawerWidth)).current;

  const [open, setOpen] = useState(false);
  const [simBlocked, setSimBlocked] = useState(false);
  const [search, setSearch] = useState('');

  const [, forceUpdate] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [otps, setOtps] = useState<any[]>([]);
  const [deviceInfo, setDeviceInfo] = useState<any>(null)
  const [modal, setModal] = useState({
    visible: false,
    type: 'success',
    message: '',
  });

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
  // const APP_VERSION = '1.0.0';

  const copyOtp = (otp: string) => {
    Clipboard.setString(otp);
    setModal({
      visible: true,
      type: 'success',
      message: 'Copied!',
    });
  };

  const getRemaining = (expireAt: number) => {
    const diff = expireAt - Date.now();

    if (diff <= 0) return 'Expired';

    const sec = Math.floor(diff / 1000);
    const m = Math.floor(sec / 60);
    const s = sec % 60;

    return `${m}:${s < 10 ? '0' + s : s}`;
  };

  const loadOtps = async () => {
    try {
      const stored = await AsyncStorage.getItem('OTP_LIST');

      if (!stored) return;

      const list = JSON.parse(stored);

      setOtps(list);
    } catch (err) {
      console.log('OTP Load Error', err);
    }
  };

  // useEffect(()=>{

  // },[]);
  useFocusEffect(
    useCallback(() => {
      loadOtps();

      const interval = setInterval(async () => {
        const now = Date.now();

        setOtps(prev => {
          const validOtps = prev.filter(item => item.expireAt > now);

          AsyncStorage.setItem('OTP_LIST', JSON.stringify(validOtps));

          return validOtps;
        });

        forceUpdate(n => n + 1);
      }, 1000);

      return () => clearInterval(interval);
    }, []),
  );

  const filteredOtps = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return otps;

    return otps.filter(
      item =>
        item.title?.toLowerCase().includes(query) ||
        item.type?.toLowerCase().includes(query) ||
        item.otp?.toLowerCase().includes(query),
    );
  }, [search, otps]);

  const verifyUserSIM = async () => {
    try {
      const stored = await AsyncStorage.getItem('USER_LOGIN');

      if (!stored) return;

      const userData = JSON.parse(stored);

      const sims = await getDeviceSIMs();

      if (!sims || sims.length === 0) {
        setSimBlocked(true);
        return;
      }

      const match = sims.find((sim: any) => {
        let number = sim.phoneNumber || '';

        number = number.slice(-10);

        return number === userData.phone;
      });

      setSimBlocked(!match);
    } catch (err) {
      console.log('SIM Verify Error', err);
    }
  };

  useEffect(() => {

    if (Platform.OS !== 'android') return;

    verifyUserSIM();

    const interval = setInterval(() => {
      verifyUserSIM();
    }, 5000); // check every 5 seconds

    return () => clearInterval(interval);

  }, []);

  const openDrawer = () => {
    setOpen(true);

    Animated.timing(drawerAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  };

  const closeDrawer = () => {
    Animated.timing(drawerAnim, {
      toValue: -drawerWidth,
      duration: 250,
      useNativeDriver: false,
    }).start(() => setOpen(false));
  };

  const handleLogout = async () => {
    await logout();
    // navigation.replace('Login');
  };

  useEffect(() => {
    if (Platform.OS === 'android') {
      if (!simBlocked) return;

      setTimeLeft(60); // reset timer

      const interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(interval);

            logout();
            // navigation.replace('Login');

            return 0;
          }

          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }

  }, [simBlocked]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${minutes.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };
  return (
    <>
      <View style={{ flex: 1 }}>
        <StatusBar barStyle="dark-content" backgroundColor="#F5F7FB" />

        {/* Drawer */}

        <Animated.View style={[styles.drawer, { left: drawerAnim }]}>
          <View style={styles.drawerHeader}>
            <Image source={{ uri: user?.logoUrl }} style={styles.logo} />

            <Text style={styles.drawerUser}>{user?.userId}</Text>

            <Text style={styles.drawerPhone}>+91 {user?.phone}</Text>
          </View>

          <View style={styles.drawerMenu}>
            <TouchableOpacity style={styles.drawerItem} onPress={closeDrawer}>
              <Text style={styles.drawerItemText}>Dashboard</Text>
            </TouchableOpacity>

            {/* <TouchableOpacity style={styles.drawerItem}>
              <Text style={styles.drawerItemText}>My OTPs</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.drawerItem}>
              <Text style={styles.drawerItemText}>Settings</Text>
            </TouchableOpacity> */}
          </View>

          <View style={styles.drawerFooter}>
            {/* <Text style={styles.appVersion}>App Version {APP_VERSION}</Text> */}

            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {open && (
          <TouchableOpacity style={styles.overlay} onPress={closeDrawer} />
        )}

        {/* Main */}

        <ScrollView style={styles.container}
          contentContainerStyle={{
            paddingBottom: 40,
            flexGrow: 1,
          }}
          stickyHeaderIndices={[0]}
        >
          <View style={styles.stickyHeader}>
            <View style={styles.header}>
              <TouchableOpacity onPress={openDrawer}>
                <Text style={styles.menu}>☰</Text>
              </TouchableOpacity>

              <Text style={styles.heading}>Dashboard</Text>
            </View>

            <Text style={styles.sectionTitle}>Recent OTP</Text>

            <TextInput
              placeholder="Search OTP"
              value={search}
              onChangeText={setSearch}
              style={styles.searchInput}
              placeholderTextColor={'#333'}
            />
          </View>


          {filteredOtps.map(item => (
            <TouchableOpacity
              key={item.id}
              style={styles.otpCard}
              onPress={() => copyOtp(item.otp)}
            >
              <View>
                <Text style={styles.otpTitle}>
                  {item.type.toUpperCase()} OTP
                </Text>

                <Text style={styles.otpSubtitle}>{item.title}</Text>
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.otpCode}>{item.otp}</Text>

                <Text style={styles.timer}>{getRemaining(item.expireAt)}</Text>
              </View>
            </TouchableOpacity>
          ))}
          <View style={styles.bottomButtonContainer}>
            <TouchableOpacity
              style={styles.bottomButton}
              onPress={() => navigation.navigate('OTPRequest')}
            >
              <Text style={styles.bottomButtonText}>OTP</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>


        {/* FAB */}
      </View>

      {/* SIM Modal */}
      {Platform.OS === 'android' && (
        <Modal visible={simBlocked} transparent animationType="fade">
          <View style={styles.simModalContainer}>
            <View style={styles.simModalBox}>
              <Text style={styles.simModalTitle}>SIM Required</Text>

              <Text style={styles.simModalText}>
                Insert the SIM registered with this account
              </Text>

              <Text style={styles.simModalPhone}>+91 {user?.phone}</Text>

              <Text style={styles.simLogoutTimer}>
                Logging out in {formatTime(timeLeft)}
              </Text>
            </View>
          </View>
        </Modal>
      )}


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
    padding: 24,
    backgroundColor: '#F5F7FB',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 40,
  },

  menu: {
    fontSize: 28,
    marginRight: 20,
  },

  heading: {
    fontSize: 24,
    fontWeight: '700',
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 25,
    marginBottom: 10,
  },

  searchInput: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 20
  },

  otpCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    
  },

  otpTitle: {
    fontWeight: '600',
    fontSize: 18,
  },

  otpSubtitle: {
    fontSize: 20,
    color: '#777',
  },

  otpCode: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 2,
  },

  timer: {
    fontSize: 16,
    color: '#FF4D4F',
    marginTop: 4,
  },

  fab: {
    position: 'absolute',
    bottom: 55,
    right: 30,
    backgroundColor: '#007AFF',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },

  fabText: {
    color: '#fff',
    fontWeight: '700',
  },

  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: drawerWidth,
    backgroundColor: '#fff',
    zIndex: 10,
    elevation: 10,
  },

  drawerHeader: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },

  logo: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
  },

  drawerUser: {
    fontWeight: '700',
    marginTop: 10,
    fontSize: 18
  },

  drawerPhone: {
    color: '#777',
    fontSize: 20
  },

  drawerMenu: {
    padding: 20,
  },

  drawerItem: {
    paddingVertical: 14,
  },

  drawerItemText: {
    fontSize: 20,
  },

  drawerFooter: {
    marginTop: 'auto',
    padding: 20,
    borderTopWidth: 1,
    borderColor: '#eee',
    marginBottom: 40,
  },

  appVersion: {
    color: '#777',
    marginBottom: 10,
  },

  logoutBtn: {
    backgroundColor: '#FF4D4F',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },

  logoutText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 20
  },

  overlay: {
    position: 'absolute',
    width: screenWidth,
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 5,
  },

  simModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  simModalBox: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 12,
    width: '85%',
    alignItems: 'center',
  },

  simModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10,
  },

  simModalText: {
    color: '#555',
  },

  simModalPhone: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 10,
  },
  simLogoutTimer: {
    marginTop: 10,
    fontSize: 14,
    color: '#FF4D4F',
    fontWeight: '600',
    textAlign: 'center',
  },

  bottomButtonContainer: {
    // marginTop: 'auto',
    marginBottom: 25,
  },

  bottomButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 6,
  },

  bottomButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 20,
  },
  stickyHeader: {
    backgroundColor: '#F5F7FB',
    paddingTop: 10,
    zIndex: 10,
  },
});
