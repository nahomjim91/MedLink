import { gql } from '@apollo/client';

// User Approval Mutations
export const APPROVE_USER_MUTATION = gql`
  mutation ApproveUser($userId: ID!) {
    approveMSUser(userId: $userId) {
      userId
      email
      companyName
      isApproved
      approvedAt
    }
  }
`;

export const REJECT_USER_MUTATION = gql`
  mutation RejectUser($userId: ID!, $reason: String!) {
    rejectMSUser(userId: $userId, reason: $reason)
  }
`;

// Order Management Mutations
export const UPDATE_ORDER_STATUS_MUTATION = gql`
  mutation UpdateOrderStatus($orderId: ID!, $status: OrderStatus!) {
    updateOrderStatus(orderId: $orderId, status: $status) {
      orderId
      status
      updatedAt
    }
  }
`;

// Transaction Management Mutations
export const UPDATE_TRANSACTION_STATUS_MUTATION = gql`
  mutation UpdateTransactionStatus($transactionId: ID!, $status: TransactionStatus!) {
    updateTransactionStatus(transactionId: $transactionId, status: $status) {
      transactionId
      status
      updatedAt
    }
  }
`;