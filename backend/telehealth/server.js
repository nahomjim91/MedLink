/**
 * Express server entry point for MedLink telehealth backend
 * Can be run independently or as a subproject
 */
const express = require("express");
const http = require("http");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require('path');
const fs = require('fs');
const multer = require('multer');
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
const ragRoutes = require("./route/ragRoutes");



// Load environment variables if not already loaded
if (!process.env.NODE_ENV) {
  dotenv.config();
}

// Create Express application for telehealth
const app = express(); 

// Configure middleware
// app.use(cors());
app.use(cors({
  origin: [
    'http://localhost:3000',
    /\.ngrok-free\.app$/
  ],
  credentials: true,
  optionsSuccessStatus: 200
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  // Add ngrok bypass header
  res.header('ngrok-skip-browser-warning', 'true');
  
  // Add CORS headers for images
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, ngrok-skip-browser-warning');
  
  next();
});


// Static file serving for uploads
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads', (req, res, next) => {
  // Set cache headers for images
  res.setHeader('Cache-Control', 'public, max-age=31536000');
  res.setHeader('ngrok-skip-browser-warning', 'true');
  next();
}, express.static(path.join(__dirname, 'uploads')));


// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    // Ensure uploads directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = `${Date.now()}-${file.originalName}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Add file type restrictions if needed
    const allowedMimes = [
      'image/jpeg',
      'image/png', 
      'image/gif',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

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

    console.log(`🔐 Socket authenticated: ${decodedToken.name || decodedToken.email} (${decodedToken.uid})`);
    next();
  } catch (error) {
    console.error("Socket authentication error:", error);
    next(new Error("Authentication failed"));
  }
});

// Initialize socket event handlers
initializeSocket(io);

// Basic health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "telehealth" });
});

// File Upload Routes
// Single file upload endpoint
app.post('/upload', upload.single('file'), (req, res) => {
  try {
    // console.log(req.file);
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    // console.log(fileUrl);
    res.json({
      message: 'File uploaded successfully',
      fileUrl,
      fileType: req.file.mimetype,
      fileName: req.file.filename,
      originalName: req.file.originalName,
      size: req.file.size
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
});

// Multiple files upload endpoint
app.post('/uploads', upload.array('files', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const fileInfos = req.files.map(file => ({
      originalName: file.originalName,
      fileName: file.filename,
      fileUrl: `${req.protocol}://${req.get('host')}/uploads/${file.filename}`,
      fileType: file.mimetype,
      size: file.size
    }));

    res.json({
      message: 'Files uploaded successfully',
      files: fileInfos
    });
  } catch (error) {
    console.error('Multiple upload error:', error);
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
});

// Delete file endpoint
app.delete('/delete/:filename', (req, res) => {
  try {
    const { filename } = req.params;

    // Prevent directory traversal attacks
    const safeFilename = path.basename(filename);
    const filePath = path.join(__dirname, 'uploads', safeFilename);

    // Check if file exists
    fs.access(filePath, fs.constants.F_OK, (err) => {
      if (err) {
        return res.status(404).json({ message: 'File not found' });
      }

      // Delete the file
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error('Delete error:', err);
          return res.status(500).json({ message: 'Error deleting file' });
        }

        res.json({ message: 'File deleted successfully' });
      });
    });
  } catch (error) {
    console.error('Delete endpoint error:', error);
    res.status(500).json({ message: 'Delete failed', error: error.message });
  }
});

// Get file info endpoint
app.get('/file/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const safeFilename = path.basename(filename);
    const filePath = path.join(__dirname, 'uploads', safeFilename);

    fs.stat(filePath, (err, stats) => {
      if (err) {
        return res.status(404).json({ message: 'File not found' });
      }

      res.json({
        filename: safeFilename,
        size: stats.size,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
        fileUrl: `${req.protocol}://${req.get('host')}/uploads/${safeFilename}`
      });
    });
  } catch (error) {
    console.error('File info error:', error);
    res.status(500).json({ message: 'Failed to get file info', error: error.message });
  }
});

// Other existing routes
app.use("/api/payments", paymentRoutes);
app.use("/api/chat", ChatRoutes);
app.use("/api/rag", ragRoutes);

// Cron jobs
cron.schedule("0 0 * * *", async () => {
  try {
    const deletedCount = await AvailabilitySlot.cleanupExpiredSlots(1);
    console.log(`⏱️ Cleanup ran: ${deletedCount} expired slots deleted`);
  } catch (err) {
    console.error("❌ Cleanup error:", err);
  }
});


// Cron job to run every minute
cron.schedule('*/5 * * * *', async () => {
  try {
    console.log('🕐 Running appointment status auto-update...');
    await AppointmentModel.autoUpdateStatuses();
  } catch (error) {
    console.error("❌ Cron job failed:", error);
  }
});

// Optional: Cleanup old uploaded files (run daily)
cron.schedule("0 2 * * *", () => {
  const uploadDir = path.join(__dirname, 'uploads');
  const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

  fs.readdir(uploadDir, (err, files) => {
    if (err) {
      console.error('Error reading upload directory:', err);
      return;
    }

    files.forEach(file => {
      const filePath = path.join(uploadDir, file);
      fs.stat(filePath, (err, stats) => {
        if (err) return;

        const fileAge = Date.now() - stats.mtime.getTime();
        if (fileAge > maxAge) {
          fs.unlink(filePath, (err) => {
            if (err) {
              console.error('Error deleting old file:', err);
            } else {
              console.log(`🗑️ Deleted old file: ${file}`);
            }
          });
        }
      });
    });
  });
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
📁 File uploads available at /telehealth/upload
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

