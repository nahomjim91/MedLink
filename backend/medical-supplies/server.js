/**
 * Express server entry point for MedLink medical supplies backend
 * Can be run independently or as a subproject
 */
const express = require("express");
const http = require("http");
const cors = require("cors");
const dotenv = require("dotenv");
const { Server } = require("socket.io");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const setupApolloServer = require("./graphql");
const { authMiddleware } = require("../middleware/auth");
const paymentRoutes = require("./route/payment");
const orderRoutes = require("./route/orders");

// Load environment variables if not already loaded
if (!process.env.NODE_ENV) {
  dotenv.config();
}

// Create Express application for telehealth
const app = express();

// Configure middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(authMiddleware);

// Create HTTP server
const httpServer = http.createServer(app);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP",
});
app.use("/api/", limiter);

// Routes
app.use("/api/payments", paymentRoutes);
app.use("/api/orders", orderRoutes);

// Basic health check endpoint
app.get("/medical-supplies/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "medical-supplies" });
});

/**
 * Initialize the telehealth server
 * @param {Object} parentApp - Optional parent Express app to attach as middleware
 * @returns {Object} Server instance
 */
const initializeMedicalSuppliesServer = async (parentApp = null) => {
  try {
    // Set up Apollo Server with Express
    const apolloServer = await setupApolloServer(app);

    if (parentApp) {
      // If parent app is provided, mount as middleware
      parentApp.use("/medical-supplies", app);
      console.log("Medical supplies server initialized as middleware");
      return { app, httpServer, apolloServer };
    } else {
      // Otherwise start as standalone server
      const PORT = process.env.MEDICAL_SUPPLIES_SERVER_PORT || 4001;
      await new Promise((resolve) => {
        httpServer.listen(PORT, () => {
          console.log(`
=======================================================
🚀 MedLink Medical Supplies Server running on port ${PORT}
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
  initializeMedicalSuppliesServer().catch((err) => {
    console.error("Failed to start standalone telehealth server:", err);
    process.exit(1);
  });
}

// Export for importing in other files
module.exports = initializeMedicalSuppliesServer;
