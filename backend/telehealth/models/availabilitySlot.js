const { db } = require("../config/firebase");
const {
  formatDoc,
  formatDocs,
  sanitizeInput,
  timestamp,
} = require("../../utils/helpers");

// Collection reference
const slotsRef = db.collection("doctorAvailabilitySlots");


const DoctorAvailabilitySlotModel = {
  /**
   * Create availability slots (automatically splits into 30-min slots)
   * @param {String} doctorId - Doctor ID
   * @param {Date} startTime - Start time
   * @param {Date} endTime - End time
   * @returns {Array} Created slots
   */
  async createSlots(doctorId, startTime, endTime) {
    try {
      const start = new Date(startTime);
      const end = new Date(endTime);

      // Validate time range
      if (start >= end) {
        throw new Error("Start time must be before end time");
      }

      // Check for overlapping slots
      await this.validateNoOverlap(doctorId, start, end);

      // Generate 30-minute slots
      const slots = [];
      const slotDuration = 30 * 60 * 1000; // 30 minutes in milliseconds

      let currentStart = new Date(start);

      while (currentStart < end) {
        const currentEnd = new Date(currentStart.getTime() + slotDuration);

        // Don't create slot if it would exceed the end time
        if (currentEnd > end) break;

        const slotData = {
          doctorId,
          startTime: currentStart,
          endTime: currentEnd,
          isBooked: false,
          appointmentId: null,
          patientId: null,
          createdAt: timestamp(),
        };

        // Create slot document
        const docRef = slotsRef.doc();
        await docRef.set({
          slotId: docRef.id,
          ...slotData,
        });

        slots.push({
          slotId: docRef.id,
          ...slotData,
        });

        currentStart = new Date(currentEnd);
      }

      return slots;
    } catch (error) {
      console.error("Error creating availability slots:", error);
      throw error;
    }
  },

  /**
   * Get doctor's availability slots
   * @param {String} doctorId - Doctor ID
   * @param {String} date - Date in YYYY-MM-DD format (optional)
   * @returns {Array} Availability slots
   */
  async getDoctorSlots(doctorId, date = null) {
    try {
      let query = slotsRef.where("doctorId", "==", doctorId);

      if (date) {
        const startOfDay = new Date(date + "T00:00:00.000Z");
        const endOfDay = new Date(date + "T23:59:59.999Z");

        query = query
          .where("startTime", ">=", startOfDay)
          .where("startTime", "<=", endOfDay);
      }

      const snapshot = await query.orderBy("startTime", "asc").get();
      return formatDocs(snapshot.docs);
    } catch (error) {
      console.error("Error getting doctor slots:", error);
      throw error;
    }
  },
  /**
   * Get slot by ID
   * @param {String} slotId - Slot ID
   * @returns {Object|null} Slot data or null if not found
   */
  async getById(slotId) {
    try {
      const docRef = slotsRef.doc(slotId);
      const docSnapshot = await docRef.get();

      if (!docSnapshot.exists) {
        return null;
      }

      return formatDoc(docSnapshot);
    } catch (error) {
      console.error("Error getting slot by ID:", error);
      throw error;
    }
  },

  /**
   * Get available slots for a doctor (not booked)
   * @param {String} doctorId - Doctor ID
   * @param {String} date - Date in YYYY-MM-DD format (optional)
   * @returns {Array} Available slots
   */
  async getAvailableSlots(doctorId, date = null) {
    try {
      let query = slotsRef
        .where("doctorId", "==", doctorId)
        .where("isBooked", "==", false);

      if (date) {
        const startOfDay = new Date(date + "T00:00:00.000Z");
        const endOfDay = new Date(date + "T23:59:59.999Z");

        query = query
          .where("startTime", ">=", startOfDay)
          .where("startTime", "<=", endOfDay);
      }

      // Only show future slots
      const now = new Date();
      query = query.where("startTime", ">", now);

      const snapshot = await query.orderBy("startTime", "asc").get();
      return formatDocs(snapshot.docs);
    } catch (error) {
      console.error("Error getting available slots:", error);
      throw error;
    }
  },

  /**
   * Update availability slot
   * @param {String} slotId - Slot ID
   * @param {Object} data - Update data
   * @returns {Object} Updated slot
   */
  async updateSlot(slotId, data, currentUserId) {
    try {
      const docRef = slotsRef.doc(slotId);
      const docSnapshot = await docRef.get();

      if (!docSnapshot.exists) {
        throw new Error("Availability slot not found");
      }

      const currentSlot = docSnapshot.data();
      console.log(currentUserId);
      const isDoctor = currentUserId === currentSlot.doctorId;
      const isPatient = currentUserId === currentSlot.patientId;
      // Don't allow updating booked slots
      if (!(isDoctor || isPatient)) {
        if (currentSlot.isBooked) {
          throw new Error("Cannot update booked slot");
        }
      }

      // If updating time, validate no overlap
      if (data.startTime || data.endTime) {
        const newStart = data.startTime
          ? new Date(data.startTime)
          : currentSlot.startTime;
        const newEnd = data.endTime
          ? new Date(data.endTime)
          : currentSlot.endTime;

        if (newStart >= newEnd) {
          throw new Error("Start time must be before end time");
        }

        // Check for overlaps (excluding current slot)
        await this.validateNoOverlap(
          currentSlot.doctorId,
          newStart,
          newEnd,
          slotId
        );
      }

      const sanitizedData = sanitizeInput(data);
      await docRef.update(sanitizedData);

      const updatedDoc = await docRef.get();
      return formatDoc(updatedDoc);
    } catch (error) {
      console.error("Error updating availability slot:", error);
      throw error;
    }
  },

  /**
   * Delete availability slot
   * @param {String} slotId - Slot ID
   * @returns {Boolean} Success status
   */
  async deleteSlot(slotId) {
    try {
      const docRef = slotsRef.doc(slotId);
      const docSnapshot = await docRef.get();

      if (!docSnapshot.exists) {
        throw new Error("Availability slot not found");
      }

      const slotData = docSnapshot.data();

      // Don't allow deleting booked slots
      if (slotData.isBooked) {
        throw new Error("Cannot delete booked slot");
      }

      await docRef.delete();
      return true;
    } catch (error) {
      console.error("Error deleting availability slot:", error);
      throw error;
    }
  },

  /**
   * Delete multiple slots
   * @param {Array} slotIds - Array of slot IDs
   * @returns {Boolean} Success status
   */
  async deleteMultipleSlots(slotIds) {
    try {
      const batch = db.batch();

      for (const slotId of slotIds) {
        const docRef = slotsRef.doc(slotId);
        const docSnapshot = await docRef.get();

        if (docSnapshot.exists) {
          const slotData = docSnapshot.data();
          if (!slotData.isBooked) {
            batch.delete(docRef);
          }
        }
      }

      await batch.commit();
      return true;
    } catch (error) {
      console.error("Error deleting multiple slots:", error);
      throw error;
    }
  },

  /**
   * Book a slot (called when appointment is created)
   * @param {String} slotId - Slot ID
   * @param {String} appointmentId - Appointment ID
   * @param {String} patientId - Patient ID
   * @returns {Object} Updated slot
   */
  async bookSlot(slotId, appointmentId, patientId) {
    try {
      const docRef = slotsRef.doc(slotId);
      const docSnapshot = await docRef.get();

      if (!docSnapshot.exists) {
        throw new Error("Availability slot not found");
      }

      const slotData = docSnapshot.data();

      if (slotData.isBooked) {
        throw new Error("Slot is already booked");
      }

      await docRef.update({
        isBooked: true,
        appointmentId,
        patientId,
      });

      const updatedDoc = await docRef.get();
      return formatDoc(updatedDoc);
    } catch (error) {
      console.error("Error booking slot:", error);
      throw error;
    }
  },

  /**
   * Unbook a slot (called when appointment is cancelled)
   * @param {String} slotId - Slot ID
   * @returns {Object} Updated slot
   */
  async unbookSlot(slotId) {
    try {
      const docRef = slotsRef.doc(slotId);

      await docRef.update({
        isBooked: false,
        appointmentId: null,
        patientId: null,
      });

      const updatedDoc = await docRef.get();
      return formatDoc(updatedDoc);
    } catch (error) {
      console.error("Error unbooking slot:", error);
      throw error;
    }
  },

  /**
   * Validate no overlapping slots exist
   * @param {String} doctorId - Doctor ID
   * @param {Date} startTime - Start time
   * @param {Date} endTime - End time
   * @param {String} excludeSlotId - Slot ID to exclude from check
   */
  async validateNoOverlap(doctorId, startTime, endTime, excludeSlotId = null) {
    try {
      // Check for overlapping slots
      const overlappingQuery = slotsRef
        .where("doctorId", "==", doctorId)
        .where("startTime", "<", endTime)
        .where("endTime", ">", startTime);

      const snapshot = await overlappingQuery.get();

      const overlapping = snapshot.docs.filter((doc) => {
        return excludeSlotId ? doc.id !== excludeSlotId : true;
      });

      if (overlapping.length > 0) {
        throw new Error("Time slot overlaps with existing availability");
      }
    } catch (error) {
      if (error.message.includes("overlaps")) {
        throw error;
      }
      console.error("Error validating slot overlap:", error);
      throw new Error("Error validating time slot");
    }
  },

  /**
   * Clean up expired unbooked slots (run periodically)
   * @param {Number} hoursAgo - Hours in the past to clean up
   * @returns {Number} Number of deleted slots
   */
  async cleanupExpiredSlots(hoursAgo = 24) {
    try {
      const cutoffTime = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);

      const expiredQuery = slotsRef
        .where("isBooked", "==", false)
        .where("endTime", "<", cutoffTime);

      const snapshot = await expiredQuery.get();

      const batch = db.batch();
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      return snapshot.docs.length;
    } catch (error) {
      console.error("Error cleaning up expired slots:", error);
      throw error;
    }
  },
};

module.exports = DoctorAvailabilitySlotModel;
