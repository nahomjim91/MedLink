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
                                href={`${process.env.NEXT_PUBLIC_TELEHEALTH_API_URL}${msg.fileUrl}`}
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
