
// hooks/useAppointmentChat.js
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { io } from "socket.io-client";
import { auth } from "../api/firebase/config";

export const useAppointmentChat = () => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [chatAccess, setChatAccess] = useState({ allowed: false, reason: '' });
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [appointment, setAppointment] = useState(null);
  
  // Extension states
  const [extensionRequested, setExtensionRequested] = useState(false);
  const [extensionRequestSent, setExtensionRequestSent] = useState(false);
  const [extensionConfirmed, setExtensionConfirmed] = useState(false);
  
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const [token, setToken] = useState(null);
  const typingTimeoutRef = useRef(null);

  // Get the current user token
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        user
          .getIdToken()
          .then((token) => {
            setToken(token);
          })
          .catch((error) => {
            console.error("Error getting token:", error);
            setToken(null);
          });
      } else {
        setToken(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Initialize socket connection to telehealth server
  const initSocket = useCallback(() => {
    if (!token) {
      console.log("Socket: No token available, skipping connection");
      return;
    }

    // Disconnect existing socket if any
    if (socket) {
      socket.disconnect();
    }

    console.log("Establishing telehealth chat connection...");

    const newSocket = io("http://localhost:4002", { // Telehealth server port
      reconnection: true,
      reconnectionDelayMax: 10000,
      reconnectionDelay: 1000,
      timeout: 10000,
      auth: {
        token: token,
      },
      extraHeaders: {
        authorization: `Bearer ${token}`,
      },
    });

    // Connection event handlers
    newSocket.on("connect", () => {
      console.log("✅ Connected to telehealth chat server");
      setIsConnected(true);
      reconnectAttempts.current = 0;
    });

    newSocket.on("disconnect", (reason) => {
      console.log("❌ Disconnected from telehealth chat server:", reason);
      setIsConnected(false);
      setTypingUsers(new Set());
    });

    newSocket.on("connect_error", (error) => {
      console.error("Telehealth chat connection error:", error);
      setIsConnected(false);

      reconnectAttempts.current++;
      if (reconnectAttempts.current >= maxReconnectAttempts) {
        console.error("Max reconnection attempts reached");
        newSocket.disconnect();
      }
    });

    // Chat access control
    newSocket.on("chatAccess", (data) => {
      console.log("📋 Chat access update:", data);
      setChatAccess({
        allowed: data.allowed,
        reason: data.reason
      });
      
      if (data.appointment) {
        setAppointment(data.appointment);
      }
    });

    // Message handlers
    newSocket.on("newMessage", (message) => {
      console.log("📨 New message received:", message);
      setMessages((prev) => [...prev, message]);
    });

    // Typing indicators
    newSocket.on("typing", ({ userId }) => {
      console.log("⌨️ User typing:", userId);
      setTypingUsers((prev) => new Set([...prev, userId]));
    });

    newSocket.on("stopTyping", ({ userId }) => {
      console.log("⌨️ User stopped typing:", userId);
      setTypingUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    });

    // Extension request handlers
    newSocket.on("extensionRequested", ({ requesterId, appointmentId }) => {
      console.log("⏰ Extension requested by:", requesterId);
      setExtensionRequested(true);
      
      // Show notification or modal for extension request
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification("Extension Request", {
          body: "The other party has requested to extend this appointment by 30 minutes.",
          icon: '/appointment-icon.png',
          tag: `extension-${appointmentId}`,
          requireInteraction: true
        });
      }
    });

    newSocket.on("extensionRequestSent", ({ message }) => {
      console.log("📤 Extension request sent:", message);
      setExtensionRequestSent(true);
    });

    newSocket.on("extensionConfirmed", ({ message, newEndTime }) => {
      console.log("✅ Extension confirmed:", message);
      setExtensionConfirmed(true);
      setExtensionRequested(false);
      setExtensionRequestSent(false);
      
      // Update appointment end time
      if (appointment) {
        setAppointment(prev => ({
          ...prev,
          scheduledEndTime: newEndTime
        }));
      }
      
      // Show success notification
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification("Extension Approved", {
          body: message,
          icon: '/success-icon.png',
          tag: 'extension-confirmed'
        });
      }
    });

    newSocket.on("extensionError", ({ message }) => {
      console.error("❌ Extension error:", message);
      // Reset extension states
      setExtensionRequested(false);
      setExtensionRequestSent(false);
      
      // Show error notification
      if (typeof window !== 'undefined') {
        alert(`Extension Error: ${message}`);
      }
    });

    // Error handling
    newSocket.on("error", ({ message }) => {
      console.error("❌ Chat error:", message);
      
      if (typeof window !== 'undefined') {
        alert(`Chat Error: ${message}`);
      }
    });

    setSocket(newSocket);
    return newSocket;
  }, [token, socket, appointment]);

  // Initialize socket when token changes
  useEffect(() => {
    if (token) {
      initSocket();
    } else {
      // Disconnect when no token
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
        setMessages([]);
        setCurrentRoom(null);
        setChatAccess({ allowed: false, reason: '' });
        setTypingUsers(new Set());
        setAppointment(null);
        setExtensionRequested(false);
        setExtensionRequestSent(false);
        setExtensionConfirmed(false);
      }
    }

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [token]);

  // Join appointment chat room
  const joinAppointmentRoom = useCallback(
    (appointmentId) => {
      if (socket && isConnected) {
        console.log("🚪 Joining appointment room:", appointmentId);
        socket.emit("joinAppointmentRoom", appointmentId);
        setCurrentRoom(appointmentId);
        setMessages([]); // Clear previous messages
        
        // Reset extension states when joining new room
        setExtensionRequested(false);
        setExtensionRequestSent(false);
        setExtensionConfirmed(false);
      }
    },
    [socket, isConnected]
  );

  // Send message
  const sendMessage = useCallback(
    (appointmentId, textContent) => {
      if (socket && isConnected && chatAccess.allowed) {
        console.log("📤 Sending message:", { appointmentId, textContent });
        socket.emit("sendMessage", { appointmentId, textContent });
      } else {
        console.warn("Cannot send message - not connected or no chat access");
      }
    },
    [socket, isConnected, chatAccess.allowed]
  );

  // Typing indicators
  const startTyping = useCallback(
    (appointmentId) => {
      if (socket && isConnected && chatAccess.allowed) {
        socket.emit("typing", { appointmentId });
      }
    },
    [socket, isConnected, chatAccess.allowed]
  );

  const stopTyping = useCallback(
    (appointmentId) => {
      if (socket && isConnected && chatAccess.allowed) {
        socket.emit("stopTyping", { appointmentId });
      }
    },
    [socket, isConnected, chatAccess.allowed]
  );

  // Handle typing with auto-stop
  const handleTyping = useCallback(
    (appointmentId) => {
      startTyping(appointmentId);
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set new timeout to stop typing after 3 seconds
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping(appointmentId);
      }, 3000);
    },
    [startTyping, stopTyping]
  );

  // Extension functions
  const requestExtension = useCallback(
    (appointmentId) => {
      if (socket && isConnected && chatAccess.allowed) {
        console.log("⏰ Requesting extension for appointment:", appointmentId);
        socket.emit("requestExtension", { appointmentId });
      }
    },
    [socket, isConnected, chatAccess.allowed]
  );

  const acceptExtension = useCallback(
    (appointmentId) => {
      if (socket && isConnected && chatAccess.allowed) {
        console.log("✅ Accepting extension for appointment:", appointmentId);
        socket.emit("acceptExtension", { appointmentId });
      }
    },
    [socket, isConnected, chatAccess.allowed]
  );

  const declineExtension = useCallback(
    (appointmentId) => {
      // Just reset the extension request state
      setExtensionRequested(false);
      console.log("❌ Extension request declined");
    },
    []
  );

  // Leave appointment room
  const leaveAppointmentRoom = useCallback(() => {
    if (currentRoom) {
      console.log("🚪 Leaving appointment room:", currentRoom);
      setCurrentRoom(null);
      setMessages([]);
      setChatAccess({ allowed: false, reason: '' });
      setAppointment(null);
      setExtensionRequested(false);
      setExtensionRequestSent(false);
      setExtensionConfirmed(false);
    }
  }, [currentRoom]);

  // Connection functions
  const disconnect = useCallback(() => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
      setMessages([]);
      setCurrentRoom(null);
      setChatAccess({ allowed: false, reason: '' });
      setTypingUsers(new Set());
      setAppointment(null);
      setExtensionRequested(false);
      setExtensionRequestSent(false);
      setExtensionConfirmed(false);
    }
  }, [socket]);

  const reconnect = useCallback(() => {
    if (token) {
      reconnectAttempts.current = 0;
      initSocket();
    }
  }, [token, initSocket]);

  // Cleanup typing timeout
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Utility functions
  const isTypingUsersEmpty = typingUsers.size === 0;
  const getTypingUsersList = Array.from(typingUsers);

  return {
    // Socket state
    socket,
    isConnected,
    
    // Chat state
    messages,
    currentRoom,
    chatAccess,
    appointment,
    
    // Typing state
    typingUsers,
    isTypingUsersEmpty,
    getTypingUsersList,
    
    // Extension state
    extensionRequested,
    extensionRequestSent,
    extensionConfirmed,
    
    // Chat functions
    joinAppointmentRoom,
    leaveAppointmentRoom,
    sendMessage,
    
    
    // Typing functions
    startTyping,
    stopTyping,
    handleTyping,
    
    // Extension functions
    
    requestExtension,
    acceptExtension,
    declineExtension,
    
    // Connection functions
    disconnect,
    reconnect,
    
    // State setters (for manual control if needed)
    setMessages,
    setChatAccess,
    setAppointment,
  };
};