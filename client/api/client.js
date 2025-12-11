import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({
  baseURL: 'http://192.168.0.216:3000/api',
  timeout: 10000,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers['Content-Type'] = 'application/json';
  
  // ✅ ADD DEBUGGING
  // console.log('🔵 [REQUEST]', config.method?.toUpperCase(), config.url);
  // console.log('📦 Data:', config.data);
  // console.log('🔐 Token:', token ? 'Present' : 'Missing');
  
  return config;
}, (error) => {
  console.error('❌ [REQUEST ERROR]', error.message);
  return Promise.reject(error);
});

api.interceptors.response.use(
  (response) => {
    // ✅ ADD DEBUGGING
    // console.log('🟢 [RESPONSE]', response.status, response.config.url);
    // console.log('📦 Response Data:', response.data);
    return response;
  },
  (error) => {
    // ✅ ADD DEBUGGING
    console.error('🔴 [RESPONSE ERROR]', error.response?.status || error.message);
    console.error('Error Details:', error.response?.data);
    
    if (error.response?.status === 401) {
      AsyncStorage.removeItem('authToken');
    }
    return Promise.reject(error);
  }
);

export default api;
