/**
 * Rating Model with Notification Integration
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
const MSUserModel = require("./msUser");
const ProductModel = require("./productModel");

// Collection references
const ratingsRef = db.collection("ratings");

/**
 * Rating Model
 */
const RatingModel = {
  notificationService: null,

  setNotificationService(io) {
    this.notificationService = createNotificationService(io);
  },

  /**
   * Create a user-to-user rating
   * @param {String} raterId - ID of user giving the rating
   * @param {String} ratedUserId - ID of user being rated
   * @param {String} orderId - Related order ID
   * @param {Number} rating - Rating value (1-5)
   * @param {String} comment - Optional comment
   * @param {String} ratingType - Type of rating (seller_rating, buyer_rating)
   * @returns {Object} Created rating
   */
  async createUserRating(
    raterId,
    ratedUserId,
    orderId,
    rating,
    comment,
    ratingType
  ) {
    try {
      // Validate rating value
      if (rating < 1 || rating > 5) {
        throw new Error("Rating must be between 1 and 5");
      }

      // Check if rating already exists for this order and rater combination
      const existingRating = await this.getUserRatingByOrder(
        orderId,
        raterId,
        ratedUserId
      );
      if (existingRating) {
        throw new Error("Rating already exists for this order");
      }

      // Get user details for notification
      const raterUser = await MSUserModel.getById(raterId);
      const ratedUser = await MSUserModel.getById(ratedUserId);
      // console.log("Rater user:", raterUser);
      // console.log("Rated user:", ratedUser);

      // Prepare rating data

      const ratingData = {
        raterId,
        raterName:
          raterUser?.contactName || raterUser?.companyName || "Unknown",
        raterCompanyName: raterUser?.companyName,
        ratedUserId,
        ratedUserName:
          ratedUser?.contactName || ratedUser?.companyName || "Unknown",
        ratedUserCompanyName: ratedUser?.companyName,
        raterProfileImage: raterUser?.profileImageUrl,
        orderId,
        rating,
        comment: comment || "",
        ratingType, // 'seller_rating' or 'buyer_rating'
        type: "user_rating",
        createdAt: timestamp(),
        updatedAt: timestamp(),
      };

      // Create rating document
      const ratingRef = await ratingsRef.add(ratingData);

      // Update user's rating statistics
      await this.updateUserRatingStats(ratedUserId);

      // Send notification to rated user
      if (this.notificationService) {
        await this.notificationService.createNotification(
          ratedUserId,
          "rating_received",
          `You received a ${rating}-star rating from ${
            raterUser?.contactName || raterUser?.companyName
          }`,
          {
            rating,
            raterName: raterUser?.contactName || raterUser?.companyName,
            orderId,
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
      console.error("Error creating user rating:", error);
      throw error;
    }
  },

  /**
   * Create a product rating
   * @param {String} userId - ID of user giving the rating
   * @param {String} productId - ID of product being rated
   * @param {String} orderId - Related order ID
   * @param {Number} rating - Rating value (1-5)
   * @param {String} comment - Optional comment
   * @returns {Object} Created rating
   */
  async createProductRating(userId, productId, orderId, rating, comment) {
    try {
      // Validate rating value
      if (rating < 1 || rating > 5) {
        throw new Error("Rating must be between 1 and 5");
      }

      // Check if rating already exists for this product and user combination
      const existingRating = await this.getProductRatingByUser(
        productId,
        userId,
        orderId
      );
      if (existingRating) {
        throw new Error("Rating already exists for this product in this order");
      }

      // Get user and product details
      const user = await MSUserModel.getById(userId);
      const product = await ProductModel.getById(productId);
      // Prepare rating data

      const ratingData = {
        userId,
        userName: user?.contactName || user?.companyName || "Unknown",
        userCompanyName: user?.companyName,
        userProfileImage: user?.profileImageUrl,
        productId,
        productName: product?.productName || "Unknown Product",
        productSellerId: product?.ownerId,
        orderId,
        rating,
        comment: comment || "",
        type: "product_rating",
        createdAt: timestamp(),
        updatedAt: timestamp(),
      };

      // Create rating document
      const ratingRef = await ratingsRef.add(ratingData);

      // Update product's rating statistics
      await this.updateProductRatingStats(productId);

      // Send notification to product seller
      if (this.notificationService && product?.sellerId) {
        await this.notificationService.createNotification(
          product.sellerId,
          "product_rated",
          `Your product "${product.productName}" received a ${rating}-star rating`,
          {
            rating,
            raterName: user?.contactName || user?.companyName,
            productName: product.productName,
            productId,
            orderId,
            comment: comment || "",
            actionUrl: `/products/${productId}/ratings`,
          },
          rating >= 4 ? "normal" : "high"
        );
      }

      // Get created rating
      const createdRatingDoc = await ratingRef.get();
      return formatDoc(createdRatingDoc);
    } catch (error) {
      console.error("Error creating product rating:", error);
      throw error;
    }
  },

  /**
   * Get user ratings (ratings received by a user)
   * @param {String} userId - User ID
   * @param {Number} limit - Number of ratings to return
   * @param {Number} offset - Offset for pagination
   * @returns {Array} Array of ratings
   */
async getUserRatings(userId, limit, offset) {
  try {
    const { limit: limitVal, offset: offsetVal } = paginationParams(
      limit,
      offset
    );

    let query = ratingsRef
      .where("ratedUserId", "==", userId)
      .where("type", "==", "user_rating")
      .orderBy("createdAt", "desc");

    // Apply pagination
    if (offsetVal > 0) {
      const prevPageSnapshot = await ratingsRef
        .where("ratedUserId", "==", userId)
        .where("type", "==", "user_rating")
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
    console.log(formatDocs(snapshot.docs));
    return formatDocs(snapshot.docs) || []; // FIXED: Always return array
  } catch (error) {
    console.error("Error getting user ratings:", error);
    return []; // FIXED: Return empty array on error
  }
},


  /**
   * Get product ratings
   * @param {String} productId - Product ID
   * @param {Number} limit - Number of ratings to return
   * @param {Number} offset - Offset for pagination
   * @returns {Array} Array of ratings
   */
async getProductRatings(productId, limit, offset) {
  try {
    const { limit: limitVal, offset: offsetVal } = paginationParams(
      limit,
      offset
    );

    let query = ratingsRef
      .where("productId", "==", productId)
      .where("type", "==", "product_rating")
      .orderBy("createdAt", "desc");

    // Apply pagination
    if (offsetVal > 0) {
      const prevPageSnapshot = await ratingsRef
        .where("productId", "==", productId)
        .where("type", "==", "product_rating")
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
    return formatDocs(snapshot.docs) || []; // FIXED: Always return array
  } catch (error) {
    console.error("Error getting product ratings:", error);
    return []; // FIXED: Return empty array on error
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
    console.log("snapshot", formatDocs(snapshot.docs));
    return formatDocs(snapshot.docs) || []; // FIXED: Always return array
  } catch (error) {
    console.error("Error getting ratings by user:", error);
    return []; // FIXED: Return empty array on error
  }
},

  /**
   * Get ratings for a specific order
   * @param {String} orderId - Order ID
   * @returns {Array} Array of ratings
   */
  async getRatingsByOrder(orderId) {
    try {
      const snapshot = await ratingsRef
        .where("orderId", "==", orderId)
        .orderBy("createdAt", "desc")
        .get();
      return formatDocs(snapshot.docs);
    } catch (error) {
      console.error("Error getting ratings by order:", error);
      throw error;
    }
  },

  /**
   * Check if user rating exists for order
   * @param {String} orderId - Order ID
   * @param {String} raterId - Rater ID
   * @param {String} ratedUserId - Rated user ID
   * @returns {Object|null} Rating document or null
   */
  async getUserRatingByOrder(orderId, raterId, ratedUserId) {
    try {
      const snapshot = await ratingsRef
        .where("orderId", "==", orderId)
        .where("raterId", "==", raterId)
        .where("ratedUserId", "==", ratedUserId)
        .where("type", "==", "user_rating")
        .limit(1)
        .get();

      if (snapshot.empty) return null;
      return formatDoc(snapshot.docs[0]);
    } catch (error) {
      console.error("Error checking user rating by order:", error);
      throw error;
    }
  },

  /**
   * Check if product rating exists for user and order
   * @param {String} productId - Product ID
   * @param {String} userId - User ID
   * @param {String} orderId - Order ID
   * @returns {Object|null} Rating document or null
   */
  async getProductRatingByUser(productId, userId, orderId) {
    try {
      const snapshot = await ratingsRef
        .where("productId", "==", productId)
        .where("userId", "==", userId)
        .where("orderId", "==", orderId)
        .where("type", "==", "product_rating")
        .limit(1)
        .get();

      if (snapshot.empty) return null;
      return formatDoc(snapshot.docs[0]);
    } catch (error) {
      console.error("Error checking product rating by user:", error);
      throw error;
    }
  },

  /**
   * Update user rating statistics
   * @param {String} userId - User ID
   */
  async updateUserRatingStats(userId) {
    try {
      const snapshot = await ratingsRef
        .where("ratedUserId", "==", userId)
        .where("type", "==", "user_rating")
        .get();

      if (snapshot.empty) return;

      const ratings = snapshot.docs.map((doc) => doc.data().rating);
      const totalRatings = ratings.length;
      const averageRating =
        ratings.reduce((sum, rating) => sum + rating, 0) / totalRatings;

      // Update user document with rating stats
      await db
        .collection("msUsers")
        .doc(userId)
        .update({
          ratingStats: {
            totalRatings,
            averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
            lastUpdated: timestamp(),
          },
          updatedAt: timestamp(),
        });
    } catch (error) {
      console.error("Error updating user rating stats:", error);
      // Don't throw error to avoid breaking the main rating flow
    }
  },

  /**
   * Update product rating statistics
   * @param {String} productId - Product ID
   */
  async updateProductRatingStats(productId) {
    try {
      const snapshot = await ratingsRef
        .where("productId", "==", productId)
        .where("type", "==", "product_rating")
        .get();

      if (snapshot.empty) return;

      const ratings = snapshot.docs.map((doc) => doc.data().rating);
      const totalRatings = ratings.length;
      const averageRating =
        ratings.reduce((sum, rating) => sum + rating, 0) / totalRatings;

      // Update product document with rating stats
      await db
        .collection("products")
        .doc(productId)
        .update({
          ratingStats: {
            totalRatings,
            averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
            lastUpdated: timestamp(),
          },
          updatedAt: timestamp(),
        });
    } catch (error) {
      console.error("Error updating product rating stats:", error);
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

      // Update statistics
      if (ratingData.type === "user_rating") {
        await this.updateUserRatingStats(ratingData.ratedUserId);
      } else if (ratingData.type === "product_rating") {
        await this.updateProductRatingStats(ratingData.productId);
      }

      // Send notification about deletion
      if (this.notificationService) {
        const notificationTarget =
          ratingData.type === "user_rating"
            ? ratingData.raterId
            : ratingData.userId;

        await this.notificationService.createNotification(
          notificationTarget,
          "rating_removed",
          "One of your ratings has been removed by our moderation team",
          {
            reason,
            deletedBy,
            ratingType: ratingData.type,
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
   * Get rating statistics for a user
   * @param {String} userId - User ID
   * @returns {Object} Rating statistics
   */
  async getUserRatingStats(userId) {
    try {
      const userDoc = await MSUserModel.getById(userId);
      console.log("User doc found:", !!userDoc);
      return (
        userDoc?.ratingStats || {
          totalRatings: 0,
          averageRating: 0,
          lastUpdated: null,
        }
      );
    } catch (error) {
      console.error("Error getting user rating stats:", error);
      return {
        totalRatings: 0,
        averageRating: 0,
        lastUpdated: null,
      };
    }
  },

  /**
   * Get rating statistics for a product
   * @param {String} productId - Product ID
   * @returns {Object} Rating statistics
   */
  async getProductRatingStats(productId) {
    try {
      const productDoc = await ProductModel.getById(productId);
      return (
        productDoc?.ratingStats || {
          totalRatings: 0,
          averageRating: 0,
          lastUpdated: null,
        }
      );
    } catch (error) {
      console.error("Error getting product rating stats:", error);
      return {
        totalRatings: 0,
        averageRating: 0,
        lastUpdated: null,
      };
    }
  },
};

module.exports = RatingModel;

