// socket/socketHandler.js
const ChatController = require('../controllers/chatController');

// In-memory store for online users { userId: socketId }
const onlineUsers = new Map();

function initializeSocket(io) {

  io.on('connection', (socket) => {
    const userId = socket.user.uid;
    console.log(`A user connected: ${userId} with socket ID ${socket.id}`);
    
    // Add user to online list
    onlineUsers.set(userId, socket.id);
    
    // Broadcast online users list to all clients
    io.emit('updateOnlineUsers', Array.from(onlineUsers.keys()));

    // Event Handlers 

    // Handle user joining a specific appointment chat
    socket.on('joinAppointmentRoom', async (appointmentId) => {
       await ChatController.handleJoinAppointmentRoom(socket, io, appointmentId);
    });

    // Handle sending a message
    socket.on('sendMessage', async (data) => {
        // data should be { appointmentId, textContent }
       await ChatController.handleSendMessage(socket, io, data);
    });

    // Handle typing indicators
   socket.on('typing', ({ appointmentId }) => {
    // Assuming you can get the user's name from the decoded token
    const userName = socket.user.name || 'A user'; // Fallback to a generic name
    socket.to(`appointment_${appointmentId}`).emit('typing', { userId, userName });
});

// When handling the 'stopTyping' event
socket.on('stopTyping', ({ appointmentId }) => {
    socket.to(`appointment_${appointmentId}`).emit('stopTyping', { userId });
});

    // --- Appointment Extension Event Handlers ---
    socket.on('requestExtension', async (data) => {
        // data should be { appointmentId }
        await ChatController.handleRequestExtension(socket, io, data);
    });

    socket.on('acceptExtension', async (data) => {
        // data should be { appointmentId }
        await ChatController.handleAcceptExtension(socket, io, data);
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${userId}`);
      onlineUsers.delete(userId);
      // Broadcast updated online users list
      io.emit('updateOnlineUsers', Array.from(onlineUsers.keys()));
    });
  });
}

module.exports = { initializeSocket };

