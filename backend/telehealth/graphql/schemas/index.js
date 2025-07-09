// File: /graphql/schemas/index.js
const { gql } = require('apollo-server-express');

// Import each schema file
const thUser = require('./schemas');
const appointmentSchema = require('./appointmentSchema');
const transactionSchema = require('./transactionSchema');
const prescriptionSchema = require('./prescriptionSchema');

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
module.exports = [baseSchema, thUser, appointmentSchema, transactionSchema , prescriptionSchema];
