
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

