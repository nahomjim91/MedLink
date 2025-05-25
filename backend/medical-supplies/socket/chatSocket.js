/**
 * Chat Socket.IO Implementation
 * File: /socket/chatSocket.js
 */
const { auth, db } = require('../config/firebase');
const ChatModel = require('../models/chatModel');
const { fetchUserFromDatabase } = require('../middleware/auth');

// Store online users and their socket connections
const onlineUsers = new Map(); // userId -> { socketId, lastSeen, userDetails }
const userSockets = new Map(); // socketId -> userId
const typingUsers = new Map(); // conversationId -> Set of userIds

/**
 * Socket authentication middleware
 */
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return next(new Error('Authentication token required'));
    }

    // Verify Firebase token
    const decodedToken = await auth.verifyIdToken(token);
    
    // Fetch user data from database
    const dbUserData = await fetchUserFromDatabase(decodedToken.uid);
    
    if (!dbUserData) {
      return next(new Error('User not found in database'));
    }

    // Attach user data to socket
    socket.userId = decodedToken.uid;
    socket.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      ...dbUserData
    };

    next();
  } catch (error) {
    console.error('Socket authentication error:', error);
    next(new Error('Authentication failed'));
  }
};

/**
 * Handle user connection
 */
const handleConnection = async (socket, io) => {
  const userId = socket.userId;
  const userDetails = {
    userId,
    contactName: socket.user.contactName,
    companyName: socket.user.companyName,
    email: socket.user.email,
    profileImageUrl: socket.user.profileImageUrl,
    role: socket.user.role
  };

  console.log(`User ${userId} connected with socket ${socket.id}`);

  // Store user connection
  onlineUsers.set(userId, {
    socketId: socket.id,
    lastSeen: new Date(),
    userDetails
  });
  userSockets.set(socket.id, userId);

  // Join user to their personal room
  socket.join(`user_${userId}`);

  // Get user's conversations and join those rooms
  try {
    const conversations = await ChatModel.getUserConversations(userId);
    conversations.forEach(conversation => {
      socket.join(`conversation_${conversation.conversationId}`);
    });

    // Emit user online status to all conversation participants
    const conversationIds = conversations.map(c => c.conversationId);
    conversationIds.forEach(conversationId => {
      socket.to(`conversation_${conversationId}`).emit('user_online', {
        userId,
        isOnline: true,
        lastSeen: new Date(),
        userDetails
      });
    });

  } catch (error) {
    console.error('Error joining user conversations:', error);
  }

  // Emit updated online users list
  io.emit('online_users_updated', {
    onlineCount: onlineUsers.size,
    onlineUserIds: Array.from(onlineUsers.keys())
  });
};

/**
 * Handle user disconnection
 */
const handleDisconnection = async (socket, io) => {
  const userId = userSockets.get(socket.id);
  
  if (userId) {
    console.log(`User ${userId} disconnected`);

    // Get user's conversations before removing from online users
    try {
      const conversations = await ChatModel.getUserConversations(userId);
      const userDetails = onlineUsers.get(userId)?.userDetails;

      // Remove from online users
      onlineUsers.delete(userId);
      userSockets.delete(socket.id);

      // Clear typing status
      typingUsers.forEach((typingSet, conversationId) => {
        if (typingSet.has(userId)) {
          typingSet.delete(userId);
          socket.to(`conversation_${conversationId}`).emit('typing_stopped', {
            userId,
            conversationId,
            userDetails
          });
        }
      });

      // Emit user offline status to conversation participants
      conversations.forEach(conversation => {
        socket.to(`conversation_${conversation.conversationId}`).emit('user_offline', {
          userId,
          isOnline: false,
          lastSeen: new Date(),
          userDetails
        });
      });

    } catch (error) {
      console.error('Error handling user disconnection:', error);
    }

    // Emit updated online users list
    io.emit('online_users_updated', {
      onlineCount: onlineUsers.size,
      onlineUserIds: Array.from(onlineUsers.keys())
    });
  }
};

/**
 * Handle sending a message
 */
const handleSendMessage = async (socket, io, data) => {
  try {
    const { conversationId, content, type = 'text', metadata = {} } = data;
    const userId = socket.userId;

    // Validate input
    if (!conversationId || !content?.trim()) {
      socket.emit('error', { message: 'Conversation ID and content are required' });
      return;
    }

    // Send message through ChatModel
    const message = await ChatModel.sendMessage(
      conversationId,
      userId,
      content.trim(),
      type,
      metadata
    );

    // Emit message to all conversation participants
    io.to(`conversation_${conversationId}`).emit('message_received', {
      type: 'MESSAGE_SENT',
      message,
      conversationId
    });

    // Send confirmation to sender
    socket.emit('message_sent', {
      success: true,
      message
    });

    console.log(`Message sent in conversation ${conversationId} by user ${userId}`);

  } catch (error) {
    console.error('Error sending message:', error);
    socket.emit('error', { 
      message: 'Failed to send message',
      details: error.message 
    });
  }
};

/**
 * Handle editing a message
 */
const handleEditMessage = async (socket, io, data) => {
  try {
    const { messageId, content } = data;
    const userId = socket.userId;

    if (!messageId || !content?.trim()) {
      socket.emit('error', { message: 'Message ID and content are required' });
      return;
    }

    const updatedMessage = await ChatModel.editMessage(messageId, userId, content.trim());

    // Emit to conversation participants
    io.to(`conversation_${updatedMessage.conversationId}`).emit('message_updated', {
      type: 'MESSAGE_EDITED',
      message: updatedMessage,
      conversationId: updatedMessage.conversationId
    });

    socket.emit('message_edited', {
      success: true,
      message: updatedMessage
    });

  } catch (error) {
    console.error('Error editing message:', error);
    socket.emit('error', { 
      message: 'Failed to edit message',
      details: error.message 
    });
  }
};

/**
 * Handle deleting a message
 */
const handleDeleteMessage = async (socket, io, data) => {
  try {
    const { messageId } = data;
    const userId = socket.userId;

    if (!messageId) {
      socket.emit('error', { message: 'Message ID is required' });
      return;
    }

    // Get message to find conversation ID
    const messageDoc = await db.collection('messages').doc(messageId).get();
    if (!messageDoc.exists) {
      socket.emit('error', { message: 'Message not found' });
      return;
    }

    const messageData = messageDoc.data();
    const success = await ChatModel.deleteMessage(messageId, userId);

    if (success) {
      // Emit to conversation participants
      io.to(`conversation_${messageData.conversationId}`).emit('message_deleted', {
        type: 'MESSAGE_DELETED',
        messageId,
        conversationId: messageData.conversationId
      });

      socket.emit('message_deletion_confirmed', {
        success: true,
        messageId
      });
    }

  } catch (error) {
    console.error('Error deleting message:', error);
    socket.emit('error', { 
      message: 'Failed to delete message',
      details: error.message 
    });
  }
};

/**
 * Handle marking messages as read
 */
const handleMarkAsRead = async (socket, io, data) => {
  try {
    const { conversationId, lastReadMessageId } = data;
    const userId = socket.userId;

    if (!conversationId) {
      socket.emit('error', { message: 'Conversation ID is required' });
      return;
    }

    const success = await ChatModel.markMessagesAsRead(
      conversationId,
      userId,
      lastReadMessageId
    );

    if (success) {
      // Emit read receipt to conversation participants
      socket.to(`conversation_${conversationId}`).emit('messages_read', {
        type: 'MESSAGE_READ',
        conversationId,
        readBy: userId,
        lastReadMessageId,
        userDetails: onlineUsers.get(userId)?.userDetails
      });

      socket.emit('messages_marked_read', {
        success: true,
        conversationId
      });
    }

  } catch (error) {
    console.error('Error marking messages as read:', error);
    socket.emit('error', { 
      message: 'Failed to mark messages as read',
      details: error.message 
    });
  }
};

/**
 * Handle typing indicators
 */
const handleTyping = (socket, io, data) => {
  try {
    const { conversationId, isTyping } = data;
    const userId = socket.userId;
    const userDetails = onlineUsers.get(userId)?.userDetails;

    if (!conversationId) {
      socket.emit('error', { message: 'Conversation ID is required' });
      return;
    }

    if (!typingUsers.has(conversationId)) {
      typingUsers.set(conversationId, new Set());
    }

    const typingSet = typingUsers.get(conversationId);

    if (isTyping) {
      typingSet.add(userId);
      socket.to(`conversation_${conversationId}`).emit('user_typing', {
        userId,
        conversationId,
        isTyping: true,
        userDetails
      });
    } else {
      typingSet.delete(userId);
      socket.to(`conversation_${conversationId}`).emit('typing_stopped', {
        userId,
        conversationId,
        isTyping: false,
        userDetails
      });
    }

  } catch (error) {
    console.error('Error handling typing indicator:', error);
  }
};

/**
 * Handle joining a conversation
 */
const handleJoinConversation = async (socket, data) => {
  try {
    const { conversationId } = data;
    const userId = socket.userId;

    if (!conversationId) {
      socket.emit('error', { message: 'Conversation ID is required' });
      return;
    }

    // Verify user is participant in conversation
    const conversation = await ChatModel.getConversationById(conversationId, userId);
    if (!conversation) {
      socket.emit('error', { message: 'Conversation not found or access denied' });
      return;
    }

    // Join the conversation room
    socket.join(`conversation_${conversationId}`);

    socket.emit('conversation_joined', {
      success: true,
      conversationId,
      conversation
    });

    console.log(`User ${userId} joined conversation ${conversationId}`);

  } catch (error) {
    console.error('Error joining conversation:', error);
    socket.emit('error', { 
      message: 'Failed to join conversation',
      details: error.message 
    });
  }
};

/**
 * Handle leaving a conversation
 */
const handleLeaveConversation = (socket, data) => {
  try {
    const { conversationId } = data;
    const userId = socket.userId;

    if (!conversationId) {
      socket.emit('error', { message: 'Conversation ID is required' });
      return;
    }

    // Leave the conversation room
    socket.leave(`conversation_${conversationId}`);

    // Stop typing if user was typing
    const typingSet = typingUsers.get(conversationId);
    if (typingSet && typingSet.has(userId)) {
      typingSet.delete(userId);
      socket.to(`conversation_${conversationId}`).emit('typing_stopped', {
        userId,
        conversationId,
        userDetails: onlineUsers.get(userId)?.userDetails
      });
    }

    socket.emit('conversation_left', {
      success: true,
      conversationId
    });

    console.log(`User ${userId} left conversation ${conversationId}`);

  } catch (error) {
    console.error('Error leaving conversation:', error);
    socket.emit('error', { 
      message: 'Failed to leave conversation',
      details: error.message 
    });
  }
};

/**
 * Get online users
 */
const handleGetOnlineUsers = (socket, data) => {
  try {
    const { userIds } = data;
    const result = {};

    if (userIds && Array.isArray(userIds)) {
      // Get status for specific users
      userIds.forEach(userId => {
        const userInfo = onlineUsers.get(userId);
        result[userId] = {
          isOnline: !!userInfo,
          lastSeen: userInfo?.lastSeen || null,
          userDetails: userInfo?.userDetails || null
        };
      });
    } else {
      // Get all online users
      onlineUsers.forEach((userInfo, userId) => {
        result[userId] = {
          isOnline: true,
          lastSeen: userInfo.lastSeen,
          userDetails: userInfo.userDetails
        };
      });
    }

    socket.emit('online_users', {
      users: result,
      totalOnline: onlineUsers.size
    });

  } catch (error) {
    console.error('Error getting online users:', error);
    socket.emit('error', { 
      message: 'Failed to get online users',
      details: error.message 
    });
  }
};

/**
 * Initialize Socket.IO for chat
 */
const initializeChatSocket = (httpServer) => {
  const io = require('socket.io')(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "*",
      methods: ["GET", "POST"],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Authentication middleware
  io.use(authenticateSocket);

  // Handle connections
  io.on('connection', (socket) => {
    // Handle connection
    handleConnection(socket, io);

    // Message events
    socket.on('send_message', (data) => handleSendMessage(socket, io, data));
    socket.on('edit_message', (data) => handleEditMessage(socket, io, data));
    socket.on('delete_message', (data) => handleDeleteMessage(socket, io, data));
    socket.on('mark_as_read', (data) => handleMarkAsRead(socket, io, data));

    // Conversation events
    socket.on('join_conversation', (data) => handleJoinConversation(socket, data));
    socket.on('leave_conversation', (data) => handleLeaveConversation(socket, data));

    // Typing events
    socket.on('typing', (data) => handleTyping(socket, io, data));

    // User status events
    socket.on('get_online_users', (data) => handleGetOnlineUsers(socket, data));

    // Handle disconnection
    socket.on('disconnect', () => handleDisconnection(socket, io));

    // Error handling
    socket.on('error', (error) => {
      console.error('Socket error:', error);
      socket.emit('error', { message: 'Socket error occurred' });
    });
  });

  // Periodic cleanup of typing users
  setInterval(() => {
    typingUsers.forEach((typingSet, conversationId) => {
      if (typingSet.size === 0) {
        typingUsers.delete(conversationId);
      }
    });
  }, 30000); // Clean up every 30 seconds

  console.log('Chat Socket.IO initialized successfully');
  return io;
};

// Export utility functions for external use
const getChatSocketUtils = () => ({
  onlineUsers,
  userSockets,
  typingUsers,
  isUserOnline: (userId) => onlineUsers.has(userId),
  getOnlineUserCount: () => onlineUsers.size,
  getOnlineUsers: () => Array.from(onlineUsers.keys()),
  getUserSocket: (userId) => onlineUsers.get(userId)?.socketId
});

module.exports = {
  initializeChatSocket,
  getChatSocketUtils
};