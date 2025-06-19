// models/transactionModel.js
const { db, admin } = require("../config/firebase");
const {
  formatDoc,
  formatDocs,
  sanitizeInput,
  timestamp,
  paginationParams,
} = require("../../utils/helpers");
const { createNotificationService } = require("../service/notificationService");

const transactionsRef = db.collection("transactions");
const ordersRef = db.collection("orders");
const usersRef = db.collection("msUsers");

const TransactionModel = {
  notificationService: null,

  setNotificationService(io) {
    this.notificationService = createNotificationService(io);
  },

  /**
   * Get transaction by ID
   * @param {string} transactionId - Transaction ID
   * @returns {Object|null} Transaction data or null
   */
  async getById(transactionId) {
    try {
      const doc = await transactionsRef.doc(transactionId).get();
      const transaction = formatDoc(doc);

      if (transaction) {
        // Optionally enrich with order details if needed
        const orderDoc = await ordersRef.doc(transaction.orderId).get();
        if (orderDoc.exists) {
          transaction.order = orderDoc.data();
        }
      }

      return transaction;
    } catch (error) {
      console.error("Error getting transaction by ID:", error);
      throw error;
    }
  },

  /**
   * Get transactions by order ID
   * @param {string} orderId - Order ID
   * @param {Object} options - Query options
   * @returns {Array} Array of transactions
   */
  async getByOrderId(
    orderId,
    { limit, offset, sortBy = "createdAt", sortOrder = "desc" } = {}
  ) {
    try {
      if (!orderId) {
        console.warn("getByOrderId called with invalid orderId");
        return [];
      }

      const { limit: limitVal, offset: offsetVal } = paginationParams(
        limit,
        offset
      );

      let query = transactionsRef
        .where("orderId", "==", orderId)
        .orderBy(sortBy, sortOrder);

      if (offsetVal > 0) {
        const offsetSnapshot = await query.limit(offsetVal).get();
        if (!offsetSnapshot.empty) {
          const lastVisible =
            offsetSnapshot.docs[offsetSnapshot.docs.length - 1];
          query = query.startAfter(lastVisible);
        }
      }

      const snapshot = await query.limit(limitVal).get();
      return snapshot.empty ? [] : formatDocs(snapshot.docs);
    } catch (error) {
      console.error("Error getting transactions by order ID:", error);
      return [];
    }
  },

  /**
   * Get transactions by user ID (based on orders they're involved in)
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Array} Array of transactions
   */
  async getByUserId(
    userId,
    { limit, offset, status, sortBy = "createdAt", sortOrder = "desc" } = {}
  ) {
    try {
      if (!userId) {
        console.warn("getByUserId called with invalid userId");
        return [];
      }

      // First get all orders where user is buyer or seller
      const [buyerOrdersSnapshot, sellerOrdersSnapshot] = await Promise.all([
        ordersRef.where("buyerId", "==", userId).get(),
        ordersRef.where("sellerId", "==", userId).get(),
      ]);

      const orderIds = new Set();

      // Collect order IDs from both queries
      buyerOrdersSnapshot.docs.forEach((doc) => orderIds.add(doc.id));
      sellerOrdersSnapshot.docs.forEach((doc) => orderIds.add(doc.id));

      if (orderIds.size === 0) {
        return [];
      }

      const { limit: limitVal, offset: offsetVal } = paginationParams(
        limit,
        offset
      );

      // Firestore 'in' query limit is 10, so we need to batch if more order IDs
      const orderIdArray = Array.from(orderIds);
      const batchSize = 10;
      const allTransactions = [];

      for (let i = 0; i < orderIdArray.length; i += batchSize) {
        const batch = orderIdArray.slice(i, i + batchSize);

        let query = transactionsRef
          .where("orderId", "in", batch)
          .orderBy(sortBy, sortOrder);

        if (status) {
          query = query.where("status", "==", status);
        }

        const snapshot = await query.get();
        if (!snapshot.empty) {
          allTransactions.push(...formatDocs(snapshot.docs));
        }
      }

      // Sort all transactions
      allTransactions.sort((a, b) => {
        const aVal = a[sortBy];
        const bVal = b[sortBy];

        if (sortOrder === "desc") {
          return bVal > aVal ? 1 : -1;
        }
        return aVal > bVal ? 1 : -1;
      });

      // Apply pagination
      const startIndex = offsetVal;
      const endIndex = startIndex + limitVal;

      return allTransactions.slice(startIndex, endIndex);
    } catch (error) {
      console.error("Error getting transactions by user ID:", error);
      return [];
    }
  },

  /**
   * Get transactions by status
   * @param {string} status - Transaction status
   * @param {Object} options - Query options
   * @returns {Array} Array of transactions
   */
  async getByStatus(
    status,
    { limit, offset, sortBy = "createdAt", sortOrder = "desc" } = {}
  ) {
    try {
      const { limit: limitVal, offset: offsetVal } = paginationParams(
        limit,
        offset
      );

      let query = transactionsRef
        .where("status", "==", status)
        .orderBy(sortBy, sortOrder);

      if (offsetVal > 0) {
        const offsetSnapshot = await query.limit(offsetVal).get();
        if (!offsetSnapshot.empty) {
          const lastVisible =
            offsetSnapshot.docs[offsetSnapshot.docs.length - 1];
          query = query.startAfter(lastVisible);
        }
      }

      const snapshot = await query.limit(limitVal).get();
      return snapshot.empty ? [] : formatDocs(snapshot.docs);
    } catch (error) {
      console.error("Error getting transactions by status:", error);
      return [];
    }
  },

  /**
   * Get transaction by Chapa reference
   * @param {string} chapaRef - Chapa reference
   * @returns {Object|null} Transaction data or null
   */
  async getByChapaRef(chapaRef) {
    try {
      const snapshot = await transactionsRef
        .where("chapaRef", "==", chapaRef)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      return formatDoc(snapshot.docs[0]);
    } catch (error) {
      console.error("Error getting transaction by Chapa reference:", error);
      throw error;
    }
  },

  /**
   * Get transaction summaries with filtering
   * @param {Object} filter - Filter options
   * @returns {Array} Array of transaction summaries
   */
  async getTransactionSummaries(filter = {}) {
    try {
      let query = transactionsRef;

      // Apply filters
      if (filter.orderId) {
        query = query.where("orderId", "==", filter.orderId);
      }

      if (filter.chapaRef) {
        query = query.where("chapaRef", "==", filter.chapaRef);
      }

      if (filter.status) {
        query = query.where("status", "==", filter.status);
      }

      if (filter.dateFrom) {
        const fromDate = admin.firestore.Timestamp.fromDate(
          new Date(filter.dateFrom)
        );
        query = query.where("createdAt", ">=", fromDate);
      }

      if (filter.dateTo) {
        const toDate = admin.firestore.Timestamp.fromDate(
          new Date(filter.dateTo)
        );
        query = query.where("createdAt", "<=", toDate);
      }

      // Order by creation date
      query = query.orderBy("createdAt", "desc");

      const snapshot = await query.get();
      let transactions = snapshot.empty ? [] : formatDocs(snapshot.docs);

      // Apply amount filters (Firestore doesn't support range queries with other where clauses)
      if (filter.minAmount !== undefined) {
        transactions = transactions.filter((t) => t.amount >= filter.minAmount);
      }

      if (filter.maxAmount !== undefined) {
        transactions = transactions.filter((t) => t.amount <= filter.maxAmount);
      }

      // Filter by user if specified (for non-admin users)
      if (filter.userId) {
        // Get user's orders first
        const [buyerOrdersSnapshot, sellerOrdersSnapshot] = await Promise.all([
          ordersRef.where("buyerId", "==", filter.userId).get(),
          ordersRef.where("sellerId", "==", filter.userId).get(),
        ]);

        const userOrderIds = new Set();
        buyerOrdersSnapshot.docs.forEach((doc) => userOrderIds.add(doc.id));
        sellerOrdersSnapshot.docs.forEach((doc) => userOrderIds.add(doc.id));

        transactions = transactions.filter((t) => userOrderIds.has(t.orderId));
      }

      // Return only summary fields
      return transactions.map((transaction) => ({
        transactionId: transaction.transactionId,
        orderId: transaction.orderId,
        chapaRef: transaction.chapaRef,
        amount: transaction.amount,
        currency: transaction.currency,
        status: transaction.status,
        createdAt: transaction.createdAt,
      }));
    } catch (error) {
      console.error("Error getting transaction summaries:", error);
      return [];
    }
  },

  /**
   * Create a new transaction
   * @param {Object} transactionData - Transaction data
   * @returns {Object} Created transaction
   */
  async create(transactionData) {
    try {
      const sanitizedData = sanitizeInput(transactionData);
      const now = timestamp();

      // Use the provided transactionId instead of auto-generated
      const transactionId = sanitizedData.transactionId;
      if (!transactionId) {
        throw new Error("transactionId is required.");
      }
      console.log("Creating transaction with ID:", transactionData);

      const newTransactionRef = transactionsRef.doc(transactionId);
      const newTransaction = {
        transactionId,
        buyerId: sanitizedData.buyerId,
        sellerId: sanitizedData.sellerId,
        orderId: sanitizedData.orderId,
        chapaRef: sanitizedData.chapaRef || null,
        chapaStatus: sanitizedData.chapaStatus || "success",
        amount: parseFloat(sanitizedData.amount),
        currency: sanitizedData.currency || "ETB",
        status: sanitizedData.status || "PAID_HELD_BY_SYSTEM",
        createdAt: now,
        updatedAt: now,
        webhookData: sanitizedData.webhookData || null,
      };

      await newTransactionRef.set(newTransaction);
      const doc = await newTransactionRef.get();
      const formattedDoc = formatDoc(doc);

      if (formattedDoc) {
        // Send notifications
        await this.notifyTransactionCreated(formattedDoc);
      }

      return formattedDoc;
    } catch (error) {
      console.error("Error creating transaction:", error);
      throw error;
    }
  },

  /**
   * Update transaction status (add this to TransactionModel)
   * @param {string} transactionId - Transaction ID
   * @param {string} status - New status
   * @param {string} chapaRef - Chapa reference (optional)
   * @returns {Object} Updated transaction
   */
  async updateStatus(transactionId, status, chapaRef = null) {
    try {
      const updateData = {
        status,
        updatedAt: timestamp(),
      };

      if (chapaRef) {
        updateData.chapaRef = chapaRef;
      }

      // Add status-specific fields
      if (status === "PAID_HELD_BY_SYSTEM") {
        updateData.paidAt = timestamp();
      } else if (status === "RELEASED_TO_SELLER") {
        updateData.releasedAt = timestamp();
      } else if (status === "REFUNDED") {
        updateData.refundedAt = timestamp();
      }

      const result = await this.update(transactionId, updateData);
      console.log(`Transaction ${transactionId} status updated to ${status}`);

      return result;
    } catch (error) {
      console.error("Error updating transaction status:", error);
      throw error;
    }
  },

  /**
   * Update transaction data
   * @param {string} transactionId - Transaction ID
   * @param {Object} data - Data to update
   * @returns {Object} Updated transaction
   */
  async update(transactionId, data) {
    try {
      const transactionRef = transactionsRef.doc(transactionId);
      await transactionRef.update(data);
      const doc = await transactionRef.get();
      return formatDoc(doc);
    } catch (error) {
      console.error("Error updating transaction:", error);
      throw error;
    }
  },

  // Notification methods
  async notifyTransactionCreated(transactionData) {
    if (!this.notificationService) return;

    try {
      const message = `New transaction created for order #${transactionData.orderId}`;
      const metadata = {
        transactionId: transactionData.transactionId,
        chapaRef: transactionData.chapaRef,
        chapaStatus: transactionData.chapaStatus || "success",
        orderId: transactionData.orderId,
        amount: transactionData.amount,
        currency: transactionData.currency,
        systemStatus: transactionData.status,
        actionUrl: `/orders/${transactionData.orderId}/transactions`,
      };

      // Notify both buyer and seller
      const notifications = [
        this.notificationService.createNotification(
          transactionData.buyerId,
          "transaction_created",
          message,
          { ...metadata, sellerId: transactionData.sellerId },
          "normal"
        ),
        this.notificationService.createNotification(
          transactionData.sellerId,
          "transaction_created",
          message,
          { ...metadata, buyerId: transactionData.buyerId },
          "normal"
        ),
      ];

      await Promise.allSettled(notifications);
    } catch (error) {
      console.error("Error sending transaction created notification:", error);
    }
  },
  /**
   * Get transaction statistics for a user
   * @param {string} userId - User ID
   * @returns {Object} Transaction statistics
   */
  async getTransactionStats(userId) {
    try {
      const transactions = await this.getByUserId(userId, { limit: 1000 }); // Get all user transactions

      const stats = {
        total: transactions.length,
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        cancelled: 0,
        refunded: 0,
        totalAmount: 0,
        completedAmount: 0,
      };

      transactions.forEach((transaction) => {
        stats[transaction.status] = (stats[transaction.status] || 0) + 1;
        stats.totalAmount += transaction.amount;

        if (transaction.status === "completed") {
          stats.completedAmount += transaction.amount;
        }
      });

      return stats;
    } catch (error) {
      console.error("Error getting transaction stats:", error);
      return null;
    }
  },
};

module.exports = TransactionModel;

