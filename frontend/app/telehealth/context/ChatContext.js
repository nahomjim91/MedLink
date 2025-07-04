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
  const [isExtentionRequested, setIsExtentionRequested] = useState(false);
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
  const [videoCallState, setVideoCallState] = useState({
    isInCall: false,
    isInitiating: false,
    isReceivingCall: false,
    currentCallId: null,
    callType: "video", // 'video' or 'audio'
    caller: null,
    localStream: null,
    remoteStream: null,
    mediaState: {
      audio: true,
      video: true,
      screenShare: false,
    },
    peerMediaState: {
      audio: true,
      video: true,
      screenShare: false,
    },
  });
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef({});
  const telehealthBackendUrl = "http://localhost:4002";
  const [token, setToken] = useState(null);
  const { user: userAuth } = useAuth();

  //WebRTC refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);

  // WebRTC configuration
  const rtcConfiguration = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
    ],
  };

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

    // Video call event listeners
    socket.on("incomingVideoCall", (data) => {
      console.log("📞 Incoming video call:", data);
      setVideoCallState((prev) => ({
        ...prev,
        isReceivingCall: true,
        caller: {
          id: data.callerId,
          name: data.callerName,
        },
        currentCallId: data.appointmentId,
        callType: data.callType,
      }));
    });
    socket.onAny((event, data) => {
      console.log("📡 Received socket event:", event, data);
    });

    socket.on("videoCallAccepted", (data) => {
      console.log("✅ Video call accepted:", data);
      setVideoCallState((prev) => ({
        ...prev,
        isInCall: true,
        isInitiating: false,
      }));
      // Start WebRTC connection as caller
      startWebRTCConnection(data.appointmentId, true);
    });

    socket.on("videoCallRejected", (data) => {
      console.log("❌ Video call rejected:", data);
      setVideoCallState((prev) => ({
        ...prev,
        isInitiating: false,
        isReceivingCall: false,
        currentCallId: null,
        caller: null,
      }));
      // Clean up any initiated streams
      cleanupVideoCall();
    });

    socket.on("videoCallEnded", (data) => {
      console.log("📞 Video call ended:", data);
      setVideoCallState((prev) => ({
        ...prev,
        isInCall: false,
        isInitiating: false,
        isReceivingCall: false,
        currentCallId: null,
        caller: null,
      }));
      cleanupVideoCall();
    });

    // WebRTC signaling events
    socket.on("videoCallOffer", async (data) => {
      console.log("📞 Received video call offer:", data);
      if (peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.setRemoteDescription(data.offer);
          const answer = await peerConnectionRef.current.createAnswer();
          await peerConnectionRef.current.setLocalDescription(answer);

          socket.emit("videoCallAnswer", {
            appointmentId: data.appointmentId,
            answer: answer,
          });
        } catch (error) {
          console.error("Error handling video call offer:", error);
        }
      }
    });

    socket.on("videoCallAnswer", async (data) => {
      console.log("📞 Received video call answer:", data);
      if (peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.setRemoteDescription(data.answer);
        } catch (error) {
          console.error("Error handling video call answer:", error);
        }
      }
    });

    socket.on("iceCandidate", async (data) => {
      if (peerConnectionRef.current && data.candidate) {
        try {
          await peerConnectionRef.current.addIceCandidate(data.candidate);
        } catch (error) {
          console.error("Error adding ICE candidate:", error);
        }
      }
    });

    socket.on("peerMediaStateChanged", (data) => {
      console.log("🎥 Peer media state changed:", data);
      setVideoCallState((prev) => ({
        ...prev,
        peerMediaState: data.mediaState,
      }));
    });

    socket.on("peerScreenShareToggle", (data) => {
      console.log("🖥️ Peer screen share toggled:", data);
      setVideoCallState((prev) => ({
        ...prev,
        peerMediaState: {
          ...prev.peerMediaState,
          screenShare: data.isSharing,
        },
      }));
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

  // video call helper function
  // Initialize WebRTC connection
  const startWebRTCConnection = useCallback(
    async (appointmentId, isInitiator = false) => {
      try {
        console.log("🔄 Starting WebRTC connection...");

        // Create peer connection
        peerConnectionRef.current = new RTCPeerConnection(rtcConfiguration);

        // Set up event handlers
        peerConnectionRef.current.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit("iceCandidate", {
              appointmentId,
              candidate: event.candidate,
            });
          }
        };

        peerConnectionRef.current.ontrack = (event) => {
          console.log("📡 Received remote stream");
          const remoteStream = event.streams[0];
          remoteStreamRef.current = remoteStream;
          setVideoCallState((prev) => ({
            ...prev,
            remoteStream: remoteStream,
          }));

          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
          }
        };

        // Get user media
        const constraints = {
          video: videoCallState.callType === "video",
          audio: true,
        };

        const localStream = await navigator.mediaDevices.getUserMedia(
          constraints
        );
        localStreamRef.current = localStream;

        setVideoCallState((prev) => ({
          ...prev,
          localStream: localStream,
        }));

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }

        // Add local stream tracks to peer connection
        localStream.getTracks().forEach((track) => {
          peerConnectionRef.current.addTrack(track, localStream);
        });

        // If initiator, create offer
        if (isInitiator) {
          const offer = await peerConnectionRef.current.createOffer();
          await peerConnectionRef.current.setLocalDescription(offer);

          socket.emit("videoCallOffer", {
            appointmentId,
            offer: offer,
          });
        }
      } catch (error) {
        console.error("Error starting WebRTC connection:", error);
        setError("Failed to start video call");
        cleanupVideoCall();
      }
    },
    [socket, videoCallState.callType]
  );

  // Clean up video call resources
  const cleanupVideoCall = useCallback(() => {
    console.log("🧹 Cleaning up video call...");

    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Clear video elements
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    // Reset remote stream ref
    remoteStreamRef.current = null;

    // Reset video call state
    setVideoCallState((prev) => ({
      ...prev,
      localStream: null,
      remoteStream: null,
      mediaState: {
        audio: true,
        video: true,
        screenShare: false,
      },
      peerMediaState: {
        audio: true,
        video: true,
        screenShare: false,
      },
    }));
  }, []);

  // Video call action functions
  const initiateVideoCall = useCallback(
    (appointmentId, callType = "video") => {
      if (!socket || !appointmentId) return;

      console.log("📞 Initiating video call:", appointmentId, callType);
      setVideoCallState((prev) => ({
        ...prev,
        isInitiating: true,
        currentCallId: appointmentId,
        callType,
      }));

      socket.emit("initiateVideoCall", { appointmentId, callType });
    },
    [socket]
  );

  const answerVideoCall = useCallback(
    async (appointmentId, accepted = true) => {
      if (!socket || !appointmentId) return;

      console.log("📞 Answering video call:", appointmentId, accepted);
      socket.emit("answerVideoCall", { appointmentId, accepted });

      if (accepted) {
        setVideoCallState((prev) => ({
          ...prev,
          isInCall: true,
          isReceivingCall: false,
        }));
        // Start WebRTC connection as receiver
        await startWebRTCConnection(appointmentId, false);
      } else {
        setVideoCallState((prev) => ({
          ...prev,
          isReceivingCall: false,
          currentCallId: null,
          caller: null,
        }));
      }
    },
    [socket, startWebRTCConnection]
  );

  const endVideoCall = useCallback(
    (appointmentId, reason = "ended") => {
      if (!socket || !appointmentId) return;

      console.log("📞 Ending video call:", appointmentId);
      socket.emit("endVideoCall", { appointmentId, reason });

      setVideoCallState((prev) => ({
        ...prev,
        isInCall: false,
        isInitiating: false,
        isReceivingCall: false,
        currentCallId: null,
        caller: null,
      }));

      cleanupVideoCall();
    },
    [socket, cleanupVideoCall]
  );

  // Media control functions
  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        const newState = {
          ...videoCallState.mediaState,
          audio: audioTrack.enabled,
        };

        setVideoCallState((prev) => ({
          ...prev,
          mediaState: newState,
        }));

        // Notify peer about media state change
        socket.emit("mediaStateChanged", {
          appointmentId: videoCallState.currentCallId,
          mediaState: newState,
        });
      }
    }
  }, [socket, videoCallState.mediaState, videoCallState.currentCallId]);

  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        const newState = {
          ...videoCallState.mediaState,
          video: videoTrack.enabled,
        };

        setVideoCallState((prev) => ({
          ...prev,
          mediaState: newState,
        }));

        // Notify peer about media state change
        socket.emit("mediaStateChanged", {
          appointmentId: videoCallState.currentCallId,
          mediaState: newState,
        });
      }
    }
  }, [socket, videoCallState.mediaState, videoCallState.currentCallId]);

  const toggleScreenShare = useCallback(async () => {
    try {
      if (!videoCallState.mediaState.screenShare) {
        // Start screen sharing
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });

        // Replace video track with screen share
        const sender = peerConnectionRef.current
          .getSenders()
          .find((s) => s.track && s.track.kind === "video");

        if (sender) {
          await sender.replaceTrack(screenStream.getVideoTracks()[0]);
        }

        // Update local video display
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }

        // Handle screen share end
        screenStream.getVideoTracks()[0].onended = () => {
          toggleScreenShare(); // This will end screen sharing
        };
      } else {
        // Stop screen sharing and return to camera
        const cameraStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        // Replace screen share track with camera
        const sender = peerConnectionRef.current
          .getSenders()
          .find((s) => s.track && s.track.kind === "video");

        if (sender) {
          await sender.replaceTrack(cameraStream.getVideoTracks()[0]);
        }

        // Update local video display
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = cameraStream;
        }

        // Update local stream reference
        localStreamRef.current = cameraStream;
      }

      const newState = {
        ...videoCallState.mediaState,
        screenShare: !videoCallState.mediaState.screenShare,
      };

      setVideoCallState((prev) => ({
        ...prev,
        mediaState: newState,
      }));

      // Notify peer about screen share toggle
      socket.emit("screenShareToggle", {
        appointmentId: videoCallState.currentCallId,
        isSharing: !videoCallState.mediaState.screenShare,
      });
    } catch (error) {
      console.error("Error toggling screen share:", error);
      setError("Failed to toggle screen sharing");
    }
  }, [socket, videoCallState.mediaState, videoCallState.currentCallId]);

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

    // Video call state and functions
    videoCallState,
    localVideoRef,
    remoteVideoRef,

    // Video call actions
    initiateVideoCall,
    answerVideoCall,
    endVideoCall,

    // Media controls
    toggleAudio,
    toggleVideo,
    toggleScreenShare,

    // Cleanup
    cleanupVideoCall,

    // API methods
    api,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
