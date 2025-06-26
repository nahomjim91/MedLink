// contexts/SocketContext.js
'use client';

import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { useSocket } from '../hooks/useSocket';
import { auth } from '../api/firebase/config';

const SocketContext = createContext();

export const useSocketContext = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocketContext must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const socket = useSocket();
  
  // Chat states
  const [messages, setMessages] = useState([]);
  const [chats, setChats] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Notification states
  const [notifications, setNotifications] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [notificationStats, setNotificationStats] = useState({
    unreadCount: 0,
    totalCount: 0,
    byType: {},
    byPriority: {}
  });

  const chatBackendUrl = 'http://localhost:4001';
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

  // Chat event handlers (existing)
  useEffect(() => {
    if (!socket.socket) return;

    const handleNewMessage = (data) => {
      console.log('📨 New message received:', data);
      
      setMessages(prev => {
        const isCurrentChat = data.message && 
          (data.message.from === data.from || data.message.to === data.from);
        
        if (isCurrentChat) {
          return [...prev, data.message];
        }
        return prev;
      });

      refreshChats();
      updateUnreadCount();
    };

    const handleMessageNotification = (data) => {
      console.log('🔔 Message notification:', data);
      updateUnreadCount();
    };

    const handleMessagesSeen = (data) => {
      console.log('👁️ Messages seen:', data);
      
      setMessages(prev => prev.map(msg => 
        data.messageIds.includes(msg.id) 
          ? { ...msg, isSeen: true, seenBy: data.seenBy }
          : msg
      ));
    };

    const unsubscribeNewMessage = socket.onNewMessage(handleNewMessage);
    const unsubscribeNotification = socket.onMessageNotification(handleMessageNotification);
    const unsubscribeMessagesSeen = socket.onMessagesSeen(handleMessagesSeen);

    return () => {
      unsubscribeNewMessage?.();
      unsubscribeNotification?.();
      unsubscribeMessagesSeen?.();
    };
  }, [socket.socket]);

  // Notification event handlers (new)
  useEffect(() => {
    if (!socket.socket) return;

    const handleNotification = (data) => {
      console.log('🔔 New notification received:', data);
      
      // Add to notifications list (keep only latest 50)
      setNotifications(prev => [data, ...prev].slice(0, 50));
      
      // Update count
      setNotificationCount(prev => prev + 1);
      
      // Show browser notification if permission granted
      if (Notification.permission === 'granted') {
        new Notification(data.message, {
          icon: '/notification-icon.png',
          badge: '/notification-badge.png',
          tag: `notification-${data.id}`,
          requireInteraction: data.priority === 'urgent'
        });
      }

      // Play sound for urgent notifications
      if (data.priority === 'urgent') {
        playNotificationSound();
      }
    };

    const handleNotificationCountUpdate = (data) => {
      console.log('📊 Notification count updated:', data);
      setNotificationCount(data.count);
    };

    const handleUrgentNotification = (data) => {
      console.log('🚨 Urgent notification:', data);
      
      // Show urgent notification banner or modal
      setNotifications(prev => [{ ...data, isUrgent: true }, ...prev].slice(0, 50));
      
      // Play urgent sound
      playUrgentNotificationSound();
      
      // Show browser notification with requireInteraction
      if (Notification.permission === 'granted') {
        new Notification(`🚨 URGENT: ${data.message}`, {
          icon: '/urgent-icon.png',
          requireInteraction: true,
          tag: `urgent-${data.id}`
        });
      }
    };

    const handleEmergencyNotification = (data) => {
      console.log('🆘 Emergency notification:', data);
      
      // Handle emergency notifications
      setNotifications(prev => [{ ...data, isEmergency: true }, ...prev].slice(0, 50));
      
      // Show emergency alert
      alert(`EMERGENCY: ${data.message}`);
    };

    const handleNotificationsMarkedRead = (data) => {
      console.log('✅ Notifications marked as read:', data);
      
      setNotifications(prev => prev.map(notif => 
        data.notificationIds.includes(notif.id) 
          ? { ...notif, isRead: true, readAt: new Date().toISOString() }
          : notif
      ));
    };

    const handleAllNotificationsMarkedRead = (data) => {
      console.log('✅ All notifications marked as read:', data);
      
      setNotifications(prev => prev.map(notif => 
        data.type === 'all' || notif.type === data.type
          ? { ...notif, isRead: true, readAt: new Date().toISOString() }
          : notif
      ));
    };

    const handleNotificationDeleted = (data) => {
      console.log('🗑️ Notification deleted:', data);
      
      setNotifications(prev => prev.filter(notif => notif.id !== data.notificationId));
    };

    const handleNotificationsBulkDeleted = (data) => {
      console.log('🗑️ Notifications bulk deleted:', data);
      
      // Refresh notifications list
      fetchNotifications();
    };

    // Subscribe to notification events
    const unsubscribeNotification = socket.onNotification?.(handleNotification);
    const unsubscribeCountUpdate = socket.onNotificationCountUpdate?.(handleNotificationCountUpdate);
    const unsubscribeUrgent = socket.onUrgentNotification?.(handleUrgentNotification);
    const unsubscribeEmergency = socket.onEmergencyNotification?.(handleEmergencyNotification);
    const unsubscribeMarkedRead = socket.onNotificationsMarkedRead?.(handleNotificationsMarkedRead);
    const unsubscribeAllMarkedRead = socket.onAllNotificationsMarkedRead?.(handleAllNotificationsMarkedRead);
    const unsubscribeDeleted = socket.onNotificationDeleted?.(handleNotificationDeleted);
    const unsubscribeBulkDeleted = socket.onNotificationsBulkDeleted?.(handleNotificationsBulkDeleted);

    return () => {
      unsubscribeNotification?.();
      unsubscribeCountUpdate?.();
      unsubscribeUrgent?.();
      unsubscribeEmergency?.();
      unsubscribeMarkedRead?.();
      unsubscribeAllMarkedRead?.();
      unsubscribeDeleted?.();
      unsubscribeBulkDeleted?.();
    };
  }, [socket.socket]);

  // Sound functions
  const playNotificationSound = () => {
    try {
      const audio = new Audio('/sounds/notification.mp3');
      audio.volume = 0.3;
      audio.play().catch(e => console.log('Cannot play notification sound:', e));
    } catch (error) {
      console.log('Notification sound not available');
    }
  };

  const playUrgentNotificationSound = () => {
    try {
      const audio = new Audio('/sounds/urgent.mp3');
      audio.volume = 0.5;
      audio.play().catch(e => console.log('Cannot play urgent sound:', e));
    } catch (error) {
      console.log('Urgent sound not available');
    }
  };

  // Chat API functions (existing)
  const sendMessage = async (chatId, textContent, messageProductId, messageOrderId) => {
    try {
      const response = await fetch(`${chatBackendUrl}/api/chat/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ textContent, messageProductId, messageOrderId, to: chatId }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const result = await response.json();
      
      socket.sendMessage(chatId, result.message);
      setMessages(prev => [...prev, result.message]);
      
      return result.message;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  const fetchMessages = async (chatId, limit = 20, before = null) => {
    try {
      const params = new URLSearchParams({ 
        chatId, 
        limit: limit.toString() 
      });
      
      if (before) params.append('before', before);

      const response = await fetch(`${chatBackendUrl}/api/chat/messages?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  };

  const loadMessages = async (chatId, replace = true) => {
    try {
      const newMessages = await fetchMessages(chatId);
      
      if (replace) {
        setMessages(newMessages);
      } else {
        setMessages(prev => [...newMessages, ...prev]);
      }
      
      return newMessages;
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const refreshChats = async () => {
    try {
      const response = await fetch(`${chatBackendUrl}/api/chat/chats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch chats');
      }

      const result = await response.json();
      setChats(result.data || []);
    } catch (error) {
      console.error('Error fetching chats:', error);
    }
  };

  const updateUnreadCount = async () => {
    try {
      const response = await fetch(`${chatBackendUrl}/api/chat/unread-count`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch unread count');
      }

      const result = await response.json();
      setUnreadCount(result.data || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const markMessagesAsSeen = async (chatId) => {
    try {
      const response = await fetch(`${chatBackendUrl}/api/chat/mark-seen`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ chatId }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark messages as seen');
      }

      setMessages(prev => prev.map(msg => 
        msg.from === chatId ? { ...msg, isSeen: true } : msg
      ));

      const unseenMessageIds = messages
        .filter(msg => msg.from === chatId && !msg.isSeen)
        .map(msg => msg.id);
      
      if (unseenMessageIds.length > 0) {
        socket.markMessagesSeen(chatId, unseenMessageIds);
      }

      updateUnreadCount();
    } catch (error) {
      console.error('Error marking messages as seen:', error);
    }
  };

  // Notification API functions (new)
  const fetchNotifications = async (options = {}) => {
    try {
      const {
        limit = 50,
        lastDoc = null,
        unreadOnly = false,
        type = null,
        priority = null,
        startDate = null,
        endDate = null
      } = options;

      const params = new URLSearchParams({
        limit: limit.toString(),
        unreadOnly: unreadOnly.toString()
      });

      if (lastDoc) params.append('lastDoc', lastDoc);
      if (type) params.append('type', type);
      if (priority) params.append('priority', priority);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(`${chatBackendUrl}/api/notifications?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return { notifications: [], unreadCount: 0, totalCount: 0 };
    }
  };

  const loadNotifications = async (options = {}, replace = true) => {
    try {
      const result = await fetchNotifications(options);
      
      if (replace) {
        setNotifications(result.notifications || []);
      } else {
        setNotifications(prev => [...prev, ...(result.notifications || [])]);
      }

      setNotificationStats({
        unreadCount: result.unreadCount || 0,
        totalCount: result.totalCount || 0,
        byType: result.byType || {},
        byPriority: result.byPriority || {}
      });

      setNotificationCount(result.unreadCount || 0);
      
      return result;
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const markNotificationsAsRead = async (notificationIds) => {
    try {
      const response = await fetch(`${chatBackendUrl}/api/notifications/mark-read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ notificationIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark notifications as read');
      }

      // Update local state
      setNotifications(prev => prev.map(notif => 
        notificationIds.includes(notif.id) 
          ? { ...notif, isRead: true, readAt: new Date().toISOString() }
          : notif
      ));

      // Update count
      const newCount = Math.max(0, notificationCount - notificationIds.length);
      setNotificationCount(newCount);

      // Emit to socket
      socket.markNotificationsRead?.(notificationIds);

      return true;
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      throw error;
    }
  };

  const markAllNotificationsAsRead = async (type = null) => {
    try {
      const response = await fetch(`${chatBackendUrl}/api/notifications/mark-all-read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ type }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }

      // Update local state
      setNotifications(prev => prev.map(notif => 
        !type || notif.type === type
          ? { ...notif, isRead: true, readAt: new Date().toISOString() }
          : notif
      ));

      setNotificationCount(0);
      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const response = await fetch(`${chatBackendUrl}/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete notification');
      }

      // Update local state
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      
      // Update count if notification was unread
      const deletedNotif = notifications.find(n => n.id === notificationId);
      if (deletedNotif && !deletedNotif.isRead) {
        setNotificationCount(prev => Math.max(0, prev - 1));
      }

      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  };

  const getNotificationStats = async (days = 30) => {
    try {
      const response = await fetch(`${chatBackendUrl}/api/notifications/stats?days=${days}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notification stats');
      }

      const result = await response.json();
      setNotificationStats(result.stats);
      return result.stats;
    } catch (error) {
      console.error('Error fetching notification stats:', error);
      return null;
    }
  };

  // Request notification permission
  const requestNotificationPermission = async () => {
    try {
      if (!('Notification' in window)) {
        console.log('This browser does not support notifications');
        return false;
      }

      if (Notification.permission === 'granted') {
        return true;
      }

      if (Notification.permission === 'denied') {
        console.log('Notification permission denied');
        return false;
      }

      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  const joinChatRoom = useCallback((chatId) => {
    socket.joinChat(chatId);
    loadMessages(chatId);
  }, [socket]);

  const leaveChatRoom = useCallback((chatId) => {
    socket.leaveChat(chatId);
  }, [socket]);

  // Subscribe to notifications when connected
  const subscribeToNotifications = useCallback(() => {
    if (socket.socket) {
      socket.subscribeNotifications?.();
    }
  }, [socket]);

  // Initialize when connected
  useEffect(() => {
    if (socket.isConnected && token) {
      // Initialize chat
      refreshChats();
      updateUnreadCount();
      
      // Initialize notifications
      loadNotifications();
      subscribeToNotifications();
      
      // Request notification permission
      requestNotificationPermission();
    }
  }, [socket.isConnected, token]);

  const value = {
    // Socket state
    ...socket,
    
    // Chat data
    messages,
    chats,
    unreadCount,
    
    // Notification data
    notifications,
    notificationCount,
    notificationStats,
    
    // Chat functions
    sendMessage,
    loadMessages,
    refreshChats,
    updateUnreadCount,
    markMessagesAsSeen,
    joinChatRoom,
    leaveChatRoom,
    
    // Notification functions
    fetchNotifications,
    loadNotifications,
    markNotificationsAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    getNotificationStats,
    requestNotificationPermission,
    subscribeToNotifications,
    
    // State setters
    setMessages,
    setChats,
    setUnreadCount,
    setNotifications,
    setNotificationCount,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
