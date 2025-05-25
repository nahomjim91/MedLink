const express = require("express");
const http = require("http");
const cors = require("cors");
const dotenv = require("dotenv");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const setupApolloServer = require("./graphql");
const { authMiddleware } = require("../middleware/auth");
const paymentRoutes = require("./route/payment");
const { initializeChatSocket } = require("./socket/chatSocket");

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

// Basic health check endpoint
app.get("/medical-supplies/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "medical-supplies",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Socket.IO status endpoint (for monitoring)
app.get("/medical-supplies/socket-status", (req, res) => {
  const { getChatSocketUtils } = require("./socket/chatSocket");
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

    // Initialize Socket.IO for chat functionality
    const io = initializeChatSocket(httpServer);

    if (parentApp) {
      // If parent app is provided, mount as middleware
      parentApp.use("/medical-supplies", app);
      console.log("✅ Medical supplies server initialized as middleware");
      console.log("✅ Chat Socket.IO enabled for real-time messaging");

      return {
        app,
        httpServer,
        apolloServer,
        io,
        socketUtils: require("./socket/chatSocket").getChatSocketUtils(),
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
        socketUtils: require("./socket/chatSocket").getChatSocketUtils(),
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
  httpServer.close(() => {
    console.log("✅ Server closed successfully");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("🛑 SIGINT received, shutting down gracefully...");
  httpServer.close(() => {
    console.log("✅ Server closed successfully");
    process.exit(0);
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
