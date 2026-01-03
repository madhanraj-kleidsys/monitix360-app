import { useEffect, useState, useCallback } from 'react';
import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Ensure this matches your backend IP and port
// const SOCKET_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.0.216:3000';
const SOCKET_URL = 'http://192.168.0.216:3000';

let socketInstance = null;
let isInitializing = false;
const listeners = new Set();

const updateListeners = () => {
  listeners.forEach(fn => fn(socketInstance));
};

export const useWebSocket = () => {
  const [socket, setSocket] = useState(socketInstance);
  const [isConnected, setIsConnected] = useState(socketInstance?.connected || false);

  useEffect(() => {
    const handleInstanceUpdate = (instance) => {
      setSocket(instance);
      if (instance) {
        setIsConnected(instance.connected);

        const onConnect = () => {
          console.log('✅ Socket connected:', instance.id);
          setIsConnected(true);
        };
        const onDisconnect = (reason) => {
          console.log('❌ Socket disconnected:', reason);
          setIsConnected(false);
        };
        const onConnectError = (err) => {
          console.error('⚠️ Socket connection error:', err.message);
        };

        instance.on('connect', onConnect);
        instance.on('disconnect', onDisconnect);
        instance.on('connect_error', onConnectError);

        return () => {
          instance.off('connect', onConnect);
          instance.off('disconnect', onDisconnect);
          instance.off('connect_error', onConnectError);
        };
      }
    };

    listeners.add(handleInstanceUpdate);

    // If already initialized, trigger update immediately
    if (socketInstance) {
      handleInstanceUpdate(socketInstance);
    }

    const initializeSocket = async () => {
      if (!socketInstance && !isInitializing) {
        isInitializing = true;
        try {
          // CONSISTENCY: LoginScreen saves 'accessToken', so we use that.
          const token = await AsyncStorage.getItem('accessToken') || await AsyncStorage.getItem('authToken');
          console.log('🔌 Initializing socket with token:', token ? 'Present' : 'Missing');

          socketInstance = io(SOCKET_URL, {
            auth: { token },
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 10,
          });

          updateListeners();
        } catch (error) {
          console.error('Failed to initialize socket:', error);
          isInitializing = false;
        }
      }
    };

    initializeSocket();

    return () => {
      listeners.delete(handleInstanceUpdate);
    };
  }, []);

  const emit = useCallback((event, data) => {
    if (socketInstance && socketInstance.connected) {
      socketInstance.emit(event, data);
    } else {
      console.warn(`⚠️ Cannot emit ${event}, socket not connected`);
    }
  }, []);

  const on = useCallback((event, callback) => {
    if (socketInstance) {
      socketInstance.on(event, callback);
    }
  }, []);

  const off = useCallback((event, callback) => {
    if (socketInstance) {
      socketInstance.off(event, callback);
    }
  }, []);

  return { socket, isConnected, emit, on, off };
};
