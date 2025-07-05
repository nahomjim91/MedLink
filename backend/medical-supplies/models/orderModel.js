// /models/orderModel.js
const { db } = require("../config/firebase");
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
        notes,
      } = orderData;

      // Validate required fields
      if (!orderId || !buyerId || !sellerId || !items || items.length === 0) {
        throw new Error("Missing required order fields");
      }

      // Create main order (existing logic)
      const order = {
        orderId,
        orderNumber: orderNumber || (await this.getNextOrderNumber()),
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
        status:
          this.convertStatusFromFrontend(status) || "pending-confirmation",
        paymentStatus:
          this.convertPaymentStatusFromFrontend(paymentStatus) || "pending",
        pickupScheduledDate: pickupScheduledDate
          ? new Date(pickupScheduledDate)
          : null,
        pickupConfirmedDate: pickupConfirmedDate
          ? new Date(pickupConfirmedDate)
          : null,
        transactionId,
        notes: notes || "",
        createdAt: timestamp(),
        updatedAt: timestamp(),
      };

      batch.set(ordersRef.doc(orderId), order);

      // Process items (existing logic)
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
          createdAt: item.createdAt ? new Date(item.createdAt) : timestamp(),
        };

        batch.set(orderItemsRef.doc(item.orderItemId), orderItem);

        // Process batch items (existing logic)
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
              subtotal:
                batchItem.subtotal || batchItem.quantity * batchItem.unitPrice,
              expiryDate: batchItem.expiryDate
                ? new Date(batchItem.expiryDate)
                : null,
              manufacturingDate: batchItem.manufacturingDate
                ? new Date(batchItem.manufacturingDate)
                : null,
              lotNumber: batchItem.lotNumber,
              batchSellerId: batchItem.batchSellerId,
              batchSellerName: batchItem.batchSellerName,
              createdAt: batchItem.createdAt
                ? new Date(batchItem.createdAt)
                : timestamp(),
            };

            batch.set(
              orderBatchItemsRef.doc(batchItem.orderBatchItemId),
              orderBatchItem
            );
          }
        }
      }
      // console.log("order befor notificion " , order);

      // Commit all changes
      await batch.commit();

      // Send notifications after successful order creation
      await this.sendOrderCreationNotifications(order, items);

      // Return complete order with items
      return await this.getById(orderId);
    } catch (error) {
      console.error("Error creating order:", error);
      throw error;
    }
  },

  async sendOrderCreationNotifications(order, items) {
    if (!this.notificationService) return;

    try {
      // Notify seller about new order
      await this.notificationService.notifyNewOrder(
        order.sellerId,
        order.orderId,
        {
          customerName: order.buyerName || order.buyerCompanyName,
          customerId: order.buyerId,
        },
        {
          items: items.map((item) => ({
            name: item.productName,
            quantity: item.totalQuantity,
            price: item.totalPrice,
          })),
          totalAmount: order.totalCost,
          urgentOrder: order.totalCost > 10000, // Mark as urgent if high value
        }
      );

      // Notify buyer about order confirmation
      await this.notificationService.notifyOrderStatus(
        order.buyerId,
        order.orderId,
        "pending",
        {
          orderNumber: order.orderNumber,
          sellerName: order.sellerName || order.sellerCompanyName,
          totalAmount: order.totalCost,
          estimatedDelivery: order.pickupScheduledDate,
        }
      );
    } catch (error) {
      console.error("Error sending order creation notifications:", error);
      // Don't throw error as this shouldn't fail the order creation
    }
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
   * Handle original product after transfer based on buyer type and conditions
   * @param {Object} originalProduct - Original product data
   * @param {Object} buyer - Buyer data
   * @param {Object} orderItem - Order item data
   * @param {Object} batch - Firestore batch
   * @param {String} transferType - Type of transfer
   */
  async handleOriginalProductAfterTransfer(
    originalProduct,
    buyer,
    orderItem,
    batch,
    transferType
  ) {
    try {
      const productRef = productsRef.doc(originalProduct.productId);
      const now = timestamp();

      // Check if buyer is a health healthcare-facility
      const isHealthFacility =
        buyer.role === "HEALTH_FACILITY" ||
        buyer.userType === "HEALTH_FACILITY" ||
        buyer.type === "HEALTH_FACILITY";

      // Check if all product quantity has been transferred
      const allQuantityTransferred = await this.isAllProductQuantityTransferred(
        originalProduct.productId,
        orderItem.totalQuantity
      );

      if (isHealthFacility) {
        console.log(
          `Deactivating original product ${originalProduct.productId} - buyer is health healthcare-facility`
        );

        // Deactivate the original product for health facilities
        batch.update(productRef, {
          isActive: false,
          lastUpdatedAt: now,
          deactivatedReason: `Transferred to health healthcare-facility: ${buyer.name} via ${transferType}`,
          deactivatedAt: now,
          deactivatedByOrder: orderItem.orderId,
          transferredToHealthFacility: true,
        });
      } else if (allQuantityTransferred) {
        console.log(
          `All quantity transferred for product ${originalProduct.productId}, marking as sold out`
        );

        // Mark as sold out if all quantity has been transferred
        batch.update(productRef, {
          isActive: false,
          lastUpdatedAt: now,
          deactivatedReason: `All inventory sold - transferred via ${transferType}`,
          deactivatedAt: now,
          soldOut: true,
          lastSoldOrder: orderItem.orderId,
        });
      } else {
        console.log(
          `Partial transfer for product ${originalProduct.productId}, keeping active`
        );

        // Just update the last activity timestamp for partial transfers
        batch.update(productRef, {
          lastUpdatedAt: now,
          lastTransferDate: now,
          lastTransferType: transferType,
        });
      }
    } catch (error) {
      console.error("Error handling original product after transfer:", error);
      throw error;
    }
  },

  /**
   * Check if all product quantity has been transferred
   * @param {String} productId - Product ID
   * @param {Number} transferredQuantity - Quantity being transferred
   * @returns {Boolean} True if all quantity is transferred
   */
  async isAllProductQuantityTransferred(productId, transferredQuantity) {
    try {
      // Get all active batches for this product
      const batchesSnapshot = await batchesRef
        .where("productId", "==", productId)
        .where("quantity", ">", 0)
        .get();

      if (batchesSnapshot.empty) {
        return true; // No active batches means all transferred
      }

      // Calculate total remaining quantity
      const totalRemainingQuantity = batchesSnapshot.docs
        .map((doc) => doc.data().quantity || 0)
        .reduce((sum, quantity) => sum + quantity, 0);

      // If remaining quantity equals or is less than what's being transferred,
      // it means all will be transferred
      return totalRemainingQuantity <= transferredQuantity;
    } catch (error) {
      console.error(
        "Error checking if all product quantity transferred:",
        error
      );
      return false; // Conservative approach - assume not all transferred if error
    }
  },

  /**
   * Find existing product owned by buyer that matches the original product
   * @param {String} buyerId - Buyer ID
   * @param {Object} originalProduct - Original product data
   * @returns {Object|null} Existing product or null
   */
  async findExistingBuyerProduct(buyerId, originalProduct) {
    try {
      // Search for products with matching name and key attributes
      let query = productsRef
        .where("ownerId", "==", buyerId)
        .where("name", "==", originalProduct.name)
        .where("productType", "==", originalProduct.productType)
        .where("isActive", "==", true);

      // Add category filter if available
      if (originalProduct.category) {
        query = query.where("category", "==", originalProduct.category);
      }

      const snapshot = await query.limit(1).get();

      if (snapshot.empty) {
        return null;
      }

      const existingProduct = formatDoc(snapshot.docs[0]);

      // Additional validation for drug products
      if (originalProduct.productType === "DRUG") {
        if (
          existingProduct.concentration !== originalProduct.concentration ||
          existingProduct.packageType !== originalProduct.packageType
        ) {
          return null; // Not a match for drugs if concentration/package differs
        }
      }

      // Additional validation for equipment products
      if (originalProduct.productType === "EQUIPMENT") {
        if (
          existingProduct.brandName !== originalProduct.brandName ||
          existingProduct.modelNumber !== originalProduct.modelNumber
        ) {
          return null; // Not a match for equipment if brand/model differs
        }
      }

      return existingProduct;
    } catch (error) {
      console.error("Error finding existing buyer product:", error);
      return null;
    }
  },

  /**
   * Create a copy of the product for the buyer
   * @param {Object} originalProduct - Original product data
   * @param {Object} buyer - Buyer data
   * @param {Object} batch - Firestore batch
   * @param {String} transferType - Type of transfer
   * @returns {Object} New product data
   */
  async createProductCopyForBuyer(
    originalProduct,
    buyer,
    batch,
    transferType = "pickup"
  ) {
    try {
      const newProductRef = productsRef.doc(); // Auto-generate ID
      const now = timestamp();

      const newProduct = {
        productId: newProductRef.id,
        productType: originalProduct.productType,
        name: originalProduct.name,
        originalListerId: originalProduct.originalListerId,
        originalListerName: originalProduct.originalListerName,
        ownerId: buyer.id,
        ownerName: buyer.companyName,
        category: originalProduct.category,
        description: originalProduct.description,
        imageList: originalProduct.imageList || [],
        isActive: true,
        createdAt: now,
        lastUpdatedAt: now,
        // Copy product-type specific fields
        ...(originalProduct.productType === "DRUG" && {
          packageType: originalProduct.packageType,
          concentration: originalProduct.concentration,
          requiresPrescription: originalProduct.requiresPrescription,
        }),
        ...(originalProduct.productType === "EQUIPMENT" && {
          brandName: originalProduct.brandName,
          modelNumber: originalProduct.modelNumber,
          warrantyInfo: originalProduct.warrantyInfo,
          sparePartInfo: originalProduct.sparePartInfo || [],
        }),
        // Add transfer metadata
        transferredFrom: originalProduct.productId,
        transferredAt: now,
        transferType: transferType,
        acquiredVia: transferType === "delivery" ? "delivery" : "pickup",
      };
      console.log("New product data:", newProduct);

      batch.set(newProductRef, newProduct);

      return newProduct;
    } catch (error) {
      console.error("Error creating product copy:", error);
      throw error;
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

          technicalSpecifications: originalBatch?.technicalSpecifications,
          userManuals: originalBatch?.userManuals || [],
          certification: originalBatch?.certification,
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
   * Extract serial numbers for equipment based on quantity
   * @param {Array} originalSerialNumbers - Original serial numbers
   * @param {Number} transferQuantity - Quantity being transferred
   * @param {Number} originalQuantity - Original batch quantity
   * @returns {Array} Serial numbers for the new batch
   */
  extractSerialNumbers(
    originalSerialNumbers,
    transferQuantity,
    originalQuantity
  ) {
    if (!originalSerialNumbers || originalSerialNumbers.length === 0) {
      return [];
    }

    // If transferring all items, return all serial numbers
    if (transferQuantity >= originalQuantity) {
      return [...originalSerialNumbers];
    }

    // If transferring partial quantity, return first N serial numbers
    return originalSerialNumbers.slice(0, Math.floor(transferQuantity));
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
      const { status } = options;

      let query = ordersRef.where("buyerId", "==", buyerId);

      if (status) {
        query = query.where("status", "==", status);
      }

      const ordersSnapshot = await query.orderBy("createdAt", "desc").get();
      // console.log("ordersSnapshot: ", ordersSnapshot.docs);

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
      const { status } = options;

      let query = ordersRef.where("sellerId", "==", sellerId);

      if (status) {
        query = query.where("status", "==", status);
      }

      const ordersSnapshot = await query.orderBy("createdAt", "desc").get();

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
  async getOrderSummaries(filter = {}) {
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

      const ordersSnapshot = await query.orderBy("createdAt", "desc").get();

      return formatDocs(ordersSnapshot.docs).map((order) => ({
        orderId: order.orderId,
        orderNumber: order.orderNumber,
        buyerName: order.buyerName,
        sellerName: order.sellerName,
        totalItems: order.totalItems,
        totalCost: order.totalCost,
        status: order.status,
        paymentStatus: order.paymentStatus,
        orderDate: order.orderDate,
        pickupScheduledDate: order.pickupScheduledDate,
      }));
    } catch (error) {
      console.error("Error getting order summaries:", error);
      throw error;
    }
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
      console.log(`Updating order ${orderId} status from ? to ${status}`);

      const orderRef = ordersRef.doc(orderId);
      const orderDoc = await orderRef.get();

      if (!orderDoc.exists) {
        throw new Error("Order not found");
      }

      const order = orderDoc.data();
      console.log(
        `Current order status: ${order.status}, payment status: ${order.paymentStatus}`
      );

      // Validate status transition and permissions
      if (!this.isValidStatusTransition(order.status, status)) {
        throw new Error(
          `Invalid status transition from ${order.status} to ${status}`
        );
      }

      // Check permissions
      if (status === "confirmed" || status === "rejected-by-seller") {
        console.log("userId: ", userId, "order sellerId: ", order.sellerId);
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

      console.log(
        `Determined new payment status: ${newPaymentStatus} (current: ${order.paymentStatus})`
      );

      if (newPaymentStatus && newPaymentStatus !== order.paymentStatus) {
        console.log(
          `Payment status will change from ${order.paymentStatus} to ${newPaymentStatus}`
        );
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

        console.log(`About to update transaction status for order ${orderId}`);
        // Update transaction status
        await this.updateTransactionStatus(
          orderId,
          newPaymentStatus,
          transactionId || order.transactionId
        );
        console.log(`Transaction status update completed for order ${orderId}`);
      } else {
        console.log(`No payment status change needed for order ${orderId}`);
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
      console.log(`Updating order ${orderId} with data:`, updateData);
      await orderRef.update(updateData);

      // Send status update notifications
      await this.sendStatusUpdateNotifications(
        orderId,
        status,
        order,
        newPaymentStatus
      );

      console.log(`Order ${orderId} status update completed successfully`);
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

      console.log(
        `Updating transaction status for order ${orderId} to payment status: ${newPaymentStatus}`
      );

      // Map payment status to transaction status (keeping database format with hyphens)
      const paymentToTransactionStatusMap = {
        pending: "pending",
        processing: "processing",
        "paid-held-by-system": "paid-held-by-system",
        "released-to-seller": "released-to-seller",
        refunded: "refunded",
        failed: "failed",
        cancelled: "cancelled",
      };

      const transactionStatus = paymentToTransactionStatusMap[newPaymentStatus];
      if (!transactionStatus) {
        console.warn(
          `No transaction status mapping for payment status: ${newPaymentStatus}`
        );
        return;
      }

      console.log(
        `Mapped payment status ${newPaymentStatus} to transaction status: ${transactionStatus}`
      );

      // Find transaction by orderId or use provided transactionId
      let transaction;
      if (transactionId) {
        transaction = await TransactionModel.getById(transactionId);
        console.log(`Found transaction by ID: ${transactionId}`, transaction);
      } else {
        const transactions = await TransactionModel.getByOrderId(orderId, {
          limit: 1,
        });
        transaction = transactions[0];
        console.log(`Found transaction by orderId: ${orderId}`, transaction);
      }

      if (!transaction) {
        console.warn(`No transaction found for order: ${orderId}`);
        return;
      }

      // Check if status actually needs updating
      if (transaction.status === transactionStatus) {
        console.log(
          `Transaction ${transaction.transactionId} already has status: ${transactionStatus}`
        );
        return;
      }

      // Update transaction status using the correct method signature
      // Based on your TransactionModel.updateStatus(transactionId, status, chapaRef = null)
      const result = await TransactionModel.updateStatus(
        transaction.transactionId,
        transactionStatus,
        transaction.chapaRef
      );

      console.log("Transaction update result:", result);
      console.log(
        `Transaction ${transaction.transactionId} status updated from ${transaction.status} to ${transactionStatus}`
      );

      return result;
    } catch (error) {
      console.error("Error updating transaction status:", error);
      console.error("Error details:", {
        orderId,
        newPaymentStatus,
        transactionId,
        stack: error.stack,
      });
      // Don't throw error to avoid breaking order status update
    }
  },

  /**
   * Send notifications when order status is updated
   * @param {String} orderId - Order ID
   * @param {String} newStatus - New order status
   * @param {Object} order - Original order data
   * @param {String} newPaymentStatus - New payment status (if changed)
   */
  async sendStatusUpdateNotifications(
    orderId,
    newStatus,
    order,
    newPaymentStatus = null
  ) {
    if (!this.notificationService) return;

    try {
      // Map internal status to user-friendly status
      const statusMapping = {
        "pending-confirmation": "pending",
        confirmed: "confirmed",
        preparing: "processing",
        "ready-for-pickup": "ready_for_pickup",
        "pickup-scheduled": "pickup_scheduled",
        "pickup-confirmed": "delivered",
        delivered: "delivered",
        completed: "completed",
        cancelled: "cancelled",
        "rejected-by-seller": "cancelled",
      };

      const mappedStatus = statusMapping[newStatus] || newStatus;

      // Notify buyer about status change
      await this.notificationService.notifyOrderStatus(
        order.buyerId,
        orderId,
        mappedStatus,
        {
          orderNumber: order.orderNumber,
          sellerName: order.sellerName || order.sellerCompanyName,
          totalAmount: order.totalCost,
          ...(newStatus === "pickup-scheduled" &&
            order.pickupScheduledDate && {
              estimatedDelivery: order.pickupScheduledDate,
            }),
          ...(newStatus === "ready-for-pickup" && {
            message:
              "Your order is ready for pickup. Please contact the seller to arrange collection.",
          }),
          ...(newStatus === "rejected-by-seller" && {
            message:
              "Your order has been declined by the seller. Please contact them for more information.",
          }),
        }
      );

      // Notify seller about relevant status changes
      if (["pickup-confirmed", "delivered", "completed"].includes(newStatus)) {
        await this.notificationService.createNotification(
          order.sellerId,
          "order_status",
          `Order ${order.orderNumber} has been ${newStatus.replace("-", " ")}`,
          {
            orderId,
            status: newStatus,
            buyerName: order.buyerName || order.buyerCompanyName,
            totalAmount: order.totalCost,
            actionUrl: `/orders/${orderId}`,
          },
          "normal"
        );
      }

      // Send payment status notifications if payment status changed
      if (newPaymentStatus && newPaymentStatus !== order.paymentStatus) {
        await this.sendPaymentStatusNotifications(order, newPaymentStatus);
      }
    } catch (error) {
      console.error("Error sending status update notifications:", error);
      // Don't throw error as this shouldn't fail the status update
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
   * Schedule pickup date with integrated payment handling
   * @param {String} orderId - Order ID
   * @param {Date} pickupDate - Scheduled pickup date
   * @param {String} userId - User scheduling the pickup
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

      // Validate permissions (buyer or seller can schedule)
      if (userId !== order.buyerId && userId !== order.sellerId) {
        throw new Error("Only buyer or seller can schedule pickup");
      }

      const updateData = {
        pickupScheduledDate: new Date(pickupDate),
        status: "pickup-scheduled",
        updatedAt: timestamp(),
        pickupScheduledBy: userId,
      };

      // Check if payment status needs to be updated
      const newPaymentStatus = this.determinePaymentStatus(
        order.status,
        "pickup-scheduled",
        order.paymentStatus
      );
      if (newPaymentStatus && newPaymentStatus !== order.paymentStatus) {
        updateData.paymentStatus = newPaymentStatus;

        if (newPaymentStatus === "paid-held-by-system") {
          updateData.paidAt = timestamp();
        }
      }

      await orderRef.update(updateData);
      await this.sendPickupSchedulingNotifications(order, pickupDate, userId);

      return await this.getById(orderId);
    } catch (error) {
      console.error("Error scheduling pickup:", error);
      throw error;
    }
  },

  /**
   * Send notifications when pickup is scheduled
   * @param {Object} order - Order data
   * @param {Date} pickupDate - Scheduled pickup date
   * @param {String} scheduledBy - User who scheduled the pickup
   */
  async sendPickupSchedulingNotifications(order, pickupDate, scheduledBy) {
    if (!this.notificationService) return;

    try {
      const formattedDate = new Date(pickupDate).toLocaleDateString();
      const schedulerName =
        scheduledBy === order.buyerId
          ? order.buyerName || order.buyerCompanyName
          : order.sellerName || order.sellerCompanyName;

      // Notify the other party about pickup scheduling
      const recipientId =
        scheduledBy === order.buyerId ? order.sellerId : order.buyerId;
      const recipientType = scheduledBy === order.buyerId ? "seller" : "buyer";

      await this.notificationService.createNotification(
        recipientId,
        "pickup_scheduled",
        `Pickup scheduled for order ${order.orderNumber} on ${formattedDate}`,
        {
          orderId: order.orderId,
          orderNumber: order.orderNumber,
          pickupDate: pickupDate,
          scheduledBy: schedulerName,
          schedulerType: scheduledBy === order.buyerId ? "buyer" : "seller",
          actionUrl: `/orders/${order.orderId}`,
          message: `The ${
            recipientType === "seller" ? "buyer" : "seller"
          } has scheduled pickup for ${formattedDate}. Please confirm availability.`,
        },
        "high"
      );

      // Send reminder to scheduler
      await this.notificationService.createNotification(
        scheduledBy,
        "pickup_confirmation",
        `Pickup scheduled for ${formattedDate} - Order ${order.orderNumber}`,
        {
          orderId: order.orderId,
          orderNumber: order.orderNumber,
          pickupDate: pickupDate,
          actionUrl: `/orders/${order.orderId}`,
          message:
            "Pickup has been scheduled. You will be notified when it's confirmed.",
        },
        "normal"
      );
    } catch (error) {
      console.error("Error sending pickup scheduling notifications:", error);
    }
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
        await this.updateTransactionStatus(
          orderId,
          newPaymentStatus,
          order.transactionId
        );
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
   * Send notifications when order is cancelled
   * @param {Object} order - Order data
   * @param {String} cancelledBy - User who cancelled the order
   * @param {String} reason - Cancellation reason
   * @param {String} paymentStatus - New payment status
   */
  async sendCancellationNotifications(
    order,
    cancelledBy,
    reason,
    paymentStatus
  ) {
    if (!this.notificationService) return;

    try {
      const cancellerName =
        cancelledBy === order.buyerId
          ? order.buyerName || order.buyerCompanyName
          : order.sellerName || order.sellerCompanyName;

      const cancellerType = cancelledBy === order.buyerId ? "buyer" : "seller";
      const otherPartyId =
        cancelledBy === order.buyerId ? order.sellerId : order.buyerId;

      // Notify the other party about cancellation
      await this.notificationService.createNotification(
        otherPartyId,
        "order_cancelled",
        `Order ${order.orderNumber} has been cancelled by ${cancellerType}`,
        {
          orderId: order.orderId,
          orderNumber: order.orderNumber,
          cancelledBy: cancellerName,
          cancellerType: cancellerType,
          reason: reason,
          totalAmount: order.totalCost,
          actionUrl: `/orders/${order.orderId}`,
          ...(paymentStatus === "refunded" && {
            refundMessage: "Refund will be processed within 3-5 business days.",
          }),
        },
        "urgent"
      );

      // Confirm cancellation to the person who cancelled
      await this.notificationService.createNotification(
        cancelledBy,
        "order_cancellation_confirmed",
        `Order ${order.orderNumber} has been successfully cancelled`,
        {
          orderId: order.orderId,
          orderNumber: order.orderNumber,
          reason: reason,
          totalAmount: order.totalCost,
          actionUrl: `/orders/${order.orderId}`,
          ...(paymentStatus === "refunded" && {
            refundMessage: "Refund will be processed within 3-5 business days.",
          }),
        },
        "high"
      );

      // Send payment refund notification if applicable
      if (paymentStatus === "refunded") {
        await this.notificationService.notifyPaymentStatus(
          order.buyerId,
          order.transactionId || order.orderId,
          "refunded",
          order.totalCost,
          order.orderId
        );
      }
    } catch (error) {
      console.error("Error sending cancellation notifications:", error);
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
      const order = orderDoc.data();

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

  /**
   * Delete order (admin only)
   * @param {String} orderId - Order ID
   * @returns {Boolean} Success status
   */
  async deleteOrder(orderId) {
    const batch = db.batch();

    try {
      // Delete order items
      const orderItemsSnapshot = await orderItemsRef
        .where("orderId", "==", orderId)
        .get();

      orderItemsSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // Delete order batch items
      const orderBatchItemsSnapshot = await orderBatchItemsRef
        .where("orderId", "==", orderId)
        .get();

      orderBatchItemsSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // Delete main order
      batch.delete(ordersRef.doc(orderId));

      await batch.commit();
      return true;
    } catch (error) {
      console.error("Error deleting order:", error);
      throw error;
    }
  },

  async getByStatus(status) {
    try {
      let query = ordersRef;

      if (status) {
        query = query.where("status", "==", status);
      }

      // Add orderBy to sort results (optional, but recommended)
      const ordersSnapshot = await query.orderBy("createdAt", "desc").get();

      // Optional: If you want full order details via getById (e.g., includes nested items)
      return await Promise.all(
        formatDocs(ordersSnapshot.docs).map(async (order) => {
          return await this.getById(order.orderId);
        })
      );

      // If you just want raw documents (without deeper info), use:
      // return ordersSnapshot.docs.map((doc) => doc.data());
    } catch (error) {
      console.error("Error getting orders by status:", error);
      throw error;
    }
  },
};

module.exports = OrderModel;
