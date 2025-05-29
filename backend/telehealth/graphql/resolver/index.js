// File: /graphql/resolvers/index.js
const userResolvers = require("./userResolvers");
const appointmentResolvers = require("./appointmentResolver");

// Merge resolvers
const resolvers = {
  Query: {
    ...userResolvers.Query,
    ...appointmentResolvers.Query,
  },
  Mutation: {
    ...userResolvers.Mutation,
    ...appointmentResolvers.Mutation,
  },
  // Custom scalars
  //Date: productResolvers.Date, // Ensure Date scalar is included only once

  // Merge any additional resolver types
  ...(userResolvers.User && { User: userResolvers.User }),
};

module.exports = resolvers;
