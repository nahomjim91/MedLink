// resolvers/productResolvers.js
const { GraphQLScalarType } = require("graphql");
const { Kind } = require("graphql/language");
const { UserInputError, ApolloError } = require("apollo-server-express");
const ProductModel = require("../../models/productModel");
const BatchModel = require("../../models/batchModel");
const { admin } = require("../../../config/firebase");
const {
  isAuthenticated,
  hasRole,
  isImporterOrSupplier,
} = require("../helpers/authHelpers");

// Custom scalar for Date (similar to your MS User example)
const dateScalar = new GraphQLScalarType({
  name: "Date",
  description: "Date custom scalar type for Firestore Timestamps",
  serialize(value) {
    // Value sent to the client
    if (value instanceof admin.firestore.Timestamp) {
      return value.toDate().toISOString(); // Common format: ISO string
    }
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (typeof value === "string") {
      // If it's already a string, pass through
      return value;
    }
    if (typeof value === "number") {
      // If it's a JS timestamp number
      return new Date(value).toISOString();
    }
    console.warn("Date scalar: Unhandled value type for serialization:", value);
    return null;
  },
  parseValue(value) {
    // Value from the client (variables)
    try {
      return admin.firestore.Timestamp.fromDate(new Date(value));
    } catch (e) {
      throw new UserInputError(
        "Invalid date format. Please use a valid ISO string or timestamp.",
        {
          invalidArgs: ["date"],
        }
      );
    }
  },
  parseLiteral(ast) {
    // Value from the client (inline query)
    if (ast.kind === Kind.STRING || ast.kind === Kind.INT) {
      try {
        return admin.firestore.Timestamp.fromDate(new Date(ast.value));
      } catch (e) {
        throw new UserInputError(
          "Invalid date format. Please use a valid ISO string or timestamp.",
          {
            invalidArgs: ["date"],
          }
        );
      }
    }
    return null;
  },
});

const productResolvers = {
  Date: dateScalar,



  Query: {
    productById: async (_, { productId }, context) => {
      await isAuthenticated(context);
      try {
        const product = await ProductModel.getById(productId);
        if (!product) {
          // Return null or throw a NotFoundError, GraphQL spec usually prefers null for not found.
          return null;
        }
        return product;
      } catch (error) {
        console.error(
          `Error in productById resolver for ID ${productId}:`,
          error
        );
        throw new ApolloError(
          "Failed to fetch product.",
          "PRODUCT_FETCH_ERROR"
        );
      }
    },
    products: async (
      _,
      { productType, category, limit, offset, sortBy, sortOrder },
      context
    ) => {
      await isAuthenticated(context);
      try {
        return ProductModel.getAll({
          productType,
          category,
          limit,
          offset,
          sortBy,
          sortOrder,
        });
      } catch (error) {
        console.error("Error in products resolver:", error);
        throw new ApolloError(
          "Failed to fetch products.",
          "PRODUCT_LIST_FETCH_ERROR"
        );
      }
    },
    myProducts: async (
      _,
      { productType, category, limit, offset, sortBy, sortOrder },
      context
    ) => {
      await isAuthenticated(context);
      try {
        // Log parameters for debugging
        console.log("myProducts resolver params:", {
          productType,
          category,
          userId: context.user.uid,
        });

        return ProductModel.getMyProductAll({
          productType,
          category,
          limit,
          offset,
          sortBy,
          sortOrder,
          userId: context.user.uid,
        });
      } catch (error) {
        console.error("Error in myProducts resolver:", error);
        throw new ApolloError(
          "Failed to fetch user products.",
          "USER_PRODUCT_FETCH_ERROR"
        );
      }
    },
    searchProducts: async (_, { searchInput }, context) => {
      await isAuthenticated(context);
      try {
        return ProductModel.searchProducts(searchInput);
      } catch (error) {
        console.error("Error in searchProducts resolver:", error);
        throw new ApolloError(
          "Failed to search products.",
          "PRODUCT_SEARCH_ERROR"
        );
      }
    },
    batchById: async (_, { batchId }, context) => {
      await isAuthenticated(context);
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
      await isAuthenticated(context);
      try {
        const product = await ProductModel.getById(productId);
        if (!product) {
          throw new UserInputError(`Product with ID ${productId} not found.`);
        }
        const batches = await BatchModel.getByProductId(productId, {
          limit,
          offset,
        });
        // Add productType to each batch for Batch.__resolveType
        return batches.map((b) => ({ ...b, productType: product.productType }));
      } catch (error) {
        console.error(
          `Error in batchesByProductId resolver for product ID ${productId}:`,
          error
        );
        if (error instanceof UserInputError) throw error;
        throw new ApolloError(
          "Failed to fetch batches by product ID.",
          "BATCH_LIST_FETCH_ERROR"
        );
      }
    },
    allBatches: async (_, { limit, offset, sortBy, sortOrder }, context) => {
      await isAuthenticated(context);
      try {
        const batches = await BatchModel.getAll({
          limit,
          offset,
          sortBy,
          sortOrder,
        });
     
        const enrichedBatches = [];
        for (const batch of batches) {
          if (batch.productId) {
            const product = await ProductModel.getById(batch.productId);
            if (product) {
              enrichedBatches.push({
                ...batch,
                productType: product.productType,
              });
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
        throw new ApolloError(
          "Failed to fetch all batches.",
          "BATCH_LIST_FETCH_ERROR"
        );
      }
    },
  },

  Mutation: {
    createDrugProduct: async (_, { input }, context) => {
      // Ensure user is either importer, supplier or admin
      const user = await isImporterOrSupplier(context);
      // Set the original lister info from authenticated user
      input.originalListerId = user.uid;
      input.originalListerName =
        user.companyName || user.displayName || user.email;

      // IMPORTANT: Also set the ownerId and ownerName fields
      input.ownerId = user.uid;
      input.ownerName = user.companyName || user.displayName || user.email;

      try {
        return ProductModel.create({ ...input, productType: "DRUG" });
      } catch (error) {
        console.error("Error creating drug product:", error);
        if (error.message.includes("Product with ID"))
          throw new UserInputError(error.message);
        throw new ApolloError(
          "Failed to create drug product.",
          "PRODUCT_CREATE_ERROR"
        );
      }
    },
    createEquipmentProduct: async (_, { input }, context) => {
      // Ensure user is either importer, supplier or admin
      const user = await isImporterOrSupplier(context);

      // Set the original lister info from authenticated user
      input.originalListerId = user.uid;
      input.originalListerName =
        user.companyName || user.displayName || user.email;

      // IMPORTANT: Also set the ownerId and ownerName fields
      input.ownerId = user.uid;
      input.ownerName = user.companyName || user.displayName || user.email;

      try {
        return ProductModel.create({ ...input, productType: "EQUIPMENT" });
      } catch (error) {
        console.error("Error creating equipment product:", error);
        if (error.message.includes("Product with ID"))
          throw new UserInputError(error.message);
        throw new ApolloError(
          "Failed to create equipment product.",
          "PRODUCT_CREATE_ERROR"
        );
      }
    },
    updateDrugProduct: async (_, { productId, input }, context) => {
      // First check if user is authenticated
      const user = await isAuthenticated(context);

      try {
        const product = await ProductModel.getById(productId);
        if (!product) throw new UserInputError("Drug product not found.");
        if (product.productType !== "DRUG")
          throw new UserInputError("Product is not a drug product.");

        // Check if user is the original lister or admin
        if (user.role !== "admin" && product.originalListerId !== user.uid) {
          throw new ForbiddenError(
            "You do not have permission to update this product."
          );
        }

        return ProductModel.update(productId, input);
      } catch (error) {
        console.error(`Error updating drug product ${productId}:`, error);
        if (error instanceof UserInputError || error instanceof ForbiddenError)
          throw error;
        throw new ApolloError(
          "Failed to update drug product.",
          "PRODUCT_UPDATE_ERROR"
        );
      }
    },
    updateEquipmentProduct: async (_, { productId, input }, context) => {
      // First check if user is authenticated
      const user = await isAuthenticated(context);

      try {
        const product = await ProductModel.getById(productId);
        if (!product) throw new UserInputError("Equipment product not found.");
        if (product.productType !== "EQUIPMENT")
          throw new UserInputError("Product is not an equipment product.");

        // Check if user is the original lister or admin
        if (user.role !== "admin" && product.originalListerId !== user.uid) {
          throw new ForbiddenError(
            "You do not have permission to update this product."
          );
        }

        return ProductModel.update(productId, input);
      } catch (error) {
        console.error(`Error updating equipment product ${productId}:`, error);
        if (error instanceof UserInputError || error instanceof ForbiddenError)
          throw error;
        throw new ApolloError(
          "Failed to update equipment product.",
          "PRODUCT_UPDATE_ERROR"
        );
      }
    },
    deleteProduct: async (_, { productId }, context) => {
      // First check if user is authenticated
      const user = await isAuthenticated(context);

      try {
        const product = await ProductModel.getById(productId);
        if (!product) throw new UserInputError("Product not found.");

        // Check if user is the original lister or admin
        if (user.role !== "admin" && product.originalListerId !== user.uid) {
          throw new ForbiddenError(
            "You do not have permission to delete this product."
          );
        }

        return ProductModel.delete(productId); // This is a soft delete
      } catch (error) {
        console.error(`Error deleting product ${productId}:`, error);
        if (error instanceof UserInputError || error instanceof ForbiddenError)
          throw error;
        throw new ApolloError(
          "Failed to delete product.",
          "PRODUCT_DELETE_ERROR"
        );
      }
    },

    createDrugBatch: async (_, { input }, context) => {
      // Ensure user is authenticated
      const user = await isAuthenticated(context);

      try {
        // First verify the product exists and user has permission to add batches to it
        const product = await ProductModel.getById(input.productId);
        if (!product)
          throw new UserInputError(
            `Product with ID ${input.productId} not found.`
          );

        // Check if user is the original lister or admin
        if (user.role !== "admin" && product.originalListerId !== user.uid) {
          throw new ForbiddenError(
            "You do not have permission to add batches to this product."
          );
        }

        // Set currentOwner to the authenticated user
        input.currentOwnerId = user.uid;
        input.currentOwnerName =
          user.companyName || user.displayName || user.email;

        // The model now handles product type verification
        return BatchModel.create(input, "DRUG");
      } catch (error) {
        console.error("Error creating drug batch:", error);
        if (
          error instanceof UserInputError ||
          error instanceof ForbiddenError ||
          error.message.includes("Product with ID") ||
          error.message.includes("Invalid expiryDate")
        ) {
          throw error;
        }
        throw new ApolloError(
          "Failed to create drug batch.",
          "BATCH_CREATE_ERROR"
        );
      }
    },

    createEquipmentBatch: async (_, { input }, context) => {
      // Ensure user is authenticated
      const user = await isAuthenticated(context);

      try {
        // First verify the product exists and user has permission to add batches to it
        const product = await ProductModel.getById(input.productId);
        if (!product)
          throw new UserInputError(
            `Product with ID ${input.productId} not found.`
          );
        if (product.productType !== "EQUIPMENT")
          throw new UserInputError("Product is not an equipment product.");

        // Check if user is the original lister or admin
        if (user.role !== "admin" && product.originalListerId !== user.uid) {
          throw new ForbiddenError(
            "You do not have permission to add batches to this product."
          );
        }

        // Set currentOwner to the authenticated user
        input.currentOwnerId = user.uid;
        input.currentOwnerName =
          user.companyName || user.displayName || user.email;

        const batch = await BatchModel.create(input, "EQUIPMENT");

        // Make sure we attach the productType needed for __resolveType
        batch.productType = "EQUIPMENT";

        return batch;
      } catch (error) {
        console.error("Error creating equipment batch:", error);
        if (
          error instanceof UserInputError ||
          error instanceof ForbiddenError ||
          error.message.includes("Product with ID")
        ) {
          throw error;
        }
        throw new ApolloError(
          "Failed to create equipment batch.",
          "BATCH_CREATE_ERROR"
        );
      }
    },
    updateDrugBatch: async (_, { batchId, input }, context) => {
      // Ensure user is authenticated
      const user = await isAuthenticated(context);

      try {
        const batch = await BatchModel.getById(batchId);
        if (!batch) throw new UserInputError("Drug batch not found.");

        // Check if user is the current owner or admin
        if (user.role !== "admin" && batch.currentOwnerId !== user.uid) {
          throw new ForbiddenError(
            "You do not have permission to update this batch."
          );
        }

        // Verify product type
        const product = await ProductModel.getById(batch.productId);
        if (!product || product.productType !== "DRUG") {
          throw new UserInputError("Batch does not belong to a drug product.");
        }

        return BatchModel.update(batchId, input);
      } catch (error) {
        console.error(`Error updating drug batch ${batchId}:`, error);
        if (
          error instanceof UserInputError ||
          error instanceof ForbiddenError ||
          error.message.includes("Invalid expiryDate")
        ) {
          throw error;
        }
        throw new ApolloError(
          "Failed to update drug batch.",
          "BATCH_UPDATE_ERROR"
        );
      }
    },
    updateEquipmentBatch: async (_, { batchId, input }, context) => {
      // Ensure user is authenticated
      const user = await isAuthenticated(context);

      try {
        const batch = await BatchModel.getById(batchId);
        if (!batch) throw new UserInputError("Equipment batch not found.");

        // Check if user is the current owner or admin
        if (user.role !== "admin" && batch.currentOwnerId !== user.uid) {
          throw new ForbiddenError(
            "You do not have permission to update this batch."
          );
        }

        const product = await ProductModel.getById(batch.productId);
        if (!product || product.productType !== "EQUIPMENT") {
          throw new UserInputError(
            "Batch does not belong to an equipment product."
          );
        }

        return BatchModel.update(batchId, input);
      } catch (error) {
        console.error(`Error updating equipment batch ${batchId}:`, error);
        if (error instanceof UserInputError || error instanceof ForbiddenError)
          throw error;
        throw new ApolloError(
          "Failed to update equipment batch.",
          "BATCH_UPDATE_ERROR"
        );
      }
    },
    deleteBatch: async (_, { batchId }, context) => {
      // Ensure user is authenticated
      const user = await isAuthenticated(context);

      try {
        const batch = await BatchModel.getById(batchId);
        if (!batch) throw new UserInputError("Batch not found.");

        // Check if user is the current owner or admin
        if (user.role !== "admin" && batch.currentOwnerId !== user.uid) {
          throw new ForbiddenError(
            "You do not have permission to delete this batch."
          );
        }

        return BatchModel.delete(batchId);
      } catch (error) {
        console.error(`Error deleting batch ${batchId}:`, error);
        if (error instanceof UserInputError || error instanceof ForbiddenError)
          throw error;
        throw new ApolloError("Failed to delete batch.", "BATCH_DELETE_ERROR");
      }
    },
  },

  Product: {
    __resolveType(product, context, info) {
      if (product.productType === "DRUG") {
        return "DrugProduct";
      }
      if (product.productType === "EQUIPMENT") {
        return "EquipmentProduct";
      }
      console.error("Could not resolve product type:", product);
      return null; // Should not happen if productType is always set
    },
    batches: async (parentProduct, { limit, offset }, context) => {
      console.log(
        "BATCHES RESOLVER CALLED for product:",
        parentProduct.productId
      );

      try {
        // Check if context and context.user exist before authentication
        console.log(
          "Context in batches resolver:",
          context ? "exists" : "missing"
        );
        console.log(
          "User in context:",
          context && context.user ? "exists" : "missing"
        );

        try {
          await isAuthenticated(context);
          console.log("Authentication passed for batches resolver");
        } catch (authError) {
          console.error(
            "Authentication failed in batches resolver:",
            authError
          );
          return []; // Return empty array on auth failure
        }

        if (!parentProduct.productId) {
          console.warn("Missing productId in product:", parentProduct);
          return []; // Return empty array, not null
        }

        console.log("Fetching batches for product:", parentProduct.productId);

        // Add try-catch to prevent errors from bubbling up
        try {
          console.log("Calling BatchModel.getByProductId with:", {
            productId: parentProduct.productId,
            limit,
            offset,
          });

          const batches = await BatchModel.getByProductId(
            parentProduct.productId,
            { limit, offset }
          );

          console.log(
            `Retrieved ${batches.length} batches for product ${parentProduct.productId}`
          );

          // Always return an array (even empty), never null
          return batches.map((b) => {
            console.log("Processing batch:", b.batchId);
            return {
              ...b,
              productType: b.productType || parentProduct.productType,
            };
          });
        } catch (error) {
          console.error(
            `Error fetching batches for product ${parentProduct.productId}:`,
            error
          );
          // Return empty array on error, never null
          return [];
        }
      } catch (error) {
        console.error("Unexpected error in batches resolver:", error);
        // Even for unexpected errors, return empty array, never null
        return [];
      }
    },
  },

  Batch: {
    __resolveType(batch, context, info) {
      if (batch.productType === "DRUG") {
        return "DrugBatch";
      }
      if (batch.productType === "EQUIPMENT") {
        return "EquipmentBatch";
      }
      console.error("Could not resolve batch type:", batch);
      return null;
    },
    product: async (parentBatch, _, context) => {
      await isAuthenticated(context);
      if (!parentBatch.productId) {
        console.error("Missing productId in batch:", parentBatch);
        throw new ApolloError(
          "Batch has no associated product ID.",
          "BATCH_MISSING_PRODUCT_ID"
        );
      }

      try {
        const product = await ProductModel.getById(parentBatch.productId);
        if (!product) {
          console.error(
            `Product not found for batch ${parentBatch.batchId} with productId ${parentBatch.productId}`
          );
          throw new ApolloError(
            "Product not found for batch.",
            "PRODUCT_NOT_FOUND"
          );
        }
        return product;
      } catch (error) {
        console.error(
          `Error fetching product for batch ${parentBatch.batchId}:`,
          error
        );
        throw new ApolloError(
          "Failed to fetch product for batch.",
          "PRODUCT_FETCH_ERROR"
        );
      }
    },
  },
   // Add explicit type resolvers for implementing types
  DrugProduct: {
    batches: async (parentProduct, args, context) => {
      console.log("DrugProduct.batches resolver called for:", parentProduct.productId);
      // Use the same logic as Product.batches
      try {
        await isAuthenticated(context);
        
        if (!parentProduct.productId) {
          console.warn("Missing productId in DrugProduct:", parentProduct);
          return []; 
        }
        
        // Get batches logic
        const batches = await BatchModel.getByProductId(
          parentProduct.productId,
          args
        );
        
        return batches.map((b) => ({
          ...b,
          productType: b.productType || "DRUG",
        }));
      } catch (error) {
        console.error("Error in DrugProduct.batches resolver:", error);
        return [];
      }
    },
  },

  EquipmentProduct: {
    batches: async (parentProduct, args, context) => {
      console.log("EquipmentProduct.batches resolver called for:", parentProduct.productId);
      // Use the same logic as Product.batches
      try {
        await isAuthenticated(context);
        
        if (!parentProduct.productId) {
          console.warn("Missing productId in EquipmentProduct:", parentProduct);
          return []; 
        }
        
        // Get batches logic
        const batches = await BatchModel.getByProductId(
          parentProduct.productId,
          args
        );
        
        return batches.map((b) => ({
          ...b,
          productType: b.productType || "EQUIPMENT",
        }));
      } catch (error) {
        console.error("Error in EquipmentProduct.batches resolver:", error);
        return [];
      }
    },
  },
};

module.exports = productResolvers;
