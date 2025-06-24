/**
 * Transaction model for MedLink telehealth
 */
const { db, FieldValue } = require('../config/firebase');
const { formatDoc, sanitizeInput, timestamp } = require('../../utils/helpers');

// Collection reference
const transactionsRef = db.collection('transactions');

/**
 * Transaction model
 */
const TransactionModel = {
  /**
   * Get transaction by ID
   * @param {String} transactionId - Transaction ID
   * @returns {Object} Transaction data
   */
  async getById(transactionId) {
    try {
      const doc = await transactionsRef.doc(transactionId).get();
      return formatDoc(doc);
    } catch (error) {
      console.error('Error getting transaction by ID:', error);
      throw error;
    }
  },

  /**
   * Create new transaction
   * @param {Object} data - Transaction data
   * @param {Object} transaction - Firestore transaction (optional)
   * @returns {Object} Created transaction
   */
  async create(data, transaction = null) {
    try {
      const sanitizedData = sanitizeInput(data);
      const docRef = transactionsRef.doc();
      
      const transactionData = {
        transactionId: docRef.id,
        userId: sanitizedData.userId,
        type: sanitizedData.type,
        amount: sanitizedData.amount,
        reason: sanitizedData.reason || '',
        relatedAppointmentId: sanitizedData.relatedAppointmentId || null,
        chapaRef: sanitizedData.chapaRef || null,
        status: sanitizedData.status || 'pending',
        createdAt: timestamp()
      };
      
      if (transaction) {
        transaction.set(docRef, transactionData);
      } else {
        await docRef.set(transactionData);
      }
      
      if (!transaction) {
        const doc = await docRef.get();
        return formatDoc(doc);
      }
      
      return transactionData;
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  },

  /**
   * Update transaction
   * @param {String} transactionId - Transaction ID
   * @param {Object} data - Transaction data
   * @returns {Object} Updated transaction
   */
  async update(transactionId, data) {
    try {
      const sanitizedData = sanitizeInput(data);
      const docRef = transactionsRef.doc(transactionId);
      
      // Check if transaction exists
      const docSnapshot = await docRef.get();
      if (!docSnapshot.exists) {
        throw new Error('Transaction not found');
      }
      
      // Remove fields that shouldn't be updated
      delete sanitizedData.transactionId;
      delete sanitizedData.createdAt;
      
      // Update transaction
      await docRef.update({
        ...sanitizedData
      });
      
      // Get updated transaction
      const updatedDoc = await docRef.get();
      return formatDoc(updatedDoc);
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }
  },

  /**
   * Update transaction status
   * @param {String} transactionId - Transaction ID
   * @param {String} status - New status
   * @param {Object} additionalData - Additional data (optional)
   * @returns {Object} Updated transaction
   */
  async updateStatus(transactionId, status, additionalData = {}) {
    try {
      const docRef = transactionsRef.doc(transactionId);
      
      // Check if transaction exists
      const docSnapshot = await docRef.get();
      if (!docSnapshot.exists) {
        throw new Error('Transaction not found');
      }
      
      const updateData = {
        status,
        ...additionalData
      };

      // Handle status-specific logic
      switch (status) {
        case 'SUCCESS':
          updateData.completedAt = timestamp();
          break;
        case 'FAILED':
          updateData.failedAt = timestamp();
          break;
      }

      await docRef.update(updateData);
      
      // Get updated transaction
      const updatedDoc = await docRef.get();
      return formatDoc(updatedDoc);
    } catch (error) {
      console.error('Error updating transaction status:', error);
      throw error;
    }
  },

  /**
   * Get transactions by patient ID
   * @param {String} userId - Patient ID
   * @param {Number} limit - Limit results (default: 20)
   * @param {Number} offset - Offset for pagination (default: 0)
   * @returns {Array} Array of transactions
   */
  async getByPatientId(userId, limit = 20, offset = 0) {
    try {
      let query = transactionsRef
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc');

      if (offset > 0) {
        const offsetDoc = await transactionsRef
          .where('userId', '==', userId)
          .orderBy('createdAt', 'desc')
          .limit(offset)
          .get();
        
        if (!offsetDoc.empty) {
          query = query.startAfter(offsetDoc.docs[offsetDoc.docs.length - 1]);
        }
      }

      const snapshot = await query.limit(limit).get();
      return snapshot.docs.map(doc => formatDoc(doc));
    } catch (error) {
      console.error('Error getting patient transactions:', error);
      throw error;
    }
  },

  /**
   * Get transactions by type
   * @param {String} type - Transaction type
   * @param {Number} limit - Limit results (default: 20)
   * @param {Number} offset - Offset for pagination (default: 0)
   * @returns {Array} Array of transactions
   */
  async getByType(type, limit = 20, offset = 0) {
    try {
      let query = transactionsRef
        .where('type', '==', type)
        .orderBy('createdAt', 'desc');

      if (offset > 0) {
        const offsetDoc = await transactionsRef
          .where('type', '==', type)
          .orderBy('createdAt', 'desc')
          .limit(offset)
          .get();
        
        if (!offsetDoc.empty) {
          query = query.startAfter(offsetDoc.docs[offsetDoc.docs.length - 1]);
        }
      }

      const snapshot = await query.limit(limit).get();
      return snapshot.docs.map(doc => formatDoc(doc));
    } catch (error) {
      console.error('Error getting transactions by type:', error);
      throw error;
    }
  },

  /**
   * Get transactions by status
   * @param {String} status - Transaction status
   * @param {Number} limit - Limit results (default: 20)
   * @param {Number} offset - Offset for pagination (default: 0)
   * @returns {Array} Array of transactions
   */
  async getByStatus(status, limit = 20, offset = 0) {
    try {
      status = status.toLocaleUpperCase();
      let query = transactionsRef
        .where('status', '==', status)
        .orderBy('createdAt', 'desc');

      if (offset > 0) {
        const offsetDoc = await transactionsRef
          .where('status', '==', status)
          .orderBy('createdAt', 'desc')
          .limit(offset)
          .get();
        
        if (!offsetDoc.empty) {
          query = query.startAfter(offsetDoc.docs[offsetDoc.docs.length - 1]);
        }
      }

      const snapshot = await query.limit(limit).get();
      return snapshot.docs.map(doc => formatDoc(doc));
    } catch (error) {
      console.error('Error getting transactions by status:', error);
      throw error;
    }
  },

  /**
   * Get transactions by appointment ID
   * @param {String} appointmentId - Appointment ID
   * @returns {Array} Array of transactions
   */
  async getByAppointmentId(appointmentId) {
    try {
      const snapshot = await transactionsRef
        .where('relatedAppointmentId', '==', appointmentId)
        .orderBy('createdAt', 'desc')
        .get();

      return snapshot.docs.map(doc => formatDoc(doc));
    } catch (error) {
      console.error('Error getting transactions by appointment ID:', error);
      throw error;
    }
  },

  /**
   * Search transactions with filters
   * @param {Object} filters - Search filters
   * @param {Number} limit - Limit results (default: 20)
   * @param {Number} offset - Offset for pagination (default: 0)
   * @returns {Object} Search results with pagination info
   */
  async searchTransactions(filters, limit = 20, offset = 0) {
    try {
      let query = transactionsRef;

      // Apply filters
      if (filters.userId) {
        query = query.where('userId', '==', filters.userId);
      }
      
      if (filters.type) {
        if (Array.isArray(filters.type)) {
          query = query.where('type', 'in', filters.type);
        } else {
          query = query.where('type', '==', filters.type);
        }
      }
      
      if (filters.status) {
        if (Array.isArray(filters.status)) {
          query = query.where('status', 'in', filters.status.toLocaleUpperCase());
        } else {
          query = query.where('status', '==', filters.status.toLocaleUpperCase());
        }
      }

      if (filters.relatedAppointmentId) {
        query = query.where('relatedAppointmentId', '==', filters.relatedAppointmentId);
      }

      // Date range filters
      if (filters.startDate) {
        query = query.where('createdAt', '>=', new Date(filters.startDate));
      }
      
      if (filters.endDate) {
        query = query.where('createdAt', '<=', new Date(filters.endDate));
      }

      // Apply ordering
      const orderBy = filters.orderBy || 'createdAt';
      const orderDirection = filters.orderDirection || 'desc';
      query = query.orderBy(orderBy, orderDirection);

      // Apply pagination
      if (offset > 0) {
        const offsetSnapshot = await transactionsRef
          .orderBy(orderBy, orderDirection)
          .limit(offset)
          .get();
        
        if (!offsetSnapshot.empty) {
          query = query.startAfter(offsetSnapshot.docs[offsetSnapshot.docs.length - 1]);
        }
      }

      const snapshot = await query.limit(limit).get();
      const transactions = snapshot.docs.map(doc => formatDoc(doc));

      // Get total count for pagination
      const totalSnapshot = await transactionsRef.get();
      const totalCount = totalSnapshot.size;

      return {
        transactions,
        totalCount,
        hasMore: transactions.length === limit
      };
    } catch (error) {
      console.error('Error searching transactions:', error);
      throw error;
    }
  },

  /**
   * Get transaction statistics
   * @param {String} userId - Patient ID (optional, for patient-specific stats)
   * @returns {Object} Transaction statistics
   */
  async getTransactionStats(userId = null) {
    try {
      let baseQuery = transactionsRef;
      
      if (userId) {
        baseQuery = baseQuery.where('userId', '==', userId);
      }

      const [totalSnapshot, successSnapshot, pendingSnapshot, failedSnapshot] = await Promise.all([
        baseQuery.get(),
        baseQuery.where('status', '==', 'SUCCESS').get(),
        baseQuery.where('status', '==', 'PENDING').get(),
        baseQuery.where('status', '==', 'FAILED').get()
      ]);

      // Calculate amounts
      let totalAmount = 0;
      let successAmount = 0;
      let pendingAmount = 0;

      successSnapshot.docs.forEach(doc => {
        const data = doc.data();
        successAmount += data.amount || 0;
      });

      pendingSnapshot.docs.forEach(doc => {
        const data = doc.data();
        pendingAmount += data.amount || 0;
      });

      totalAmount = successAmount + pendingAmount;

      return {
        total: totalSnapshot.size,
        success: successSnapshot.size,
        pending: pendingSnapshot.size,
        failed: failedSnapshot.size,
        totalAmount,
        successAmount,
        pendingAmount
      };
    } catch (error) {
      console.error('Error getting transaction stats:', error);
      throw error;
    }
  }
};

/**
 * Refund model for MedLink telehealth
 */
// Collection reference
const refundsRef = db.collection('refunds');

/**
 * Refund model
 */
const RefundModel = {
  /**
   * Get refund by ID
   * @param {String} refundId - Refund ID
   * @returns {Object} Refund data
   */
  async getById(refundId) {
    try {
      const doc = await refundsRef.doc(refundId).get();
      return formatDoc(doc);
    } catch (error) {
      console.error('Error getting refund by ID:', error);
      throw error;
    }
  },

  /**
   * Create new refund
   * @param {Object} data - Refund data
   * @param {Object} transaction - Firestore transaction (optional)
   * @returns {Object} Created refund
   */
  async create(data, transaction = null) {
    try {
      const sanitizedData = sanitizeInput(data);
      const docRef = refundsRef.doc();
      
      const refundData = {
        refundId: docRef.id,
        userId: sanitizedData.userId,
        originalWalletTransactionId: sanitizedData.originalWalletTransactionId,
        relatedAppointmentId: sanitizedData.relatedAppointmentId,
        amount: sanitizedData.amount,
        status: sanitizedData.status || 'requested',
        reason: sanitizedData.reason || '',
        requestedAt: timestamp(),
        processedAt: null
      };
      
      if (transaction) {
        transaction.set(docRef, refundData);
      } else {
        await docRef.set(refundData);
      }
      
      if (!transaction) {
        const doc = await docRef.get();
        return formatDoc(doc);
      }
      
      return refundData;
    } catch (error) {
      console.error('Error creating refund:', error);
      throw error;
    }
  },

  /**
   * Update refund
   * @param {String} refundId - Refund ID
   * @param {Object} data - Refund data
   * @returns {Object} Updated refund
   */
  async update(refundId, data) {
    try {
      const sanitizedData = sanitizeInput(data);
      const docRef = refundsRef.doc(refundId);
      
      // Check if refund exists
      const docSnapshot = await docRef.get();
      if (!docSnapshot.exists) {
        throw new Error('Refund not found');
      }
      
      // Remove fields that shouldn't be updated
      delete sanitizedData.refundId;
      delete sanitizedData.requestedAt;
      
      // Update refund
      await docRef.update({
        ...sanitizedData
      });
      
      // Get updated refund
      const updatedDoc = await docRef.get();
      return formatDoc(updatedDoc);
    } catch (error) {
      console.error('Error updating refund:', error);
      throw error;
    }
  },

  /**
   * Update refund status
   * @param {String} refundId - Refund ID
   * @param {String} status - New status
   * @param {Object} additionalData - Additional data (optional)
   * @returns {Object} Updated refund
   */
  async updateStatus(refundId, status, additionalData = {}) {
    try {
      const docRef = refundsRef.doc(refundId);
      
      // Check if refund exists
      const docSnapshot = await docRef.get();
      if (!docSnapshot.exists) {
        throw new Error('Refund not found');
      }
      
      const updateData = {
        status,
        ...additionalData
      };

      // Handle status-specific logic
      if (['approved', 'processed', 'rejected'].includes(status)) {
        updateData.processedAt = timestamp();
      }

      await docRef.update(updateData);
      
      // Get updated refund
      const updatedDoc = await docRef.get();
      return formatDoc(updatedDoc);
    } catch (error) {
      console.error('Error updating refund status:', error);
      throw error;
    }
  },

  /**
   * Get refunds by patient ID
   * @param {String} userId - Patient ID
   * @param {Number} limit - Limit results (default: 20)
   * @param {Number} offset - Offset for pagination (default: 0)
   * @returns {Array} Array of refunds
   */
  async getByPatientId(userId, limit = 20, offset = 0) {
    try {
      let query = refundsRef
        .where('userId', '==', userId)
        .orderBy('requestedAt', 'desc');

      if (offset > 0) {
        const offsetDoc = await refundsRef
          .where('userId', '==', userId)
          .orderBy('requestedAt', 'desc')
          .limit(offset)
          .get();
        
        if (!offsetDoc.empty) {
          query = query.startAfter(offsetDoc.docs[offsetDoc.docs.length - 1]);
        }
      }

      const snapshot = await query.limit(limit).get();
      return snapshot.docs.map(doc => formatDoc(doc));
    } catch (error) {
      console.error('Error getting patient refunds:', error);
      throw error;
    }
  },

  /**
   * Get refunds by status
   * @param {String} status - Refund status
   * @param {Number} limit - Limit results (default: 20)
   * @param {Number} offset - Offset for pagination (default: 0)
   * @returns {Array} Array of refunds
   */
  async getByStatus(status, limit = 20, offset = 0) {
    try {
      status = status.toLocaleUpperCase();

      let query = refundsRef
        .where('status', '==', status)
        .orderBy('requestedAt', 'desc');

      if (offset > 0) {
        const offsetDoc = await refundsRef
          .where('status', '==', status)
          .orderBy('requestedAt', 'desc')
          .limit(offset)
          .get();
        
        if (!offsetDoc.empty) {
          query = query.startAfter(offsetDoc.docs[offsetDoc.docs.length - 1]);
        }
      }

      const snapshot = await query.limit(limit).get();
      return snapshot.docs.map(doc => formatDoc(doc));
    } catch (error) {
      console.error('Error getting refunds by status:', error);
      throw error;
    }
  },

  /**
   * Get refunds by appointment ID
   * @param {String} appointmentId - Appointment ID
   * @returns {Array} Array of refunds
   */
  async getByAppointmentId(appointmentId) {
    try {
      const snapshot = await refundsRef
        .where('relatedAppointmentId', '==', appointmentId)
        .orderBy('requestedAt', 'desc')
        .get();

      return snapshot.docs.map(doc => formatDoc(doc));
    } catch (error) {
      console.error('Error getting refunds by appointment ID:', error);
      throw error;
    }
  },

  /**
   * Search refunds with filters
   * @param {Object} filters - Search filters
   * @param {Number} limit - Limit results (default: 20)
   * @param {Number} offset - Offset for pagination (default: 0)
   * @returns {Object} Search results with pagination info
   */
  async searchRefunds(filters, limit = 20, offset = 0) {
    try {
      let query = refundsRef;

      // Apply filters
      if (filters.userId) {
        query = query.where('userId', '==', filters.userId);
      }
      
      if (filters.status) {
        if (Array.isArray(filters.status)) {
          query = query.where('status', 'in', filters.status.toLocaleUpperCase());
        } else {
          query = query.where('status', '==', filters.status.toLocaleUpperCase());
        }
      }

      if (filters.relatedAppointmentId) {
        query = query.where('relatedAppointmentId', '==', filters.relatedAppointmentId);
      }

      // Date range filters
      if (filters.startDate) {
        query = query.where('requestedAt', '>=', new Date(filters.startDate));
      }
      
      if (filters.endDate) {
        query = query.where('requestedAt', '<=', new Date(filters.endDate));
      }

      // Apply ordering
      const orderBy = filters.orderBy || 'requestedAt';
      const orderDirection = filters.orderDirection || 'desc';
      query = query.orderBy(orderBy, orderDirection);

      // Apply pagination
      if (offset > 0) {
        const offsetSnapshot = await refundsRef
          .orderBy(orderBy, orderDirection)
          .limit(offset)
          .get();
        
        if (!offsetSnapshot.empty) {
          query = query.startAfter(offsetSnapshot.docs[offsetSnapshot.docs.length - 1]);
        }
      }

      const snapshot = await query.limit(limit).get();
      const refunds = snapshot.docs.map(doc => formatDoc(doc));

      // Get total count for pagination
      const totalSnapshot = await refundsRef.get();
      const totalCount = totalSnapshot.size;

      return {
        refunds,
        totalCount,
        hasMore: refunds.length === limit
      };
    } catch (error) {
      console.error('Error searching refunds:', error);
      throw error;
    }
  },

  /**
   * Get refund statistics
   * @param {String} userId - Patient ID (optional, for patient-specific stats)
   * @returns {Object} Refund statistics
   */
  async getRefundStats(userId = null) {
    try {
      let baseQuery = refundsRef;
      
      if (userId) {
        baseQuery = baseQuery.where('userId', '==', userId);
      }

      const [totalSnapshot, requestedSnapshot, approvedSnapshot, processedSnapshot, rejectedSnapshot] = await Promise.all([
        baseQuery.get(),
        baseQuery.where('status', '==', 'REQUESTED').get(),
        baseQuery.where('status', '==', 'APPROVED').get(),
        baseQuery.where('status', '==', 'PROCESSED').get(),
        baseQuery.where('status', '==', 'REJECTED').get()
      ]);

      // Calculate amounts
      let totalAmount = 0;
      let processedAmount = 0;

      processedSnapshot.docs.forEach(doc => {
        const data = doc.data();
        processedAmount += data.amount || 0;
      });

      totalSnapshot.docs.forEach(doc => {
        const data = doc.data();
        totalAmount += data.amount || 0;
      });

      return {
        total: totalSnapshot.size,
        requested: requestedSnapshot.size,
        approved: approvedSnapshot.size,
        processed: processedSnapshot.size,
        rejected: rejectedSnapshot.size,
        totalAmount,
        processedAmount
      };
    } catch (error) {
      console.error('Error getting refund stats:', error);
      throw error;
    }
  }
};

module.exports = { TransactionModel, RefundModel };