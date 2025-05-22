// models/ProductModel.js
const { db } = require("../../config/firebase");
const {
  formatDoc,
  formatDocs,
  sanitizeInput,
  timestamp,
  paginationParams,
} = require("../../utils/helpers");

const productsRef = db.collection("products");
const batchesRef = db.collection("batches");

const ProductModel = {
  async getById(productId) {
    try {
      const doc = await productsRef.doc(productId).get();
      return formatDoc(doc);
    } catch (error) {
      console.error("Error getting product by ID:", error);
      throw error;
    }
  },

  async getAll({
    productType,
    category,
    limit,
    offset,
    sortBy = "createdAt",
    sortOrder = "desc",
  }) {
    try {
      const { limit: limitVal, offset: offsetVal } = paginationParams(
        limit,
        offset
      );
      let query = productsRef;

      if (productType) {
        query = query.where("productType", "==", productType);
      }
      if (category) {
        query = query.where("category", "==", category);
      }
      // Note: Firestore requires an index for compound queries with range/inequality and orderBy on different fields.
      // Simple orderBy on one field is generally fine.
      query = query.orderBy(sortBy, sortOrder);

      if (offsetVal > 0) {
        const offsetSnapshot = await query.limit(offsetVal).get();
        if (!offsetSnapshot.empty) {
          const lastVisible =
            offsetSnapshot.docs[offsetSnapshot.docs.length - 1];
          query = query.startAfter(lastVisible);
        }
      }

      const snapshot = await query.limit(limitVal).get();
      return formatDocs(snapshot.docs);
    } catch (error) {
      console.error("Error getting all products:", error);
      throw error;
    }
  },

  async getMyProductAll({
    productType,
    category,
    limit,
    offset,
    sortBy = "createdAt",
    sortOrder = "desc",
    userId,
  }) {
    try {
      const { limit: limitVal, offset: offsetVal } = paginationParams(
        limit,
        offset
      );
      let query = productsRef;
      console.log(
        "userId",
        userId,
        "productType",
        productType,
        "category",
        category
      );

      // Build query with filters
      if (userId) {
        query = query.where("ownerId", "==", userId);
      }

      // Only add productType filter if it's provided and not empty
      if (productType && productType.trim() !== "") {
        query = query.where("productType", "==", productType);
      }

      // Only add category filter if it's provided and not empty
      if (category && category.trim() !== "") {
        query = query.where("category", "==", category);
      }

      // Firestore index required for compound queries with orderBy
      query = query.orderBy(sortBy, sortOrder);

      if (offsetVal > 0) {
        const offsetSnapshot = await query.limit(offsetVal).get();
        if (!offsetSnapshot.empty) {
          const lastVisible =
            offsetSnapshot.docs[offsetSnapshot.docs.length - 1];
          query = query.startAfter(lastVisible);
        }
      }

      const snapshot = await query.limit(limitVal).get();
      const results = formatDocs(snapshot.docs);

      console.log(`Found ${results.length} products for user ${userId}`);
      // console.log(results);
      return results;
    } catch (error) {
      console.error("Error getting user products:", error);
      throw error;
    }
  },
  async searchProducts(
    {
      searchTerm,
      productType,
      limit = 20,
      offset = 0,
      sortBy = "createdAt",
      sortOrder = "desc",
      expiryDateStart,
      expiryDateEnd,
    },
    currentUserId
  ) {
    try {
      console.log("Starting product search with parameters:", {
        searchTerm,
        productType,
        limit,
        offset,
        sortBy,
        sortOrder,
        expiryDateStart,
        expiryDateEnd,
      });

      const { limit: limitVal, offset: offsetVal } = paginationParams(
        limit,
        offset
      );
      console.log("userId of current user", currentUserId);

      // Base query - we'll collect all products first and then filter in memory
      // This approach is needed because Firestore doesn't support text search directly
      let query = productsRef;

      // Apply productType filter if provided (exact match)
      if (productType && productType.trim() !== "") {
        query = query.where("productType", "==", productType);
      }

      // Apply sorting
      query = query.orderBy(sortBy, sortOrder);

      // Get all products that match the base criteria
      let snapshot = await query.get();
      let allProducts = formatDocs(snapshot.docs);
      console.log(
        `Base query found ${allProducts.length} products before filtering`
      );

      // Filter out products owned by the current user
      if (currentUserId) {
        allProducts = allProducts.filter(
          (product) => product.ownerId !== currentUserId
        );
        console.log(
          `Filtered out products owned by current user (${currentUserId}), ${allProducts.length} products remaining`
        );
      }
      // If no search term provided, return all products with base filters
      if (!searchTerm || searchTerm.trim() === "") {
        // Apply pagination
        const paginatedResults = allProducts.slice(
          offsetVal,
          offsetVal + limitVal
        );
        console.log(
          `Returning ${paginatedResults.length} products - no searchTerm filtering`
        );
        return paginatedResults;
      }

      // Convert search term to lowercase for case-insensitive comparison
      const lowerSearchTerm = searchTerm.toLowerCase().trim();
      console.log(`Filtering for search term: "${lowerSearchTerm}"`);

      // For each product, we need to check if it matches the search criteria
      // We'll also need to load its batches for some batch-specific filters
      const matchingProducts = [];
      const processedProductIds = new Set(); // To avoid duplicates

      // Function to check if a product matches the search criteria
      const productMatchesSearch = (product) => {
        // Check name, description, category (case-insensitive)
        if (product.name?.toLowerCase().includes(lowerSearchTerm)) return true;
        if (product.description?.toLowerCase().includes(lowerSearchTerm))
          return true;
        if (product.category?.toLowerCase().includes(lowerSearchTerm))
          return true;

        // Drug-specific fields
        if (product.productType === "DRUG") {
          if (product.concentration?.toLowerCase().includes(lowerSearchTerm))
            return true;
          if (product.packageType?.toLowerCase().includes(lowerSearchTerm))
            return true;
        }

        // Equipment-specific fields
        if (product.productType === "EQUIPMENT") {
          if (product.brandName?.toLowerCase().includes(lowerSearchTerm))
            return true;
          if (product.modelNumber?.toLowerCase().includes(lowerSearchTerm))
            return true;
        }

        return false;
      };

      // First pass: Check for matches in the product fields
      for (const product of allProducts) {
        if (productMatchesSearch(product)) {
          if (!processedProductIds.has(product.productId)) {
            matchingProducts.push(product);
            processedProductIds.add(product.productId);
          }
        }
      }

      console.log(
        `Found ${matchingProducts.length} products that match in product fields`
      );

      // Second pass: Check for matches in the batch fields (for non-matched products)
      const remainingProducts = allProducts.filter(
        (p) => !processedProductIds.has(p.productId)
      );
      console.log(
        `Checking ${remainingProducts.length} remaining products for matches in batch fields`
      );

      if (remainingProducts.length > 0) {
        // Get batches in batch queries to avoid overloading Firestore
        const batchSize = 10;
        for (let i = 0; i < remainingProducts.length; i += batchSize) {
          const batch = remainingProducts.slice(i, i + batchSize);
          const batchPromises = batch.map(async (product) => {
            try {
              // Query for batches related to this product
              let batchQuery = batchesRef.where(
                "productId",
                "==",
                product.productId
              );

              // Apply expiry date filters if provided (for drug batches)
              if (expiryDateStart || expiryDateEnd) {
                // We need to fetch all batches and filter in memory since
                // we can't combine "where" queries with OR conditions
                console.log(
                  `Applying expiry date filters for product ${product.productId}`
                );
              }

              const batchesSnapshot = await batchQuery.get();
              const batches = formatDocs(batchesSnapshot.docs);

              // No batches found, skip further processing
              if (batches.length === 0) return null;

              // Check each batch for matches
              for (const batch of batches) {
                // Skip if we've already matched this product
                if (processedProductIds.has(product.productId)) continue;

                // Apply expiry date filtering if provided (for drug batches only)
                if (
                  product.productType === "DRUG" &&
                  (expiryDateStart || expiryDateEnd)
                ) {
                  const expiryDate =
                    batch.expiryDate instanceof Date
                      ? batch.expiryDate
                      : new Date(batch.expiryDate);

                  if (expiryDateStart) {
                    const startDate = new Date(expiryDateStart);
                    if (expiryDate < startDate) continue;
                  }

                  if (expiryDateEnd) {
                    const endDate = new Date(expiryDateEnd);
                    if (expiryDate > endDate) continue;
                  }
                }

                // Check for text matches in batch fields
                // For drug batches
                if (product.productType === "DRUG") {
                  if (
                    batch.manufacturer?.toLowerCase().includes(lowerSearchTerm)
                  ) {
                    matchingProducts.push(product);
                    processedProductIds.add(product.productId);
                    break;
                  }
                  if (
                    batch.manufacturerCountry
                      ?.toLowerCase()
                      .includes(lowerSearchTerm)
                  ) {
                    matchingProducts.push(product);
                    processedProductIds.add(product.productId);
                    break;
                  }
                }

                // For equipment batches
                if (
                  product.productType === "EQUIPMENT" &&
                  batch.serialNumbers
                ) {
                  for (const serialNumber of batch.serialNumbers) {
                    if (serialNumber.toLowerCase().includes(lowerSearchTerm)) {
                      matchingProducts.push(product);
                      processedProductIds.add(product.productId);
                      break;
                    }
                  }
                  // If we've already matched this product, skip further checks
                  if (processedProductIds.has(product.productId)) break;
                }
              }

              return null;
            } catch (error) {
              console.error(
                `Error processing batches for product ${product.productId}:`,
                error
              );
              return null;
            }
          });

          await Promise.all(batchPromises);
        }
      }

      console.log(
        `Total matching products after batch processing: ${matchingProducts.length}`
      );

      // Apply pagination to final results
      const paginatedResults = matchingProducts.slice(
        offsetVal,
        offsetVal + limitVal
      );
      console.log(
        `Returning ${paginatedResults.length} products after pagination`
      );

      return paginatedResults;
    } catch (error) {
      console.error("Error searching products:", error);
      throw error;
    }
  },
  async create(productData) {
    // productData should include productType ("DRUG" or "EQUIPMENT")
    // and all relevant common and specific fields.
    try {
      const sanitizedData = sanitizeInput(productData);
      const now = timestamp();

      const newProductRef = productsRef.doc(); // Auto-generate ID
      const newProduct = {
        productId: newProductRef.id, // Store the ID within the document
        ...sanitizedData,
        isActive:
          sanitizedData.isActive === undefined ? true : sanitizedData.isActive,
        createdAt: now,
        lastUpdatedAt: now,
      };

      await newProductRef.set(newProduct);
      // Fetch the newly created document to return it with server-generated timestamps resolved
      const doc = await newProductRef.get();
      return formatDoc(doc);
    } catch (error) {
      console.error("Error creating product:", error);
      throw error;
    }
  },

  async update(productId, updateData) {
    try {
      const productRef = productsRef.doc(productId);
      const doc = await productRef.get();
      if (!doc.exists) {
        throw new Error("Product not found");
      }

      const sanitizedData = sanitizeInput(updateData);
      const updatedProduct = {
        ...sanitizedData,
        lastUpdatedAt: timestamp(),
      };

      await productRef.update(updatedProduct);
      const updatedDoc = await productRef.get();
      return formatDoc(updatedDoc);
    } catch (error) {
      console.error("Error updating product:", error);
      throw error;
    }
  },

  async delete(productId) {
    // Soft delete by setting isActive to false
    try {
      const productRef = productsRef.doc(productId);
      const doc = await productRef.get();
      if (!doc.exists) {
        throw new Error("Product not found for deletion");
      }
      await productRef.update({
        isActive: false,
        lastUpdatedAt: timestamp(),
      });
      // Consider also deactivating related batches or other cleanup.
      return true;
    } catch (error) {
      console.error("Error deleting product (soft delete):", error);
      throw error;
    }
  },

  // You might add methods to find products by other fields if needed
  // e.g., findByName, searchProducts, etc.
};

module.exports = ProductModel;
