/**
 * Chat GraphQL Schema
 */
const { gql } = require("apollo-server-express");

const chatTypeDefs = gql`
  # Message Types
  type Message {
    messageId: ID!
    conversationId: ID!
    senderId: ID!
    content: String!
    type: MessageType!
    metadata: JSON
    createdAt: Date!
    updatedAt: Date!
    isEdited: Boolean!
    isDeleted: Boolean!
    editedAt: Date
    deletedAt: Date
    readBy: [ID!]!
    deliveredTo: [ID!]!
    senderDetails: UserSummary
  }

  # Conversation Types
  type Conversation {
    conversationId: ID!
    participants: [ID!]!
    type: ConversationType!
    title: String
    createdBy: ID!
    createdAt: Date!
    updatedAt: Date!
    lastMessage: String
    lastMessageAt: Date
    isActive: Boolean!
    unreadCounts: JSON!
    myUnreadCount: Int
    participantDetails: JSON!
    metadata: ConversationMetadata
    archivedBy: JSON
  }

  type ConversationMetadata {
    totalMessages: Int!
    participantDetails: JSON
  }

  type UserSummary {
    userId: ID!
    contactName: String
    companyName: String
    email: String
    profileImageUrl: String
    role: String
  }

  # Enums
  enum MessageType {
    text
    image
    file
    system
    typing
  }

  enum ConversationType {
    direct
    group
    support
  }

  # Input Types
  input SendMessageInput {
    conversationId: ID!
    content: String!
    type: MessageType = text
    metadata: JSON
  }

  input CreateConversationInput {
    participants: [ID!]!
    type: ConversationType = direct
    title: String
  }

  input EditMessageInput {
    messageId: ID!
    content: String!
  }

  # Subscription Types
  type MessageSubscription {
    type: SubscriptionEventType!
    message: Message
    conversationId: ID!
  }

  type ConversationSubscription {
    type: SubscriptionEventType!
    conversation: Conversation
    userId: ID!
  }

  enum SubscriptionEventType {
    MESSAGE_SENT
    MESSAGE_EDITED
    MESSAGE_DELETED
    MESSAGE_READ
    CONVERSATION_CREATED
    CONVERSATION_UPDATED
    USER_TYPING
    USER_ONLINE
    USER_OFFLINE
  }

  # Custom JSON scalar
  scalar JSON

  # Extend existing Query type
  extend type Query {
    # Get user's conversations
    myConversations(limit: Int, offset: Int): [Conversation!]!
    
    # Get conversation by ID
    conversation(conversationId: ID!): Conversation
    
    # Get messages for a conversation
    messages(conversationId: ID!, limit: Int, beforeMessageId: ID): [Message!]!
    
    # Find or create direct conversation with another user
    directConversation(withUserId: ID!): Conversation!
    
    # Search conversations
    searchConversations(query: String!, limit: Int): [Conversation!]!
  }

  # Extend existing Mutation type
  extend type Mutation {
    # Create a new conversation
    createConversation(input: CreateConversationInput!): Conversation!
    
    # Send a message
    sendMessage(input: SendMessageInput!): Message!
    
    # Edit a message
    editMessage(input: EditMessageInput!): Message!
    
    # Delete a message
    deleteMessage(messageId: ID!): Boolean!
    
    # Mark messages as read
    markMessagesAsRead(conversationId: ID!, lastReadMessageId: ID): Boolean!
    
    # Archive/unarchive conversation
    archiveConversation(conversationId: ID!, archive: Boolean = true): Boolean!
    
    # Add participants to group conversation
    addParticipants(conversationId: ID!, participantIds: [ID!]!): Conversation!
    
    # Remove participants from group conversation
    removeParticipants(conversationId: ID!, participantIds: [ID!]!): Conversation!
    
    # Update conversation title
    updateConversationTitle(conversationId: ID!, title: String!): Conversation!
  }

  # Subscriptions
  type Subscription {
    # Subscribe to messages in a conversation
    messageSubscription(conversationId: ID!): MessageSubscription!
    
    # Subscribe to conversation updates for a user
    conversationSubscription: ConversationSubscription!
    
    # Subscribe to typing indicators
    typingIndicator(conversationId: ID!): TypingIndicator!
    
    # Subscribe to user online status
    userOnlineStatus(userIds: [ID!]): UserOnlineStatus!
  }

  # Additional subscription types
  type TypingIndicator {
    conversationId: ID!
    userId: ID!
    isTyping: Boolean!
    userDetails: UserSummary
  }

  type UserOnlineStatus {
    userId: ID!
    isOnline: Boolean!
    lastSeen: Date
    userDetails: UserSummary
  }
`;

module.exports = chatTypeDefs;