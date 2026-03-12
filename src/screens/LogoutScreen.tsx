import React from 'react';
import {View, Text, Button} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';

import {RootStackParamList} from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Logout'>;

export default function LogoutScreen({navigation}: Props) {

  return (

    <View style={{padding:20}}>

      <Text>You are logged out</Text>

      <Button
        title="Login Again"
        onPress={() => navigation.replace('Login')}
      />

    </View>

  );
}