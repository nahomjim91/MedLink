// queries/transactionQueries.js
import { gql } from '@apollo/client';

// Get user's transactions with pagination
export const GET_MY_TRANSACTIONS = gql`
  query GetMyTransactions($limit: Int, $offset: Int) {
    myTransactions(limit: $limit, offset: $offset) {
      transactionId
      userId
      type
      amount
      reason
      relatedAppointmentId
      chapaRef
      status
      createdAt
      completedAt
      failedAt
      patient {
        id
        firstName
        lastName
        profileImageUrl
      }
      relatedAppointment {
        appointmentId
        doctorName
        patientName
        scheduledStartTime
      }
    }
  }
`;

// Get user's refunds with pagination
export const GET_MY_REFUNDS = gql`
  query GetMyRefunds($limit: Int, $offset: Int) {
    myRefunds(limit: $limit, offset: $offset) {
      refundId
      userId
      originalWalletTransactionId
      relatedAppointmentId
      amount
      status
      reason
      requestedAt
      processedAt
      patient {
        id
        firstName
        lastName
        profileImageUrl
      }
      originalTransaction {
        transactionId
        type
        amount
        chapaRef
      }
      relatedAppointment {
        appointmentId
        doctorName
        patientName
        scheduledStartTime
      }
    }
  }
`;

// Search transactions with filters
export const SEARCH_TRANSACTIONS = gql`
  query SearchTransactions(
    $filter: TransactionFilterInput!
    $limit: Int
    $offset: Int
  ) {
    searchTransactions(filter: $filter, limit: $limit, offset: $offset) {
      transactions {
        transactionId
        userId
        type
        amount
        reason
        relatedAppointmentId
        chapaRef
        status
        createdAt
        completedAt
        failedAt
        patient {
          id
          firstName
          lastName
          profileImageUrl
        }
        relatedAppointment {
          appointmentId
          doctorName
          patientName
          scheduledStartTime
        }
      }
      totalCount
      hasMore
    }
  }
`;

// Search refunds with filters
export const SEARCH_REFUNDS = gql`
  query SearchRefunds(
    $filter: RefundFilterInput!
    $limit: Int
    $offset: Int
  ) {
    searchRefunds(filter: $filter, limit: $limit, offset: $offset) {
      refunds {
        refundId
        userId
        originalWalletTransactionId
        relatedAppointmentId
        amount
        status
        reason
        requestedAt
        processedAt
        patient {
          id
          firstName
          lastName
          profileImageUrl
        }
        originalTransaction {
          transactionId
          type
          amount
          chapaRef
        }
        relatedAppointment {
          appointmentId
          doctorName
          patientName
          scheduledStartTime
        }
      }
      totalCount
      hasMore
    }
  }
`;

// Get transaction statistics
export const GET_TRANSACTION_STATS = gql`
  query GetTransactionStats {
    transactionStats {
      total
      success
      pending
      failed
      totalAmount
      successAmount
      pendingAmount
    }
  }
`;

// Get refund statistics
export const GET_REFUND_STATS = gql`
  query GetRefundStats {
    refundStats {
      total
      requested
      approved
      processed
      rejected
      totalAmount
      processedAmount
    }
  }
`;

// Get single transaction
export const GET_TRANSACTION = gql`
  query GetTransaction($transactionId: ID!) {
    transaction(transactionId: $transactionId) {
      transactionId
      userId
      type
      amount
      reason
      relatedAppointmentId
      chapaRef
      status
      createdAt
      completedAt
      failedAt
      patient {
        id
        firstName
        lastName
        profileImageUrl
        email
        phoneNumber
      }
      relatedAppointment {
        appointmentId
        doctorName
        patientName
        scheduledStartTime
        scheduledEndTime
        reasonNote
      }
    }
  }
`;

// Get single refund
export const GET_REFUND = gql`
  query GetRefund($refundId: ID!) {
    refund(refundId: $refundId) {
      refundId
      userId
      originalWalletTransactionId
      relatedAppointmentId
      amount
      status
      reason
      requestedAt
      processedAt
      patient {
        id
        firstName
        lastName
        profileImageUrl
        email
        phoneNumber
      }
      originalTransaction {
        transactionId
        type
        amount
        chapaRef
        createdAt
      }
      relatedAppointment {
        appointmentId
        doctorName
        patientName
        scheduledStartTime
        scheduledEndTime
        reasonNote
      }
    }
  }
`;