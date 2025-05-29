// File: /graphql/schemas/index.js
const { gql } = require("apollo-server-express");
const fs = require("fs");
const path = require("path");

// Import each schema file
const userSchema = require("./userSchemas");
const appointmentSchema = require("./appointmentSchema");

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
module.exports = [baseSchema, userSchema, appointmentSchema];
