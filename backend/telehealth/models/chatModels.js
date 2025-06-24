// models/chat-models.js
const { db, FieldValue } = require('../config/firebase'); // Assuming firebase config is in this path
const { formatDoc, formatDocs, timestamp } = require('../../utils/helpers'); // Assuming helpers are in this path

const chatRoomsRef = db.collection('chatRooms');
const messagesRef = db.collection('messages');

const ChatRoomModel = {
    /**
     * Creates a new chat room for a patient and doctor.
     * The ID is deterministically created to prevent duplicates.
     * @param {string} patientId - The patient's user ID.
     * @param {string} doctorId - The doctor's user ID.
     * @returns {Object} The created or existing chat room data.
     */
    async findOrCreateChatRoom(patientId, doctorId) {
        // Sort IDs to create a consistent room ID
        const members = [patientId, doctorId].sort();
        const roomId = members.join('_');
        const roomRef = chatRoomsRef.doc(roomId);
        const doc = await roomRef.get();

        if (doc.exists) {
            return formatDoc(doc);
        } else {
            const newRoom = {
                roomId,
                members, // [doctorId, patientId] sorted alphabetically
                createdAt: timestamp(),
                lastMessageTimestamp: null,
                appointmentIds: [],
            };
            await roomRef.set(newRoom);
            return newRoom;
        }
    },

    /**
     * Adds an appointment ID to a chat room's record.
     * @param {string} roomId - The ID of the chat room.
     * @param {string} appointmentId - The ID of the appointment to add.
     */
    async linkAppointmentToRoom(roomId, appointmentId) {
        const roomRef = chatRoomsRef.doc(roomId);
        await roomRef.update({
            appointmentIds: FieldValue.arrayUnion(appointmentId)
        });
    },
    
    /**
     * Get a chat room by its ID.
     * @param {string} roomId - The chat room ID.
     */
    async getById(roomId) {
        const doc = await chatRoomsRef.doc(roomId).get();
        return formatDoc(doc);
    }
};

const MessageModel = {
    /**
     * Creates and saves a new chat message.
     * @param {Object} messageData - Contains senderId, roomId, appointmentId, textContent.
     * @returns {Object} The saved message data.
     */
    async createMessage({ senderId, roomId, appointmentId, textContent }) {
        const message = {
            senderId,
            roomId,
            appointmentId,
            textContent,
            createdAt: timestamp(),
            status: 'sent', // Could be 'delivered', 'read'
        };

        const messageRef = await messagesRef.add(message);
        
        // Also update the last message timestamp on the chat room for sorting chat lists
        await chatRoomsRef.doc(roomId).update({ lastMessageTimestamp: message.createdAt });

        return { messageId: messageRef.id, ...message };
    },

    /**
     * Fetches all messages for a specific appointment.
     * @param {string} appointmentId - The ID of the appointment.
     * @param {number} limit - The number of messages to fetch.
     * @param {Object} startAfterDoc - The last document from the previous page for pagination.
     * @returns {Array} A list of message objects.
     */
    async getMessagesForAppointment(appointmentId, limit = 50, startAfterDoc = null) {
        let query = messagesRef
            .where('appointmentId', '==', appointmentId)
            .orderBy('createdAt', 'desc')
            .limit(limit);

        if (startAfterDoc) {
            query = query.startAfter(startAfterDoc);
        }

        const snapshot = await query.get();
        return formatDocs(snapshot.docs).reverse(); // Reverse to show oldest first
    }
};

module.exports = { ChatRoomModel, MessageModel };
