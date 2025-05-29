// File: /graphql/resolvers/index.js
const userResolvers = require('./userResolver');
const productResolvers = require('./productResolver'); 
const orderResolvers = require('./orderResolver'); // Import order resolvers
const chatResolvers = require('./chatResolver'); // Import chat resolvers

// Merge resolvers
const resolvers = {
  Query: {
    ...userResolvers.Query,
    ...productResolvers.Query,
    ...orderResolvers.Query,
    ...chatResolvers.Query
  },
  Mutation: {
    ...userResolvers.Mutation,
    ...productResolvers.Mutation,
    ...orderResolvers.Mutation,
    ...chatResolvers.Mutation
  },
  // Custom scalars
  Date: productResolvers.Date, // Ensure Date scalar is included only once
  
  // Merge any additional resolver types
  ...(userResolvers.User && { User: userResolvers.User }),
  ...(productResolvers.Product && { Product: productResolvers.Product }),
  ...(productResolvers?.Batch && { Batch: productResolvers.Batch }),
  ...(productResolvers?.DrugProduct && { DrugProduct: productResolvers.DrugProduct }),
  ...(productResolvers?.EquipmentProduct && { EquipmentProduct: productResolvers.EquipmentProduct }),
  ...(productResolvers?.DrugBatch && { DrugBatch: productResolvers.DrugBatch }),
  ...(productResolvers?.EquipmentBatch && { EquipmentBatch: productResolvers.EquipmentBatch }),
  ...(userResolvers.GeoPoint && { GeoPoint: userResolvers.GeoPoint }),
};

module.exports = resolvers;