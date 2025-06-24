// controllers/chat-controller.js
const { ChatRoomModel, MessageModel } = require('../models/chatModels.js');
const AppointmentModel = require('../models/appointment'); // Assuming you have this from fortest.js
const PatientProfileModel = require('../models/patientProfile'); // Assuming from fortest.js
const { db } = require('../config/firebase');

const ChatController = {
    
    // --- Socket Event Handlers Logic ---

    handleJoinAppointmentRoom: async (socket, io, appointmentId) => {
        try {
            const userId = socket.user.uid;
            const appointment = await AppointmentModel.getById(appointmentId);

            if (!appointment) {
                socket.emit('error', { message: 'Appointment not found.' });
                return;
            }

            if (appointment.patientId !== userId && appointment.doctorId !== userId) {
                socket.emit('error', { message: 'You are not authorized for this chat.' });
                return;
            }
            
            // Time-Based Access Control
            const now = new Date();
            const startTime = appointment.scheduledStartTime.toDate();
            const endTime = appointment.scheduledEndTime.toDate();
            
            if (appointment.status !== 'IN_PROGRESS' || now < startTime || now > endTime) {
                socket.emit('chatAccess', { 
                    allowed: false, 
                    reason: `Chat is disabled. Appointment status: ${appointment.status}.` 
                });
                return;
            }

            const roomName = `appointment_${appointmentId}`;
            socket.join(roomName);
            
            socket.emit('chatAccess', {
                allowed: true,
                reason: 'Successfully joined appointment chat.',
                appointment,
            });
            
            console.log(`${userId} joined room: ${roomName}`);

        } catch (error) {
            console.error('Error in handleJoinAppointmentRoom:', error);
            socket.emit('error', { message: 'Internal server error while joining room.' });
        }
    },

    handleSendMessage: async (socket, io, { appointmentId, textContent }) => {
        try {
            const userId = socket.user.uid;
            const appointment = await AppointmentModel.getById(appointmentId);

            // Re-verify access before sending a message
            if (!appointment || (appointment.patientId !== userId && appointment.doctorId !== userId)) {
                return socket.emit('error', { message: "Unauthorized." });
            }

            const now = new Date();
            if (appointment.status !== 'IN_PROGRESS' || now > appointment.scheduledEndTime.toDate()) {
                 return socket.emit('error', { message: "Cannot send message. The appointment is not active." });
            }

            const roomId = [appointment.patientId, appointment.doctorId].sort().join('_');
            const messageData = { senderId: userId, roomId, appointmentId, textContent };
            const newMessage = await MessageModel.createMessage(messageData);
            
            // Broadcast the message to the room
            const roomName = `appointment_${appointmentId}`;
            io.to(roomName).emit('newMessage', newMessage);

        } catch (error) {
            console.error('Error in handleSendMessage:', error);
            socket.emit('error', { message: 'Failed to send message.' });
        }
    },

    handleRequestExtension: async (socket, io, { appointmentId }) => {
        try {
            const requesterId = socket.user.uid;
            const appointment = await AppointmentModel.getById(appointmentId);

            if (!appointment || (appointment.status !== 'IN_PROGRESS')) {
                return socket.emit('extensionError', { message: 'Appointment is not active.' });
            }

            if (appointment.extensionRequested) {
                 return socket.emit('extensionError', { message: 'An extension has already been requested for this session.' });
            }
            
            const patientId = appointment.patientId;
            const doctorId = appointment.doctorId;

            // Find the other party to send the request to
            const otherPartyId = requesterId === patientId ? doctorId : patientId;
            const recipientSocketId = Array.from(io.sockets.sockets.values()).find(s => s.user.uid === otherPartyId)?.id;

            if (!recipientSocketId) {
                return socket.emit('extensionError', { message: 'The other user is not online.' });
            }

            // Mark that an extension has been requested to prevent duplicates
            await AppointmentModel.update(appointmentId, { extensionRequested: true });

            // Notify the other party
            io.to(recipientSocketId).emit('extensionRequested', { 
                requesterId, 
                appointmentId 
            });
            socket.emit('extensionRequestSent', { message: 'Extension request has been sent.' });

        } catch (error) {
             console.error('Error requesting extension:', error);
             socket.emit('extensionError', { message: 'Could not request an extension.' });
        }
    },
    
    handleAcceptExtension: async (socket, io, { appointmentId }) => {
        try {
            const accepterId = socket.user.uid;
            const appointment = await AppointmentModel.getById(appointmentId);

            if (!appointment || appointment.extensionGranted) {
                return socket.emit('extensionError', { message: 'Extension is not valid or already granted.' });
            }

            const doctor = await DoctorProfileModel.getById(appointment.doctorId);
            const cost = doctor.pricePerSession; // Or a specific extension price

            // Use a transaction to ensure atomicity
            await db.runTransaction(async (transaction) => {
                const patientRef = db.collection('patientProfiles').doc(appointment.patientId);
                const patientDoc = await transaction.get(patientRef);
                
                if (!patientDoc.exists) throw new Error("Patient profile not found.");
                
                const patientData = patientDoc.data();
                if (patientData.telehealthWalletBalance < cost) {
                    throw new Error("Insufficient funds for extension.");
                }

                // 1. Deduct from patient wallet
                transaction.update(patientRef, { telehealthWalletBalance: FieldValue.increment(-cost) });

                // 2. Update appointment end time
                const appointmentRef = db.collection('appointments').doc(appointmentId);
                const newEndTime = new Date(appointment.scheduledEndTime.toDate().getTime() + 30 * 60000); // Add 30 minutes
                transaction.update(appointmentRef, {
                    scheduledEndTime: newEndTime,
                    extensionGranted: true // Prevent further extensions
                });
            });

            const updatedAppointment = await AppointmentModel.getById(appointmentId);
            const roomName = `appointment_${appointmentId}`;
            io.to(roomName).emit('extensionConfirmed', { 
                message: 'Appointment extended by 30 minutes.',
                newEndTime: updatedAppointment.scheduledEndTime 
            });

        } catch (error) {
            console.error('Error accepting extension:', error);
            const roomName = `appointment_${appointmentId}`;
            io.to(roomName).emit('extensionError', { message: error.message || 'Failed to process extension.' });
        }
    },

    // --- REST API Methods ---
    
    getChatHistory: async (req, res) => {
        try {
            // This would list all appointments (past and upcoming) that can be used to enter a chat
            const appointments = await AppointmentModel.getByUserId(req.user.uid);
            res.status(200).json({ success: true, data: appointments });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to fetch chat history.' });
        }
    },

    getMessagesForPastAppointment: async (req, res) => {
        try {
            const { appointmentId } = req.params;
            const appointment = await AppointmentModel.getById(appointmentId);
            if (appointment.patientId !== req.user.uid && appointment.doctorId !== req.user.uid) {
                return res.status(403).json({ success: false, message: 'Unauthorized.' });
            }
            const messages = await MessageModel.getMessagesForAppointment(appointmentId);
            res.status(200).json({ success: true, data: messages });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to fetch messages.' });
        }
    }
};

module.exports = ChatController;
