import { gql } from "@apollo/client";

// Get single transaction by ID
export const GET_TRANSACTION = gql`
  query GetTransaction($transactionId: ID!) {
    transaction(transactionId: $transactionId) {
      buyerId
      sellerId
      transactionId
      orderId
      chapaRef
      chapaStatus
      amount
      currency
      status
      createdAt
      updatedAt
    }
  }
`;

// Get transactions by order ID
export const GET_TRANSACTIONS_BY_ORDER = gql`
  query GetTransactionsByOrder($orderId: ID!) {
    transactionsByOrder(orderId: $orderId) {
      buyerId
      sellerId
      transactionId
      orderId
      chapaRef
      chapaStatus
      amount
      currency
      status
      createdAt
      updatedAt
    }
  }
`;

// Get my transactions (user's transactions)
export const GET_MY_TRANSACTIONS = gql`
  query GetMyTransactions($status: TransactionStatus) {
    myTransactions(status: $status) {
      buyerId
      sellerId
      transactionId
      orderId
      chapaRef
      chapaStatus
      amount
      currency
      status
      createdAt
      updatedAt
    }
  }
`;

// Get transaction summaries with filters
export const GET_TRANSACTION_SUMMARIES = gql`
  query GetTransactionSummaries($filter: TransactionFilterInput) {
    transactionSummaries(filter: $filter) {
      buyerId
      sellerId
      transactionId
      orderId
      chapaRef
      chapaStatus
      amount
      currency
      status
      createdAt
    }
  }
`;

// Get transactions by status (for admin)
export const GET_TRANSACTIONS_BY_STATUS = gql`
  query GetTransactionsByStatus($status: TransactionStatus!) {
    transactionsByStatus(status: $status) {
      buyerId
      sellerId
      transactionId
      orderId
      chapaRef
      chapaStatus
      amount
      currency
      status
      createdAt
      updatedAt
    }
  }
`;

// Get transaction by Chapa reference
export const GET_TRANSACTION_BY_CHAPA = gql`
  query GetTransactionByChapa($chapaRef: String!) {
    transactionByChapa(chapaRef: $chapaRef) {
      buyerId
      sellerId
      transactionId
      orderId
      chapaRef
      chapaStatus
      amount
      currency
      status
      createdAt
      updatedAt
    }
  }
`;

// Enhanced query with pagination and filtering (you might need to add this to your schema)
export const GET_MY_TRANSACTIONS_PAGINATED = gql`
  query GetMyTransactionsPaginated(
    $status: TransactionStatus
    $limit: Int
    $offset: Int
    $dateFrom: Date
    $dateTo: Date
  ) {
    myTransactions(status: $status) {
      buyerId
      sellerId
      transactionId
      orderId
      chapaRef
      chapaStatus
      amount
      currency
      status
      createdAt
      updatedAt
    }
  }
`;

// Transaction statistics query (you might need to add this to your schema)
export const GET_TRANSACTION_STATS = gql`
  query GetTransactionStats {
    transactionStats {
      totalTransactions
      totalAmount
      pendingCount
      completedCount
      failedCount
      thisWeekCount
      thisWeekAmount
      thisMonthCount
      thisMonthAmount
    }
  }
`;