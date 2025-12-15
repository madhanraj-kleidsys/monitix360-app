// import axios from 'axios';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// const api = axios.create({
//   baseURL: 'http://192.168.0.216:3000/api',
//   timeout: 10000,
// });

// api.interceptors.request.use(async (config) => {
//   const token = await AsyncStorage.getItem('authToken');
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   config.headers['Content-Type'] = 'application/json';

//   // ✅ ADD DEBUGGING
//   // console.log('🔵 [REQUEST]', config.method?.toUpperCase(), config.url);
//   // console.log('📦 Data:', config.data);
//   // console.log('🔐 Token:', token ? 'Present' : 'Missing');

//   return config;
// }, (error) => {
//   console.error('❌ [REQUEST ERROR]', error.message);
//   return Promise.reject(error);
// });

// api.interceptors.response.use(
//   (response) => {
//     // ✅ ADD DEBUGGING
//     // console.log('🟢 [RESPONSE]', response.status, response.config.url);
//     // console.log('📦 Response Data:', response.data);
//     return response;
//   },
//   (error) => {
//     // ✅ ADD DEBUGGING
//     console.error('🔴 [RESPONSE ERROR]', error.response?.status || error.message);
//     console.error('Error Details:', error.response?.data);

//     if (error.response?.status === 401) {
//       AsyncStorage.removeItem('authToken');
//     }
//     return Promise.reject(error);
//   }
// );

// export default api;


import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter, Alert,Platform } from 'react-native';

const BASE_URL = 'http://192.168.0.216:3000/api';

const axiosInstance = axios.create({ baseURL: BASE_URL, timeout: 10000 });

let isRefreshing = false;   // prevents multiple parallel refreshes
let failedQueue = [];       // stores failed requests while refreshing

const processQueue = (error, token = null) => {
  failedQueue.forEach(p => {
    if (error) p.reject(error); else p.resolve(token);
  });
  failedQueue = [];
};

axiosInstance.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

axiosInstance.interceptors.response.use(
  res => res,
  async (err) => {  // ✅ Removed extra 'async' - was causing syntax error
    const originalRequest = err.config;
    if (err.response?.status === 403 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return axiosInstance(originalRequest);
        }).catch(e => Promise.reject(e));
      }

      isRefreshing = true;
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (!refreshToken) {
        isRefreshing = false;
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'userData']);
        DeviceEventEmitter.emit('logout');
        setTimeout(() => {
          Alert.alert('Session expired', 'Please log in again.');
        },100);
        return Promise.reject(err);
      }

      try {
        const { data } = await axios.post(`${BASE_URL}/refresh`, { refreshToken });
        await AsyncStorage.setItem('accessToken', data.accessToken);
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`;
        processQueue(null, data.accessToken);
        return axiosInstance(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'userData']);
        DeviceEventEmitter.emit('logout');
        setTimeout(() => {
          Alert.alert('Session expired', 'Please log in again.');
        },100);
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(err);
  }
);

export default axiosInstance;