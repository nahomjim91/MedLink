// contexts/AppointmentChatContext.js
'use client';

import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { useAppointmentChat } from '../hooks/useAppointmentChat';
import { auth } from '../api/firebase/config';

const AppointmentChatContext = createContext();

export const useAppointmentChatContext = () => {
  const context = useContext(AppointmentChatContext);
  if (!context) {
    throw new Error('useAppointmentChatContext must be used within an AppointmentChatProvider');
  }
  return context;
};

export const AppointmentChatProvider = ({ children }) => {
  const chat = useAppointmentChat();
  
  // Additional state for UI management
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [messageHistory, setMessageHistory] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});

  const telehealthBackendUrl = 'http://localhost:4002';
  const [token, setToken] = useState(null);

  // Get the current user token
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        user
          .getIdToken()
          .then((token) => {
            setToken(token);
          })
          .catch((error) => {
            console.error("Error getting token:", error);
            setError("Failed to authenticate");
            setToken(null);
          });
      } else {
        setToken(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Enhanced message sending with optimistic updates
  const sendMessageWithOptimisticUpdate = useCallback(async (appointmentId, textContent) => {
    if (!chat.chatAccess.allowed) {
      setError("Chat is not accessible at this time");
      return;
    }

    // Create optimistic message
    const optimisticMessage = {
      messageId: `temp-${Date.now()}`,
      senderId: auth.currentUser?.uid,
      appointmentId,
      textContent,
      createdAt: new Date(),
      status: 'sending',
      isOptimistic: true
    };

    // Add optimistic message immediately
    chat.setMessages(prev => [...prev, optimisticMessage]);

    try {
      // Send message via socket
      chat.sendMessage(appointmentId, textContent);
      
      // Update message history
      setMessageHistory(prev => ({
        ...prev,
        [appointmentId]: [...(prev[appointmentId] || []), optimisticMessage]
      }));

    } catch (error) {
      console.error('Error sending message:', error);
      
      // Remove optimistic message on error
      chat.setMessages(prev => prev.filter(msg => msg.messageId !== optimisticMessage.messageId));
      
      // Update message status to failed
      const failedMessage = { 
        ...optimisticMessage, 
        status: 'failed',
        error: error.message 
      };
      
      chat.setMessages(prev => [...prev.filter(msg => msg.messageId !== optimisticMessage.messageId), failedMessage]);
      
      setError("Failed to send message");
    }
  }, [chat, token]);

  // Fetch message history for past appointments
const fetchMessageHistory = useCallback(async (appointmentId) => {
  setIsLoading(true);
  setError(null);

  try {
    const response = await fetch(`${telehealthBackendUrl}/api/chat/messages/${appointmentId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch message history');
    }

    const result = await response.json();
    const messages = result.data || [];

    // Update message history
    setMessageHistory(prev => ({
      ...prev,
      [appointmentId]: messages,
    }));
console.log('✅ Message history fetched:', messages);
    return messages;
  } catch (error) {
    console.error('❌ Error fetching message history:', error);
    setError("Failed to load message history");
    return [];
  } finally {
    setIsLoading(false);
  }
}, [token]);


  // Fetch chat history (all appointments)
  const fetchChatHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${telehealthBackendUrl}/api/chat/history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch chat history');
      }

      const result = await response.json();
      console.log('✅ Chat history fetched:', result.data);
      return result.data || [];
    } catch (error) {
      console.error('Error fetching chat history:', error);
      setError("Failed to load chat history");
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // Join appointment with error handling
  const joinAppointmentWithHandling = useCallback(async (appointmentId) => {
    setIsLoading(true);
    setError(null);

    try {
      if (!chat.isConnected) {
        throw new Error("Not connected to chat server");
      }

      chat.joinAppointmentRoom(appointmentId);
      
      // Wait for chat access response (with timeout)
      const timeout = setTimeout(() => {
        setError("Timeout waiting for chat access");
        setIsLoading(false);
      }, 10000);

      // Listen for chat access update
      const checkAccess = () => {
        if (chat.chatAccess.allowed || chat.chatAccess.reason) {
          clearTimeout(timeout);
          setIsLoading(false);
          
          if (!chat.chatAccess.allowed) {
            setError(chat.chatAccess.reason);
          }
        }
      };

      // Check immediately and set up polling
      checkAccess();
      const interval = setInterval(checkAccess, 500);
      
      // Cleanup
      setTimeout(() => {
        clearInterval(interval);
        clearTimeout(timeout);
      }, 10000);

    } catch (error) {
      console.error('Error joining appointment:', error);
      setError(error.message);
      setIsLoading(false);
    }
  }, [chat]);

  // Handle extension request with confirmation
  const handleExtensionRequest = useCallback(async (appointmentId, showConfirmation = true) => {
    try {
      if (showConfirmation) {
        const confirmed = window.confirm(
          "Do you want to request a 30-minute extension for this appointment? " +
          "The other party will need to approve this request, and it may incur additional charges."
        );
        
        if (!confirmed) {
          return false;
        }
      }

      chat.requestExtension(appointmentId);
      return true;
    } catch (error) {
      console.error('Error requesting extension:', error);
      setError("Failed to send extension request");
      return false;
    }
  }, [chat]);

  // Handle extension acceptance with wallet check info
  const handleExtensionAcceptance = useCallback(async (appointmentId, showConfirmation = true) => {
    try {
      if (showConfirmation) {
        const confirmed = window.confirm(
          "Do you want to accept the 30-minute extension? " +
          "This will extend the appointment and may charge the patient's wallet."
        );
        
        if (!confirmed) {
          chat.declineExtension(appointmentId);
          return false;
        }
      }

      chat.acceptExtension(appointmentId);
      return true;
    } catch (error) {
      console.error('Error accepting extension:', error);
      setError("Failed to process extension");
      return false;
    }
  }, [chat]);

  // Retry failed message
  const retryMessage = useCallback(async (failedMessage) => {
    if (failedMessage.status === 'failed') {
      // Remove failed message
      chat.setMessages(prev => prev.filter(msg => msg.messageId !== failedMessage.messageId));
      
      // Resend message
      await sendMessageWithOptimisticUpdate(failedMessage.appointmentId, failedMessage.textContent);
    }
  }, [chat, sendMessageWithOptimisticUpdate]);
  

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Auto-connect when token is available
  useEffect(() => {
    if (!chat.isConnected && token && !isLoading) {
      console.log("Auto-connecting to telehealth chat...");
    }
  }, [chat.isConnected, token, isLoading]);

  // Clean up message history on disconnect
  useEffect(() => {
    if (!chat.isConnected) {
      setMessageHistory({});
      setUnreadCounts({});
    }
  }, [chat.isConnected]);

  // Sound effects for notifications
  const playMessageSound = useCallback(() => {
    try {
      const audio = new Audio('/sounds/message.mp3');
      audio.volume = 0.3;
      audio.play().catch(e => console.log('Cannot play message sound:', e));
    } catch (error) {
      console.log('Message sound not available');
    }
  }, []);

  const playExtensionSound = useCallback(() => {
    try {
      const audio = new Audio('/sounds/extension.mp3');
      audio.volume = 0.5;
      audio.play().catch(e => console.log('Cannot play extension sound:', e));
    } catch (error) {
      console.log('Extension sound not available');
    }
  }, []);

  // Play sounds for events
  useEffect(() => {
    if (chat.messages.length > 0) {
      const lastMessage = chat.messages[chat.messages.length - 1];
      if (lastMessage.senderId !== auth.currentUser?.uid && !lastMessage.isOptimistic) {
        playMessageSound();
      }
    }
  }, [chat.messages, playMessageSound]);

  useEffect(() => {
    if (chat.extensionRequested) {
      playExtensionSound();
    }
  }, [chat.extensionRequested, playExtensionSound]);

  // Request notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('Notification permission:', permission);
      });
    }
  }, []);

  const value = {
    // Original chat functionality
    ...chat,
    
    // Enhanced state
    isLoading,
    error,
    messageHistory,
    unreadCounts,
    
    // Enhanced functions
    sendMessage: sendMessageWithOptimisticUpdate,
    joinAppointmentRoom: joinAppointmentWithHandling,
    fetchMessageHistory,
    fetchChatHistory,
    
    // Extension helpers
    handleExtensionRequest,
    handleExtensionAcceptance,
    
    // Utility functions
    retryMessage,
    clearError,
    playMessageSound,
    playExtensionSound,
    
    // State setters
    setError,
    setIsLoading,
    setMessageHistory,
    setUnreadCounts,
  };

  return (
    <AppointmentChatContext.Provider value={value}>
      {children}
    </AppointmentChatContext.Provider>
  );
};