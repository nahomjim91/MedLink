'use client'

import { useSearchParams } from "next/navigation";
import  MedicalChatInterface  from "../../components/ui/Chat";
import React, { useEffect, useRef, useState } from 'react';
import { useChat } from '../../context/ChatContext';
import { format } from 'date-fns';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';



export default function ChatPage() {
    const searchParams = useSearchParams();
      const appointmentId = searchParams.get("appointmentId");
    return <ChatContainer appointmentId={appointmentId} />;
    // return <MedicalChatInterface appointmentId={appointmentId} />;
}



const ChatContainer = ({ appointmentId }) => {
  const { 
    chatAccess, 
    joinAppointmentRoom, 
    currentAppointment,
    messages,
    isTyping,
    extensionRequested,
    extensionStatus
  } = useChat();
  
  const messagesEndRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Join room when appointmentId changes
  useEffect(() => {
    if (appointmentId && !isInitialized) {
      joinAppointmentRoom(appointmentId);
      setIsInitialized(true);
    }
  }, [appointmentId, joinAppointmentRoom, isInitialized]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!chatAccess.allowed) {
    return <ChatAccessDenied reason={chatAccess.reason} />;
  }

  if (!currentAppointment) {
    return <div className="p-4 text-center">Loading chat...</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-white border rounded-lg shadow-md">
      <ChatHeader appointment={currentAppointment} />
      
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        <MessageList 
          messages={messages} 
          currentUserId={chatAccess.appointment.patientId} 
        />
        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>
      
      <MessageInput />
      
      {extensionRequested && extensionStatus === 'pending' && (
        <ExtensionRequest />
      )}
      
      {extensionStatus === 'accepted' && (
        <div className="bg-green-100 p-3 text-green-800">
          Appointment extended by 30 minutes!
        </div>
      )}
      
      {extensionStatus === 'rejected' && (
        <div className="bg-red-100 p-3 text-red-800">
          Extension request failed
        </div>
      )}
    </div>
  );
};

const MessageList = ({ messages, currentUserId }) => {
  return (
    <div className="space-y-3">
      {messages.map((message) => (
        <div 
          key={message.id} 
          className={`flex ${message.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}
        >
          <div 
            className={`max-w-xs md:max-w-md p-3 rounded-lg ${
              message.senderId === currentUserId 
                ? 'bg-indigo-500 text-white rounded-br-none' 
                : 'bg-gray-200 text-gray-800 rounded-bl-none'
            }`}
          >
            <p>{message.textContent}</p>
            <p className={`text-xs mt-1 ${message.senderId === currentUserId ? 'text-indigo-100' : 'text-gray-500'}`}>
              {format(new Date(message.createdAt), 'HH:mm')}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

const MessageInput = () => {
  const [message, setMessage] = useState('');
  const { sendMessage, startTyping, stopTyping, chatAccess } = useChat();
  const typingTimeout = useRef(null);

  const handleChange = (e) => {
    setMessage(e.target.value);
    
    // Typing indicators
    if (e.target.value && chatAccess.allowed) {
      startTyping();
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => {
        stopTyping();
      }, 3000);
    } else {
      stopTyping();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && chatAccess.allowed) {
      sendMessage(message);
      setMessage('');
      stopTyping();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
    };
  }, []);

  if (!chatAccess.allowed) return null;

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t">
      <div className="flex">
        <input
          type="text"
          value={message}
          onChange={handleChange}
          placeholder="Type your message..."
          className="flex-1 border rounded-l-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
        <button 
          type="submit"
          className="bg-indigo-600 text-white px-4 rounded-r-lg hover:bg-indigo-700 transition"
        >
          Send
        </button>
      </div>
    </form>
  );
};

const TypingIndicator = () => {
  const { typingUser } = useChat();
  
  if (!typingUser) return null;
  
  return (
    <div className="flex items-center text-gray-500 text-sm italic">
      <div className="flex space-x-1">
        <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></div>
        <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
      </div>
      <span className="ml-2">{typingUser} is typing...</span>
    </div>
  );
};


const ExtensionRequest = () => {
  const { acceptExtension } = useChat();

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-yellow-700">
            <strong>Extension Requested!</strong> The other party wants to extend this appointment by 30 minutes.
          </p>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={acceptExtension}
            className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
};

const ChatAccessDenied = ({ reason }) => {
  return (
    <div className="p-8 max-w-md mx-auto text-center">
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
        <strong className="font-bold">Chat Access Restricted</strong>
        <p className="mt-2">{reason || "You don't have permission to access this chat"}</p>
      </div>
      
      <div className="mt-6">
        <h3 className="font-medium text-lg mb-2">Possible reasons:</h3>
        <ul className="text-left list-disc pl-5 space-y-1">
          <li>The appointment hasn&#39;t started yet</li>
          <li>The appointment has already ended</li>
          <li>You&apos;re not part of this appointment</li>
          <li>The appointment was canceled</li>
        </ul>
      </div>
    </div>
  );
};

const AppointmentHistory = () => {
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const { token } = useAuth();

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const response = await axios.get('/api/chat/history', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAppointments(response.data.data);
      } catch (error) {
        console.error('Failed to fetch appointments:', error);
      }
    };

    fetchAppointments();
  }, [token]);

  return (
    <div className="flex h-screen">
      {/* Appointment List */}
      <div className="w-1/3 border-r overflow-y-auto">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold">Appointment History</h2>
        </div>
        
        <ul className="divide-y">
          {appointments.map(appointment => (
            <li 
              key={appointment.id}
              className={`p-4 cursor-pointer hover:bg-gray-50 ${
                selectedAppointment?.id === appointment.id ? 'bg-blue-50' : ''
              }`}
              onClick={() => setSelectedAppointment(appointment)}
            >
              <div className="flex justify-between">
                <span className="font-medium">
                  {appointment.patientName} & {appointment.doctorName}
                </span>
                <span className={`text-sm px-2 py-1 rounded ${
                  appointment.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                  appointment.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {appointment.status}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                {new Date(appointment.scheduledStartTime).toLocaleString()} - 
                {new Date(appointment.scheduledEndTime).toLocaleTimeString()}
              </p>
            </li>
          ))}
        </ul>
      </div>
      
      {/* Chat Container */}
      <div className="flex-1">
        {selectedAppointment ? (
          <ChatContainer appointmentId={selectedAppointment.id} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Select an appointment to view chat history
          </div>
        )}
      </div>
    </div>
  );
};


const ChatHeader = ({ appointment }) => {
  const { onlineUsers } = useChat();
  
  // Determine if other user is online
  const otherUserId = appointment.patientId === user.uid ? 
    appointment.doctorId : appointment.patientId;
  
  const isOnline = onlineUsers.includes(otherUserId);

  return (
    <div className="bg-indigo-600 text-white p-4 flex justify-between items-center">
      <div>
        <h2 className="text-lg font-bold">
          {appointment.patientName} & {appointment.doctorName}
        </h2>
        <p className="text-sm opacity-80">
          {new Date(appointment.scheduledStartTime).toLocaleString()}
        </p>
      </div>
      <div className="flex items-center">
        <span className={`h-3 w-3 rounded-full mr-2 ${isOnline ? 'bg-green-400' : 'bg-gray-400'}`}></span>
        <span className="text-sm">{isOnline ? 'Online' : 'Offline'}</span>
      </div>
    </div>
  );
};