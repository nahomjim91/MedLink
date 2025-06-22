/**
 * Appointment model for MedLink telehealth
 */
const { db, FieldValue } = require('../config/firebase');
const { formatDoc, sanitizeInput, timestamp } = require('../../utils/helpers');

// Collection reference
const appointmentsRef = db.collection('appointments');

/**
 * Appointment model
 */
const AppointmentModel = {
  /**
   * Get appointment by ID
   * @param {String} appointmentId - Appointment ID
   * @returns {Object} Appointment data
   */
  async getById(appointmentId) {
    try {
      const doc = await appointmentsRef.doc(appointmentId).get();
      return formatDoc(doc);
    } catch (error) {
      console.error('Error getting appointment by ID:', error);
      throw error;
    }
  },

  /**
   * Create new appointment
   * @param {Object} data - Appointment data
   * @param {Object} transaction - Firestore transaction (optional)
   * @returns {Object} Created appointment
   */
  async create(data, transaction = null) {
    try {
      const sanitizedData = sanitizeInput(data);
      const docRef = appointmentsRef.doc();
      
      const appointmentData = {
        appointmentId: docRef.id,
        patientId: sanitizedData.patientId,
        patientName: sanitizedData.patientName,
        doctorId: sanitizedData.doctorId,
        doctorName: sanitizedData.doctorName,
        status: 'requested',
        reasonNote: sanitizedData.reasonNote || '',
        scheduledStartTime: sanitizedData.scheduledStartTime,
        scheduledEndTime: sanitizedData.scheduledEndTime,
        actualStartTime: null,
        actualEndTime: null,
        price: sanitizedData.price,
        associatedSlotId: sanitizedData.associatedSlotId,
        paymentStatus: sanitizedData.paymentStatus || 'pending',
        createdAt: timestamp(),
        updatedAt: timestamp()
      };
      
      if (transaction) {
        transaction.set(docRef, appointmentData);
      } else {
        await docRef.set(appointmentData);
      }
      
      if (!transaction) {
        const doc = await docRef.get();
        return formatDoc(doc);
      }
      
      return appointmentData;
    } catch (error) {
      console.error('Error creating appointment:', error);
      throw error;
    }
  },

  /**
   * Update appointment
   * @param {String} appointmentId - Appointment ID
   * @param {Object} data - Appointment data
   * @returns {Object} Updated appointment
   */
  async update(appointmentId, data) {
    try {
      const sanitizedData = sanitizeInput(data);
      const docRef = appointmentsRef.doc(appointmentId);
      
      // Check if appointment exists
      const docSnapshot = await docRef.get();
      if (!docSnapshot.exists) {
        throw new Error('Appointment not found');
      }
      
      // Remove fields that shouldn't be updated
      delete sanitizedData.appointmentId;
      delete sanitizedData.createdAt;
      
      // Update appointment
      await docRef.update({
        ...sanitizedData,
        updatedAt: timestamp()
      });
      
      // Get updated appointment
      const updatedDoc = await docRef.get();
      return formatDoc(updatedDoc);
    } catch (error) {
      console.error('Error updating appointment:', error);
      throw error;
    }
  },

  /**
   * Update appointment status
   * @param {String} appointmentId - Appointment ID
   * @param {String} status - New status
   * @param {String} updatedBy - Who updated (patient/doctor)
   * @param {Object} additionalData - Additional data (optional)
   * @returns {Object} Updated appointment
   */
  async updateStatus(appointmentId, status, updatedBy, additionalData = {}) {
    try {
      const docRef = appointmentsRef.doc(appointmentId);
      
      // Check if appointment exists
      const docSnapshot = await docRef.get();
      if (!docSnapshot.exists) {
        throw new Error('Appointment not found');
      }
      
      const updateData = {
        status,
        updatedAt: timestamp(),
        [`${updatedBy}UpdatedAt`]: timestamp(),
        ...additionalData
      };

      // Handle status-specific logic
      switch (status) {
        case 'confirmed':
          updateData.status = 'upcoming';
          break;
        case 'in_progress':
          updateData.actualStartTime = timestamp();
          break;
        case 'completed':
          updateData.actualEndTime = timestamp();
          break;
        case 'cancelled_patient':
        case 'cancelled_doctor':
          updateData.cancelledAt = timestamp();
          break;
      }

      await docRef.update(updateData);
      
      // Get updated appointment
      const updatedDoc = await docRef.get();
      return formatDoc(updatedDoc);
    } catch (error) {
      console.error('Error updating appointment status:', error);
      throw error;
    }
  },

  /**
   * Update payment status
   * @param {String} appointmentId - Appointment ID
   * @param {String} paymentStatus - New payment status
   * @param {Object} paymentData - Additional payment data (optional)
   * @returns {Object} Updated appointment
   */
  async updatePaymentStatus(appointmentId, paymentStatus, paymentData = {}) {
    try {
      const docRef = appointmentsRef.doc(appointmentId);
      
      // Check if appointment exists
      const docSnapshot = await docRef.get();
      if (!docSnapshot.exists) {
        throw new Error('Appointment not found');
      }
      
      await docRef.update({
        paymentStatus,
        updatedAt: timestamp(),
        ...paymentData
      });
      
      // Get updated appointment
      const updatedDoc = await docRef.get();
      return formatDoc(updatedDoc);
    } catch (error) {
      console.error('Error updating payment status:', error);
      throw error;
    }
  },

  /**
   * Delete appointment (soft delete)
   * @param {String} appointmentId - Appointment ID
   * @param {String} deletedBy - Who deleted (patient/doctor)
   * @param {Object} transaction - Firestore transaction (optional)
   * @returns {Boolean} Success status
   */
  async delete(appointmentId, deletedBy, transaction = null) {
    try {
      const docRef = appointmentsRef.doc(appointmentId);
      
      const deleteData = {
        status: `cancelled_${deletedBy}`,
        deletedAt: timestamp(),
        updatedAt: timestamp()
      };

      if (transaction) {
        transaction.update(docRef, deleteData);
      } else {
        await docRef.update(deleteData);
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting appointment:', error);
      throw error;
    }
  },

  /**
   * Get appointments by patient ID
   * @param {String} patientId - Patient ID
   * @param {Number} limit - Limit results (default: 20)
   * @param {Number} offset - Offset for pagination (default: 0)
   * @returns {Array} Array of appointments
   */
  async getByPatientId(patientId, limit = 20, offset = 0) {
    try {
      let query = appointmentsRef
        .where('patientId', '==', patientId)
        .orderBy('createdAt', 'desc');

      if (offset > 0) {
        const offsetDoc = await appointmentsRef
          .where('patientId', '==', patientId)
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
      console.error('Error getting patient appointments:', error);
      throw error;
    }
  },

  /**
   * Get appointments by doctor ID
   * @param {String} doctorId - Doctor ID
   * @param {Number} limit - Limit results (default: 20)
   * @param {Number} offset - Offset for pagination (default: 0)
   * @returns {Array} Array of appointments
   */
  async getByDoctorId(doctorId, limit = 20, offset = 0) {
    try {
      let query = appointmentsRef
        .where('doctorId', '==', doctorId)
        .orderBy('createdAt', 'desc');

      if (offset > 0) {
        const offsetDoc = await appointmentsRef
          .where('doctorId', '==', doctorId)
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
      console.error('Error getting doctor appointments:', error);
      throw error;
    }
  },

  /**
   * Get appointments by status
   * @param {String} status - Appointment status
   * @param {Number} limit - Limit results (default: 20)
   * @param {Number} offset - Offset for pagination (default: 0)
   * @returns {Array} Array of appointments
   */
  async getByStatus(status, limit = 20, offset = 0) {
    try {
      let query = appointmentsRef
        .where('status', '==', status)
        .orderBy('scheduledStartTime', 'asc');

      if (offset > 0) {
        const offsetDoc = await appointmentsRef
          .where('status', '==', status)
          .orderBy('scheduledStartTime', 'asc')
          .limit(offset)
          .get();
        
        if (!offsetDoc.empty) {
          query = query.startAfter(offsetDoc.docs[offsetDoc.docs.length - 1]);
        }
      }

      const snapshot = await query.limit(limit).get();
      return snapshot.docs.map(doc => formatDoc(doc));
    } catch (error) {
      console.error('Error getting appointments by status:', error);
      throw error;
    }
  },

  /**
   * Get upcoming appointments
   * @param {String} userId - User ID (patient or doctor)
   * @param {String} userType - User type (patient/doctor)
   * @param {Number} limit - Limit results (default: 10)
   * @returns {Array} Array of upcoming appointments
   */
  async getUpcoming(userId, userType, limit = 10) {
    try {
      const field = userType === 'doctor' ? 'doctorId' : 'patientId';
      const snapshot = await appointmentsRef
        .where(field, '==', userId)
        .where('status', 'in', ['upcoming', 'confirmed'])
        .orderBy('scheduledStartTime', 'asc')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => formatDoc(doc));
    } catch (error) {
      console.error('Error getting upcoming appointments:', error);
      throw error;
    }
  },

  /**
   * Search appointments with filters
   * @param {Object} filters - Search filters
   * @param {Number} limit - Limit results (default: 20)
   * @param {Number} offset - Offset for pagination (default: 0)
   * @returns {Object} Search results with pagination info
   */
  async searchAppointments(filters, limit = 20, offset = 0) {
    try {
      let query = appointmentsRef;

      // Apply filters
      if (filters.patientId) {
        query = query.where('patientId', '==', filters.patientId);
      }
      
      if (filters.doctorId) {
        query = query.where('doctorId', '==', filters.doctorId);
      }
      
      if (filters.status) {
        if (Array.isArray(filters.status)) {
          query = query.where('status', 'in', filters.status);
        } else {
          query = query.where('status', '==', filters.status);
        }
      }
      
      if (filters.paymentStatus) {
        query = query.where('paymentStatus', '==', filters.paymentStatus);
      }

      // Date range filters
      if (filters.startDate) {
        query = query.where('scheduledStartTime', '>=', new Date(filters.startDate));
      }
      
      if (filters.endDate) {
        query = query.where('scheduledStartTime', '<=', new Date(filters.endDate));
      }

      // Apply ordering
      const orderBy = filters.orderBy || 'scheduledStartTime';
      const orderDirection = filters.orderDirection || 'desc';
      query = query.orderBy(orderBy, orderDirection);

      // Apply pagination
      if (offset > 0) {
        const offsetSnapshot = await appointmentsRef
          .orderBy(orderBy, orderDirection)
          .limit(offset)
          .get();
        
        if (!offsetSnapshot.empty) {
          query = query.startAfter(offsetSnapshot.docs[offsetSnapshot.docs.length - 1]);
        }
      }

      const snapshot = await query.limit(limit).get();
      const appointments = snapshot.docs.map(doc => formatDoc(doc));

      // Get total count for pagination
      const totalSnapshot = await appointmentsRef.get();
      const totalCount = totalSnapshot.size;

      return {
        appointments,
        totalCount,
        hasMore: appointments.length === limit
      };
    } catch (error) {
      console.error('Error searching appointments:', error);
      throw error;
    }
  },

  /**
   * Get appointment statistics
   * @param {String} userId - User ID (patient or doctor)
   * @param {String} userType - User type (patient/doctor)
   * @returns {Object} Appointment statistics
   */
  async getAppointmentStats(userId, userType) {
    try {
      const field = userType === 'doctor' ? 'doctorId' : 'patientId';
      
      const [totalSnapshot, completedSnapshot, upcomingSnapshot, cancelledSnapshot] = await Promise.all([
        appointmentsRef.where(field, '==', userId).get(),
        appointmentsRef.where(field, '==', userId).where('status', '==', 'completed').get(),
        appointmentsRef.where(field, '==', userId).where('status', 'in', ['upcoming', 'confirmed']).get(),
        appointmentsRef.where(field, '==', userId).where('status', 'in', ['cancelled_patient', 'cancelled_doctor']).get()
      ]);

      return {
        total: totalSnapshot.size,
        completed: completedSnapshot.size,
        upcoming: upcomingSnapshot.size,
        cancelled: cancelledSnapshot.size
      };
    } catch (error) {
      console.error('Error getting appointment stats:', error);
      throw error;
    }
  }
};

module.exports = AppointmentModel;