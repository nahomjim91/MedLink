"use client";
import { useState } from "react";
import { Search, MessageCircle, ChevronRight, Send, Check } from "lucide-react";
import Image from "next/image";
import { ChatInput } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";

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
          {
            id: 2,
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
    conversations[3]
  );
  const [message, setMessage] = useState("");

  return (
    <div className="flex flex-col">
      <div className="flex justify-between pb-2">
        <h1 className="text-xl font-medium text-secondary/80">Conversations</h1>
        <Button className="py-1">New Conversation</Button>
      </div>
      <div className="flex ">
        {/* Conversations List */}
        <div className=" bg-white rounded-lg shadow-md  overflow-hidden flex flex-col">
          <div className="px-4 py-2 ">
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
          <div className="h-[32rem]  overflow-y-auto">
            <div className="flex-1 overflow-y-auto">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`flex items-center px-3 py-3 border-b border-secondary/10 cursor-pointer hover:bg-gray-50 ${
                    activeConversation?.id === conversation.id
                      ? "bg-primary/20"
                      : ""
                  }`}
                  onClick={() => setActiveConversation(conversation)}
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden">
                    <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary text-xl font-bold">
                      {conversation.profilePictuerURL ? (
                        <Image
                          src={conversation.profilePictuerURL}
                          alt={conversation.name}
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
                      <p className="text-xs text-gray-500 truncate w-4/5 pr-2">
                        {conversation.lastMessage}
                      </p>
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        {conversation.time}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
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
                  <div className="w-10 h-10 rounded-full overflow-hidden">
                    <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary text-xl font-bold">
                      {activeConversation.profilePictuerURL ? (
                        <Image
                          src={activeConversation.profilePictuerURL}
                          alt={activeConversation.name}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        activeConversation.name.charAt(0)
                      )}
                    </div>
                  </div>
                  <div className="ml-3">
                    <h2 className="text-md font-medium text-secondary/80">
                      {activeConversation.name}
                    </h2>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-primary rounded-full mr-1"></div>
                      <span className="text-xs text-secondary/50">
                        Online • {activeConversation.time}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1 text-xs rounded text-primary">
                    View Profile
                  </button>
                  <button className="flex items-center gap-1 px-3 py-1 text-xs rounded text-secondary/70">
                    <span>0 Orders</span>
                  </button>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="h-[31rem] overflow-y-auto">
                <div className="flex-1 overflow-y-auto px-4 py-2 bg-background flex flex-col">
                  {activeConversation.messages?.map((dateGroup) => (
                    <div key={dateGroup.id}>
                      <div className="text-center my-1">
                        <span className="text-xs bg-gray-200 text-secondary/60 px-3 py-1 rounded-full">
                          {dateGroup.date}
                        </span>
                      </div>

                      {dateGroup.messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`mb-1 flex ${
                            msg.isUser ? "justify-end" : "justify-start"
                          }`}
                        >
                          {!msg.isUser && msg.product && (
                            <div className="max-w-xs">
                              <div className="mb-1 ml-5 bg-white rounded-lg p-2 shadow-sm">
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
                              <div>
                                <div className="bg-primary/40 rounded-t-2xl rounded-r-2xl p-3 text-sm text-secondary inline-block max-w-xs">
                                  {msg.text.split("\n").map((line, i) => (
                                    <p key={i}>{line}</p>
                                  ))}
                                </div>
                                <div className="text-left">
                                  <span className="text-xs ">{msg.time}</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {!msg.isUser && !msg.product && (
                            <div>
                              <div className="bg-primary/40 rounded-t-2xl rounded-r-2xl p-3 text-sm text-secondary inline-block max-w-xs">
                                {msg.text.split("\n").map((line, i) => (
                                  <p key={i}>{line}</p>
                                ))}
                              </div>
                              <div className="text-left">
                                <span className="text-xs ">{msg.time}</span>
                              </div>
                            </div>
                          )}

                          {msg.isUser && (
                            <div>
                              <div className="bg-primary/10 rounded-t-2xl rounded-l-2xl p-3 text-sm text-secondary inline-block max-w-xs">
                                {msg.text}
                              </div>
                              <div className="text-right mt-1 flex items-center justify-end">
                                <span className="text-xs text-gray-500 mr-1">
                                  {msg.time}
                                </span>
                                <Check className="h-3 w-3 text-primary" />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* Message Input */}
              <div className=" bg-transparent px-10 py-2">
                <ChatInput className="" />
              </div>
            </>
          ) : (
            // Empty state
            <div className="bg-white flex flex-col items-center justify-center h-full text-center p-4">
              <div className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <MessageCircle size={52} className=" text-primary" />
              </div>
              <h3 className="text-lg font-medium text-secondary mb-2">
                Messages
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Click on a contact to view messages.
              </p>
              <Button>New Message</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
