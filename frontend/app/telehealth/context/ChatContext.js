import React, { createContext, useContext, useEffect, useReducer, useRef } from 'react';
import io from 'socket.io-client';
import { format } from 'date-fns';

const ChatContext = createContext();

const initialState = {
  currentAppointment: null,
  messages: [],
  isTyping: false,
  typingUser: null,
  onlineUsers: [],
  extensionRequested: false,
  extensionStatus: null, // 'pending', 'accepted', 'rejected'
  chatAccess: {
    allowed: false,
    reason: '',
    appointment: null
  }
};

function chatReducer(state, action) {
  switch (action.type) {
    case 'SET_APPOINTMENT':
      return { ...state, currentAppointment: action.payload };
    case 'SET_MESSAGES':
      return { ...state, messages: action.payload };
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] };
    case 'SET_TYPING':
      return { ...state, isTyping: true, typingUser: action.payload };
    case 'STOP_TYPING':
      return { ...state, isTyping: false, typingUser: null };
    case 'SET_ONLINE_USERS':
      return { ...state, onlineUsers: action.payload };
    case 'REQUEST_EXTENSION':
      return { ...state, extensionRequested: true, extensionStatus: 'pending' };
    case 'RESOLVE_EXTENSION':
      return { ...state, extensionStatus: action.payload };
    case 'SET_CHAT_ACCESS':
      return { ...state, chatAccess: action.payload };
    default:
      return state;
  }
}

export const ChatProvider = ({ children, token }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!token) return;

    // Initialize socket connection
    socketRef.current = io(process.env.REACT_APP_BACKEND_URL, {
      auth: { token },
      transports: ['websocket']
    });

    // Event listeners
    socketRef.current.on('connect', () => {
      console.log('Socket connected');
    });

    socketRef.current.on('chatAccess', (data) => {
      dispatch({ type: 'SET_CHAT_ACCESS', payload: data });
      if (data.allowed) {
        dispatch({ type: 'SET_APPOINTMENT', payload: data.appointment });
      }
    });

    socketRef.current.on('newMessage', (message) => {
      dispatch({ type: 'ADD_MESSAGE', payload: message });
    });

    socketRef.current.on('typing', ({ userName }) => {
      dispatch({ type: 'SET_TYPING', payload: userName });
    });

    socketRef.current.on('stopTyping', () => {
      dispatch({ type: 'STOP_TYPING' });
    });

    socketRef.current.on('updateOnlineUsers', (userIds) => {
      dispatch({ type: 'SET_ONLINE_USERS', payload: userIds });
    });

    socketRef.current.on('extensionRequested', () => {
      dispatch({ type: 'REQUEST_EXTENSION' });
    });

    socketRef.current.on('extensionConfirmed', () => {
      dispatch({ type: 'RESOLVE_EXTENSION', payload: 'accepted' });
    });

    socketRef.current.on('extensionError', () => {
      dispatch({ type: 'RESOLVE_EXTENSION', payload: 'rejected' });
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [token]);

  const joinAppointmentRoom = (appointmentId) => {
    socketRef.current.emit('joinAppointmentRoom', appointmentId);
  };

  const sendMessage = (textContent) => {
    if (!state.chatAccess.allowed || !textContent.trim()) return;
    
    socketRef.current.emit('sendMessage', {
      appointmentId: state.currentAppointment.id,
      textContent: textContent.trim()
    });
  };

  const startTyping = () => {
    socketRef.current.emit('typing', { 
      appointmentId: state.currentAppointment.id 
    });
  };

  const stopTyping = () => {
    socketRef.current.emit('stopTyping', { 
      appointmentId: state.currentAppointment.id 
    });
  };

  const requestExtension = () => {
    socketRef.current.emit('requestExtension', { 
      appointmentId: state.currentAppointment.id 
    });
  };

  const acceptExtension = () => {
    socketRef.current.emit('acceptExtension', { 
      appointmentId: state.currentAppointment.id 
    });
  };

  return (
    <ChatContext.Provider
      value={{
        ...state,
        joinAppointmentRoom,
        sendMessage,
        startTyping,
        stopTyping,
        requestExtension,
        acceptExtension
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);