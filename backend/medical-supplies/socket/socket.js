// socket/socket.js
const { Server } = require('socket.io');
const { createServer } = require('http');
const { auth } = require('../../config/firebase');

// Store user connections
const userConnections = new Map();

class SocketServer {
  constructor() {
    this.httpServer = createServer();
    this.io = new Server(this.httpServer, {
      cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || ["http://localhost:3000"],
        methods: ["GET", "POST"],
        allowedHeaders: ["authorization"],
        credentials: true
      }
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || 
                     socket.handshake.headers.authorization?.replace('Bearer ', '');

        if (!token) {
          return next(new Error('Authentication token required'));
        }

        // Verify Firebase token
        const decodedToken = await auth.verifyIdToken(token);
        socket.userId = decodedToken.uid;
        socket.user = decodedToken;

        next();
      } catch (error) {
        console.error('Socket authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      const userId = socket.userId;
      
      console.log(`User connected: ${userId} (socket: ${socket.id})`);

      // Store user connection
      if (!userConnections.has(userId)) {
        userConnections.set(userId, new Set());
      }
      userConnections.get(userId).add(socket.id);

      // Join user to their personal room
      socket.join(`user_${userId}`);

      // Handle chat events
      this.handleChatEvents(socket);

      // Handle typing events
      this.handleTypingEvents(socket);

      // Handle online status
      this.handleOnlineStatus(socket);

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log(`User disconnected: ${userId} (socket: ${socket.id})`);
        
        if (userConnections.has(userId)) {
          userConnections.get(userId).delete(socket.id);
          
          // If no more connections, user is offline
          if (userConnections.get(userId).size === 0) {
            userConnections.delete(userId);
            this.broadcastUserOffline(userId);
          }
        }
      });
    });
  }

  handleChatEvents(socket) {
    const userId = socket.userId;

    // Join chat room
    socket.on('join_chat', (data) => {
      const { chatId } = data;
      const roomName = this.getChatRoomName(userId, chatId);
      socket.join(roomName);
      console.log(`User ${userId} joined chat room: ${roomName}`);
    });

    // Leave chat room
    socket.on('leave_chat', (data) => {
      const { chatId } = data;
      const roomName = this.getChatRoomName(userId, chatId);
      socket.leave(roomName);
      console.log(`User ${userId} left chat room: ${roomName}`);
    });

    // Send message (this will be triggered after database save)
    socket.on('message_sent', (data) => {
      const { chatId, message } = data;
      const roomName = this.getChatRoomName(userId, chatId);
      
      // Broadcast to chat room
      socket.to(roomName).emit('new_message', {
        message,
        from: userId
      });

      // Also send to recipient's personal room
      this.io.to(`user_${chatId}`).emit('message_notification', {
        message,
        from: userId,
        chatId: userId
      });
    });

    // Message seen
    socket.on('message_seen', (data) => {
      const { chatId, messageIds } = data;
      const roomName = this.getChatRoomName(userId, chatId);
      
      socket.to(roomName).emit('messages_seen', {
        messageIds,
        seenBy: userId
      });
    });
  }

  handleTypingEvents(socket) {
    const userId = socket.userId;

    socket.on('typing_start', (data) => {
      const { chatId } = data;
      const roomName = this.getChatRoomName(userId, chatId);
      
      socket.to(roomName).emit('user_typing', {
        userId,
        isTyping: true
      });
    });

    socket.on('typing_stop', (data) => {
      const { chatId } = data;
      const roomName = this.getChatRoomName(userId, chatId);
      
      socket.to(roomName).emit('user_typing', {
        userId,
        isTyping: false
      });
    });
  }

  handleOnlineStatus(socket) {
    const userId = socket.userId;

    // Broadcast user online status
    this.broadcastUserOnline(userId);

    // Send online users to this socket
    socket.emit('online_users', Array.from(userConnections.keys()));
  }

  // Helper methods
  getChatRoomName(userId1, userId2) {
    // Create consistent room name regardless of user order
    return `chat_${[userId1, userId2].sort().join('_')}`;
  }

  broadcastUserOnline(userId) {
    this.io.emit('user_online', { userId });
  }

  broadcastUserOffline(userId) {
    this.io.emit('user_offline', { userId });
  }

  isUserOnline(userId) {
    return userConnections.has(userId) && userConnections.get(userId).size > 0;
  }

  // Send message to specific user
  sendToUser(userId, event, data) {
    this.io.to(`user_${userId}`).emit(event, data);
  }

  // Send message to chat participants
  sendToChat(userId1, userId2, event, data) {
    const roomName = this.getChatRoomName(userId1, userId2);
    this.io.to(roomName).emit(event, data);
  }

  // Get online users
  getOnlineUsers() {
    return Array.from(userConnections.keys());
  }

  // Start server
  listen(port = 9000) {
    this.httpServer.listen(port, () => {
      console.log(`Socket server running on port ${port}`);
    });
  }
}

// Create singleton instance
const socketServer = new SocketServer();

module.exports = {
  socketServer,
  userConnections,
  isUserOnline: socketServer.isUserOnline.bind(socketServer),
  sendToUser: socketServer.sendToUser.bind(socketServer),
  sendToChat: socketServer.sendToChat.bind(socketServer),
  getOnlineUsers: socketServer.getOnlineUsers.bind(socketServer)
};


