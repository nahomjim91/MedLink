// /models/orderModel.js
const { db, FieldValue } = require("../../config/firebase");
const { formatDoc, formatDocs, timestamp } = require("../../utils/helpers");
const CartModel = require("./cartModel");
const BatchModel = require("./batchModel");
const ProductModel = require("./productModel");
const MSUserModel = require("./msUser");

// Collection references
const ordersRef = db.collection("orders");
const orderItemsRef = db.collection("orderItems");
const orderBatchItemsRef = db.collection("orderBatchItems");

/**
 * Order Model
 */
const OrderModel = {
  /**
   * Create order from cart
   * @param {String} buyerId - Buyer user ID
   * @param {Object} input - Order input data
   * @returns {Object} Created order
   */
  async createOrderFromCart(buyerId, input) {
    const batch = db.batch();
    
    try {
      const { sellerId, notes = "", pickupScheduledDate } = input;

      // Get buyer and seller information
      const [buyer, seller] = await Promise.all([
        MSUserModel.getById(buyerId),
        MSUserModel.getById(sellerId)
      ]);

      if (!buyer || !seller) {
        throw new Error("Buyer or seller not found");
      }

      // Get cart items for this specific seller
      const cart = await CartModel.getByUserId(buyerId);
      const sellerCartItems = cart.items.filter(item => 
        item.batchItems.some(batchItem => batchItem.batchSellerId === sellerId)
      );

      if (sellerCartItems.length === 0) {
        throw new Error("No items found for this seller in cart");
      }

      // Generate order ID
      const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      let totalItems = 0;
      let totalCost = 0;
      const orderItems = [];

      // Process each cart item for this seller
      for (const cartItem of sellerCartItems) {
        // Filter batch items for this seller only
        const sellerBatchItems = cartItem.batchItems.filter(
          batchItem => batchItem.batchSellerId === sellerId
        );

        if (sellerBatchItems.length === 0) continue;

        const orderItemId = `${orderId}_${cartItem.productId}`;
        
        // Calculate totals for this product
        const productTotalQuantity = sellerBatchItems.reduce(
          (sum, batch) => sum + batch.quantity, 0
        );
        const productTotalPrice = sellerBatchItems.reduce(
          (sum, batch) => sum + (batch.quantity * batch.unitPrice), 0
        );

        // Create order item
        const orderItem = {
          orderItemId,
          orderId,
          productId: cartItem.productId,
          productName: cartItem.productName,
          productType: cartItem.productType,
          productCategory: cartItem.productCategory,
          productImage: cartItem.productImage,
          totalQuantity: productTotalQuantity,
          totalPrice: productTotalPrice,
          createdAt: timestamp()
        };

        batch.set(orderItemsRef.doc(orderItemId), orderItem);
        orderItems.push(orderItem);

        // Create order batch items
        for (const batchItem of sellerBatchItems) {
          const orderBatchItemId = `${orderId}_${cartItem.productId}_${batchItem.batchId}`;
          
          const orderBatchItem = {
            orderBatchItemId,
            orderItemId,
            orderId,
            batchId: batchItem.batchId,
            productId: cartItem.productId,
            quantity: batchItem.quantity,
            unitPrice: batchItem.unitPrice,
            subtotal: batchItem.quantity * batchItem.unitPrice,
            expiryDate: batchItem.expiryDate,
            manufacturingDate: null, // Will be populated from batch data
            lotNumber: null, // Will be populated from batch data
            batchSellerId: batchItem.batchSellerId,
            batchSellerName: batchItem.batchSellerName,
            createdAt: timestamp()
          };

          batch.set(orderBatchItemsRef.doc(orderBatchItemId), orderBatchItem);
        }

        totalItems += productTotalQuantity;
        totalCost += productTotalPrice;
      }

      // Create main order
      const order = {
        orderId,
        buyerId,
        buyerName: buyer.contactName || buyer.companyName,
        buyerCompanyName: buyer.companyName,
        buyerContactInfo: {
          phone: buyer.phoneNumber,
          email: buyer.email,
          address: buyer.address
        },
        sellerId,
        sellerName: seller.contactName || seller.companyName,
        sellerCompanyName: seller.companyName,
        sellerContactInfo: {
          phone: seller.phoneNumber,
          email: seller.email,
          address: seller.address
        },
        totalItems,
        totalCost,
        orderDate: timestamp(),
        status: "pending_confirmation",
        paymentStatus: "pending",
        pickupScheduledDate: pickupScheduledDate ? new Date(pickupScheduledDate) : null,
        pickupConfirmedDate: null,
        transactionId: null,
        notes,
        createdAt: timestamp(),
        updatedAt: timestamp()
      };

      batch.set(ordersRef.doc(orderId), order);

      // Reserve batch quantities (reduce available quantity)
      for (const cartItem of sellerCartItems) {
        const sellerBatchItems = cartItem.batchItems.filter(
          batchItem => batchItem.batchSellerId === sellerId
        );

        for (const batchItem of sellerBatchItems) {
          const batchRef = db.collection("batches").doc(batchItem.batchId);
          batch.update(batchRef, {
            quantity: FieldValue.increment(-batchItem.quantity),
            updatedAt: timestamp()
          });
        }
      }

      // Remove items from cart for this seller
      await this.removeSellerItemsFromCart(buyerId, sellerId, batch);

      // Commit all changes
      await batch.commit();

      // Return complete order with items
      return await this.getById(orderId);
    } catch (error) {
      console.error("Error creating order from cart:", error);
      throw error;
    }
  },

  /**
   * Remove seller-specific items from cart
   * @param {String} buyerId - Buyer ID
   * @param {String} sellerId - Seller ID  
   * @param {Object} batch - Firestore batch
   */
  async removeSellerItemsFromCart(buyerId, sellerId, batch) {
    try {
      const cart = await CartModel.getByUserId(buyerId);
      
      for (const cartItem of cart.items) {
        const sellerBatchItems = cartItem.batchItems.filter(
          batchItem => batchItem.batchSellerId === sellerId
        );

        if (sellerBatchItems.length === 0) continue;

        // Remove seller's batch items
        for (const batchItem of sellerBatchItems) {
          const cartBatchId = `${buyerId}_${cartItem.productId}_${batchItem.batchId}`;
          batch.delete(db.collection("cartBatchItems").doc(cartBatchId));
        }

        // Check if all batch items are removed for this product
        const remainingBatchItems = cartItem.batchItems.filter(
          batchItem => batchItem.batchSellerId !== sellerId
        );

        if (remainingBatchItems.length === 0) {
          // Remove entire cart item
          const cartItemId = `${buyerId}_${cartItem.productId}`;
          batch.delete(db.collection("cartItems").doc(cartItemId));
        } else {
          // Update cart item totals
          const newTotalQuantity = remainingBatchItems.reduce(
            (sum, batch) => sum + batch.quantity, 0
          );
          const newTotalPrice = remainingBatchItems.reduce(
            (sum, batch) => sum + (batch.quantity * batch.unitPrice), 0
          );

          const cartItemId = `${buyerId}_${cartItem.productId}`;
          batch.update(db.collection("cartItems").doc(cartItemId), {
            totalQuantity: newTotalQuantity,
            totalPrice: newTotalPrice,
            lastUpdated: timestamp()
          });
        }
      }

      // Update cart totals will be handled by cart model
    } catch (error) {
      console.error("Error removing seller items from cart:", error);
      throw error;
    }
  },

  /**
   * Get order by ID with full details
   * @param {String} orderId - Order ID
   * @returns {Object} Order with items and batch items
   */
  async getById(orderId) {
    try {
      const orderDoc = await ordersRef.doc(orderId).get();
      
      if (!orderDoc.exists) {
        return null;
      }

      const order = formatDoc(orderDoc);

      // Get order items
      const orderItemsSnapshot = await orderItemsRef
        .where("orderId", "==", orderId)
        .get();

      const orderItems = await Promise.all(
        formatDocs(orderItemsSnapshot.docs).map(async (item) => {
          // Get batch items for this order item
          const batchItemsSnapshot = await orderBatchItemsRef
            .where("orderItemId", "==", item.orderItemId)
            .get();

          const batchItems = formatDocs(batchItemsSnapshot.docs);
          
          return { ...item, batchItems };
        })
      );

      return { ...order, items: orderItems };
    } catch (error) {
      console.error("Error getting order by ID:", error);
      throw error;
    }
  },

  /**
   * Get orders by buyer ID
   * @param {String} buyerId - Buyer ID
   * @param {Object} options - Query options
   * @returns {Array} Orders array
   */
  async getByBuyerId(buyerId, options = {}) {
    try {
      const { limit = 20, offset = 0, status } = options;
      
      let query = ordersRef.where("buyerId", "==", buyerId);
      
      if (status) {
        query = query.where("status", "==", status);
      }
      
      const ordersSnapshot = await query
        .orderBy("createdAt", "desc")
        .limit(limit)
        .offset(offset)
        .get();

      return await Promise.all(
        formatDocs(ordersSnapshot.docs).map(async (order) => {
          return await this.getById(order.orderId);
        })
      );
    } catch (error) {
      console.error("Error getting orders by buyer ID:", error);
      throw error;
    }
  },

  /**
   * Get orders by seller ID
   * @param {String} sellerId - Seller ID
   * @param {Object} options - Query options
   * @returns {Array} Orders array
   */
  async getBySellerId(sellerId, options = {}) {
    try {
      const { limit = 20, offset = 0, status } = options;
      
      let query = ordersRef.where("sellerId", "==", sellerId);
      
      if (status) {
        query = query.where("status", "==", status);
      }
      
      const ordersSnapshot = await query
        .orderBy("createdAt", "desc")
        .limit(limit)
        .offset(offset)
        .get();

      return await Promise.all(
        formatDocs(ordersSnapshot.docs).map(async (order) => {
          return await this.getById(order.orderId);
        })
      );
    } catch (error) {
      console.error("Error getting orders by seller ID:", error);
      throw error;
    }
  },

  /**
   * Update order status
   * @param {String} orderId - Order ID
   * @param {String} status - New status
   * @param {String} userId - User making the change
   * @returns {Object} Updated order
   */
  async updateStatus(orderId, status, userId) {
    try {
      const orderRef = ordersRef.doc(orderId);
      const orderDoc = await orderRef.get();
      
      if (!orderDoc.exists) {
        throw new Error("Order not found");
      }

      const order = orderDoc.data();
      
      // Validate status transition and permissions
      if (!this.isValidStatusTransition(order.status, status)) {
        throw new Error(`Invalid status transition from ${order.status} to ${status}`);
      }

      // Check permissions
      if (status === "confirmed" || status === "rejected_by_seller") {
        if (userId !== order.sellerId) {
          throw new Error("Only seller can confirm or reject orders");
        }
      }

      const updateData = {
        status,
        updatedAt: timestamp()
      };

      // Add specific timestamp fields based on status
      if (status === "pickup_confirmed") {
        updateData.pickupConfirmedDate = timestamp();
      }

      await orderRef.update(updateData);

      return await this.getById(orderId);
    } catch (error) {
      console.error("Error updating order status:", error);
      throw error;
    }
  },

  /**
   * Update payment status
   * @param {String} orderId - Order ID
   * @param {String} paymentStatus - New payment status
   * @param {String} transactionId - Transaction ID (optional)
   * @returns {Object} Updated order
   */
  async updatePaymentStatus(orderId, paymentStatus, transactionId = null) {
    try {
      const updateData = {
        paymentStatus,
        updatedAt: timestamp()
      };

      if (transactionId) {
        updateData.transactionId = transactionId;
      }

      await ordersRef.doc(orderId).update(updateData);

      return await this.getById(orderId);
    } catch (error) {
      console.error("Error updating payment status:", error);
      throw error;
    }
  },

  /**
   * Schedule pickup
   * @param {String} orderId - Order ID
   * @param {Date} pickupDate - Scheduled pickup date
   * @param {String} userId - User ID
   * @returns {Object} Updated order
   */
  async schedulePickup(orderId, pickupDate, userId) {
    try {
      const orderRef = ordersRef.doc(orderId);
      const orderDoc = await orderRef.get();
      
      if (!orderDoc.exists) {
        throw new Error("Order not found");
      }

      const order = orderDoc.data();
      
      // Only buyer or seller can schedule pickup
      if (userId !== order.buyerId && userId !== order.sellerId) {
        throw new Error("Unauthorized to schedule pickup");
      }

      await orderRef.update({
        pickupScheduledDate: new Date(pickupDate),
        status: "pickup_scheduled",
        updatedAt: timestamp()
      });

      return await this.getById(orderId);
    } catch (error) {
      console.error("Error scheduling pickup:", error);
      throw error;
    }
  },

  /**
   * Cancel order
   * @param {String} orderId - Order ID
   * @param {String} userId - User ID
   * @param {String} reason - Cancellation reason
   * @returns {Object} Updated order
   */
  async cancelOrder(orderId, userId, reason = "") {
    const batch = db.batch();
    
    try {
      const orderRef = ordersRef.doc(orderId);
      const orderDoc = await orderRef.get();
      
      if (!orderDoc.exists) {
        throw new Error("Order not found");
      }

      const order = orderDoc.data();
      
      // Only buyer or seller can cancel, and only in certain statuses
      if (userId !== order.buyerId && userId !== order.sellerId) {
        throw new Error("Unauthorized to cancel order");
      }

      const cancellableStatuses = [
        "pending_confirmation", 
        "confirmed", 
        "preparing", 
        "ready_for_pickup"
      ];
      
      if (!cancellableStatuses.includes(order.status)) {
        throw new Error("Order cannot be cancelled in current status");
      }

      // Restore batch quantities
      const orderBatchItemsSnapshot = await orderBatchItemsRef
        .where("orderId", "==", orderId)
        .get();

      for (const doc of orderBatchItemsSnapshot.docs) {
        const batchItem = doc.data();
        const batchRef = db.collection("batches").doc(batchItem.batchId);
        
        batch.update(batchRef, {
          quantity: FieldValue.increment(batchItem.quantity),
          updatedAt: timestamp()
        });
      }

      // Update order status
      batch.update(orderRef, {
        status: "cancelled",
        cancellationReason: reason,
        cancelledBy: userId,
        cancelledAt: timestamp(),
        updatedAt: timestamp()
      });

      await batch.commit();

      return await this.getById(orderId);
    } catch (error) {
      console.error("Error cancelling order:", error);
      throw error;
    }
  },

  /**
   * Validate status transition
   * @param {String} currentStatus - Current status
   * @param {String} newStatus - New status
   * @returns {Boolean} Is valid transition
   */
  isValidStatusTransition(currentStatus, newStatus) {
    const validTransitions = {
      "pending_confirmation": ["confirmed", "rejected_by_seller", "cancelled"],
      "confirmed": ["preparing", "cancelled"],
      "preparing": ["ready_for_pickup", "cancelled"],
      "ready_for_pickup": ["pickup_scheduled", "cancelled"],
      "pickup_scheduled": ["pickup_confirmed", "cancelled"],
      "pickup_confirmed": ["completed"],
      "completed": [],
      "cancelled": [],
      "rejected_by_seller": [],
      "disputed": ["completed", "cancelled"]
    };

    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }
};

module.exports = OrderModel;