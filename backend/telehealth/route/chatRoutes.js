// routes/chatRoutes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const ChatController = require("../controllers/chatController");
const { FileModel } = require("../models/chatModels");

// Configure multer for file uploads in chat
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "../uploads/chat");
    // Ensure chat uploads directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename with timestamp and user ID
    const uniqueName = `${Date.now()}-${req.user.uid}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Define allowed file types for chat
    const allowedMimes = [
      // Images
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      // Documents
      "application/pdf",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      // Audio/Video (small files)
      "audio/mpeg",
      "audio/wav",
      "video/mp4",
      "video/quicktime",
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not allowed`), false);
    }
  },
});

// =================== CHAT HISTORY & MESSAGES ===================

/**
 * @route GET /api/chat/history
 * @description Get chat history - all rooms for the user with their appointments
 * @access Private
 */
router.get("/history", ChatController.getChatHistory);

/**
 * @route GET /api/chat/messages/:appointmentId
 * @description Get all messages for a specific appointment
 * @access Private
 */
router.get(
  "/messages/:appointmentId",
  ChatController.getMessagesForPastAppointment
);

/**
 * @route GET /api/chat/room/:roomId/messages
 * @description Get all messages for a chat room (across appointments)
 * @access Private
 */
router.get("/room/:roomId/messages", ChatController.getRoomMessages);

// =================== FILE HANDLING ===================

/**
 * @route POST /api/chat/upload
 * @description Upload a file for chat
 * @access Private
 */
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded.",
      });
    }

    const { appointmentId, roomId } = req.body;

    if (!appointmentId) {
      // Clean up uploaded file if appointmentId is missing
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: "Appointment ID is required.",
      });
    }

    // Verify user has access to this appointment
    const AppointmentModel = require("../models/appointment");
    const appointment = await AppointmentModel.getById(appointmentId);

    if (
      !appointment ||
      (appointment.patientId !== req.user.uid &&
        appointment.doctorId !== req.user.uid)
    ) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to this appointment.",
      });
    }

    // Create file URL (assuming you have a way to serve static files)
    const fileUrl = `/uploads/chat/${req.file.filename}`;
    console.log("fileUrl: " , fileUrl)

    // // Prepare file data
    // const fileData = {
    //   senderId: req.user.id,
    //   roomId: roomId,
    //   fileName: req.file.filename,
    //   originalName: req.file.originalName,
    //   fileUrl,
    //   fileType: req.file.mimetype,
    //   fileSize: req.file.size,
    //   uploadedBy: req.user.uid,
    //   appointmentId,
    //   textContent: "shared",
    // };

    // // CREATE THE CHAT MESSAGE HERE
    // const { MessageModel } = require("../models/chatModels.js");

    res.status(200).json({
      success: true,
      message: "File uploaded successfully.",
      data: {
        fileUrl,
        fileName: req.file.originalname,
        originalName: req.file.originalname,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        senderId: req.user.id,
        roomId: roomId,
        messageType: "file"
      },
    });
  } catch (error) {
    console.error("Error uploading file:", error);

    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: "Failed to upload file: " + error.message,
    });
  }
});

/**
 * @route GET /api/chat/files/:appointmentId
 * @description Get all files for a specific appointment
 * @access Private
 */
router.get("/files/:appointmentId", async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const userId = req.user.uid;

    // Verify user has access to this appointment
    const AppointmentModel = require("../models/appointment");
    const appointment = await AppointmentModel.getById(appointmentId);

    if (
      !appointment ||
      (appointment.patientId !== userId && appointment.doctorId !== userId)
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to this appointment.",
      });
    }

    const files = await FileModel.getFilesForAppointment(appointmentId);

    res.status(200).json({
      success: true,
      data: files,
    });
  } catch (error) {
    console.error("Error getting files:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get files: " + error.message,
    });
  }
});

/**
 * @route DELETE /api/chat/file/:fileId
 * @description Delete a file (soft delete in database, actual file cleanup can be done separately)
 * @access Private
 */
router.delete("/file/:fileId", async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.user.uid;

    // Get file details
    const { db } = require("../config/firebase");
    const fileDoc = await db.collection("files").doc(fileId).get();

    if (!fileDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "File not found.",
      });
    }

    const fileData = fileDoc.data();

    // Check if user is authorized to delete (only uploader can delete)
    if (fileData.uploadedBy !== userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to delete this file.",
      });
    }

    // Soft delete the file
    await db
      .collection("files")
      .doc(fileId)
      .update({
        isDeleted: true,
        deletedAt: require("../../utils/helpers.js").timestamp(),
      });

    res.status(200).json({
      success: true,
      message: "File deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting file:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete file: " + error.message,
    });
  }
});

// =================== CHAT STATISTICS & UTILITIES ===================

/**
 * @route GET /api/chat/stats
 * @description Get chat statistics for the user
 * @access Private
 */
router.get("/stats", async (req, res) => {
  try {
    const userId = req.user.uid;
    const { ChatRoomModel, MessageModel } = require("../models/chatModels");

    // Get user's rooms
    const rooms = await ChatRoomModel.getRoomsForUser(userId);

    // Calculate statistics
    let totalMessages = 0;
    let totalUnread = 0;

    for (const room of rooms) {
      const unreadCount = await MessageModel.getUnreadCount(
        room.roomId,
        userId
      );
      totalUnread += unreadCount;

      // This is approximate - for exact count, you'd need to query all messages
      // For performance, you might want to store message counts in the room document
    }

    const stats = {
      totalRooms: rooms.length,
      totalUnreadMessages: totalUnread,
      activeRooms: rooms.filter((room) => room.lastMessageAt).length,
    };

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error getting chat stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get chat statistics: " + error.message,
    });
  }
});

/**
 * @route POST /api/chat/mark-read
 * @description Mark messages as read (alternative to socket event)
 * @access Private
 */
router.post("/mark-read", async (req, res) => {
  try {
    const { messageIds } = req.body;
    const userId = req.user.uid;

    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid message IDs provided.",
      });
    }

    const { MessageModel } = require("../models/chatModels");

    // Mark each message as read
    for (const messageId of messageIds) {
      await MessageModel.markAsRead(messageId, userId);
    }

    res.status(200).json({
      success: true,
      message: "Messages marked as read.",
    });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark messages as read: " + error.message,
    });
  }
});

// =================== ERROR HANDLING ===================

// Handle multer errors
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File too large. Maximum size is 10MB.",
      });
    }

    return res.status(400).json({
      success: false,
      message: "File upload error: " + error.message,
    });
  }

  if (error.message.includes("File type")) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  next(error);
});

module.exports = router;

