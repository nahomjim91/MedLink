// models/chatModels.js
const { db, FieldValue } = require("../config/firebase"); // Assuming firebase config is in this path
const { formatDoc, formatDocs, timestamp } = require("../../utils/helpers"); // Assuming helpers are in this path
const crypto = require("crypto");

const chatRoomsRef = db.collection("chatRooms");
const messagesRef = db.collection("messages");

const algorithm = "aes-256-cbc";
const ivLength = 16;

function generateKey(appointmentId) {
  return crypto
    .createHash("sha256")
    .update(appointmentId + "tseb mohiles")
    .digest();
}

function encrypt(text, appointmentId) {
  const iv = crypto.randomBytes(ivLength);
  const key = generateKey(appointmentId);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, "utf8", "base64");
  encrypted += cipher.final("base64");
  return {
    encryptedText: encrypted,
    iv: iv.toString("base64"),
  };
}

function decrypt(encryptedText, iv, appointmentId) {
  const key = generateKey(appointmentId);
  const decipher = crypto.createDecipheriv(
    algorithm,
    key,
    Buffer.from(iv, "base64")
  );
  let decrypted = decipher.update(encryptedText, "base64", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

const ChatRoomModel = {
  /**
   * Find existing room or create new one between patient and doctor
   */
  async findOrCreateChatRoom(patientId, doctorId) {
    try {
      // Check if room already exists
      const existingRoomQuery = await db
        .collection("chatRooms")
        .where("participants", "array-contains-any", [patientId, doctorId])
        .get();

      let existingRoom = null;
      existingRoomQuery.forEach((doc) => {
        const data = doc.data();
        if (
          data.participants.includes(patientId) &&
          data.participants.includes(doctorId)
        ) {
          existingRoom = { roomId: doc.id, ...data };
        }
      });

      if (existingRoom) {
        return existingRoom;
      }

      // Create new room
      const roomData = {
        participants: [patientId, doctorId],
        patientId,
        doctorId,
        createdAt: timestamp(),
        updatedAt: timestamp(),
        appointmentIds: [], // Track all appointments in this room
        lastMessageAt: null,
        lastMessage: null,
      };

      const roomRef = await db.collection("chatRooms").add(roomData);
      return { roomId: roomRef.id, ...roomData };
    } catch (error) {
      console.error("Error in findOrCreateChatRoom:", error);
      throw error;
    }
  },

  /**
   * Link an appointment to a chat room
   */
  async linkAppointmentToRoom(roomId, appointmentId) {
    try {
      await db
        .collection("chatRooms")
        .doc(roomId)
        .update({
          appointmentIds: FieldValue.arrayUnion(appointmentId),
          updatedAt: timestamp(),
        });
    } catch (error) {
      console.error("Error linking appointment to room:", error);
      throw error;
    }
  },

  /**
   * Update room's last message info
   */
  async updateLastMessage(roomId, messageData) {
    try {
      await db
        .collection("chatRooms")
        .doc(roomId)
        .update({
          lastMessage: messageData.textContent || "File shared",
          lastMessageAt: messageData.createdAt,
          updatedAt: timestamp(),
        });
    } catch (error) {
      console.error("Error updating last message:", error);
      throw error;
    }
  },

  /**
   * Get room by ID
   */
  async getById(roomId) {
    try {
      const doc = await db.collection("chatRooms").doc(roomId).get();
      if (!doc.exists) return null;
      return { roomId: doc.id, ...doc.data() };
    } catch (error) {
      console.error("Error getting room by ID:", error);
      throw error;
    }
  },

  /**
   * Get all rooms for a user
   */
  async getRoomsForUser(userId) {
    try {
      const snapshot = await db
        .collection("chatRooms")
        .where("participants", "array-contains", userId)
        .orderBy("updatedAt", "desc")
        .get();

      const rooms = [];
      snapshot.forEach((doc) => {
        rooms.push({ roomId: doc.id, ...doc.data() });
      });
      return rooms;
    } catch (error) {
      console.error("Error getting rooms for user:", error);
      throw error;
    }
  },
};

/**
 * Message Model - Handles chat messages and file sharing
 */
const MessageModel = {
  /**
   * Create a new message
   */
  async createMessage(messageData) {
    try {
      const {
        senderId,
        roomId,
        appointmentId,
        textContent,
        fileUrl,
        fileName,
        fileType,
        fileSize,
        messageType = textContent ? "text" : "file",
      } = messageData;

      const message = {
        senderId,
        roomId,
        appointmentId,
        messageType, // 'text', 'file', 'system'
        textContent: textContent || null,
        fileUrl: fileUrl || null,
        fileName: fileName || null,
        fileType: fileType || null,
        fileSize: fileSize || null,
        createdAt: timestamp(),
        readBy: [senderId], // Sender has read the message
        editedAt: null,
        isDeleted: false,
      };

      console.log("message: ", message)

      const messageRef = await db.collection("messages").add(message);
      const newMessage = { messageId: messageRef.id, ...message };

      // Update room's last message
      await ChatRoomModel.updateLastMessage(roomId, newMessage);

      return newMessage;
    } catch (error) {
      console.error("Error creating message:", error);
      throw error;
    }
  },

  /**
   * Get messages for a specific appointment
   */
  async getMessagesForAppointment(appointmentId, limit = 100) {
    try {
      const snapshot = await db
        .collection("messages")
        .where("appointmentId", "==", appointmentId)
        .where("isDeleted", "==", false)
        .orderBy("createdAt", "asc")
        .limit(limit)
        .get();

      const messages = [];
      snapshot.forEach((doc) => {
        messages.push({ messageId: doc.id, ...doc.data() });
      });
      return messages;
    } catch (error) {
      console.error("Error getting messages for appointment:", error);
      throw error;
    }
  },

  /**
   * Get messages for a chat room (across all appointments)
   */
  async getMessagesForRoom(roomId, limit = 100) {
    try {
      const snapshot = await db
        .collection("messages")
        .where("roomId", "==", roomId)
        .where("isDeleted", "==", false)
        .orderBy("createdAt", "desc")
        .limit(limit)
        .get();

      const messages = [];
      snapshot.forEach((doc) => {
        messages.push({ messageId: doc.id, ...doc.data() });
      });
      return messages.reverse(); // Return in chronological order
    } catch (error) {
      console.error("Error getting messages for room:", error);
      throw error;
    }
  },

  /**
   * Mark message as read by user
   */
  async markAsRead(messageId, userId) {
    try {
      await db
        .collection("messages")
        .doc(messageId)
        .update({
          readBy: FieldValue.arrayUnion(userId),
        });
    } catch (error) {
      console.error("Error marking message as read:", error);
      throw error;
    }
  },

  /**
   * Get unread message count for user in room
   */
  async getUnreadCount(roomId, userId) {
    try {
      const snapshot = await db
        .collection("messages")
        .where("roomId", "==", roomId)
        .where("senderId", "!=", userId)
        .where("isDeleted", "==", false)
        .get();

      let unreadCount = 0;
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (!data.readBy.includes(userId)) {
          unreadCount++;
        }
      });
      return unreadCount;
    } catch (error) {
      console.error("Error getting unread count:", error);
      throw error;
    }
  },

  /**
   * Delete a message (soft delete)
   */
  async deleteMessage(messageId, userId) {
    try {
      const messageDoc = await db.collection("messages").doc(messageId).get();
      if (!messageDoc.exists) {
        throw new Error("Message not found");
      }

      const messageData = messageDoc.data();
      if (messageData.senderId !== userId) {
        throw new Error("Unauthorized to delete this message");
      }

      await db
        .collection("messages")
        .doc(messageId)
        .update({
          isDeleted: true,
          deletedAt: timestamp(),
        });

      return true;
    } catch (error) {
      console.error("Error deleting message:", error);
      throw error;
    }
  },

  /**
   * Edit a message
   */
  async editMessage(messageId, userId, newContent) {
    try {
      const messageDoc = await db.collection("messages").doc(messageId).get();
      if (!messageDoc.exists) {
        throw new Error("Message not found");
      }

      const messageData = messageDoc.data();
      if (messageData.senderId !== userId) {
        throw new Error("Unauthorized to edit this message");
      }

      if (messageData.messageType !== "text") {
        throw new Error("Only text messages can be edited");
      }

      await db
        .collection("messages")
        .doc(messageId)
        .update({
          textContent: newContent,
          editedAt: timestamp(),
        });

      return true;
    } catch (error) {
      console.error("Error editing message:", error);
      throw error;
    }
  },
};

/**
 * File Model - Handle file metadata and URLs
 */
const FileModel = {
  /**
   * Save file metadata
   */
  async saveFileMetadata(fileData) {
    try {
      const {
        fileName,
        originalName,
        fileUrl,
        fileType,
        fileSize,
        uploadedBy,
        appointmentId,
        roomId,
      } = fileData;

      const file = {
        fileName,
        originalName,
        fileUrl,
        fileType,
        fileSize,
        uploadedBy,
        appointmentId,
        roomId,
        uploadedAt: timestamp(),
        isDeleted: false,
      };

      const fileRef = await db.collection("files").add(file);
      return { fileId: fileRef.id, ...file };
    } catch (error) {
      console.error("Error saving file metadata:", error);
      throw error;
    }
  },

  /**
   * Get files for appointment
   */
  async getFilesForAppointment(appointmentId) {
    try {
      const snapshot = await db
        .collection("files")
        .where("appointmentId", "==", appointmentId)
        .where("isDeleted", "==", false)
        .orderBy("uploadedAt", "desc")
        .get();

      const files = [];
      snapshot.forEach((doc) => {
        files.push({ fileId: doc.id, ...doc.data() });
      });
      return files;
    } catch (error) {
      console.error("Error getting files for appointment:", error);
      throw error;
    }
  },
};

module.exports = {
  ChatRoomModel,
  MessageModel,
  FileModel,
};
// controllers/chatController.js
const {
  ChatRoomModel,
  MessageModel,
  FileModel,
} = require("../models/chatModels.js");
const AppointmentModel = require("../models/appointment");
const PatientProfileModel = require("../models/patientProfile");
const DoctorProfileModel = require("../models/doctorProfile");
const User = require("../models/user");
const { FieldValue } = require("firebase-admin/firestore");
const { db } = require("../config/firebase");
const { timestamp } = require("../../utils/helpers.js");
const UserModel = require("../models/user");

const ChatController = {
  /**
   * Handle user joining an appointment room
   */
  handleJoinAppointmentRoom: async (socket, io, appointmentId) => {
    const GRACE_PERIOD_MINUTES = 10;

    try {
      const userId = socket.user.uid;
      const appointment = await AppointmentModel.getById(appointmentId);

      if (!appointment) {
        socket.emit("error", { message: "Appointment not found." });
        return;
      }

      // Check if user is authorized for this appointment
      if (appointment.patientId !== userId && appointment.doctorId !== userId) {
        socket.emit("error", {
          message: "You are not authorized for this chat.",
        });
        return;
      }

      // Get or create chat room
      const chatRoom = await ChatRoomModel.findOrCreateChatRoom(
        appointment.patientId,
        appointment.doctorId
      );

      // Link appointment to room if not already linked
      if (!chatRoom.appointmentIds.includes(appointmentId)) {
        await ChatRoomModel.linkAppointmentToRoom(
          chatRoom.roomId,
          appointmentId
        );
      }

      // Time-Based Access Control for sending messages
      const now = new Date();
      const startTime = appointment.scheduledStartTime.toDate();
      const endTime = appointment.scheduledEndTime.toDate();
      const graceEndTime = new Date(
        endTime.getTime() + GRACE_PERIOD_MINUTES * 60000
      );

      const canSendMessages =
        appointment.status === "IN_PROGRESS" &&
        now >= startTime &&
        now <= graceEndTime;

      // Always allow reading, but restrict sending based on appointment status
      const roomName = `appointment_${appointmentId}`;
      const chatRoomName = `room_${chatRoom.roomId}`;

      socket.join(roomName);
      socket.join(chatRoomName);

      // Set actualStartTime if not already set and appointment is in progress
      if (!appointment.actualStartTime && canSendMessages) {
        await AppointmentModel.update(appointmentId, {
          actualStartTime: timestamp(),
          updatedAt: timestamp(),
        });
        console.log(`🕒 actualStartTime set for appointment ${appointmentId}`);
      }

      // Send access information
      socket.emit("chatAccess", {
        allowed: true,
        canSendMessages,
        roomId: chatRoom.roomId,
        appointmentId,
        reason: canSendMessages
          ? "Successfully joined appointment chat."
          : `Chat is read-only. Appointment status: ${appointment.status}`,
        appointment,
      });

      // Load recent messages for this appointment
      const messages = await MessageModel.getMessagesForAppointment(
        appointmentId
      );
      socket.emit("chatHistory", { messages, appointmentId });

      console.log(
        `${userId} joined room: ${roomName} (read-only: ${!canSendMessages})`
      );
    } catch (error) {
      console.error("Error in handleJoinAppointmentRoom:", error);
      socket.emit("error", {
        message: "Internal server error while joining room.",
      });
    }
  },

  /**
   * Handle sending a text message
   */
  handleSendMessage: async (socket, io, { appointmentId, textContent }) => {
    try {
      const userId = socket.user.uid;
      const appointment = await AppointmentModel.getById(appointmentId);

      // Verify access and appointment status
      if (
        !appointment ||
        (appointment.patientId !== userId && appointment.doctorId !== userId)
      ) {
        return socket.emit("error", { message: "Unauthorized." });
      }

      // Check if messaging is allowed
      const now = new Date();
      const GRACE_PERIOD_MINUTES = 10;
      const graceEndTime = new Date(
        appointment.scheduledEndTime.toDate().getTime() +
          GRACE_PERIOD_MINUTES * 60000
      );

      if (
        appointment.status !== "IN_PROGRESS" ||
        now < appointment.scheduledStartTime.toDate() ||
        now > graceEndTime
      ) {
        return socket.emit("error", {
          message: "Cannot send message. The appointment is not active.",
        });
      }

      // Get chat room
      const chatRoom = await ChatRoomModel.findOrCreateChatRoom(
        appointment.patientId,
        appointment.doctorId
      );

      // Create message
      const messageData = {
        senderId: userId,
        roomId: chatRoom.roomId,
        appointmentId,
        textContent: textContent.trim(),
      };

      const newMessage = await MessageModel.createMessage(messageData);

      // Broadcast the message to the appointment room and chat room
      const roomName = `appointment_${appointmentId}`;
      const chatRoomName = `room_${chatRoom.roomId}`;

      io.to(roomName).emit("newMessage", newMessage);
      io.to(chatRoomName).emit("newMessage", newMessage);

      console.log(`Message sent in appointment ${appointmentId} by ${userId}`);
    } catch (error) {
      console.error("Error in handleSendMessage:", error);
      socket.emit("error", { message: "Failed to send message." });
    }
  },

  /**
   * Handle file sharing
   */
  handleFileShare: async (socket, io, { appointmentId, fileData }) => {
    try {
      const userId = socket.user.uid;
      const appointment = await AppointmentModel.getById(appointmentId);

      // Verify access and appointment status (same as text messages)
      if (
        !appointment ||
        (appointment.patientId !== userId && appointment.doctorId !== userId)
      ) {
        return socket.emit("error", { message: "Unauthorized." });
      }

      const now = new Date();
      const GRACE_PERIOD_MINUTES = 10;
      const graceEndTime = new Date(
        appointment.scheduledEndTime.toDate().getTime() +
          GRACE_PERIOD_MINUTES * 60000
      );

      if (
        appointment.status !== "IN_PROGRESS" ||
        now < appointment.scheduledStartTime.toDate() ||
        now > graceEndTime
      ) {
        return socket.emit("error", {
          message: "Cannot share files. The appointment is not active.",
        });
      }

      // Get chat room
      const chatRoom = await ChatRoomModel.findOrCreateChatRoom(
        appointment.patientId,
        appointment.doctorId
      );

      // Save file metadata
      const savedFile = await FileModel.saveFileMetadata({
        ...fileData,
        uploadedBy: userId,
        appointmentId,
        roomId: chatRoom.roomId,
      });

      // Create message for file
      const messageData = {
        senderId: userId,
        roomId: chatRoom.roomId,
        appointmentId,
        fileUrl: fileData.fileUrl,
        fileName: fileData.originalName,
        fileType: fileData.fileType,
        fileSize: fileData.fileSize,
      };

      const newMessage = await MessageModel.createMessage(messageData);

      // Broadcast the file message
      const roomName = `appointment_${appointmentId}`;
      const chatRoomName = `room_${chatRoom.roomId}`;

      io.to(roomName).emit("newMessage", newMessage);
      io.to(chatRoomName).emit("fileShared", {
        file: savedFile,
        message: newMessage,
      });

      console.log(`File shared in appointment ${appointmentId} by ${userId}`);
    } catch (error) {
      console.error("Error in handleFileShare:", error);
      socket.emit("error", { message: "Failed to share file." });
    }
  },

  /**
   * Handle typing indicators
   */
  handleTyping: async (socket, { appointmentId, isTyping }) => {
    try {
      const userId = socket.user.uid;
      const userName = socket.user.name || "A user";
      const roomName = `appointment_${appointmentId}`;

      if (isTyping) {
        socket
          .to(roomName)
          .emit("userTyping", { userId, userName, appointmentId });
      } else {
        socket
          .to(roomName)
          .emit("userStoppedTyping", { userId, appointmentId });
      }
    } catch (error) {
      console.error("Error handling typing:", error);
    }
  },

  /**
   * Handle marking messages as read
   */
  handleMarkAsRead: async (socket, { messageIds }) => {
    try {
      const userId = socket.user.uid;

      for (const messageId of messageIds) {
        await MessageModel.markAsRead(messageId, userId);
      }

      socket.emit("messagesMarkedAsRead", { messageIds });
    } catch (error) {
      console.error("Error marking messages as read:", error);
      socket.emit("error", { message: "Failed to mark messages as read." });
    }
  },

  /**
   * Handle message editing
   */
  handleEditMessage: async (
    socket,
    io,
    { messageId, newContent, appointmentId }
  ) => {
    try {
      const userId = socket.user.uid;

      await MessageModel.editMessage(messageId, userId, newContent);

      const roomName = `appointment_${appointmentId}`;
      io.to(roomName).emit("messageEdited", {
        messageId,
        newContent,
        editedAt: timestamp(),
      });
    } catch (error) {
      console.error("Error editing message:", error);
      socket.emit("error", {
        message: error.message || "Failed to edit message.",
      });
    }
  },

  /**
   * Handle message deletion
   */
  handleDeleteMessage: async (socket, io, { messageId, appointmentId }) => {
    try {
      const userId = socket.user.uid;

      await MessageModel.deleteMessage(messageId, userId);

      const roomName = `appointment_${appointmentId}`;
      io.to(roomName).emit("messageDeleted", { messageId });
    } catch (error) {
      console.error("Error deleting message:", error);
      socket.emit("error", {
        message: error.message || "Failed to delete message.",
      });
    }
  },

  /**
   * Handle appointment extension request
   */
  handleRequestExtension: async (socket, io, { appointmentId }) => {
    try {
      const requesterId = socket.user.uid;
      const appointment = await AppointmentModel.getById(appointmentId);

      if (!appointment || appointment.status !== "IN_PROGRESS") {
        return socket.emit("extensionError", {
          message: "Appointment is not active.",
        });
      }

      if (appointment.extensionRequested) {
        return socket.emit("extensionError", {
          message: "An extension has already been requested for this session.",
        });
      }

      const patientId = appointment.patientId;
      const doctorId = appointment.doctorId;
      const otherPartyId = requesterId === patientId ? doctorId : patientId;

      // Find the other party's socket
      const otherSocket = Array.from(io.sockets.sockets.values()).find(
        (s) => s.user.uid === otherPartyId
      );

      if (!otherSocket) {
        return socket.emit("extensionError", {
          message: "The other user is not online.",
        });
      }

      // Mark that an extension has been requested
      await AppointmentModel.update(appointmentId, {
        extensionRequested: true,
        extensionRequestedBy: requesterId,
        extensionRequestedAt: timestamp(),
      });

      // Notify the other party
      otherSocket.emit("extensionRequested", {
        requesterId,
        appointmentId,
        requesterName: socket.user.name || "User",
      });

      socket.emit("extensionRequestSent", {
        message: "Extension request has been sent.",
      });

      // Notify room about extension request
      const roomName = `appointment_${appointmentId}`;
      io.to(roomName).emit("systemMessage", {
        type: "extension_requested",
        message: "An extension has been requested for this appointment.",
        appointmentId,
      });
    } catch (error) {
      console.error("Error requesting extension:", error);
      socket.emit("extensionError", {
        message: "Could not request an extension.",
      });
    }
  },

  /**
   * Handle appointment extension acceptance
   */
  handleAcceptExtension: async (socket, io, { appointmentId }) => {
    try {
      const accepterId = socket.user.uid;
      const appointment = await AppointmentModel.getById(appointmentId);

      if (!appointment || appointment.extensionGranted) {
        return socket.emit("extensionError", {
          message: "Extension is not valid or already granted.",
        });
      }

      if (!appointment.extensionRequested) {
        return socket.emit("extensionError", {
          message: "No extension has been requested.",
        });
      }

      const doctor = await DoctorProfileModel.getById(appointment.doctorId);
      const cost = doctor.pricePerSession; // Or specific extension price

      // Use transaction for payment processing
      await db.runTransaction(async (transaction) => {
        const patientRef = db
          .collection("patientProfiles")
          .doc(appointment.patientId);
        const patientDoc = await transaction.get(patientRef);

        if (!patientDoc.exists) throw new Error("Patient profile not found.");

        const patientData = patientDoc.data();
        if (patientData.telehealthWalletBalance < cost) {
          throw new Error("Insufficient funds for extension.");
        }

        // Deduct from patient wallet
        transaction.update(patientRef, {
          telehealthWalletBalance: FieldValue.increment(-cost),
        });

        // Update appointment
        const appointmentRef = db.collection("appointments").doc(appointmentId);
        const newEndTime = new Date(
          appointment.scheduledEndTime.toDate().getTime() + 30 * 60000
        );

        transaction.update(appointmentRef, {
          scheduledEndTime: newEndTime,
          extensionGranted: true,
          extensionAcceptedBy: accepterId,
          extensionAcceptedAt: timestamp(),
          updatedAt: timestamp(),
        });
      });

      const updatedAppointment = await AppointmentModel.getById(appointmentId);
      const roomName = `appointment_${appointmentId}`;

      io.to(roomName).emit("extensionConfirmed", {
        message: "Appointment extended by 30 minutes.",
        newEndTime: updatedAppointment.scheduledEndTime,
      });

      io.to(roomName).emit("systemMessage", {
        type: "extension_granted",
        message: "Appointment has been extended by 30 minutes.",
        appointmentId,
      });
    } catch (error) {
      console.error("Error accepting extension:", error);
      const roomName = `appointment_${appointmentId}`;
      io.to(roomName).emit("extensionError", {
        message: error.message || "Failed to process extension.",
      });
    }
  },

  /**
   * Get chat history (all rooms for user)
   */

  getChatHistory: async (req, res) => {
    try {
      const userId = req.user.uid;
      const rooms = await ChatRoomModel.getRoomsForUser(userId);

      const enrichedRooms = await Promise.all(
        rooms.map(async (room) => {
          // --- START OF FIX ---
          // Find the other participant's ID
          const otherParticipantId = room.participants.find(
            (p) => p !== userId
          );
          let otherParticipantProfile = null;
          let isDoctor = false;

          // Determine if the current user is the patient or doctor in this room
          if (room.patientId === userId) {
            // If current user is patient, the other is the doctor
            otherParticipantProfile = await UserModel.getById(
              otherParticipantId
            );
            isDoctor = true;
          } else {
            // If current user is doctor, the other is the patient
            otherParticipantProfile = await UserModel.getById(
              otherParticipantId
            );
          }

          const appointments = await Promise.all(
            room.appointmentIds.map((id) => AppointmentModel.getById(id))
          );

          const unreadCount = await MessageModel.getUnreadCount(
            room.roomId,
            userId
          );

          return {
            ...room,
            // Use the fetched profile data
            doctorName: isDoctor
              ? otherParticipantProfile?.firstName
              : req.user.firstName,
            patientName: !isDoctor
              ? otherParticipantProfile?.firstName
              : req.user.firstName,
            // Add a generic firstName for the other user for display
            otherParticipantName:
              otherParticipantProfile?.firstName || "Unknown User",
            avatar: otherParticipantProfile?.profileImageUrl || null, // Assuming avatar field is named avatarUrl
            appointments: appointments.filter(Boolean),
            unreadCount,
            // This makes it easier for the frontend
            appointmentId: room.appointmentIds[room.appointmentIds.length - 1], // Provide the latest appointment ID for selection
          };
        })
      );

      res.status(200).json({
        success: true,
        data: enrichedRooms.sort(
          (a, b) =>
            new Date(b.updatedAt._seconds * 1000) -
            new Date(a.updatedAt._seconds * 1000)
        ),
      });
    } catch (error) {
      console.error("Error getting chat history:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch chat history: " + error.message,
      });
    }
  },

  /**
   * Get messages for a specific past appointment
   */
  getMessagesForPastAppointment: async (req, res) => {
    try {
      const { appointmentId } = req.params;
      const userId = req.user.uid;

      const appointment = await AppointmentModel.getById(appointmentId);

      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: "Appointment not found.",
        });
      }

      if (appointment.patientId !== userId && appointment.doctorId !== userId) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized.",
        });
      }

      const messages = await MessageModel.getMessagesForAppointment(
        appointmentId
      );
      const files = await FileModel.getFilesForAppointment(appointmentId);

      res.status(200).json({
        success: true,
        data: {
          messages,
          files,
          appointment,
        },
      });
    } catch (error) {
      console.error("Error getting messages for appointment:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch messages: " + error.message,
      });
    }
  },

  /**
   * Get all messages for a chat room
   */
  getRoomMessages: async (req, res) => {
    try {
      const { roomId } = req.params;
      const userId = req.user.uid;
      const limit = parseInt(req.query.limit) || 100;

      // Verify user has access to this room
      const room = await ChatRoomModel.getById(roomId);
      if (!room || !room.participants.includes(userId)) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized access to this chat room.",
        });
      }

      const messages = await MessageModel.getMessagesForRoom(roomId, limit);

      res.status(200).json({
        success: true,
        data: messages,
      });
    } catch (error) {
      console.error("Error getting room messages:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch room messages: " + error.message,
      });
    }
  },
};

module.exports = ChatController;
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

    // // Prepare file data
    // const fileData = {
    //   senderId: req.user.id,
    //   roomId: roomId,
    //   fileName: req.file.filename,
    //   originalName: req.file.originalname,
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

// socket/socketHandler.js
const ChatController = require("../controllers/chatController");

// In-memory store for online users { userId: socketId }
const onlineUsers = new Map();
// Track typing users { appointmentId: Set of userIds }
const typingUsers = new Map();

function initializeSocket(io) {
  io.on("connection", (socket) => {
    const userId = socket.user.uid;
    const userName = socket.user.name || "Unknown User";

    console.log(
      `🔗 User connected: ${userName} (${userId}) with socket ID ${socket.id}`
    );

    // Add user to online list
    onlineUsers.set(userId, {
      socketId: socket.id,
      userName: userName,
      connectedAt: new Date(),
    });

    // Broadcast online users list to all clients
    const onlineUsersList = Array.from(onlineUsers.entries()).map(
      ([id, info]) => ({
        userId: id,
        userName: info.userName,
        isOnline: true,
      })
    );

    io.emit("updateOnlineUsers", onlineUsersList);

    socket.broadcast.emit("userOnlineStatusChanged", {
      userId: userId,
      isOnline: true,
      userName: userName,
    });

    // =================== CHAT EVENT HANDLERS ===================

    /**
     * Handle user joining a specific appointment chat room
     */
    socket.on("joinAppointmentRoom", async (appointmentId) => {
      try {
        await ChatController.handleJoinAppointmentRoom(
          socket,
          io,
          appointmentId
        );

        // After joining, check and update online status for appointment participants
        const AppointmentModel = require("../models/appointment.js");
        const appointment = await AppointmentModel.getById(appointmentId);

        if (appointment) {
          const participantIds = [appointment.doctorId, appointment.patientId];

          // Check online status for participants
          const onlineStatus = {};
          participantIds.forEach((id) => {
            onlineStatus[id] = onlineUsers.has(id);
          });

          // Send online status to the room
          const roomName = `appointment_${appointmentId}`;
          io.to(roomName).emit("onlineStatusUpdate", onlineStatus);
        }
      } catch (error) {
        console.error("Error in joinAppointmentRoom:", error);
        socket.emit("error", { message: "Failed to join appointment room." });
      }
    });

    /**
     * Handle sending a text message
     */
    socket.on("sendMessage", async (data) => {
      try {
        const { appointmentId, textContent } = data;

        if (!appointmentId || !textContent?.trim()) {
          return socket.emit("error", { message: "Invalid message data." });
        }

        await ChatController.handleSendMessage(socket, io, {
          appointmentId,
          textContent: textContent.trim(),
        });
      } catch (error) {
        console.error("Error in sendMessage:", error);
        socket.emit("error", { message: "Failed to send message." });
      }
    });

    /**
     * Handle file sharing
     */
    socket.on("shareFile", async (data) => {
      try {
        const { appointmentId, fileData } = data;

        if (!appointmentId || !fileData) {
          return socket.emit("error", { message: "Invalid file data." });
        }
        console.log("sharFile");
        await ChatController.handleFileShare(socket, io, {
          appointmentId,
          fileData,
        });
      } catch (error) {
        console.error("Error in shareFile:", error);
        socket.emit("error", { message: "Failed to share file." });
      }
    });

    /**
     * Handle typing indicators
     */
    socket.on("typing", ({ appointmentId }) => {
      try {
        if (!appointmentId) return;

        // Add user to typing list for this appointment
        if (!typingUsers.has(appointmentId)) {
          typingUsers.set(appointmentId, new Set());
        }
        typingUsers.get(appointmentId).add(userId);

        ChatController.handleTyping(socket, { appointmentId, isTyping: true });

        // Auto-stop typing after 3 seconds of inactivity
        setTimeout(() => {
          if (typingUsers.has(appointmentId)) {
            typingUsers.get(appointmentId).delete(userId);
            if (typingUsers.get(appointmentId).size === 0) {
              typingUsers.delete(appointmentId);
            }
          }
          ChatController.handleTyping(socket, {
            appointmentId,
            isTyping: false,
          });
        }, 3000);
      } catch (error) {
        console.error("Error handling typing:", error);
      }
    });

    /**
     * Handle stop typing
     */
    socket.on("stopTyping", ({ appointmentId }) => {
      try {
        if (!appointmentId) return;

        // Remove user from typing list
        if (typingUsers.has(appointmentId)) {
          typingUsers.get(appointmentId).delete(userId);
          if (typingUsers.get(appointmentId).size === 0) {
            typingUsers.delete(appointmentId);
          }
        }

        ChatController.handleTyping(socket, { appointmentId, isTyping: false });
      } catch (error) {
        console.error("Error handling stop typing:", error);
      }
    });

    /**
     * Handle marking messages as read
     */
    socket.on("markAsRead", async (data) => {
      try {
        const { messageIds } = data;

        if (!Array.isArray(messageIds) || messageIds.length === 0) {
          return socket.emit("error", { message: "Invalid message IDs." });
        }

        await ChatController.handleMarkAsRead(socket, { messageIds });
      } catch (error) {
        console.error("Error marking messages as read:", error);
        socket.emit("error", { message: "Failed to mark messages as read." });
      }
    });

    /**
     * Handle message editing
     */
    socket.on("editMessage", async (data) => {
      try {
        const { messageId, newContent, appointmentId } = data;

        if (!messageId || !newContent?.trim() || !appointmentId) {
          return socket.emit("error", { message: "Invalid edit data." });
        }

        await ChatController.handleEditMessage(socket, io, {
          messageId,
          newContent: newContent.trim(),
          appointmentId,
        });
      } catch (error) {
        console.error("Error editing message:", error);
        socket.emit("error", { message: "Failed to edit message." });
      }
    });

    /**
     * Handle message deletion
     */
    socket.on("deleteMessage", async (data) => {
      try {
        const { messageId, appointmentId } = data;

        if (!messageId || !appointmentId) {
          return socket.emit("error", { message: "Invalid delete data." });
        }

        await ChatController.handleDeleteMessage(socket, io, {
          messageId,
          appointmentId,
        });
      } catch (error) {
        console.error("Error deleting message:", error);
        socket.emit("error", { message: "Failed to delete message." });
      }
    });

    // =================== APPOINTMENT EXTENSION HANDLERS ===================

    /**
     * Handle appointment extension request
     */
    socket.on("requestExtension", async (data) => {
      try {
        const { appointmentId } = data;

        if (!appointmentId) {
          return socket.emit("error", {
            message: "Appointment ID is required.",
          });
        }

        await ChatController.handleRequestExtension(socket, io, {
          appointmentId,
        });
      } catch (error) {
        console.error("Error requesting extension:", error);
        socket.emit("extensionError", {
          message: "Failed to request extension.",
        });
      }
    });

    /**
     * Handle appointment extension acceptance
     */
    socket.on("acceptExtension", async (data) => {
      try {
        const { appointmentId } = data;

        if (!appointmentId) {
          return socket.emit("error", {
            message: "Appointment ID is required.",
          });
        }

        await ChatController.handleAcceptExtension(socket, io, {
          appointmentId,
        });
      } catch (error) {
        console.error("Error accepting extension:", error);
        socket.emit("extensionError", {
          message: "Failed to accept extension.",
        });
      }
    });

    /**
     * Handle appointment extension rejection
     */
    socket.on("rejectExtension", async (data) => {
      try {
        const { appointmentId } = data;

        if (!appointmentId) {
          return socket.emit("error", {
            message: "Appointment ID is required.",
          });
        }

        // Reset extension request status
        const AppointmentModel = require("../models/appointment");
        await AppointmentModel.update(appointmentId, {
          extensionRequested: false,
          extensionRequestedBy: null,
          extensionRequestedAt: null,
          updatedAt: require("../../utils/helpers.js").timestamp(),
        });

        const roomName = `appointment_${appointmentId}`;
        io.to(roomName).emit("extensionRejected", {
          message: "Extension request has been declined.",
          appointmentId,
        });

        io.to(roomName).emit("systemMessage", {
          type: "extension_rejected",
          message: "Extension request was declined.",
          appointmentId,
        });
      } catch (error) {
        console.error("Error rejecting extension:", error);
        socket.emit("extensionError", {
          message: "Failed to reject extension.",
        });
      }
    });

    // =================== ROOM MANAGEMENT HANDLERS ===================

    /**
     * Handle leaving a room
     */
    socket.on("leaveRoom", (data) => {
      try {
        const { appointmentId, roomId } = data;

        if (appointmentId) {
          socket.leave(`appointment_${appointmentId}`);
          console.log(`${userId} left appointment room: ${appointmentId}`);
        }

        if (roomId) {
          socket.leave(`room_${roomId}`);
          console.log(`${userId} left chat room: ${roomId}`);
        }

        socket.emit("leftRoom", { appointmentId, roomId });
      } catch (error) {
        console.error("Error leaving room:", error);
      }
    });

    /**
     * Handle getting online status of specific users
     */
    socket.on("checkOnlineStatus", (userIds) => {
      try {
        if (!Array.isArray(userIds)) return;

        const statusMap = {};
        userIds.forEach((id) => {
          statusMap[id] = onlineUsers.has(id);
        });

        socket.emit("onlineStatusUpdate", statusMap);
      } catch (error) {
        console.error("Error checking online status:", error);
      }
    });

    // =================== CONNECTION MANAGEMENT ===================

    /**
     * Handle user disconnect
     */
    socket.on("disconnect", (reason) => {
      console.log(
        `❌ User disconnected: ${userName} (${userId}) - Reason: ${reason}`
      );

      // Remove from online users
      onlineUsers.delete(userId);

      // Remove from all typing indicators
      for (const [appointmentId, typingSet] of typingUsers.entries()) {
        if (typingSet.has(userId)) {
          typingSet.delete(userId);
          if (typingSet.size === 0) {
            typingUsers.delete(appointmentId);
          }
          // Notify that user stopped typing
          socket.to(`appointment_${appointmentId}`).emit("userStoppedTyping", {
            userId,
            appointmentId,
          });
        }
      }

      // Broadcast updated online users list
      io.emit(
        "updateOnlineUsers",
        Array.from(onlineUsers.entries()).map(([id, info]) => ({
          userId: id,
          userName: info.userName,
          isOnline: true,
        }))
      );
    });

    /**
     * Handle connection errors
     */
    socket.on("error", (error) => {
      console.error(`Socket error for user ${userId}:`, error);
    });

    /**
     * Handle ping/pong for connection health
     */
    socket.on("ping", () => {
      socket.emit("pong", { timestamp: Date.now() });
    });

    // =================== INITIAL SETUP ===================

    /**
     * Send initial connection success
     */
    socket.emit("connected", {
      userId,
      userName,
      socketId: socket.id,
      serverTime: new Date().toISOString(),
    });
  });

  // =================== SERVER-LEVEL EVENTS ===================

  /**
   * Handle server shutdown gracefully
   */
  process.on("SIGTERM", () => {
    console.log("🔄 Server shutting down, closing socket connections...");

    // Notify all connected clients
    io.emit("serverShutdown", {
      message: "Server is restarting, please reconnect in a moment.",
    });

    // Close all connections
    io.close(() => {
      console.log("✅ All socket connections closed.");
    });
  });

  // Log connection statistics periodically
  setInterval(() => {
    const connectedCount = onlineUsers.size;
    const typingCount = Array.from(typingUsers.values()).reduce(
      (sum, set) => sum + set.size,
      0
    );

    if (connectedCount > 0) {
      console.log(
        `📊 Connected users: ${connectedCount}, Currently typing: ${typingCount}`
      );
    }
  }, 60000); // Every minute
}

/**
 * Utility function to get online users
 */
function getOnlineUsers() {
  return Array.from(onlineUsers.entries()).map(([userId, info]) => ({
    userId,
    userName: info.userName,
    connectedAt: info.connectedAt,
    socketId: info.socketId,
  }));
}

/**
 * Utility function to check if user is online
 */
function isUserOnline(userId) {
  return onlineUsers.has(userId);
}

/**
 * Utility function to get user's socket
 */
function getUserSocket(io, userId) {
  const userInfo = onlineUsers.get(userId);
  if (!userInfo) return null;

  return io.sockets.sockets.get(userInfo.socketId);
}

module.exports = {
  initializeSocket,
  getOnlineUsers,
  isUserOnline,
  getUserSocket,
};
