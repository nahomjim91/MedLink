/**
 * Express server entry point for MedLink telehealth backend
 * Can be run independently or as a subproject
 */
const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const { Server } = require('socket.io');
const setupApolloServer = require('./graphql');
const { authMiddleware } = require('./middleware/auth');
const AvailabilitySlot = require('./models/availabilitySlot');
const cron = require('node-cron');

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
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST']
  },
  path: '/telehealth/socket.io' // Use a namespace to avoid conflicts
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Telehealth client connected:', socket.id);
  
  // Handle joining a telehealth room
  socket.on('join-room', (roomId, userId) => {
    console.log(`User ${userId} joined room ${roomId}`);
    socket.join(roomId);
    socket.to(roomId).emit('user-connected', userId);
    
    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User ${userId} disconnected from room ${roomId}`);
      socket.to(roomId).emit('user-disconnected', userId);
    });
  });
  
  // Handle chat messages
  socket.on('send-message', (roomId, message, userId) => {
    console.log(`Message in room ${roomId} from ${userId}: ${message.text}`);
    socket.to(roomId).emit('receive-message', message, userId);
  });
  
  // Handle telehealth session status changes
  socket.on('session-status', (roomId, status, userId) => {
    console.log(`Session status in room ${roomId} changed to ${status}`);
    socket.to(roomId).emit('session-status-changed', status, userId);
  });
});

// Basic health check endpoint
app.get('/telehealth/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'telehealth' });
});

cron.schedule("0 0 * * *", async () => {
  try {
    const deletedCount = await AvailabilitySlot.cleanupExpiredSlots(1); // or any hoursAgo you prefer
    console.log(`⏱️ Cleanup ran: ${deletedCount} expired slots deleted`);
  } catch (err) {
    console.error("❌ Cleanup error:", err);
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
      parentApp.use('/telehealth', app);
      console.log('Telehealth server initialized as middleware');
      return { app, httpServer, apolloServer };
    } else {
      // Otherwise start as standalone server
      const PORT = process.env.TELEHEALTH_SERVER_PORT || 4002;
      await new Promise(resolve => {
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
    console.error('Failed to initialize telehealth server:', error);
    throw error;
  }
};

// If this file is run directly (not imported)
if (require.main === module) {
  initializeTelehealthServer().catch(err => {
    console.error('Failed to start standalone telehealth server:', err);
    process.exit(1);
  });
}

// Export for importing in other files
module.exports = initializeTelehealthServer;