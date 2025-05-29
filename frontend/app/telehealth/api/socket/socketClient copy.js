// app/telehealth/api/socket/socketClient.js
import { io } from 'socket.io-client';
import { useEffect, useState } from 'react';

let socket;
let socketInitPromise = null;

export const initializeSocket = async (token) => {
  // Return existing promise if already initializing
  if (socketInitPromise) return socketInitPromise;
  
  // Return existing socket if already connected
  if (socket && socket.connected) return socket;

  // Create initialization promise
  socketInitPromise = new Promise((resolve, reject) => {
    try {
      socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4001', {
        auth: { token },
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000 // Add timeout
      });

      // On successful connection
      socket.on('connect', () => {
        console.log('Socket connected successfully');
        resolve(socket);
      });

      // On connection error
      socket.on('connect_error', (err) => {
        console.error('Socket connection error:', err);
        reject(err);
      });
      
      // On general error
      socket.on('error', (err) => {
        console.error('Socket error:', err);
      });
      
    } catch (err) {
      console.error('Socket initialization error:', err);
      socketInitPromise = null;
      reject(err);
    }
  });

  try {
    return await socketInitPromise;
  } catch (err) {
    socketInitPromise = null;
    throw err;
  }
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    socketInitPromise = null;
    console.log('Socket disconnected');
  }
};

export const useSocketStatus = () => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!socket) return;

    const onConnect = () => {
      console.log('Socket connected');
      setIsConnected(true);
    };

    const onDisconnect = () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    // Set initial state
    setIsConnected(socket.connected);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  return isConnected;
};

export const getSocket = () => socket;