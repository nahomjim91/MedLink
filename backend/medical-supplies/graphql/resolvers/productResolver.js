// resolvers/productResolvers.js
const { GraphQLScalarType } = require("graphql");
const { Kind } = require("graphql/language");
const { UserInputError, ApolloError } = require('apollo-server-express'); 
const ProductModel = require('../../models/productModel'); 
const BatchModel = require('../../models/batchModel'); 
const { admin } = require('../../../config/firebase');

// Assuming you have auth helpers like isAuthenticated, hasRole from your MSUserModel example
// const { isAuthenticated, hasRole } = require('./authHelpers'); // Create or import these

// Custom scalar for Date (similar to your MS User example)
const dateScalar = new GraphQLScalarType({
  name: "Date",
  description: "Date custom scalar type for Firestore Timestamps",
  serialize(value) { // Value sent to the client
    if (value instanceof admin.firestore.Timestamp) {
      return value.toDate().toISOString(); // Common format: ISO string
    }
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (typeof value === 'string') { // If it's already a string, pass through
        return value;
    }
    if (typeof value === 'number') { // If it's a JS timestamp number
        return new Date(value).toISOString();
    }
    // For values coming from Firestore that might already be toDate().getTime() if not handled carefully
    // This serialize needs to be robust based on how data is passed.
    // Ideally, models pass Firestore Timestamps directly.
    console.warn("Date scalar: Unhandled value type for serialization:", value);
    return null;
  },
  parseValue(value) { // Value from the client (variables)
    try {
      return admin.firestore.Timestamp.fromDate(new Date(value));
    } catch (e) {
      throw new UserInputError('Invalid date format. Please use a valid ISO string or timestamp.', {
        invalidArgs: ['date'],
      });
    }
  },
  parseLiteral(ast) { // Value from the client (inline query)
    if (ast.kind === Kind.STRING || ast.kind === Kind.INT) {
      try {
        return admin.firestore.Timestamp.fromDate(new Date(ast.value));
      } catch (e) {
        throw new UserInputError('Invalid date format. Please use a valid ISO string or timestamp.', {
            invalidArgs: ['date'],
          });
      }
    }
    return null;
  },
});


const productResolvers = {
  Date: dateScalar,

  Product: {
    __resolveType(product, context, info) {
      if (product.productType === 'DRUG') {
        return 'DrugProduct';
      }
      if (product.productType === 'EQUIPMENT') {
        return 'EquipmentProduct';
      }
      console.error("Could not resolve product type:", product);
      return null; // Should not happen if productType is always set
    },
    batches: async (parentProduct, { limit, offset }, context) => {
      // await isAuthenticated(context);
      if (!parentProduct.productId) return [];
      try {
        const batches = await BatchModel.getByProductId(parentProduct.productId, { limit, offset });
        // Add productType to each batch for Batch.__resolveType, if not already done by model
        return batches.map(b => ({ ...b, productType: parentProduct.productType }));
      } catch (error) {
        console.error(`Error fetching batches for product ${parentProduct.productId}:`, error);
        throw new ApolloError("Failed to fetch batches.", "BATCH_FETCH_ERROR");
      }
    }
  },

  Batch: {
    __resolveType(batch, context, info) {
      // batch.productType should be populated by the parent resolver (Product.batches)
      // or fetched in BatchModel if accessed directly (e.g. batchById)
      if (batch.productType === 'DRUG') {
        return 'DrugBatch';
      }
      if (batch.productType === 'EQUIPMENT') {
        return 'EquipmentBatch';
      }
      console.error("Could not resolve batch type:", batch);
      return null;
    },
    product: async (parentBatch, _, context) => {
      // await isAuthenticated(context);
      if (!parentBatch.productId) return null;
      try {
        return ProductModel.getById(parentBatch.productId);
      } catch (error) {
        console.error(`Error fetching product for batch ${parentBatch.batchId}:`, error);
        throw new ApolloError("Failed to fetch product for batch.", "PRODUCT_FETCH_ERROR");
      }
    }
  },

  // Specific field resolvers for DrugProduct, EquipmentProduct, DrugBatch, EquipmentBatch
  // if any fields are not directly on the object or need transformation.
  // Example: if imageList was an array of objects instead of strings
  // DrugProduct: {
  //   imageList: (parent) => parent.imageList || [], // Ensuring it's always an array
  // },

  Query: {
    productById: async (_, { productId }, context) => {
      // await isAuthenticated(context);
      try {
        const product = await ProductModel.getById(productId);
        if (!product) {
          // Return null or throw a NotFoundError, GraphQL spec usually prefers null for not found.
          return null;
        }
        return product;
      } catch (error) {
        console.error(`Error in productById resolver for ID ${productId}:`, error);
        throw new ApolloError("Failed to fetch product.", "PRODUCT_FETCH_ERROR");
      }
    },
    products: async (_, { productType, category, limit, offset, sortBy, sortOrder }, context) => {
      // await isAuthenticated(context);
      try {
        return ProductModel.getAll({ productType, category, limit, offset, sortBy, sortOrder });
      } catch (error) {
        console.error("Error in products resolver:", error);
        throw new ApolloError("Failed to fetch products.", "PRODUCT_LIST_FETCH_ERROR");
      }
    },
    batchById: async (_, { batchId }, context) => {
      // await isAuthenticated(context);
      try {
        const batch = await BatchModel.getById(batchId);
         if (!batch) {
          return null;
        }
        // To help __resolveType, ensure productType is on the batch object
        // The model attempts this, but double-check or ensure consistency.
        if (!batch.productType && batch.productId) {
            const product = await ProductModel.getById(batch.productId);
            if (product) batch.productType = product.productType;
        }
        return batch;
      } catch (error) {
        console.error(`Error in batchById resolver for ID ${batchId}:`, error);
        throw new ApolloError("Failed to fetch batch.", "BATCH_FETCH_ERROR");
      }
    },
    batchesByProductId: async (_, { productId, limit, offset }, context) => {
      // await isAuthenticated(context);
      try {
        const product = await ProductModel.getById(productId);
        if (!product) {
            throw new UserInputError(`Product with ID ${productId} not found.`);
        }
        const batches = await BatchModel.getByProductId(productId, { limit, offset });
        // Add productType to each batch for Batch.__resolveType
        return batches.map(b => ({ ...b, productType: product.productType }));
      } catch (error) {
        console.error(`Error in batchesByProductId resolver for product ID ${productId}:`, error);
        if (error instanceof UserInputError) throw error;
        throw new ApolloError("Failed to fetch batches by product ID.", "BATCH_LIST_FETCH_ERROR");
      }
    },
    allBatches: async (_, { limit, offset, sortBy, sortOrder }, context) => {
        // await isAuthenticated(context);
        try {
            const batches = await BatchModel.getAll({ limit, offset, sortBy, sortOrder });
            // This is tricky for __resolveType without N+1 product lookups.
            // A more optimized BatchModel.getAll might join/denormalize productType or
            // you might need DataLoader if performance becomes an issue here.
            // For now, let's fetch productType for each (can be slow for large lists):
            const enrichedBatches = [];
            for (const batch of batches) {
                if (batch.productId) {
                    const product = await ProductModel.getById(batch.productId);
                    if (product) {
                        enrichedBatches.push({ ...batch, productType: product.productType });
                    } else {
                         enrichedBatches.push(batch); // Product might be deleted
                    }
                } else {
                    enrichedBatches.push(batch);
                }
            }
            return enrichedBatches;
        } catch (error) {
            console.error("Error in allBatches resolver:", error);
            throw new ApolloError("Failed to fetch all batches.", "BATCH_LIST_FETCH_ERROR");
        }
    }
  },

  Mutation: {
    createDrugProduct: async (_, { input }, context) => {
      // const user = await hasRole(context, ['supplier', 'admin']); // Example
      // input.originalListerId = user.uid;
      // input.originalListerName = user.companyName || user.email; // Or however you get this
      try {
        return ProductModel.create({ ...input, productType: 'DRUG' });
      } catch (error) {
        console.error("Error creating drug product:", error);
        if (error.message.includes("Product with ID")) throw new UserInputError(error.message);
        throw new ApolloError("Failed to create drug product.", "PRODUCT_CREATE_ERROR");
      }
    },
    createEquipmentProduct: async (_, { input }, context) => {
      // const user = await hasRole(context, ['supplier', 'admin']);
      // input.originalListerId = user.uid;
      // input.originalListerName = user.companyName || user.email;
      try {
        return ProductModel.create({ ...input, productType: 'EQUIPMENT' });
      } catch (error) {
        console.error("Error creating equipment product:", error);
        throw new ApolloError("Failed to create equipment product.", "PRODUCT_CREATE_ERROR");
      }
    },
    updateDrugProduct: async (_, { productId, input }, context) => {
      // const user = await hasRole(context, ['supplier', 'admin']);
      // Verify ownership or admin role before update if necessary
      try {
        const product = await ProductModel.getById(productId);
        if (!product) throw new UserInputError('Drug product not found.');
        if (product.productType !== 'DRUG') throw new UserInputError('Product is not a drug product.');
        
        return ProductModel.update(productId, input);
      } catch (error) {
        console.error(`Error updating drug product ${productId}:`, error);
        if (error instanceof UserInputError) throw error;
        throw new ApolloError("Failed to update drug product.", "PRODUCT_UPDATE_ERROR");
      }
    },
    updateEquipmentProduct: async (_, { productId, input }, context) => {
      // const user = await hasRole(context, ['supplier', 'admin']);
      try {
        const product = await ProductModel.getById(productId);
        if (!product) throw new UserInputError('Equipment product not found.');
        if (product.productType !== 'EQUIPMENT') throw new UserInputError('Product is not an equipment product.');

        return ProductModel.update(productId, input);
      } catch (error) {
        console.error(`Error updating equipment product ${productId}:`, error);
        if (error instanceof UserInputError) throw error;
        throw new ApolloError("Failed to update equipment product.", "PRODUCT_UPDATE_ERROR");
      }
    },
    deleteProduct: async (_, { productId }, context) => {
      // const user = await hasRole(context, ['admin']); // Or owner
      try {
        return ProductModel.delete(productId); // This is a soft delete
      } catch (error) {
        console.error(`Error deleting product ${productId}:`, error);
        throw new ApolloError("Failed to delete product.", "PRODUCT_DELETE_ERROR");
      }
    },

    createDrugBatch: async (_, { input }, context) => {
      // const user = await hasRole(context, ['supplier', 'admin']);
      // input.currentOwnerId = user.uid;
      // input.currentOwnerName = user.companyName || user.email;
      try {
        // The model now handles product type verification
        return BatchModel.create(input, 'DRUG');
      } catch (error) {
        console.error("Error creating drug batch:", error);
        if (error.message.includes("Product with ID") || error.message.includes("Invalid expiryDate")) {
            throw new UserInputError(error.message);
        }
        throw new ApolloError("Failed to create drug batch.", "BATCH_CREATE_ERROR");
      }
    },
    createEquipmentBatch: async (_, { input }, context) => {
      // const user = await hasRole(context, ['supplier', 'admin']);
      // input.currentOwnerId = user.uid;
      // input.currentOwnerName = user.companyName || user.email;
      try {
        return BatchModel.create(input, 'EQUIPMENT');
      } catch (error) {
        console.error("Error creating equipment batch:", error);
         if (error.message.includes("Product with ID")) {
            throw new UserInputError(error.message);
        }
        throw new ApolloError("Failed to create equipment batch.", "BATCH_CREATE_ERROR");
      }
    },
    updateDrugBatch: async (_, { batchId, input }, context) => {
      // const user = await hasRole(context, ['supplier', 'admin']);
      try {
        const batch = await BatchModel.getById(batchId);
        if (!batch) throw new UserInputError('Drug batch not found.');
        // Verify product type (fetched in batch.productType or re-fetch product)
        const product = await ProductModel.getById(batch.productId);
        if (!product || product.productType !== 'DRUG') {
            throw new UserInputError('Batch does not belong to a drug product.');
        }
        return BatchModel.update(batchId, input);
      } catch (error) {
        console.error(`Error updating drug batch ${batchId}:`, error);
        if (error instanceof UserInputError || error.message.includes("Invalid expiryDate")) throw error;
        throw new ApolloError("Failed to update drug batch.", "BATCH_UPDATE_ERROR");
      }
    },
    updateEquipmentBatch: async (_, { batchId, input }, context) => {
      // const user = await hasRole(context, ['supplier', 'admin']);
      try {
        const batch = await BatchModel.getById(batchId);
        if (!batch) throw new UserInputError('Equipment batch not found.');
        const product = await ProductModel.getById(batch.productId);
        if (!product || product.productType !== 'EQUIPMENT') {
            throw new UserInputError('Batch does not belong to an equipment product.');
        }
        return BatchModel.update(batchId, input);
      } catch (error) {
        console.error(`Error updating equipment batch ${batchId}:`, error);
        if (error instanceof UserInputError) throw error;
        throw new ApolloError("Failed to update equipment batch.", "BATCH_UPDATE_ERROR");
      }
    },
    deleteBatch: async (_, { batchId }, context) => {
      // const user = await hasRole(context, ['admin']); // Or owner
      try {
        return BatchModel.delete(batchId);
      } catch (error) {
        console.error(`Error deleting batch ${batchId}:`, error);
        throw new ApolloError("Failed to delete batch.", "BATCH_DELETE_ERROR");
      }
    }
  },
};

module.exports = productResolvers;
