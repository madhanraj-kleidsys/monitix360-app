import { useEffect, useCallback, useRef } from 'react';
import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SOCKET_URL = 'http://192.168.0.216:3000';

export const useWebSocket = () => {
  const socketRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 5;

  // Initialize socket connection
  useEffect(() => {
    const connectSocket = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        
        socketRef.current = io(SOCKET_URL, {
          auth: {
            token: token,
          },
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
          transports: ['websocket', 'polling'],
        });

        // Connection events
        socketRef.current.on('connect', () => {
          console.log('✅ WebSocket Connected:', socketRef.current.id);
          reconnectAttempts.current = 0;
        });

        socketRef.current.on('disconnect', (reason) => {
          console.log('❌ WebSocket Disconnected:', reason);
        });

        socketRef.current.on('connect_error', (error) => {
          console.error('❌ WebSocket Error:', error);
          reconnectAttempts.current++;
        });

      } catch (error) {
        console.error('Failed to connect WebSocket:', error);
      }
    };

    connectSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Emit event
  const emit = useCallback((event, data) => {
    if (socketRef.current) {
      socketRef.current.emit(event, data);
    }
  }, []);

  // Listen to event
  const on = useCallback((event, callback) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  }, []);

  // Stop listening to event
  const off = useCallback((event, callback) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback);
    }
  }, []);

  return {
    socket: socketRef.current,
    emit,
    on,
    off,
  };
};
