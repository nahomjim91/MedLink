// /medical-supplies/server.js
const express = require("express");
const http = require("http");
const cors = require("cors");
const dotenv = require("dotenv");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { Server } = require("socket.io");
const setupApolloServer = require("./graphql");
const { authMiddleware } = require("./middleware/auth");
const paymentRoutes = require("./route/payment");
const chatController = require("./controllers/chatController");
const notificationController = require("./controllers/notificationController");
const cron = require("node-cron");

// models
const OrderModel = require("./models/orderModel");
const MSUserModel = require("./models/msUser");
const ProductModel = require("./models/productModel");
const BatchModel = require("./models/batchModel");
const CartModel = require("./models/cartModel");
const TransactionModel = require("./models/transactionModel");

const { auth, db, FieldValue } = require("./config/firebase");

// Load environment variables if not already loaded
if (!process.env.NODE_ENV) {
  dotenv.config();
}

// Create Express application for medical supplies
const app = express();

// Configure middleware
app.use(
  helmet({
    contentSecurityPolicy: false, // Disable CSP for Socket.IO compatibility
  })
);

app.use(
  cors({
    origin: process.env.CLIENT_URL || "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-requested-with"],
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Create HTTP server
const httpServer = http.createServer(app);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP",
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", limiter);

// Store user connections for chat and notifications
const userConnections = new Map();

// Socket.IO Setup
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["authorization"],
    credentials: true,
  },
});

// Socket.IO Authentication Middleware
io.use(async (socket, next) => {
  try {
    const token =
      socket.handshake.auth.token ||
      socket.handshake.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return next(new Error("Authentication token required"));
    }

    // Verify Firebase token
    const decodedToken = await auth.verifyIdToken(token);
    socket.userId = decodedToken.uid;
    socket.user = decodedToken;

    next();
  } catch (error) {
    console.error("Socket authentication error:", error);
    next(new Error("Authentication failed"));
  }
});

// Initialize notification service in models (add this after io setup)
OrderModel.setNotificationService(io);
MSUserModel.setNotificationService(io);
ProductModel.setNotificationService(io);
BatchModel.setNotificationService(io);
CartModel.setNotificationService(io);
TransactionModel.setNotificationService(io);

// Helper function to get consistent chat room name
const getChatRoomName = (userId1, userId2) => {
  return `chat_${[userId1, userId2].sort().join("_")}`;
};

// Notification helper functions
const notificationHelpers = {
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
  },

  async createSystemNotification(userId, type, message, metadata = {}) {
    try {
      const notification = {
        userId,
        type,
        message,
        metadata,
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
      io.to(`user_${userId}`).emit("notification", savedNotification);

      // Update count
      const unreadCount = await this.getUnreadCount(userId);
      io.to(`user_${userId}`).emit("notification_count_update", {
        count: unreadCount,
      });

      return savedNotification;
    } catch (error) {
      console.error("Error creating system notification:", error);
      throw error;
    }
  },
};

// Socket.IO Connection Handling
io.on("connection", (socket) => {
  const userId = socket.userId;

  console.log(`💬 User connected: ${userId} (socket: ${socket.id})`);

  // Store user connection
  if (!userConnections.has(userId)) {
    userConnections.set(userId, new Set());
  }
  userConnections.get(userId).add(socket.id);

  // Join user to their personal room (for both chat and notifications)
  socket.join(`user_${userId}`);

  // Broadcast user online status
  socket.broadcast.emit("user_online", { userId });

  // Send current online users to this socket
  socket.emit("online_users", Array.from(userConnections.keys()));

  // Send current notification count on connect
  notificationHelpers.getUnreadCount(userId).then((count) => {
    socket.emit("notification_count_update", { count });
  });

  // CHAT HANDLERS
  socket.on("join_chat", (data) => {
    const { chatId } = data;
    const roomName = getChatRoomName(userId, chatId);
    socket.join(roomName);
    console.log(`📱 User ${userId} joined chat room: ${roomName}`);
  });

  socket.on("leave_chat", (data) => {
    const { chatId } = data;
    const roomName = getChatRoomName(userId, chatId);
    socket.leave(roomName);
    console.log(`📱 User ${userId} left chat room: ${roomName}`);
  });

  socket.on("message_sent", (data) => {
    const { chatId, message } = data;
    const roomName = getChatRoomName(userId, chatId);

    socket.to(roomName).emit("new_message", {
      message,
      from: userId,
    });

    io.to(`user_${chatId}`).emit("message_notification", {
      message,
      from: userId,
      chatId: userId,
    });
  });

  socket.on("message_seen", (data) => {
    const { chatId, messageIds } = data;
    const roomName = getChatRoomName(userId, chatId);

    socket.to(roomName).emit("messages_seen", {
      messageIds,
      seenBy: userId,
    });
  });

  socket.on("typing_start", (data) => {
    const { chatId } = data;
    const roomName = getChatRoomName(userId, chatId);

    socket.to(roomName).emit("user_typing", {
      userId,
      isTyping: true,
    });
  });

  socket.on("typing_stop", (data) => {
    const { chatId } = data;
    const roomName = getChatRoomName(userId, chatId);

    socket.to(roomName).emit("user_typing", {
      userId,
      isTyping: false,
    });
  });

  // NOTIFICATION HANDLERS
  socket.on("subscribe_notifications", () => {
    console.log(`🔔 User ${userId} subscribed to notifications`);
    // User is already in user_${userId} room, so they'll receive notifications
  });

  socket.on("get_notification_count", async () => {
    try {
      const count = await notificationHelpers.getUnreadCount(userId);
      socket.emit("notification_count_update", { count });
    } catch (error) {
      console.error("Error getting notification count:", error);
      socket.emit("notification_error", {
        message: "Failed to get notification count",
      });
    }
  });

  socket.on("mark_notifications_read", async (data) => {
    try {
      const { notificationIds } = data;

      if (!notificationIds || !Array.isArray(notificationIds)) {
        socket.emit("notification_error", {
          message: "Invalid notification IDs",
        });
        return;
      }

      const batch = db.batch();
      notificationIds.forEach((id) => {
        const ref = db.collection("notifications").doc(id);
        batch.update(ref, {
          isRead: true,
          readAt: FieldValue.serverTimestamp(),
        });
      });

      await batch.commit();

      const unreadCount = await notificationHelpers.getUnreadCount(userId);
      socket.emit("notification_count_update", { count: unreadCount });
      socket.emit("notifications_marked_read", { notificationIds });
    } catch (error) {
      console.error("Error marking notifications as read:", error);
      socket.emit("notification_error", {
        message: "Failed to mark notifications as read",
      });
    }
  });

  socket.on("notification_interacted", async (data) => {
    const { notificationId, action } = data;

    try {
      await db
        .collection("notifications")
        .doc(notificationId)
        .update({
          [`interactions.${action}`]: FieldValue.serverTimestamp(),
          lastInteracted: FieldValue.serverTimestamp(),
        });

      console.log(
        `🔔 Notification ${notificationId} ${action} by user ${userId}`
      );
    } catch (error) {
      console.error("Error tracking notification interaction:", error);
    }
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log(`💬 User disconnected: ${userId} (socket: ${socket.id})`);

    if (userConnections.has(userId)) {
      userConnections.get(userId).delete(socket.id);

      if (userConnections.get(userId).size === 0) {
        userConnections.delete(userId);
        socket.broadcast.emit("user_offline", { userId });
      }
    }
  });
});

// Middleware to attach io to requests for controllers
app.use((req, res, next) => {
  req.io = io;
  req.notificationHelpers = notificationHelpers;
  next();
});

// Apply auth middleware after io attachment
app.use(authMiddleware);

// Routes
app.use("/api/payments", paymentRoutes);

// Chat API Routes
app.post("/api/chat/archive", chatController.addChatToArchives);
app.post("/api/chat/create-conversation", chatController.createConversation);
app.post("/api/chat/unarchive", chatController.removeChatFromArchives);
app.post("/api/chat/block", chatController.blockUser);
app.post("/api/chat/unblock", chatController.unblockUser);
app.post("/api/chat/report", chatController.reportMessage);
app.get("/api/chat/data", chatController.getChatData);
app.post("/api/chat/send", chatController.sendChatMessage);
app.get("/api/chat/messages", chatController.fetchChatMessages);
app.post("/api/chat/mark-seen", chatController.markMessagesAsSeen);
app.get("/api/chat/unread-count", chatController.getTotalUnreadMessageCount);
app.get("/api/chat/chats", chatController.getChatsWithCounts);

// Notification API Routes
app.get("/api/notifications", notificationController.getNotifications);
app.post("/api/notifications", (req, res) => {
  notificationController.createNotification(req, res);
});
app.post("/api/notifications/mark-read", notificationController.markAsRead);
app.post(
  "/api/notifications/mark-all-read",
  notificationController.markAllAsRead
);
app.get("/api/notifications/count", notificationController.getUnreadCount);
app.delete(
  "/api/notifications/:notificationId",
  notificationController.deleteNotification
);

// System notification endpoints (for internal use)
app.post("/api/system/notifications/order-status", async (req, res) => {
  try {
    const { userId, orderId, status, orderDetails } = req.body;

    const statusMessages = {
      pending: "Your order has been received and is being processed",
      confirmed: "Your order has been confirmed by the supplier",
      shipped: "Your order has been shipped and is on the way",
      delivered: "Your order has been delivered successfully",
      cancelled: "Your order has been cancelled",
    };

    const notification = await notificationHelpers.createSystemNotification(
      userId,
      "order_status",
      statusMessages[status] || `Order status updated to ${status}`,
      {
        orderId,
        status,
        orderDetails,
        actionUrl: `/orders/${orderId}`,
      }
    );

    res.json({ success: true, notification });
  } catch (error) {
    console.error("Error creating order status notification:", error);
    res.status(500).json({ error: "Failed to create notification" });
  }
});

app.post("/api/system/notifications/new-order", async (req, res) => {
  try {
    const { supplierId, orderId, customerName, orderAmount } = req.body;

    const notification = await notificationHelpers.createSystemNotification(
      supplierId,
      "new_order",
      `New order received from ${customerName}`,
      {
        orderId,
        customerName,
        orderAmount,
        actionUrl: `/orders/${orderId}`,
        urgent: orderAmount > 1000,
      }
    );

    res.json({ success: true, notification });
  } catch (error) {
    console.error("Error creating new order notification:", error);
    res.status(500).json({ error: "Failed to create notification" });
  }
});

app.post("/api/system/notifications/review", async (req, res) => {
  try {
    const { supplierId, customerId, customerName, rating, productName } =
      req.body;

    const notification = await notificationHelpers.createSystemNotification(
      supplierId,
      "review",
      `New ${rating}-star review from ${customerName} for ${productName}`,
      {
        customerId,
        customerName,
        rating,
        productName,
        actionUrl: `/reviews`,
      }
    );

    res.json({ success: true, notification });
  } catch (error) {
    console.error("Error creating review notification:", error);
    res.status(500).json({ error: "Failed to create notification" });
  }
});

// Basic health check endpoint
app.get("/medical-supplies/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "medical-supplies",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Utility functions for external use
const getSocketUtils = () => {
  return {
    isUserOnline: (userId) => {
      return (
        userConnections.has(userId) && userConnections.get(userId).size > 0
      );
    },

    sendToUser: (userId, event, data) => {
      io.to(`user_${userId}`).emit(event, data);
    },

    sendToChat: (userId1, userId2, event, data) => {
      const roomName = getChatRoomName(userId1, userId2);
      io.to(roomName).emit(event, data);
    },

    getOnlineUsers: () => {
      return Array.from(userConnections.keys());
    },

    getOnlineUserCount: () => {
      return userConnections.size;
    },

    // Notification utilities
    createNotification: notificationHelpers.createSystemNotification,
    getUnreadCount: notificationHelpers.getUnreadCount,
  };
};

// Socket.IO status endpoint (for monitoring)
app.get("/medical-supplies/socket-status", (req, res) => {
  const utils = getSocketUtils();

  res.status(200).json({
    status: "ok",
    onlineUsers: utils.getOnlineUserCount(),
    onlineUserIds: utils.getOnlineUsers(),
  });
});

const initializeMedicalSuppliesServer = async (parentApp = null) => {
  try {
    const apolloServer = await setupApolloServer(app);

    if (parentApp) {
      parentApp.use("/medical-supplies", app);
      console.log("✅ Medical supplies server initialized as middleware");
      console.log("💬 Chat Socket.IO enabled for real-time messaging");
      console.log("🔔 Notification system enabled");

      return {
        app,
        httpServer,
        apolloServer,
        io,
        socketUtils: getSocketUtils(),
      };
    } else {
      const PORT = process.env.MEDICAL_SUPPLIES_SERVER_PORT || 4001;

      await new Promise((resolve) => {
        httpServer.listen(PORT, () => {
          console.log(`
=======================================================
🚀 MedLink Medical Supplies Server running on port ${PORT}
💬 Chat Socket.IO enabled for real-time messaging
🔔 Notification system enabled with real-time updates
🔗 GraphQL Playground: http://localhost:${PORT}/graphql
📊 Health Check: http://localhost:${PORT}/medical-supplies/health
🔌 Socket Status: http://localhost:${PORT}/medical-supplies/socket-status
💬 Chat API: http://localhost:${PORT}/api/chat/*
🔔 Notification API: http://localhost:${PORT}/api/notifications/*
=======================================================
          `);
          resolve();
        });
      });

      return {
        app,
        httpServer,
        apolloServer,
        io,
        socketUtils: getSocketUtils(),
      };
    }
  } catch (error) {
    console.error("❌ Failed to initialize medical supplies server:", error);
    throw error;
  }
};

// crone job to clean up old notifications
cron.schedule("0 0 * * *", () => {
  BatchModel.notifyAllExpiringBatches();
});

cron.schedule("0 0 1 * *", async () => {
  await notificationController.cleanupExpiredNotifications();
});

// Graceful shutdown handling
process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received, shutting down gracefully...");
  io.close(() => {
    httpServer.close(() => {
      console.log("✅ Server closed successfully");
      process.exit(0);
    });
  });
});

process.on("SIGINT", () => {
  console.log("🛑 SIGINT received, shutting down gracefully...");
  io.close(() => {
    httpServer.close(() => {
      console.log("✅ Server closed successfully");
      process.exit(0);
    });
  });
});

process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

if (require.main === module) {
  initializeMedicalSuppliesServer().catch((err) => {
    console.error(
      "❌ Failed to start standalone medical supplies server:",
      err
    );
    process.exit(1);
  });
}

module.exports = initializeMedicalSuppliesServer;
module.exports.getSocketUtils = getSocketUtils;
