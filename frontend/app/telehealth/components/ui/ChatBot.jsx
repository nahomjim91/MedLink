import { useState, useEffect, useRef } from "react";
import {
  Send,
  Bell,
  Menu,
  User,
  Bot,
  Search,
  FileText,
  Pill,
  ChevronDown,
  MessageCircle,
  X,
  Minimize2,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import useRAG from "../../hooks/useRAG";

// Markdown renderer component
const MarkdownRenderer = ({ content }) => {
  const renderMarkdown = (text) => {
    if (!text) return text;

    // Convert markdown to HTML-like structure
    let html = text
      // Headers
      .replace(/^### (.*$)/gm, "<h3>$1</h3>")
      .replace(/^## (.*$)/gm, "<h2>$1</h2>")
      .replace(/^# (.*$)/gm, "<h1>$1</h1>")
      // Bold
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      // Italic
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      // Code
      .replace(/`(.*?)`/g, "<code>$1</code>")
      // Blockquotes
      .replace(/^> (.*$)/gm, "<blockquote>$1</blockquote>")
      // Line breaks
      .replace(/\n/g, "<br/>");

    return html;
  };

  const createMarkup = () => {
    return { __html: renderMarkdown(content) };
  };

  return (
    <div
      className="markdown-content prose-sm max-w-none"
      dangerouslySetInnerHTML={createMarkup()}
      style={{
        "--tw-prose-body": "inherit",
        "--tw-prose-headings": "inherit",
        "--tw-prose-bold": "inherit",
        "--tw-prose-code": "inherit",
      }}
    />
  );
};

const MedLinkChatBot = ({
  isOpener: initialIsOpener = false,
  setIsOpener: externalSetIsOpener,
  lang = "english",
  onClick,
}) => {
  const { user } = useAuth();
  const { queryEnglish, queryAmharic, loading, error } = useRAG();

  // Internal state for chat open/close if no external control is provided
  const [internalIsOpener, setInternalIsOpener] = useState(initialIsOpener);
  const isOpener = externalSetIsOpener ? initialIsOpener : internalIsOpener;
  const setIsOpener = externalSetIsOpener || setInternalIsOpener;

  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState(lang);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpener && messages.length === 0) {
      const welcomeMessage = {
        id: Date.now(),
        type: "ai",
        content:
          user?.role === "doctor"
            ? `Hello Dr. ${user.firstName}! 👋\n\nI'm your **clinical assistant**. I can help you with:\n- Differential diagnosis\n- Evidence-based medicine\n- Drug references\n- Clinical guidelines\n\nHow can I assist you today?`
            : `Hi there! 👋\n\nI'm your **MedLink assistant**. I'm here to help with your health questions and concerns.\n\n*Please note: I provide information for educational purposes only. Always consult with healthcare professionals for medical advice.*\n\nWhat can I help you with today?`,
        timestamp: new Date(),
        isWelcome: true,
      };

      // Animate welcome message
      setTimeout(() => {
        setMessages([welcomeMessage]);
      }, 500);
    }
  }, [isOpener, user, messages.length]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    const userMessage = {
      id: Date.now(),
      type: "user",
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentMessage = inputMessage;
    setInputMessage("");
    setShowQuickActions(false);
    setIsTyping(true);

    try {
      // Simulate typing delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      let response;
      const gender = user?.gender === "M" ? "male" : "female";

      if (user?.role === "patient" && selectedLanguage === "amharic") {
        response = await queryAmharic(currentMessage, gender);
      } else {
        response = await queryEnglish(currentMessage, gender , user?.role);
      }

      setIsTyping(false);

      const aiMessage = {
        id: Date.now() + 1,
        type: "ai",
        content: response.answer || response,
        timestamp: new Date(),
        confidence: response.confidence,
        sources: response.sources,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      setIsTyping(false);
      const errorMessage = {
        id: Date.now() + 1,
        type: "ai",
        content:
          "⚠️ Sorry, I encountered an error while processing your request. Please try again.",
        timestamp: new Date(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  };

  const handleQuickAction = (action) => {
    setInputMessage(action);
    setShowQuickActions(false);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const commonIssues = [
    "🤕 Headache symptoms",
    "🤧 Cold & flu treatment",
    "🩺 Skin condition help",
    "🤧 Allergy management",
    "💊 Medication questions",
    "😔 Mental health support",
  ];

  const clinicalTools = [
    "🔍 Differential diagnosis",
    "📚 Evidence-based search",
    "💊 Drug reference lookup",
    "📝 Clinical documentation",
    "📋 Treatment guidelines",
    "🔬 Research assistance",
  ];

  // Floating chat button when closed
  if (!isOpener) {
    return (
      <div className="fixed bottom-4 right-5 z-50">
        <button
          onClick={() => setIsOpener(true)}
          className="w-14 h-14 bg-teal-500 hover:bg-teal-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
        >
          <Bot className="w-6 h-6 group-hover:scale-110 transition-transform" />
        </button>
        {/* Notification badge */}
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
          <span className="text-xs text-white">!</span>
        </div>
      </div>
    );
  }

  // Main chat window when opened - Fixed layout structure
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div
        className={`bg-white rounded-2xl shadow-2xl border border-gray-200 transition-all duration-500 ease-in-out transform ${
          isMinimized
            ? "w-80 h-16 scale-95"
            : " w-[95vw] md:w-[30vw] h-[90vh] scale-100"
        } hover:shadow-3xl flex flex-col`}
      >
        {/* Header - Fixed height */}
        <div className="bg-gradient-to-r from-teal-500 to-primary/80 text-white p-4 rounded-t-2xl flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Bot className="w-6 h-6" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
            </div>
            <div>
              <h3 className="font-bold text-base">MedLink AI</h3>
              <p className="text-xs text-white/80 flex items-center">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse"></span>
                Online & Ready
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors duration-200"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsOpener(false)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors duration-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Chat content - hidden when minimized */}
        {!isMinimized && (
          <>
            {/* Quick Actions - Optional section */}
            {showQuickActions && messages.length <= 1 && (
              <div className="p-4 bg-gradient-to-b from-gray-50 to-white border-b border-gray-100 animate-fadeIn flex-shrink-0">
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Sparkles className="w-4 h-4 mr-1 text-teal-500" />
                    Quick Actions
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {(user?.role === "doctor" ? clinicalTools : commonIssues)
                      .slice(0, 3)
                      .map((item, index) => (
                        <button
                          key={index}
                          className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-700 hover:bg-gradient-to-r hover:from-teal-50 hover:to-blue-50 hover:border-teal-200 transition-all duration-200 text-left transform hover:scale-105 hover:shadow-sm"
                          onClick={() =>
                            handleQuickAction(
                              item.replace(/^\p{Emoji}\s*/u, "")
                            )
                          }
                        >
                          {item}
                        </button>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* Messages - Flexible height with proper scrolling */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-white to-gray-50 min-h-0">
              {messages.map((message, index) => (
                <div
                  key={message.id}
                  className={`animate-slideIn`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div
                    className={`flex ${
                      message.type === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div className="flex items-start space-x-3 max-w-[85%] group">
                      {message.type === "ai" && (
                        <div className="w-8 h-8 bg-gradient-to-r from-teal-500 to-primary/80 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                      )}

                      <div className="flex flex-col space-y-1 max-w-full">
                        <div
                          className={`rounded-2xl px-4 py-3 text-sm shadow-sm transition-all duration-200 ${
                            message.type === "user"
                              ? "bg-gradient-to-r from-teal-500 to-primary/80 text-white ml-auto"
                              : message.isError
                              ? "bg-red-50 text-red-800 border border-red-200"
                              : "bg-white text-gray-800 border border-gray-200 hover:shadow-md"
                          }`}
                        >
                          {message.type === "ai" ? (
                            <MarkdownRenderer content={message.content} />
                          ) : (
                            <p className="whitespace-pre-wrap break-words">
                              {message.content}
                            </p>
                          )}

                          {message.confidence && (
                            <div className="mt-2 flex items-center space-x-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                                <div
                                  className="bg-gradient-to-r from-teal-500 to-primary/80 h-1.5 rounded-full transition-all duration-1000"
                                  style={{
                                    width: `${message.confidence * 100}%`,
                                  }}
                                ></div>
                              </div>
                              <span className="text-xs text-gray-500">
                                {Math.round(message.confidence * 100)}%
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Message actions */}
                        {message.type === "ai" && !message.isError && (
                          <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <button
                              onClick={() => copyToClipboard(message.content)}
                              className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 text-xs"
                              title="Copy"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                            <button className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-green-600 text-xs">
                              <ThumbsUp className="w-3 h-3" />
                            </button>
                            <button className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-red-600 text-xs">
                              <ThumbsDown className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>

                      {message.type === "user" && (
                        <div className="w-8 h-8 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                          <User className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div
                    className={`text-xs text-gray-400 mt-1 px-2 ${
                      message.type === "user" ? "text-right" : "text-left"
                    }`}
                  >
                    {formatTime(message.timestamp)}
                  </div>
                </div>
              ))}

              {(loading || isTyping) && (
                <div className="flex justify-start animate-slideIn">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-teal-500 to-primary/80 rounded-full flex items-center justify-center shadow-sm">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-white rounded-2xl px-4 py-3 border border-gray-200 shadow-sm">
                      <div className="flex space-x-1 items-center">
                        <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-teal-500 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-teal-500 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                        <span className="ml-2 text-xs text-gray-500">
                          Thinking...
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area - Fixed height at bottom */}
            <div className="border-t border-gray-200 p-4 bg-white rounded-b-2xl flex-shrink-0">
              {user?.role === "patient" && (
                <div className="mb-3">
                  <button
                    className="flex items-center space-x-2 text-xs px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors duration-200"
                    onClick={() =>
                      setSelectedLanguage(
                        selectedLanguage === "english" ? "amharic" : "english"
                      )
                    }
                  >
                    <span className="capitalize font-medium">
                      {selectedLanguage}
                    </span>
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>
              )}

              <div className="flex items-end space-x-3">
                <div className="flex-1 relative">
                  <textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className="w-full px-4 py-3 text-sm border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors duration-200 resize-none max-h-20 min-h-[48px]"
                    disabled={loading}
                    rows={1}
                  />
                  {inputMessage && (
                    <button
                      onClick={() => setInputMessage("")}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={loading || !inputMessage.trim()}
                  className="w-12 h-12 bg-gradient-to-r from-teal-500 to-primary/80 text-white rounded-full flex items-center justify-center hover:from-teal-600 hover:to-blue-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 shadow-lg flex-shrink-0"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>

              {error && (
                <div className="mt-3 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-200 animate-slideIn">
                  {error}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }

        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }

        .markdown-content h1 {
          font-size: 1.25rem;
          font-weight: bold;
          margin: 0.5rem 0;
          color: #1f2937;
        }

        .markdown-content h2 {
          font-size: 1.125rem;
          font-weight: bold;
          margin: 0.5rem 0;
          color: #1f2937;
        }

        .markdown-content h3 {
          font-size: 1rem;
          font-weight: 600;
          margin: 0.5rem 0;
          color: #1f2937;
        }

        .markdown-content strong {
          font-weight: 600;
          color: #059669;
        }

        .markdown-content em {
          font-style: italic;
          color: #6b7280;
        }

        .markdown-content code {
          background-color: #f3f4f6;
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
          font-family: monospace;
          font-size: 0.875rem;
          color: #dc2626;
        }

        .markdown-content blockquote {
          border-left: 4px solid #059669;
          padding-left: 1rem;
          margin: 0.5rem 0;
          color: #6b7280;
          font-style: italic;
          background-color: #f0fdfa;
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
        }

        .markdown-content ul {
          margin: 0.5rem 0;
          padding-left: 1.5rem;
        }

        .markdown-content li {
          margin: 0.25rem 0;
        }
      `}</style>
    </div>
  );
};

export default MedLinkChatBot;
