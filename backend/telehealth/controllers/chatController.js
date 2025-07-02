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
