// contexts/SocketContext.js
'use client';

import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { useSocket } from '../hooks/useSocket';
import { auth } from '../api/firebase/config';

const SocketContext = createContext();

export const useSocketContext = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocketContext must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const socket = useSocket();
  const [messages, setMessages] = useState([]);
  const [chats, setChats] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const chatBackendUrl = 'http://localhost:4001';
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
            setToken(null);
          });
      } else {
        setToken(null);
      }
    });
    return () => unsubscribe();
  });

  // Handle new messages
  useEffect(() => {
    if (!socket.socket) return;

    const handleNewMessage = (data) => {
      console.log('📨 New message received:', data);
      
      // Add message to current messages if it's for the active chat
      setMessages(prev => {
        // Check if message is for current active chat
        const isCurrentChat = data.message && 
          (data.message.from === data.from || data.message.to === data.from);
        
        if (isCurrentChat) {
          return [...prev, data.message];
        }
        return prev;
      });

      // Update chats list to reorder and update unread counts
      refreshChats();
      updateUnreadCount();
    };

    const handleMessageNotification = (data) => {
      console.log('🔔 Message notification:', data);
      
      // Show notification for messages not in current active chat
      // You can integrate with browser notifications here
      updateUnreadCount();
    };

    const handleMessagesSeen = (data) => {
      console.log('👁️ Messages seen:', data);
      
      // Update message seen status
      setMessages(prev => prev.map(msg => 
        data.messageIds.includes(msg.id) 
          ? { ...msg, isSeen: true, seenBy: data.seenBy }
          : msg
      ));
    };

    // Subscribe to events
    const unsubscribeNewMessage = socket.onNewMessage(handleNewMessage);
    const unsubscribeNotification = socket.onMessageNotification(handleMessageNotification);
    const unsubscribeMessagesSeen = socket.onMessagesSeen(handleMessagesSeen);

    return () => {
      unsubscribeNewMessage?.();
      unsubscribeNotification?.();
      unsubscribeMessagesSeen?.();
    };
  }, [socket.socket]);

  // API calls for chat functionality
  const sendMessage = async (chatId, textContent , messageProductId, messageOrderId) => {
    try {
      const response = await fetch(`${chatBackendUrl}/api/chat/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ textContent , messageProductId, messageOrderId, to: chatId }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const result = await response.json();
      
      // Emit to socket after successful save
      socket.sendMessage(chatId, result.message);
      
      // Add to local messages
      setMessages(prev => [...prev, result.message]);
      
      return result.message;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  const fetchMessages = async (chatId, limit = 20, before = null) => {
    try {
      const params = new URLSearchParams({ 
        chatId, 
        limit: limit.toString() 
      });
      
      if (before) params.append('before', before);

      const response = await fetch(`${chatBackendUrl}/api/chat/messages?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  };

  const loadMessages = async (chatId, replace = true) => {
    try {
      const newMessages = await fetchMessages(chatId);
      
      if (replace) {
        setMessages(newMessages);
      } else {
        // For pagination - prepend older messages
        setMessages(prev => [...newMessages, ...prev]);
      }
      
      return newMessages;
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const refreshChats = async () => {
    try {
      const response = await fetch(`${chatBackendUrl}/api/chat/chats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch chats');
      }

      const result = await response.json();
      setChats(result.data || []);
    } catch (error) {
      console.error('Error fetching chats:', error);
    }
  };

  const updateUnreadCount = async () => {
    try {
      const response = await fetch(`${chatBackendUrl}/api/chat/unread-count`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch unread count');
      }

      const result = await response.json();
      setUnreadCount(result.data || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const markMessagesAsSeen = async (chatId) => {
    try {
      const response = await fetch(`${chatBackendUrl}/api/chat/mark-seen`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ chatId }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark messages as seen');
      }

      // Update local state
      setMessages(prev => prev.map(msg => 
        msg.from === chatId ? { ...msg, isSeen: true } : msg
      ));

      // Emit to socket
      const unseenMessageIds = messages
        .filter(msg => msg.from === chatId && !msg.isSeen)
        .map(msg => msg.id);
      
      if (unseenMessageIds.length > 0) {
        socket.markMessagesSeen(chatId, unseenMessageIds);
      }

      updateUnreadCount();
    } catch (error) {
      console.error('Error marking messages as seen:', error);
    }
  };

  const joinChatRoom = useCallback((chatId) => {
    socket.joinChat(chatId);
    // Load messages when joining a chat
    loadMessages(chatId);
  }, [socket]);

  const leaveChatRoom = useCallback((chatId) => {
    socket.leaveChat(chatId);
  }, [socket]);

  // Initialize chats and unread count when connected
  useEffect(() => {
    if (socket.isConnected) {
      refreshChats();
      updateUnreadCount();
    }
  }, [socket.isConnected]);

  const value = {
    // Socket state
    ...socket,
    
    // Chat data
    messages,
    chats,
    unreadCount,
    
    // Chat functions
    sendMessage,
    loadMessages,
    refreshChats,
    updateUnreadCount,
    markMessagesAsSeen,
    joinChatRoom,
    leaveChatRoom,
    
    // State setters (for direct manipulation if needed)
    setMessages,
    setChats,
    setUnreadCount,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
