/**
 * Express server entry point for MedLink telehealth backend
 * Can be run independently or as a subproject
 */
const express = require("express");
const http = require("http");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require('path');
const { Server } = require("socket.io");
const { initializeSocket } = require("./socket/socketHandler");
const setupApolloServer = require("./graphql");
const { authMiddleware } = require("./middleware/auth");
const AvailabilitySlot = require("./models/availabilitySlot");
const cron = require("node-cron");
const paymentRoutes = require("./route/payment");
const { auth } = require("./config/firebase");
const ChatRoutes = require("./route/chatRoutes");
const AppointmentModel = require("./models/appointment");

// Load environment variables if not already loaded
if (!process.env.NODE_ENV) {
  dotenv.config();
}

// Create Express application for telehealth
const app = express();

// Configure middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(authMiddleware);

// Create HTTP server
const httpServer = http.createServer(app);

// Set up Socket.io for real-time communication
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["authorization"],
    credentials: true,
  },
});
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

// Initialize socket event handlers
initializeSocket(io);

// Basic health check endpoint
app.get("/telehealth/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "telehealth" });
});

// Routes
app.use("/api/payments", paymentRoutes);
app.use("/api/chat", ChatRoutes);

cron.schedule("0 0 * * *", async () => {
  try {
    const deletedCount = await AvailabilitySlot.cleanupExpiredSlots(1); // or any hoursAgo you prefer
    console.log(`⏱️ Cleanup ran: ${deletedCount} expired slots deleted`);
  } catch (err) {
    console.error("❌ Cleanup error:", err);
  }
});

cron.schedule('*/1 * * * *', async () => {
  try {
    await AppointmentModel.autoUpdateStatuses();
  } catch (error) {
    console.error("Cron job failed:", error);
  }
});
/**
 * Initialize the telehealth server
 * @param {Object} parentApp - Optional parent Express app to attach as middleware
 * @returns {Object} Server instance
 */
const initializeTelehealthServer = async (parentApp = null) => {
  try {
    // Set up Apollo Server with Express
    const apolloServer = await setupApolloServer(app);

    if (parentApp) {
      // If parent app is provided, mount as middleware
      parentApp.use("/telehealth", app);
      console.log("Telehealth server initialized as middleware");
      return { app, httpServer, apolloServer };
    } else {
      // Otherwise start as standalone server
      const PORT = process.env.TELEHEALTH_SERVER_PORT || 4002;
      await new Promise((resolve) => {
        httpServer.listen(PORT, () => {
          console.log(`
=======================================================
🚀 MedLink Telehealth Server running on port ${PORT}
=======================================================
          `);
          resolve();
        });
      });
      return { app, httpServer, apolloServer };
    }
  } catch (error) {
    console.error("Failed to initialize telehealth server:", error);
    throw error;
  }
};

// If this file is run directly (not imported)
if (require.main === module) {
  initializeTelehealthServer().catch((err) => {
    console.error("Failed to start standalone telehealth server:", err);
    process.exit(1);
  });
}

// Export for importing in other files
module.exports = initializeTelehealthServer;

