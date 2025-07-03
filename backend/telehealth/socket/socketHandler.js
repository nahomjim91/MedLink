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
