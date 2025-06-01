// /models/orderModel.js
const { db, FieldValue } = require("../../config/firebase");
const { formatDoc, formatDocs, timestamp } = require("../../utils/helpers");
const MSUserModel = require("./msUser");
const ProductModel = require("./productModel");
const BatchModel = require("./batchModel");
const { createNotificationService } = require("../service/notificationService");

// Collection references
const ordersRef = db.collection("orders");
const orderItemsRef = db.collection("orderItems");
const orderBatchItemsRef = db.collection("orderBatchItems");
const productsRef = db.collection("products");
const batchesRef = db.collection("batches");


/**
 * Order Model
 */
const OrderModel = {
  notificationService: null,

  setNotificationService(io) {
    this.notificationService = createNotificationService(io);
  },
  

  /**
   * Transfer products to buyer when order is completed (pickup_confirmed or delivered)
   * @param {String} orderId - Order ID
   * @param {String} buyerId - Buyer ID
   * @param {String} transferType - Type of transfer ('pickup' or 'delivery')
   * @returns {Object} Transfer result
   */
  async transferProductsToBuyer(orderId, buyerId, transferType = "pickup") {
    const batch = db.batch();

    try {
      // console.log(
      //   `Starting product transfer for order ${orderId} to buyer ${buyerId} via ${transferType}`
      // );

      // Get buyer information
      const buyer = await MSUserModel.getById(buyerId);
      if (!buyer) {
        throw new Error("Buyer not found");
      }

      // Get order with all items and batch items
      const order = await this.getById(orderId);
      if (!order) {
        throw new Error("Order not found");
      }

      const transferResults = [];

      // Process each order item
      for (const orderItem of order.items) {
        console.log(
          `Processing order item: ${orderItem.orderItemId} for product: ${orderItem.productId}`
        );

        // Get original product details
        const originalProduct = await ProductModel.getById(orderItem.productId);
        if (!originalProduct) {
          console.warn(
            `Original product ${orderItem.productId} not found, skipping`
          );
          continue;
        }

        // Check if buyer already has this product (by name and key attributes)
        const existingBuyerProduct = await this.findExistingBuyerProduct(
          buyerId,
          originalProduct
        );

        let targetProductId;
        let isNewProduct = false;

        if (existingBuyerProduct) {
          console.log(
            `Found existing product ${existingBuyerProduct.productId} for buyer`
          );
          targetProductId = existingBuyerProduct.productId;
        } else {
          console.log(`Creating new product copy for buyer`);
          // Create a copy of the product for the buyer
          const newProduct = await this.createProductCopyForBuyer(
            originalProduct,
            buyer,
            batch,
            transferType
          );
          targetProductId = newProduct.productId;
          isNewProduct = true;
        }

        // Transfer all batch items for this product
        const batchTransferResults = [];
        for (const orderBatchItem of orderItem.batchItems) {
          console.log(
            `Transferring batch ${orderBatchItem.batchId}, quantity: ${orderBatchItem.quantity}`
          );

          const batchResult = await this.transferBatchToBuyer(
            orderBatchItem,
            targetProductId,
            buyer,
            originalProduct.productType,
            batch,
            transferType
          );

          batchTransferResults.push(batchResult);
        }

        // Handle original product based on buyer type and transfer completion
        await this.handleOriginalProductAfterTransfer(
          originalProduct,
          buyer,
          orderItem,
          batch,
          transferType
        );

        transferResults.push({
          orderItemId: orderItem.orderItemId,
          originalProductId: orderItem.productId,
          targetProductId,
          isNewProduct,
          batchTransfers: batchTransferResults,
        });
      }

      // Commit all batch operations
      await batch.commit();

      // Send product transfer notifications
      await this.sendProductTransferNotifications(
        order,
        buyer,
        transferResults,
        transferType
      );

      console.log(
        `Product transfer completed for order ${orderId} via ${transferType}`
      );
      return {
        orderId,
        buyerId,
        transferType,
        transferredItems: transferResults,
        transferredAt: timestamp(),
      };
    } catch (error) {
      console.error("Error transferring products to buyer:", error);
      throw error;
    }
  },

  /**
   * Send notifications when products are transferred
   * @param {Object} order - Order data
   * @param {Object} buyer - Buyer data
   * @param {Array} transferResults - Transfer results
   * @param {String} transferType - Type of transfer
   */
  async sendProductTransferNotifications(
    order,
    buyer,
    transferResults,
    transferType
  ) {
    if (!this.notificationService) return;

    try {
      // Notify buyer about successful product transfer
      await this.notificationService.createNotification(
        buyer.id,
        "product_transfer",
        `Products from order ${order.orderNumber} have been transferred to your inventory`,
        {
          orderId: order.orderId,
          orderNumber: order.orderNumber,
          transferType: transferType,
          transferredItemsCount: transferResults.length,
          sellerName: order.sellerName || order.sellerCompanyName,
          actionUrl: `/inventory`,
          message: `${transferResults.length} product(s) have been added to your inventory via ${transferType}.`,
        },
        "high"
      );

      // Notify seller about completed transfer
      await this.notificationService.createNotification(
        order.sellerId,
        "order_completed",
        `Order ${order.orderNumber} has been completed - products transferred`,
        {
          orderId: order.orderId,
          orderNumber: order.orderNumber,
          transferType: transferType,
          buyerName: order.buyerName || order.buyerCompanyName,
          totalAmount: order.totalCost,
          actionUrl: `/orders/${order.orderId}`,
          message: `Products have been successfully transferred to ${
            buyer.companyName || buyer.name
          } via ${transferType}.`,
        },
        "normal"
      );

      // Send inventory updates for health facilities
      if (
        buyer.role === "HEALTH_FACILITY" ||
        buyer.userType === "HEALTH_FACILITY" ||
        buyer.type === "HEALTH_FACILITY"
      ) {
        await this.notificationService.createNotification(
          buyer.id,
          "inventory_update",
          "New medical supplies added to your inventory",
          {
            orderId: order.orderId,
            source: "purchase",
            transferType: transferType,
            actionUrl: `/inventory`,
            message:
              "Please review and organize the new supplies in your medical inventory system.",
          },
          "high"
        );
      }
    } catch (error) {
      console.error("Error sending product transfer notifications:", error);
    }
  },
  /**
   * Transfer a batch to the buyer
   * @param {Object} orderBatchItem - Order batch item data
   * @param {String} targetProductId - Target product ID
   * @param {Object} buyer - Buyer data
   * @param {String} productType - Product type
   * @param {Object} batch - Firestore batch
   * @param {String} transferType - Type of transfer
   * @returns {Object} Batch transfer result
   */
  async transferBatchToBuyer(
    orderBatchItem,
    targetProductId,
    buyer,
    productType,
    batch,
    transferType = "pickup"
  ) {
    try {
      // Get original batch details
      const originalBatch = await BatchModel.getById(orderBatchItem.batchId);
      if (!originalBatch) {
        throw new Error(`Original batch ${orderBatchItem.batchId} not found`);
      }

      // Create new batch for buyer
      const newBatchRef = batchesRef.doc(); // Auto-generate ID
      const now = timestamp();

      const newBatch = {
        batchId: newBatchRef.id,
        productId: targetProductId,
        productType: productType,
        currentOwnerId: buyer.id,
        currentOwnerName: buyer.companyName,
        quantity: orderBatchItem.quantity,
        costPrice: orderBatchItem.unitPrice, // Use the purchase price as cost
        sellingPrice: null, // Buyer can set this later
        addedAt: now,
        lastUpdatedAt: now,
        sourceOriginalBatchId: orderBatchItem.batchId,
        transferType: transferType,
        acquiredVia: transferType,
        // Copy batch-type specific fields
        ...(productType === "DRUG" && {
          expiryDate: originalBatch.expiryDate,
          sizePerPackage: originalBatch.sizePerPackage,
          manufacturer: originalBatch.manufacturer,
          manufacturerCountry: originalBatch.manufacturerCountry,
        }),
        ...(productType === "EQUIPMENT" && {
          serialNumbers: this.extractSerialNumbers(
            originalBatch.serialNumbers,
            orderBatchItem.quantity,
            originalBatch.quantity
          ),
        }),
        // Add transfer metadata
        transferredFromOrder: orderBatchItem.orderId,
        transferredAt: now,
      };
      console.log("New batch data:", newBatch);
      batch.set(newBatchRef, newBatch);

      // Update original batch quantity (reduce by transferred amount)
      const originalBatchRef = batchesRef.doc(orderBatchItem.batchId);
      const newQuantity = Math.max(
        0,
        (originalBatch.quantity || 0) - orderBatchItem.quantity
      );

      batch.update(originalBatchRef, {
        // quantity: newQuantity, // already updated when the user making order coz buyer pay money for it
        lastUpdatedAt: now,
        lastTransferDate: now,
        lastTransferType: transferType,
        ...(newQuantity === 0 && {
          soldOut: true,
          soldOutAt: now,
        }),
      });

      return {
        originalBatchId: orderBatchItem.batchId,
        newBatchId: newBatch.batchId,
        transferredQuantity: orderBatchItem.quantity,
        targetProductId,
        transferType,
      };
    } catch (error) {
      console.error("Error transferring batch to buyer:", error);
      throw error;
    }
  },


  /**
   * Convert frontend status to database status
   * @param {String} status - Frontend status
   * @returns {String} Database status
   */
  convertStatusFromFrontend(status) {
    const statusMap = {
      PENDING: "pending-confirmation",
      PENDING_CONFIRMATION: "pending-confirmation",
      CONFIRMED: "confirmed",
      REJECTED_BY_SELLER: "rejected-by-seller",
      PREPARING: "preparing",
      READY_FOR_PICKUP: "ready-for-pickup",
      PICKUP_SCHEDULED: "pickup-scheduled",
      PICKUP_CONFIRMED: "pickup-confirmed",
      DELIVERED: "delivered",
      COMPLETED: "completed",
      CANCELLED: "cancelled",
      DISPUTED: "disputed",
    };

    return statusMap[status] || status?.toLowerCase().replace(/_/g, "-");
  },

  /**
   * Convert frontend payment status to database status
   * @param {String} paymentStatus - Frontend payment status
   * @returns {String} Database payment status
   */
  convertPaymentStatusFromFrontend(paymentStatus) {
    const statusMap = {
      PENDING: "pending",
      PROCESSING: "processing",
      PAID_HELD_BY_SYSTEM: "paid-held-by-system",
      RELEASED_TO_SELLER: "released-to-seller",
      REFUNDED: "refunded",
      FAILED: "failed",
    };

    return (
      statusMap[paymentStatus] ||
      paymentStatus?.toLowerCase().replace(/_/g, "-")
    );
  },

  /**
   * Update order status with integrated payment status management
   * @param {String} orderId - Order ID
   * @param {String} status - New status
   * @param {String} userId - User making the change
   * @param {String} transactionId - Transaction ID (optional, for payment-related updates)
   * @returns {Object} Updated order
   */
  async updateStatus(orderId, status, userId, transactionId = null) {
    try {
      const orderRef = ordersRef.doc(orderId);
      const orderDoc = await orderRef.get();

      if (!orderDoc.exists) {
        throw new Error("Order not found");
      }

      const order = orderDoc.data();

      // Validate status transition and permissions
      if (!this.isValidStatusTransition(order.status, status)) {
        throw new Error(
          `Invalid status transition from ${order.status} to ${status}`
        );
      }

      // Check permissions
      if (status === "confirmed" || status === "rejected-by-seller") {
        console.log("userId: ", userId, "order: ", order);
        if (userId !== order.sellerId) {
          throw new Error("Only seller can confirm or reject orders");
        }
      }

      const updateData = {
        status,
        updatedAt: timestamp(),
      };

      // Automatically determine and update payment status based on order status
      const newPaymentStatus = this.determinePaymentStatus(
        order.status,
        status,
        order.paymentStatus
      );
      if (newPaymentStatus && newPaymentStatus !== order.paymentStatus) {
        updateData.paymentStatus = newPaymentStatus;

        // Add payment-specific timestamps
        if (newPaymentStatus === "paid-held-by-system") {
          updateData.paidAt = timestamp();
        } else if (newPaymentStatus === "released-to-seller") {
          updateData.releasedToSellerAt = timestamp();
        } else if (newPaymentStatus === "refunded") {
          updateData.refundedAt = timestamp();
        }

        // Add transaction ID if provided
        if (transactionId) {
          updateData.transactionId = transactionId;
        }
          await this.updateTransactionStatus(orderId, newPaymentStatus, transactionId);

      }

      // Handle product transfer for pickup_confirmed and delivered statuses
      if (status === "pickup-confirmed" || status === "delivered") {
        const transferType = status === "delivered" ? "delivery" : "pickup";

        // Add specific timestamp fields
        if (status === "pickup-confirmed") {
          updateData.pickupConfirmedDate = timestamp();
        } else if (status === "delivered") {
          updateData.deliveredDate = timestamp();
        }

        // Transfer products to buyer
        try {
          const transferResult = await this.transferProductsToBuyer(
            orderId,
            order.buyerId,
            transferType
          );

          updateData.productTransferResult = transferResult;
          updateData.productsTransferredAt = timestamp();

          console.log(
            `Products successfully transferred for order ${orderId} via ${transferType}`
          );
        } catch (transferError) {
          console.error(
            `Error transferring products for order ${orderId}:`,
            transferError
          );
          // Don't fail the status update if transfer fails, but log it
          updateData.productTransferError = transferError.message;
          updateData.productTransferFailedAt = timestamp();
        }
      }

      // Handle ready for pickup status
      if (status === "ready-for-pickup") {
        updateData.readyForPickupDate = timestamp();
      }

      // Handle preparation status
      if (status === "preparing") {
        updateData.preparingStartedDate = timestamp();
      }

      // Update the order
      await orderRef.update(updateData);

      // Send status update notifications
      await this.sendStatusUpdateNotifications(
        orderId,
        status,
        order,
        newPaymentStatus
      );

      // Return updated order with full details
      return await this.getById(orderId);
    } catch (error) {
      console.error("Error updating order status:", error);
      throw error;
    }
  },

  /**
   * Update transaction status based on order payment status
   * @param {String} orderId - Order ID
   * @param {String} newPaymentStatus - New payment status
   * @param {String} transactionId - Transaction ID (optional)
   */
  async updateTransactionStatus(
    orderId,
    newPaymentStatus,
    transactionId = null
  ) {
    try {
      const TransactionModel = require("./transactionModel");

      // Map payment status to transaction status
      const paymentToTransactionStatusMap = {
        pending: "PENDING",
        processing: "PROCESSING",
        "paid-held-by-system": "PAID_HELD_BY_SYSTEM",
        "released-to-seller": "RELEASED_TO_SELLER",
        refunded: "REFUNDED",
        failed: "FAILED",
      };

      const transactionStatus = paymentToTransactionStatusMap[newPaymentStatus];
      if (!transactionStatus) {
        console.warn(
          `No transaction status mapping for payment status: ${newPaymentStatus}`
        );
        return;
      }

      // Find transaction by orderId or use provided transactionId
      let transaction;
      if (transactionId) {
        transaction = await TransactionModel.getById(transactionId);
      } else {
        const transactions = await TransactionModel.getByOrderId(orderId, {
          limit: 1,
        });
        transaction = transactions[0];
      }

      if (!transaction) {
        console.warn(`No transaction found for order: ${orderId}`);
        return;
      }

      // Update transaction status
    const result =  await TransactionModel.updateStatus(transaction.transactionId, {
        status: transactionStatus,
        chapaStatus: transactionStatus.toLowerCase().replace(/_/g, "-"),
      });
      console.log("Transaction update result:", result);

      console.log(
        `Transaction ${transaction.transactionId} status updated to ${transactionStatus}`
      );
    } catch (error) {
      console.error("Error updating transaction status:", error);
      // Don't throw error to avoid breaking order status update
    }
  },

  /**
   * Send payment status notifications
   * @param {Object} order - Order data
   * @param {String} paymentStatus - Payment status
   */
  async sendPaymentStatusNotifications(order, paymentStatus) {
    if (!this.notificationService) return;

    try {
      const paymentStatusMapping = {
        "paid-held-by-system": "success",
        "released-to-seller": "success",
        refunded: "refunded",
        failed: "failed",
        pending: "pending",
      };

      const mappedStatus = paymentStatusMapping[paymentStatus] || paymentStatus;

      // Notify buyer about payment status
      await this.notificationService.notifyPaymentStatus(
        order.buyerId,
        order.transactionId || order.orderId,
        mappedStatus,
        order.totalCost,
        order.orderId
      );

      // Notify seller when payment is released
      if (paymentStatus === "released-to-seller") {
        await this.notificationService.notifyPaymentStatus(
          order.sellerId,
          order.transactionId || order.orderId,
          "success",
          order.totalCost,
          order.orderId
        );
      }
    } catch (error) {
      console.error("Error sending payment status notifications:", error);
    }
  },

  /**
   * Determine appropriate payment status based on order status transition
   * @param {String} currentOrderStatus - Current order status
   * @param {String} newOrderStatus - New order status
   * @param {String} currentPaymentStatus - Current payment status
   * @returns {String|null} New payment status or null if no change needed
   */
  determinePaymentStatus(
    currentOrderStatus,
    newOrderStatus,
    currentPaymentStatus
  ) {
    // Payment status logic based on order status transitions
    const paymentRules = {
      // When order is confirmed, payment should be held by system
      confirmed: (currentPaymentStatus) => {
        if (
          currentPaymentStatus === "pending" ||
          currentPaymentStatus === "processing"
        ) {
          return "paid-held-by-system";
        }
        return null;
      },

      // When order is pickup-confirmed, release payment to seller
      "pickup-confirmed": (currentPaymentStatus) => {
        if (currentPaymentStatus === "paid-held-by-system") {
          return "released-to-seller";
        }
        return null;
      },

      // When order is delivered, also release payment to seller (backup rule)
      delivered: (currentPaymentStatus) => {
        if (currentPaymentStatus === "paid-held-by-system") {
          return "released-to-seller";
        }
        return null;
      },

      // When order is cancelled, refund if payment was held
      cancelled: (currentPaymentStatus) => {
        if (currentPaymentStatus === "paid-held-by-system") {
          return "refunded";
        }
        return null;
      },

      // When order is rejected by seller, refund if payment was held
      "rejected-by-seller": (currentPaymentStatus) => {
        if (currentPaymentStatus === "paid-held-by-system") {
          return "refunded";
        }
        return null;
      },

      // When order is disputed, keep payment held for resolution
      disputed: (currentPaymentStatus) => {
        // Payment status remains unchanged during dispute
        return null;
      },
    };

    const rule = paymentRules[newOrderStatus];
    return rule ? rule(currentPaymentStatus) : null;
  },


  /**
   * Cancel order with integrated payment handling
   * @param {String} orderId - Order ID
   * @param {String} userId - User cancelling the order
   * @param {String} reason - Cancellation reason
   * @returns {Object} Updated order
   */
  async cancelOrder(orderId, userId, reason = "") {
    try {
      const orderRef = ordersRef.doc(orderId);
      const orderDoc = await orderRef.get();

      if (!orderDoc.exists) {
        throw new Error("Order not found");
      }

      const order = orderDoc.data();

      // Validate permissions and status
      if (userId !== order.buyerId && userId !== order.sellerId) {
        throw new Error("Only buyer or seller can cancel orders");
      }

      // Check if order can be cancelled
      const nonCancellableStatuses = [
        "pickup-confirmed",
        "delivered",
        "completed",
        "cancelled",
      ];

      if (nonCancellableStatuses.includes(order.status)) {
        throw new Error(`Cannot cancel order with status: ${order.status}`);
      }

      const updateData = {
        status: "cancelled",
        cancelledAt: timestamp(),
        cancelledBy: userId,
        cancellationReason: reason,
        updatedAt: timestamp(),
      };

      // Automatically handle payment refund
      const newPaymentStatus = this.determinePaymentStatus(
        order.status,
        "cancelled",
        order.paymentStatus
      );
      if (newPaymentStatus) {
        updateData.paymentStatus = newPaymentStatus;

        if (newPaymentStatus === "refunded") {
          updateData.refundedAt = timestamp();
        }
          await this.updateTransactionStatus(orderId, newPaymentStatus, order.transactionId);

      }

      await orderRef.update(updateData);

      // Send cancellation notifications
      await this.sendCancellationNotifications(
        order,
        userId,
        reason,
        newPaymentStatus
      );

      return await this.getById(orderId);
    } catch (error) {
      console.error("Error cancelling order:", error);
      throw error;
    }
  },



  /**
   * Manual payment status update (for admin/system use only)
   * @param {String} orderId - Order ID
   * @param {String} paymentStatus - New payment status
   * @param {String} transactionId - Transaction ID (optional)
   * @returns {Object} Updated order
   */
  async updatePaymentStatus(orderId, paymentStatus, transactionId = null) {
    try {
      const orderRef = ordersRef.doc(orderId);
      const orderDoc = await orderRef.get();

      if (!orderDoc.exists) {
        throw new Error("Order not found");
      }

      const updateData = {
        paymentStatus,
        updatedAt: timestamp(),
      };

      if (transactionId) {
        updateData.transactionId = transactionId;
      }

      // Add specific timestamp fields based on payment status
      if (paymentStatus === "paid-held-by-system") {
        updateData.paidAt = timestamp();
      } else if (paymentStatus === "released-to-seller") {
        updateData.releasedToSellerAt = timestamp();
      } else if (paymentStatus === "refunded") {
        updateData.refundedAt = timestamp();
      }

      await orderRef.update(updateData);
      await this.updateTransactionStatus(orderId, paymentStatus, transactionId);

      await this.sendPaymentStatusNotifications(order, paymentStatus);

      return await this.getById(orderId);
    } catch (error) {
      console.error("Error updating payment status:", error);
      throw error;
    }
  },

  /**
   * Validate status transition
   * @param {String} currentStatus - Current order status
   * @param {String} newStatus - New status to transition to
   * @returns {Boolean} True if transition is valid
   */
  isValidStatusTransition(currentStatus, newStatus) {
    const validTransitions = {
      "pending-confirmation": ["confirmed", "rejected-by-seller", "cancelled"],
      confirmed: ["preparing", "cancelled"],
      preparing: ["ready-for-pickup", "cancelled"],
      "ready-for-pickup": ["pickup-scheduled", "pickup-confirmed", "cancelled"],
      "pickup-scheduled": ["pickup-confirmed", "cancelled"],
      "pickup-confirmed": ["completed"],
      delivered: ["completed"],
      completed: [], // No further transitions
      cancelled: [], // No further transitions
      disputed: ["resolved", "cancelled"],
    };

    return validTransitions[currentStatus]?.includes(newStatus) || false;
  },

};

module.exports = OrderModel;
