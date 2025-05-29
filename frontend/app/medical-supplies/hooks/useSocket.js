// hooks/useSocket.js
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { io } from "socket.io-client";
import { auth } from "../api/firebase/config";
export const useSocket = () => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState(new Map());
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const [token, setToken] = useState(null);
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
  });

  // Initialize socket connection
  const initSocket = useCallback(() => {
    if (!token) {
      console.log("Socket: No token available, skipping connection");
      return;
    }

    // Disconnect existing socket if any
    if (socket) {
      socket.disconnect();
    }

    console.log("Establishing socket connection...");

    const newSocket = io( "http://localhost:4001",
      {
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
      }
    );

    // Connection event handlers
    newSocket.on("connect", () => {
      console.log("✅ Connected to socket server");
      setIsConnected(true);
      reconnectAttempts.current = 0;
    });

    newSocket.on("disconnect", (reason) => {
      console.log("❌ Disconnected from socket server:", reason);
      setIsConnected(false);
      setOnlineUsers([]);
      setTypingUsers(new Map());
    });

    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      setIsConnected(false);

      reconnectAttempts.current++;
      if (reconnectAttempts.current >= maxReconnectAttempts) {
        console.error("Max reconnection attempts reached");
        newSocket.disconnect();
      }
    });

    // Online status handlers
    newSocket.on("online_users", (users) => {
      setOnlineUsers(users);
    });

    newSocket.on("user_online", ({ userId }) => {
      setOnlineUsers((prev) => [...new Set([...prev, userId])]);
    });

    newSocket.on("user_offline", ({ userId }) => {
      setOnlineUsers((prev) => prev.filter((id) => id !== userId));
    });

    // Typing indicators
    newSocket.on("user_typing", ({ userId, isTyping }) => {
      setTypingUsers((prev) => {
        const newMap = new Map(prev);
        if (isTyping) {
          newMap.set(userId, Date.now());
        } else {
          newMap.delete(userId);
        }
        return newMap;
      });
    });

    setSocket(newSocket);
    return newSocket;
  }, [token, socket]);

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
        setOnlineUsers([]);
        setTypingUsers(new Map());
      }
    }

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [token]);

  // Clean up typing indicators periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTypingUsers((prev) => {
        const newMap = new Map();
        for (const [userId, timestamp] of prev.entries()) {
          // Remove typing indicator after 5 seconds of inactivity
          if (now - timestamp < 5000) {
            newMap.set(userId, timestamp);
          }
        }
        return newMap;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Socket utility functions
  const joinChat = useCallback(
    (chatId) => {
      if (socket && isConnected) {
        socket.emit("join_chat", { chatId });
      }
    },
    [socket, isConnected]
  );

  const leaveChat = useCallback(
    (chatId) => {
      if (socket && isConnected) {
        socket.emit("leave_chat", { chatId });
      }
    },
    [socket, isConnected]
  );

  const sendMessage = useCallback(
    (chatId, message) => {
      if (socket && isConnected) {
        socket.emit("message_sent", { chatId, message });
      }
    },
    [socket, isConnected]
  );

  const markMessagesSeen = useCallback(
    (chatId, messageIds) => {
      if (socket && isConnected) {
        socket.emit("message_seen", { chatId, messageIds });
      }
    },
    [socket, isConnected]
  );

  const startTyping = useCallback(
    (chatId) => {
      if (socket && isConnected) {
        socket.emit("typing_start", { chatId });
      }
    },
    [socket, isConnected]
  );

  const stopTyping = useCallback(
    (chatId) => {
      if (socket && isConnected) {
        socket.emit("typing_stop", { chatId });
      }
    },
    [socket, isConnected]
  );

  const disconnect = useCallback(() => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
      setOnlineUsers([]);
      setTypingUsers(new Map());
    }
  }, [socket]);

  const reconnect = useCallback(() => {
    if (token) {
      reconnectAttempts.current = 0;
      initSocket();
    }
  }, [token, initSocket]);

  // Subscribe to specific events
  const onNewMessage = useCallback(
    (callback) => {
      if (socket) {
        socket.on("new_message", callback);
        return () => socket.off("new_message", callback);
      }
    },
    [socket]
  );

  const onMessagesSeen = useCallback(
    (callback) => {
      if (socket) {
        socket.on("messages_seen", callback);
        return () => socket.off("messages_seen", callback);
      }
    },
    [socket]
  );

  const onMessageNotification = useCallback(
    (callback) => {
      if (socket) {
        socket.on("message_notification", callback);
        return () => socket.off("message_notification", callback);
      }
    },
    [socket]
  );

  const isUserOnline = useCallback(
    (userId) => {
      return onlineUsers.includes(userId);
    },
    [onlineUsers]
  );

  const isUserTyping = useCallback(
    (userId) => {
      return typingUsers.has(userId);
    },
    [typingUsers]
  );

  return {
    socket,
    isConnected,
    onlineUsers,

    // Chat functions
    joinChat,
    leaveChat,
    sendMessage,
    markMessagesSeen,

    // Typing functions
    startTyping,
    stopTyping,
    isUserTyping,

    // Status functions
    isUserOnline,

    // Connection functions
    disconnect,
    reconnect,

    // Event subscriptions
    onNewMessage,
    onMessagesSeen,
    onMessageNotification,
  };
};
