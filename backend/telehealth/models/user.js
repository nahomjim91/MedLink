/**
 * User model for MedLink telehealth
 */
const { db } = require('../config/firebase');
const { formatDoc, sanitizeInput, timestamp } = require('../utils/helpers');
const DoctorProfileModel = require('./doctorProfile');
const PatientProfileModel = require('./patientProfile');

// Collection reference
const usersRef = db.collection('users');

/**
 * User model
 */
const UserModel = {
  /**
   * Get user by ID
   * @param {String} id - User ID
   * @returns {Object} User data
   */
  async getById(id) {
    try {
      const doc = await usersRef.doc(id).get();
      return formatDoc(doc);
    } catch (error) {
      console.error('Error getting user by ID:', error);
      throw error;
    }
  },

  /**
   * Get user by email
   * @param {String} email - User email
   * @returns {Object} User data
   */
  async getByEmail(email) {
    try {
      const snapshot = await usersRef.where('email', '==', email).limit(1).get();
      if (snapshot.empty) return null;
      return formatDoc(snapshot.docs[0]);
    } catch (error) {
      console.error('Error getting user by email:', error);
      throw error;
    }
  },

  /**
   * Create or update user
   * @param {String} id - User ID
   * @param {Object} data - User data
   * @returns {Object} Updated user data
   */
  async createOrUpdate(id, data) {
    try {
      const sanitizedData = sanitizeInput(data);
      
      // Get existing user
      const userRef = usersRef.doc(id);
      const userDoc = await userRef.get();
      
      let userData;
      
      if (userDoc.exists) {
        // Update existing user
        await userRef.update({
          ...sanitizedData,
          updatedAt: timestamp()
        });
      } else {
        // Create new user
        userData = {
          ...sanitizedData,
          createdAt: timestamp(),
          updatedAt: timestamp(),
          profileComplete: false
        };
        await userRef.set(userData);
      }
      
      // Get updated user
      const updatedDoc = await userRef.get();
      return formatDoc(updatedDoc);
    } catch (error) {
      console.error('Error creating/updating user:', error);
      throw error;
    }
  },

  /**
   * Complete user registration
   * @param {String} id - User ID
   * @param {Object} userData - User data
   * @param {Object} roleSpecificData - Role-specific data (doctor or patient)
   * @returns {Object} Updated user data
   */

  /**
   * Initialize a new user document after Firebase Auth creation
   * @param {String} id - User ID
   * @param {String} email - User email
   * @returns {Object} Newly created user data
   */
  async initializeUser(id, email) {
    try {
      const userRef = usersRef.doc(id);
      const userData = {
        email: email,
        role: null, // Role will be set during completeRegistration
        profileComplete: false,
        createdAt: timestamp(),
        updatedAt: timestamp()
      };
      await userRef.set(userData); // Use set() to create the document
      console.log(`Initialized user profile for ${id}`);
      const newUserDoc = await userRef.get();
      return formatDoc(newUserDoc);
    } catch (error) {
      console.error('Error initializing user:', error);
      throw error;
    }
  },

  /**
   * Complete user registration
   * (Consider making this more robust, e.g., using set with merge: true
   * or explicitly checking existence, though initializing first is better)
   */
  async completeRegistration(id, userData, roleSpecificData) {
    try {
      const sanitizedUserData = sanitizeInput(userData);
      const sanitizedRoleData = sanitizeInput(roleSpecificData);
      const userRef = usersRef.doc(id);

      // Ensure the user document exists before attempting transaction
      const userDoc = await userRef.get();
      if (!userDoc.exists) {
         // Optionally, try to initialize here if somehow missed,
         // but ideally it should exist from initializeUser call.
         console.error(`User document ${id} not found during completeRegistration.`);
         // You could attempt UserModel.initializeUser(id, sanitizedUserData.email || 'unknown_email');
         // before proceeding, or throw an error.
         await this.initializeUser(id, sanitizedUserData.email || userDoc.data()?.email); // Attempt recovery
         // throw new Error(`User document ${id} not found.`);
      }


      await db.runTransaction(async (transaction) => {
        // Update user document
        transaction.set(userRef, { // Use set with merge: true OR update after ensuring existence
          ...sanitizedUserData,
          profileComplete: true,
          updatedAt: timestamp()
        }, { merge: true }); // Merge ensures we don't overwrite createdAt

        // Create role-specific profile
        if (sanitizedUserData.role === 'doctor' && sanitizedRoleData) {
           // Check if profile exists before creating
           const profileExists = await DoctorProfileModel.getById(id);
           if (!profileExists) {
               await DoctorProfileModel.create(id, sanitizedRoleData, transaction);
           } else {
               await DoctorProfileModel.update(id, sanitizedRoleData, transaction); // Or update if it exists
           }
        } else if (sanitizedUserData.role === 'patient' && sanitizedRoleData) {
           const profileExists = await PatientProfileModel.getById(id);
            if (!profileExists) {
               await PatientProfileModel.create(id, sanitizedRoleData, transaction);
            } else {
               await PatientProfileModel.update(id, sanitizedRoleData, transaction);
            }
        }
      });

      const updatedDoc = await userRef.get();
      return formatDoc(updatedDoc);
    } catch (error) {
      console.error('Error completing registration:', error);
      throw error;
    }
  },

  /**
   * Delete user
   * @param {String} id - User ID
   * @returns {Boolean} Success status
   */
  async delete(id) {
    try {
      // Get user to check role
      const userDoc = await usersRef.doc(id).get();
      if (!userDoc.exists) return false;
      
      const userData = userDoc.data();
      
      // Delete user with transaction to ensure data consistency
      await db.runTransaction(async (transaction) => {
        // Delete user document
        transaction.delete(usersRef.doc(id));
        
        // Delete role-specific profile
        if (userData.role === 'doctor') {
          await DoctorProfileModel.delete(id, transaction);
        } else if (userData.role === 'patient') {
          await PatientProfileModel.delete(id, transaction);
        }
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }
};

module.exports = UserModel;

