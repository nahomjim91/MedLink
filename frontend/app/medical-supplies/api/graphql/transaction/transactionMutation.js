// /transaction/transactionMutation.js
import { gql } from "@apollo/client";
// Mutation to create a new transaction
export const CREATE_TRANSACTION = gql`
  mutation CreateTransaction($input: CreateTransactionInput!) {
    createTransaction(input: $input) {
      transactionId
      orderId
      chapaRef
      amount
      currency
      status
      createdAt
      updatedAt
    }
  }
`;

// Mutation to update a transaction
export const UPDATE_TRANSACTION = gql`
  mutation UpdateTransaction($transactionId: ID!, $input: UpdateTransactionInput!) {
    updateTransaction(transactionId: $transactionId, input: $input) {
      transactionId
      orderId
      chapaRef
      amount
      currency
      status
      createdAt
      updatedAt
    }
  }
`;

// Mutation to update transaction status
export const UPDATE_TRANSACTION_STATUS = gql`
  mutation UpdateTransactionStatus(
    $transactionId: ID!
    $status: TransactionStatus!
    $chapaRef: String
  ) {
    updateTransactionStatus(
      transactionId: $transactionId
      status: $status
      chapaRef: $chapaRef
    ) {
      transactionId
      orderId
      chapaRef
      amount
      currency
      status
      createdAt
      updatedAt
    }
  }
`;