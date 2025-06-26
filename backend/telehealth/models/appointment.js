/**
 * Appointment model for MedLink telehealth
 */
const { db, FieldValue } = require("../config/firebase");
const { formatDoc, sanitizeInput, timestamp } = require("../../utils/helpers");
const { TransactionModel, RefundModel } = require("./transactionAndRefund");
const Patient = require("./patientProfile"); // Assuming you have a Patient model
const Doctor = require("./doctorProfile"); // Assuming you have a Doctor model

// Collection reference
const appointmentsRef = db.collection("appointments");

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
      console.error("Error getting appointment by ID:", error);
      throw error;
    }
  },

  /**
   * Get appointments by user ID
   * @param {String} patientId - Patient ID
   * @returns {Array} Array of appointments
   */
  async getByUserId(userId) {
    try {
      const [asPatientSnapshot, asDoctorSnapshot] = await Promise.all([
        appointmentsRef.where("patientId", "==", userId).get(),
        appointmentsRef.where("doctorId", "==", userId).get(),
      ]);

      const allDocs = [...asPatientSnapshot.docs, ...asDoctorSnapshot.docs];

      // Optional: deduplicate if any appointment is both (shouldn’t happen normally)
      const uniqueMap = new Map();
      allDocs.forEach((doc) => uniqueMap.set(doc.id, formatDoc(doc)));

      return Array.from(uniqueMap.values());
    } catch (error) {
      console.error("Error getting appointments by user ID:", error);
      throw error;
    }
  },
  /**
   * Create new appointment with wallet deduction and transaction
   * @param {Object} data - Appointment data
   * @param {Object} transaction - Firestore transaction (optional)
   * @returns {Object} Created appointment
   */
  async create(data, transaction = null) {
    try {
      const sanitizedData = sanitizeInput(data);
      const docRef = appointmentsRef.doc();

      // Get patient details
      const patient = await Patient.getById(sanitizedData.patientId);
      if (!patient) {
        throw new Error("Patient not found");
      }

      // Check if patient has sufficient balance
      const appointmentCost = sanitizedData.price;
      if (patient.telehealthWalletBalance < appointmentCost) {
        throw new Error("Insufficient wallet balance");
      }

      const appointmentData = {
        appointmentId: docRef.id,
        patientId: sanitizedData.patientId,
        patientName: sanitizedData.patientName,
        doctorId: sanitizedData.doctorId,
        doctorName: sanitizedData.doctorName,
        status: "REQUESTED",
        reasonNote: sanitizedData.reasonNote || "",
        scheduledStartTime: sanitizedData.scheduledStartTime,
        scheduledEndTime: sanitizedData.scheduledEndTime,
        actualStartTime: null,
        actualEndTime: null,
        price: appointmentCost,
        associatedSlotId: sanitizedData.associatedSlotId,
        paymentStatus: "PAID", // Set to paid since we're deducting from wallet
        createdAt: timestamp(),
        updatedAt: timestamp(),
      };

      if (transaction) {
        // Use Firestore transaction for atomic operations
        transaction.set(docRef, appointmentData);

        // Deduct amount from patient wallet
        const patientRef = db
          .collection("patientProfiles")
          .doc(sanitizedData.patientId);
        transaction.update(patientRef, {
          telehealthWalletBalance: FieldValue.increment(-appointmentCost),
          updatedAt: timestamp(),
        });

        // Create transaction record
        const transactionRef = db.collection("transactions").doc();
        const transactionData = {
          transactionId: transactionRef.id,
          userId: sanitizedData.patientId,
          type: "DEBIT",
          amount: appointmentCost,
          reason: `Payment for appointment with Dr. ${sanitizedData.doctorName}`,
          relatedAppointmentId: docRef.id,
          status: "SUCCESS",
          createdAt: timestamp(),
        };
        transaction.set(transactionRef, transactionData);
      } else {
        // Use Firestore batch for atomic operations when no transaction provided
        const batch = db.batch();

        // Create appointment
        batch.set(docRef, appointmentData);

        // Deduct amount from patient wallet
        const patientRef = db
          .collection("patientProfiles")
          .doc(sanitizedData.patientId);
        batch.update(patientRef, {
          telehealthWalletBalance: FieldValue.increment(-appointmentCost),
          updatedAt: timestamp(),
        });

        // Create transaction record
        const transactionRef = db.collection("transactions").doc();
        const transactionData = {
          transactionId: transactionRef.id,
          userId: sanitizedData.patientId,
          type: "DEBIT",
          amount: appointmentCost,
          reason: `Payment for appointment with Dr. ${sanitizedData.doctorName}`,
          relatedAppointmentId: docRef.id,
          status: "SUCCESS",
          createdAt: timestamp(),
        };
        batch.set(transactionRef, transactionData);

        // Commit batch
        await batch.commit();
      }

      if (!transaction) {
        const doc = await docRef.get();
        return formatDoc(doc);
      }

      return appointmentData;
    } catch (error) {
      console.error("Error creating appointment:", error);
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
        throw new Error("Appointment not found");
      }

      // Remove fields that shouldn't be updated
      delete sanitizedData.appointmentId;
      delete sanitizedData.createdAt;

      // Update appointment
      await docRef.update({
        ...sanitizedData,
        updatedAt: timestamp(),
      });

      // Get updated appointment
      const updatedDoc = await docRef.get();
      return formatDoc(updatedDoc);
    } catch (error) {
      console.error("Error updating appointment:", error);
      throw error;
    }
  },

  /**
   * Update appointment status with transaction logic
   * @param {String} appointmentId - Appointment ID
   * @param {String} status - New status
   * @param {String} updatedBy - Who updated (patient/doctor)
   * @param {Object} additionalData - Additional data (optional)
   * @returns {Object} Updated appointment
   */
  async updateStatus(appointmentId, status, updatedBy, additionalData = {}) {
    try {
      status = status.toUpperCase();
      const docRef = appointmentsRef.doc(appointmentId);

      // Check if appointment exists
      const docSnapshot = await docRef.get();
      if (!docSnapshot.exists) {
        throw new Error("Appointment not found");
      }

      const appointmentData = docSnapshot.data();

      const updateData = {
        status,
        updatedAt: timestamp(),
        [`${updatedBy}UpdatedAt`]: timestamp(),
        ...additionalData,
      };

      // Handle status-specific logic
      switch (status) {
        case "CONFIRMED":
          updateData.status = "UPCOMING";
          break;

        case "IN_PROGRESS":
          // updateData.actualStartTime = timestamp();
          break;

        case "COMPLETED":
          updateData.actualEndTime = timestamp();
          // Pay the doctor when appointment is completed
          await this.processCompletionPayment(appointmentData);
          break;

        case "CANCELLED_PATIENT":
        case "CANCELLED_DOCTOR":
        case "CANCELLED_ADMIN":
          updateData.cancelledAt = timestamp();
          // Process refund when appointment is cancelled
          await this.processRefund(appointmentData, status);
          break;
      }

      await docRef.update(updateData);

      // Get updated appointment
      const updatedDoc = await docRef.get();
      return formatDoc(updatedDoc);
    } catch (error) {
      console.error("Error updating appointment status:", error);
      throw error;
    }
  },

async autoUpdateStatuses() {
  const now = new Date();

  try {
    // 1. CONFIRMED / UPCOMING → IN_PROGRESS
    const confirmedSnap = await appointmentsRef
      .where("status", "in", ["CONFIRMED", "UPCOMING"])
      .get();

    for (const doc of confirmedSnap.docs) {
      const data = doc.data();
      const { scheduledStartTime, scheduledEndTime, actualStartTime } = data;

      const start = new Date(
        scheduledStartTime.toDate ? scheduledStartTime.toDate() : scheduledStartTime
      );
      const end = new Date(
        scheduledEndTime.toDate ? scheduledEndTime.toDate() : scheduledEndTime
      );

      if (
        now >= new Date(start.getTime() - 5 * 60000) &&
        now <= end
      ) {
        await doc.ref.update({
          status: "IN_PROGRESS",
          updatedAt: timestamp(),
        });
        console.log(`🔄 Updated to IN_PROGRESS: ${doc.id}`);
      }

      if (now > end && !actualStartTime) {
        await doc.ref.update({
          status: "NO_SHOW",
          updatedAt: timestamp(),
        });
        console.log(`🚫 Marked CONFIRMED/UPCOMING as NO_SHOW: ${doc.id}`);
      }
    }

    // 2. REQUESTED → CANCELLED_ADMIN if not approved before end
    const requestedSnap = await appointmentsRef
      .where("status", "==", "REQUESTED")
      .get();

    for (const doc of requestedSnap.docs) {
      const data = doc.data();
      const { scheduledEndTime } = data;

      const end = new Date(
        scheduledEndTime.toDate ? scheduledEndTime.toDate() : scheduledEndTime
      );

      if (now > end) {
        const status = "CANCELLED_ADMIN";

        await doc.ref.update({
          status,
          cancelledAt: timestamp(),
          updatedAt: timestamp(),
        });

        console.log(`❌ Auto-cancelled REQUESTED: ${doc.id}`);
        await this.processRefund(data, status);
      }
    }

    // 3. IN_PROGRESS → NO_SHOW if ended with no actualStartTime
    const inProgressSnap = await appointmentsRef
      .where("status", "==", "IN_PROGRESS")
      .get();

    for (const doc of inProgressSnap.docs) {
      const data = doc.data();
      const { scheduledEndTime, actualStartTime } = data;

      const end = new Date(
        scheduledEndTime.toDate ? scheduledEndTime.toDate() : scheduledEndTime
      );

      if (now > end && !actualStartTime) {
        await doc.ref.update({
          status: "NO_SHOW",
          updatedAt: timestamp(),
        });
        console.log(`🚫 Marked IN_PROGRESS as NO_SHOW: ${doc.id}`);
      }
    }

  } catch (error) {
    console.error("❌ Error in autoUpdateStatuses:", error);
  }
}
,
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
        throw new Error("Appointment not found");
      }

      await docRef.update({
        paymentStatus,
        updatedAt: timestamp(),
        ...paymentData,
      });

      // Get updated appointment
      const updatedDoc = await docRef.get();
      return formatDoc(updatedDoc);
    } catch (error) {
      console.error("Error updating payment status:", error);
      throw error;
    }
  },

  /**
   * Process payment to doctor when appointment is completed
   * @param {Object} appointmentData - Appointment data
   */
  async processCompletionPayment(appointmentData) {
    try {
      const batch = db.batch();

      // Add amount to doctor's wallet
      const doctorRef = db
        .collection("doctorProfiles")
        .doc(appointmentData.doctorId);
      batch.update(doctorRef, {
        telehealthWalletBalance: FieldValue.increment(appointmentData.price),
        updatedAt: timestamp(),
      });

      // Create transaction record for doctor
      const transactionRef = db.collection("transactions").doc();
      const transactionData = {
        transactionId: transactionRef.id,
        userId: appointmentData.doctorId,
        type: "CREDIT",
        amount: appointmentData.price,
        reason: `Payment for completed appointment with ${appointmentData.patientName}`,
        relatedAppointmentId: appointmentData.appointmentId,
        status: "SUCCESS",
        createdAt: timestamp(),
      };
      batch.set(transactionRef, transactionData);

      await batch.commit();
      console.log(
        `Payment processed for doctor ${appointmentData.doctorId}: ${appointmentData.price}`
      );
    } catch (error) {
      console.error("Error processing completion payment:", error);
      throw error;
    }
  },
  /**
   * Process refund when appointment is cancelled
   * @param {Object} appointmentData - Appointment data
   * @param {String} cancellationType - Type of cancellation
   */
  async processRefund(appointmentData, cancellationType) {
    try {
      // Only process refund if payment was made
      if (appointmentData.paymentStatus !== "PAID") {
        return;
      }

      // Find the original payment transaction
      const originalTransactionQuery = await db
        .collection("transactions")
        .where("relatedAppointmentId", "==", appointmentData.appointmentId)
        .where("type", "==", "DEBIT") // Assuming payment transactions are DEBIT
        .where("status", "==", "SUCCESS")
        .limit(1)
        .get();

      if (originalTransactionQuery.empty) {
        throw new Error(
          `Original payment transaction not found for appointment ${appointmentData.appointmentId}`
        );
      }

      const originalTransaction = originalTransactionQuery.docs[0];
      const originalTransactionId = originalTransaction.id;

      const batch = db.batch();

      // Refund amount to patient's wallet
      const patientRef = db
        .collection("patientProfiles")
        .doc(appointmentData.patientId);
      batch.update(patientRef, {
        telehealthWalletBalance: FieldValue.increment(appointmentData.price),
        updatedAt: timestamp(),
      });

      // Create refund transaction record (YES, you should create this)
      const transactionRef = db.collection("transactions").doc();
      const transactionData = {
        transactionId: transactionRef.id,
        userId: appointmentData.patientId,
        type: "CREDIT",
        amount: appointmentData.price,
        reason: `Refund for cancelled appointment with Dr. ${appointmentData.doctorName}`,
        relatedAppointmentId: appointmentData.appointmentId,
        status: "SUCCESS",
        createdAt: timestamp(),
      };
      batch.set(transactionRef, transactionData);

      // Create refund record with originalWalletTransactionId
      const refundRef = db.collection("refunds").doc();
      const refundData = {
        refundId: refundRef.id,
        userId: appointmentData.patientId,
        originalWalletTransactionId: originalTransactionId, // Now properly set
        relatedAppointmentId: appointmentData.appointmentId,
        amount: appointmentData.price,
        status: "PROCESSED",
        reason: `Appointment cancellation - ${cancellationType}`,
        requestedAt: timestamp(),
        processedAt: timestamp(),
      };
      batch.set(refundRef, refundData);

      await batch.commit();
      console.log(
        `Refund processed for patient ${appointmentData.patientId}: ${appointmentData.price}`
      );
    } catch (error) {
      console.error("Error processing refund:", error);
      throw error;
    }
  },

  /**
   * Cancel appointment with automatic refund
   * @param {String} appointmentId - Appointment ID
   * @param {String} cancelledBy - Who cancelled (patient/doctor)
   * @param {String} reason - Cancellation reason
   * @returns {Object} Updated appointment
   */
  async cancelAppointment(appointmentId, cancelledBy, reason = "") {
    try {
      const status = `CANCELLED_${cancelledBy.toUpperCase()}`;
      return await this.updateStatus(appointmentId, status, cancelledBy, {
        cancellationReason: reason,
      });
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      throw error;
    }
  },

  /**
   * Complete appointment with automatic doctor payment
   * @param {String} appointmentId - Appointment ID
   * @param {String} notes - Completion notes
   * @returns {Object} Updated appointment
   */
  async completeAppointment(appointmentId, notes = "") {
    try {
      return await this.updateStatus(appointmentId, "COMPLETED", "doctor", {
        completionNotes: notes,
      });
    } catch (error) {
      console.error("Error completing appointment:", error);
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
        status: `CANCELLED_${deletedBy}`,
        deletedAt: timestamp(),
        updatedAt: timestamp(),
      };

      if (transaction) {
        transaction.update(docRef, deleteData);
      } else {
        await docRef.update(deleteData);
      }

      return true;
    } catch (error) {
      console.error("Error deleting appointment:", error);
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
        .where("patientId", "==", patientId)
        .orderBy("createdAt", "desc");

      if (offset > 0) {
        const offsetDoc = await appointmentsRef
          .where("patientId", "==", patientId)
          .orderBy("createdAt", "desc")
          .limit(offset)
          .get();

        if (!offsetDoc.empty) {
          query = query.startAfter(offsetDoc.docs[offsetDoc.docs.length - 1]);
        }
      }

      const snapshot = await query.limit(limit).get();
      // console.log("Fetched appointments:", snapshot.docs.length);
      return snapshot.docs.map((doc) => formatDoc(doc));
    } catch (error) {
      console.error("Error getting patient appointments:", error);
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
        .where("doctorId", "==", doctorId)
        .orderBy("createdAt", "desc");

      if (offset > 0) {
        const offsetDoc = await appointmentsRef
          .where("doctorId", "==", doctorId)
          .orderBy("createdAt", "desc")
          .limit(offset)
          .get();

        if (!offsetDoc.empty) {
          query = query.startAfter(offsetDoc.docs[offsetDoc.docs.length - 1]);
        }
      }

      const snapshot = await query.limit(limit).get();
      return snapshot.docs.map((doc) => formatDoc(doc));
    } catch (error) {
      console.error("Error getting doctor appointments:", error);
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
        .where("status", "==", status)
        .orderBy("scheduledStartTime", "asc");

      if (offset > 0) {
        const offsetDoc = await appointmentsRef
          .where("status", "==", status)
          .orderBy("scheduledStartTime", "asc")
          .limit(offset)
          .get();

        if (!offsetDoc.empty) {
          query = query.startAfter(offsetDoc.docs[offsetDoc.docs.length - 1]);
        }
      }

      const snapshot = await query.limit(limit).get();
      return snapshot.docs.map((doc) => formatDoc(doc));
    } catch (error) {
      console.error("Error getting appointments by status:", error);
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
      const field = userType === "doctor" ? "doctorId" : "patientId";
      const snapshot = await appointmentsRef
        .where(field, "==", userId)
        .where("status", "in", ["upcoming", "confirmed"])
        .orderBy("scheduledStartTime", "asc")
        .limit(limit)
        .get();

      return snapshot.docs.map((doc) => formatDoc(doc));
    } catch (error) {
      console.error("Error getting upcoming appointments:", error);
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
        query = query.where("patientId", "==", filters.patientId);
      }

      if (filters.doctorId) {
        query = query.where("doctorId", "==", filters.doctorId);
      }

      if (filters.status) {
        if (Array.isArray(filters.status)) {
          query = query.where("status", "in", filters.status);
        } else {
          query = query.where("status", "==", filters.status);
        }
      }

      if (filters.paymentStatus) {
        query = query.where("paymentStatus", "==", filters.paymentStatus);
      }

      // Date range filters
      if (filters.startDate) {
        query = query.where(
          "scheduledStartTime",
          ">=",
          new Date(filters.startDate)
        );
      }

      if (filters.endDate) {
        query = query.where(
          "scheduledStartTime",
          "<=",
          new Date(filters.endDate)
        );
      }

      // Apply ordering
      const orderBy = filters.orderBy || "scheduledStartTime";
      const orderDirection = filters.orderDirection || "desc";
      query = query.orderBy(orderBy, orderDirection);

      // Apply pagination
      if (offset > 0) {
        const offsetSnapshot = await appointmentsRef
          .orderBy(orderBy, orderDirection)
          .limit(offset)
          .get();

        if (!offsetSnapshot.empty) {
          query = query.startAfter(
            offsetSnapshot.docs[offsetSnapshot.docs.length - 1]
          );
        }
      }

      const snapshot = await query.limit(limit).get();
      const appointments = snapshot.docs.map((doc) => formatDoc(doc));

      // Get total count for pagination
      const totalSnapshot = await appointmentsRef.get();
      const totalCount = totalSnapshot.size;

      return {
        appointments,
        totalCount,
        hasMore: appointments.length === limit,
      };
    } catch (error) {
      console.error("Error searching appointments:", error);
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
      const field = userType === "doctor" ? "doctorId" : "patientId";

      const [
        totalSnapshot,
        completedSnapshot,
        upcomingSnapshot,
        cancelledSnapshot,
      ] = await Promise.all([
        appointmentsRef.where(field, "==", userId).get(),
        appointmentsRef
          .where(field, "==", userId)
          .where("status", "==", "completed")
          .get(),
        appointmentsRef
          .where(field, "==", userId)
          .where("status", "in", ["upcoming", "confirmed"])
          .get(),
        appointmentsRef
          .where(field, "==", userId)
          .where("status", "in", ["cancelled_patient", "cancelled_doctor"])
          .get(),
      ]);

      return {
        total: totalSnapshot.size,
        completed: completedSnapshot.size,
        upcoming: upcomingSnapshot.size,
        cancelled: cancelledSnapshot.size,
      };
    } catch (error) {
      console.error("Error getting appointment stats:", error);
      throw error;
    }
  },

  /**
   * Get appointment financial summary
   * @param {String} appointmentId - Appointment ID
   * @returns {Object} Financial summary
   */
  async getFinancialSummary(appointmentId) {
    try {
      // Get appointment details
      const appointment = await this.getById(appointmentId);
      if (!appointment) {
        throw new Error("Appointment not found");
      }

      // Get related transactions
      const transactions = await TransactionModel.getByAppointmentId(
        appointmentId
      );

      // Get related refunds
      const refunds = await RefundModel.getByAppointmentId(appointmentId);

      return {
        appointment,
        transactions,
        refunds,
        totalPaid: transactions
          .filter((t) => t.type === "DEBIT" && t.status === "SUCCESS")
          .reduce((sum, t) => sum + t.amount, 0),
        totalRefunded: refunds
          .filter((r) => r.status === "PROCESSED")
          .reduce((sum, r) => sum + r.amount, 0),
        doctorEarnings: transactions
          .filter(
            (t) =>
              t.type === "CREDIT" &&
              t.userId === appointment.doctorId &&
              t.status === "SUCCESS"
          )
          .reduce((sum, t) => sum + t.amount, 0),
      };
    } catch (error) {
      console.error("Error getting financial summary:", error);
      throw error;
    }
  },
};

module.exports = AppointmentModel;
