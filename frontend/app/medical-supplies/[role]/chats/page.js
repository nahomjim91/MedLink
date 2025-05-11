"use client";
import { useState } from "react";
import { Search, MessageCircle, ChevronRight, Send, Check } from "lucide-react";
import Image from "next/image";

// Sample data for conversations
const conversations = [
  {
    id: 1,
    name: "Jane Doe",
    avatar: "/api/placeholder/40/40",
    lastMessage: "Hi, I want make inquiries about your product",
    time: "12:55 am",
    isNew: true,
    isHighlighted: true,
    messages: [
      {
        id: 1,
        date: "12 February 2023",
        messages: [
          {
            id: 1,
            product: {
              name: "Paracetamol",
              price: "$35.5",
              stock: "12 in Stock",
            },
            text: "Hello, I want to make inquiries about your product",
            time: "12:55 am",
            isUser: false,
          },
          {
            id: 2,
            text: "Hello Jane!, thank you for reaching out",
            time: "12:57 am",
            isUser: true,
          },
          {
            id: 3,
            text: "What do you need to know?",
            time: "12:57 am",
            isUser: true,
          },
        ],
      },
      {
        id: 2,
        date: "Today",
        messages: [
          {
            id: 1,
            text: "I want to know if the price is negotiable.\nI need about 2 Units",
            time: "12:58 am",
            isUser: false,
          },
        ],
      },
    ],
  },
  {
    id: 2,
    name: "Janet Adebayo",
    avatar: "/api/placeholder/40/40",
    lastMessage: "Hi, I want make inquiries about your product",
    time: "12:55 am",
    isNew: true,
    isHighlighted: false,
  },
  {
    id: 3,
    name: "Kunle Adekunle",
    avatar: "/api/placeholder/40/40",
    lastMessage: "Hi, I want make inquiries about your product",
    time: "12:55 am",
    isNew: true,
    isHighlighted: false,
  },
  {
    id: 4,
    name: "Jane Doe",
    avatar: "/api/placeholder/40/40",
    lastMessage: "Hi, I want make inquiries about your product",
    time: "12:55 am",
    isNew: false,
    isHighlighted: true,
  },
  {
    id: 5,
    name: "Janet Adebayo",
    avatar: "/api/placeholder/40/40",
    lastMessage: "Hi, I want make inquiries about your product",
    time: "12:55 am",
    isNew: false,
    isHighlighted: false,
  },
  {
    id: 6,
    name: "Kunle Adekunle",
    avatar: "/api/placeholder/40/40",
    lastMessage: "Hi, I want make inquiries about your product",
    time: "12:55 am",
    isNew: false,
    isHighlighted: false,
  },
  {
    id: 7,
    name: "Kunle Adekunle",
    avatar: "/api/placeholder/40/40",
    lastMessage: "Hi, I want make inquiries about your product",
    time: "12:55 am",
    isNew: false,
    isHighlighted: false,
  },
  {
    id: 8,
    name: "Kunle Adekunle",
    avatar: "/api/placeholder/40/40",
    lastMessage: "Macbook Pro",
    time: "12:55 am",
    isNew: false,
    isHighlighted: false,
  },
];

export default function ChatsPage() {
  const [activeConversation, setActiveConversation] = useState(
    conversations[0]
  );
  const [message, setMessage] = useState("");

  return (
    <div className="flex flex-col">
      <h1 className="text-xl font-medium text-secondary/80">Conversations</h1>
      <div className="flex ">
        {/* Conversations List */}
        <div className="w-1/3 bg-white rounded-lg shadow-md m-2 overflow-hidden flex flex-col">
          <div className="p-4">
            <div className="flex justify-between items-center ">
              <span className="text-secondary/70 mr-2">Contacts</span>
              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-500">
                34
              </span>
            </div>

            <div className="mt-3 relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search"
                className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`flex items-center px-3 py-2 border-b border-secondary/10 cursor-pointer hover:bg-gray-50 ${
                  activeConversation.id === conversation.id ? "bg-gray-50" : ""
                }`}
                onClick={() => setActiveConversation(conversation)}
              >
                 <div className="w-10 h-10 rounded-full overflow-hidden">
                 <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary text-xl font-bold">
                {conversation.profilePictuerURL ? (
                  <Image
                    src={conversation.profilePictuerURL}
                    alt={order.supplier}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  conversation.name.charAt(0)
                )}
              </div>
                </div>

                <div className="ml-3 flex-1">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-medium text-secondary/80">
                      {conversation.name}
                    </h3>
                    <div className="flex items-center">
                      {conversation.isNew && (
                        <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded mr-1">
                          New
                        </span>
                      )}
                      {conversation.isHighlighted && (
                        <span className="w-5 h-5 flex items-center justify-center bg-amber-100 rounded-full text-amber-500">
                          2
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xs text-gray-500 truncate max-w-xs">
                      {conversation.lastMessage}
                    </p>
                    <span className="text-xs text-gray-400">
                      {conversation.time}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Detail */}
        <div className="flex-1 bg-white rounded-lg shadow-sm m-2 overflow-hidden flex flex-col">
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b flex justify-between items-center">
                <div className="flex items-center">
                  <img
                    src={activeConversation.avatar}
                    alt={activeConversation.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="ml-3">
                    <h2 className="text-md font-medium text-gray-800">
                      {activeConversation.name}
                    </h2>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full mr-1"></div>
                      <span className="text-xs text-gray-500">
                        Online • {activeConversation.time}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1 text-xs rounded border border-emerald-500 text-emerald-500">
                    New Customer
                  </button>
                  <button className="px-3 py-1 text-xs rounded text-emerald-500">
                    View Profile
                  </button>
                  <button className="flex items-center gap-1 px-3 py-1 text-xs rounded text-gray-500">
                    <span>0 Orders</span>
                  </button>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                {activeConversation.messages?.map((dateGroup) => (
                  <div key={dateGroup.id}>
                    <div className="text-center my-4">
                      <span className="text-xs bg-gray-200 text-gray-600 px-3 py-1 rounded-full">
                        {dateGroup.date}
                      </span>
                    </div>

                    {dateGroup.messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`mb-4 flex ${
                          msg.isUser ? "justify-end" : "justify-start"
                        }`}
                      >
                        {!msg.isUser && msg.product && (
                          <div className="max-w-xs">
                            <div className="mb-2 bg-white border rounded-lg p-2 shadow-sm">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-blue-100 rounded"></div>
                                <div>
                                  <p className="text-sm font-medium">
                                    {msg.product.name}
                                  </p>
                                  <p className="text-sm font-medium text-secondary/70">
                                    {msg.product.price}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {msg.product.stock}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="bg-emerald-100 rounded-lg p-3 text-sm text-emerald-800 inline-block max-w-xs">
                              {msg.text.split("\n").map((line, i) => (
                                <p key={i}>{line}</p>
                              ))}
                              <div className="text-right mt-1">
                                <span className="text-xs text-emerald-600">
                                  {msg.time}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {!msg.isUser && !msg.product && (
                          <div className="bg-emerald-100 rounded-lg p-3 text-sm text-emerald-800 inline-block max-w-xs">
                            {msg.text.split("\n").map((line, i) => (
                              <p key={i}>{line}</p>
                            ))}
                            <div className="text-right mt-1">
                              <span className="text-xs text-emerald-600">
                                {msg.time}
                              </span>
                            </div>
                          </div>
                        )}

                        {msg.isUser && (
                          <div className="bg-gray-200 rounded-lg p-3 text-sm text-gray-800 inline-block max-w-xs">
                            {msg.text}
                            <div className="text-right mt-1 flex items-center justify-end">
                              <span className="text-xs text-gray-500 mr-1">
                                {msg.time}
                              </span>
                              <Check className="h-3 w-3 text-emerald-500" />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="p-3 border-t flex items-center">
                <button className="p-2 text-emerald-500 rounded-full hover:bg-gray-100">
                  <svg
                    className="w-6 h-6"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 5V19M5 12H19"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <input
                  type="text"
                  placeholder="Your message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="flex-1 p-2 mx-2 bg-transparent focus:outline-none text-gray-600"
                />
                <button className="p-2 bg-emerald-500 text-white rounded-full">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            // Empty state
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                <MessageCircle className="h-8 w-8 text-emerald-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                Messages
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Click on a contact to view messages.
              </p>
              <button className="flex items-center px-4 py-2 bg-emerald-500 text-white rounded-lg">
                <span>New Message</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
