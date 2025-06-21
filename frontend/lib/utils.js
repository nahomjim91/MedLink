// resolvers/productResolvers.js
const { GraphQLScalarType } = require("graphql");
const { Kind } = require("graphql/language");
const {
  UserInputError,
  ApolloError,
  ForbiddenError,
} = require("apollo-server-express");
const ProductModel = require("../../models/productModel");
const BatchModel = require("../../models/batchModel");
const {
  isAuthenticated,
  hasRole,
  isImporterOrSupplier,
} = require("../helpers/authHelpers");

// Custom scalar for Date (similar to your MS User example)
const dateScalar = new GraphQLScalarType({
  name: "Date",
  description: "Date custom scalar type",
  serialize(value) {
    // Debug logging to help identify the issue
    // console.log("Date scalar serializing:", value);

    // Handle case when value is null or undefined
    if (value == null) {
      // console.log("Date value is null/undefined, returning null");
      return null;
    }

    // Handle Firestore timestamp objects
    if (
      value &&
      value._seconds !== undefined &&
      value._nanoseconds !== undefined
    ) {
      // console.log("Converting Firestore timestamp to milliseconds");
      // Convert Firestore timestamp to milliseconds
      return value._seconds * 1000 + Math.floor(value._nanoseconds / 1000000);
    }

    // Handle ServerTimestampTransform objects and empty objects
    if (
      value &&
      ((value.constructor &&
        value.constructor.name === "ServerTimestampTransform") ||
        (typeof value === "object" && Object.keys(value).length === 0))
    ) {
      // console.log("Handling ServerTimestampTransform or empty object, returning current timestamp");
      // Always return current timestamp for server timestamp transforms
      return Date.now();
    }

    if (value instanceof Date) {
      // console.log("Converting Date object to timestamp");
      return value.getTime(); // Convert outgoing Date to integer for JSON
    }

    if (typeof value === "string") {
      // console.log("Converting string date to timestamp");
      return new Date(value).getTime();
    }

    if (typeof value === "number") {
      // console.log("Value is already a number timestamp");
      return value;
    }

    // If we get here, we have an unhandled type
    // console.log("Unhandled value type for serialization:", value);

    // Return current timestamp as fallback
    // console.log("Using current timestamp as fallback");
    return Date.now();
  },
  parseValue(value) {
    return new Date(value); // Convert incoming integer to Date
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.INT) {
      return new Date(parseInt(ast.value, 10)); // Convert hard-coded AST string to integer and then to Date
    }
    return null; // Invalid hard-coded value (not an integer)
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
      const user = await isAuthenticated(context);
      try {
        return ProductModel.searchProducts(searchInput, user.uid);
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
      console.log("=== BATCHBYID QUERY DEBUG START ===");
      console.log(`🔍 Fetching batch with ID: ${batchId}`);

      try {
        const batch = await BatchModel.getById(batchId);


        if (!batch) {
          console.log("❌ Batch not found, returning null");
          return null;
        }

        // Ensure productType is set for __resolveType
        if (!batch.productType && batch.productId) {
          console.log(
            "⚠️ Missing productType, attempting to fetch from product"
          );
          const product = await ProductModel.getById(batch.productId);
          if (product) {
            batch.productType = product.productType;
            console.log("✅ ProductType set from product:", batch.productType);
          } else {
            console.error(
              "❌ Could not fetch product to determine productType"
            );
          }
        }

        console.log("✅ Returning batch with productType:", batch.productType);
        console.log("=== BATCHBYID QUERY DEBUG END ===");
        return batch;
      } catch (error) {
        console.error(
          `❌ Error in batchById resolver for ID ${batchId}:`,
          error
        );
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
  // mutations for creating, updating, and deleting products and batches  
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
        console.log("✅ Resolving to DrugBatch");
        return "DrugBatch";
      }
      if (batch.productType === "EQUIPMENT") {
        console.log("✅ Resolving to EquipmentBatch");
        return "EquipmentBatch";
      }
      if (batch.expiryDate) {
        console.log("🔄 Fallback: Assuming DrugBatch due to expiryDate field");
        return "DrugBatch";
      } else {
        console.log("🔄 Fallback: Assuming EquipmentBatch (no expiryDate)");
        return "EquipmentBatch";
      }
    },

    product: async (parentBatch, _, context) => {
      await isAuthenticated(context);
        try {
        console.log(
          `🔍 Attempting to fetch product with ID: ${parentBatch.productId}`
        );
        const product = await ProductModel.getById(parentBatch.productId);
        if (!product) {
          console.error(
            `❌ Product not found for productId: ${parentBatch.productId}`
          );
          throw new UserInputError(
            `Product with ID ${parentBatch.productId} not found.`,
            {
              code: "PRODUCT_NOT_FOUND",
              productId: parentBatch.productId,
              batchId: parentBatch.batchId,
            }
          );
        }

        console.log("✅ Product successfully fetched");
        console.log("=== BATCH.PRODUCT RESOLVER DEBUG END ===");
        return product;
      } catch (error) {
        console.error("❌ Error in Batch.product resolver:", error);
        if (error instanceof UserInputError) {
          throw error;
        }
        throw new ApolloError(
          `Failed to fetch product for batch.`,
          "PRODUCT_FETCH_ERROR",
          { productId: parentBatch.productId, batchId: parentBatch.batchId }
        );
      }
    },
  },
  // Add explicit type resolvers for implementing types
  DrugProduct: {
    batches: async (parentProduct, args, context) => {
      console.log(
        "DrugProduct.batches resolver called for:",
        parentProduct.productId
      );
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
      console.log(
        "EquipmentProduct.batches resolver called for:",
        parentProduct.productId
      );
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

  DrugBatch: {
    product: async (parentBatch, _, context) => {
      console.log("=== DRUGBATCH.PRODUCT RESOLVER DEBUG START ===");
      console.log(
        "DrugBatch.product resolver called for batch:",
        parentBatch.batchId
      );

      try {
        await isAuthenticated(context);

        if (!parentBatch.productId) {
          console.error("Missing productId in DrugBatch:", parentBatch);
          throw new ApolloError(
            "Batch has no associated product ID.",
            "BATCH_MISSING_PRODUCT_ID"
          );
        }

        const product = await ProductModel.getById(parentBatch.productId);

        if (!product) {
          console.error(
            `Product not found for DrugBatch ${parentBatch.batchId}`
          );
          throw new ApolloError(
            `Product not found for batch ${parentBatch.batchId}`,
            "PRODUCT_NOT_FOUND"
          );
        }

        console.log("✅ Product found for DrugBatch:", product.productId);
        return product;
      } catch (error) {
        console.error("Error in DrugBatch.product resolver:", error);
        throw error; // Re-throw to maintain non-null constraint
      }
    },
  },

  EquipmentBatch: {
    product: async (parentBatch, _, context) => {
      console.log("=== EQUIPMENTBATCH.PRODUCT RESOLVER DEBUG START ===");
      console.log(
        "EquipmentBatch.product resolver called for batch:",
        parentBatch.batchId
      );

      try {
        await isAuthenticated(context);

        if (!parentBatch.productId) {
          console.error("Missing productId in EquipmentBatch:", parentBatch);
          throw new ApolloError(
            "Batch has no associated product ID.",
            "BATCH_MISSING_PRODUCT_ID"
          );
        }

        const product = await ProductModel.getById(parentBatch.productId);

        if (!product) {
          console.error(
            `Product not found for EquipmentBatch ${parentBatch.batchId}`
          );
          throw new ApolloError(
            `Product not found for batch ${parentBatch.batchId}`,
            "PRODUCT_NOT_FOUND"
          );
        }

        console.log("✅ Product found for EquipmentBatch:", product.productId);
        return product;
      } catch (error) {
        console.error("Error in EquipmentBatch.product resolver:", error);
        throw error; // Re-throw to maintain non-null constraint
      }
    },
  },
};

module.exports = productResolvers;
