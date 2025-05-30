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
        // console.log("📋 BatchModel.getById result:", {
        //   found: !!batch,
        //   batchId: batch?.batchId,
        //   productId: batch?.productId,
        //   productType: batch?.productType,
        //   hasProductType: batch?.hasOwnProperty('productType'),
        //   allKeys: batch ? Object.keys(batch) : 'N/A',
        //   fullBatch: batch ? JSON.stringify(batch, null, 2) : 'NULL/UNDEFINED'
        // });

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
      const user = await isAuthenticated(context);

      try {
        const product = await ProductModel.getById(productId);
        if (!product) {
          throw new UserInputError("Product not found.");
        }

        // Check permissions
        if (user.role !== "admin" && product.originalListerId !== user.uid) {
          throw new ForbiddenError(
            "You do not have permission to delete this product."
          );
        }

        const result = await ProductModel.delete(productId);
        console.log("Product deletion result:", result); // Add this log
        return result;
      } catch (error) {
        console.error(
          `Error in deleteProduct resolver for ${productId}:`,
          error
        );

        // Handle specific error types
        if (error.message.includes("exists in one or more orders")) {
          throw new UserInputError(error.message);
        }

        if (
          error instanceof UserInputError ||
          error instanceof ForbiddenError
        ) {
          throw error;
        }

        // For any other errors
        throw new ApolloError(
          `Failed to delete product: ${error.message}`,
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

        // // Check if user is the current owner or admin
        // if (user.role !== "admin" && batch.currentOwnerId !== user.uid) {
        //   throw new ForbiddenError(
        //     "You do not have permission to update this batch."
        //   );
        // }

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

        // // Check if user is the current owner or admin
        // if (user.role !== "admin" && batch.currentOwnerId !== user.uid) {
        //   throw new ForbiddenError(
        //     "You do not have permission to update this batch."
        //   );
        // }

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
      // console.log("=== BATCH.__RESOLVETYPE DEBUG START ===");
      // console.log("🔍 __resolveType called with batch:", {
      //   batchId: batch.batchId,
      //   productType: batch.productType,
      //   hasProductType: batch.hasOwnProperty('productType'),
      //   productTypeType: typeof batch.productType,
      //   allBatchKeys: Object.keys(batch),
      //   fullBatch: JSON.stringify(batch, null, 2)
      // });

      if (batch.productType === "DRUG") {
        console.log("✅ Resolving to DrugBatch");
        return "DrugBatch";
      }
      if (batch.productType === "EQUIPMENT") {
        console.log("✅ Resolving to EquipmentBatch");
        return "EquipmentBatch";
      }

      // console.error("❌ Could not resolve batch type - productType mismatch");
      // console.error("Expected: 'DRUG' or 'EQUIPMENT'");
      // console.error("Received:", batch.productType);
      // console.error("Full batch object:", batch);
      // console.log("=== BATCH.__RESOLVETYPE DEBUG END ===");

      // Instead of returning null, let's try to infer the type or provide a fallback
      if (batch.expiryDate) {
        console.log("🔄 Fallback: Assuming DrugBatch due to expiryDate field");
        return "DrugBatch";
      } else {
        console.log("🔄 Fallback: Assuming EquipmentBatch (no expiryDate)");
        return "EquipmentBatch";
      }
    },

    product: async (parentBatch, _, context) => {
      // console.log("=== BATCH.PRODUCT RESOLVER DEBUG START ===");
      // console.log("Batch.product resolver called with batch:", {
      //   batchId: parentBatch.batchId,
      //   productId: parentBatch.productId,
      //   productType: parentBatch.productType,
      //   fullBatchObject: JSON.stringify(parentBatch, null, 2)
      // });

      await isAuthenticated(context);

      // if (!parentBatch.productId) {
      //   console.error("❌ Missing productId in batch:", parentBatch);
      //   throw new ApolloError(
      //     "Batch has no associated product ID.",
      //     "BATCH_MISSING_PRODUCT_ID"
      //   );
      // }

      try {
        console.log(
          `🔍 Attempting to fetch product with ID: ${parentBatch.productId}`
        );
        const product = await ProductModel.getById(parentBatch.productId);

        // console.log("📋 Product fetch result:", {
        //   found: !!product,
        //   productId: product?.productId,
        //   productType: product?.productType,
        //   fullProduct: product ? JSON.stringify(product, null, 2) : 'NULL/UNDEFINED'
        // });

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
