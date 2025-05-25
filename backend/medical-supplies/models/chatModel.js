/**
 * Chat Model for Firebase operations
 */
const { db, GeoPoint } = require('../../config/firebase');
const { formatDoc, formatDocs, sanitizeInput, paginationParams, timestamp } = require('../../utils/helpers');

// Collection references
const conversationsRef = db.collection('conversations');
const messagesRef = db.collection('messages');

const ChatModel = {
  /**
   * Create a new conversation
   * @param {Array} participants - Array of user IDs
   * @param {String} type - Conversation type ('direct', 'group', 'support')
   * @param {String} title - Optional conversation title
   * @param {String} createdBy - User ID who created the conversation
   * @returns {Object} Created conversation
   */
  async createConversation(participants, type = 'direct', title = null, createdBy) {
    try {
      const conversationData = {
        participants,
        type,
        title,
        createdBy,
        createdAt: timestamp(),
        updatedAt: timestamp(),
        lastMessage: null,
        lastMessageAt: null,
        isActive: true,
        unreadCounts: participants.reduce((acc, userId) => {
          acc[userId] = 0;
          return acc;
        }, {}),
        metadata: {
          totalMessages: 0,
          participantDetails: {} // Will be populated when fetching
        }
      };

      const docRef = await conversationsRef.add(conversationData);
      const createdDoc = await docRef.get();
      
      return {
        conversationId: docRef.id,
        ...formatDoc(createdDoc)
      };
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  },

  /**
   * Get conversation by ID
   * @param {String} conversationId - Conversation ID
   * @param {String} userId - Current user ID (for unread count)
   * @returns {Object} Conversation data
   */
  async getConversationById(conversationId, userId = null) {
    try {
      const doc = await conversationsRef.doc(conversationId).get();
      if (!doc.exists) return null;

      const conversation = formatDoc(doc);
      
      // Add participant details
      if (conversation.participants && conversation.participants.length > 0) {
        const participantDetails = {};
        for (const participantId of conversation.participants) {
          const userDoc = await db.collection('msUsers').doc(participantId).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            participantDetails[participantId] = {
              userId: participantId,
              contactName: userData.contactName,
              companyName: userData.companyName,
              email: userData.email,
              profileImageUrl: userData.profileImageUrl,
              role: userData.role
            };
          }
        }
        conversation.participantDetails = participantDetails;
      }

      // Add user-specific unread count
      if (userId && conversation.unreadCounts) {
        conversation.myUnreadCount = conversation.unreadCounts[userId] || 0;
      }

      return {
        conversationId: doc.id,
        ...conversation
      };
    } catch (error) {
      console.error('Error getting conversation by ID:', error);
      throw error;
    }
  },

  /**
   * Get conversations for a user
   * @param {String} userId - User ID
   * @param {Number} limit - Number of conversations to return
   * @param {Number} offset - Offset for pagination
   * @returns {Array} Array of conversations
   */
  async getUserConversations(userId, limit = 20, offset = 0) {
    try {
      const { limit: limitVal, offset: offsetVal } = paginationParams(limit, offset);
      
      let query = conversationsRef
        .where('participants', 'array-contains', userId)
        .where('isActive', '==', true)
        .orderBy('updatedAt', 'desc')
        .limit(limitVal);

      // Apply offset if needed
      if (offsetVal > 0) {
        const prevSnapshot = await conversationsRef
          .where('participants', 'array-contains', userId)
          .where('isActive', '==', true)
          .orderBy('updatedAt', 'desc')
          .limit(offsetVal)
          .get();
        
        const lastDoc = prevSnapshot.docs[prevSnapshot.docs.length - 1];
        if (lastDoc) {
          query = query.startAfter(lastDoc);
        }
      }

      const snapshot = await query.get();
      const conversations = [];

      for (const doc of snapshot.docs) {
        const conversation = formatDoc(doc);
        
        // Add participant details
        const participantDetails = {};
        for (const participantId of conversation.participants) {
          const userDoc = await db.collection('msUsers').doc(participantId).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            participantDetails[participantId] = {
              userId: participantId,
              contactName: userData.contactName,
              companyName: userData.companyName,
              email: userData.email,
              profileImageUrl: userData.profileImageUrl,
              role: userData.role
            };
          }
        }

        conversations.push({
          conversationId: doc.id,
          ...conversation,
          participantDetails,
          myUnreadCount: conversation.unreadCounts ? (conversation.unreadCounts[userId] || 0) : 0
        });
      }

      return conversations;
    } catch (error) {
      console.error('Error getting user conversations:', error);
      throw error;
    }
  },

  /**
   * Find or create direct conversation between two users
   * @param {String} user1Id - First user ID
   * @param {String} user2Id - Second user ID
   * @returns {Object} Conversation data
   */
  async findOrCreateDirectConversation(user1Id, user2Id) {
    try {
      // Try to find existing conversation
      const snapshot = await conversationsRef
        .where('type', '==', 'direct')
        .where('participants', 'array-contains', user1Id)
        .get();

      let existingConversation = null;
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.participants.includes(user2Id) && data.participants.length === 2) {
          existingConversation = {
            conversationId: doc.id,
            ...formatDoc(doc)
          };
        }
      });

      if (existingConversation) {
        return await this.getConversationById(existingConversation.conversationId, user1Id);
      }

      // Create new conversation
      return await this.createConversation([user1Id, user2Id], 'direct', null, user1Id);
    } catch (error) {
      console.error('Error finding or creating direct conversation:', error);
      throw error;
    }
  },

  /**
   * Send a message
   * @param {String} conversationId - Conversation ID
   * @param {String} senderId - Sender user ID
   * @param {String} content - Message content
   * @param {String} type - Message type ('text', 'image', 'file', 'system')
   * @param {Object} metadata - Additional message metadata
   * @returns {Object} Created message
   */
  async sendMessage(conversationId, senderId, content, type = 'text', metadata = {}) {
    try {
      // First check if conversation exists
      const conversationDoc = await conversationsRef.doc(conversationId).get();
      if (!conversationDoc.exists) {
        throw new Error('Conversation not found');
      }

      const conversation = conversationDoc.data();
      
      // Check if sender is participant
      if (!conversation.participants.includes(senderId)) {
        throw new Error('User is not a participant in this conversation');
      }

      // Create message
      const messageData = {
        conversationId,
        senderId,
        content,
        type,
        metadata,
        createdAt: timestamp(),
        updatedAt: timestamp(),
        isEdited: false,
        isDeleted: false,
        readBy: [senderId], // Sender has read the message
        deliveredTo: [senderId] // Message is delivered to sender
      };

      const messageRef = await messagesRef.add(messageData);
      const createdMessage = await messageRef.get();

      // Update conversation
      const updatedUnreadCounts = { ...conversation.unreadCounts };
      conversation.participants.forEach(participantId => {
        if (participantId !== senderId) {
          updatedUnreadCounts[participantId] = (updatedUnreadCounts[participantId] || 0) + 1;
        } else {
          updatedUnreadCounts[participantId] = 0; // Reset sender's unread count
        }
      });

      await conversationsRef.doc(conversationId).update({
        lastMessage: content,
        lastMessageAt: timestamp(),
        updatedAt: timestamp(),
        unreadCounts: updatedUnreadCounts,
        'metadata.totalMessages': (conversation.metadata?.totalMessages || 0) + 1
      });

      return {
        messageId: messageRef.id,
        ...formatDoc(createdMessage)
      };
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  /**
   * Get messages for a conversation
   * @param {String} conversationId - Conversation ID
   * @param {Number} limit - Number of messages to return
   * @param {String} beforeMessageId - Get messages before this message ID
   * @returns {Array} Array of messages
   */
  async getMessages(conversationId, limit = 50, beforeMessageId = null) {
    try {
      const { limit: limitVal } = paginationParams(limit);
      
      let query = messagesRef
        .where('conversationId', '==', conversationId)
        .where('isDeleted', '==', false)
        .orderBy('createdAt', 'desc')
        .limit(limitVal);

      // If beforeMessageId is provided, start after that message
      if (beforeMessageId) {
        const beforeDoc = await messagesRef.doc(beforeMessageId).get();
        if (beforeDoc.exists) {
          query = query.startAfter(beforeDoc);
        }
      }

      const snapshot = await query.get();
      const messages = [];

      for (const doc of snapshot.docs) {
        const message = formatDoc(doc);
        
        // Add sender details
        const senderDoc = await db.collection('msUsers').doc(message.senderId).get();
        if (senderDoc.exists) {
          const senderData = senderDoc.data();
          message.senderDetails = {
            userId: message.senderId,
            contactName: senderData.contactName,
            companyName: senderData.companyName,
            profileImageUrl: senderData.profileImageUrl,
            role: senderData.role
          };
        }

        messages.push({
          messageId: doc.id,
          ...message
        });
      }

      // Return messages in chronological order (oldest first)
      return messages.reverse();
    } catch (error) {
      console.error('Error getting messages:', error);
      throw error;
    }
  },

  /**
   * Mark messages as read by user
   * @param {String} conversationId - Conversation ID
   * @param {String} userId - User ID
   * @param {String} lastReadMessageId - ID of the last message read
   * @returns {Boolean} Success status
   */
  async markMessagesAsRead(conversationId, userId, lastReadMessageId = null) {
    try {
      // Update conversation unread count
      const conversationRef = conversationsRef.doc(conversationId);
      const conversationDoc = await conversationRef.get();
      
      if (!conversationDoc.exists) {
        throw new Error('Conversation not found');
      }

      const conversation = conversationDoc.data();
      const updatedUnreadCounts = { ...conversation.unreadCounts };
      updatedUnreadCounts[userId] = 0;

      await conversationRef.update({
        unreadCounts: updatedUnreadCounts
      });

      // If lastReadMessageId is provided, update message read status
      if (lastReadMessageId) {
        const messageRef = messagesRef.doc(lastReadMessageId);
        const messageDoc = await messageRef.get();
        
        if (messageDoc.exists) {
          const message = messageDoc.data();
          const updatedReadBy = [...(message.readBy || [])];
          
          if (!updatedReadBy.includes(userId)) {
            updatedReadBy.push(userId);
            await messageRef.update({
              readBy: updatedReadBy
            });
          }
        }
      }

      return true;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  },

  /**
   * Delete a message (soft delete)
   * @param {String} messageId - Message ID
   * @param {String} userId - User ID attempting to delete
   * @returns {Boolean} Success status
   */
  async deleteMessage(messageId, userId) {
    try {
      const messageRef = messagesRef.doc(messageId);
      const messageDoc = await messageRef.get();
      
      if (!messageDoc.exists) {
        throw new Error('Message not found');
      }

      const message = messageDoc.data();
      
      // Only sender can delete their message
      if (message.senderId !== userId) {
        throw new Error('Not authorized to delete this message');
      }

      await messageRef.update({
        isDeleted: true,
        deletedAt: timestamp(),
        updatedAt: timestamp()
      });

      return true;
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  },

  /**
   * Edit a message
   * @param {String} messageId - Message ID
   * @param {String} userId - User ID attempting to edit
   * @param {String} newContent - New message content
   * @returns {Object} Updated message
   */
  async editMessage(messageId, userId, newContent) {
    try {
      const messageRef = messagesRef.doc(messageId);
      const messageDoc = await messageRef.get();
      
      if (!messageDoc.exists) {
        throw new Error('Message not found');
      }

      const message = messageDoc.data();
      
      // Only sender can edit their message
      if (message.senderId !== userId) {
        throw new Error('Not authorized to edit this message');
      }

      await messageRef.update({
        content: newContent,
        isEdited: true,
        editedAt: timestamp(),
        updatedAt: timestamp()
      });

      const updatedDoc = await messageRef.get();
      return {
        messageId,
        ...formatDoc(updatedDoc)
      };
    } catch (error) {
      console.error('Error editing message:', error);
      throw error;
    }
  },

  /**
   * Archive/unarchive a conversation
   * @param {String} conversationId - Conversation ID
   * @param {String} userId - User ID
   * @param {Boolean} archive - Whether to archive or unarchive
   * @returns {Boolean} Success status
   */
  async archiveConversation(conversationId, userId, archive = true) {
    try {
      const conversationRef = conversationsRef.doc(conversationId);
      const conversationDoc = await conversationRef.get();
      
      if (!conversationDoc.exists) {
        throw new Error('Conversation not found');
      }

      const conversation = conversationDoc.data();
      
      // Check if user is participant
      if (!conversation.participants.includes(userId)) {
        throw new Error('User is not a participant in this conversation');
      }

      // Update archived status for the user
      const archivedBy = conversation.archivedBy || {};
      archivedBy[userId] = archive;

      await conversationRef.update({
        archivedBy,
        updatedAt: timestamp()
      });

      return true;
    } catch (error) {
      console.error('Error archiving conversation:', error);
      throw error;
    }
  }
};

module.exports = ChatModel;