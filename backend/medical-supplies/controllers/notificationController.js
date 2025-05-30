// Enhanced notification controller with better socket integration
const { db, FieldValue } = require("../../config/firebase");
// Enhanced Socket.IO notification handling
const enhancedSocketNotificationHandling = (io, socket, userId) => {
  
  // Client requests notification count
  socket.on('get_notification_count', async () => {
    try {
      const snapshot = await db
        .collection("notifications")
        .where("userId", "==", userId)
        .where("isRead", "==", false)
        .get();
      
      socket.emit('notification_count_update', { count: snapshot.size });
    } catch (error) {
      console.error('Error getting notification count:', error);
      socket.emit('notification_error', { message: 'Failed to get notification count' });
    }
  });

  // Client subscribes to notification updates
  socket.on('subscribe_notifications', () => {
    socket.join(`notifications_${userId}`);
    console.log(`User ${userId} subscribed to notifications`);
  });

  // Client unsubscribes from notification updates
  socket.on('unsubscribe_notifications', () => {
    socket.leave(`notifications_${userId}`);
    console.log(`User ${userId} unsubscribed from notifications`);
  });

  // Handle notification interaction (like click/view)
  socket.on('notification_interacted', async (data) => {
    const { notificationId, action } = data;
    
    try {
      // You can track notification interactions here
      await db.collection("notifications").doc(notificationId).update({
        [`interactions.${action}`]: FieldValue.serverTimestamp()
      });
      
      console.log(`Notification ${notificationId} ${action} by user ${userId}`);
    } catch (error) {
      console.error('Error tracking notification interaction:', error);
    }
  });

  // Enhanced send_notification handler
  socket.on('send_notification', async (data) => {
    const { targetUserId, type, message, metadata = {} } = data;
    
    if (!targetUserId || !type || !message) {
      socket.emit('notification_error', { 
        message: 'targetUserId, type, and message are required' 
      });
      return;
    }

    try {
      const notification = {
        userId: targetUserId,
        senderId: userId, // Track who sent it
        type,
        message,
        metadata,
        isRead: false,
        createdAt: FieldValue.serverTimestamp(),
      };

      // Save to Firestore
      const docRef = await db.collection('notifications').add(notification);
      
      // Get the saved notification
      const savedDoc = await docRef.get();
      const savedNotification = {
        id: docRef.id,
        ...savedDoc.data(),
        createdAt: savedDoc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
      };

      // Emit to target user's room
      io.to(`user_${targetUserId}`).emit('notification', savedNotification);
      
      // Update notification count
      const unreadCount = await getUnreadNotificationCount(targetUserId);
      io.to(`user_${targetUserId}`).emit('notification_count_update', { 
        count: unreadCount 
      });

      // Confirm to sender
      socket.emit('notification_sent', { 
        success: true, 
        notificationId: docRef.id 
      });

    } catch (error) {
      console.error('Error sending notification:', error);
      socket.emit('notification_error', { 
        message: 'Failed to send notification' 
      });
    }
  });
};

// Helper function for unread count (for socket use)
const getUnreadNotificationCount = async (userId) => {
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
};



module.exports = {
  // Create a notification with improved socket handling
  createNotification: async (req, res) => {
    try {
      const { userId, type, message, metadata = {} } = req.body;

      if (!userId || !type || !message) {
        return res.status(400).json({ error: "userId, type, and message are required." });
      }

      const notificationData = {
        userId,
        type,
        message,
        metadata,
        isRead: false,
        createdAt: FieldValue.serverTimestamp(),
      };

      const docRef = await db.collection("notifications").add(notificationData);
      
      // Get the saved notification with server timestamp
      const savedDoc = await docRef.get();
      const savedNotification = { 
        id: docRef.id, 
        ...savedDoc.data(),
        createdAt: savedDoc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
      };

      // Send real-time notification with better error handling
      if (req.io) {
        try {
          req.io.to(`user_${userId}`).emit("notification", {
            ...savedNotification,
            timestamp: new Date().toISOString()
          });
          
          // Optional: Send notification count update
          const unreadCount = await this.getUnreadNotificationCount(userId);
          req.io.to(`user_${userId}`).emit("notification_count_update", { 
            count: unreadCount 
          });
        } catch (socketError) {
          console.error("Socket emission error:", socketError);
          // Don't fail the request if socket fails
        }
      }

      res.status(200).json({ success: true, notification: savedNotification });
    } catch (error) {
      console.error("Error creating notification:", error);
      res.status(500).json({ error: "Failed to create notification." });
    }
  },

  // Get user's recent notifications with pagination
  getNotifications: async (req, res) => {
    try {
      const userId = req.user.uid;
      const { limit = 50, lastDoc = null, unreadOnly = false } = req.query;
      
      let query = db
        .collection("notifications")
        .where("userId", "==", userId)
        .orderBy("createdAt", "desc")
        .limit(parseInt(limit));

      if (unreadOnly === 'true') {
        query = query.where("isRead", "==", false);
      }

      if (lastDoc) {
        const lastDocRef = await db.collection("notifications").doc(lastDoc).get();
        query = query.startAfter(lastDocRef);
      }

      const snapshot = await query.get();

      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null
      }));

      // Get unread count
      const unreadCount = await this.getUnreadNotificationCount(userId);

      res.status(200).json({ 
        success: true, 
        notifications,
        unreadCount,
        hasMore: snapshot.docs.length === parseInt(limit)
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
        return res.status(400).json({ error: "notificationIds must be an array." });
      }

      const batch = db.batch();
      notificationIds.forEach(id => {
        const ref = db.collection("notifications").doc(id);
        batch.update(ref, { 
          isRead: true, 
          readAt: FieldValue.serverTimestamp() 
        });
      });

      await batch.commit();

      // Update notification count via socket
      if (req.io) {
        try {
          const unreadCount = await this.getUnreadNotificationCount(userId);
          req.io.to(`user_${userId}`).emit("notification_count_update", { 
            count: unreadCount 
          });
          req.io.to(`user_${userId}`).emit("notifications_marked_read", { 
            notificationIds 
          });
        } catch (socketError) {
          console.error("Socket emission error:", socketError);
        }
      }

      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error marking notifications as read:", error);
      res.status(500).json({ error: "Failed to mark as read." });
    }
  },

  // Mark all notifications as read
  markAllAsRead: async (req, res) => {
    try {
      const userId = req.user.uid;

      const unreadSnapshot = await db
        .collection("notifications")
        .where("userId", "==", userId)
        .where("isRead", "==", false)
        .get();

      if (unreadSnapshot.empty) {
        return res.status(200).json({ success: true, message: "No unread notifications" });
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
          req.io.to(`user_${userId}`).emit("notification_count_update", { 
            count: 0 
          });
          req.io.to(`user_${userId}`).emit("all_notifications_marked_read");
        } catch (socketError) {
          console.error("Socket emission error:", socketError);
        }
      }

      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ error: "Failed to mark all as read." });
    }
  },

  // Get unread notification count
  getUnreadCount: async (req, res) => {
    try {
      const userId = req.user.uid;
      const count = await this.getUnreadNotificationCount(userId);
      res.status(200).json({ success: true, count });
    } catch (error) {
      console.error("Error getting unread count:", error);
      res.status(500).json({ error: "Failed to get unread count." });
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
          const unreadCount = await this.getUnreadNotificationCount(userId);
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
  enhancedSocketNotificationHandling
};

