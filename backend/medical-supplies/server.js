const express = require("express");
const http = require("http");
const cors = require("cors");
const dotenv = require("dotenv");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { Server } = require('socket.io');
const setupApolloServer = require("./graphql");
const { authMiddleware } = require("../middleware/auth");
const paymentRoutes = require("./route/payment");
const chatController = require("./socket/chatController");
const { auth } = require("../config/firebase");

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
app.use(authMiddleware);

// Create HTTP server
const httpServer = http.createServer(app);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP",
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", limiter);

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

// Basic health check endpoint
app.get("/medical-supplies/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "medical-supplies",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Store user connections for chat
const userConnections = new Map();

// Socket.IO Chat Setup
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["authorization"],
    credentials: true
  }
});

// Socket.IO Authentication Middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || 
                 socket.handshake.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return next(new Error('Authentication token required'));
    }

    // Verify Firebase token
    const decodedToken = await auth.verifyIdToken(token);
    socket.userId = decodedToken.uid;
    socket.user = decodedToken;

    next();
  } catch (error) {
    console.error('Socket authentication error:', error);
    next(new Error('Authentication failed'));
  }
});

// Helper function to get consistent chat room name
const getChatRoomName = (userId1, userId2) => {
  return `chat_${[userId1, userId2].sort().join('_')}`;
};

// Socket.IO Connection Handling
io.on('connection', (socket) => {
  const userId = socket.userId;
  
  console.log(`💬 User connected to chat: ${userId} (socket: ${socket.id})`);

  // Store user connection
  if (!userConnections.has(userId)) {
    userConnections.set(userId, new Set());
  }
  userConnections.get(userId).add(socket.id);

  // Join user to their personal room
  socket.join(`user_${userId}`);

  // Broadcast user online status
  socket.broadcast.emit('user_online', { userId });

  // Send current online users to this socket
  socket.emit('online_users', Array.from(userConnections.keys()));

  // Handle joining chat rooms
  socket.on('join_chat', (data) => {
    const { chatId } = data;
    const roomName = getChatRoomName(userId, chatId);
    socket.join(roomName);
    console.log(`📱 User ${userId} joined chat room: ${roomName}`);
  });

  // Handle leaving chat rooms
  socket.on('leave_chat', (data) => {
    const { chatId } = data;
    const roomName = getChatRoomName(userId, chatId);
    socket.leave(roomName);
    console.log(`📱 User ${userId} left chat room: ${roomName}`);
  });

  // Handle message sent (triggered after database save)
  socket.on('message_sent', (data) => {
    const { chatId, message } = data;
    const roomName = getChatRoomName(userId, chatId);
    
    // Broadcast to chat room
    socket.to(roomName).emit('new_message', {
      message,
      from: userId
    });

    // Also send to recipient's personal room for notifications
    io.to(`user_${chatId}`).emit('message_notification', {
      message,
      from: userId,
      chatId: userId
    });
  });

  // Handle message seen
  socket.on('message_seen', (data) => {
    const { chatId, messageIds } = data;
    const roomName = getChatRoomName(userId, chatId);
    
    socket.to(roomName).emit('messages_seen', {
      messageIds,
      seenBy: userId
    });
  });

  // Handle typing indicators
  socket.on('typing_start', (data) => {
    const { chatId } = data;
    const roomName = getChatRoomName(userId, chatId);
    
    socket.to(roomName).emit('user_typing', {
      userId,
      isTyping: true
    });
  });

  socket.on('typing_stop', (data) => {
    const { chatId } = data;
    const roomName = getChatRoomName(userId, chatId);
    
    socket.to(roomName).emit('user_typing', {
      userId,
      isTyping: false
    });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`💬 User disconnected from chat: ${userId} (socket: ${socket.id})`);
    
    if (userConnections.has(userId)) {
      userConnections.get(userId).delete(socket.id);
      
      // If no more connections, user is offline
      if (userConnections.get(userId).size === 0) {
        userConnections.delete(userId);
        socket.broadcast.emit('user_offline', { userId });
      }
    }
  });
});

// Chat utility functions for external use
const getChatSocketUtils = () => {
  return {
    isUserOnline: (userId) => {
      return userConnections.has(userId) && userConnections.get(userId).size > 0;
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
    }
  };
};

// Socket.IO status endpoint (for monitoring)
app.get("/medical-supplies/socket-status", (req, res) => {
  const utils = getChatSocketUtils();

  res.status(200).json({
    status: "ok",
    onlineUsers: utils.getOnlineUserCount(),
    onlineUserIds: utils.getOnlineUsers(),
  });
});

/**
 * Initialize the medical supplies server with chat functionality
 * @param {Object} parentApp - Optional parent Express app to attach as middleware
 * @returns {Object} Server instance with Socket.IO
 */
const initializeMedicalSuppliesServer = async (parentApp = null) => {
  try {
    // Set up Apollo Server with Express
    const apolloServer = await setupApolloServer(app);

    if (parentApp) {
      // If parent app is provided, mount as middleware
      parentApp.use("/medical-supplies", app);
      console.log("✅ Medical supplies server initialized as middleware");
      console.log("💬 Chat Socket.IO enabled for real-time messaging");

      return {
        app,
        httpServer,
        apolloServer,
        io,
        socketUtils: getChatSocketUtils(),
      };
    } else {
      // Otherwise start as standalone server
      const PORT = process.env.MEDICAL_SUPPLIES_SERVER_PORT || 4001;

      await new Promise((resolve) => {
        httpServer.listen(PORT, () => {
          console.log(`
=======================================================
🚀 MedLink Medical Supplies Server running on port ${PORT}
💬 Chat Socket.IO enabled for real-time messaging
🔗 GraphQL Playground: http://localhost:${PORT}/graphql
📊 Health Check: http://localhost:${PORT}/medical-supplies/health
🔌 Socket Status: http://localhost:${PORT}/medical-supplies/socket-status
💬 Chat API: http://localhost:${PORT}/api/chat/*
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
        socketUtils: getChatSocketUtils(),
      };
    }
  } catch (error) {
    console.error("❌ Failed to initialize medical supplies server:", error);
    throw error;
  }
};

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

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// If this file is run directly (not imported)
if (require.main === module) {
  initializeMedicalSuppliesServer().catch((err) => {
    console.error(
      "❌ Failed to start standalone medical supplies server:",
      err
    );
    process.exit(1);
  });
}

// Export for importing in other files
module.exports = initializeMedicalSuppliesServer;

// Export chat utilities for external use
module.exports.getChatSocketUtils = getChatSocketUtils;

