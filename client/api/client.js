import axios from 'axios';
import { DeviceEventEmitter } from 'react-native';
import { getAccessToken, getRefreshToken, saveTokens, clearTokens } from '../utils/tokenStorage';

const BASE_URL = `${process.env.EXPO_PUBLIC_API_URL}/api`;

const axiosInstance = axios.create({ baseURL: BASE_URL, timeout: 15000 });

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(p => {
    if (error) p.reject(error); else p.resolve(token);
  });
  failedQueue = [];
};

axiosInstance.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, (error) => Promise.reject(error));

axiosInstance.interceptors.response.use(
  res => res,
  async (err) => {
    const originalRequest = err.config;

    // Handle 401 Unauthorized (Token expired)
    if (err.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return axiosInstance(originalRequest);
        }).catch(e => Promise.reject(e));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await getRefreshToken();
        if (!refreshToken) throw new Error('No refresh token');

        console.log('🔄 Session expired. Rotating tokens...');
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });

        // Save BOTH new access and refresh tokens (Rotation)
        await saveTokens(data.accessToken, data.refreshToken);

        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`;
        processQueue(null, data.accessToken);

        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        await clearTokens();
        DeviceEventEmitter.emit('logout');
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(err);
  }
);

export default axiosInstance;