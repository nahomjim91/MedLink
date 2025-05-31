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
  
  // Notification states
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);
  
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
  }, []);

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

    const newSocket = io("http://localhost:4001", {
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
      console.log("✅ Connected to socket server");
      setIsConnected(true);
      reconnectAttempts.current = 0;
      
      // Subscribe to notifications on connect
      newSocket.emit("subscribe_notifications");
      newSocket.emit("get_notification_count");
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

    // Enhanced notification handlers
    newSocket.on("notification", (notification) => {
      console.log("📩 New notification received:", notification);
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
      
      // Show browser notification if permission granted
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.message, {
          icon: '/favicon.ico',
          tag: notification.id,
        });
      }
    });

    newSocket.on("notification_count_update", ({ count }) => {
      console.log("📊 Notification count updated:", count);
      setNotificationCount(count);
      setUnreadCount(count);
    });

    newSocket.on("urgent_notification", (notification) => {
      console.log("🚨 Urgent notification received:", notification);
      setNotifications((prev) => [{ ...notification, isUrgent: true }, ...prev]);
      
      // Show urgent browser notification
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(`🚨 URGENT: ${notification.message}`, {
          icon: '/urgent-icon.png',
          requireInteraction: true,
          tag: `urgent-${notification.id}`
        });
      }
    });

    newSocket.on("emergency_notification", (notification) => {
      console.log("🆘 Emergency notification received:", notification);
      setNotifications((prev) => [{ ...notification, isEmergency: true }, ...prev]);
      
      // Show emergency alert
      if (typeof window !== 'undefined') {
        alert(`EMERGENCY: ${notification.message}`);
      }
    });

    newSocket.on("notifications_marked_read", ({ notificationIds }) => {
      console.log("✅ Notifications marked as read:", notificationIds);
      setNotifications((prev) => prev.map(notif => 
        notificationIds.includes(notif.id) 
          ? { ...notif, isRead: true, readAt: new Date().toISOString() }
          : notif
      ));
    });

    newSocket.on("all_notifications_marked_read", ({ type }) => {
      console.log("✅ All notifications marked as read:", type);
      setNotifications((prev) => prev.map(notif => 
        !type || notif.type === type
          ? { ...notif, isRead: true, readAt: new Date().toISOString() }
          : notif
      ));
    });

    newSocket.on("notification_deleted", ({ notificationId }) => {
      console.log("🗑️ Notification deleted:", notificationId);
      setNotifications((prev) => prev.filter(notif => notif.id !== notificationId));
    });

    newSocket.on("notifications_bulk_deleted", (data) => {
      console.log("🗑️ Notifications bulk deleted:", data);
      // You might want to refetch notifications here or update based on the data
    });

    newSocket.on("notification_error", ({ message }) => {
      console.error("❌ Notification error:", message);
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
        setNotifications([]);
        setUnreadCount(0);
        setNotificationCount(0);
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

  // Chat utility functions
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

  // Enhanced notification functions
  const subscribeNotifications = useCallback(() => {
    if (socket && isConnected) {
      socket.emit("subscribe_notifications");
    }
  }, [socket, isConnected]);

  const getNotificationCount = useCallback(() => {
    if (socket && isConnected) {
      socket.emit("get_notification_count");
    }
  }, [socket, isConnected]);

  const markNotificationsRead = useCallback(
    (notificationIds) => {
      if (socket && isConnected) {
        socket.emit("mark_notifications_read", { notificationIds });
      }
    },
    [socket, isConnected]
  );

  const markAllNotificationsRead = useCallback(
    (type = null) => {
      if (socket && isConnected) {
        socket.emit("mark_all_notifications_read", { type });
      }
    },
    [socket, isConnected]
  );

  const notificationInteracted = useCallback(
    (notificationId, action) => {
      if (socket && isConnected) {
        socket.emit("notification_interacted", { notificationId, action });
      }
    },
    [socket, isConnected]
  );

  const sendNotification = useCallback(
    (userId, type, message, metadata = {}) => {
      if (socket && isConnected) {
        socket.emit("send_notification", {
          userId,
          type,
          message,
          metadata,
        });
      }
    },
    [socket, isConnected]
  );

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
    setNotificationCount(0);
  }, []);

  const markNotificationAsRead = useCallback((notificationId) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === notificationId ? { ...notif, isRead: true } : notif
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    setNotificationCount((prev) => Math.max(0, prev - 1));
  }, []);

  const disconnect = useCallback(() => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
      setOnlineUsers([]);
      setTypingUsers(new Map());
      setNotifications([]);
      setUnreadCount(0);
      setNotificationCount(0);
    }
  }, [socket]);

  const reconnect = useCallback(() => {
    if (token) {
      reconnectAttempts.current = 0;
      initSocket();
    }
  }, [token, initSocket]);

  // Chat event subscriptions
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

  // Enhanced notification event subscriptions
  const onNotification = useCallback(
    (callback) => {
      if (socket) {
        socket.on("notification", callback);
        return () => socket.off("notification", callback);
      }
    },
    [socket]
  );

  const onNotificationCountUpdate = useCallback(
    (callback) => {
      if (socket) {
        socket.on("notification_count_update", callback);
        return () => socket.off("notification_count_update", callback);
      }
    },
    [socket]
  );

  const onUrgentNotification = useCallback(
    (callback) => {
      if (socket) {
        socket.on("urgent_notification", callback);
        return () => socket.off("urgent_notification", callback);
      }
    },
    [socket]
  );

  const onEmergencyNotification = useCallback(
    (callback) => {
      if (socket) {
        socket.on("emergency_notification", callback);
        return () => socket.off("emergency_notification", callback);
      }
    },
    [socket]
  );

  const onNotificationsMarkedRead = useCallback(
    (callback) => {
      if (socket) {
        socket.on("notifications_marked_read", callback);
        return () => socket.off("notifications_marked_read", callback);
      }
    },
    [socket]
  );

  const onAllNotificationsMarkedRead = useCallback(
    (callback) => {
      if (socket) {
        socket.on("all_notifications_marked_read", callback);
        return () => socket.off("all_notifications_marked_read", callback);
      }
    },
    [socket]
  );

  const onNotificationDeleted = useCallback(
    (callback) => {
      if (socket) {
        socket.on("notification_deleted", callback);
        return () => socket.off("notification_deleted", callback);
      }
    },
    [socket]
  );

  const onNotificationsBulkDeleted = useCallback(
    (callback) => {
      if (socket) {
        socket.on("notifications_bulk_deleted", callback);
        return () => socket.off("notifications_bulk_deleted", callback);
      }
    },
    [socket]
  );

  const onNotificationError = useCallback(
    (callback) => {
      if (socket) {
        socket.on("notification_error", callback);
        return () => socket.off("notification_error", callback);
      }
    },
    [socket]
  );

  // Utility functions
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

    // Enhanced notification functions and state
    notifications,
    unreadCount,
    notificationCount,
    subscribeNotifications,
    getNotificationCount,
    markNotificationsRead,
    markAllNotificationsRead,
    notificationInteracted,
    sendNotification,
    clearNotifications,
    markNotificationAsRead,

    // Connection functions
    disconnect,
    reconnect,

    // Chat event subscriptions
    onNewMessage,
    onMessagesSeen,
    onMessageNotification,

    // Enhanced notification event subscriptions
    onNotification,
    onNotificationCountUpdate,
    onUrgentNotification,
    onEmergencyNotification,
    onNotificationsMarkedRead,
    onAllNotificationsMarkedRead,
    onNotificationDeleted,
    onNotificationsBulkDeleted,
    onNotificationError,
  };
};

