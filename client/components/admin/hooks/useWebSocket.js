import { useEffect, useRef, useState, useCallback } from 'react';
import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

// REPLACE WITH YOUR ACTUAL MACHINE IP IF DIFFERENT
const SOCKET_URL = 'http://192.168.0.216:3000';

export const useWebSocket = () => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let socket;

    const connectSocket = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');

        socket = io(SOCKET_URL, {
          auth: { token },
          transports: ['websocket'], // Force websocket
          reconnection: true,
          reconnectionAttempts: 10,
        });

        socketRef.current = socket;

        socket.on('connect', () => {
          console.log('✅ Socket.IO Connected:', socket.id);
          setIsConnected(true);
        });

        socket.on('disconnect', (reason) => {
          console.log('❌ Socket.IO Disconnected:', reason);
          setIsConnected(false);
        });

        socket.on('connect_error', (err) => {
          console.error('⚠️ Socket.IO Connection Error:', err.message);
        });

      } catch (error) {
        console.error('Failed to initialize socket:', error);
      }
    };

    connectSocket();

    return () => {
      if (socket) {
        socket.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  const emit = useCallback((event, data) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn('⚠️ Cannot emit, socket not connected');
    }
  }, []);

  const on = useCallback((event, callback) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  }, []);

  const off = useCallback((event, callback) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback);
    }
  }, []);

  return { socket: socketRef.current, isConnected, emit, on, off };
};
