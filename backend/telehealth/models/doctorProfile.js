/**
 * Doctor profile model for MedLink telehealth
 */
const { db } = require('../../config/firebase');
const { formatDoc, formatDocs, sanitizeInput, paginationParams, timestamp } = require('../../utils/helpers');

// Collection reference
const doctorsRef = db.collection('doctorProfiles');

/**
 * Doctor profile model
 */
const DoctorProfileModel = {
  /**
   * Get doctor profile by ID
   * @param {String} id - Doctor ID
   * @returns {Object} Doctor profile data
   */
  async getById(id) {
    try {
      const doc = await doctorsRef.doc(id).get();
      return formatDoc(doc);
    } catch (error) {
      console.error('Error getting doctor profile by ID:', error);
      throw error;
    }
  },

  /**
   * Get doctors by specialization
   * @param {String} specialization - Specialization
   * @returns {Array} Doctor profiles
   */
  async getBySpecialization(specialization) {
    try {
      const snapshot = await doctorsRef
        .where('specialization', '==', specialization)
        .where('isApproved', '==', true)
        .orderBy('experienceYears', 'desc')
        .get();
      
      return formatDocs(snapshot.docs);
    } catch (error) {
      console.error('Error getting doctors by specialization:', error);
      throw error;
    }
  },

  /**
   * Get all approved doctors
   * @param {Number} limit - Number of doctors to return
   * @param {Number} offset - Offset for pagination
   * @returns {Array} Doctor profiles
   */
  async getAllApproved(limit, offset) {
    try {
      const { limit: limitVal, offset: offsetVal } = paginationParams(limit, offset);
      
      let query = doctorsRef
        .where('isApproved', '==', true)
        .orderBy('experienceYears', 'desc');
      
      // Apply pagination
      if (offsetVal > 0) {
        // Get the last document from the previous page
        const prevPageSnapshot = await doctorsRef
          .where('isApproved', '==', true)
          .orderBy('experienceYears', 'desc')
          .limit(offsetVal)
          .get();
        
        const lastDoc = prevPageSnapshot.docs[prevPageSnapshot.docs.length - 1];
        if (lastDoc) {
          query = query.startAfter(lastDoc);
        }
      }
      
      // Apply limit
      query = query.limit(limitVal);
      
      const snapshot = await query.get();
      return formatDocs(snapshot.docs);
    } catch (error) {
      console.error('Error getting all approved doctors:', error);
      throw error;
    }
  },

  /**
   * Create doctor profile
   * @param {String} doctorId - Doctor ID
   * @param {Object} data - Doctor profile data
   * @param {Object} transaction - Firestore transaction (optional)
   * @returns {Object} Created doctor profile
   */
  async create(doctorId, data, transaction = null) {
    try {
      const sanitizedData = sanitizeInput(data);
      const docRef = doctorsRef.doc(doctorId);
      
      const doctorData = {
        doctorId,
        ...sanitizedData,
        certificates: [],
        averageRating: 0,
        ratingCount: 0,
        isApproved: false,
        createdAt: timestamp(),
        updatedAt: timestamp()
      };
      
      if (transaction) {
        transaction.set(docRef, doctorData);
      } else {
        await docRef.set(doctorData);
      }
      
      if (!transaction) {
        const doc = await docRef.get();
        return formatDoc(doc);
      }
      
      return doctorData;
    } catch (error) {
      console.error('Error creating doctor profile:', error);
      throw error;
    }
  },

  /**
   * Update doctor profile
   * @param {String} doctorId - Doctor ID
   * @param {Object} data - Doctor profile data
   * @returns {Object} Updated doctor profile
   */
  async update(doctorId, data) {
    try {
      const sanitizedData = sanitizeInput(data);
      const docRef = doctorsRef.doc(doctorId);
      
      // Check if doctor profile exists
      const docSnapshot = await docRef.get();
      if (!docSnapshot.exists) {
        throw new Error('Doctor profile not found');
      }
      
      // Update doctor profile
      await docRef.update({
        ...sanitizedData,
        updatedAt: timestamp()
      });
      
      // Get updated doctor profile
      const updatedDoc = await docRef.get();
      return formatDoc(updatedDoc);
    } catch (error) {
      console.error('Error updating doctor profile:', error);
      throw error;
    }
  },

  /**
   * Add certificate to doctor profile
   * @param {String} doctorId - Doctor ID
   * @param {Object} certificate - Certificate data
   * @returns {Object} Updated doctor profile
   */
  async addCertificate(doctorId, certificate) {
    try {
      const sanitizedCertificate = sanitizeInput(certificate);
      const docRef = doctorsRef.doc(doctorId);
      
      // Check if doctor profile exists
      const docSnapshot = await docRef.get();
      if (!docSnapshot.exists) {
        throw new Error('Doctor profile not found');
      }
      
      // Add certificate
      await docRef.update({
        certificates: db.FieldValue.arrayUnion(sanitizedCertificate),
        updatedAt: timestamp()
      });
      
      // Get updated doctor profile
      const updatedDoc = await docRef.get();
      return formatDoc(updatedDoc);
    } catch (error) {
      console.error('Error adding certificate:', error);
      throw error;
    }
  },

  /**
   * Approve doctor profile
   * @param {String} doctorId - Doctor ID
   * @returns {Object} Updated doctor profile
   */
  async approve(doctorId) {
    try {
      const docRef = doctorsRef.doc(doctorId);
      
      // Check if doctor profile exists
      const docSnapshot = await docRef.get();
      if (!docSnapshot.exists) {
        throw new Error('Doctor profile not found');
      }
      
      // Approve doctor profile
      await docRef.update({
        isApproved: true,
        approvedAt: timestamp(),
        updatedAt: timestamp()
      });
      
      // Get updated doctor profile
      const updatedDoc = await docRef.get();
      return formatDoc(updatedDoc);
    } catch (error) {
      console.error('Error approving doctor profile:', error);
      throw error;
    }
  },

  /**
   * Delete doctor profile
   * @param {String} doctorId - Doctor ID
   * @param {Object} transaction - Firestore transaction (optional)
   * @returns {Boolean} Success status
   */
  async delete(doctorId, transaction = null) {
    try {
      const docRef = doctorsRef.doc(doctorId);
      
      if (transaction) {
        transaction.delete(docRef);
      } else {
        await docRef.delete();
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting doctor profile:', error);
      throw error;
    }
  }
};

module.exports = DoctorProfileModel;

