import axios from 'axios';

const API = 'https://your-api.com';

export const sendOTP = async (phone: string) => {
  return axios.post(`${API}/send-otp`, { phone });
};

export const verifyOTP = async (phone: string, otp: string) => {
  return axios.post(`${API}/verify-otp`, { phone, otp });
};