// /controllers/notificationController.js
const { db, FieldValue } = require("../../config/firebase");

// Notification types for medical supplies system
const NOTIFICATION_TYPES = {
  SYSTEM: 'system',
  ORDER_STATUS: 'order_status',
  NEW_ORDER: 'new_order',
  PAYMENT: 'payment',
  REVIEW: 'review',
  INVENTORY: 'inventory',
  ACCOUNT: 'account',
  PROMOTION: 'promotion',
  REMINDER: 'reminder',
  CART_UPDATE: 'cart_update',
};

// Priority levels
const PRIORITY_LEVELS = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent'
};

module.exports = {
  // Create a notification with improved socket handling
  createNotification: async (req, res) => {
    try {
      const { 
        userId, 
        type, 
        message, 
        metadata = {}, 
        priority = PRIORITY_LEVELS.NORMAL,
        actionUrl,
        expiresAt 
      } = req.body;

      if (!userId || !type || !message) {
        return res.status(400).json({ 
          error: "userId, type, and message are required." 
        });
      }

      // Validate notification type
      if (!Object.values(NOTIFICATION_TYPES).includes(type)) {
        return res.status(400).json({ 
          error: "Invalid notification type." 
        });
      }

      const notificationData = {
        userId,
        type,
        message,
        metadata,
        priority,
        actionUrl,
        isRead: false,
        createdAt: FieldValue.serverTimestamp(),
        ...(expiresAt && { expiresAt: new Date(expiresAt) })
      };

      const docRef = await db.collection("notifications").add(notificationData);
      
      // Get the saved notification with server timestamp
      const savedDoc = await docRef.get();
      const savedNotification = { 
        id: docRef.id, 
        ...savedDoc.data(),
        createdAt: savedDoc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
      };

      // Send real-time notification
      if (req.io) {
        try {
          req.io.to(`user_${userId}`).emit("notification", {
            ...savedNotification,
            timestamp: new Date().toISOString()
          });
          
          // Update notification count
          const unreadCount = await module.exports.getUnreadNotificationCount(userId);
          req.io.to(`user_${userId}`).emit("notification_count_update", { 
            count: unreadCount 
          });

          // Send priority notification if urgent
          if (priority === PRIORITY_LEVELS.URGENT) {
            req.io.to(`user_${userId}`).emit("urgent_notification", savedNotification);
          }
            console.log(`user_${userId}`,"urgent_notification", savedNotification);

        } catch (socketError) {
          console.error("Socket emission error:", socketError);
        }
      }

      res.status(200).json({ 
        success: true, 
        notification: savedNotification 
      });
    } catch (error) {
      console.error("Error creating notification:", error);
      res.status(500).json({ error: "Failed to create notification." });
    }
  },

  // Get user's notifications with advanced filtering
  getNotifications: async (req, res) => {
    try {
      const userId = req.user.uid;
      const { 
        limit = 50, 
        lastDoc = null, 
        unreadOnly = false,
        type = null,
        priority = null,
        startDate = null,
        endDate = null
      } = req.query;
      
      let query = db
        .collection("notifications")
        .where("userId", "==", userId);

      // Apply filters
      if (unreadOnly === 'true') {
        query = query.where("isRead", "==", false);
      }

      if (type && Object.values(NOTIFICATION_TYPES).includes(type)) {
        query = query.where("type", "==", type);
      }

      if (priority && Object.values(PRIORITY_LEVELS).includes(priority)) {
        query = query.where("priority", "==", priority);
      }

      // Date range filtering
      if (startDate) {
        query = query.where("createdAt", ">=", new Date(startDate));
      }
      if (endDate) {
        query = query.where("createdAt", "<=", new Date(endDate));
      }

      // Order and limit
      query = query.orderBy("createdAt", "desc").limit(parseInt(limit));

      // Pagination
      if (lastDoc) {
        const lastDocRef = await db.collection("notifications").doc(lastDoc).get();
        if (lastDocRef.exists) {
          query = query.startAfter(lastDocRef);
        }
      }

      const snapshot = await query.get();

      const notifications = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
          expiresAt: data.expiresAt?.toDate?.()?.toISOString() || null,
          readAt: data.readAt?.toDate?.()?.toISOString() || null
        };
      });

      // Filter out expired notifications
      const validNotifications = notifications.filter(notification => {
        if (!notification.expiresAt) return true;
        return new Date(notification.expiresAt) > new Date();
      });

      // Get summary counts
      const [unreadCount, totalCount] = await Promise.all([
        module.exports.getUnreadNotificationCount(userId),
        module.exports.getTotalNotificationCount(userId)
      ]);

      res.status(200).json({ 
        success: true, 
        notifications: validNotifications,
        unreadCount,
        totalCount,
        hasMore: snapshot.docs.length === parseInt(limit),
        filters: {
          type,
          priority,
          unreadOnly,
          startDate,
          endDate
        }
      });
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ error: "Failed to fetch notifications." });
    }
  },

  // Mark notifications as read with socket update
  markAsRead: async (req, res) => {
    try {
      const { notificationIds } = req.body;
      const userId = req.user.uid;

      if (!notificationIds || !Array.isArray(notificationIds)) {
        return res.status(400).json({ 
          error: "notificationIds must be an array." 
        });
      }

      // Verify all notifications belong to the user
      const notificationRefs = notificationIds.map(id => 
        db.collection("notifications").doc(id)
      );
      
      const notificationDocs = await Promise.all(
        notificationRefs.map(ref => ref.get())
      );

      const validNotifications = notificationDocs.filter(doc => 
        doc.exists && doc.data().userId === userId
      );

      if (validNotifications.length === 0) {
        return res.status(400).json({ 
          error: "No valid notifications found." 
        });
      }

      const batch = db.batch();
      validNotifications.forEach(doc => {
        batch.update(doc.ref, { 
          isRead: true, 
          readAt: FieldValue.serverTimestamp() 
        });
      });

      await batch.commit();

      // Update notification count via socket
      if (req.io) {
        try {
          const unreadCount = await module.exports.getUnreadNotificationCount(userId);
          req.io.to(`user_${userId}`).emit("notification_count_update", { 
            count: unreadCount 
          });
          req.io.to(`user_${userId}`).emit("notifications_marked_read", { 
            notificationIds: validNotifications.map(doc => doc.id)
          });
        } catch (socketError) {
          console.error("Socket emission error:", socketError);
        }
      }

      res.status(200).json({ 
        success: true,
        markedCount: validNotifications.length
      });
    } catch (error) {
      console.error("Error marking notifications as read:", error);
      res.status(500).json({ error: "Failed to mark as read." });
    }
  },

  // Mark all notifications as read
  markAllAsRead: async (req, res) => {
    try {
      const userId = req.user.uid;
      const { type = null } = req.body; // Optional: mark all of specific type

      let query = db
        .collection("notifications")
        .where("userId", "==", userId)
        .where("isRead", "==", false);

      if (type && Object.values(NOTIFICATION_TYPES).includes(type)) {
        query = query.where("type", "==", type);
      }

      const unreadSnapshot = await query.get();

      if (unreadSnapshot.empty) {
        return res.status(200).json({ 
          success: true, 
          message: "No unread notifications" 
        });
      }

      const batch = db.batch();
      unreadSnapshot.docs.forEach(doc => {
        batch.update(doc.ref, { 
          isRead: true, 
          readAt: FieldValue.serverTimestamp() 
        });
      });

      await batch.commit();

      // Update notification count via socket
      if (req.io) {
        try {
          const unreadCount = await module.exports.getUnreadNotificationCount(userId);
          req.io.to(`user_${userId}`).emit("notification_count_update", { 
            count: unreadCount 
          });
          req.io.to(`user_${userId}`).emit("all_notifications_marked_read", {
            type: type || 'all',
            count: unreadSnapshot.size
          });
        } catch (socketError) {
          console.error("Socket emission error:", socketError);
        }
      }

      res.status(200).json({ 
        success: true,
        markedCount: unreadSnapshot.size
      });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ error: "Failed to mark all as read." });
    }
  },

  // Get unread notification count with type breakdown
  getUnreadCount: async (req, res) => {
    try {
      const userId = req.user.uid;
      const { breakdown = false } = req.query;

      const totalCount = await module.exports.getUnreadNotificationCount(userId);

      if (breakdown === 'true') {
        // Get count breakdown by type
        const typeBreakdown = {};
        
        for (const type of Object.values(NOTIFICATION_TYPES)) {
          const snapshot = await db
            .collection("notifications")
            .where("userId", "==", userId)
            .where("isRead", "==", false)
            .where("type", "==", type)
            .get();
          
          typeBreakdown[type] = snapshot.size;
        }

        res.status(200).json({ 
          success: true, 
          totalCount,
          breakdown: typeBreakdown
        });
      } else {
        res.status(200).json({ 
          success: true, 
          count: totalCount 
        });
      }
    } catch (error) {
      console.error("Error getting unread count:", error);
      res.status(500).json({ error: "Failed to get unread count." });
    }
  },

  // Delete notification
  deleteNotification: async (req, res) => {
    try {
      const { notificationId } = req.params;
      const userId = req.user.uid;

      // Verify notification belongs to user
      const notificationDoc = await db.collection("notifications").doc(notificationId).get();
      
      if (!notificationDoc.exists) {
        return res.status(404).json({ error: "Notification not found." });
      }

      if (notificationDoc.data().userId !== userId) {
        return res.status(403).json({ error: "Unauthorized." });
      }

      await db.collection("notifications").doc(notificationId).delete();

      // Update count via socket
      if (req.io) {
        try {
          const unreadCount = await module.exports.getUnreadNotificationCount(userId);
          req.io.to(`user_${userId}`).emit("notification_count_update", { 
            count: unreadCount 
          });
          req.io.to(`user_${userId}`).emit("notification_deleted", { 
            notificationId 
          });
        } catch (socketError) {
          console.error("Socket emission error:", socketError);
        }
      }

      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ error: "Failed to delete notification." });
    }
  },

  // Bulk delete notifications
  bulkDeleteNotifications: async (req, res) => {
    try {
      const { notificationIds, deleteAll = false, type = null } = req.body;
      const userId = req.user.uid;

      let notificationsToDelete = [];

      if (deleteAll) {
        // Delete all notifications (optionally filtered by type)
        let query = db
          .collection("notifications")
          .where("userId", "==", userId);

        if (type && Object.values(NOTIFICATION_TYPES).includes(type)) {
          query = query.where("type", "==", type);
        }

        const snapshot = await query.get();
        notificationsToDelete = snapshot.docs;
      } else if (notificationIds && Array.isArray(notificationIds)) {
        // Delete specific notifications
        const notificationRefs = notificationIds.map(id => 
          db.collection("notifications").doc(id)
        );
        
        const notificationDocs = await Promise.all(
          notificationRefs.map(ref => ref.get())
        );

        notificationsToDelete = notificationDocs.filter(doc => 
          doc.exists && doc.data().userId === userId
        );
      } else {
        return res.status(400).json({ 
          error: "Either notificationIds array or deleteAll flag is required." 
        });
      }

      if (notificationsToDelete.length === 0) {
        return res.status(400).json({ 
          error: "No valid notifications found to delete." 
        });
      }

      // Delete in batches (Firestore batch limit is 500)
      const batchSize = 500;
      const batches = [];
      
      for (let i = 0; i < notificationsToDelete.length; i += batchSize) {
        const batch = db.batch();
        const batchDocs = notificationsToDelete.slice(i, i + batchSize);
        
        batchDocs.forEach(doc => {
          batch.delete(doc.ref);
        });
        
        batches.push(batch.commit());
      }

      await Promise.all(batches);

      // Update count via socket
      if (req.io) {
        try {
          const unreadCount = await module.exports.getUnreadNotificationCount(userId);
          req.io.to(`user_${userId}`).emit("notification_count_update", { 
            count: unreadCount 
          });
          req.io.to(`user_${userId}`).emit("notifications_bulk_deleted", { 
            count: notificationsToDelete.length,
            type: type || 'all'
          });
        } catch (socketError) {
          console.error("Socket emission error:", socketError);
        }
      }

      res.status(200).json({ 
        success: true,
        deletedCount: notificationsToDelete.length
      });
    } catch (error) {
      console.error("Error bulk deleting notifications:", error);
      res.status(500).json({ error: "Failed to bulk delete notifications." });
    }
  },

  // Get notification statistics
  getNotificationStats: async (req, res) => {
    try {
      const userId = req.user.uid;
      const { days = 30 } = req.query;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));

      // Get total counts
      const [totalCount, unreadCount] = await Promise.all([
        module.exports.getTotalNotificationCount(userId),
        module.exports.getUnreadNotificationCount(userId)
      ]);

      // Get counts by type in the specified period
      const typeStats = {};
      const priorityStats = {};

      for (const type of Object.values(NOTIFICATION_TYPES)) {
        const snapshot = await db
          .collection("notifications")
          .where("userId", "==", userId)
          .where("type", "==", type)
          .where("createdAt", ">=", startDate)
          .get();
        
        typeStats[type] = snapshot.size;
      }

      for (const priority of Object.values(PRIORITY_LEVELS)) {
        const snapshot = await db
          .collection("notifications")
          .where("userId", "==", userId)
          .where("priority", "==", priority)
          .where("createdAt", ">=", startDate)
          .get();
        
        priorityStats[priority] = snapshot.size;
      }

      // Get daily counts for the period
      const dailyStats = {};
      for (let i = 0; i < parseInt(days); i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayStart = new Date(date.setHours(0, 0, 0, 0));
        const dayEnd = new Date(date.setHours(23, 59, 59, 999));

        const snapshot = await db
          .collection("notifications")
          .where("userId", "==", userId)
          .where("createdAt", ">=", dayStart)
          .where("createdAt", "<=", dayEnd)
          .get();

        const dateKey = dayStart.toISOString().split('T')[0];
        dailyStats[dateKey] = snapshot.size;
      }

      res.status(200).json({
        success: true,
        stats: {
          totalCount,
          unreadCount,
          readCount: totalCount - unreadCount,
          period: {
            days: parseInt(days),
            startDate: startDate.toISOString(),
            endDate: new Date().toISOString()
          },
          byType: typeStats,
          byPriority: priorityStats,
          daily: dailyStats
        }
      });
    } catch (error) {
      console.error("Error getting notification stats:", error);
      res.status(500).json({ error: "Failed to get notification statistics." });
    }
  },

  // Helper method to get unread count
  getUnreadNotificationCount: async (userId) => {
    try {
      const snapshot = await db
        .collection("notifications")
        .where("userId", "==", userId)
        .where("isRead", "==", false)
        .get();
      return snapshot.size;
    } catch (error) {
      console.error("Error getting unread notification count:", error);
      return 0;
    }
  },

  // Helper method to get total count
  getTotalNotificationCount: async (userId) => {
    try {
      const snapshot = await db
        .collection("notifications")
        .where("userId", "==", userId)
        .get();
      return snapshot.size;
    } catch (error) {
      console.error("Error getting total notification count:", error);
      return 0;
    }
  },

  // Clean up expired notifications (can be called by cron job)
  cleanupExpiredNotifications: async (req, res) => {
    try {
      const now = new Date();
      
      const expiredSnapshot = await db
        .collection("notifications")
        .where("expiresAt", "<=", now)
        .get();

      if (expiredSnapshot.empty) {
        return res.status(200).json({ 
          success: true, 
          message: "No expired notifications found",
          deletedCount: 0
        });
      }

      // Delete in batches
      const batchSize = 500;
      const batches = [];
      
      for (let i = 0; i < expiredSnapshot.docs.length; i += batchSize) {
        const batch = db.batch();
        const batchDocs = expiredSnapshot.docs.slice(i, i + batchSize);
        
        batchDocs.forEach(doc => {
          batch.delete(doc.ref);
        });
        
        batches.push(batch.commit());
      }

      await Promise.all(batches);

      res.status(200).json({ 
        success: true,
        deletedCount: expiredSnapshot.docs.length,
        message: `Cleaned up ${expiredSnapshot.docs.length} expired notifications`
      });
    } catch (error) {
      console.error("Error cleaning up expired notifications:", error);
      res.status(500).json({ error: "Failed to cleanup expired notifications." });
    }
  },

  // Export notification types and priorities for use in other modules
  NOTIFICATION_TYPES,
  PRIORITY_LEVELS
};

