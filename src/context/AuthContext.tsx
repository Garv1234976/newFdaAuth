import React, {createContext, useState, useEffect, ReactNode} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type OtpTypes = {
  [key: string]: string;
};

type User = {
  phone: string;
  userId: string;
  password: string;
  apiUserId: string;
  logoUrl?: string;
  otpTypes?: OtpTypes;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (data: User) => Promise<void>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {}
});

export const AuthProvider = ({children}:{children:ReactNode}) => {

  const [user,setUser] = useState<User | null>(null);
  const [loading,setLoading] = useState(true);

  useEffect(()=>{
    loadUser();
  },[]);

  const loadUser = async () => {

    try{

      const stored = await AsyncStorage.getItem('USER_LOGIN');

      if(stored){
        setUser(JSON.parse(stored));
      }

    }catch(err){
      console.log('Auth Load Error',err);
    }

    setLoading(false);

  };

  const login = async (data:User) => {

    try{

      await AsyncStorage.setItem('USER_LOGIN',JSON.stringify(data));
      setUser(data);

    }catch(err){

      console.log('Login Save Error',err);

    }

  };

  const logout = async () => {

    try{

      await AsyncStorage.removeItem('USER_LOGIN');
      setUser(null);

    }catch(err){

      console.log('Logout Error',err);

    }

  };

  return(
    <AuthContext.Provider value={{user,loading,login,logout}}>
      {children}
    </AuthContext.Provider>
  );

};