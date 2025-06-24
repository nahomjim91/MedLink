// routes/chat-routes.js
const express = require('express');
const router = express.Router();
const ChatController = require('../controllers/chatController');


/**
 * @route GET /api/chat/history
 * @description Get a list of all appointments for the user, serving as their chat history.
 * @access Private
 */
router.get('/history', ChatController.getChatHistory);

/**
 * @route GET /api/chat/messages/:appointmentId
 * @description Get all messages for a specific (usually past) appointment.
 * @access Private
 */
router.get('/messages/:appointmentId', ChatController.getMessagesForPastAppointment);


module.exports = router;
