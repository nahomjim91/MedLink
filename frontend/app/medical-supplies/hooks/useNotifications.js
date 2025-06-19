import { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useMSAuth } from '../../../hooks/useMSAuth'; // Your auth hook
import { auth } from '../api/firebase/config';

export const useNotifications = () => {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useMSAuth();
const [token, setToken] = useState('');

  // Get the token from Firebase auth
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        user.getIdToken().then((idToken) => {
          setToken(idToken);
        }).catch((error) => {
          console.error('Error getting token:', error);
        });
      } else {
        setToken('');
      }
    });
    return () => unsubscribe();
  })


  // Initialize socket connection
  useEffect(() => {
    if (!user || !token) return;

    const newSocket = io(process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4001', {
      auth: {
        token: token
      },
      transports: ['websocket']
    });

    newSocket.on('connect', () => {
      console.log('Connected to notification socket');
      setIsConnected(true);
      
      // Subscribe to notifications
      newSocket.emit('subscribe_notifications');
      
      // Get initial notification count
      newSocket.emit('get_notification_count');
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from notification socket');
      setIsConnected(false);
    });

    // Listen for new notifications
    newSocket.on('notification', (notification) => {
      setNotifications(prev => [notification, ...prev]);
      
      // Show browser notification if permission granted
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.message, {
          icon: '/favicon.ico',
          tag: notification.id
        });
      }
    });

    // Listen for notification count updates
    newSocket.on('notification_count_update', ({ count }) => {
      setUnreadCount(count);
    });

    // Listen for urgent notifications
    newSocket.on('urgent_notification', (notification) => {
      // Handle urgent notifications differently (e.g., modal, sound)
      console.log('Urgent notification:', notification);
      
      // You could trigger a modal or sound here
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`URGENT: ${notification.message}`, {
          icon: '/favicon.ico',
          tag: `urgent-${notification.id}`,
          requireInteraction: true
        });
      }
    });

    // Listen for bulk updates
    newSocket.on('notifications_marked_read', ({ notificationIds }) => {
      setNotifications(prev => prev.map(notif => 
        notificationIds.includes(notif.id) 
          ? { ...notif, isRead: true }
          : notif
      ));
    });

    newSocket.on('notification_deleted', ({ notificationId }) => {
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [user, token]);

  // Request browser notification permission
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }, []);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async (options = {}) => {
    try {
      const params = new URLSearchParams({
        limit: options.limit || 50,
        unreadOnly: options.unreadOnly || false,
        ...options
      });

      const response = await fetch(`/api/notifications?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
        return data;
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [token]);

  // Mark notifications as read
  const markAsRead = useCallback(async (notificationIds) => {
    try {
      const response = await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ notificationIds })
      });

      if (response.ok) {
        // Update local state
        setNotifications(prev => prev.map(notif => 
          notificationIds.includes(notif.id) 
            ? { ...notif, isRead: true }
            : notif
        ));

        // Also emit via socket for real-time update
        if (socket) {
          socket.emit('mark_notifications_read', { notificationIds });
        }
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  }, [token, socket]);

  // Mark all as read
  const markAllAsRead = useCallback(async (type = null) => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ type })
      });

      if (response.ok) {
        setNotifications(prev => prev.map(notif => 
          !type || notif.type === type 
            ? { ...notif, isRead: true }
            : notif
        ));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [token]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, [token]);

  return {
    notifications,
    unreadCount,
    isConnected,
    socket,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    requestNotificationPermission
  };
};
