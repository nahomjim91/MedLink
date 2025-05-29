import { gql } from "@apollo/client";

// api/graphql/chat/chatMutations.js
export const CREATE_CONVERSATION = gql`
  mutation CreateConversation($input: CreateConversationInput!) {
    createConversation(input: $input) {
      conversationId
      participants
      type
      title
      participantDetails
      # ... other fields you need after creation
    }
  }
`;

export const SEND_MESSAGE = gql`
  mutation SendMessage($input: SendMessageInput!) {
    sendMessage(input: $input) {
      messageId
      conversationId
      senderId
      content
      type
      createdAt
      senderDetails {
        userId
        contactName
        profileImageUrl
      }
      # ... other fields
    }
  }
`;

export const MARK_MESSAGES_AS_READ = gql`
  mutation MarkMessagesAsRead($conversationId: ID!, $lastReadMessageId: ID) {
    markMessagesAsRead(conversationId: $conversationId, lastReadMessageId: $lastReadMessageId)
  }
`;