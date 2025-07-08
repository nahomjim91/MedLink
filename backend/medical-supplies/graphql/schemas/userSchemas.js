// Updated MSUser type in /graphql/msSchemas.js
const { gql } = require("apollo-server-express");

const typeDefs = gql`
  scalar Date

  type GeoPoint {
    latitude: Float!
    longitude: Float!
  }

  type Address {
    street: String
    city: String
    state: String
    country: String
    postalCode: String
    geoLocation: GeoPoint
    geoLocationText: String
  }

  # Import RatingStats from rating schema
  type RatingStats {
    totalRatings: Int!
    averageRating: Float!
    lastUpdated: Date
  }

  type MSUser {
    userId: ID!
    email: String!
    role: String
    companyName: String
    contactName: String
    phoneNumber: String
    address: Address
    profileImageUrl: String
    createdAt: Date
    isApproved: Boolean
    rejectionReason: String
    approvedBy: String
    approvedAt: Date
    efdaLicenseUrl: String
    businessLicenseUrl: String
    profileComplete: Boolean
    
    # Rating fields - these will be resolved dynamically
    ratingStats: RatingStats
    recentRatings: [UserRating]
  }

  # Rest of your existing schema...
  type CartBatchItem {
    batchId: ID!
    productId: ID!
    quantity: Float!
    unitPrice: Float!
    addedAt: Date!
    expiryDate: Date
    batchSellerName: String!
    batchSellerId: ID!
  }

  type CartItem {
    productId: ID!
    productName: String!
    productType: String!
    productImage: String
    productCategory: String
    batchItems: [CartBatchItem!]!
    totalQuantity: Float!
    totalPrice: Float!
  }

  type Cart {
    userId: ID!
    items: [CartItem]
    totalItems: Int
    totalPrice: Float
    lastUpdated: Date
  }

  # Input types remain the same...
  input AddSpecificBatchToCartInput {
    productId: ID!
    batchId: ID!
    quantity: Float!
  }

  input AddToCartInput {
    productId: ID!
    quantity: Float!
  }

  input UpdateCartBatchItemInput {
    productId: ID!
    batchId: ID!
    quantity: Float!
  }

  input AddressInput {
    street: String
    city: String
    state: String
    country: String
    postalCode: String
    geoLocation: GeoPointInput
    geoLocationText: String
  }

  input GeoPointInput {
    latitude: Float!
    longitude: Float!
  }

  input MSUserInput {
    email: String
    role: String
    companyName: String
    contactName: String
    phoneNumber: String
    address: AddressInput
    profileImageUrl: String
    efdaLicenseUrl: String
    businessLicenseUrl: String
    profileComplete: Boolean
    rejectionReason: String
  }

  type Query {
    # User queries
    msMe: MSUser
    msUserById(userId: ID!): MSUser
    msUsersByRole(role: String!): [MSUser]
    msUsersByRoleWithRatings(role: String!, limit: Int, offset: Int): [MSUser]
    pendingApprovalUsers(limit: Int, offset: Int): [MSUser]

    # Search queries
    searchMSUsers(query: String!): [MSUser]

    # Cart queries
    myCart: Cart
    cartItemsByProduct(productId: ID!): CartItem
  }

  type Mutation {
    # User mutations
    initializeMSUserProfile(email: String!): MSUser
    updateMSUserProfile(input: MSUserInput!): MSUser
    completeMSRegistration(input: MSUserInput!): MSUser

    # Admin mutations
    approveMSUser(userId: ID!): MSUser
    rejectMSUser(userId: ID!, reason: String!): Boolean

    # Cart mutations
    addToCart(input: AddToCartInput!): Cart!
    addSpecificBatchToCart(input: AddSpecificBatchToCartInput!): Cart!
    updateCartBatchItem(input: UpdateCartBatchItemInput!): Cart!
    removeProductFromCart(productId: ID!): Cart!
    removeBatchFromCart(productId: ID!, batchId: ID!): Cart!
    clearCart: Cart!
  }
`;

module.exports = typeDefs;