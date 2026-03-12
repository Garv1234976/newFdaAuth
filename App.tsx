import React from 'react';
import { StatusBar, useColorScheme, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>

      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={isDarkMode ? '#000000' : '#ffffff'}
      />

      <View style={{flex:1, backgroundColor: isDarkMode ? '#000' : '#fff'}}>

        <AuthProvider>

  <NavigationContainer>
    <AppNavigator />
  </NavigationContainer>

</AuthProvider>

      </View>

    </SafeAreaProvider>
  );
}

export default App;