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

      console.log("message: ", message);

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

      await db.collection("messages").doc(messageId).update({
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

      await db.collection("messages").doc(messageId).update({
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
