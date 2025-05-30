// hooks/useNotifications.js
"use client";

import { useState, useCallback, useEffect } from "react";
import { auth } from "../api/firebase/config";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001";

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get auth token
  const getAuthToken = useCallback(async () => {
    const user = auth.currentUser;
    if (user) {
      return await user.getIdToken();
    }
    throw new Error("User not authenticated");
  }, []);

  // Fetch user's notifications from API
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/notification/`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success) {
        setNotifications(data.notifications);
      } else {
        throw new Error(data.error || "Failed to fetch notifications");
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [getAuthToken]);

  // Create a notification via API
  const createNotification = useCallback(async (userId, type, message, metadata = {}) => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/notification/create`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          type,
          message,
          metadata,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create notification: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success) {
        // Add to local state if it's for the current user
        const currentUser = auth.currentUser;
        if (currentUser && userId === currentUser.uid) {
          setNotifications(prev => [data.notification, ...prev]);
        }
        return data.notification;
      } else {
        throw new Error(data.error || "Failed to create notification");
      }
    } catch (err) {
      console.error("Error creating notification:", err);
      setError(err.message);
      throw err;
    }
  }, [getAuthToken]);

  // Mark notifications as read via API
  const markAsRead = useCallback(async (notificationIds) => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/notification/mark-read`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notificationIds: Array.isArray(notificationIds) ? notificationIds : [notificationIds],
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to mark notifications as read: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success) {
        // Update local state
        setNotifications(prev =>
          prev.map(notif =>
            notificationIds.includes(notif.id)
              ? { ...notif, isRead: true }
              : notif
          )
        );
      } else {
        throw new Error(data.error || "Failed to mark notifications as read");
      }
    } catch (err) {
      console.error("Error marking notifications as read:", err);
      setError(err.message);
      throw err;
    }
  }, [getAuthToken]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    const unreadIds = notifications
      .filter(notif => !notif.isRead)
      .map(notif => notif.id);
    
    if (unreadIds.length > 0) {
      await markAsRead(unreadIds);
    }
  }, [notifications, markAsRead]);

  // Get unread count
  const getUnreadCount = useCallback(() => {
    return notifications.filter(notif => !notif.isRead).length;
  }, [notifications]);

  // Get notifications by type
  const getNotificationsByType = useCallback((type) => {
    return notifications.filter(notif => notif.type === type);
  }, [notifications]);

  // Remove notification from local state (for UI purposes)
  const removeNotification = useCallback((notificationId) => {
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
  }, []);

  // Clear all notifications from local state
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Auto-fetch notifications on mount
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchNotifications();
      } else {
        setNotifications([]);
        setError(null);
      }
    });

    return () => unsubscribe();
  }, [fetchNotifications]);

  return {
    notifications,
    loading,
    error,
    
    // API operations
    fetchNotifications,
    createNotification,
    markAsRead,
    markAllAsRead,
    
    // Utility functions
    getUnreadCount,
    getNotificationsByType,
    removeNotification,
    clearAllNotifications,
    
    // Refresh function
    refresh: fetchNotifications,
  };
};