/**
 * Patient profile model for MedLink telehealth
 */
const { db } = require('../../config/firebase');
const { formatDoc, sanitizeInput, timestamp } = require('../../utils/helpers');

// Collection reference
const patientsRef = db.collection('patientProfiles');

/**
 * Patient profile model
 */
const PatientProfileModel = {
  /**
   * Get patient profile by ID
   * @param {String} id - Patient ID
   * @returns {Object} Patient profile data
   */
  async getById(id) {
    try {
      const doc = await patientsRef.doc(id).get();
      return formatDoc(doc);
    } catch (error) {
      console.error('Error getting patient profile by ID:', error);
      throw error;
    }
  },

  /**
   * Create patient profile
   * @param {String} patientId - Patient ID
   * @param {Object} data - Patient profile data
   * @param {Object} transaction - Firestore transaction (optional)
   * @returns {Object} Created patient profile
   */
  async create(patientId, data, transaction = null) {
    try {
      const sanitizedData = sanitizeInput(data);
      const docRef = patientsRef.doc(patientId);
      
      const patientData = {
        patientId,
        ...sanitizedData,
        telehealthWalletBalance: 0,
        createdAt: timestamp(),
        updatedAt: timestamp()
      };
      
      if (transaction) {
        transaction.set(docRef, patientData);
      } else {
        await docRef.set(patientData);
      }
      
      if (!transaction) {
        const doc = await docRef.get();
        return formatDoc(doc);
      }
      
      return patientData;
    } catch (error) {
      console.error('Error creating patient profile:', error);
      throw error;
    }
  },

  /**
   * Update patient profile
   * @param {String} patientId - Patient ID
   * @param {Object} data - Patient profile data
   * @returns {Object} Updated patient profile
   */
  async update(patientId, data) {
    try {
      const sanitizedData = sanitizeInput(data);
      const docRef = patientsRef.doc(patientId);
      
      // Check if patient profile exists
      const docSnapshot = await docRef.get();
      if (!docSnapshot.exists) {
        // Create new patient profile if it doesn't exist
        return await this.create(patientId, sanitizedData);
      }
      
      // Update patient profile
      await docRef.update({
        ...sanitizedData,
        updatedAt: timestamp()
      });
      
      // Get updated patient profile
      const updatedDoc = await docRef.get();
      return formatDoc(updatedDoc);
    } catch (error) {
      console.error('Error updating patient profile:', error);
      throw error;
    }
  },

  /**
   * Update wallet balance
   * @param {String} patientId - Patient ID
   * @param {Number} amount - Amount to add/subtract
   * @returns {Object} Updated patient profile
   */
  async updateWalletBalance(patientId, amount) {
    try {
      const docRef = patientsRef.doc(patientId);
      
      // Check if patient profile exists
      const docSnapshot = await docRef.get();
      if (!docSnapshot.exists) {
        throw new Error('Patient profile not found');
      }
      
      // Update wallet balance
      await docRef.update({
        telehealthWalletBalance: db.FieldValue.increment(amount),
        updatedAt: timestamp()
      });
      
      // Get updated patient profile
      const updatedDoc = await docRef.get();
      return formatDoc(updatedDoc);
    } catch (error) {
      console.error('Error updating wallet balance:', error);
      throw error;
    }
  },

  /**
   * Delete patient profile
   * @param {String} patientId - Patient ID
   * @param {Object} transaction - Firestore transaction (optional)
   * @returns {Boolean} Success status
   */
  async delete(patientId, transaction = null) {
    try {
      const docRef = patientsRef.doc(patientId);
      
      if (transaction) {
        transaction.delete(docRef);
      } else {
        await docRef.delete();
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting patient profile:', error);
      throw error;
    }
  }
};

module.exports = PatientProfileModel;

