/**
 * Medical Supplies User model with Notification Integration
 */
const { db, GeoPoint } = require("../../config/firebase");
const {
  formatDoc,
  formatDocs,
  sanitizeInput,
  paginationParams,
  timestamp,
} = require("../../utils/helpers");
const {createNotificationService} = require("../service/notificationService");

// Collection reference
const msUsersRef = db.collection("msUsers");

/**
 * Medical Supplies User model
 */
const MSUserModel = {
  notificationService: null,

  setNotificationService(io) {
    this.notificationService = createNotificationService(io);
  },

  /**
   * Get user by ID
   * @param {String} id - User ID
   * @returns {Object} User data
   */
  async getById(id) {
    try {
      const doc = await msUsersRef.doc(id).get();
      return formatDoc(doc);
    } catch (error) {
      console.error("Error getting MS user by ID:", error);
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
      const snapshot = await msUsersRef
        .where("email", "==", email)
        .limit(1)
        .get();
      if (snapshot.empty) return null;
      return formatDoc(snapshot.docs[0]);
    } catch (error) {
      console.error("Error getting MS user by email:", error);
      throw error;
    }
  },

  /**
   * Get users by role
   * @param {String} role - User role
   * @param {Number} limit - Number of users to return
   * @param {Number} offset - Offset for pagination
   * @returns {Array} Array of users
   */
  async getByRole(role, limit, offset) {
    try {
      const { limit: limitVal, offset: offsetVal } = paginationParams(
        limit,
        offset
      );

      let query = msUsersRef
        .where("role", "==", role)
        .orderBy("createdAt", "desc");

      // Apply pagination
      if (offsetVal > 0) {
        // Get the last document from the previous page
        const prevPageSnapshot = await msUsersRef
          .where("role", "==", role)
          .orderBy("createdAt", "desc")
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
      console.error("Error getting MS users by role:", error);
      throw error;
    }
  },

  /**
   * Get pending approval users
   * @param {Number} limit - Number of users to return
   * @param {Number} offset - Offset for pagination
   * @returns {Array} Array of users
   */
  async getPendingApproval(limit, offset) {
    try {
      const { limit: limitVal, offset: offsetVal } = paginationParams(
        limit,
        offset
      );

      let query = msUsersRef
        .where("isApproved", "==", false)
        .orderBy("createdAt", "asc");

      // Apply pagination
      if (offsetVal > 0) {
        // Get the last document from the previous page
        const prevPageSnapshot = await msUsersRef
          .where("isApproved", "==", false)
          .orderBy("createdAt", "asc")
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
      console.error("Error getting pending approval MS users:", error);
      throw error;
    }
  },

  /**
   * Search users
   * @param {String} query - Search query
   * @param {String} currentUserId - Current user ID to exclude from results
   * @returns {Array} Array of users
   */
  async search(query, currentUserId) {
    try {
      // Normalize query
      const normalizedQuery = query.toLowerCase().trim();

      // Get all users
      const snapshot = await msUsersRef.get();

      // Filter users locally (Firestore doesn't support full-text search)
      const filteredDocs = snapshot.docs.filter((doc) => {
        const data = doc.data();

        // Check company name
        if (
          data.companyName &&
          data.companyName.toLowerCase().includes(normalizedQuery)
        ) {
          return true;
        }

        // Check contact name
        if (
          data.contactName &&
          data.contactName.toLowerCase().includes(normalizedQuery)
        ) {
          return true;
        }

        // Check email
        if (data.email && data.email.toLowerCase().includes(normalizedQuery)) {
          return true;
        }

        // Check phone number
        if (data.phoneNumber && data.phoneNumber.includes(normalizedQuery)) {
          return true;
        }

        // Check address
        if (data.address) {
          const address = data.address;

          if (
            address.street &&
            address.street.toLowerCase().includes(normalizedQuery)
          ) {
            return true;
          }

          if (
            address.city &&
            address.city.toLowerCase().includes(normalizedQuery)
          ) {
            return true;
          }

          if (
            address.state &&
            address.state.toLowerCase().includes(normalizedQuery)
          ) {
            return true;
          }

          if (
            address.country &&
            address.country.toLowerCase().includes(normalizedQuery)
          ) {
            return true;
          }
        }

        return false;
      });

      return formatDocs(
        filteredDocs.filter(
          (userData) => userData.data().userId !== currentUserId
        )
      );
    } catch (error) {
      console.error("Error searching MS users:", error);
      throw error;
    }
  },

  /**
   * Initialize user
   * @param {String} id - User ID
   * @param {String} email - User email
   * @returns {Object} User data
   */
  async initializeUser(id, email) {
    try {
      const userRef = msUsersRef.doc(id);

      // Check if user already exists
      const userDoc = await userRef.get();
      if (userDoc.exists) {
        return formatDoc(userDoc);
      }

      // Create user
      const userData = {
        userId: id,
        email,
        role: null, // Will be set during registration
        createdAt: timestamp(),
        isApproved: false,
        profileComplete: false,
        cart: {
          items: [],
          total: 0,
          lastUpdated: timestamp(),
        },
      };

      await userRef.set(userData);

      // Send welcome notification
      if (this.notificationService) {
        await this.notificationService.notifyAccountActivity(
          id,
          "profile_update",
          {
            message:
              "Welcome to Medical Supplies! Please complete your registration to get started.",
            actionUrl: "/register",
            tips: [
              "Complete your profile for better visibility",
              "Set up your preferences",
            ],
          }
        );
      }

      // Get created user
      const createdUserDoc = await userRef.get();
      return formatDoc(createdUserDoc);
    } catch (error) {
      console.error("Error initializing MS user:", error);
      throw error;
    }
  },

  /**
   * Update user
   * @param {String} id - User ID
   * @param {Object} data - User data
   * @returns {Object} Updated user data
   */
  async update(id, data) {
    try {
      const sanitizedData = sanitizeInput(data);
      const userRef = msUsersRef.doc(id);

      // Handle GeoPoint conversion for address.geoLocation
      if (sanitizedData.address && sanitizedData.address.geoLocation) {
        const { latitude, longitude } = sanitizedData.address.geoLocation;
        if (latitude !== undefined && longitude !== undefined) {
          sanitizedData.address.geoLocation = new GeoPoint(latitude, longitude);
        }
      }

      // Update user
      await userRef.update({
        ...sanitizedData,
        updatedAt: timestamp(),
      });

      // Send profile update notification
      if (this.notificationService) {
        await this.notificationService.notifyAccountActivity(
          id,
          "profile_update",
          {
            message: "Your profile has been updated successfully.",
            changes: Object.keys(sanitizedData),
          }
        );
      }

      // Get updated user
      const updatedUserDoc = await userRef.get();
      return formatDoc(updatedUserDoc);
    } catch (error) {
      console.error("Error updating MS user:", error);
      throw error;
    }
  },

  /**
   * Complete registration
   * @param {String} id - User ID
   * @param {Object} data - User data
   * @returns {Object} Updated user data
   */
  async completeRegistration(id, data) {
    try {
      const sanitizedData = sanitizeInput(data);
      const userRef = msUsersRef.doc(id);

      // Handle GeoPoint conversion for address.geoLocation
      if (sanitizedData.address && sanitizedData.address.geoLocation) {
        const { latitude, longitude } = sanitizedData.address.geoLocation;
        if (latitude !== undefined && longitude !== undefined) {
          sanitizedData.address.geoLocation = new GeoPoint(latitude, longitude);
        }
      }

      const isAdmin = sanitizedData.role === "admin";

      // Update user
      await userRef.update({
        ...sanitizedData,
        profileComplete: true,
        isApproved: isAdmin, // Auto-approve admins
        updatedAt: timestamp(),
      });

      // Send appropriate notifications
      if (this.notificationService) {
        if (isAdmin) {
          // Admin auto-approval notification
          await this.notificationService.notifyAccountActivity(
            id,
            "verification",
            {
              message:
                "Your admin account has been activated. You now have full access to the platform.",
              actionUrl: "/",
            }
          );
        } else {
          // Regular user pending approval notification
          await this.notificationService.createNotification(
            id,
            "account_status",
            "Registration completed! Your account is pending approval by our admin team.",
            {
              status: "pending_approval",
              role: sanitizedData.role,
              actionUrl: "/profile",
              estimatedReviewTime: "24-48 hours",
            },
            "normal"
          );

          // Notify admins about new user registration
          await this.notificationService.notifyByRole(
            "admin",
            "user_registration",
            `New ${sanitizedData.role} registration requires approval`,
            {
              userId: id,
              userEmail: sanitizedData.email,
              companyName: sanitizedData.companyName,
              role: sanitizedData.role,
              actionUrl: `/admin/users/pending-approval/`,
            },
            "high"
          );
        }
      }

      // Get updated user
      const updatedUserDoc = await userRef.get();
      return formatDoc(updatedUserDoc);
    } catch (error) {
      console.error("Error completing MS user registration:", error);
      throw error;
    }
  },

  /**
   * Approve user
   * @param {String} id - User ID
   * @param {String} approvedByUserId - ID of admin who approved
   * @returns {Object} Updated user data
   */
  async approve(id, approvedByUserId) {
    try {
      const userRef = msUsersRef.doc(id);

      // Get user data before approval for notification context
      const userDoc = await userRef.get();
      const userData = userDoc.data();

      // Update user
      await userRef.update({
        isApproved: true,
        approvedBy: approvedByUserId,
        approvedAt: timestamp(),
        updatedAt: timestamp(),
      });

      // Send approval notification to user
      if (this.notificationService && userData) {
        await this.notificationService.createNotification(
          id,
          "account_status",
          "Congratulations! Your account has been approved and is now active.",
          {
            status: "approved",
            approvedBy: approvedByUserId,
            role: userData.role,
            actionUrl: "/",
            welcomeMessage:
              "You can now access all features and start using our medical supplies platform.",
          },
          "high"
        );

        // Send welcome notification with role-specific information
        const roleWelcomeMessages = {
          supplier: "You can now list your medical supplies and manage orders.",
          buyer:
            "You can now browse and purchase medical supplies from verified suppliers.",
          distributor:
            "You can now access wholesale pricing and bulk ordering features.",
        };

        await this.notificationService.createNotification(
          id,
          "welcome",
          `Welcome to Medical Supplies Platform! ${
            roleWelcomeMessages[userData.role] ||
            "You now have full access to the platform."
          }`,
          {
            role: userData.role,
            actionUrl:"/profile",
            tips: [
              "Complete your profile for better visibility",
              "Explore the marketplace",
              "Set up your preferences",
            ],
          },
          "normal"
        );
      }

      // Get updated user
      const updatedUserDoc = await userRef.get();
      return formatDoc(updatedUserDoc);
    } catch (error) {
      console.error("Error approving MS user:", error);
      throw error;
    }
  },

  /**
   * Reject user
   * @param {String} id - User ID
   * @param {String} reason - Rejection reason
   * @param {String} rejectedByUserId - ID of admin who rejected
   * @returns {Boolean} Success status
   */
  async reject(id, reason, rejectedByUserId) {
    try {
      const userRef = msUsersRef.doc(id);

      // Get user data before rejection for notification context
      const userDoc = await userRef.get();
      const userData = userDoc.data();

      // Update user
      await userRef.update({
        isApproved: false,
        rejectionReason: reason,
        rejectedBy: rejectedByUserId,
        rejectedAt: timestamp(),
        updatedAt: timestamp(),
      });

      // Send rejection notification to user
      if (this.notificationService && userData) {
        await this.notificationService.createNotification(
          id,
          "account_status",
          "Your account application has been reviewed.",
          {
            status: "rejected",
            reason: reason,
            rejectedBy: rejectedByUserId,
            actionUrl: "/support/contact",
            supportMessage:
              "If you have questions about this decision, please contact our support team.",
            canReapply: true,
            reapplyUrl: "/register",
          },
          "high"
        );
      }

      return true;
    } catch (error) {
      console.error("Error rejecting MS user:", error);
      throw error;
    }
  },

  /**
   * Delete user
   * @param {String} id - User ID
   * @param {String} deletedByUserId - ID of admin who deleted the user
   * @param {String} reason - Deletion reason
   * @returns {Boolean} Success status
   */
  async delete(id, deletedByUserId, reason = "Account deleted by admin") {
    try {
      // Get user data before deletion for notification context
      const userDoc = await msUsersRef.doc(id).get();
      const userData = userDoc.data();

      // Send account deletion notification before deleting
      if (this.notificationService && userData) {
        await this.notificationService.createNotification(
          id,
          "account_status",
          "Your account has been permanently deleted.",
          {
            status: "deleted",
            reason: reason,
            deletedBy: deletedByUserId,
            supportUrl: "/support/contact",
            dataRetention:
              "Your personal data will be removed according to our privacy policy.",
          },
          "urgent"
        );
      }

      // Delete user
      await msUsersRef.doc(id).delete();

      return true;
    } catch (error) {
      console.error("Error deleting MS user:", error);
      throw error;
    }
  },

  /**
   * Notify user about cart updates
   * @param {String} userId - User ID
   * @param {Object} cartData - Cart data
   * @param {String} action - Action performed (add, remove, update, clear)
   */
};

module.exports = MSUserModel;
