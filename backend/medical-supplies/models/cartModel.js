// /models/cartModel.js
const { db, FieldValue } = require("../config/firebase");
const { formatDoc, formatDocs, timestamp } = require("../../utils/helpers");
const ProductModel = require("./productModel");
const BatchModel = require("./batchModel");
const { createNotificationService } = require("../service/notificationService");

// Collection references
const cartsRef = db.collection("carts");
const cartItemsRef = db.collection("cartItems");
const cartBatchItemsRef = db.collection("cartBatchItems");

/**
 * Cart Model
 */
const CartModel = {
  notificationService: null,

  setNotificationService(io) {
    this.notificationService = createNotificationService(io);
  },

  /**
   * Get user's cart
   * @param {String} userId - User ID
   * @returns {Object} Cart data
   */
  async getByUserId(userId) {
    try {
      // Get cart document
      const cartDoc = await cartsRef.doc(userId).get();

      if (!cartDoc.exists) {
        // Create empty cart if it doesn't exist
        const newCart = {
          userId,
          totalItems: 0,
          totalPrice: 0,
          items: [],
          lastUpdated: new Date(),
        };

        // Optionally create the empty cart document
        await cartsRef.doc(userId).set(newCart);

        return newCart;
      }

      // Get cart items
      const cartItems = await this.getCartItemsByUserId(userId);

      // Return cart with items
      const cart = formatDoc(cartDoc);
      return { ...cart, items: cartItems };
    } catch (error) {
      console.error("Error getting cart:", error);
      throw error;
    }
  },

  /**
   * Get cart items by user ID
   * @param {String} userId - User ID
   * @returns {Array} Cart items with batch items
   */
  async getCartItemsByUserId(userId) {
    try {
      // Get cart items
      const cartItemsSnapshot = await cartItemsRef
        .where("userId", "==", userId)
        .get();

      if (cartItemsSnapshot.empty) {
        return [];
      }

      const cartItems = formatDocs(cartItemsSnapshot.docs);

      // Get batch items for each cart item
      const cartItemsWithBatches = await Promise.all(
        cartItems.map(async (item) => {
          const batchItems = await this.getCartBatchItemsByCartItemId(
            item.cartItemId
          );
          return { ...item, batchItems };
        })
      );

      return cartItemsWithBatches;
    } catch (error) {
      console.error("Error getting cart items:", error);
      throw error;
    }
  },

  /**
   * Get cart item by product ID
   * @param {String} userId - User ID
   * @param {String} productId - Product ID
   * @returns {Object} Cart item with batch items
   */
  async getCartItemByProductId(userId, productId) {
    try {
      const cartItemId = `${userId}_${productId}`;
      const cartItemDoc = await cartItemsRef.doc(cartItemId).get();

      if (!cartItemDoc.exists) {
        return null;
      }

      const cartItem = formatDoc(cartItemDoc);

      // Get batch items
      const batchItems = await this.getCartBatchItemsByCartItemId(cartItemId);

      return { ...cartItem, batchItems };
    } catch (error) {
      console.error("Error getting cart item by product ID:", error);
      throw error;
    }
  },

  /**
   * Get cart batch items by cart item ID
   * @param {String} cartItemId - Cart item ID
   * @returns {Array} Cart batch items
   */
  async getCartBatchItemsByCartItemId(cartItemId) {
    try {
      const batchItemsSnapshot = await cartBatchItemsRef
        .where("cartItemId", "==", cartItemId)
        .get();

      return formatDocs(batchItemsSnapshot.docs);
    } catch (error) {
      console.error("Error getting cart batch items:", error);
      throw error;
    }
  },

  /**
   * Add product to cart with automatic batch selection
   * @param {String} userId - User ID
   * @param {Object} input - Input data
   * @returns {Object} Updated cart
   */
  async addToCart(userId, input) {
    try {
      const { productId, quantity } = input;

      // Get product details
      const product = await ProductModel.getById(productId);
      if (!product) {
        throw new Error("Product not found");
      }

      // Get available batches for the product, sorted by priority
      const sortBy = product.productType === "DRUG" ? "expiryDate" : "addedAt";
      const sortOrder = product.productType === "DRUG" ? "asc" : "asc";

      const batches = await BatchModel.getByProductId(productId, {
        sortBy,
        sortOrder,
      });

      // Check if enough quantity is available
      const totalAvailable = batches.reduce(
        (sum, batch) => sum + batch.quantity,
        0
      );
      if (totalAvailable < quantity) {
        // Send low stock warning notification
        if (this.notificationService && totalAvailable > 0) {
          await this.notificationService.notifyLowStockWarning(
            userId,
            product.name,
            totalAvailable
          );
        }
        throw new Error(
          `Not enough quantity available. Requested: ${quantity}, Available: ${totalAvailable}`
        );
      }

      // Allocate quantity across batches
      let remainingToAllocate = quantity;
      const batchAllocations = [];

      for (const batch of batches) {
        if (remainingToAllocate <= 0) break;

        const quantityFromBatch = Math.min(batch.quantity, remainingToAllocate);
        if (quantityFromBatch > 0) {
          batchAllocations.push({
            batchId: batch.batchId,
            productId,
            quantity: quantityFromBatch,
            unitPrice: batch.sellingPrice,
            expiryDate: batch.expiryDate || null,
            batchSellerId: batch.currentOwnerId,
            batchSellerName: batch.currentOwnerName,
          });

          remainingToAllocate -= quantityFromBatch;
        }
      }

      // Add batches to cart
      const updatedCart = await this.addBatchAllocationsToCart(
        userId,
        productId,
        product.name,
        product.productType,
        product.category,
        product.imageList && product.imageList.length > 0
          ? product.imageList[0]
          : null,
        batchAllocations
      );

      // Send success notification
      if (this.notificationService) {
        await this.notificationService.notifyCartUpdate(
          userId,
          "added",
          product.name,
          {
            productId,
            quantity,
            totalPrice: batchAllocations.reduce((sum, batch) => 
              sum + (batch.quantity * batch.unitPrice), 0
            )
          }
        );
      }

      return updatedCart;
    } catch (error) {
      console.error("Error adding to cart:", error);
      throw error;
    }
  },

  /**
   * Add specific batch to cart
   * @param {String} userId - User ID
   * @param {Object} input - Input data
   * @returns {Object} Updated cart
   */
  async addSpecificBatchToCart(userId, input) {
    try {
      const { productId, batchId, quantity } = input;

      // Get product details
      const product = await ProductModel.getById(productId);
      if (!product) {
        throw new Error("Product not found");
      }

      // Get batch details
      const batch = await BatchModel.getById(batchId);
      if (!batch) {
        throw new Error("Batch not found");
      }

      // Check if batch belongs to product
      if (batch.productId !== productId) {
        throw new Error("Batch does not belong to the specified product");
      }

      // Check if enough quantity is available
      if (batch.quantity < quantity) {
        // Send low stock warning notification
        if (this.notificationService && batch.quantity > 0) {
          await this.notificationService.notifyLowStockWarning(
            userId,
            product.name,
            batch.quantity
          );
        }
        throw new Error(
          `Not enough quantity available. Requested: ${quantity}, Available: ${batch.quantity}`
        );
      }

      // Create batch allocation
      const batchAllocation = {
        batchId,
        productId,
        quantity,
        unitPrice: batch.sellingPrice,
        expiryDate: batch.expiryDate || null,
        batchSellerId: batch.currentOwnerId,
        batchSellerName: batch.currentOwnerName,
      };

      // Add batch to cart
      const updatedCart = await this.addBatchAllocationsToCart(
        userId,
        productId,
        product.name,
        product.productType,
        product.category,
        product.imageList && product.imageList.length > 0
          ? product.imageList[0]
          : null,
        [batchAllocation]
      );

      // Send success notification
      if (this.notificationService) {
        await this.notificationService.notifyCartUpdate(
          userId,
          "added",
          product.name,
          {
            productId,
            batchId,
            quantity,
            totalPrice: quantity * batch.sellingPrice
          }
        );
      }

      return updatedCart;
    } catch (error) {
      console.error("Error adding specific batch to cart:", error);
      throw error;
    }
  },

  /**
   * Add batch allocations to cart (internal helper method)
   * @param {String} userId - User ID
   * @param {String} productId - Product ID
   * @param {String} productName - Product name
   * @param {String} productType - Product type
   * @param {String} productCategory - Product category
   * @param {String} productImage - Product image URL
   * @param {Array} batchAllocations - Batch allocations
   * @returns {Object} Updated cart
   */
  async addBatchAllocationsToCart(
    userId,
    productId,
    productName,
    productType,
    productCategory,
    productImage,
    batchAllocations
  ) {
    // Start a Firestore batch operation for transaction-like behavior
    const batch = db.batch();

    try {
      const cartItemId = `${userId}_${productId}`;
      const cartItemRef = cartItemsRef.doc(cartItemId);
      const cartRef = cartsRef.doc(userId);

      // Get existing cart item and batch items (if any)
      const cartItemDoc = await cartItemRef.get();
      const existingBatchItemsSnapshot = cartItemDoc.exists
        ? await cartBatchItemsRef.where("cartItemId", "==", cartItemId).get()
        : { empty: true, docs: [] };

      // Calculate total quantity and price for this product
      let totalQuantity = 0;
      let totalPrice = 0;

      // Process each batch allocation
      for (const allocation of batchAllocations) {
        const cartBatchId = `${userId}_${productId}_${allocation.batchId}`;
        const cartBatchRef = cartBatchItemsRef.doc(cartBatchId);

        // Check if batch already exists in cart
        const existingBatchDoc = existingBatchItemsSnapshot.docs.find(
          (doc) => doc.id === cartBatchId
        );

        if (existingBatchDoc) {
          // Update existing batch item
          const existingData = existingBatchDoc.data();
          const newQuantity = existingData.quantity + allocation.quantity;
          const newPrice = allocation.unitPrice * newQuantity;

          batch.update(cartBatchRef, {
            quantity: newQuantity,
            addedAt: timestamp(),
          });

          totalQuantity += newQuantity;
          totalPrice += newPrice;
        } else {
          // Create new batch item
          const batchItem = {
            cartBatchId,
            userId,
            cartItemId,
            productId,
            batchId: allocation.batchId,
            quantity: allocation.quantity,
            unitPrice: allocation.unitPrice,
            expiryDate: allocation.expiryDate || null,
            batchSellerId: allocation.batchSellerId,
            batchSellerName: allocation.batchSellerName,
            addedAt: timestamp(),
          };

          batch.set(cartBatchRef, batchItem);

          totalQuantity += allocation.quantity;
          totalPrice += allocation.quantity * allocation.unitPrice;
        }
      }

      // Add existing batch items that weren't updated
      existingBatchItemsSnapshot.docs.forEach((doc) => {
        if (!batchAllocations.find((a) => a.batchId === doc.data().batchId)) {
          const data = doc.data();
          totalQuantity += data.quantity;
          totalPrice += data.quantity * data.unitPrice;
        }
      });

      // Update or create cart item
      const cartItemData = {
        cartItemId,
        userId,
        productId,
        productName,
        productType,
        productCategory,
        productImage,
        totalQuantity,
        totalPrice,
        lastUpdated: timestamp(),
      };

      batch.set(cartItemRef, cartItemData, { merge: true });

      // Update cart totals
      // We need to get all cart items to calculate the new totals
      const otherCartItemsSnapshot = await cartItemsRef
        .where("userId", "==", userId)
        .where("productId", "!=", productId)
        .get();

      let cartTotalItems = totalQuantity;
      let cartTotalPrice = totalPrice;

      otherCartItemsSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        cartTotalItems += data.totalQuantity || 0;
        cartTotalPrice += data.totalPrice || 0;
      });

      // Update cart document
      batch.set(
        cartRef,
        {
          userId,
          totalItems: cartTotalItems,
          totalPrice: cartTotalPrice,
          lastUpdated: timestamp(),
        },
        { merge: true }
      );

      // Commit all changes
      await batch.commit();

      // Return updated cart
      return await this.getByUserId(userId);
    } catch (error) {
      console.error("Error adding batch allocations to cart:", error);
      throw error;
    }
  },

  /**
   * Update cart batch item
   * @param {String} userId - User ID
   * @param {Object} input - Input data
   * @returns {Object} Updated cart
   */
  async updateCartBatchItem(userId, input) {
    try {
      const { productId, batchId, quantity } = input;
      const cartItemId = `${userId}_${productId}`;
      const cartBatchId = `${userId}_${productId}_${batchId}`;

      // Check if batch item exists
      const cartBatchDoc = await cartBatchItemsRef.doc(cartBatchId).get();
      if (!cartBatchDoc.exists) {
        throw new Error("Batch item not found in cart");
      }

      // Get product name for notification
      const product = await ProductModel.getById(productId);
      const productName = product ? product.name : "Product";

      // Check if quantity is valid
      if (quantity <= 0) {
        // Remove batch item if quantity is 0 or negative
        return await this.removeBatchFromCart(userId, productId, batchId);
      }

      // Start a Firestore batch operation
      const batch = db.batch();

      // Get existing batch data
      const batchData = cartBatchDoc.data();
      const unitPrice = batchData.unitPrice;
      const oldQuantity = batchData.quantity;

      // Update batch item
      batch.update(cartBatchItemsRef.doc(cartBatchId), {
        quantity,
        lastUpdated: timestamp(),
      });

      // Update cart item totals
      // Get all batch items for this product
      const batchItemsSnapshot = await cartBatchItemsRef
        .where("cartItemId", "==", cartItemId)
        .get();

      let totalQuantity = 0;
      let totalPrice = 0;

      batchItemsSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        // Use new quantity for the updated batch, old quantity for others
        if (data.batchId === batchId) {
          totalQuantity += quantity;
          totalPrice += quantity * unitPrice;
        } else {
          totalQuantity += data.quantity;
          totalPrice += data.quantity * data.unitPrice;
        }
      });

      // Update cart item
      batch.update(cartItemsRef.doc(cartItemId), {
        totalQuantity,
        totalPrice,
        lastUpdated: timestamp(),
      });

      // Update cart totals
      // Get all cart items to calculate new totals
      const cartItemsSnapshot = await cartItemsRef
        .where("userId", "==", userId)
        .get();

      let cartTotalItems = 0;
      let cartTotalPrice = 0;

      cartItemsSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.productId === productId) {
          cartTotalItems += totalQuantity;
          cartTotalPrice += totalPrice;
        } else {
          cartTotalItems += data.totalQuantity || 0;
          cartTotalPrice += data.totalPrice || 0;
        }
      });

      // Update cart document
      batch.update(cartsRef.doc(userId), {
        totalItems: cartTotalItems,
        totalPrice: cartTotalPrice,
        lastUpdated: timestamp(),
      });

      // Commit all changes
      await batch.commit();

      // Send notification
      if (this.notificationService) {
        const action = quantity > oldQuantity ? "increased" : "decreased";
        await this.notificationService.notifyCartUpdate(
          userId,
          "updated",
          productName,
          {
            productId,
            batchId,
            oldQuantity,
            newQuantity: quantity,
            action
          }
        );
      }

      // Return updated cart
      return await this.getByUserId(userId);
    } catch (error) {
      console.error("Error updating cart batch item:", error);
      throw error;
    }
  },

  /**
   * Remove product from cart (all batches)
   * @param {String} userId - User ID
   * @param {String} productId - Product ID
   * @returns {Object} Updated cart
   */
  async removeProductFromCart(userId, productId) {
    try {
      const cartItemId = `${userId}_${productId}`;

      // Check if cart item exists
      const cartItemDoc = await cartItemsRef.doc(cartItemId).get();
      if (!cartItemDoc.exists) {
        throw new Error("Product not found in cart");
      }

      // Get product name for notification
      const cartData = cartItemDoc.data();
      const productName = cartData.productName || "Product";

      // Start a Firestore batch operation
      const batch = db.batch();

      // Delete all batch items
      const batchItemsSnapshot = await cartBatchItemsRef
        .where("cartItemId", "==", cartItemId)
        .get();

      batchItemsSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // Delete cart item
      batch.delete(cartItemsRef.doc(cartItemId));

      // Update cart totals
      const itemQuantity = cartData.totalQuantity || 0;
      const itemPrice = cartData.totalPrice || 0;

      batch.update(cartsRef.doc(userId), {
        totalItems: FieldValue.increment(-itemQuantity),
        totalPrice: FieldValue.increment(-itemPrice),
        lastUpdated: timestamp(),
      });

      // Commit all changes
      await batch.commit();

      // Send notification
      if (this.notificationService) {
        await this.notificationService.notifyCartUpdate(
          userId,
          "removed",
          productName,
          {
            productId,
            quantity: itemQuantity
          }
        );
      }

      // Return updated cart
      return await this.getByUserId(userId);
    } catch (error) {
      console.error("Error removing product from cart:", error);
      throw error;
    }
  },

  /**
   * Remove specific batch from cart
   * @param {String} userId - User ID
   * @param {String} productId - Product ID
   * @param {String} batchId - Batch ID
   * @returns {Object} Updated cart
   */
  async removeBatchFromCart(userId, productId, batchId) {
    try {
      const cartItemId = `${userId}_${productId}`;
      const cartBatchId = `${userId}_${productId}_${batchId}`;

      // Check if batch item exists
      const cartBatchDoc = await cartBatchItemsRef.doc(cartBatchId).get();
      if (!cartBatchDoc.exists) {
        throw new Error("Batch item not found in cart");
      }

      // Get product name for notification
      const cartItemDoc = await cartItemsRef.doc(cartItemId).get();
      const productName = cartItemDoc.exists ? 
        cartItemDoc.data().productName : "Product";

      // Start a Firestore batch operation
      const batch = db.batch();

      // Get batch data
      const batchData = cartBatchDoc.data();
      const batchQuantity = batchData.quantity;
      const batchPrice = batchData.quantity * batchData.unitPrice;

      // Delete batch item
      batch.delete(cartBatchItemsRef.doc(cartBatchId));

      // Check if there are other batch items for this product
      const otherBatchesSnapshot = await cartBatchItemsRef
        .where("cartItemId", "==", cartItemId)
        .where("batchId", "!=", batchId)
        .get();

      if (otherBatchesSnapshot.empty) {
        // No other batches, delete cart item
        batch.delete(cartItemsRef.doc(cartItemId));
      } else {
        // Update cart item totals
        let totalQuantity = 0;
        let totalPrice = 0;

        otherBatchesSnapshot.docs.forEach((doc) => {
          const data = doc.data();
          totalQuantity += data.quantity;
          totalPrice += data.quantity * data.unitPrice;
        });

        batch.update(cartItemsRef.doc(cartItemId), {
          totalQuantity,
          totalPrice,
          lastUpdated: timestamp(),
        });
      }

      // Update cart totals
      batch.update(cartsRef.doc(userId), {
        totalItems: FieldValue.increment(-batchQuantity),
        totalPrice: FieldValue.increment(-batchPrice),
        lastUpdated: timestamp(),
      });

      // Commit all changes
      await batch.commit();

      // Send notification
      if (this.notificationService) {
        await this.notificationService.notifyCartUpdate(
          userId,
          "removed",
          productName,
          {
            productId,
            batchId,
            quantity: batchQuantity
          }
        );
      }

      // Return updated cart
      return await this.getByUserId(userId);
    } catch (error) {
      console.error("Error removing batch from cart:", error);
      throw error;
    }
  },

  /**
   * Clear cart
   * @param {String} userId - User ID
   * @returns {Object} Updated cart
   */
  async clearCart(userId) {
    try {
      // Start a Firestore batch operation
      const batch = db.batch();

      // Delete all batch items
      const batchItemsSnapshot = await cartBatchItemsRef
        .where("userId", "==", userId)
        .get();

      batchItemsSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // Delete all cart items
      const cartItemsSnapshot = await cartItemsRef
        .where("userId", "==", userId)
        .get();

      cartItemsSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // Reset cart totals
      batch.set(cartsRef.doc(userId), {
        userId,
        totalItems: 0,
        totalPrice: 0,
        lastUpdated: timestamp(),
      });

      // Commit all changes
      await batch.commit();

      // Send notification
      if (this.notificationService) {
        await this.notificationService.notifyCartUpdate(
          userId,
          "cleared",
          "cart",
          {}
        );
      }

      // Return empty cart
      return {
        userId,
        totalItems: 0,
        totalPrice: 0,
        items: [],
        lastUpdated: timestamp(),
      };
    } catch (error) {
      console.error("Error clearing cart:", error);
      throw error;
    }
  },
};

module.exports = CartModel;