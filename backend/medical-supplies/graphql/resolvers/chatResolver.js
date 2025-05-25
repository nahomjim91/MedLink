/**
 * Chat GraphQL Resolvers
 */
const { GraphQLScalarType } = require("graphql");
const { GraphQLJSONObject } = require("graphql-type-json");
const { PubSub, withFilter } = require("graphql-subscriptions");
const ChatModel = require("../../models/chatModel");
const MSUserModel = require("../../models/msUser");
const {
  AuthenticationError,
  ForbiddenError,
  UserInputError,
} = require("apollo-server-express");

// Initialize PubSub for subscriptions
const pubsub = new PubSub();

// Subscription event types
const SUBSCRIPTION_EVENTS = {
  MESSAGE_SENT: 'MESSAGE_SENT',
  MESSAGE_EDITED: 'MESSAGE_EDITED',
  MESSAGE_DELETED: 'MESSAGE_DELETED',
  MESSAGE_READ: 'MESSAGE_READ',
  CONVERSATION_CREATED: 'CONVERSATION_CREATED',
  CONVERSATION_UPDATED: 'CONVERSATION_UPDATED',
  USER_TYPING: 'USER_TYPING',
  USER_ONLINE: 'USER_ONLINE',
  USER_OFFLINE: 'USER_OFFLINE'
};

// Check if user is authenticated
const isAuthenticated = (context) => {
  if (!context.user) {
    throw new AuthenticationError("Authentication required");
  }
  return context.user;
};

// Check if user is participant in conversation
const isParticipant = async (conversationId, userId) => {
  const conversation = await ChatModel.getConversationById(conversationId);
  if (!conversation || !conversation.participants.includes(userId)) {
    throw new ForbiddenError("Access denied to this conversation");
  }
  return conversation;
};

const chatResolvers = {
  // Custom JSON scalar
  JSON: GraphQLJSONObject,

  Query: {
    // Get user's conversations
    myConversations: async (_, { limit, offset }, context) => {
      const user = isAuthenticated(context);
      return await ChatModel.getUserConversations(user.uid, limit, offset);
    },

    // Get conversation by ID
    conversation: async (_, { conversationId }, context) => {
      const user = isAuthenticated(context);
      await isParticipant(conversationId, user.uid);
      return await ChatModel.getConversationById(conversationId, user.uid);
    },

    // Get messages for a conversation
    messages: async (_, { conversationId, limit, beforeMessageId }, context) => {
      const user = isAuthenticated(context);
      await isParticipant(conversationId, user.uid);
      return await ChatModel.getMessages(conversationId, limit, beforeMessageId);
    },

    // Find or create direct conversation with another user
    directConversation: async (_, { withUserId }, context) => {
      const user = isAuthenticated(context);
      
      // Check if the other user exists
      const otherUser = await MSUserModel.getById(withUserId);
      if (!otherUser) {
        throw new UserInputError("User not found");
      }

      return await ChatModel.findOrCreateDirectConversation(user.uid, withUserId);
    },

    // Search conversations
    searchConversations: async (_, { query, limit }, context) => {
      const user = isAuthenticated(context);
      
      // Get all user conversations first
      const conversations = await ChatModel.getUserConversations(user.uid, limit || 20);
      
      // Filter conversations based on query
      const filteredConversations = conversations.filter(conversation => {
        // Search in conversation title
        if (conversation.title && conversation.title.toLowerCase().includes(query.toLowerCase())) {
          return true;
        }
        
        // Search in participant names
        if (conversation.participantDetails) {
          for (const participant of Object.values(conversation.participantDetails)) {
            if (participant.contactName && participant.contactName.toLowerCase().includes(query.toLowerCase())) {
              return true;
            }
            if (participant.companyName && participant.companyName.toLowerCase().includes(query.toLowerCase())) {
              return true;
            }
          }
        }
        
        // Search in last message
        if (conversation.lastMessage && conversation.lastMessage.toLowerCase().includes(query.toLowerCase())) {
          return true;
        }
        
        return false;
      });
      
      return filteredConversations;
    }
  },

  Mutation: {
    // Create a new conversation
    createConversation: async (_, { input }, context) => {
      const user = isAuthenticated(context);
      
      // Validate participants
      if (!input.participants.includes(user.uid)) {
        input.participants.push(user.uid);
      }
      
      // Check if all participants exist
      for (const participantId of input.participants) {
        const participant = await MSUserModel.getById(participantId);
        if (!participant) {
          throw new UserInputError(`User ${participantId} not found`);
        }
      }

      const conversation = await ChatModel.createConversation(
        input.participants,
        input.type,
        input.title,
        user.uid
      );

      // Publish conversation created event
      pubsub.publish(SUBSCRIPTION_EVENTS.CONVERSATION_CREATED, {
        conversationSubscription: {
          type: SUBSCRIPTION_EVENTS.CONVERSATION_CREATED,
          conversation,
          userId: user.uid
        }
      });

      return conversation;
    },

    // Send a message
    sendMessage: async (_, { input }, context) => {
      const user = isAuthenticated(context);
      await isParticipant(input.conversationId, user.uid);

      const message = await ChatModel.sendMessage(
        input.conversationId,
        user.uid,
        input.content,
        input.type,
        input.metadata
      );

      // Publish message sent event
      pubsub.publish(`MESSAGE_${input.conversationId}`, {
        messageSubscription: {
          type: SUBSCRIPTION_EVENTS.MESSAGE_SENT,
          message,
          conversationId: input.conversationId
        }
      });

      return message;
    },

    // Edit a message
    editMessage: async (_, { input }, context) => {
      const user = isAuthenticated(context);
      
      const message = await ChatModel.editMessage(
        input.messageId,
        user.uid,
        input.content
      );

      // Publish message edited event
      pubsub.publish(`MESSAGE_${message.conversationId}`, {
        messageSubscription: {
          type: SUBSCRIPTION_EVENTS.MESSAGE_EDITED,
          message,
          conversationId: message.conversationId
        }
      });

      return message;
    },

    // Delete a message
    deleteMessage: async (_, { messageId }, context) => {
      const user = isAuthenticated(context);
      
      // Get message first to get conversation ID
      const messageDoc = await require('../../config/firebase').db
        .collection('messages')
        .doc(messageId)
        .get();
      
      if (!messageDoc.exists) {
        throw new UserInputError("Message not found");
      }

      const messageData = messageDoc.data();
      await isParticipant(messageData.conversationId, user.uid);

      const success = await ChatModel.deleteMessage(messageId, user.uid);

      if (success) {
        // Publish message deleted event
        pubsub.publish(`MESSAGE_${messageData.conversationId}`, {
          messageSubscription: {
            type: SUBSCRIPTION_EVENTS.MESSAGE_DELETED,
            message: { messageId, conversationId: messageData.conversationId },
            conversationId: messageData.conversationId
          }
        });
      }

      return success;
    },

    // Mark messages as read
    markMessagesAsRead: async (_, { conversationId, lastReadMessageId }, context) => {
      const user = isAuthenticated(context);
      await isParticipant(conversationId, user.uid);

      const success = await ChatModel.markMessagesAsRead(
        conversationId,
        user.uid,
        lastReadMessageId
      );

      if (success) {
        // Publish message read event
        pubsub.publish(`MESSAGE_${conversationId}`, {
          messageSubscription: {
            type: SUBSCRIPTION_EVENTS.MESSAGE_READ,
            message: { readBy: user.uid, lastReadMessageId },
            conversationId
          }
        });
      }

      return success;
    },

    // Archive/unarchive conversation
    archiveConversation: async (_, { conversationId, archive }, context) => {
      const user = isAuthenticated(context);
      await isParticipant(conversationId, user.uid);

      return await ChatModel.archiveConversation(conversationId, user.uid, archive);
    },

    // Add participants to group conversation
    addParticipants: async (_, { conversationId, participantIds }, context) => {
      const user = isAuthenticated(context);
      const conversation = await isParticipant(conversationId, user.uid);
      
      // Only allow adding participants to group conversations
      if (conversation.type !== 'group') {
        throw new UserInputError("Can only add participants to group conversations");
      }
      
      // Check if user is the creator or has admin rights (you might want to implement role-based permissions)
      if (conversation.createdBy !== user.uid) {
        throw new ForbiddenError("Only conversation creator can add participants");
      }
      
      // Validate all new participants exist
      for (const participantId of participantIds) {
        const participant = await MSUserModel.getById(participantId);
        if (!participant) {
          throw new UserInputError(`User ${participantId} not found`);
        }
        
        // Check if participant is already in conversation
        if (conversation.participants.includes(participantId)) {
          throw new UserInputError(`User ${participantId} is already a participant`);
        }
      }

      // Update conversation with new participants
      const updatedParticipants = [...conversation.participants, ...participantIds];
      const newUnreadCounts = { ...conversation.unreadCounts };
      
      // Initialize unread counts for new participants
      participantIds.forEach(participantId => {
        newUnreadCounts[participantId] = 0;
      });

      await require('../../config/firebase').db
        .collection('conversations')
        .doc(conversationId)
        .update({
          participants: updatedParticipants,
          unreadCounts: newUnreadCounts,
          updatedAt: require('../../utils/helpers').timestamp()
        });

      // Get updated conversation
      const updatedConversation = await ChatModel.getConversationById(conversationId, user.uid);

      // Publish conversation updated event
      pubsub.publish(SUBSCRIPTION_EVENTS.CONVERSATION_UPDATED, {
        conversationSubscription: {
          type: SUBSCRIPTION_EVENTS.CONVERSATION_UPDATED,
          conversation: updatedConversation,
          userId: user.uid
        }
      });

      return updatedConversation;
    },

    // Remove participants from group conversation
    removeParticipants: async (_, { conversationId, participantIds }, context) => {
      const user = isAuthenticated(context);
      const conversation = await isParticipant(conversationId, user.uid);
      
      // Only allow removing participants from group conversations
      if (conversation.type !== 'group') {
        throw new UserInputError("Can only remove participants from group conversations");
      }
      
      // Check if user is the creator or has admin rights
      if (conversation.createdBy !== user.uid) {
        throw new ForbiddenError("Only conversation creator can remove participants");
      }
      
      // Don't allow removing the creator
      if (participantIds.includes(conversation.createdBy)) {
        throw new UserInputError("Cannot remove conversation creator");
      }
      
      // Validate all participants to remove exist in conversation
      for (const participantId of participantIds) {
        if (!conversation.participants.includes(participantId)) {
          throw new UserInputError(`User ${participantId} is not a participant`);
        }
      }

      // Update conversation by removing participants
      const updatedParticipants = conversation.participants.filter(
        participantId => !participantIds.includes(participantId)
      );
      const newUnreadCounts = { ...conversation.unreadCounts };
      
      // Remove unread counts for removed participants
      participantIds.forEach(participantId => {
        delete newUnreadCounts[participantId];
      });

      await require('../../config/firebase').db
        .collection('conversations')
        .doc(conversationId)
        .update({
          participants: updatedParticipants,
          unreadCounts: newUnreadCounts,
          updatedAt: require('../../utils/helpers').timestamp()
        });

      // Get updated conversation
      const updatedConversation = await ChatModel.getConversationById(conversationId, user.uid);

      // Publish conversation updated event
      pubsub.publish(SUBSCRIPTION_EVENTS.CONVERSATION_UPDATED, {
        conversationSubscription: {
          type: SUBSCRIPTION_EVENTS.CONVERSATION_UPDATED,
          conversation: updatedConversation,
          userId: user.uid
        }
      });

      return updatedConversation;
    },

    // Update conversation title
    updateConversationTitle: async (_, { conversationId, title }, context) => {
      const user = isAuthenticated(context);
      const conversation = await isParticipant(conversationId, user.uid);
      
      // Only allow updating title for group conversations
      if (conversation.type !== 'group') {
        throw new UserInputError("Can only update title for group conversations");
      }
      
      // Check if user is the creator or has admin rights
      if (conversation.createdBy !== user.uid) {
        throw new ForbiddenError("Only conversation creator can update title");
      }

      // Update conversation title
      await require('../../config/firebase').db
        .collection('conversations')
        .doc(conversationId)
        .update({
          title,
          updatedAt: require('../../utils/helpers').timestamp()
        });

      // Get updated conversation
      const updatedConversation = await ChatModel.getConversationById(conversationId, user.uid);

      // Publish conversation updated event
      pubsub.publish(SUBSCRIPTION_EVENTS.CONVERSATION_UPDATED, {
        conversationSubscription: {
          type: SUBSCRIPTION_EVENTS.CONVERSATION_UPDATED,
          conversation: updatedConversation,
          userId: user.uid
        }
      });

      return updatedConversation;
    }
  },

  Subscription: {
    // Subscribe to messages in a conversation
    messageSubscription: {
      subscribe: withFilter(
        (_, { conversationId }) => pubsub.asyncIterator(`MESSAGE_${conversationId}`),
        async (payload, variables, context) => {
          // Verify user has access to this conversation
          const user = isAuthenticated(context);
          try {
            await isParticipant(variables.conversationId, user.uid);
            return true;
          } catch (error) {
            return false;
          }
        }
      )
    },

    // Subscribe to conversation updates for a user
    conversationSubscription: {
      subscribe: withFilter(
        () => pubsub.asyncIterator([
          SUBSCRIPTION_EVENTS.CONVERSATION_CREATED,
          SUBSCRIPTION_EVENTS.CONVERSATION_UPDATED
        ]),
        (payload, variables, context) => {
          // Only send updates to participants of the conversation
          const user = isAuthenticated(context);
          return payload.conversationSubscription.conversation.participants.includes(user.uid);
        }
      )
    },

    // Subscribe to typing indicators
    typingIndicator: {
      subscribe: withFilter(
        (_, { conversationId }) => pubsub.asyncIterator(`TYPING_${conversationId}`),
        async (payload, variables, context) => {
          // Verify user has access to this conversation
          const user = isAuthenticated(context);
          try {
            await isParticipant(variables.conversationId, user.uid);
            // Don't send typing indicator to the user who is typing
            return payload.typingIndicator.userId !== user.uid;
          } catch (error) {
            return false;
          }
        }
      )
    },

    // Subscribe to user online status
    userOnlineStatus: {
      subscribe: withFilter(
        () => pubsub.asyncIterator([
          SUBSCRIPTION_EVENTS.USER_ONLINE,
          SUBSCRIPTION_EVENTS.USER_OFFLINE
        ]),
        (payload, variables) => {
          // Only send status updates for users in the requested list
          return variables.userIds.includes(payload.userOnlineStatus.userId);
        }
      )
    }
  }
};

module.exports = chatResolvers;