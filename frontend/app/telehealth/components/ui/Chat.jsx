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
      status === AppointmentStatus.IN_PROGRESS && chatAccess?.canSendMessages
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
            {activeAppointment && canSendMessage(activeAppointment.status) && (
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
