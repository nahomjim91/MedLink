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
      console.log(results);
      return results;
    } catch (error) {
      console.error("Error getting user products:", error);
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
