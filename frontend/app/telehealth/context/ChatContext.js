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
import { useAuth } from "../hooks/useAuth";

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
  const [isExtentionRequested, setIsExtentionRequested] = useState(false)
  const [extensionStatus, setExtensionStatus] = useState({
    isRequested: false,
    isAccepted: false,
    isRejected: false,
    requestedBy: null,
    message: null,
    doctorReason: null,
    patientName: null,
    requestTime: null,
  });
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef({});
  const telehealthBackendUrl = "http://localhost:4002";
  const [token, setToken] = useState(null);
  const {user:userAuth} = useAuth()

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
    socket.on("onlineStatusUpdate", (statusMap) => {
      // console.log('📊 Online status update:', statusMap);

      // Update online users set
      setOnlineUsers((prev) => {
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
      setChatRooms((prev) =>
        prev.map((chat) => {
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
    socket.on("extensionRejected", (data) => {
      console.log("❌ Extension rejected:", data);
      setExtensionStatus({
        isRequested: false,
        isAccepted: false,
        isRejected: true,
        requestedBy: null,
        message: data.message || "Extension request was declined",
        doctorReason: data.doctorReason || null,
        patientName: null,
        requestTime: null,
      });
      setIsExtentionRequested(false);
    });

    // Update your existing extensionRequested handler
    socket.on("extensionRequested", (data) => {
      console.log("⏰ Extension requested:", data);
      setExtensionStatus({
        isRequested: true,
        isAccepted: false,
        isRejected: false,
        requestedBy: data.requestedBy || "patient",
        message: data.message || "Extension has been requested",
        doctorReason: null,
        patientName: data.patientName || null,
        requestTime: data.requestTime || Date.now(),
      });
      setIsExtentionRequested(true);
    });

    // Update your existing extensionConfirmed handler
    socket.on("extensionConfirmed", (data) => {
      console.log("✅ Extension confirmed:", data);
      setExtensionStatus({
        isRequested: false,
        isAccepted: true,
        isRejected: false,
        requestedBy: null,
        message: data.message || "Extension has been approved",
        doctorReason: data.doctorNote || null,
        patientName: null,
        requestTime: null,
      });
      setIsExtentionRequested(false);
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
      socket.emit("shareFile", { appointmentId, fileData });
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

  const resetExtensionStatus = useCallback(() => {
    setExtensionStatus({
      isRequested: false,
      isAccepted: false,
      isRejected: false,
      requestedBy: null,
      message: null,
      doctorReason: null,
      patientName: null,
      requestTime: null,
    });
    setIsExtentionRequested(false);
  }, []);

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
    (appointmentId, doctorNote = "") => {
      if (!socket || !appointmentId) return;

      console.log("✅ Accepting extension:", appointmentId, doctorNote);
      socket.emit("acceptExtension", {
        appointmentId,
        doctorNote: doctorNote.trim(),
      });
    },
    [socket]
  );

  const rejectExtension = useCallback(
    (appointmentId, doctorReason = "") => {
      if (!socket || !appointmentId) return;

      console.log("❌ Rejecting extension:", appointmentId, doctorReason);
      socket.emit("rejectExtension", {
        appointmentId,
        doctorReason: doctorReason.trim(),
      });
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
      uploadFile: async (file, appointmentId, roomId) => {
        try {
          setIsLoading(true);
          const formData = new FormData();
          formData.append("file", file);
          formData.append("appointmentId", appointmentId);
          formData.append("roomId", roomId);

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
    extensionStatus,
    resetExtensionStatus,
    rejectExtension,

    // API methods
    api,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
