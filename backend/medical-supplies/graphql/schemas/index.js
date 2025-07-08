// File: /graphql/schemas/index.js
const { gql } = require('apollo-server-express');
const fs = require('fs');
const path = require('path');

// Import each schema file
const userSchema = require('./userSchemas');
const productSchema = require('./productSchema');
const orderSchema = require('./orderSchema');
const transactionSchema = require('./transactionSchema');
const ratingSchema = require('./ratingSchema');

// Base schema with common types and queries
const baseSchema = gql`
  type Query {
    _: Boolean
  }
  
  type Mutation {
    _: Boolean
  }
`;

// Combine and export all schemas
module.exports = [baseSchema, userSchema, productSchema, orderSchema, transactionSchema , ratingSchema];
