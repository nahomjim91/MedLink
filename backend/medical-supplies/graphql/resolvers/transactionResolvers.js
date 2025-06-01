// /graphql/transactionResolvers.js
const TransactionModel = require("../../models/transactionModel");
const OrderModel = require("../../models/orderModel");
const {
  AuthenticationError,
  ForbiddenError,
  UserInputError,
} = require("apollo-server-express");

// Helper function to check authentication
const isAuthenticated = (context) => {
  if (!context.user) {
    throw new AuthenticationError("Authentication required");
  }
  return context.user;
};

// Helper function to check admin role
const isAdmin = async (context) => {
  const user = isAuthenticated(context);
  const MSUserModel = require("../../models/msUser");

  const userDoc = await MSUserModel.getById(user.uid);
  if (!userDoc || userDoc.role !== "admin") {
    throw new ForbiddenError("Admin access required");
  }

  return user;
};

const convertTransactionStatus = (status) => {
  if (!status) return null;

  const statusMap = {
    pending: "PENDING",
    processing: "PROCESSING",
    "paid-held-by-system": "PAID_HELD_BY_SYSTEM",
    paid_held_by_system: "PAID_HELD_BY_SYSTEM", // Handle both formats
    "released-to-seller": "RELEASED_TO_SELLER",
    released_to_seller: "RELEASED_TO_SELLER", // Handle both formats
    refunded: "REFUNDED",
    failed: "FAILED",
    cancelled: "CANCELLED",
  };

  return statusMap[status.toLowerCase()] || status.toUpperCase();
};

const convertTransactionStatusToDb = (status) => {
  if (!status) return null;

  const statusMap = {
    PENDING: "pending",
    PROCESSING: "processing",
    PAID_HELD_BY_SYSTEM: "paid-held-by-system", // Use hyphens to match order payment status
    RELEASED_TO_SELLER: "released-to-seller", // Use hyphens to match order payment status
    REFUNDED: "refunded",
    FAILED: "failed",
    CANCELLED: "cancelled",
  };
console.log("Converting status:", status);
  return statusMap[status] || status.toLowerCase();
};

// Helper function to transform transaction data from database format to GraphQL format
const transformTransactionForGraphQL = (transaction) => {
  if (!transaction) return null;

  return {
    ...transaction,
    status: convertTransactionStatus(transaction.status),
    currency: transaction.currency || "ETB", // Default currency
  };
};

// Helper function to check if user has access to transaction
const checkTransactionAccess = async (transaction, user) => {
  if (!transaction) {
    throw new UserInputError("Transaction not found");
  }

  // Get the associated order to check permissions
  const order = await OrderModel.getById(transaction.orderId);
  if (!order) {
    throw new UserInputError("Associated order not found");
  }

  // Check if user is buyer or seller of the order
  if (order.buyerId !== user.uid && order.sellerId !== user.uid) {
    // Check if user is admin
    const MSUserModel = require("../../models/msUser");
    const userDoc = await MSUserModel.getById(user.uid);
    if (!userDoc || userDoc.role !== "admin") {
      throw new ForbiddenError("Access denied");
    }
  }

  return true;
};

const transactionResolvers = {
  // Type resolvers - these handle the conversion for nested queries
  Transaction: {
    status: (transaction) => {
      // If already converted, return as-is
      if (
        transaction.status &&
        transaction.status.toUpperCase() === transaction.status
      ) {
        return transaction.status;
      }
      // Otherwise convert from database format
      return convertTransactionStatus(transaction.status);
    },
    currency: (transaction) => {
      return transaction.currency || "ETB"; // Default currency
    },
  },

  TransactionSummary: {
    status: (transaction) => {
      // If already converted, return as-is
      if (
        transaction.status &&
        transaction.status.toUpperCase() === transaction.status
      ) {
        return transaction.status;
      }
      // Otherwise convert from database format
      return convertTransactionStatus(transaction.status);
    },
    currency: (transaction) => {
      return transaction.currency || "ETB"; // Default currency
    },
  },

  Query: {
    // Get single transaction
    transaction: async (_, { transactionId }, context) => {
      try {
        const user = isAuthenticated(context);
        const transaction = await TransactionModel.getById(transactionId);

        if (!transaction) {
          throw new UserInputError("Transaction not found");
        }

        // Check if user has access to this transaction
        if (!isAdmin(context)) await checkTransactionAccess(transaction, user);

        return transformTransactionForGraphQL(transaction);
      } catch (error) {
        console.error("Error in transaction resolver:", error);
        throw error;
      }
    },

    // Get transactions by order ID
    transactionsByOrder: async (_, { orderId }, context) => {
      try {
        const user = isAuthenticated(context);

        // First check if user has access to the order
        const order = await OrderModel.getById(orderId);
        if (!order) {
          throw new UserInputError("Order not found");
        }

        // Check if user has access to this order
        if (order.buyerId !== user.uid && order.sellerId !== user.uid) {
          // Check if user is admin
          const MSUserModel = require("../../models/msUser");
          const userDoc = await MSUserModel.getById(user.uid);
          if (!userDoc || userDoc.role !== "admin") {
            throw new ForbiddenError("Access denied");
          }
        }

        const transactions = await TransactionModel.getByOrderId(orderId);
        return transactions.map(transformTransactionForGraphQL);
      } catch (error) {
        console.error("Error in transactionsByOrder resolver:", error);
        throw error;
      }
    },

    // Get my transactions (user's transactions based on their orders)
    myTransactions: async (_, { status }, context) => {
      try {
        const user = isAuthenticated(context);
        let options = {};
        if (status) {
          options.status = convertTransactionStatusToDb(status);
        }

        const transactions = await TransactionModel.getByUserId(
          user.uid,
          options
        );
        return transactions.map(transformTransactionForGraphQL);
      } catch (error) {
        console.error("Error in myTransactions resolver:", error);
        throw error;
      }
    },

    // Get transaction summaries
    transactionSummaries: async (_, { filter }, context) => {
      try {
        const user = isAuthenticated(context);

        // Convert filter status if provided
        const dbFilter = { ...filter };
        if (filter?.status) {
          dbFilter.status = convertTransactionStatusToDb(filter.status);
        }

        // For non-admin users, limit to their own transactions
        const MSUserModel = require("../../models/msUser");
        const userDoc = await MSUserModel.getById(user.uid);

        if (userDoc?.role !== "admin") {
          // Add user filter - this will be handled in the model
          dbFilter.userId = user.uid;
        }

        const summaries = await TransactionModel.getTransactionSummaries(
          dbFilter
        );
        return summaries.map(transformTransactionForGraphQL);
      } catch (error) {
        console.error("Error in transactionSummaries resolver:", error);
        throw error;
      }
    },

    // Get transactions by status (admin only)
    transactionsByStatus: async (_, { status }, context) => {
      try {
        await isAdmin(context);

        const dbStatus = convertTransactionStatusToDb(status);
        const transactions = await TransactionModel.getByStatus(dbStatus, {});
        return transactions.map(transformTransactionForGraphQL);
      } catch (error) {
        console.error("Error in transactionsByStatus resolver:", error);
        throw error;
      }
    },

    // Get transaction by Chapa reference
    transactionByChapa: async (_, { chapaRef }, context) => {
      try {
        const user = isAuthenticated(context);
        const transaction = await TransactionModel.getByChapaRef(chapaRef);

        if (!transaction) {
          throw new UserInputError("Transaction not found");
        }
        // Check if user has access to this transaction
        if (!isAdmin(context)) await checkTransactionAccess(transaction, user);

        return transformTransactionForGraphQL(transaction);
      } catch (error) {
        console.error("Error in transactionByChapa resolver:", error);
        throw error;
      }
    },
  },

  Mutation: {
    // Create new transaction
    createTransaction: async (_, { input }, context) => {
      try {
        const user = isAuthenticated(context);

        // Convert status to database format
        const transactionData = {
          ...input,
          status: input.status
            ? convertTransactionStatusToDb(input.status)
            : "PAID_HELD_BY_SYSTEM",
          currency: input.currency || "ETB",
        };

        const createdTransaction = await TransactionModel.create(
          transactionData
        );
        return transformTransactionForGraphQL(createdTransaction);
      } catch (error) {
        console.error("Error in createTransaction resolver:", error);
        throw error;
      }
    },

    // Update transaction
    updateTransaction: async (_, { transactionId, input }, context) => {
      try {
        const user = isAuthenticated(context);

        // Get existing transaction and check access
        const existingTransaction = await TransactionModel.getById(
          transactionId
        );
        if (!isAdmin(context))
          await checkTransactionAccess(existingTransaction, user);

        // Convert status to database format if provided
        const updateData = { ...input };
        if (input.status) {
          updateData.status = convertTransactionStatusToDb(input.status);
        }

        const updatedTransaction = await TransactionModel.update(
          transactionId,
          updateData
        );
        return transformTransactionForGraphQL(updatedTransaction);
      } catch (error) {
        console.error("Error in updateTransaction resolver:", error);
        throw error;
      }
    },

    // Update transaction status
    updateTransactionStatus: async (
      _,
      { transactionId, status, chapaRef },
      context
    ) => {
      try {
        const user = isAuthenticated(context);

        // Get existing transaction and check access
        const existingTransaction = await TransactionModel.getById(
          transactionId
        );
        if (!isAdmin(context))
          await checkTransactionAccess(existingTransaction, user);

        const dbStatus = convertTransactionStatusToDb(status);
        const updateData = { status: dbStatus };
        if (chapaRef) {
          updateData.chapaRef = chapaRef;
        }

        const updatedTransaction = await TransactionModel.update(
          transactionId,
          updateData
        );
        return transformTransactionForGraphQL(updatedTransaction);
      } catch (error) {
        console.error("Error in updateTransactionStatus resolver:", error);
        throw error;
      }
    },
  },
};

module.exports = transactionResolvers;
