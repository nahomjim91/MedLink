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

    // =================== VIDEO CALL EVENT HANDLERS ===================

    /**
     * Handle video call initiation
     */
    socket.on("initiateVideoCall", async (data) => {
      try {
        const { appointmentId, callType = "video" } = data; // callType: 'video' or 'audio'

        if (!appointmentId) {
          return socket.emit("error", {
            message: "Appointment ID is required.",
          });
        }

        // Verify appointment exists and user has access
        const AppointmentModel = require("../models/appointment.js");
        const appointment = await AppointmentModel.getById(appointmentId);

        if (!appointment) {
          return socket.emit("error", { message: "Appointment not found." });
        }

        // Check if user is part of this appointment
        if (
          appointment.doctorId !== userId &&
          appointment.patientId !== userId
        ) {
          return socket.emit("error", { message: "Unauthorized access." });
        }

        const roomName = `appointment_${appointmentId}`;

        // Notify other participant about incoming call
        socket.to(roomName).emit("incomingVideoCall", {
          appointmentId,
          callType,
          callerId: userId,
          callerName: userName,
          timestamp: new Date().toISOString(),
        });

        console.log(
          `📞 Video call initiated by ${userName} in appointment ${appointmentId}`
        );
      } catch (error) {
        console.error("Error initiating video call:", error);
        socket.emit("error", { message: "Failed to initiate video call." });
      }
    });

    /**
     * Handle video call answer
     */
    socket.on("answerVideoCall", async (data) => {
      try {
        const { appointmentId, accepted } = data;

        if (!appointmentId) {
          return socket.emit("error", {
            message: "Appointment ID is required.",
          });
        }

        const roomName = `appointment_${appointmentId}`;

        if (accepted) {
          // Notify caller that call was accepted
          socket.to(roomName).emit("videoCallAccepted", {
            appointmentId,
            acceptedBy: userId,
            acceptedByName: userName,
            timestamp: new Date().toISOString(),
          });

          console.log(
            `📞 Video call accepted by ${userName} in appointment ${appointmentId}`
          );
        } else {
          // Notify caller that call was rejected
          socket.to(roomName).emit("videoCallRejected", {
            appointmentId,
            rejectedBy: userId,
            rejectedByName: userName,
            timestamp: new Date().toISOString(),
          });

          console.log(
            `📞 Video call rejected by ${userName} in appointment ${appointmentId}`
          );
        }
      } catch (error) {
        console.error("Error answering video call:", error);
        socket.emit("error", { message: "Failed to answer video call." });
      }
    });

    /**
     * Handle WebRTC signaling - ICE candidates
     */
    socket.on("iceCandidate", (data) => {
      try {
        const { appointmentId, candidate } = data;

        if (!appointmentId || !candidate) {
          return socket.emit("error", {
            message: "Invalid ICE candidate data.",
          });
        }

        const roomName = `appointment_${appointmentId}`;

        // Forward ICE candidate to other peer
        socket.to(roomName).emit("iceCandidate", {
          appointmentId,
          candidate,
          from: userId,
        });
      } catch (error) {
        console.error("Error handling ICE candidate:", error);
      }
    });

    /**
     * Handle WebRTC signaling - SDP offer
     */
    socket.on("videoCallOffer", (data) => {
      try {
        const { appointmentId, offer } = data;
        console.log(
          `📤 Forwarding offer from ${userId} for appointment ${appointmentId}`
        );

        if (!appointmentId || !offer) {
          return socket.emit("error", { message: "Invalid offer data." });
        }

        const roomName = `appointment_${appointmentId}`;

        // Forward offer to other peer
        socket.to(roomName).emit("videoCallOffer", {
          appointmentId,
          offer,
          from: userId,
        });

        console.log(`📤 Offer forwarded to room ${roomName}`);
      } catch (error) {
        console.error("Error handling video call offer:", error);
      }
    });

    /**
     * Handle WebRTC signaling - SDP answer
     */
    socket.on("videoCallAnswer", (data) => {
      try {
        const { appointmentId, answer } = data;
        console.log(
          `📥 Forwarding answer from ${userId} for appointment ${appointmentId}`
        );

        if (!appointmentId || !answer) {
          return socket.emit("error", { message: "Invalid answer data." });
        }

        const roomName = `appointment_${appointmentId}`;

        // Forward answer to other peer
        socket.to(roomName).emit("videoCallAnswer", {
          appointmentId,
          answer,
          from: userId,
        });

        console.log(`📥 Answer forwarded to room ${roomName}`);
      } catch (error) {
        console.error("Error handling video call answer:", error);
      }
    });

    /**
     * Handle video call end
     */
    socket.on("endVideoCall", (data) => {
      try {
        const { appointmentId, reason = "ended" } = data;

        if (!appointmentId) {
          return socket.emit("error", {
            message: "Appointment ID is required.",
          });
        }

        const roomName = `appointment_${appointmentId}`;

        // Notify other participant that call ended
        socket.to(roomName).emit("videoCallEnded", {
          appointmentId,
          endedBy: userId,
          endedByName: userName,
          reason,
          timestamp: new Date().toISOString(),
        });

        console.log(
          `📞 Video call ended by ${userName} in appointment ${appointmentId}`
        );
      } catch (error) {
        console.error("Error ending video call:", error);
      }
    });

    /**
     * Handle media state changes (mute/unmute, camera on/off)
     */
    socket.on("mediaStateChanged", (data) => {
      try {
        const { appointmentId, mediaState } = data;
        // mediaState: { audio: boolean, video: boolean }

        if (!appointmentId || !mediaState) {
          return socket.emit("error", { message: "Invalid media state data." });
        }

        const roomName = `appointment_${appointmentId}`;

        // Notify other participant about media state change
        socket.to(roomName).emit("peerMediaStateChanged", {
          appointmentId,
          userId,
          userName,
          mediaState,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error("Error handling media state change:", error);
      }
    });

    /**
     * Handle screen sharing
     */
    socket.on("screenShareToggle", (data) => {
      try {
        const { appointmentId, isSharing } = data;

        if (!appointmentId) {
          return socket.emit("error", {
            message: "Appointment ID is required.",
          });
        }

        const roomName = `appointment_${appointmentId}`;

        // Notify other participant about screen sharing
        socket.to(roomName).emit("peerScreenShareToggle", {
          appointmentId,
          userId,
          userName,
          isSharing,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error("Error handling screen share toggle:", error);
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
          socket.to(`appointment_${appointmentId}`).emit("userStoppedTyping", {
            userId,
            appointmentId,
          });
        }
      }

      // NEW: Handle video call disconnection
      // Notify all rooms this user was in about video call end
      const userRooms = Array.from(socket.rooms).filter((room) =>
        room.startsWith("appointment_")
      );

      userRooms.forEach((room) => {
        const appointmentId = room.replace("appointment_", "");
        socket.to(room).emit("videoCallEnded", {
          appointmentId,
          endedBy: userId,
          endedByName: userName,
          reason: "disconnected",
          timestamp: new Date().toISOString(),
        });
      });

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
