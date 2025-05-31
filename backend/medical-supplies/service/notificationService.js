// //service/notificationService.js
const { db, FieldValue } = require("../../config/firebase");

class NotificationService {
  constructor(io) {
    this.io = io;
  }

  // Base method to create and emit notifications
  async createNotification(
    userId,
    type,
    message,
    metadata = {},
    priority = "normal"
  ) {
    try {
      const notification = {
        userId,
        type,
        message,
        metadata,
        priority,
        isRead: false,
        createdAt: FieldValue.serverTimestamp(),
        source: "system",
      };

      const docRef = await db.collection("notifications").add(notification);
      const savedDoc = await docRef.get();

      const savedNotification = {
        id: docRef.id,
        ...savedDoc.data(),
        createdAt:
          savedDoc.data().createdAt?.toDate?.()?.toISOString() ||
          new Date().toISOString(),
      };

      // Emit to user
      if (this.io) {
        this.io.to(`user_${userId}`).emit("notification", savedNotification);

        // Update count
        const unreadCount = await this.getUnreadCount(userId);
        this.io
          .to(`user_${userId}`)
          .emit("notification_count_update", { count: unreadCount });

        // Send urgent notification if priority is urgent
        if (priority === "urgent") {
          this.io
            .to(`user_${userId}`)
            .emit("urgent_notification", savedNotification);
        }
      }

      return savedNotification;
    } catch (error) {
      console.error("Error creating notification:", error);
      throw error;
    }
  }

  // Order status notifications
  async notifyOrderStatus(userId, orderId, status, orderDetails = {}) {
    const statusMessages = {
      pending: "Your order has been received and is being processed",
      confirmed: "Your order has been confirmed by the supplier",
      processing: "Your order is being prepared for shipment",
      shipped: "Your order has been shipped and is on the way",
      out_for_delivery: "Your order is out for delivery",
      delivered: "Your order has been delivered successfully",
      cancelled: "Your order has been cancelled",
      refunded: "Your order has been refunded",
    };

    const statusPriority = {
      pending: "normal",
      confirmed: "normal",
      processing: "normal",
      shipped: "high",
      out_for_delivery: "high",
      delivered: "high",
      cancelled: "urgent",
      refunded: "high",
    };

    return await this.createNotification(
      userId,
      "order_status",
      statusMessages[status] || `Order status updated to ${status}`,
      {
        orderId,
        status,
        orderDetails,
        actionUrl: `/orders/${orderId}`,
        trackingNumber: orderDetails.trackingNumber,
        estimatedDelivery: orderDetails.estimatedDelivery,
      },
      statusPriority[status] || "normal"
    );
  }

  // New order notifications for suppliers
  async notifyNewOrder(supplierId, orderId, customerInfo, orderDetails) {
    const { customerName, customerId } = customerInfo;
    const { items, totalAmount, urgentOrder } = orderDetails;

    return await this.createNotification(
      supplierId,
      "new_order",
      `New order received from ${customerName}`,
      {
        orderId,
        customerId,
        customerName,
        items,
        totalAmount,
        actionUrl: `/orders/${orderId}`,
        urgentOrder,
      },
      urgentOrder || totalAmount > 1000 ? "urgent" : "high"
    );
  }

  // Payment notifications
  async notifyPaymentStatus(userId, paymentId, status, amount, orderId = null) {
    const statusMessages = {
      success: `Payment of $${amount} completed successfully`,
      failed: `Payment of $${amount} failed`,
      pending: `Payment of $${amount} is being processed`,
      refunded: `Refund of $${amount} processed`,
    };

    const statusPriority = {
      success: "normal",
      failed: "urgent",
      pending: "normal",
      refunded: "high",
    };

    return await this.createNotification(
      userId,
      "payment",
      statusMessages[status] || `Payment status: ${status}`,
      {
        paymentId,
        status,
        amount,
        orderId,
        actionUrl: orderId ? `/orders/${orderId}` : `/payments/${paymentId}`,
      },
      statusPriority[status] || "normal"
    );
  }

  // Review notifications
  async notifyNewReview(supplierId, reviewData) {
    const {
      customerId,
      customerName,
      rating,
      productName,
      productId,
      reviewId,
    } = reviewData;

    const ratingText =
      rating >= 4 ? "positive" : rating >= 3 ? "neutral" : "negative";
    const priority = rating >= 4 ? "normal" : rating <= 2 ? "high" : "normal";

    return await this.createNotification(
      supplierId,
      "review",
      `New ${rating}-star review from ${customerName} for ${productName}`,
      {
        customerId,
        customerName,
        rating,
        productName,
        productId,
        reviewId,
        ratingText,
        actionUrl: `/reviews/${reviewId}`,
      },
      priority
    );
  }

  // Inventory notifications
  async notifyLowInventory(supplierId, productData) {
    const { productId, productName, currentStock, minimumStock } = productData;

    const priority =
      currentStock === 0
        ? "urgent"
        : currentStock <= minimumStock * 0.5
        ? "high"
        : "normal";
    const message =
      currentStock === 0
        ? `${productName} is out of stock`
        : `${productName} is running low (${currentStock} remaining)`;

    return await this.createNotification(
      supplierId,
      "inventory",
      message,
      {
        productId,
        productName,
        currentStock,
        minimumStock,
        actionUrl: `/inventory/${productId}`,
      },
      priority
    );
  }

  // System notifications
  async notifySystemUpdate(userId, updateType, message, metadata = {}) {
    const priorities = {
      maintenance: "high",
      feature: "normal",
      security: "urgent",
      policy: "normal",
    };

    return await this.createNotification(
      userId,
      "system",
      message,
      {
        updateType,
        ...metadata,
        actionUrl: metadata.actionUrl || "/updates",
      },
      priorities[updateType] || "normal"
    );
  }

  // Account notifications
  async notifyAccountActivity(userId, activityType, details = {}) {
    const activities = {
      login: "New login detected from a different device",
      password_change: "Your password has been changed successfully",
      email_change: "Your email address has been updated",
      profile_update: "Your profile has been updated",
      subscription_change: "Your subscription has been updated",
      verification: "Your account has been verified",
    };

    const priorities = {
      login: "normal",
      password_change: "high",
      email_change: "high",
      profile_update: "normal",
      subscription_change: "normal",
      verification: "normal",
    };

    return await this.createNotification(
      userId,
      "account",
      activities[activityType] || `Account activity: ${activityType}`,
      {
        activityType,
        ...details,
        actionUrl: "/account/security",
      },
      priorities[activityType] || "normal"
    );
  }

  // Promotion notifications
  async notifyPromotion(userId, promotionData) {
    const { title, description, discountPercent, validUntil, code } =
      promotionData;

    return await this.createNotification(
      userId,
      "promotion",
      title || `Special offer: ${discountPercent}% discount available`,
      {
        description,
        discountPercent,
        validUntil,
        code,
        actionUrl: "/",
        expiresAt: validUntil,
      },
      "normal"
    );
  }

  // Bulk notifications (for system-wide announcements)
  async sendBulkNotification(
    userIds,
    type,
    message,
    metadata = {},
    priority = "normal"
  ) {
    const notifications = [];
    const batchSize = 500; // Firestore batch limit

    try {
      // Create notifications in batches
      for (let i = 0; i < userIds.length; i += batchSize) {
        const batch = db.batch();
        const batchUserIds = userIds.slice(i, i + batchSize);

        for (const userId of batchUserIds) {
          const notificationRef = db.collection("notifications").doc();
          const notification = {
            userId,
            type,
            message,
            metadata,
            priority,
            isRead: false,
            createdAt: FieldValue.serverTimestamp(),
            source: "system",
          };

          batch.set(notificationRef, notification);
          notifications.push({
            id: notificationRef.id,
            userId,
            ...notification,
          });
        }

        await batch.commit();
      }

      // Emit to all users via socket
      if (this.io) {
        for (const notification of notifications) {
          this.io.to(`user_${notification.userId}`).emit("notification", {
            ...notification,
            createdAt: new Date().toISOString(),
          });

          // Update counts
          const unreadCount = await this.getUnreadCount(notification.userId);
          this.io
            .to(`user_${notification.userId}`)
            .emit("notification_count_update", {
              count: unreadCount,
            });
        }
      }

      return notifications;
    } catch (error) {
      console.error("Error sending bulk notifications:", error);
      throw error;
    }
  }

  // Reminder notifications
  async scheduleReminder(
    userId,
    reminderType,
    message,
    scheduleTime,
    metadata = {}
  ) {
    // This would typically integrate with a job scheduler like Bull or Agenda
    // For now, we'll create the notification with a future timestamp

    return await this.createNotification(
      userId,
      "reminder",
      message,
      {
        reminderType,
        scheduledFor: scheduleTime,
        ...metadata,
      },
      "normal"
    );
  }

  // Helper method to get unread count
  async getUnreadCount(userId) {
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
  }

  // Send notification to multiple users based on role
  async notifyByRole(role, type, message, metadata = {}, priority = "normal") {
    try {
      // Get users by role (this would depend on your user role system)
      const usersSnapshot = await db
        .collection("users")
        .where("role", "==", role)
        .get();

      const userIds = usersSnapshot.docs.map((doc) => doc.id);

      return await this.sendBulkNotification(
        userIds,
        type,
        message,
        metadata,
        priority
      );
    } catch (error) {
      console.error("Error notifying by role:", error);
      throw error;
    }
  }

  // Emergency notification (highest priority)
  async sendEmergencyNotification(userIds, message, metadata = {}) {
    const notifications = await this.sendBulkNotification(
      userIds,
      "system",
      message,
      { emergency: true, ...metadata },
      "urgent"
    );

    // Send additional urgent signals
    if (this.io) {
      for (const userId of userIds) {
        this.io.to(`user_${userId}`).emit("emergency_notification", {
          message,
          metadata,
          timestamp: new Date().toISOString(),
        });
      }
    }

    return notifications;
  }

  // Cart notifications
  async notifyCartUpdate(userId, action, productName, metadata = {}) {
    const messages = {
      added: `${productName} added to your cart`,
      updated: `Cart item ${productName} updated`,
      removed: `${productName} removed from cart`,
      cleared: "Your cart has been cleared",
    };

    return await this.createNotification(
      userId,
      "cart_update",
      messages[action] || `Cart ${action}`,
      {
        ...metadata,
        actionUrl: "/cart",
      },
      "normal"
    );
  }

  // Low stock warning when adding to cart
  async notifyLowStockWarning(userId, productName, remainingStock) {
    return await this.createNotification(
      userId,
      "inventory_warning",
      `Limited stock: Only ${remainingStock} ${productName} remaining`,
      {
        productName,
        remainingStock,
        actionUrl: "/cart",
      },
      "high"
    );
  }
}

// Factory function to create service instance
const createNotificationService = (io) => {
  return new NotificationService(io);
};

module.exports = {
  NotificationService,
  createNotificationService,
};
