// /graphql/ms-schemas.js
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
  }

  type Cart {
    items: [CartItem]
    total: Float
    lastUpdated: Date
  }

  type CartItem {
    productId: ID!
    quantity: Int!
    price: Float!
    productName: String
    productImage: String
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
    approvedBy: String
    approvedAt: Date
    efdaLicenseUrl: String
    businessLicenseUrl: String
    profileComplete: Boolean
    cart: Cart
  }

  input AddressInput {
    street: String
    city: String
    state: String
    country: String
    postalCode: String
    geoLocation: GeoPointInput
  }

  input GeoPointInput {
    latitude: Float!
    longitude: Float!
  }

  input CartItemInput {
    productId: ID!
    quantity: Int!
    price: Float!
    productName: String
    productImage: String
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
  }

  type Query {
    # User queries
    msMe: MSUser
    msUserById(userId: ID!): MSUser
    msUsersByRole(role: String!): [MSUser]
    pendingApprovalUsers(limit: Int, offset: Int): [MSUser]

    # Search queries
    searchMSUsers(query: String!, limit: Int, offset: Int): [MSUser]
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
    addToCart(
      productId: ID!
      quantity: Int!
      price: Float!
      productName: String
      productImage: String
    ): MSUser
    updateCartItem(productId: ID!, quantity: Int!): MSUser
    removeFromCart(productId: ID!): MSUser
    clearCart: MSUser
  }
`;

module.exports = typeDefs;
