// /graphql/transactionResolvers.js
const {
  TransactionModel,
  RefundModel,
} = require("../../models/transactionAndRefund");
const UserModel = require("../../models/user");
const AppointmentModel = require("../../models/appointment");
const PatientProfileModel = require("../../models/patientProfile");
const {
  AuthenticationError,
  ForbiddenError,
  UserInputError,
} = require("apollo-server-express");

// Helper functions for authentication and authorization
const isAuthenticated = (context) => {
  if (!context.user) {
    throw new AuthenticationError("Authentication required");
  }
  return context.user;
};

const isPatient = async (context) => {
  const user = isAuthenticated(context);
  const userDoc = await UserModel.getById(user.uid);
  if (!userDoc || userDoc.role !== "patient") {
    throw new ForbiddenError("Patient access required");
  }
  return user;
};

const isAdmin = async (context) => {
  const user = isAuthenticated(context);
  const userDoc = await UserModel.getById(user.uid);
  if (!userDoc || userDoc.role !== "admin") {
    throw new ForbiddenError("Admin access required");
  }
  return user;
};

// Check if user can access transaction
const canAccessTransaction = async (transactionId, context) => {
  const user = isAuthenticated(context);
  const transaction = await TransactionModel.getById(transactionId);

  if (!transaction) {
    throw new UserInputError("Transaction not found");
  }

  const userDoc = await UserModel.getById(user.uid);

  // Admin can access all transactions
  if (userDoc.role === "admin") {
    return { transaction, user: userDoc };
  }

  if (transaction.userId !== user.uid) {
    throw new ForbiddenError("Access denied");
  }

  return { transaction, user: userDoc };
};

// Check if user can access refund
const canAccessRefund = async (refundId, context) => {
  const user = isAuthenticated(context);
  const refund = await RefundModel.getById(refundId);

  if (!refund) {
    throw new UserInputError("Refund not found");
  }

  const userDoc = await UserModel.getById(user.uid);

  // Admin can access all refunds
  if (userDoc.role === "admin") {
    return { refund, user: userDoc };
  }

  // Patients can only access their own refunds
  if (userDoc.role === "patient" && refund.userId !== user.uid) {
    throw new ForbiddenError("Access denied");
  }

  return { refund, user: userDoc };
};

const transactionResolvers = {
  Transaction: {
    async patient(parent) {
      return await UserModel.getById(parent.userId);
    },
    async relatedAppointment(parent) {
      if (parent.relatedAppointmentId) {
        return await AppointmentModel.getById(parent.relatedAppointmentId);
      }
      return null;
    },
  },

  Refund: {
    async patient(parent) {
      return await UserModel.getById(parent.userId);
    },
    async originalTransaction(parent) {
      return await TransactionModel.getById(parent.originalWalletTransactionId);
    },
    async relatedAppointment(parent) {
      if (parent.relatedAppointmentId) {
        return await AppointmentModel.getById(parent.relatedAppointmentId);
      }
      return null;
    },
  },

  Query: {
    // Get single transaction
    transaction: async (_, { transactionId }, context) => {
      const { transaction } = await canAccessTransaction(
        transactionId,
        context
      );
      return transaction;
    },

    // Get single refund
    refund: async (_, { refundId }, context) => {
      const { refund } = await canAccessRefund(refundId, context);
      return refund;
    },

    // Get transactions for current user
    myTransactions: async (_, { limit = 20, offset = 0 }, context) => {
      const user = await UserModel.getById(context.user.uid);
      return await TransactionModel.getByPatientId(
        context.user.uid,
        limit,
        offset
      );
    },

    // Get refunds for current user
    myRefunds: async (_, { limit = 20, offset = 0 }, context) => {
      const user = await isPatient(context);
      return await RefundModel.getByPatientId(context.user.uid, limit, offset);
    },

    // Get transactions by patient ID (admin only)
    patientTransactions: async (
      _,
      { userId, limit = 20, offset = 0 },
      context
    ) => {
      await isAdmin(context);
      return await TransactionModel.getByPatientId(userId, limit, offset);
    },

    // Get refunds by patient ID (admin only)
    patientRefunds: async (_, { userId, limit = 20, offset = 0 }, context) => {
      await isAdmin(context);
      return await RefundModel.getByPatientId(userId, limit, offset);
    },

    // Get transactions by type (admin only)
    transactionsByType: async (
      _,
      { type, limit = 20, offset = 0 },
      context
    ) => {
      await isAdmin(context);
      return await TransactionModel.getByType(
        type.toLowerCase(),
        limit,
        offset
      );
    },

    // Get transactions by status (admin only)
    transactionsByStatus: async (
      _,
      { status, limit = 20, offset = 0 },
      context
    ) => {
      await isAdmin(context);
      return await TransactionModel.getByStatus(
        status.toLowerCase(),
        limit,
        offset
      );
    },

    // Get refunds by status (admin only)
    refundsByStatus: async (_, { status, limit = 20, offset = 0 }, context) => {
      await isAdmin(context);
      return await RefundModel.getByStatus(status.toLowerCase(), limit, offset);
    },

    // Get transactions by appointment ID
    appointmentTransactions: async (_, { appointmentId }, context) => {
      const user = isAuthenticated(context);

      // Check if user can access this appointment
      const appointment = await AppointmentModel.getById(appointmentId);
      if (!appointment) {
        throw new UserInputError("Appointment not found");
      }

      const userDoc = await UserModel.getById(user.uid);
      if (
        userDoc.role !== "admin" &&
        appointment.patientId !== user.uid &&
        appointment.doctorId !== user.uid
      ) {
        throw new ForbiddenError("Access denied");
      }

      return await TransactionModel.getByAppointmentId(appointmentId);
    },

    // Get refunds by appointment ID
    appointmentRefunds: async (_, { appointmentId }, context) => {
      const user = isAuthenticated(context);

      // Check if user can access this appointment
      const appointment = await AppointmentModel.getById(appointmentId);
      if (!appointment) {
        throw new UserInputError("Appointment not found");
      }

      const userDoc = await UserModel.getById(user.uid);
      if (
        userDoc.role !== "admin" &&
        appointment.patientId !== user.uid &&
        appointment.doctorId !== user.uid
      ) {
        throw new ForbiddenError("Access denied");
      }

      return await RefundModel.getByAppointmentId(appointmentId);
    },

    // Search transactions with filters
    searchTransactions: async (
      _,
      { filter, limit = 20, offset = 0 },
      context
    ) => {
      const user = isAuthenticated(context);
      const userDoc = await UserModel.getById(user.uid);

      // Apply user-specific filters based on role
      let searchFilter = { ...filter };

      if (userDoc.role === "patient" || userDoc.role === "doctor") {
        searchFilter.userId = user.uid;
      }
      // Admin can search without restrictions

      // Convert enum values to lowercase for database
      if (searchFilter.type) {
        searchFilter.type = Array.isArray(searchFilter.type)
          ? searchFilter.type.map((t) => t.toLowerCase())
          : searchFilter.type.toLowerCase();
      }

      if (searchFilter.status) {
        searchFilter.status = Array.isArray(searchFilter.status)
          ? searchFilter.status.map((s) => s.toLowerCase())
          : searchFilter.status.toLowerCase();
      }

      return await TransactionModel.searchTransactions(
        searchFilter,
        limit,
        offset
      );
    },

    // Search refunds with filters
    searchRefunds: async (_, { filter, limit = 20, offset = 0 }, context) => {
      const user = isAuthenticated(context);
      const userDoc = await UserModel.getById(user.uid);

      // Apply user-specific filters based on role
      let searchFilter = { ...filter };

      if (userDoc.role === "patient") {
        searchFilter.userId = user.uid;
      }
      // Admin can search without restrictions

      // Convert enum values to lowercase for database
      if (searchFilter.status) {
        searchFilter.status = Array.isArray(searchFilter.status)
          ? searchFilter.status.map((s) => s.toLowerCase())
          : searchFilter.status.toLowerCase();
      }

      return await RefundModel.searchRefunds(searchFilter, limit, offset);
    },

    // Get transaction statistics for current user
    transactionStats: async (_, __, context) => {
      const user = await UserModel.getById(context.user.uid);
      return await TransactionModel.getTransactionStats(user.uid);
    },

    // Get refund statistics for current user
    refundStats: async (_, __, context) => {
      const user = await isPatient(context);
      return await RefundModel.getRefundStats(user.uid);
    },

    // Get all transaction statistics (admin only)
    allTransactionStats: async (_, { filter }, context) => {
      console.log("filter transaction", filter);
      await isAdmin(context);
      // Pass the filter to your model function
      return await TransactionModel.getTransactionStatsAdmin(filter);
    },

    // Get all refund statistics (admin only)
    allRefundStats: async (_, { filter }, context) => {
      console.log("filter refund", filter);
      await isAdmin(context);
      // Pass the filter to your model function
      return await RefundModel.getRefundStatsAdmin(filter);
    },
  },

  Mutation: {
    // Create new transaction (patient only)
    createTransaction: async (_, { input }, context) => {
      const user = await UserModel.getById(context.user.uid);
      const transactionData = {
        ...input,
        userId: context.user.uid,
        status: "PENDING",
      };

      return await TransactionModel.create(transactionData);
    },

    // Update transaction (admin only)
    updateTransaction: async (_, { input }, context) => {
      await isAdmin(context);

      const { transactionId, ...updateData } = input;
      return await TransactionModel.update(transactionId, updateData);
    },

    // Update transaction status
    updateTransactionStatus: async (
      _,
      { transactionId, status, additionalData },
      context
    ) => {
      await isAdmin(context); // Only admin can update status directly

      const parsedData = additionalData ? JSON.parse(additionalData) : {};
      return await TransactionModel.updateStatus(
        transactionId,
        status.toLowerCase(),
        parsedData
      );
    },

    // Create refund request (patient only)
    requestRefund: async (_, { input }, context) => {
      const user = await isPatient(context);

      // Verify the original transaction belongs to the patient
      const originalTransaction = await TransactionModel.getById(
        input.originalWalletTransactionId
      );
      if (!originalTransaction || originalTransaction.userId !== user.uid) {
        throw new ForbiddenError("Invalid original transaction");
      }

      // Check if original transaction is successful
      if (originalTransaction.status !== "SUCCESS") {
        throw new UserInputError("Can only refund successful transactions");
      }

      const refundData = {
        ...input,
        userId: context.user.uid,
        status: "REQUESTED",
      };

      return await RefundModel.create(refundData);
    },

    // Update refund (admin only)
    updateRefund: async (_, { input }, context) => {
      await isAdmin(context);

      const { refundId, ...updateData } = input;
      return await RefundModel.update(refundId, updateData);
    },

    // Approve refund (admin only)
    approveRefund: async (_, { refundId, reason }, context) => {
      await isAdmin(context);

      const refund = await RefundModel.getById(refundId);
      if (!refund) {
        throw new UserInputError("Refund not found");
      }

      if (refund.status !== "requested") {
        throw new UserInputError("Can only approve requested refunds");
      }

      return await RefundModel.updateStatus(refundId, "approved", { reason });
    },

    // Reject refund (admin only)
    rejectRefund: async (_, { refundId, reason }, context) => {
      await isAdmin(context);

      const refund = await RefundModel.getById(refundId);
      if (!refund) {
        throw new UserInputError("Refund not found");
      }

      if (refund.status !== "requested") {
        throw new UserInputError("Can only reject requested refunds");
      }

      return await RefundModel.updateStatus(refundId, "rejected", { reason });
    },

    // Process refund (admin only)
    processRefund: async (_, { refundId, transactionRef }, context) => {
      await isAdmin(context);

      const refund = await RefundModel.getById(refundId);
      if (!refund) {
        throw new UserInputError("Refund not found");
      }

      if (refund.status !== "approved") {
        throw new UserInputError("Can only process approved refunds");
      }

      // Update patient wallet balance
      const patientProfile = await PatientProfileModel.getById(refund.userId);
      const newBalance = patientProfile.telehealthWalletBalance + refund.amount;

      await PatientProfileModel.update(refund.userId, {
        telehealthWalletBalance: newBalance,
      });

      return await RefundModel.updateStatus(refundId, "processed", {
        transactionRef,
      });
    },

    // Process deposit (called after successful Chapa payment)
    processDeposit: async (_, { transactionId, chapaRef, amount }, context) => {
      // This would typically be called by a webhook or internal system
      const user = isAuthenticated(context);

      const transaction = await TransactionModel.getById(transactionId);
      if (!transaction) {
        throw new UserInputError("Transaction not found");
      }

      if (transaction.status !== "pending") {
        throw new UserInputError("Transaction is not in pending status");
      }

      // Update patient wallet balance
      const patientProfile = await PatientProfileModel.getById(
        transaction.userId
      );
      const newBalance = patientProfile.telehealthWalletBalance + amount;

      await PatientProfileModel.update(transaction.userId, {
        telehealthWalletBalance: newBalance,
      });

      return await TransactionModel.updateStatus(transactionId, "SUCCESS", {
        chapaRef,
        amount,
      });
    },

    // Process appointment payment (internal system call)
    processAppointmentPayment: async (
      _,
      { appointmentId, amount },
      context
    ) => {
      // This would be called internally when an appointment is confirmed
      const user = isAuthenticated(context);

      const appointment = await AppointmentModel.getById(appointmentId);
      if (!appointment) {
        throw new UserInputError("Appointment not found");
      }

      // Check patient wallet balance
      const patientProfile = await PatientProfileModel.getById(
        appointment.userId
      );
      if (patientProfile.telehealthWalletBalance < amount) {
        throw new UserInputError("Insufficient wallet balance");
      }

      // Create payment transaction
      const transactionData = {
        userId: appointment.userId,
        type: "PAYMENT",
        amount,
        reason: `Payment for appointment with Dr. ${appointment.doctorName}`,
        relatedAppointmentId: appointmentId,
        status: "SUCCESS",
      };

      const transaction = await TransactionModel.create(transactionData);

      // Deduct from patient wallet
      const newBalance = patientProfile.telehealthWalletBalance - amount;
      await PatientProfileModel.update(appointment.userId, {
        telehealthWalletBalance: newBalance,
      });

      // Update appointment payment status
      await AppointmentModel.update(appointmentId, {
        paymentStatus: "PAID",
      });

      return transaction;
    },

    // Process refund payment (internal system call after refund approval)
    processRefundPayment: async (_, { refundId, transactionRef }, context) => {
      await isAdmin(context);

      const refund = await RefundModel.getById(refundId);
      if (!refund) {
        throw new UserInputError("Refund not found");
      }

      // Create refund transaction
      const transactionData = {
        userId: refund.userId,
        type: "REFUND",
        amount: refund.amount,
        reason: `Refund for ${refund.reason}`,
        relatedAppointmentId: refund.relatedAppointmentId,
        status: "SUCCESS",
        chapaRef: transactionRef,
      };

      return await TransactionModel.create(transactionData);
    },

    // Initiate Chapa payment for deposit
    initiateDeposit: async (_, { amount }, context) => {
      const user = await isPatient(context);

      if (amount <= 0) {
        throw new UserInputError("Amount must be greater than 0");
      }

      // Create pending deposit transaction
      const transactionData = {
        userId: context.user.uid,
        type: "DEPOSIT",
        amount,
        reason: "Wallet deposit",
        status: "PENDING",
      };

      const transaction = await TransactionModel.create(transactionData);

      // In a real implementation, you would integrate with Chapa API here
      // and return the payment URL or reference

      return transaction;
    },

    // Cancel pending transaction
    cancelTransaction: async (_, { transactionId }, context) => {
      const { transaction, user } = await canAccessTransaction(
        transactionId,
        context
      );

      if (transaction.status !== "pending") {
        throw new UserInputError("Can only cancel pending transactions");
      }

      return await TransactionModel.updateStatus(transactionId, "failed", {
        reason: "Cancelled by user",
      });
    },

    // Bulk process transactions (admin only)
    bulkProcessTransactions: async (_, { transactionIds }, context) => {
      await isAdmin(context);

      const results = [];

      for (const transactionId of transactionIds) {
        try {
          const transaction = await TransactionModel.updateStatus(
            transactionId,
            "SUCCESS"
          );
          results.push(transaction);
        } catch (error) {
          console.error(
            `Error processing transaction ${transactionId}:`,
            error
          );
          // Continue with other transactions
        }
      }

      return results;
    },
  },
};

module.exports = transactionResolvers;
