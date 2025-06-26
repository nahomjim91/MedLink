import React, { useState, useRef, useEffect } from 'react';
import { Search, MessageCircle, Send, Check, Video, Clock, Calendar, User, ArrowLeft, Menu } from 'lucide-react';

// Mock data for demonstration
const mockChats = [
  {
    id: 1,
    doctorName: "Jane Doe",
    doctorAvatar: null,
    isOnline: true,
    lastMessage: "Hi, I want make enquiries about yo...",
    lastMessageTime: "12:55 am",
    unreadCount: 2,
    appointments: [
      {
        id: "app1",
        appointmentNumber: "#23456",
        date: "12 February 2025",
        startTime: "12:30 pm",
        endTime: "01:00 pm",
        status: "IN_PROGRESS",
        messages: [
          {
            id: "msg1",
            text: "Hello Janet, thank you for reaching out",
            sender: "doctor",
            timestamp: "12:57 am",
            isSeen: true
          },
          {
            id: "msg2",
            text: "Hello Janet.",
            sender: "patient",
            timestamp: "12:57 am",
            isSeen: true
          },
          {
            id: "msg3",
            text: "I want to know if the price is negotiable, I need about 2 Units",
            sender: "doctor",
            timestamp: "12:55 am",
            isSeen: false
          }
        ]
      }
    ]
  },
  {
    id: 2,
    doctorName: "Janet Adebayo",
    doctorAvatar: null,
    isOnline: false,
    lastMessage: "Hi, I want make enquiries about yo...",
    lastMessageTime: "12:55 am",
    unreadCount: 0,
    appointments: [
      {
        id: "app2",
        appointmentNumber: "#23457",
        date: "15 February 2025",
        startTime: "02:00 pm",
        endTime: "02:30 pm",
        status: "CONFIRMED",
        messages: []
      }
    ]
  },
  {
    id: 3,
    doctorName: "Kunle Adekunle",
    doctorAvatar: null,
    isOnline: true,
    lastMessage: "Hi, I want make enquiries about yo...",
    lastMessageTime: "12:55 am",
    unreadCount: 0,
    appointments: [
      {
        id: "app3",
        appointmentNumber: "#23458",
        date: "10 February 2025",
        startTime: "03:00 pm",
        endTime: "03:30 pm",
        status: "COMPLETED",
        messages: [
          {
            id: "msg4",
            text: "Thank you for the consultation",
            sender: "patient",
            timestamp: "3:25 pm",
            isSeen: true
          }
        ]
      }
    ]
  }
];

const AppointmentStatus = {
  REQUESTED: 'REQUESTED',
  CONFIRMED: 'CONFIRMED',
  REJECTED: 'REJECTED',
  CANCELLED_PATIENT: 'CANCELLED_PATIENT',
  CANCELLED_DOCTOR: 'CANCELLED_DOCTOR',
  UPCOMING: 'UPCOMING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  NO_SHOW: 'NO_SHOW'
};

const MedicalChatInterface = () => {
  const [activeChat, setActiveChat] = useState(null);
  const [activeAppointment, setActiveAppointment] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [message, setMessage] = useState("");
  const [showChatDetails, setShowChatDetails] = useState(false);
  const messagesEndRef = useRef(null);

  // Filter chats based on search
  const filteredChats = mockChats.filter(chat =>
    chat.doctorName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeAppointment?.messages]);

  const handleChatSelect = (chat) => {
    setActiveChat(chat);
    setShowChatDetails(true);
    // Set the first appointment as active by default
    if (chat.appointments && chat.appointments.length > 0) {
      setActiveAppointment(chat.appointments[0]);
    }
  };

  const handleBackToChats = () => {
    setShowChatDetails(false);
    setActiveChat(null);
    setActiveAppointment(null);
  };

  const handleAppointmentSelect = (appointment) => {
    setActiveAppointment(appointment);
  };

  const handleSendMessage = () => {
    if (!message.trim() || !activeAppointment) return;
    
    // Add message to current appointment (in real app, this would be an API call)
    const newMessage = {
      id: Date.now().toString(),
      text: message.trim(),
      sender: "patient",
      timestamp: new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }),
      isSeen: false
    };

    // In real implementation, update the messages through your state management
    setMessage("");
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
    return status === AppointmentStatus.IN_PROGRESS;
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
      AppointmentStatus.NO_SHOW
    ].includes(status);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Contacts Sidebar */}
      <div className={`${
        showChatDetails ? 'hidden lg:flex' : 'flex'
      } w-full lg:w-80 bg-white border-r border-gray-200 flex-col`}>
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
          {filteredChats.map((chat) => (
            <div
              key={chat.id}
              className={`flex items-center p-4 cursor-pointer hover:bg-gray-50 ${
                activeChat?.id === chat.id ? "bg-teal-50 border-r-2 border-teal-500" : ""
              }`}
              onClick={() => handleChatSelect(chat)}
            >
              <div className="relative">
                <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                  {chat.doctorAvatar ? (
                    <img
                      src={chat.doctorAvatar}
                      alt={chat.doctorName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-teal-600 font-semibold text-sm">
                      {getInitials(chat.doctorName)}
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
                    {chat.doctorName}
                  </h3>
                  <div className="flex items-center space-x-1">
                    {chat.unreadCount > 0 && (
                      <span className="bg-orange-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[18px] h-[18px] flex items-center justify-center">
                        {chat.unreadCount}
                      </span>
                    )}
                    <span className="text-xs text-gray-500">{chat.lastMessageTime}</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 truncate mt-1">
                  {chat.lastMessage}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`${
        showChatDetails ? 'flex' : 'hidden lg:flex'
      } flex-1 flex-col`}>
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
                      {activeChat.doctorAvatar ? (
                        <img
                          src={activeChat.doctorAvatar}
                          alt={activeChat.doctorName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-teal-600 font-semibold text-sm">
                          {getInitials(activeChat.doctorName)}
                        </span>
                      )}
                    </div>
                    {activeChat.isOnline && (
                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border border-white rounded-full"></div>
                    )}
                  </div>
                  <div className="ml-3">
                    <h2 className="text-lg font-semibold text-gray-900">{activeChat.doctorName}</h2>
                    <p className="text-sm text-gray-500">
                      {activeChat.isOnline ? "Online" : "Offline"}
                    </p>
                  </div>
                </div>
                
                {shouldShowVideoButton(activeAppointment?.status) && (
                  <button className="bg-teal-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-teal-600 transition-colors">
                    <Video className="w-4 h-4" />
                    <span className="hidden sm:inline">Video</span>
                  </button>
                )}
              </div>

              {/* Appointment Timeline */}
              {activeChat.appointments && activeChat.appointments.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Appointment History</h3>
                  <div className="flex space-x-4 overflow-x-auto pb-2">
                    {activeChat.appointments.map((appointment, index) => (
                      shouldShowAppointment(appointment.status) && (
                        <div
                          key={appointment.id}
                          className={`flex-shrink-0 cursor-pointer transition-all ${
                            activeAppointment?.id === appointment.id 
                              ? "ring-2 ring-teal-500" 
                              : ""
                          }`}
                          onClick={() => handleAppointmentSelect(appointment)}
                        >
                          <div className="bg-gray-50 rounded-lg p-3 min-w-[180px] sm:min-w-[200px]">
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-xs text-gray-500">{appointment.appointmentNumber}</span>
                              <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(appointment.status)}`}>
                                {appointment.status.replace('_', ' ')}
                              </span>
                            </div>
                            <div className="text-sm font-medium text-gray-900 mb-1">
                              {appointment.date}
                            </div>
                            <div className="text-xs text-gray-500">
                              {appointment.startTime} - {appointment.endTime}
                            </div>
                          </div>
                        </div>
                      )
                    ))}
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
                  {activeAppointment.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`mb-4 flex ${
                        msg.sender === "patient" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-xs sm:max-w-sm lg:max-w-md px-4 py-2 rounded-2xl ${
                          msg.sender === "patient"
                            ? "bg-teal-500 text-white"
                            : "bg-white text-gray-900"
                        }`}
                      >
                        <p className="text-sm break-words">{msg.text}</p>
                        <div className={`flex items-center mt-1 ${
                          msg.sender === "patient" ? "justify-end" : "justify-start"
                        }`}>
                          <span className={`text-xs ${
                            msg.sender === "patient" ? "text-teal-100" : "text-gray-500"
                          }`}>
                            {msg.timestamp}
                          </span>
                          {msg.sender === "patient" && (
                            <Check className={`w-3 h-3 ml-1 ${
                              msg.isSeen ? "text-teal-100" : "text-teal-200"
                            }`} />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

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
                    <p className="text-gray-500">Select an appointment to view messages</p>
                  </div>
                </div>
              )}
            </div>

            {/* Message Input */}
            {activeAppointment && canSendMessage(activeAppointment.status) && (
              <div className="bg-white border-t border-gray-200 p-4">
                <div className="flex items-center space-x-3">
                  <button className="text-teal-500 hover:text-teal-600">
                    <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                      <span className="text-lg">+</span>
                    </div>
                  </button>
                  <div className="flex-1 flex items-center space-x-2">
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                      placeholder="Your message"
                      className="flex-1 px-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                    <button className="text-gray-400 hover:text-gray-600 hidden sm:block">
                      <MessageCircle className="w-5 h-5" />
                    </button>
                  </div>
                  <button
                    onClick={handleSendMessage}
                    disabled={!message.trim()}
                    className="bg-teal-500 text-white p-2 rounded-full hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center px-4">
              <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Select a conversation
              </h3>
              <p className="text-gray-500">
                Choose a conversation from the list to start messaging.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicalChatInterface;