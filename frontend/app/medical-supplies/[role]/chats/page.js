"use client";
import { useState, useEffect, useRef } from "react";
import {
  Search,
  MessageCircle,
  ChevronRight,
  Send,
  Check,
  Plus,
} from "lucide-react";
import Image from "next/image";
import { ChatInput } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { useSocketContext } from "../../context/SocketContext";
import { useMSAuth } from "../../hooks/useMSAuth";
import { NewConversationModal } from "../../components/modal/NewConversationModal";

export default function ChatsPage() {
  const { user } = useMSAuth(); // Get current user
  const {
    // Socket state
    isConnected,
    onlineUsers,
    isUserOnline,
    isUserTyping,

    // Chat data
    messages,
    chats,
    unreadCount,

    // Chat functions
    sendMessage,
    loadMessages,
    refreshChats,
    markMessagesAsSeen,
    joinChatRoom,
    leaveChatRoom,
    startTyping,
    stopTyping,

    // State setters
    setMessages,
  } = useSocketContext();

  const [activeConversation, setActiveConversation] = useState(null);
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const chatBackendUrl = "http://localhost:4001";

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle conversation selection
  const handleConversationSelect = async (conversation) => {
    // Leave previous chat room
    if (activeConversation?.id) {
      leaveChatRoom(activeConversation.id);
    }

    // Set new active conversation
    setActiveConversation(conversation);

    // Join new chat room and load messages
    joinChatRoom(conversation.id);

    // Mark messages as seen
    await markMessagesAsSeen(conversation.id);
  };

  // Handle message sending
  const handleSendMessage = async () => {
    if (!message.trim() || !activeConversation?.id || !isConnected) return;

    const messageText = message.trim();
    setMessage("");

    try {
      await sendMessage(activeConversation.id, messageText);
      // Stop typing indicator
      stopTyping(activeConversation.id);
      setIsTyping(false);
    } catch (error) {
      console.error("Failed to send message:", error);
      // Restore message on error
      setMessage(messageText);
    }
  };

  // Handle typing indicators
  const handleTyping = (value) => {
    setMessage(value);

    if (!activeConversation?.id) return;

    if (value.trim() && !isTyping) {
      startTyping(activeConversation.id);
      setIsTyping(true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        stopTyping(activeConversation.id);
        setIsTyping(false);
      }
    }, 2000);
  };

  // Create new conversation
  const createConversation = async (userIds) => {
    try {
      const response = await fetch(
        `${chatBackendUrl}/api/chat/create-conversation`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            participants: [user.userId, ...userIds],
            type: "private",
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to create conversation");
      }

      const result = await response.json();

      // Refresh chats to include new conversation
      await refreshChats();

      return result.conversation;
    } catch (error) {
      console.error("Error creating conversation:", error);
      throw error;
    }
  };

  // Filter conversations based on search
  const filteredChats = chats.filter(
    (chat) =>
      chat.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.participants?.some((p) =>
        p.name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  // Get conversation display name

  // const getConversationName = (conversation) => {
  //   // console.log("getConversationName called with conversation:", conversation);
  //   if (conversation.name) return conversation.name;

  //   // For private chats, show other participant's name
  //   const otherParticipant = conversation.participants?.find(
  //     p => p.userId !== user?.userId
  //   );
  //   return otherParticipant?.name || 'Unknown User';
  // };

  // // Get conversation avatar
  // const getConversationAvatar = (conversation) => {
  //   if (conversation.avatar) return conversation.avatar;

  //   const otherParticipant = conversation.participants?.find(
  //     p => p.userId !== user?.userId
  //   );
  //   return otherParticipant?.profilePictureURL;
  // };

  const getConversationName = (conversation) => conversation.name;
  const getConversationAvatar = (conversation) => conversation.avatar;

  // Format message time
  const formatTime = (timestamp) => {
    // Check if it's a Firestore timestamp
    if (timestamp?._seconds !== undefined) {
      const millis =
        timestamp._seconds * 1000 + Math.floor(timestamp._nanoseconds / 1e6);
      return new Date(millis).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    }

    // Fallback if it's a native timestamp or Date
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Group messages by date
  const groupMessagesByDate = (messages) => {
    const grouped = {};

    messages.forEach((msg) => {
      let dateObj;
      if (msg.createdAt?._seconds !== undefined) {
        // Firestore timestamp
        const millis =
          msg.createdAt._seconds * 1000 +
          Math.floor(msg.createdAt._nanoseconds / 1e6);
        dateObj = new Date(millis);
      } else {
        // JS Date or millisecond timestamp
        dateObj = new Date(msg.createdAt);
      }

      const date = dateObj.toDateString();

      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(msg);
    });

    return Object.entries(grouped).map(([date, msgs]) => ({
      date: date === new Date().toDateString() ? "Today" : date,
      messages: msgs,
    }));
  };

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="flex flex-col">
      <div className="flex justify-between pb-2">
        <h1 className="text-xl font-medium text-secondary/80">
          Conversations
          {!isConnected && (
            <span className="text-xs text-red-500 ml-2">(Disconnected)</span>
          )}
        </h1>
        <Button
          className="py-1 flex gap-1.5 items-center justify-center"
          onClick={() => setIsModalOpen(true)}
          disabled={!isConnected}
        >
          
          <Plus className="w-4 h-4 mr-1" />
          New Conversation
        </Button>
      </div>

      <div className="flex">
        {/* Conversations List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col">
          <div className="px-4 py-2">
            <div className="flex justify-between items-center">
              <span className="text-secondary/70 mr-2">Contacts</span>
              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-500">
                {filteredChats.length}
              </span>
            </div>

            <div className="mt-3 relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent"
              />
            </div>
          </div>

          <div className="h-[32rem] overflow-y-auto">
            <div className="flex-1 overflow-y-auto">
              {filteredChats.map((conversation) => {
                const conversationName = getConversationName(conversation);
                const avatar = getConversationAvatar(conversation);
                const otherParticipant = conversation.participants?.[0];
                const isOnline = otherParticipant
                  ? isUserOnline(otherParticipant.userId)
                  : false;
                const isTypingNow = otherParticipant
                  ? isUserTyping(otherParticipant.userId)
                  : false;

                return (
                  <div
                    key={conversation.id + conversationName}
                    className={`flex items-center px-3 py-3 border-b border-secondary/10 cursor-pointer hover:bg-gray-50 ${
                      activeConversation?.id === conversation.id
                        ? "bg-primary/20"
                        : ""
                    }`}
                    onClick={() => handleConversationSelect(conversation)}
                  >
                    <div className="relative w-10 h-10 rounded-full overflow-hidden">
                      <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary text-xl font-bold">
                        {avatar ? (
                          <Image
                            src={avatar}
                            alt={conversationName}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          conversationName.charAt(0).toUpperCase()
                        )}
                      </div>
                      {isOnline && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>

                    <div className="ml-3 flex-1">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-medium text-secondary/80">
                          {conversationName}
                        </h3>
                        <div className="flex items-center">
                          {conversation.unreadCount > 0 && (
                            <span className="w-5 h-5 flex items-center justify-center bg-primary text-white text-xs rounded-full">
                              {conversation.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <p className="text-xs text-gray-500 truncate w-4/5 pr-2">
                          {isTypingNow ? (
                            <span className="text-primary italic">
                              typing...
                            </span>
                          ) : (
                            conversation.lastMessage?.textContent ||
                            "No messages yet"
                          )}
                        </p>
                        <span className="text-xs text-gray-400 flex-shrink-0">
                          {conversation.lastMessageTime &&
                            formatTime(conversation.lastMessageTime)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Chat Detail */}
        <div className="flex-1 bg-background rounded-lg shadow-sm mx-2 overflow-hidden flex flex-col">
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <div className="px-4 py-2 bg-white border-b border-secondary/10 flex justify-between items-center">
                <div className="flex items-center">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden">
                    <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary text-xl font-bold">
                      {getConversationAvatar(activeConversation) ? (
                        <Image
                          src={getConversationAvatar(activeConversation)}
                          alt={getConversationName(activeConversation)}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        getConversationName(activeConversation)
                          .charAt(0)
                          .toUpperCase()
                      )}
                    </div>
                  </div>
                  <div className="ml-3">
                    <h2 className="text-md font-medium text-secondary/80">
                      {getConversationName(activeConversation)}
                    </h2>
                    <div className="flex items-center">
                      {(() => {
                        const otherParticipant =
                          activeConversation.participants?.find(
                            (p) => p.userId !== user?.userId
                          );
                        const isOnline = otherParticipant
                          ? isUserOnline(otherParticipant.userId)
                          : false;
                        const isTypingNow = otherParticipant
                          ? isUserTyping(otherParticipant.userId)
                          : false;

                        return (
                          <>
                            <div
                              className={`w-2 h-2 rounded-full mr-1 ${
                                isOnline ? "bg-green-500" : "bg-gray-400"
                              }`}
                            ></div>
                            <span className="text-xs text-secondary/50">
                              {isTypingNow
                                ? "typing..."
                                : isOnline
                                ? "Online"
                                : "Offline"}
                            </span>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="h-[31rem] overflow-y-auto">
                <div className="flex-1 overflow-y-auto px-4 py-2 bg-background flex flex-col">
                  {messageGroups.map((dateGroup, groupIndex) => (
                    <div key={groupIndex}>
                      <div className="text-center my-4">
                        <span className="text-xs bg-gray-200 text-secondary/60 px-3 py-1 rounded-full">
                          {dateGroup.date}
                        </span>
                      </div>

                      {dateGroup.messages.map((msg) => {
                        const isCurrentUser = msg.from === user?.userId;

                        return (
                          <div
                            key={msg.id}
                            className={`mb-4 flex ${
                              isCurrentUser ? "justify-end" : "justify-start"
                            }`}
                          >
                            <div
                              className={`max-w-xs ${
                                isCurrentUser ? "ml-auto" : "mr-auto"
                              }`}
                            >
                              <div
                                className={`
                                p-3 text-sm inline-block max-w-full break-words
                                ${
                                  isCurrentUser
                                    ? "bg-primary text-white rounded-t-2xl rounded-l-2xl"
                                    : "bg-gray-100 text-secondary rounded-t-2xl rounded-r-2xl"
                                }
                              `}
                              >
                                {msg.textContent}
                              </div>
                              <div
                                className={`flex items-center mt-1 ${
                                  isCurrentUser
                                    ? "justify-end"
                                    : "justify-start"
                                }`}
                              >
                                <span className="text-xs text-gray-500">
                                  {formatTime(msg.createdAt)}
                                </span>
                                {isCurrentUser && (
                                  <Check
                                    className={`h-3 w-3 ml-1 ${
                                      msg.isSeen
                                        ? "text-blue-500"
                                        : "text-gray-400"
                                    }`}
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Message Input */}
              <div className="bg-white px-4 py-3 border-t border-secondary/10">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => handleTyping(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder="Type a message..."
                    disabled={!isConnected}
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent disabled:bg-gray-100"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!message.trim() || !isConnected}
                    className="px-4 py-2"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            // Empty state
            <div className="bg-white flex flex-col items-center justify-center h-full text-center p-4">
              <div className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <MessageCircle size={52} className="text-primary" />
              </div>
              <h3 className="text-lg font-medium text-secondary mb-2">
                Select a conversation
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Choose a conversation from the list to start messaging.
              </p>
              <Button onClick={() => setIsModalOpen(true)} className="py-2 px-4 flex items-center">
                <Plus className="w-4 h-4 mr-2" />
                New Conversation
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* New Conversation Modal */}
      <NewConversationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelectUser={handleConversationSelect}
        createConversation={createConversation}
        loading={false}
      />
    </div>
  );
}
