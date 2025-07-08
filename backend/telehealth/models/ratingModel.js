// model/ratingModel.js
/**
 * Rating Model for Telehealth Platform
 */
const { db } = require("../config/firebase");
const {
  formatDoc,
  formatDocs,
  sanitizeInput,
  paginationParams,
  timestamp,
} = require("../../utils/helpers");
const { createNotificationService } = require("../service/notificationService");
const UserModel = require("./user");
const DoctorProfileModel = require("./doctorProfile");

// Collection references
const ratingsRef = db.collection("thRatings");

/**
 * Telehealth Rating Model
 */
const THRatingModel = {
  notificationService: null,

  setNotificationService(io) {
    this.notificationService = createNotificationService(io);
  },

  /**
   * Create a rating between doctor and patient
   * @param {String} raterId - ID of user giving the rating
   * @param {String} ratedUserId - ID of user being rated
   * @param {String} appointmentId - Related appointment ID
   * @param {Number} rating - Rating value (1-5)
   * @param {String} comment - Optional comment
   * @param {String} ratingType - Type of rating (doctor_rating, patient_rating)
   * @returns {Object} Created rating
   */
  async createRating(
    raterId,
    ratedUserId,
    appointmentId,
    rating,
    comment,
    ratingType
  ) {
    try {
      // Validate rating value
      if (rating < 1 || rating > 5) {
        throw new Error("Rating must be between 1 and 5");
      }

      // Validate rating type
      if (!["doctor_rating", "patient_rating"].includes(ratingType)) {
        throw new Error("Invalid rating type");
      }

      // Check if rating already exists for this appointment
      const existingRating = await this.getRatingByAppointment(
        appointmentId,
        raterId,
        ratedUserId
      );
      if (existingRating) {
        throw new Error("Rating already exists for this appointment");
      }

      // Get user details
      const raterUser = await UserModel.getById(raterId);
      const ratedUser = await UserModel.getById(ratedUserId);

      // Get doctor profile if rating a doctor
      let doctorProfile = null;
      if (ratingType === "doctor_rating") {
        doctorProfile = await DoctorProfileModel.getById(ratedUserId);
      }

      // Prepare rating data
      const ratingData = {
        raterId,
        raterName: `${raterUser?.firstName || ''} ${raterUser?.lastName || ''}`.trim() || "Unknown",
        raterRole: raterUser?.role || "unknown",
        raterProfileImage: raterUser?.profileImageUrl,
        ratedUserId,
        ratedUserName: `${ratedUser?.firstName || ''} ${ratedUser?.lastName || ''}`.trim() || "Unknown",
        ratedUserRole: ratedUser?.role || "unknown",
        appointmentId,
        rating,
        comment: comment || "",
        ratingType, // 'doctor_rating' or 'patient_rating'
        createdAt: timestamp(),
        updatedAt: timestamp(),
      };

      // Create rating document
      const ratingRef = await ratingsRef.add(ratingData);

      // Update doctor's rating statistics if this is a doctor rating
      if (ratingType === "doctor_rating") {
        await this.updateDoctorRatingStats(ratedUserId);
      }

      // Send notification to rated user
      if (this.notificationService) {
        const notificationMessage = ratingType === "doctor_rating" 
          ? `You received a ${rating}-star rating from a patient`
          : `You received a ${rating}-star rating from Dr. ${ratedUser?.firstName || ''} ${ratedUser?.lastName || ''}`;

        await this.notificationService.createNotification(
          ratedUserId,
          "rating_received",
          notificationMessage,
          {
            rating,
            raterName: ratingData.raterName,
            appointmentId,
            comment: comment || "",
            ratingType,
            actionUrl: `/profile/ratings`,
          },
          rating >= 4 ? "normal" : "high"
        );
      }

      // Get created rating
      const createdRatingDoc = await ratingRef.get();
      return formatDoc(createdRatingDoc);
    } catch (error) {
      console.error("Error creating rating:", error);
      throw error;
    }
  },

  /**
   * Get doctor ratings (ratings received by a doctor)
   * @param {String} doctorId - Doctor ID
   * @param {Number} limit - Number of ratings to return
   * @param {Number} offset - Offset for pagination
   * @returns {Array} Array of ratings
   */
  async getDoctorRatings(doctorId, limit, offset) {
    try {
      const { limit: limitVal, offset: offsetVal } = paginationParams(
        limit,
        offset
      );

      let query = ratingsRef
        .where("ratedUserId", "==", doctorId)
        .where("ratingType", "==", "doctor_rating")
        .orderBy("createdAt", "desc");

      // Apply pagination
      if (offsetVal > 0) {
        const prevPageSnapshot = await ratingsRef
          .where("ratedUserId", "==", doctorId)
          .where("ratingType", "==", "doctor_rating")
          .orderBy("createdAt", "desc")
          .limit(offsetVal)
          .get();

        const lastDoc = prevPageSnapshot.docs[prevPageSnapshot.docs.length - 1];
        if (lastDoc) {
          query = query.startAfter(lastDoc);
        }
      }

      query = query.limit(limitVal);
      const snapshot = await query.get();
      return formatDocs(snapshot.docs);
    } catch (error) {
      console.error("Error getting doctor ratings:", error);
      throw error;
    }
  },

  /**
   * Get patient ratings (ratings received by a patient)
   * @param {String} patientId - Patient ID
   * @param {Number} limit - Number of ratings to return
   * @param {Number} offset - Offset for pagination
   * @returns {Array} Array of ratings
   */
  async getPatientRatings(patientId, limit, offset) {
    try {
      const { limit: limitVal, offset: offsetVal } = paginationParams(
        limit,
        offset
      );

      let query = ratingsRef
        .where("ratedUserId", "==", patientId)
        .where("ratingType", "==", "patient_rating")
        .orderBy("createdAt", "desc");

      // Apply pagination
      if (offsetVal > 0) {
        const prevPageSnapshot = await ratingsRef
          .where("ratedUserId", "==", patientId)
          .where("ratingType", "==", "patient_rating")
          .orderBy("createdAt", "desc")
          .limit(offsetVal)
          .get();

        const lastDoc = prevPageSnapshot.docs[prevPageSnapshot.docs.length - 1];
        if (lastDoc) {
          query = query.startAfter(lastDoc);
        }
      }

      query = query.limit(limitVal);
      const snapshot = await query.get();
      return formatDocs(snapshot.docs);
    } catch (error) {
      console.error("Error getting patient ratings:", error);
      throw error;
    }
  },

  /**
   * Get ratings given by a user
   * @param {String} userId - User ID
   * @param {Number} limit - Number of ratings to return
   * @param {Number} offset - Offset for pagination
   * @returns {Array} Array of ratings
   */
  async getRatingsByUser(userId, limit, offset) {
    try {
      const { limit: limitVal, offset: offsetVal } = paginationParams(
        limit,
        offset
      );

      let query = ratingsRef
        .where("raterId", "==", userId)
        .orderBy("createdAt", "desc");

      // Apply pagination
      if (offsetVal > 0) {
        const prevPageSnapshot = await ratingsRef
          .where("raterId", "==", userId)
          .orderBy("createdAt", "desc")
          .limit(offsetVal)
          .get();

        const lastDoc = prevPageSnapshot.docs[prevPageSnapshot.docs.length - 1];
        if (lastDoc) {
          query = query.startAfter(lastDoc);
        }
      }

      query = query.limit(limitVal);
      const snapshot = await query.get();
      return formatDocs(snapshot.docs);
    } catch (error) {
      console.error("Error getting ratings by user:", error);
      throw error;
    }
  },

  /**
   * Get ratings for a specific appointment
   * @param {String} appointmentId - Appointment ID
   * @returns {Array} Array of ratings
   */
  async getRatingsByAppointment(appointmentId) {
    try {
      const snapshot = await ratingsRef
        .where("appointmentId", "==", appointmentId)
        .orderBy("createdAt", "desc")
        .get();
      return formatDocs(snapshot.docs);
    } catch (error) {
      console.error("Error getting ratings by appointment:", error);
      throw error;
    }
  },

  /**
   * Check if rating exists for appointment
   * @param {String} appointmentId - Appointment ID
   * @param {String} raterId - Rater ID
   * @param {String} ratedUserId - Rated user ID
   * @returns {Object|null} Rating document or null
   */
  async getRatingByAppointment(appointmentId, raterId, ratedUserId) {
    try {
      const snapshot = await ratingsRef
        .where("appointmentId", "==", appointmentId)
        .where("raterId", "==", raterId)
        .where("ratedUserId", "==", ratedUserId)
        .limit(1)
        .get();

      if (snapshot.empty) return null;
      return formatDoc(snapshot.docs[0]);
    } catch (error) {
      console.error("Error checking rating by appointment:", error);
      throw error;
    }
  },

  /**
   * Update doctor rating statistics
   * @param {String} doctorId - Doctor ID
   */
  async updateDoctorRatingStats(doctorId) {
    try {
      const snapshot = await ratingsRef
        .where("ratedUserId", "==", doctorId)
        .where("ratingType", "==", "doctor_rating")
        .get();

      if (snapshot.empty) return;

      const ratings = snapshot.docs.map((doc) => doc.data().rating);
      const totalRatings = ratings.length;
      const averageRating =
        ratings.reduce((sum, rating) => sum + rating, 0) / totalRatings;

      // Update doctor profile with rating stats
      await db
        .collection("doctorProfiles")
        .doc(doctorId)
        .update({
          averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
          ratingCount: totalRatings,
          updatedAt: timestamp(),
        });
    } catch (error) {
      console.error("Error updating doctor rating stats:", error);
      // Don't throw error to avoid breaking the main rating flow
    }
  },

  /**
   * Delete rating (admin only)
   * @param {String} ratingId - Rating ID
   * @param {String} deletedBy - Admin user ID
   * @param {String} reason - Deletion reason
   * @returns {Boolean} Success status
   */
  async deleteRating(ratingId, deletedBy, reason) {
    try {
      // Get rating data before deletion
      const ratingDoc = await ratingsRef.doc(ratingId).get();
      const ratingData = ratingDoc.data();

      if (!ratingData) {
        throw new Error("Rating not found");
      }

      // Delete the rating
      await ratingsRef.doc(ratingId).delete();

      // Update doctor statistics if it was a doctor rating
      if (ratingData.ratingType === "doctor_rating") {
        await this.updateDoctorRatingStats(ratingData.ratedUserId);
      }

      // Send notification about deletion
      if (this.notificationService) {
        await this.notificationService.createNotification(
          ratingData.raterId,
          "rating_removed",
          "One of your ratings has been removed by our moderation team",
          {
            reason,
            deletedBy,
            ratingType: ratingData.ratingType,
            actionUrl: "/support/contact",
          },
          "high"
        );
      }

      return true;
    } catch (error) {
      console.error("Error deleting rating:", error);
      throw error;
    }
  },

  /**
   * Get rating statistics for a doctor
   * @param {String} doctorId - Doctor ID
   * @returns {Object} Rating statistics
   */
  async getDoctorRatingStats(doctorId) {
    try {
      const doctorProfile = await DoctorProfileModel.getById(doctorId);
      return {
        totalRatings: doctorProfile?.ratingCount || 0,
        averageRating: doctorProfile?.averageRating || 0,
        lastUpdated: doctorProfile?.updatedAt || null,
      };
    } catch (error) {
      console.error("Error getting doctor rating stats:", error);
      return {
        totalRatings: 0,
        averageRating: 0,
        lastUpdated: null,
      };
    }
  },

  /**
   * Check if user can rate another user for specific appointment
   * @param {String} appointmentId - Appointment ID
   * @param {String} raterId - Rater ID
   * @param {String} ratedUserId - Rated user ID
   * @returns {Boolean} Whether user can rate
   */
  async canRateUser(appointmentId, raterId, ratedUserId) {
    try {
      const existingRating = await this.getRatingByAppointment(
        appointmentId,
        raterId,
        ratedUserId
      );
      return !existingRating;
    } catch (error) {
      console.error("Error checking if user can rate:", error);
      return false;
    }
  },
};

module.exports = THRatingModel;
