// /models/orderModel.js
const { db, FieldValue } = require("../../config/firebase");
const { formatDoc, formatDocs, timestamp } = require("../../utils/helpers");
const CartModel = require("./cartModel");
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
   * Create order directly (for frontend data)
   * @param {Object} orderData - Complete order data from frontend
   * @returns {Object} Created order
   */
  async createOrder(orderData) {
    const batch = db.batch();
    
    try {
      const { 
        orderId, 
        orderNumber,
        buyerId, 
        buyerName, 
        buyerCompanyName,
        buyerContactInfo,
        sellerId, 
        sellerName,
        sellerCompanyName,
        sellerContactInfo,
        items, 
        totalItems, 
        totalCost,
        orderDate,
        status,
        paymentStatus,
        pickupScheduledDate,
        pickupConfirmedDate,
        transactionId,
        notes 
      } = orderData;

      // Validate required fields
      if (!orderId || !buyerId || !sellerId || !items || items.length === 0) {
        throw new Error("Missing required order fields");
      }

      // Create main order
      const order = {
        orderId,
        orderNumber: orderNumber || await this.getNextOrderNumber(),
        buyerId,
        buyerName,
        buyerCompanyName,
        buyerContactInfo,
        sellerId,
        sellerName,
        sellerCompanyName,
        sellerContactInfo,
        totalItems,
        totalCost,
        orderDate: orderDate ? new Date(orderDate) : timestamp(),
        status: this.convertStatusFromFrontend(status) || "pending_confirmation",
        paymentStatus: this.convertPaymentStatusFromFrontend(paymentStatus) || "pending",
        pickupScheduledDate: pickupScheduledDate ? new Date(pickupScheduledDate) : null,
        pickupConfirmedDate: pickupConfirmedDate ? new Date(pickupConfirmedDate) : null,
        transactionId,
        notes: notes || "",
        createdAt: timestamp(),
        updatedAt: timestamp()
      };

      batch.set(ordersRef.doc(orderId), order);

      // Process items
      for (const item of items) {
        const orderItem = {
          orderItemId: item.orderItemId,
          orderId,
          productId: item.productId,
          productName: item.productName,
          productType: item.productType,
          productCategory: item.productCategory,
          productImage: item.productImage,
          totalQuantity: item.totalQuantity,
          totalPrice: item.totalPrice,
          createdAt: item.createdAt ? new Date(item.createdAt) : timestamp()
        };

        batch.set(orderItemsRef.doc(item.orderItemId), orderItem);

        // Process batch items
        if (item.batchItems && item.batchItems.length > 0) {
          for (const batchItem of item.batchItems) {
            const orderBatchItem = {
              orderBatchItemId: batchItem.orderBatchItemId,
              orderItemId: item.orderItemId,
              orderId,
              batchId: batchItem.batchId,
              productId: item.productId,
              quantity: batchItem.quantity,
              unitPrice: batchItem.unitPrice,
              subtotal: batchItem.subtotal || (batchItem.quantity * batchItem.unitPrice),
              expiryDate: batchItem.expiryDate ? new Date(batchItem.expiryDate) : null,
              manufacturingDate: batchItem.manufacturingDate ? new Date(batchItem.manufacturingDate) : null,
              lotNumber: batchItem.lotNumber,
              batchSellerId: batchItem.batchSellerId,
              batchSellerName: batchItem.batchSellerName,
              createdAt: batchItem.createdAt ? new Date(batchItem.createdAt) : timestamp()
            };

            batch.set(orderBatchItemsRef.doc(batchItem.orderBatchItemId), orderBatchItem);
          }
        }
      }

      // Commit all changes
      await batch.commit();

      // Return complete order with items
      return await this.getById(orderId);
    } catch (error) {
      console.error("Error creating order direct:", error);
      throw error;
    }
  },

  /**
   * Get next order number
   * @returns {Number} Next order number
   */
  async getNextOrderNumber() {
    try {
      const counterRef = db.collection("counters").doc("orders");
      const counterDoc = await counterRef.get();
      
      if (!counterDoc.exists) {
        // Initialize counter
        await counterRef.set({ count: 1 });
        return 1;
      }
      
      const currentCount = counterDoc.data().count;
      const nextCount = currentCount + 1;
      
      await counterRef.update({ count: nextCount });
      return nextCount;
    } catch (error) {
      console.error("Error getting next order number:", error);
      // Fallback to timestamp-based number
      return Math.floor(Date.now() / 1000);
    }
  },

  /**
   * Convert frontend status to database status
   * @param {String} status - Frontend status
   * @returns {String} Database status
   */
  convertStatusFromFrontend(status) {
    const statusMap = {
      "PENDING": "pending_confirmation",
      "PENDING_CONFIRMATION": "pending_confirmation",
      "CONFIRMED": "confirmed",
      "REJECTED_BY_SELLER": "rejected_by_seller",
      "PREPARING": "preparing",
      "READY_FOR_PICKUP": "ready_for_pickup",
      "PICKUP_SCHEDULED": "pickup_scheduled",
      "PICKUP_CONFIRMED": "pickup_confirmed",
      "COMPLETED": "completed",
      "CANCELLED": "cancelled",
      "DISPUTED": "disputed"
    };
    
    return statusMap[status] || status?.toLowerCase().replace(/_/g, '-');
  },

  /**
   * Convert frontend payment status to database status
   * @param {String} paymentStatus - Frontend payment status
   * @returns {String} Database payment status
   */
  convertPaymentStatusFromFrontend(paymentStatus) {
    const statusMap = {
      "PENDING": "pending",
      "PROCESSING": "processing",
      "PAID_HELD_BY_SYSTEM": "paid_held_by_system",
      "RELEASED_TO_SELLER": "released_to_seller",
      "REFUNDED": "refunded",
      "FAILED": "failed"
    };
    
    return statusMap[paymentStatus] || paymentStatus?.toLowerCase().replace(/_/g, '-');
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
   * Get order summaries
   * @param {Object} filter - Filter options
   * @param {Number} limit - Limit
   * @param {Number} offset - Offset
   * @returns {Array} Order summaries
   */
  async getOrderSummaries(filter = {}, limit = 20, offset = 0) {
    try {
      let query = ordersRef;
      
      // Apply filters
      if (filter.status) {
        query = query.where("status", "==", filter.status);
      }
      if (filter.paymentStatus) {
        query = query.where("paymentStatus", "==", filter.paymentStatus);
      }
      if (filter.buyerId) {
        query = query.where("buyerId", "==", filter.buyerId);
      }
      if (filter.sellerId) {
        query = query.where("sellerId", "==", filter.sellerId);
      }
      
      const ordersSnapshot = await query
        .orderBy("createdAt", "desc")
        .limit(limit)
        .offset(offset)
        .get();

      return formatDocs(ordersSnapshot.docs).map(order => ({
        orderId: order.orderId,
        orderNumber: order.orderNumber,
        buyerName: order.buyerName,
        sellerName: order.sellerName,
        totalItems: order.totalItems,
        totalCost: order.totalCost,
        status: order.status,
        paymentStatus: order.paymentStatus,
        orderDate: order.orderDate,
        pickupScheduledDate: order.pickupScheduledDate
      }));
    } catch (error) {
      console.error("Error getting order summaries:", error);
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