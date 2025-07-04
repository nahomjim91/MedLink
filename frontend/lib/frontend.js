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


import React, { useState, useRef, useEffect , useCallback} from "react";
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
  MoreVertical,
} from "lucide-react";
import { useChat } from "../../context/ChatContext";
import { useAuth } from "../../hooks/useAuth";
import {
  AppointmentDetailModal,
  ExtensionRequestModal,
} from "./modal/AppointmentModal ";
import DoctorExtensionModal from "./modal/DoctorExtensionModal";
import PatientExtensionResultModal from "./modal/PatientExtensionResultModal";
import VideoCallModal from "./modal/VideoCallModal";

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
    extensionStatus,
    resetExtensionStatus,
    requestExtension,
    acceptExtension,
    rejectExtension,

    // video
    videoCallState,
    localVideoRef,
    remoteVideoRef,
    initiateVideoCall,
    answerVideoCall,
    endVideoCall,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,

    // API methods
    api,
  } = useChat();

  const { user } = useAuth();

  const [chatAppointments, setChatAppointments] = useState([]);
  const [showAppointmentDropdown, setShowAppointmentDropdown] = useState(false);
  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [showPatientResultModal, setShowPatientResultModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [participantName, setParticipantName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [isDetailModalOpen, setDetailModalOpen] = useState(false);
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

  const isDoctor = user.role === "doctor"; // or however you determine doctor role
  const isPatient = !isDoctor;

  // Auto-join appointment room if appointmentId is provided
  useEffect(() => {
    if (
      appointmentId &&
      chatRooms.length > 0 &&
      !activeAppointment &&
      !userWentBack
    ) {
      joinAppointmentRoom(appointmentId);
      // Find the chat room that contains this appointmentId
      const matchingChat = chatRooms.find(
        (chat) =>
          chat.appointmentIds && chat.appointmentIds.includes(appointmentId)
      );

      if (matchingChat) {
        // Now, find the specific appointment object within that chat
        const specificAppointment = matchingChat.appointments?.find(
          (app) => app.appointmentId === appointmentId
        );

        if (specificAppointment) {
          handleChatSelect(matchingChat);
        } else {
          console.log("Appointment object not found within the matching chat");
        }
      } else {
        console.log(
          "No matching chat room found for appointmentId:",
          appointmentId
        );
      }
    }
  }, [appointmentId, chatRooms, activeAppointment, userWentBack]);

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
  ///////////////////////////////////////////
  // Handle extension request for doctors
  useEffect(() => {
    if (
      isDoctor &&
      extensionStatus.isRequested &&
      !extensionStatus.isAccepted &&
      !extensionStatus.isRejected
    ) {
      setShowDoctorModal(true);
    }
  }, [
    isDoctor,
    extensionStatus.isRequested,
    extensionStatus.isAccepted,
    extensionStatus.isRejected,
  ]);

  // Handle extension result for patients
  useEffect(() => {
    if (
      isPatient &&
      (extensionStatus.isAccepted || extensionStatus.isRejected)
    ) {
      setShowPatientResultModal(true);
    }
  }, [isPatient, extensionStatus.isAccepted, extensionStatus.isRejected]);

  // Handle doctor accepting extension
  const handleDoctorAccept = async (appointmentId, doctorNote = "") => {
    setIsProcessing(true);
    try {
      await acceptExtension(appointmentId, doctorNote);
      setShowDoctorModal(false);
    } catch (error) {
      console.error("Error accepting extension:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle doctor rejecting extension
  const handleDoctorReject = async (appointmentId, doctorReason = "") => {
    setIsProcessing(true);
    try {
      await rejectExtension(appointmentId, doctorReason);
      setShowDoctorModal(false);
    } catch (error) {
      console.error("Error rejecting extension:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle closing doctor modal
  const handleCloseDoctorModal = () => {
    setShowDoctorModal(false);
  };

  // Handle closing patient result modal
  const handleClosePatientResultModal = () => {
    setShowPatientResultModal(false);
    resetExtensionStatus();
  };
  //////////////////////////
  //video call
  // Video call handler functions
  const handleInitiateVideoCall = useCallback(() => {
    if (activeAppointment) {
      // Set participant name based on user role
      const name =
        user.role === "doctor" ? activeChat.patientName : activeChat.doctorName;
      setParticipantName(name);
      setShowVideoModal(true);
      initiateVideoCall(activeAppointment.appointmentId, "video");
    }
  }, [activeAppointment, activeChat, user.role, initiateVideoCall]);

  const handleAnswerVideoCall = useCallback(
    async (appointmentId, accepted) => {
      try {
        await answerVideoCall(appointmentId, accepted);
        if (accepted) {
          // Set participant name
          const name =
            user.role === "doctor"
              ? activeChat.patientName
              : activeChat.doctorName;
          setParticipantName(name);
          setShowVideoModal(true);
        }
      } catch (error) {
        console.error("Error answering video call:", error);
      }
    },
    [answerVideoCall, activeChat, user.role]
  );

  const handleEndVideoCall = useCallback(
    (appointmentId) => {
      endVideoCall(appointmentId);
      setShowVideoModal(false);
    },
    [endVideoCall]
  );

  const handleCloseVideoModal = useCallback(() => {
    if (videoCallState.isInCall) {
      handleEndVideoCall(videoCallState.currentCallId);
    } else {
      setShowVideoModal(false);
    }
  }, [
    videoCallState.isInCall,
    videoCallState.currentCallId,
    handleEndVideoCall,
  ]);

  // Handle incoming video calls
  useEffect(() => {
    if (videoCallState.isReceivingCall && !showVideoModal) {
      // Set participant name for incoming call
      const name =
        videoCallState.caller?.name ||
        (user.role === "doctor"
          ? activeChat?.patientName
          : activeChat?.doctorName);
      setParticipantName(name);
      setShowVideoModal(true);
    }
  }, [
    videoCallState.isReceivingCall,
    showVideoModal,
    videoCallState.caller,
    user.role,
    activeChat,
  ]);

  // Handle video call ending
  useEffect(() => {
    if (
      !videoCallState.isInCall &&
      !videoCallState.isReceivingCall &&
      !videoCallState.isInitiating &&
      showVideoModal
    ) {
      // Small delay to allow user to see the call ended
      const timer = setTimeout(() => {
        setShowVideoModal(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [
    videoCallState.isInCall,
    videoCallState.isReceivingCall,
    videoCallState.isInitiating,
    showVideoModal,
  ]);

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
    setUserWentBack(false);
    setActiveChat(chat);
    setShowChatDetails(true);

    // Store all appointments from this chat
    if (chat.appointments && chat.appointments.length > 0) {
      setChatAppointments(chat.appointments);

      // Sort appointments by scheduled start time descending
      const sortedAppointments = [...chat.appointments].sort((a, b) => {
        const timeA = a.scheduledStartTime?._seconds || 0;
        const timeB = b.scheduledStartTime?._seconds || 0;
        return timeB - timeA;
      });

      // Set the latest appointment as active
      const latestAppointment = sortedAppointments[0];
      setActiveAppointment(latestAppointment);

      // Join the room and fetch messages for the latest appointment
      joinAppointmentRoom(latestAppointment.appointmentId);
      try {
        await api.getMessagesForAppointment(latestAppointment.appointmentId);

        // Mark messages as read logic
        const appointmentMessages =
          messages[latestAppointment.appointmentId] || [];
        const unreadMessageIds = appointmentMessages
          .filter((msg) => !msg.isRead && msg.senderId !== currentRoom?.userId)
          .map((msg) => msg.messageId);

        if (unreadMessageIds.length > 0) {
          markMessagesAsRead(unreadMessageIds);
        }
      } catch (error) {
        console.error("Failed to load messages for appointment:", error);
      }
    }
  };

  const handleAppointmentSelect = async (appointment) => {
    setActiveAppointment(appointment);
    setShowAppointmentDropdown(false);

    // Join the new appointment room
    joinAppointmentRoom(appointment.appointmentId);

    try {
      await api.getMessagesForAppointment(appointment.appointmentId);

      // Mark messages as read for the new appointment
      const appointmentMessages = messages[appointment.appointmentId] || [];
      const unreadMessageIds = appointmentMessages
        .filter((msg) => !msg.isRead && msg.senderId !== currentRoom?.userId)
        .map((msg) => msg.messageId);

      if (unreadMessageIds.length > 0) {
        markMessagesAsRead(unreadMessageIds);
      }
    } catch (error) {
      console.error("Failed to load messages for appointment:", error);
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

      // console.log("currentRoom" , currentRoom)

      // Upload file
      const uploadResult = await api.uploadFile(
        file,
        activeAppointment.appointmentId,
        currentRoom.roomId
      );

      // Share file through socket
      shareFile(activeAppointment.appointmentId, {
        fileUrl: uploadResult.fileUrl,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        originalName: file.name,
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

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const formatMessageTime = (timestamp) => {
    if (!timestamp) return "";

    // Convert Firestore timestamp to milliseconds
    const millis =
      timestamp._seconds * 1000 + Math.floor(timestamp._nanoseconds / 1e6);

    return new Date(millis).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleExtensionRequest = () => {
    if (activeAppointment) {
      requestExtension(activeAppointment.appointmentId);
    }
  };

  // Get current appointment messages
  const currentMessages = activeAppointment
    ? messages[activeAppointment.appointmentId] || []
    : [];

  // Get typing users for current appointment
  const typingUsers = activeAppointment
    ? getTypingUsers(activeAppointment.appointmentId)
    : [];

  // Format appointment date for display
  const formatAppointmentDate = (appointment) => {
    // console.log("Appointment:", appointment);
    if (!appointment?.scheduledStartTime) return "Unknown date";

    const date = new Date(appointment.scheduledStartTime._seconds * 1000);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Format appointment time for display
  const formatAppointmentTime = (appointment) => {
    if (!appointment?.scheduledStartTime || !appointment?.scheduledEndTime) {
      return "Unknown time";
    }

    const startTime = new Date(appointment.scheduledStartTime._seconds * 1000);
    const endTime = new Date(appointment.scheduledEndTime._seconds * 1000);

    return `${startTime.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })} - ${endTime.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })}`;
  };

  const extensionRequestData = {
    patientName: extensionStatus.patientName || user.firstName,
    message: extensionStatus.message,
    requestTime: extensionStatus.requestTime,
    appointmentTime:
      formatAppointmentDate(activeAppointment) || "Current session",
    originalDuration: "30 minutes", // You can get this from your appointment data
  };

  return (
    <div className="flex h-[89vh] bg-amber-300 overflow-hidden bg-gradient-to-br rounded-none sm:rounded-2xl">
      {/* Connection Status */}
      {!isConnected && (
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-red-500 to-red-600 text-white text-center py-2 sm:py-3 z-50 shadow-lg">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-xs sm:text-sm font-medium">
              Disconnected from chat server. Attempting to reconnect...
            </span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-red-500 to-red-600 text-white text-center py-2 sm:py-3 z-50 shadow-lg">
          <div className="flex items-center justify-center space-x-2 px-4">
            <span className="text-xs sm:text-sm font-medium flex-1">
              {error}
            </span>
            <button
              onClick={clearError}
              className="ml-2 bg-white bg-opacity-20 hover:bg-opacity-30 px-2 sm:px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 flex-shrink-0"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Extension Status Indicators */}
      {extensionStatus.isRequested && isPatient && (
        <div className="bg-amber-100 border border-amber-300 text-amber-800 px-4 py-3 rounded-lg mb-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="font-medium">Extension request sent</span>
          </div>
          <p className="text-sm mt-1">Waiting for doctor's response...</p>
        </div>
      )}

      {extensionStatus.isRequested && isDoctor && (
        <div className="bg-blue-100 border border-blue-300 text-blue-800 px-4 py-3 rounded-lg mb-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium">Extension request received</span>
              <p className="text-sm mt-1">
                Patient is requesting additional time
              </p>
            </div>
            <button
              onClick={() => setShowDoctorModal(true)}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
            >
              Review
            </button>
          </div>
        </div>
      )}
      {/* Contacts Sidebar */}
      <div
        className={`${
          showChatDetails ? "hidden md:flex" : "flex"
        } w-full lg:w-80 h-[89vh] overflow-y-auto scrollbar-hide flex-col shadow-lg bg-white`}
      >
        {/* Header */}
        <div className="p-3 sm:p-4 lg:p-6 border-b border-gray-100 bg-gradient-to-r from-teal-50 to-primary/20 flex-shrink-0">
          <div className="flex justify-between items-center mb-3 sm:mb-4">
            <h2 className="text-lg sm:text-xl font-bold  bg-gradient-to-r from-teal-600 to-primary bg-clip-text text-transparent">
              Contacts
            </h2>
            <span className="text-xs sm:text-sm text-teal-600 bg-teal-100 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full font-semibold shadow-sm">
              {filteredChats.length}
            </span>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 sm:pl-11 pr-3 sm:pr-4 py-2 sm:py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white shadow-sm transition-all duration-200 hover:shadow-md"
            />
          </div>
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {isLoading ? (
            <div className="flex items-center justify-center py-8 sm:py-12">
              <div className="flex flex-col items-center space-y-3">
                <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 sm:border-3 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                <div className="textsecondary/20 font-medium text-sm sm:text-base">
                  Loading chats...
                </div>
              </div>
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="flex items-center justify-center py-8 sm:py-12">
              <div className="text-center px-4">
                <MessageCircle className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-3" />
                <div className="textsecondary/20 font-medium text-sm sm:text-base">
                  No chats found
                </div>
                <div className="text-gray-400 text-xs sm:text-sm mt-1">
                  Try adjusting your search
                </div>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filteredChats.map((chat) => (
                <div
                  key={chat.appointmentId || chat.id}
                  className={`flex items-center p-3 sm:p-4 cursor-pointer transition-all duration-200 hover:bg-gradient-to-r hover:from-gray-50 hover:to-teal-50 active:bg-gray-100 ${
                    activeChat?.appointmentId === chat.appointmentId
                      ? "bg-gradient-to-r from-teal-50 to-cyan-50 border-r-4 border-primary shadow-sm"
                      : ""
                  }`}
                  onClick={() => handleChatSelect(chat)}
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-full flex items-center justify-center shadow-sm ring-2 ring-white">
                      {chat.avatar ? (
                        <img
                          src={chat.avatar}
                          alt={chat.doctorName || chat.patientName}
                          className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-teal-600 font-bold text-sm sm:text-base lg:text-lg">
                          {getInitials(chat.doctorName || chat.patientName)}
                        </span>
                      )}
                    </div>
                    {chat.isOnline && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 sm:w-4 sm:h-4 bg-green-500 border-2 border-white rounded-full shadow-sm animate-pulse"></div>
                    )}
                  </div>

                  <div className="ml-3 sm:ml-4 flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="text-sm sm:text-base font-semibold textsecondary/90 truncate pr-2">
                        {user.role !== "patient"
                          ? user.gender?.toUpperCase() === "M"
                            ? "Mr. "
                            : "Ms. "
                          : "Dr. "}{" "}
                        {chat.doctorName || chat.patientName || "Unknown"}
                      </h3>
                      <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                        {unreadCounts[chat.appointmentId] > 0 && (
                          <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold rounded-full px-1.5 sm:px-2.5 py-0.5 sm:py-1 min-w-[18px] sm:min-w-[20px] h-[18px] sm:h-[20px] flex items-center justify-center shadow-sm animate-pulse">
                            {unreadCounts[chat.appointmentId]}
                          </span>
                        )}
                        <span className="text-xs textsecondary/20 font-medium">
                          {chat.updatedAt
                            ? new Date(
                                chat.updatedAt._seconds * 1000
                              ).toLocaleTimeString("en-US", {
                                hour: "numeric",
                                minute: "2-digit",
                                hour12: true,
                              })
                            : ""}
                          {/* {console.log("chat.updatedAt", chat.updatedAt)} */}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 truncate font-medium">
                      {chat.lastMessage || "No messages yet"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div
        className={`${
          showChatDetails ? "flex" : "hidden lg:flex"
        } flex-1 flex-col bg-white h-[89vh] overflow-clip`}
      >
        {activeChat ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-100 p-2 sm:p-3 lg:p-6 shadow-sm flex-shrink-0">
              <div className="flex justify-between items-center">
                <div className="flex items-center min-w-0 flex-1">
                  {/* Back Button for Mobile */}
                  <button
                    onClick={handleBackToChats}
                    className="lg:hidden mr-2 p-2 hover:bg-gray-100 rounded-full transition-colors duration-200 flex-shrink-0"
                  >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                  </button>

                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-full flex items-center justify-center shadow-sm ring-2 ring-white">
                      {activeChat.avatar ? (
                        <img
                          src={activeChat.avatar}
                          alt={activeChat.doctorName || activeChat.patientName}
                          className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-teal-600 font-bold text-sm sm:text-base lg:text-xl">
                          {getInitials(
                            activeChat.doctorName || activeChat.patientName
                          )}
                        </span>
                      )}
                    </div>
                    {activeChat.isOnline && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4 bg-green-500 border-2 border-white rounded-full shadow-sm animate-pulse"></div>
                    )}
                  </div>

                  <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                    <h2 className="text-sm sm:text-base lg:text-xl font-bold textsecondary/90 truncate">
                      {user.role !== "patient"
                        ? user.gender?.toUpperCase() === "M"
                          ? "Mr. "
                          : "Ms. "
                        : "Dr. "}{" "}
                      {activeChat.doctorName ||
                        activeChat.patientName ||
                        "Unknown"}
                    </h2>
                    <p className="text-xs sm:text-sm font-medium">
                      <span
                        className={`${
                          isConnected
                            ? activeChat.isOnline
                              ? "text-green-600"
                              : "textsecondary/20"
                            : "text-red-500"
                        }`}
                      >
                        {isConnected
                          ? activeChat.isOnline
                            ? "● Online"
                            : "○ Offline"
                          : "● Disconnected"}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-3 flex-shrink-0">
                  {shouldShowVideoButton(activeAppointment?.status) && (
                    <button
                      onClick={handleInitiateVideoCall}
                      className="bg-gradient-to-r from-teal-500 to-primary text-white px-2 py-1.5 sm:px-3 sm:py-2 lg:px-5 lg:py-2.5 rounded-lg sm:rounded-xl flex items-center space-x-1 lg:space-x-2 hover:from-teal-600 hover:to-cyan-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                    >
                      <Video className="w-4 h-4" />
                      <span className="hidden sm:inline font-medium text-xs sm:text-sm lg:text-base">
                        Video
                      </span>
                    </button>
                  )}

                  {activeAppointment?.status === "IN_PROGRESS" &&
                    user.role === "patient" && (
                      <button
                        onClick={() => setShowExtensionModal(true)}
                        className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-2 py-1.5 sm:px-3 sm:py-2 lg:px-4 lg:py-2.5 rounded-lg sm:rounded-xl flex items-center space-x-1 lg:space-x-2 hover:from-orange-600 hover:to-red-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                      >
                        <Clock className="w-4 h-4" />
                        <span className="hidden sm:inline font-medium text-xs sm:text-sm lg:text-base">
                          Extend
                        </span>
                      </button>
                    )}
                </div>
              </div>
            </div>

            {/* Mobile Appointment Timeline - Horizontal */}
            {activeAppointment && chatAppointments.length > 1 && (
              <div className="lg:hidden bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 p-3 sm:p-4 flex-shrink-0 w-[100vw] overflow-clip bg-amber-300">
                <h3 className="text-sm font-bold text-gray-700 mb-2 sm:mb-3 flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-teal-500" />
                  Appointment History ({chatAppointments.length})
                </h3>
                <div className="overflow-x-auto scrollbar-hide">
                  <div
                    className="flex space-x-2 sm:space-x-3 pb-1 sm:pb-2"
                    style={{ width: "max-content" }}
                  >
                    {chatAppointments
                      .slice()
                      .reverse()
                      .map((appointment, index) => (
                        <div
                          key={appointment.appointmentId}
                          className="flex items-center"
                        >
                          <div
                            className={`flex-shrink-0 cursor-pointer transition-all duration-300 rounded-xl ${
                              activeAppointment.appointmentId ===
                              appointment.appointmentId
                                ? "ring-2 ring-teal-500 shadow-lg scale-105"
                                : "hover:shadow-md hover:scale-102"
                            }`}
                            onClick={() => handleAppointmentSelect(appointment)}
                          >
                            <div className="bg-gradient-to-br from-white to-gray-50 rounded-lg sm:rounded-xl p-2 sm:p-3 min-w-[140px] sm:min-w-[160px] border border-gray-200 shadow-sm">
                              <div className="flex justify-between items-start mb-1 sm:mb-2">
                                <span className="text-xs textsecondary/20 font-mono bg-gray-100 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md">
                                  #
                                  {appointment.appointmentId?.substring(0, 6) ||
                                    "Unknown"}
                                </span>
                                <span
                                  className={`text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-semibold ${getStatusColor(
                                    appointment.status
                                  )}`}
                                >
                                  {appointment.status.replace("_", " ")}
                                </span>
                              </div>
                              <div className="text-xs sm:text-sm font-bold textsecondary/90 mb-1">
                                {formatAppointmentDate(appointment)}
                              </div>
                              <div className="text-xs text-gray-600 font-medium">
                                {formatAppointmentTime(appointment)}
                              </div>
                            </div>
                          </div>
                          {/* Timeline connector */}
                          {index < chatAppointments.length - 1 && (
                            <div className="flex-shrink-0 mx-1 sm:mx-2">
                              <div className="w-4 sm:w-8 h-px bg-gradient-to-r from-gray-300 to-gray-400"></div>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* Messages Area */}
            <div className="flex-1  overflow-y-auto overscroll-contain bg-gradient-to-b from-gray-50 to-white p-3 sm:p-4 lg:p-6">
              {activeAppointment ? (
                <>
                  {/* Date Header */}
                  <div className="text-center mb-4 sm:mb-6">
                    <span className="bg-white text-gray-600 text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-sm border border-gray-100 font-medium">
                      {formatAppointmentDate(activeAppointment)}
                    </span>
                  </div>

                  {/* Messages */}
                  {currentMessages.map((msg) => (
                    <div
                      key={msg.messageId}
                      className={`mb-3 sm:mb-4 lg:mb-6 flex ${
                        msg.senderId === user?.id
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[85%] sm:max-w-[75%] lg:max-w-md px-3 sm:px-4 lg:px-5 py-2 sm:py-3 rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md ${
                          msg.senderId === user?.id
                            ? "bg-gradient-to-br from-teal-500 to-primary/80 text-white"
                            : "bg-white textsecondary/90 border border-gray-100"
                        }`}
                      >
                        {/* File Message */}
                        {msg.fileUrl ? (
                          <div className="space-y-2 sm:space-y-3">
                            <div className="flex items-center space-x-2 sm:space-x-3">
                              <div
                                className={`p-1.5 sm:p-2 rounded-lg ${
                                  msg.senderId === user?.id
                                    ? "bg-white bg-opacity-20"
                                    : "bg-gray-100"
                                }`}
                              >
                                <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                              </div>
                              <a
                                href={`http://localhost:4002${msg.fileUrl}`}
                                //http://localhost:3000/telehealth/patient/chats
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs sm:text-sm underline break-all hover:opacity-80 font-medium transition-opacity duration-200"
                              >
                                {msg.fileName || "Download file"}
                              </a>
                            </div>
                            {msg.textContent && (
                              <p className="text-xs sm:text-sm break-words leading-relaxed">
                                {msg.textContent}
                              </p>
                            )}
                          </div>
                        ) : (
                          /* Text Message */
                          <p className="text-xs sm:text-sm break-words leading-relaxed">
                            {msg.textContent}
                          </p>
                        )}

                        {/* Message Footer */}
                        <div
                          className={`flex items-center mt-1 sm:mt-2 ${
                            msg.senderId === user?.id
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          <span
                            className={`text-xs font-medium ${
                              msg.senderId === user?.id
                                ? "text-white text-opacity-70"
                                : "textsecondary/20"
                            }`}
                          >
                            {formatMessageTime(msg.createdAt)}
                          </span>
                          {msg.senderId === user?.id && (
                            <Check
                              className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ml-1 sm:ml-2 ${
                                msg.readBy && msg.readBy.length > 1
                                  ? "text-white"
                                  : "text-white text-opacity-70"
                              }`}
                            />
                          )}
                        </div>

                        {/* Edited Indicator */}
                        {msg.editedAt && (
                          <div
                            className={`text-xs mt-1 font-medium ${
                              msg.senderId === user?.id
                                ? "text-white text-opacity-70"
                                : "text-gray-400"
                            }`}
                          >
                            (edited)
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Typing Indicator */}
                  {typingUsers.length > 0 && (
                    <div className="mb-3 sm:mb-4 lg:mb-6 flex justify-start">
                      <div className="bg-white textsecondary/20 px-3 sm:px-4 lg:px-5 py-2 sm:py-3 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center space-x-2 sm:space-x-3">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div
                              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                              style={{ animationDelay: "0.1s" }}
                            ></div>
                            <div
                              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                              style={{ animationDelay: "0.2s" }}
                            ></div>
                          </div>
                          <p className="text-xs sm:text-sm font-medium">
                            {typingUsers.join(", ")}{" "}
                            {typingUsers.length === 1 ? "is" : "are"} typing...
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Status Message */}
                  {getStatusMessage(activeAppointment.status) && (
                    <div className="text-center py-4 sm:py-6">
                      <span className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 text-xs sm:text-sm px-4 sm:px-6 py-2 sm:py-3 rounded-full font-medium shadow-sm">
                        {getStatusMessage(activeAppointment.status)}
                      </span>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center px-4">
                    <MessageCircle className="w-16 h-16 sm:w-20 sm:h-20 text-gray-300 mx-auto mb-4 sm:mb-6" />
                    <p className="text-gray-600 mb-2 sm:mb-3 text-base sm:text-lg font-semibold">
                      Select an appointment to view messages
                    </p>
                    <p className="textsecondary/20 text-sm">
                      Choose from your appointment history to start chatting
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Message Input */}
            {activeAppointment &&
              canSendMessage(activeAppointment.status) &&
              chatAccess?.allowed === true && (
                <div className="bg-white border-t border-gray-100 p-3 sm:p-4 shadow-lg flex-shrink-0">
                  <div className="flex items-end space-x-2 sm:space-x-3">
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
                      className="text-teal-500 hover:text-teal-600 disabled:opacity-50 transition-all duration-200 transform hover:scale-110 flex-shrink-0"
                    >
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-all duration-200">
                        {selectedFile ? (
                          <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
                        )}
                      </div>
                    </button>
                    <div className="flex-1 flex items-center space-x-2 sm:space-x-3">
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
                        placeholder="Type your message..."
                        disabled={!isConnected}
                        className="flex-1 px-3 sm:px-4 lg:px-5 py-2 sm:py-3 border border-gray-200 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:opacity-50 bg-gray-50 focus:bg-white transition-all duration-200 font-medium shadow-sm text-sm sm:text-base"
                      />
                    </div>
                    <button
                      onClick={handleSendMessage}
                      disabled={
                        !message.trim() ||
                        !isConnected ||
                        !chatAccess?.canSendMessages
                      }
                      className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white p-2 sm:p-3 rounded-full hover:from-teal-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-110 disabled:transform-none flex-shrink-0"
                    >
                      <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                </div>
              )}

            {/* No message permission */}
            {activeAppointment && !canSendMessage(activeAppointment.status) && (
              <div className="bg-gradient-to-r from-gray-100 to-gray-200 border-t border-gray-200 p-4 sm:p-6 text-center flex-shrink-0">
                <p className="text-xs sm:text-sm text-gray-700 font-medium">
                  {getStatusMessage(activeAppointment.status) ||
                    "Messaging is not available for this appointment"}
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
            <div className="text-center px-4 sm:px-6">
              <MessageCircle className="w-16 h-16 sm:w-20 sm:h-20 text-gray-300 mx-auto mb-4 sm:mb-6" />
              <h3 className="text-lg sm:text-xl font-bold textsecondary/90 mb-2 sm:mb-3">
                {isConnected
                  ? "Select a conversation"
                  : "Connecting to chat..."}
              </h3>
              <p className="text-sm sm:text-base text-gray-600 font-medium">
                {isConnected
                  ? "Choose a conversation from the list to start messaging."
                  : "Please wait while we connect you to the chat server."}
              </p>
              {!isConnected && (
                <div className="mt-4">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 sm:border-3 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Desktop Appointment Timeline Sidebar */}
      {activeAppointment && chatAppointments.length > 1 && (
        <div className="hidden lg:flex lg:w-80 xl:w-96 bg-gradient-to-b from-gray-50 to-white border-l border-gray-200 flex-col shadow-lg">
          {/* Timeline Header */}
          <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-teal-50 to-primary/20">
            <h3 className="text-lg font-bold text-gray-800  flex items-center bg-gradient-to-r from-teal-500 to-primary bg-clip-text ">
              <Clock className="w-5 h-5 mr-3 text-primary" />
              Appointment Timeline
            </h3>
            <p className="text-sm text-gray-600 mt-1 font-medium">
              {chatAppointments.length} appointments
            </p>
          </div>

          {/* Vertical Timeline */}
          <div className=" h-[76vh] overflow-y-auto scrollbar-hide p-6">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-cyan-300 to-gray-300"></div>

              <div className="space-y-6">
                {chatAppointments
                  .slice()
                  .reverse()
                  .map((appointment, index) => (
                    <div key={appointment.appointmentId} className="relative">
                      {/* Timeline dot */}
                      <div
                        className={`absolute left-6 w-4 h-4 rounded-full border-2 border-white shadow-md z-10 ${
                          activeAppointment.appointmentId ===
                          appointment.appointmentId
                            ? "bg-gradient-to-r from-primary to-primary/70 ring-2 ring-primary/50"
                            : appointment.status === "COMPLETED"
                            ? "bg-green-500"
                            : appointment.status === "CANCELLED"
                            ? "bg-red-500"
                            : "bg-gray-400"
                        }`}
                      ></div>

                      {/* Appointment Card */}
                      <div
                        className={`ml-16 cursor-pointer transition-all duration-300 rounded-xl ${
                          activeAppointment.appointmentId ===
                          appointment.appointmentId
                            ? "ring-2 ring-primary shadow-lg scale-105 -translate-y-1"
                            : "hover:shadow-md hover:scale-102 hover:-translate-y-0.5"
                        }`}
                        onClick={() => handleAppointmentSelect(appointment)}
                      >
                        <div className="bg-white rounded-xl p-4  shadow-sm">
                          <div className="flex justify-between items-start mb-3">
                            <span className="text-xs textsecondary/20 font-mono bg-gray-100 px-2 py-1 rounded-lg">
                              #
                              {appointment.appointmentId?.substring(0, 8) ||
                                "Unknown"}
                            </span>
                            <span
                              className={`text-xs px-3 py-1 rounded-full font-semibold ${getStatusColor(
                                appointment.status
                              )}`}
                            >
                              {appointment.status.replace("_", " ")}
                            </span>
                          </div>

                          <div className="flex justify-between items-center">
                            <div className="space-y-2">
                              <div className="text-sm font-bold textsecondary/90">
                                {formatAppointmentDate(appointment)}
                              </div>
                              <div className="text-xs text-gray-600 font-medium flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {formatAppointmentTime(appointment)}
                              </div>
                            </div>
                            <div
                              className="p-1 rounded-full bg-primary/20 text-primary hover:bg-primary/70 hover:text-white"
                              onClick={() => {
                                setSelectedAppointmentId(
                                  appointment.appointmentId
                                );
                                setDetailModalOpen(true);
                              }}
                            >
                              <MoreVertical className="w-4 h-4" />
                            </div>
                          </div>

                          {/* Quick stats */}
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <div className="flex items-center justify-between text-xs textsecondary/20">
                              <span className="flex items-center">
                                <MessageCircle className="w-3 h-3 mr-1" />
                                Messages
                              </span>
                              <span className="font-medium">
                                {currentMessages.length}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
      {isDetailModalOpen && (
        <AppointmentDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          appointmentId={selectedAppointmentId}
          userRole={user.role.toUpperCase()}
        />
      )}
      {showExtensionModal && (
        <ExtensionRequestModal
          isOpen={showExtensionModal}
          onClose={() => setShowExtensionModal(false)}
          appointmentId={activeAppointment?.appointmentId}
          onSendRequest={handleExtensionRequest}
        />
      )}

      {showVideoModal && (
        <VideoCallModal
          isOpen={showVideoModal}
          onClose={handleCloseVideoModal}
          videoCallState={videoCallState}
          localVideoRef={localVideoRef}
          remoteVideoRef={remoteVideoRef}
          onAnswerCall={handleAnswerVideoCall}
          onRejectCall={handleAnswerVideoCall}
          onEndCall={handleEndVideoCall}
          onToggleAudio={toggleAudio}
          onToggleVideo={toggleVideo}
          onToggleScreenShare={toggleScreenShare}
          participantName={participantName}
          isInitiator={videoCallState.isInitiating}
        />
      )}

      {/* Doctor Extension Modal */}
      <DoctorExtensionModal
        isOpen={showDoctorModal}
        onClose={handleCloseDoctorModal}
        extensionRequestData={extensionRequestData}
        onAcceptExtension={handleDoctorAccept}
        onRejectExtension={handleDoctorReject}
        appointmentId={currentRoom?.appointmentId}
        isProcessing={isProcessing}
      />

      {/* Patient Extension Result Modal */}
      <PatientExtensionResultModal
        isOpen={showPatientResultModal}
        onClose={handleClosePatientResultModal}
        extensionStatus={extensionStatus}
        autoCloseDelay={8000}
      />
    </div>
  );
};

export default MedicalChatInterface;

import React, { useEffect, useState } from "react";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Monitor,
  MonitorOff,
  Minimize2,
  Maximize2,
  Volume2,
  VolumeX,
  Settings,
  X,
  UserCheck,
  UserX,
  Clock,
  AlertCircle,
  User,
} from "lucide-react";

const VideoCallModal = ({
  isOpen,
  onClose,
  videoCallState,
  localVideoRef,
  remoteVideoRef,
  onAnswerCall,
  onRejectCall,
  onEndCall,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  participantName,
  isInitiator = false,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);

  // Timer for call duration
  useEffect(() => {
    let interval;
    if (videoCallState.isInCall) {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(interval);
  }, [videoCallState.isInCall]);

  // Auto-hide controls
  useEffect(() => {
    if (!videoCallState.isInCall) return;
    
    const timer = setTimeout(() => {
      setShowControls(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [showControls, videoCallState.isInCall]);

  // Handle mouse movement to show controls
  const handleMouseMove = () => {
    setShowControls(true);
  };

  // Format call duration
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle volume change
  const handleVolumeChange = (e) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);
    if (remoteVideoRef.current) {
      remoteVideoRef.current.volume = newVolume / 100;
    }
  };

  // Toggle mute
  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (remoteVideoRef.current) {
      remoteVideoRef.current.muted = !isMuted;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90">
      <div 
        className={`relative bg-gray-900 rounded-lg shadow-2xl transition-all duration-300 ${
          isMinimized 
            ? 'w-80 h-60 fixed bottom-4 right-4' 
            : 'w-full h-full max-w-7xl max-h-[90vh] mx-4'
        }`}
        onMouseMove={handleMouseMove}
      >
        {/* Header */}
        <div className={`absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/70 to-transparent p-4 rounded-t-lg transition-opacity duration-300 ${
          showControls || !videoCallState.isInCall ? 'opacity-100' : 'opacity-0'
        }`}>
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="font-medium">
                  {videoCallState.isInCall ? 'In Call' : 
                   videoCallState.isReceivingCall ? 'Incoming Call' : 
                   videoCallState.isInitiating ? 'Calling...' : 'Video Call'}
                </span>
              </div>
              {videoCallState.isInCall && (
                <div className="flex items-center space-x-1 text-sm bg-black/30 px-2 py-1 rounded">
                  <Clock className="w-4 h-4" />
                  <span>{formatDuration(callDuration)}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                {isMinimized ? <Maximize2 className="w-5 h-5" /> : <Minimize2 className="w-5 h-5" />}
              </button>
              {!videoCallState.isReceivingCall && (
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Video Area */}
        <div className="relative w-full h-full rounded-lg overflow-hidden">
          {/* Remote Video (Main) */}
          <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
            {videoCallState.remoteStream ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center text-white">
                <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-12 h-12 text-gray-400" />
                </div>
                <p className="text-xl font-medium">{participantName || 'Participant'}</p>
                <p className="text-gray-400">
                  {videoCallState.isReceivingCall ? 'Incoming call...' : 
                   videoCallState.isInitiating ? 'Calling...' : 
                   'No video'}
                </p>
              </div>
            )}
          </div>

          {/* Local Video (Picture-in-Picture) */}
          {videoCallState.localStream && (
            <div className={`absolute ${isMinimized ? 'top-2 right-2 w-20 h-16' : 'top-4 right-4 w-48 h-36'} bg-gray-800 rounded-lg overflow-hidden shadow-lg border-2 border-white/20`}>
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {!videoCallState.mediaState.video && (
                <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                  <VideoOff className="w-6 h-6 text-gray-400" />
                </div>
              )}
            </div>
          )}

          {/* Connection Status */}
          {videoCallState.isInitiating && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-xl font-medium">Connecting...</p>
              </div>
            </div>
          )}

          {/* Incoming Call Overlay */}
          {videoCallState.isReceivingCall && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
              <div className="text-center text-white max-w-md mx-4">
                <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
                  <User className="w-16 h-16 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-2">
                  {videoCallState.caller?.name || 'Unknown'} is calling...
                </h3>
                <p className="text-gray-300 mb-8">
                  {videoCallState.callType === 'video' ? 'Video' : 'Audio'} call
                </p>
                
                <div className="flex justify-center space-x-6">
                  <button
                    onClick={() => onRejectCall(videoCallState.currentCallId, false)}
                    className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors shadow-lg"
                  >
                    <PhoneOff className="w-8 h-8 text-white" />
                  </button>
                  <button
                    onClick={() => onAnswerCall(videoCallState.currentCallId, true)}
                    className="w-16 h-16 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center transition-colors shadow-lg"
                  >
                    <Phone className="w-8 h-8 text-white" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        {videoCallState.isInCall && (
          <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 rounded-b-lg transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}>
            <div className="flex items-center justify-center space-x-4">
              {/* Audio Control */}
              <button
                onClick={onToggleAudio}
                className={`p-3 rounded-full transition-colors ${
                  videoCallState.mediaState.audio 
                    ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                    : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
              >
                {videoCallState.mediaState.audio ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
              </button>

              {/* Video Control */}
              <button
                onClick={onToggleVideo}
                className={`p-3 rounded-full transition-colors ${
                  videoCallState.mediaState.video 
                    ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                    : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
              >
                {videoCallState.mediaState.video ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
              </button>

              {/* Screen Share Control */}
              <button
                onClick={onToggleScreenShare}
                className={`p-3 rounded-full transition-colors ${
                  videoCallState.mediaState.screenShare 
                    ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                    : 'bg-gray-700 hover:bg-gray-600 text-white'
                }`}
              >
                {videoCallState.mediaState.screenShare ? <MonitorOff className="w-6 h-6" /> : <Monitor className="w-6 h-6" />}
              </button>

              {/* Volume Control */}
              <div className="flex items-center space-x-2 bg-gray-700 rounded-full px-3 py-2">
                <button onClick={toggleMute} className="text-white">
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-20 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${volume}%, #4b5563 ${volume}%, #4b5563 100%)`
                  }}
                />
              </div>

              {/* End Call */}
              <button
                onClick={() => onEndCall(videoCallState.currentCallId)}
                className="p-3 bg-red-500 hover:bg-red-600 rounded-full transition-colors text-white"
              >
                <PhoneOff className="w-6 h-6" />
              </button>
            </div>

            {/* Peer Media State Indicators */}
            <div className="flex items-center justify-center space-x-4 mt-3">
              <div className="flex items-center space-x-2 text-white text-sm">
                <span>Participant:</span>
                <div className="flex space-x-1">
                  <div className={`w-2 h-2 rounded-full ${videoCallState.peerMediaState.audio ? 'bg-green-400' : 'bg-red-400'}`} />
                  <Mic className="w-4 h-4" />
                </div>
                <div className="flex space-x-1">
                  <div className={`w-2 h-2 rounded-full ${videoCallState.peerMediaState.video ? 'bg-green-400' : 'bg-red-400'}`} />
                  <Video className="w-4 h-4" />
                </div>
                {videoCallState.peerMediaState.screenShare && (
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 rounded-full bg-blue-400" />
                    <Monitor className="w-4 h-4" />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoCallModal;