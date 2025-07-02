// contexts/ChatContext.js
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { io } from "socket.io-client";
import { auth } from "../api/firebase/config";
import { useAuthState } from "react-firebase-hooks/auth";

const ChatContext = createContext();

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const [user] = useAuthState(auth);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [messages, setMessages] = useState({});
  const [chatRooms, setChatRooms] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState({});
  const [chatAccess, setChatAccess] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const socketRef = useRef(null);
  const typingTimeoutRef = useRef({});
  const telehealthBackendUrl = "http://localhost:4002";
  const [token, setToken] = useState(null);

  // Get the current user token
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        user
          .getIdToken()
          .then((token) => {
            setToken(token);
            // console.log("Token:", token);
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

  // Initialize socket connection
  useEffect(() => {
    if (!user) {
      // Disconnect socket if user logs out
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const initializeSocket = async () => {
      try {
        console.log("Initializing socket...", "Token:", token);
        const newSocket = io(
          process.env.NEXT_PUBLIC_SOCKET_URL || telehealthBackendUrl,
          {
            auth: {
              token: token,
            },
            autoConnect: true,
          }
        );

        socketRef.current = newSocket;
        setSocket(newSocket);

        // Connection event listeners
        newSocket.on("connect", () => {
          console.log("🔌 Socket connected:", newSocket.id);
          setIsConnected(true);
          setError(null);
        });

        newSocket.on("disconnect", (reason) => {
          console.log("🔌 Socket disconnected:", reason);
          setIsConnected(false);
        });

        newSocket.on("connect_error", (error) => {
          console.error("🔌 Socket connection error:", error);
          setError("Failed to connect to chat server");
          setIsConnected(false);
        });

        // Chat event listeners
        setupChatEventListeners(newSocket);
      } catch (error) {
        console.error("Error initializing socket:", error);
        setError("Failed to initialize chat connection");
      }
    };

    initializeSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [token, user]);

  // Setup chat event listeners
  const setupChatEventListeners = (socket) => {
    // Chat access and room events
    socket.on("chatAccess", (data) => {
      console.log("📝 Chat access:", data);
      setChatAccess(data);
      if (data.roomId) {
        setCurrentRoom({
          roomId: data.roomId,
          appointmentId: data.appointmentId,
          canSendMessages: data.canSendMessages,
        });
      }
    });

    socket.on("chatHistory", (data) => {
      console.log("📚 Chat history received:", data);
      setMessages((prev) => ({
        ...prev,
        [data.appointmentId]: data.messages || [],
      }));
      console.log("📚 Chat setMessages received:", messages);
    });

    // Message events
    socket.on("newMessage", (message) => {
      console.log("💬 New message:", message);
      setMessages((prev) => ({
        ...prev,
        [message.appointmentId]: [
          ...(prev[message.appointmentId] || []),
          message,
        ],
      }));

      // Update unread count if message is not from current user
      if (message.senderId !== user?.uid) {
        setUnreadCounts((prev) => ({
          ...prev,
          [message.appointmentId]: (prev[message.appointmentId] || 0) + 1,
        }));
      }
    });

    socket.on("messageEdited", (data) => {
      console.log("✏️ Message edited:", data);
      setMessages((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((appointmentId) => {
          updated[appointmentId] = updated[appointmentId].map((msg) =>
            msg.messageId === data.messageId
              ? {
                  ...msg,
                  textContent: data.newContent,
                  editedAt: data.editedAt,
                }
              : msg
          );
        });
        return updated;
      });
    });

    socket.on("messageDeleted", (data) => {
      console.log("🗑️ Message deleted:", data);
      setMessages((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((appointmentId) => {
          updated[appointmentId] = updated[appointmentId].filter(
            (msg) => msg.messageId !== data.messageId
          );
        });
        return updated;
      });
    });

    socket.on("fileShared", (data) => {
      console.log("📎 File shared:", data);
      // File messages are handled by newMessage event
    });

    // Listen for the actual event your server emits
    socket.on("updateOnlineUsers", (users) => {
      console.log("👥 Online users update:", users);
      const onlineUserIds = users.map((user) => user.userId);
      setOnlineUsers(new Set(onlineUserIds));

      // Update chat rooms with online status
      setChatRooms((prev) =>
        prev.map((chat) => {
          if (!chat.doctorId || !chat.patientId) return chat;

          const isDoctorOnline = onlineUserIds.includes(chat.doctorId);
          const isPatientOnline = onlineUserIds.includes(chat.patientId);

          return {
            ...chat,
            isOnline: isDoctorOnline || isPatientOnline,
          };
        })
      );
    });
    // Listen for individual user online status updates
socket.on('onlineStatusUpdate', (statusMap) => {
  console.log('📊 Online status update:', statusMap);

  // Update online users set
  setOnlineUsers(prev => {
    const updated = new Set(prev);
    Object.entries(statusMap).forEach(([userId, isOnline]) => {
      if (isOnline) {
        updated.add(userId);
      } else {
        updated.delete(userId);
      }
    });
    return updated;
  });

  // Update chat rooms based on status map
  setChatRooms(prev =>
    prev.map(chat => {
      if (!chat.doctorId || !chat.patientId) return chat;
      
      const isDoctorOnline = statusMap[chat.doctorId] === true;
      const isPatientOnline = statusMap[chat.patientId] === true;
      
      return {
        ...chat,
        isOnline: isDoctorOnline || isPatientOnline,
      };
    })
  );
});
    socket.on("userOnlineStatusChanged", (data) => {
      console.log("👤 User online status changed:", data);

      // Update online users set
      setOnlineUsers((prev) => {
        const updated = new Set(prev);
        if (data.isOnline) {
          updated.add(data.userId);
        } else {
          updated.delete(data.userId);
        }
        return updated;
      });

      // Update chat rooms with new online status
      setChatRooms((prev) =>
        prev.map((chat) => {
          const isDoctorOnline =
            data.userId === chat.doctorId
              ? data.isOnline
              : chat.doctorId
              ? prev.some((c) => c.userId === chat.doctorId)
              : false;
          const isPatientOnline =
            data.userId === chat.patientId
              ? data.isOnline
              : chat.patientId
              ? prev.some((c) => c.userId === chat.patientId)
              : false;

          return {
            ...chat,
            isOnline: isDoctorOnline || isPatientOnline,
          };
        })
      );
    });

    // Typing events
    socket.on("userTyping", (data) => {
      setTypingUsers((prev) => ({
        ...prev,
        [data.appointmentId]: {
          ...prev[data.appointmentId],
          [data.userId]: {
            userName: data.userName,
            timestamp: Date.now(),
          },
        },
      }));

      // Clear typing indicator after 3 seconds
      if (typingTimeoutRef.current[data.userId]) {
        clearTimeout(typingTimeoutRef.current[data.userId]);
      }

      typingTimeoutRef.current[data.userId] = setTimeout(() => {
        setTypingUsers((prev) => {
          const updated = { ...prev };
          if (updated[data.appointmentId]) {
            delete updated[data.appointmentId][data.userId];
            if (Object.keys(updated[data.appointmentId]).length === 0) {
              delete updated[data.appointmentId];
            }
          }
          return updated;
        });
      }, 3000);
    });

    socket.on("userStoppedTyping", (data) => {
      setTypingUsers((prev) => {
        const updated = { ...prev };
        if (updated[data.appointmentId]) {
          delete updated[data.appointmentId][data.userId];
          if (Object.keys(updated[data.appointmentId]).length === 0) {
            delete updated[data.appointmentId];
          }
        }
        return updated;
      });

      if (typingTimeoutRef.current[data.userId]) {
        clearTimeout(typingTimeoutRef.current[data.userId]);
        delete typingTimeoutRef.current[data.userId];
      }
    });

    // Extension events
    socket.on("extensionRequested", (data) => {
      console.log("⏰ Extension requested:", data);
      // Handle extension request UI
    });

    socket.on("extensionConfirmed", (data) => {
      console.log("✅ Extension confirmed:", data);
      // Handle extension confirmation UI
    });

    socket.on("systemMessage", (data) => {
      console.log("🔔 System message:", data);
      // Handle system messages
    });

    // Read receipts
    socket.on("messagesMarkedAsRead", (data) => {
      console.log("👁️ Messages marked as read:", data);
    });

    // Error handling
    socket.on("error", (data) => {
      console.error("❌ Socket error:", data);
      setError(data.message || "An error occurred");
    });

    socket.on("extensionError", (data) => {
      console.error("❌ Extension error:", data);
      setError(data.message || "Extension request failed");
    });
  };

  // Join appointment room
  const joinAppointmentRoom = useCallback(
    (appointmentId) => {
      if (!socket || !appointmentId) return;

      console.log("🚪 Joining appointment room:", appointmentId);
      socket.emit("joinAppointmentRoom", appointmentId);
    },
    [socket]
  );

  // Send text message
  const sendMessage = useCallback(
    (appointmentId, textContent) => {
      if (!socket || !appointmentId || !textContent?.trim()) return;

      console.log("💬 Sending message:", { appointmentId, textContent });
      socket.emit("sendMessage", {
        appointmentId,
        textContent: textContent.trim(),
      });
    },
    [socket]
  );

  // Send typing indicator
  const sendTypingIndicator = useCallback(
    (appointmentId, isTyping) => {
      if (!socket || !appointmentId) return;

      socket.emit("typing", { appointmentId, isTyping });
    },
    [socket]
  );

  // Share file
  const shareFile = useCallback(
    (appointmentId, fileData) => {
      if (!socket || !appointmentId || !fileData) return;

      console.log("📎 Sharing file:", { appointmentId, fileData });
      socket.emit("fileShare", { appointmentId, fileData });
    },
    [socket]
  );

  // Mark messages as read
  const markMessagesAsRead = useCallback(
    (messageIds) => {
      if (!socket || !Array.isArray(messageIds) || messageIds.length === 0)
        return;

      console.log("👁️ Marking messages as read:", messageIds);
      socket.emit("markAsRead", { messageIds });

      // Update local unread counts
      setUnreadCounts((prev) => {
        const updated = { ...prev };
        // This is simplified - you might want to track which messages belong to which appointment
        Object.keys(updated).forEach((appointmentId) => {
          updated[appointmentId] = Math.max(
            0,
            updated[appointmentId] - messageIds.length
          );
        });
        return updated;
      });
    },
    [socket]
  );

  // Edit message
  const editMessage = useCallback(
    (messageId, newContent, appointmentId) => {
      if (!socket || !messageId || !newContent?.trim() || !appointmentId)
        return;

      console.log("✏️ Editing message:", {
        messageId,
        newContent,
        appointmentId,
      });
      socket.emit("editMessage", {
        messageId,
        newContent: newContent.trim(),
        appointmentId,
      });
    },
    [socket]
  );

  // Delete message
  const deleteMessage = useCallback(
    (messageId, appointmentId) => {
      if (!socket || !messageId || !appointmentId) return;

      console.log("🗑️ Deleting message:", { messageId, appointmentId });
      socket.emit("deleteMessage", { messageId, appointmentId });
    },
    [socket]
  );

  // Request appointment extension
  const requestExtension = useCallback(
    (appointmentId) => {
      if (!socket || !appointmentId) return;

      console.log("⏰ Requesting extension:", appointmentId);
      socket.emit("requestExtension", { appointmentId });
    },
    [socket]
  );

  // Accept appointment extension
  const acceptExtension = useCallback(
    (appointmentId) => {
      if (!socket || !appointmentId) return;

      console.log("✅ Accepting extension:", appointmentId);
      socket.emit("acceptExtension", { appointmentId });
    },
    [socket]
  );

  // API methods for HTTP requests
  const api = useMemo(
    () => ({
      // Get chat history
      getChatHistory: async () => {
        try {
          setIsLoading(true);
          const response = await fetch(
            `${telehealthBackendUrl}/api/chat/history`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (!response.ok) throw new Error("Failed to fetch chat history");

          const data = await response.json();
          setChatRooms(data.data || []);
          console.log("📚 Chat history received:", data);
          return data.data;
        } catch (error) {
          console.error("Error fetching chat history:", error);
          setError("Failed to load chat history");
          throw error;
        } finally {
          setIsLoading(false);
        }
      },

      // Get messages for past appointment
      getMessagesForAppointment: async (appointmentId) => {
        try {
          setIsLoading(true);
          const response = await fetch(
            `${telehealthBackendUrl}/api/chat/messages/${appointmentId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (!response.ok) throw new Error("Failed to fetch messages");

          const data = await response.json();
          setMessages((prev) => ({
            ...prev,
            [appointmentId]: data.data.messages || [],
          }));
          return data.data;
        } catch (error) {
          console.error("Error fetching messages:", error);
          setError("Failed to load messages");
          throw error;
        } finally {
          setIsLoading(false);
        }
      },

      // Upload file
      uploadFile: async (file, appointmentId) => {
        try {
          setIsLoading(true);
          const formData = new FormData();
          formData.append("file", file);
          formData.append("appointmentId", appointmentId);

          const response = await fetch(
            `${telehealthBackendUrl}/api/chat/upload`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
              },
              body: formData,
            }
          );

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to upload file");
          }

          const data = await response.json();
          return data.data;
        } catch (error) {
          console.error("Error uploading file:", error);
          setError("Failed to upload file");
          throw error;
        } finally {
          setIsLoading(false);
        }
      },

      // Get chat statistics
      getChatStats: async () => {
        try {
          const response = await fetch(
            `${telehealthBackendUrl}/api/chat/stats`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (!response.ok) throw new Error("Failed to fetch chat stats");

          const data = await response.json();
          return data.data;
        } catch (error) {
          console.error("Error fetching chat stats:", error);
          throw error;
        }
      },
    }),
    [token, telehealthBackendUrl]
  );

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Leave current room
  const leaveRoom = useCallback(() => {
    setCurrentRoom(null);
    setChatAccess(null);
  }, []);

  // Get typing users for appointment
  const getTypingUsers = useCallback(
    (appointmentId) => {
      const typing = typingUsers[appointmentId] || {};
      return Object.entries(typing)
        .filter(([userId]) => userId !== user?.uid)
        .map(([userId, data]) => data.userName);
    },
    [typingUsers, user]
  );
  const checkOnlineStatus = useCallback(
    (userIds) => {
      if (!socket || !Array.isArray(userIds)) return;
      socket.emit("checkOnlineStatus", userIds);
    },
    [socket]
  );

  const value = {
    // Connection state
    socket,
    isConnected,
    isLoading,
    error,
    clearError,

    // Current session
    currentRoom,
    chatAccess,
    leaveRoom,

    // Messages and rooms
    messages,
    chatRooms,
    unreadCounts,

    // Typing indicators
    onlineUsers,
    checkOnlineStatus, // Add this new function
    typingUsers,
    getTypingUsers,

    // Socket methods
    joinAppointmentRoom,
    sendMessage,
    sendTypingIndicator,
    shareFile,
    markMessagesAsRead,
    editMessage,
    deleteMessage,
    requestExtension,
    acceptExtension,

    // API methods
    api,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  MessageCircle,
  Send,
  Check,
  Video,
  Clock,
  Calendar,
  User,
  ArrowLeft,
  Menu,
  Upload,
  FileText,
} from "lucide-react";
import { useChat } from "../../context/ChatContext";

const AppointmentStatus = {
  REQUESTED: "REQUESTED",
  CONFIRMED: "CONFIRMED",
  REJECTED: "REJECTED",
  CANCELLED_PATIENT: "CANCELLED_PATIENT",
  CANCELLED_DOCTOR: "CANCELLED_DOCTOR",
  UPCOMING: "UPCOMING",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  NO_SHOW: "NO_SHOW",
};

const MedicalChatInterface = ({ appointmentId }) => {
  const {
    // Connection state
    socket,
    isConnected,
    isLoading,
    error,
    clearError,

    // Current session
    currentRoom,
    chatAccess,
    leaveRoom,

    // Messages and rooms
    messages,
    checkOnlineStatus,
    chatRooms,
    unreadCounts,

    // Typing indicators
    getTypingUsers,

    // Socket methods
    joinAppointmentRoom,
    sendMessage,
    sendTypingIndicator,
    shareFile,
    markMessagesAsRead,
    editMessage,
    deleteMessage,
    requestExtension,
    acceptExtension,

    // API methods
    api,
  } = useChat();

  const [activeChat, setActiveChat] = useState(null);
  const [activeAppointment, setActiveAppointment] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [message, setMessage] = useState("");
  const [showChatDetails, setShowChatDetails] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const [userWentBack, setUserWentBack] = useState(false);

  // Auto-join appointment room if appointmentId is provided
  // Replace the existing useEffect that handles appointmentId joining
  useEffect(() => {
    if (appointmentId && socket && isConnected) {
      console.log("Joining appointment room:", appointmentId);
      joinAppointmentRoom(appointmentId);
      console.log("Joined appointment room:", appointmentId);
    }
  }, [appointmentId, socket, isConnected, joinAppointmentRoom]);

  useEffect(() => {
    // Only run if we have an appointmentId and chatRooms, don't already have an activeAppointment, and user didn't manually go back
    if (
      appointmentId &&
      chatRooms.length > 0 &&
      !activeAppointment &&
      !userWentBack
    ) {
      console.log("Setting active chat for appointment:", appointmentId);
      console.log("Available chat rooms:", chatRooms);

      // Find the chat room that contains this appointmentId
      const matchingChat = chatRooms.find((chat) => {
        // Check if chat has appointmentIds array and includes our appointmentId
        if (chat.appointmentIds && Array.isArray(chat.appointmentIds)) {
          return chat.appointmentIds.includes(appointmentId);
        }
        // Fallback: check if appointmentId matches directly
        return chat.appointmentId === appointmentId;
      });

      if (matchingChat) {
        console.log("Found matching chat:", matchingChat);
        setActiveChat(matchingChat);
        setShowChatDetails(true);

        // Create appointment object
        const appointment = {
          id: appointmentId,
          appointmentId: appointmentId,
          appointmentNumber:
            matchingChat.appointmentNumber || `#${appointmentId}`,
          date: matchingChat.appointmentDate || new Date().toLocaleDateString(),
          startTime: matchingChat.startTime || "12:00 PM",
          endTime: matchingChat.endTime || "12:30 PM",
          status: matchingChat.status || "CONFIRMED",
        };
        setActiveAppointment(appointment);
      } else {
        console.log("No matching chat found for appointmentId:", appointmentId);
        // If no matching chat found, create a basic appointment object
        const appointment = {
          id: appointmentId,
          appointmentId: appointmentId,
          appointmentNumber: `#${appointmentId}`,
          date: new Date().toLocaleDateString(),
          startTime: "12:00 PM",
          endTime: "12:30 PM",
          status: "IN_PROGRESS",
        };
        setActiveAppointment(appointment);
        setShowChatDetails(true);
      }
    }
  }, [appointmentId, chatRooms, activeAppointment, userWentBack]);

  // Add this separate useEffect to handle clearing states when appointmentId changes
  useEffect(() => {
    if (!appointmentId) {
      // Clear active states if no appointmentId
      setActiveChat(null);
      setActiveAppointment(null);
      setShowChatDetails(false);
    }
  }, [appointmentId]);

  useEffect(() => {
    const loadChatHistory = async () => {
      if (isLoading) return; // Prevent multiple calls

      try {
        console.log("Loading chat history...");
        await api.getChatHistory();
        console.log("Chat history loaded successfully");

        // After loading chat history, check online status for all participants
        if (chatRooms.length > 0) {
          const allParticipantIds = [];
          chatRooms.forEach((chat) => {
            if (chat.doctorId) allParticipantIds.push(chat.doctorId);
            if (chat.patientId) allParticipantIds.push(chat.patientId);
          });

          // Remove duplicates
          const uniqueIds = [...new Set(allParticipantIds)];
          if (uniqueIds.length > 0) {
            checkOnlineStatus(uniqueIds);
          }
        }
      } catch (error) {
        console.error("Failed to load chat history:", error);
      }
    };

    if (isConnected) {
      loadChatHistory();
    }
  }, [isConnected, api, chatRooms.length, checkOnlineStatus]);
  useEffect(() => {
    if (!isConnected || chatRooms.length === 0) return;

    const interval = setInterval(() => {
      const allParticipantIds = [];
      chatRooms.forEach((chat) => {
        if (chat.doctorId) allParticipantIds.push(chat.doctorId);
        if (chat.patientId) allParticipantIds.push(chat.patientId);
      });

      const uniqueIds = [...new Set(allParticipantIds)];
      if (uniqueIds.length > 0) {
        checkOnlineStatus(uniqueIds);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [isConnected, chatRooms, checkOnlineStatus]);

  // Filter chats based on search
  const filteredChats = chatRooms.filter(
    (chat) =>
      chat.doctorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.patientName?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeAppointment]);

  // Handle typing indicator
  const handleTypingStart = () => {
    if (activeAppointment && !isTyping) {
      setIsTyping(true);
      sendTypingIndicator(activeAppointment.appointmentId, true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      if (activeAppointment) {
        sendTypingIndicator(activeAppointment.appointmentId, false);
      }
    }, 1000);
  };

  const handleChatSelect = async (chat) => {
    setUserWentBack(false); // Reset the flag when user selects a chat
    setActiveChat(chat);
    setShowChatDetails(true);

    // Set the appointment as active
    if (chat.appointmentId) {
      const appointment = {
        id: chat.appointmentId,
        appointmentId: chat.appointmentId,
        appointmentNumber: chat.appointmentNumber || `#${chat.appointmentId}`,
        date: chat.appointmentDate || new Date().toLocaleDateString(),
        startTime: chat.startTime || "12:00 PM",
        endTime: chat.endTime || "12:30 PM",
        status: chat.status || "CONFIRMED",
      };
      setActiveAppointment(appointment);

      // Join the appointment room
      joinAppointmentRoom(chat.appointmentId);

      // Load messages for this appointment
      try {
        await api.getMessagesForAppointment(chat.appointmentId);

        // Mark messages as read
        const appointmentMessages = messages[chat.appointmentId] || [];
        const unreadMessageIds = appointmentMessages
          .filter((msg) => !msg.isRead && msg.senderId !== currentRoom?.userId)
          .map((msg) => msg.messageId);

        if (unreadMessageIds.length > 0) {
          markMessagesAsRead(unreadMessageIds);
        }
      } catch (error) {
        console.error("Failed to load messages:", error);
      }
    }
  };

  const handleBackToChats = () => {
    setUserWentBack(true); // Mark that user manually went back
    setShowChatDetails(false);
    setActiveChat(null);
    setActiveAppointment(null);
    leaveRoom();
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !activeAppointment || !chatAccess?.canSendMessages)
      return;

    try {
      // Send the message through socket
      sendMessage(activeAppointment.appointmentId, message.trim());
      setMessage("");

      // Stop typing indicator
      if (isTyping) {
        setIsTyping(false);
        sendTypingIndicator(activeAppointment.appointmentId, false);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !activeAppointment) return;

    try {
      setSelectedFile(file);

      // Upload file
      const uploadResult = await api.uploadFile(
        file,
        activeAppointment.appointmentId
      );

      // Share file through socket
      shareFile(activeAppointment.appointmentId, {
        fileUrl: uploadResult.fileUrl,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      });

      setSelectedFile(null);
    } catch (error) {
      console.error("Failed to upload file:", error);
      setSelectedFile(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case AppointmentStatus.CONFIRMED:
      case AppointmentStatus.UPCOMING:
        return "bg-blue-100 text-blue-800";
      case AppointmentStatus.IN_PROGRESS:
        return "bg-green-100 text-green-800";
      case AppointmentStatus.COMPLETED:
        return "bg-gray-100 text-gray-800";
      case AppointmentStatus.CANCELLED_PATIENT:
      case AppointmentStatus.CANCELLED_DOCTOR:
      case AppointmentStatus.REJECTED:
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

const canSendMessage = (status) => {
  return (
    status === AppointmentStatus.IN_PROGRESS && 
    chatAccess?.canSendMessages === true && 
    isConnected
  );
};

  const shouldShowVideoButton = (status) => {
    return status === AppointmentStatus.IN_PROGRESS;
  };

  const getStatusMessage = (status) => {
    switch (status) {
      case AppointmentStatus.CONFIRMED:
      case AppointmentStatus.UPCOMING:
        return "You are early to join";
      case AppointmentStatus.COMPLETED:
        return "This appointment is closed";
      default:
        return null;
    }
  };

  const shouldShowAppointment = (status) => {
    return ![
      AppointmentStatus.CANCELLED_PATIENT,
      AppointmentStatus.CANCELLED_DOCTOR,
      AppointmentStatus.REJECTED,
      AppointmentStatus.NO_SHOW,
    ].includes(status);
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const formatMessageTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Get current appointment messages
  const currentMessages = activeAppointment
    ? messages[activeAppointment.appointmentId] || []
    : [];

  // Get typing users for current appointment
  const typingUsers = activeAppointment
    ? getTypingUsers(activeAppointment.appointmentId)
    : [];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Connection Status */}
      {!isConnected && (
        <div className="absolute top-0 left-0 right-0 bg-red-500 text-white text-center py-2 z-50">
          <span className="text-sm">
            Disconnected from chat server. Attempting to reconnect...
          </span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="absolute top-0 left-0 right-0 bg-red-500 text-white text-center py-2 z-50">
          <span className="text-sm">{error}</span>
          <button onClick={clearError} className="ml-2 underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Contacts Sidebar */}
      <div
        className={`${
          showChatDetails ? "hidden lg:flex" : "flex"
        } w-full lg:w-80 bg-white border-r border-gray-200 flex-col`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Contacts</h2>
            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {filteredChats.length}
            </span>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">Loading chats...</div>
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">No chats found</div>
            </div>
          ) : (
            filteredChats.map((chat) => (
              <div
                key={chat.appointmentId || chat.id}
                className={`flex items-center p-4 cursor-pointer hover:bg-gray-50 ${
                  activeChat?.appointmentId === chat.appointmentId
                    ? "bg-teal-50 border-r-2 border-teal-500"
                    : ""
                }`}
                onClick={() => handleChatSelect(chat)}
              >
                <div className="relative">
                  <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                    {chat.avatar ? (
                      <img
                        src={chat.avatar}
                        alt={chat.doctorName || chat.patientName}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-teal-600 font-semibold text-sm">
                        {getInitials(chat.doctorName || chat.patientName)}
                      </span>
                    )}
                  </div>
                  {chat.isOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                </div>

                <div className="ml-3 flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {chat.doctorName || chat.patientName || "Unknown"}
                    </h3>
                    <div className="flex items-center space-x-1">
                      {unreadCounts[chat.appointmentId] > 0 && (
                        <span className="bg-orange-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[18px] h-[18px] flex items-center justify-center">
                          {unreadCounts[chat.appointmentId]}
                        </span>
                      )}
                      <span className="text-xs text-gray-500">
                        {chat.lastMessageTime ||
                          new Date(
                            chat.updatedAt || Date.now()
                          ).toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          })}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-1">
                    {chat.lastMessage || "No messages yet"}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div
        className={`${
          showChatDetails ? "flex" : "hidden lg:flex"
        } flex-1 flex-col`}
      >
        {activeChat ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  {/* Back Button for Mobile */}
                  <button
                    onClick={handleBackToChats}
                    className="lg:hidden mr-3 p-1 hover:bg-gray-100 rounded-full"
                  >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                  </button>

                  <div className="relative">
                    <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                      {activeChat.avatar ? (
                        <img
                          src={activeChat.avatar}
                          alt={activeChat.doctorName || activeChat.patientName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-teal-600 font-semibold text-sm">
                          {getInitials(
                            activeChat.doctorName || activeChat.patientName
                          )}
                        </span>
                      )}
                    </div>
                    {activeChat.isOnline && (
                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border border-white rounded-full"></div>
                    )}
                  </div>
                  <div className="ml-3">
                    <h2 className="text-lg font-semibold text-gray-900">
                      {activeChat.doctorName ||
                        activeChat.patientName ||
                        "Unknown"}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {isConnected
                        ? activeChat.isOnline
                          ? "Online"
                          : "Offline"
                        : "Disconnected"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {shouldShowVideoButton(activeAppointment?.status) && (
                    <button className="bg-teal-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-teal-600 transition-colors">
                      <Video className="w-4 h-4" />
                      <span className="hidden sm:inline">Video</span>
                    </button>
                  )}

                  {activeAppointment?.status ===
                    AppointmentStatus.IN_PROGRESS && (
                    <button
                      onClick={() =>
                        requestExtension(activeAppointment.appointmentId)
                      }
                      className="bg-orange-500 text-white px-3 py-2 rounded-lg flex items-center space-x-1 hover:bg-orange-600 transition-colors text-sm"
                    >
                      <Clock className="w-4 h-4" />
                      <span className="hidden sm:inline">Extend</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Appointment Info */}
              {activeAppointment && (
                <div className="mt-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs text-gray-500">
                        {activeAppointment.appointmentNumber}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${getStatusColor(
                          activeAppointment.status
                        )}`}
                      >
                        {activeAppointment.status.replace("_", " ")}
                      </span>
                    </div>
                    <div className="text-sm font-medium text-gray-900 mb-1">
                      {activeAppointment.date}
                    </div>
                    <div className="text-xs text-gray-500">
                      {activeAppointment.startTime} -{" "}
                      {activeAppointment.endTime}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
              {activeAppointment ? (
                <>
                  {/* Date Header */}
                  <div className="text-center mb-4">
                    <span className="bg-white text-gray-500 text-xs px-3 py-1 rounded-full shadow-sm">
                      {activeAppointment.date}
                    </span>
                  </div>

                  {/* Messages */}
                  {currentMessages.map((msg) => (
                    <div
                      key={msg.messageId}
                      className={`mb-4 flex ${
                        msg.senderId === currentRoom?.userId
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-xs sm:max-w-sm lg:max-w-md px-4 py-2 rounded-2xl ${
                          msg.senderId === currentRoom?.userId
                            ? "bg-teal-500 text-white"
                            : "bg-white text-gray-900 shadow-sm"
                        }`}
                      >
                        {msg.fileUrl ? (
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <FileText className="w-4 h-4" />
                              <a
                                href={msg.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm underline break-all"
                              >
                                {msg.fileName || "Download file"}
                              </a>
                            </div>
                            {msg.textContent && (
                              <p className="text-sm break-words">
                                {msg.textContent}
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm break-words">
                            {msg.textContent}
                          </p>
                        )}

                        <div
                          className={`flex items-center mt-1 ${
                            msg.senderId === currentRoom?.userId
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          <span
                            className={`text-xs ${
                              msg.senderId === currentRoom?.userId
                                ? "text-teal-100"
                                : "text-gray-500"
                            }`}
                          >
                            {formatMessageTime(msg.createdAt)}
                          </span>
                          {msg.senderId === currentRoom?.userId && (
                            <Check
                              className={`w-3 h-3 ml-1 ${
                                msg.isRead ? "text-teal-100" : "text-teal-200"
                              }`}
                            />
                          )}
                        </div>

                        {msg.editedAt && (
                          <div className="text-xs text-gray-400 mt-1">
                            (edited)
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Typing Indicator */}
                  {typingUsers.length > 0 && (
                    <div className="mb-4 flex justify-start">
                      <div className="bg-white text-gray-500 px-4 py-2 rounded-2xl shadow-sm">
                        <p className="text-sm">
                          {typingUsers.join(", ")}{" "}
                          {typingUsers.length === 1 ? "is" : "are"} typing...
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Status Message */}
                  {getStatusMessage(activeAppointment.status) && (
                    <div className="text-center py-4">
                      <span className="bg-gray-200 text-gray-600 text-sm px-4 py-2 rounded-full">
                        {getStatusMessage(activeAppointment.status)}
                      </span>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">
                      Select an appointment to view messages
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Message Input */}
            {activeAppointment && canSendMessage(activeAppointment.status) && chatAccess?.allowed === true && (
              <div className="bg-white border-t border-gray-200 p-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept="image/*,application/pdf,.doc,.docx"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={selectedFile || isLoading}
                    className="text-teal-500 hover:text-teal-600 disabled:opacity-50"
                  >
                    <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                      {selectedFile ? (
                        <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                    </div>
                  </button>
                  <div className="flex-1 flex items-center space-x-2">
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => {
                        setMessage(e.target.value);
                        handleTypingStart();
                      }}
                      onKeyPress={(e) =>
                        e.key === "Enter" && handleSendMessage()
                      }
                      placeholder="Your message"
                      disabled={!isConnected}
                      className="flex-1 px-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:opacity-50"
                    />
                  </div>
                  <button
                    onClick={handleSendMessage}
                    disabled={
                      !message.trim() ||
                      !isConnected ||
                      !chatAccess?.canSendMessages
                    }
                    className="bg-teal-500 text-white p-2 rounded-full hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* No message permission */}
            {activeAppointment && !canSendMessage(activeAppointment.status) && (
              <div className="bg-gray-100 border-t border-gray-200 p-4 text-center">
                <p className="text-sm text-gray-600">
                  {getStatusMessage(activeAppointment.status) ||
                    "Messaging is not available for this appointment"}
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center px-4">
              <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {isConnected
                  ? "Select a conversation"
                  : "Connecting to chat..."}
              </h3>
              <p className="text-gray-500">
                {isConnected
                  ? "Choose a conversation from the list to start messaging."
                  : "Please wait while we connect you to the chat server."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicalChatInterface;
