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
   * Get user ratings (ratings received by a user)
   * @param {String} userId - User ID
   * @param {Number} limit - Number of ratings to return
   * @param {Number} offset - Offset for pagination
   * @returns {Array} Array of ratings
   */
  async getUserRatings(userId, limit, offset) {
    try {
      const { limit: limitVal, offset: offsetVal } = paginationParams(limit, offset);

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
      console.log(formatDocs(snapshot.docs))
      return formatDocs(snapshot.docs);
    } catch (error) {
      console.error("Error getting user ratings:", error);
      throw error;
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
      const { limit: limitVal, offset: offsetVal } = paginationParams(limit, offset);

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
      return formatDocs(snapshot.docs);
    } catch (error) {
      console.error("Error getting product ratings:", error);
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
      const { limit: limitVal, offset: offsetVal } = paginationParams(limit, offset);

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
   * Get rating statistics for a user
   * @param {String} userId - User ID
   * @returns {Object} Rating statistics
   */
  async getUserRatingStats(userId) {
    try {
      
      const userDoc = await MSUserModel.getById(userId);
      return userDoc?.ratingStats || {
        totalRatings: 0,
        averageRating: 0,
        lastUpdated: null,
      };
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
      return productDoc?.ratingStats || {
        totalRatings: 0,
        averageRating: 0,
        lastUpdated: null,
      };
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

// /graphql/ratingResolvers.js
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
  if (!userDoc || !["healthcare-facility", "supplier" , "importer"].includes(userDoc.role)) {
    throw new ForbiddenError("Only healthcare facilities , suppliers  and importer can create ratings");
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
        return await RatingModel.getUserRatings(userId, limit, offset);
      } catch (error) {
        console.error("Error in userRatings resolver:", error);
        throw error;
      }
    },

    // Get product ratings
    productRatings: async (_, { productId, limit, offset }, context) => {
      try {
        return await RatingModel.getProductRatings(productId, limit, offset);
      } catch (error) {
        console.error("Error in productRatings resolver:", error);
        throw error;
      }
    },

    // Get ratings given by current user
    myRatings: async (_, { limit, offset }, context) => {
      try {
        const user = isAuthenticated(context);
        return await RatingModel.getRatingsByUser(user.uid, limit, offset);
      } catch (error) {
        console.error("Error in myRatings resolver:", error);
        throw error;
      }
    },

    // Get ratings for a specific order
    orderRatings: async (_, { orderId }, context) => {
      try {
        isAuthenticated(context);
        return await RatingModel.getRatingsByOrder(orderId);
      } catch (error) {
        console.error("Error in orderRatings resolver:", error);
        throw error;
      }
    },

    // Get user rating statistics
    userRatingStats: async (_, { userId }, context) => {
      try {
        isAuthenticated(context);
        return await RatingModel.getUserRatingStats(userId);
      } catch (error) {
        console.error("Error in userRatingStats resolver:", error);
        throw error;
      }
    },

    // Get product rating statistics
    productRatingStats: async (_, { productId }, context) => {
      try {
        return await RatingModel.getProductRatingStats(productId);
      } catch (error) {
        console.error("Error in productRatingStats resolver:", error);
        throw error;
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
  
  },
};

module.exports = ratingResolvers;


// /graphql/ratingSchema.js
const { gql } = require("apollo-server-express");

const ratingTypeDefs = gql`
  enum RatingType {
    seller_rating
    buyer_rating
  }

  type RatingStats {
    totalRatings: Int!
    averageRating: Float!
    lastUpdated: Date
  }

  type UserRating {
    id: ID!
    raterId: ID!
    raterName: String!
    raterCompanyName: String
    ratedUserId: ID!
    ratedUserName: String!
    ratedUserCompanyName: String
    orderId: ID!
    rating: Int!
    comment: String
    ratingType: RatingType!
    type: String!
    createdAt: Date!
    updatedAt: Date!
  }

  type ProductRating {
    id: ID!
    userId: ID!
    userName: String!
    userCompanyName: String
    productId: ID!
    productName: String!
    productSellerId: ID
    orderId: ID!
    rating: Int!
    comment: String
    type: String!
    createdAt: Date!
    updatedAt: Date!
  }

  union Rating = UserRating | ProductRating

  input CreateUserRatingInput {
    ratedUserId: ID!
    orderId: ID!
    rating: Int!
    comment: String
    ratingType: RatingType!
  }

  input CreateProductRatingInput {
    productId: ID!
    orderId: ID!
    rating: Int!
    comment: String
  }

  extend type Query {
    # Get user ratings (ratings received by a user)
    userRatings(userId: ID!, limit: Int, offset: Int): [UserRating!]!
    
    # Get product ratings
    productRatings(productId: ID!, limit: Int, offset: Int): [ProductRating!]!
    
    # Get ratings given by current user
    myRatings(limit: Int, offset: Int): [Rating!]!
    
    # Get ratings for a specific order
    orderRatings(orderId: ID!): [Rating!]!
    
    # Get user rating statistics
    userRatingStats(userId: ID!): RatingStats!
    
    # Get product rating statistics
    productRatingStats(productId: ID!): RatingStats!
    
    # Check if user can rate another user for specific order
    canRateUser(orderId: ID!, ratedUserId: ID!): Boolean!
    
    # Check if user can rate a product for specific order
    canRateProduct(orderId: ID!, productId: ID!): Boolean!
  }

  extend type Mutation {
    # Create user rating
    createUserRating(input: CreateUserRatingInput!): UserRating!
    
    # Create product rating
    createProductRating(input: CreateProductRatingInput!): ProductRating!
    
    # Delete rating (admin only)
    deleteRating(ratingId: ID!, reason: String!): Boolean!
  }
`;

module.exports = ratingTypeDefs;

