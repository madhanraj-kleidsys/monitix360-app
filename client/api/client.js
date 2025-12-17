import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter, Alert, Platform } from 'react-native';

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
  async (err) => {
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

      console.log('🔄 Access token expired. Attempting refresh...');
      isRefreshing = true;
      const refreshToken = await AsyncStorage.getItem('refreshToken');

      if (!refreshToken) {
        console.log('❌ No refresh token found in storage. Logging out.');
        isRefreshing = false;
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'userData']);
        DeviceEventEmitter.emit('logout');

        return Promise.reject(err);
      }

      try {
        console.log('📤 Sending refresh request...');
        // ✅ FIX: Endpoint must match server route (/api/auth/refresh)
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        console.log('✅ Refresh successful. New access token received.');
        console.log(data.accessToken);
        console.log(data);

        await AsyncStorage.setItem('accessToken', data.accessToken);
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`;
        processQueue(null, data.accessToken);

        // 🔁 Update the header for the *original* failed request before retrying
        originalRequest.headers['Authorization'] = `Bearer ${data.accessToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshErr) {
        // console.error('❌ Refresh failed:', refreshErr.message);
        processQueue(refreshErr, null);
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'userData']);
        DeviceEventEmitter.emit('logout');

        // Show alert only once


        // Return a specific error object or suppress further error handling if possible
        return Promise.reject(new Error('SESSION_EXPIRED'));
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(err);
  }
);

export default axiosInstance;