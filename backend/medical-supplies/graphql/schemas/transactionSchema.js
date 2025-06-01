// /graphql/transactionSchema.js
const { gql } = require("apollo-server-express");

const transactionTypeDefs = gql`
  # Transaction Status Enum
  enum TransactionStatus {
    PENDING
    PROCESSING
    PAID_HELD_BY_SYSTEM
    RELEASED_TO_SELLER
    REFUNDED
    FAILED
    CANCELLED
  }

  # Transaction Type
  type Transaction {
    buyerId: ID
    sellerId: ID
    transactionId: ID!
    orderId: ID!
    chapaRef: String
    chapaStatus: String
    amount: Float!
    currency: String!
    status: TransactionStatus!
    createdAt: Date!
    updatedAt: Date!
  }

  # Transaction Summary Type (for lists)
  type TransactionSummary {
    buyerId: ID
    sellerId: ID
    transactionId: ID!
    orderId: ID!
    chapaRef: String
    chapaStatus: String
    amount: Float!
    currency: String!
    status: TransactionStatus!
    createdAt: Date!
  }

  # Input Types
  input CreateTransactionInput {
    buyerId: ID
    sellerId: ID
    transactionId: ID!
    orderId: ID!
    chapaRef: String
    chapaStatus: String
    amount: Float!
    currency: String = "ETB"
    status: TransactionStatus = PENDING
  }

  input UpdateTransactionInput {
    chapaRef: String
    chapaStatus: String
    amount: Float
    currency: String
    status: TransactionStatus
  }

  input TransactionFilterInput {
    buyerId: ID
    sellerId: ID
    orderId: ID
    chapaRef: String
    chapaStatus: String
    status: TransactionStatus
    dateFrom: Date
    dateTo: Date
    minAmount: Float
    maxAmount: Float
  }

  # Extend existing Query type
  extend type Query {
    # Get single transaction
    transaction(transactionId: ID!): Transaction

    # Get transactions by order ID
    transactionsByOrder(orderId: ID!): [Transaction!]!

    # Get my transactions (user's transactions based on their orders)
    myTransactions(status: TransactionStatus): [Transaction!]!

    # Get transaction summaries (lightweight for listing)
    transactionSummaries(filter: TransactionFilterInput): [TransactionSummary!]!

    # Get transactions by status (admin)
    transactionsByStatus(status: TransactionStatus!): [Transaction!]!

    # Get transactions by Chapa reference
    transactionByChapa(chapaRef: String!): Transaction
  }

  # Extend existing Mutation type
  extend type Mutation {
    # Create new transaction
    createTransaction(input: CreateTransactionInput!): Transaction!

    # Update transaction
    updateTransaction(
      transactionId: ID!
      input: UpdateTransactionInput!
    ): Transaction!

    # Update transaction status
    updateTransactionStatus(
      transactionId: ID!
      status: TransactionStatus!
      chapaRef: String
    ): Transaction!
  }
`;

module.exports = transactionTypeDefs;
