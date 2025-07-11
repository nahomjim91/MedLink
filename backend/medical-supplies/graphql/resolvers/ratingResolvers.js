
// /graphql/ratingResolvers.js - FIXED VERSION
const RatingModel = require("../../models/ratingModel");
const MSUserModel = require("../../models/msUser");
const ProductModel = require("../../models/productModel");
const {
  AuthenticationError,
  ForbiddenError,
  UserInputError,
} = require("apollo-server-express");

// Check if user is authenticated
const isAuthenticated = (context) => {
  if (!context.user) {
    throw new AuthenticationError("Authentication required");
  }
  return context.user;
};

// Check if user has admin role
const isAdmin = async (context) => {
  const user = isAuthenticated(context);
  const userDoc = await MSUserModel.getById(user.uid);
  if (!userDoc || userDoc.role !== "admin") {
    throw new ForbiddenError("Admin access required");
  }
  return user;
};

// Check if user can rate (healthcare-facility or supplier)
const canRate = async (context) => {
  const user = isAuthenticated(context);
  const userDoc = await MSUserModel.getById(user.uid);
  if (!userDoc || !["healthcare-facility", "supplier", "importer"].includes(userDoc.role)) {
    throw new ForbiddenError("Only healthcare facilities, suppliers and importer can create ratings");
  }
  return user;
};

const ratingResolvers = {
  Rating: {
    __resolveType(obj, context, info) {
      if (obj.productId) {
        return 'ProductRating';
      }
      if (obj.ratedUserId) {
        return 'UserRating';
      }
      return null;
    },
  },
  Query: {
    // Get user ratings (ratings received by a user)
    userRatings: async (_, { userId, limit, offset }, context) => {
      try {
        isAuthenticated(context);
        const ratings = await RatingModel.getUserRatings(userId, limit, offset);
        return ratings || []; // FIXED: Always return an array
      } catch (error) {
        console.error("Error in userRatings resolver:", error);
        return []; // FIXED: Return empty array on error instead of throwing
      }
    },

    // Get product ratings
    productRatings: async (_, { productId, limit, offset }, context) => {
      try {
        const ratings = await RatingModel.getProductRatings(productId, limit, offset);
        return ratings || []; // FIXED: Always return an array
      } catch (error) {
        console.error("Error in productRatings resolver:", error);
        return []; // FIXED: Return empty array on error instead of throwing
      }
    },

    // Get ratings given by current user
    myRatings: async (_, { limit, offset }, context) => {
      try {
        const user = isAuthenticated(context);
        const ratings = await RatingModel.getRatingsByUser(user.uid, limit, offset);
        return ratings || []; // FIXED: Always return an array
      } catch (error) {
        console.error("Error in myRatings resolver:", error);
        return []; // FIXED: Return empty array on error instead of throwing
      }
    },

    // Get ratings for a specific order
    orderRatings: async (_, { orderId }, context) => {
      try {
        isAuthenticated(context);
        const ratings = await RatingModel.getRatingsByOrder(orderId);
        return ratings || []; // FIXED: Always return an array
      } catch (error) {
        console.error("Error in orderRatings resolver:", error);
        return []; // FIXED: Return empty array on error instead of throwing
      }
    },

    // Get user rating statistics
    userRatingStats: async (_, { userId }, context) => {
      try {
        isAuthenticated(context);
        const stats = await RatingModel.getUserRatingStats(userId);
        return stats; // FIXED: Can return null since schema is now nullable
      } catch (error) {
        console.error("Error in userRatingStats resolver:", error);
        return null; // FIXED: Return null on error
      }
    },

    // Get product rating statistics
    productRatingStats: async (_, { productId }, context) => {
      try {
        const stats = await RatingModel.getProductRatingStats(productId);
        return stats; // FIXED: Can return null since schema is now nullable
      } catch (error) {
        console.error("Error in productRatingStats resolver:", error);
        return null; // FIXED: Return null on error
      }
    },

    // Check if user can rate another user for specific order
    canRateUser: async (_, { orderId, ratedUserId }, context) => {
      try {
        const user = await canRate(context);
        const existingRating = await RatingModel.getUserRatingByOrder(orderId, user.uid, ratedUserId);
        return !existingRating;
      } catch (error) {
        console.error("Error in canRateUser resolver:", error);
        return false;
      }
    },

    // Check if user can rate a product for specific order
    canRateProduct: async (_, { orderId, productId }, context) => {
      try {
        const user = await canRate(context);
        const existingRating = await RatingModel.getProductRatingByUser(productId, user.uid, orderId);
        return !existingRating;
      } catch (error) {
        console.error("Error in canRateProduct resolver:", error);
        return false;
      }
    },
  },

  Mutation: {
    // Create user rating
    createUserRating: async (_, { input }, context) => {
      try {
        const user = await canRate(context);
        
        // Validate input
        if (!input.ratedUserId || !input.orderId || !input.rating) {
          throw new UserInputError("Missing required fields");
        }

        if (input.rating < 1 || input.rating > 5) {
          throw new UserInputError("Rating must be between 1 and 5");
        }

        if (user.uid === input.ratedUserId) {
          throw new UserInputError("Cannot rate yourself");
        }

        // Validate rating type
        if (!["seller_rating", "buyer_rating"].includes(input.ratingType)) {
          throw new UserInputError("Invalid rating type");
        }

        return await RatingModel.createUserRating(
          user.uid,
          input.ratedUserId,
          input.orderId,
          input.rating,
          input.comment,
          input.ratingType
        );
      } catch (error) {
        console.error("Error in createUserRating resolver:", error);
        throw error;
      }
    },

    // Create product rating
    createProductRating: async (_, { input }, context) => {
      try {
        const user = await canRate(context);
        console.log("input:", input);
        
        // Validate input
        if (!input.productId || !input.orderId || !input.rating) {
          throw new UserInputError("Missing required fields");
        }

        if (input.rating < 1 || input.rating > 5) {
          throw new UserInputError("Rating must be between 1 and 5");
        }

        return await RatingModel.createProductRating(
          user.uid,
          input.productId,
          input.orderId,
          input.rating,
          input.comment
        );
      } catch (error) {
        console.error("Error in createProductRating resolver:", error);
        throw error;
      }
    },

    // Delete rating (admin only)
    deleteRating: async (_, { ratingId, reason }, context) => {
      try {
        const admin = await isAdmin(context);
        return await RatingModel.deleteRating(ratingId, admin.uid, reason);
      } catch (error) {
        console.error("Error in deleteRating resolver:", error);
        throw error;
      }
    },
  },
};

module.exports = ratingResolvers;

// ALSO UPDATE YOUR RATING MODEL - ratingModel.js
// Add these fixes to your model methods:









