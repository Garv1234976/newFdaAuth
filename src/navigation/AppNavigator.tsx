import React, { useContext } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import LogoutScreen from '../screens/LogoutScreen';
import OtpRequestScreen from '../screens/OtpRequestScreen';

import { AuthContext } from '../context/AuthContext';

export type RootStackParamList = {
  Login: undefined;
  OTP: { phone: string };
  Dashboard: undefined;
  Logout: undefined;
  OTPRequest: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {

  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return null;
  }

  return (

    <Stack.Navigator screenOptions={{ headerShown: false }}>

      {user ? (

        <>
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
          <Stack.Screen name="OTPRequest" component={OtpRequestScreen} />
          <Stack.Screen name="Logout" component={LogoutScreen} />
        </>

      ) : (

        <Stack.Screen name="Login" component={LoginScreen} />

      )}

    </Stack.Navigator>

  );

};

export default AppNavigator;