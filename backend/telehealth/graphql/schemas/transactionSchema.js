// /graphql/transactionSchema.js
const { gql } = require("apollo-server-express");

const transactionTypeDefs = gql`
  type Transaction {
    transactionId: ID!
    userId: String!
    type: TransactionType!
    amount: Float!
    reason: String
    relatedAppointmentId: String
    chapaRef: String
    status: TransactionStatus!
    createdAt: Date!
    completedAt: Date
    failedAt: Date
    patient: THUser
    relatedAppointment: Appointment
  }

  type Refund {
    refundId: ID!
    userId: String!
    originalWalletTransactionId: String
    relatedAppointmentId: String!
    amount: Float!
    status: RefundStatus!
    reason: String
    requestedAt: Date!
    processedAt: Date
    patient: THUser
    originalTransaction: Transaction
    relatedAppointment: Appointment
  }

  enum TransactionType {
    DEPOSIT
    PAYMENT
    REFUND
    DEBIT
    CREDIT
  }

  enum TransactionStatus {
    PENDING
    SUCCESS
    FAILED
  }

  enum RefundStatus {
    REQUESTED
    APPROVED
    PROCESSED
    REJECTED
  }

  input CreateTransactionInput {
    type: TransactionType!
    amount: Float!
    reason: String
    relatedAppointmentId: String
    chapaRef: String
  }

  input UpdateTransactionInput {
    transactionId: ID!
    status: TransactionStatus
    chapaRef: String
    reason: String
  }

  input CreateRefundInput {
    originalWalletTransactionId: String!
    relatedAppointmentId: String!
    amount: Float!
    reason: String!
  }

  input UpdateRefundInput {
    refundId: ID!
    status: RefundStatus!
    reason: String
  }

  input TransactionFilterInput {
    userId: String
    type: [TransactionType]
    status: [TransactionStatus]
    relatedAppointmentId: String
    startDate: Date
    endDate: Date
    orderBy: String # "createdAt", "amount"
    orderDirection: String # "asc", "desc"
  }

  input RefundFilterInput {
    userId: String
    status: [RefundStatus]
    relatedAppointmentId: String
    startDate: Date
    endDate: Date
    orderBy: String # "requestedAt", "processedAt", "amount"
    orderDirection: String # "asc", "desc"
  }

  type TransactionSearchResult {
    transactions: [Transaction]
    totalCount: Int
    hasMore: Boolean
  }

  type RefundSearchResult {
    refunds: [Refund]
    totalCount: Int
    hasMore: Boolean
  }

  type TransactionStats {
    total: Int!
    success: Int!
    pending: Int!
    failed: Int!
    totalAmount: Float!
    successAmount: Float!
    pendingAmount: Float!
  }

  type RefundStats {
    total: Int!
    requested: Int!
    approved: Int!
    processed: Int!
    rejected: Int!
    totalAmount: Float!
    processedAmount: Float!
  }

  extend type Query {
    # Get single transaction
    transaction(transactionId: ID!): Transaction
    
    # Get single refund
    refund(refundId: ID!): Refund
    
    # Get transactions for current user (patient)
    myTransactions(limit: Int, offset: Int): [Transaction]
    
    # Get refunds for current user (patient)
    myRefunds(limit: Int, offset: Int): [Refund]
    
    # Get transactions by patient ID (admin only)
    patientTransactions(userId: String!, limit: Int, offset: Int): [Transaction]
    
    # Get refunds by patient ID (admin only)
    patientRefunds(userId: String!, limit: Int, offset: Int): [Refund]
    
    # Get transactions by type (admin only)
    transactionsByType(type: TransactionType!, limit: Int, offset: Int): [Transaction]
    
    # Get transactions by status (admin only)
    transactionsByStatus(status: TransactionStatus!, limit: Int, offset: Int): [Transaction]
    
    # Get refunds by status (admin only)
    refundsByStatus(status: RefundStatus!, limit: Int, offset: Int): [Refund]
    
    # Get transactions by appointment ID
    appointmentTransactions(appointmentId: String!): [Transaction]
    
    # Get refunds by appointment ID
    appointmentRefunds(appointmentId: String!): [Refund]
    
    # Search transactions with filters
    searchTransactions(
      filter: TransactionFilterInput
      limit: Int
      offset: Int
    ): TransactionSearchResult
    
    # Search refunds with filters
    searchRefunds(
      filter: RefundFilterInput
      limit: Int
      offset: Int
    ): RefundSearchResult
    
    # Get transaction statistics for current user
    transactionStats: TransactionStats
    
    # Get refund statistics for current user
    refundStats: RefundStats
    
    # Get all transaction statistics (admin only)
    allTransactionStats(filter: TransactionFilterInput): TransactionStats
    
    # Get all refund statistics (admin only)
    allRefundStats(filter: RefundFilterInput): RefundStats
  }

  extend type Mutation {
    # Create new transaction (patient only)
    createTransaction(input: CreateTransactionInput!): Transaction
    
    # Update transaction (admin only, or system updates)
    updateTransaction(input: UpdateTransactionInput!): Transaction
    
    # Update transaction status (admin only, or system updates)
    updateTransactionStatus(
      transactionId: ID!
      status: TransactionStatus!
      additionalData: String
    ): Transaction
    
    # Create refund request (patient only)
    requestRefund(input: CreateRefundInput!): Refund
    
    # Update refund (admin only)
    updateRefund(input: UpdateRefundInput!): Refund
    
    # Admin refund actions
    approveRefund(refundId: ID!, reason: String): Refund
    rejectRefund(refundId: ID!, reason: String!): Refund
    processRefund(refundId: ID!, transactionRef: String): Refund
    
    # Process deposit (called after successful Chapa payment)
    processDeposit(
      transactionId: ID!
      chapaRef: String!
      amount: Float!
    ): Transaction
    
    # Process payment for appointment (internal system call)
    processAppointmentPayment(
      appointmentId: String!
      amount: Float!
    ): Transaction
    
    # Process refund payment (internal system call after refund approval)
    processRefundPayment(
      refundId: ID!
      transactionRef: String!
    ): Transaction
    
    # Initiate Chapa payment for deposit
    initiateDeposit(amount: Float!): Transaction
    
    # Cancel pending transaction
    cancelTransaction(transactionId: ID!): Transaction
    
    # Bulk process transactions (admin only)
    bulkProcessTransactions(transactionIds: [ID!]!): [Transaction]
  }
`;

module.exports = transactionTypeDefs;

