// api/graphql/chat/chatQueries.js
import { gql } from "@apollo/client";

export const SEARCH_MS_USERS = gql`
  query SearchMSUsers($searchQuery: String!) {
    searchMSUsers(searchQuery: $searchQuery) {
      userId
      contactName
      companyName
      email
      profileImageUrl
    }
  }
`;

export const MY_CONVERSATIONS = gql`
  query MyConversations($limit: Int, $offset: Int) {
    myConversations(limit: $limit, offset: $offset) {
      conversationId
      participants
      type
      title
      lastMessage
      lastMessageAt
      myUnreadCount # Assuming this is added from backend resolver
      participantDetails # JSON object with UserSummary for each participant
      # Example of participantDetails structure based on backend model:
      # participantDetails { 
      #   userId1: { userId, contactName, companyName, profileImageUrl, role },
      #   userId2: { ... } 
      # }
      updatedAt
    }
  }
`;

export const GET_MESSAGES = gql`
  query Messages($conversationId: ID!, $limit: Int, $beforeMessageId: ID) {
    messages(conversationId: $conversationId, limit: $limit, beforeMessageId: $beforeMessageId) {
      messageId
      conversationId
      senderId
      content
      type
      createdAt
      isEdited
      senderDetails { # From backend schema
        userId
        contactName
        profileImageUrl
      }
      readBy
    }
  }
`;
