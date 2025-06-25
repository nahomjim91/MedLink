// models/chat-models.js
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
  async findOrCreateChatRoom(patientId, doctorId) {
    // Sort IDs to create a consistent room ID
    const members = [patientId, doctorId].sort();
    const roomId = members.join("_");
    const roomRef = chatRoomsRef.doc(roomId);
    const doc = await roomRef.get();

    if (doc.exists) {
      return formatDoc(doc);
    } else {
      const newRoom = {
        roomId,
        members,
        createdAt: timestamp(),
        lastMessageTimestamp: null,
        appointmentIds: [],
      };
      await roomRef.set(newRoom);
      return newRoom;
    }
  },

  async linkAppointmentToRoom(roomId, appointmentId) {
    const roomRef = chatRoomsRef.doc(roomId);
    await roomRef.update({
      appointmentIds: FieldValue.arrayUnion(appointmentId),
    });
  },

  async getById(roomId) {
    const doc = await chatRoomsRef.doc(roomId).get();
    return formatDoc(doc);
  },
};

const MessageModel = {
  async createMessage({ senderId, roomId, appointmentId, textContent }) {
    const { encryptedText, iv } = encrypt(textContent, appointmentId);

    const message = {
      senderId,
      roomId,
      appointmentId,
      textContent: encryptedText,
      iv,
      createdAt: timestamp(),
      status: "sent",
    };

    const messageRef = await messagesRef.add(message);
    await chatRoomsRef
      .doc(roomId)
      .update({ lastMessageTimestamp: message.createdAt });

    return { messageId: messageRef.id, ...message };
  },
  async getMessagesForAppointment(
    appointmentId,
    limit = 50,
    startAfterDoc = null
  ) {
    let query = messagesRef
      .where("appointmentId", "==", appointmentId)
      .orderBy("createdAt", "desc")
      .limit(limit);

    if (startAfterDoc) {
      query = query.startAfter(startAfterDoc);
    }

    const snapshot = await query.get();
    const docs = formatDocs(snapshot.docs).reverse();

    return docs.map((msg) => ({
      ...msg,
      textContent: decrypt(msg.textContent, msg.iv, appointmentId),
    }));
  },
};

module.exports = { ChatRoomModel, MessageModel };
