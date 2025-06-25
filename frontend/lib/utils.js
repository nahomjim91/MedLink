// models/BatchModel.js
const { db, admin } = require("../config/firebase");
const {
  formatDoc,
  formatDocs,
  sanitizeInput,
  timestamp,
  paginationParams,
} = require("../../utils/helpers");
const { createNotificationService } = require("../service/notificationService");
const batchesRef = db.collection("batches");
const productsRef = db.collection("products");
const usersRef = db.collection("msUsers");
const BatchModel = {
  notificationService: null,

  setNotificationService(io) {
    this.notificationService = createNotificationService(io);
  },
  async create(batchData, productType) {
    try {
      // Verify product exists
      const productDoc = await productsRef.doc(batchData.productId).get();
      if (!productDoc.exists) {
        throw new Error(`Product with ID ${batchData.productId} not found.`);
      }

      if (productDoc.data().productType !== productType) {
        throw new Error(
          `Product type mismatch (expected ${productType}, got ${
            productDoc.data().productType
          }).`
        );
      }
      const sanitizedData = sanitizeInput(batchData);
      const now = timestamp();

      const newBatchRef = batchesRef.doc();
      const newBatch = {
        batchId: newBatchRef.id,
        ...sanitizedData,
        productType: productType,
        addedAt: now,
        lastUpdatedAt: now,
      };

      // Handle expiryDate conversion
      if (
        newBatch.expiryDate &&
        !(newBatch.expiryDate instanceof admin.firestore.Timestamp) &&
        !newBatch.expiryDate.toDate
      ) {
        try {
          newBatch.expiryDate = admin.firestore.Timestamp.fromDate(
            new Date(newBatch.expiryDate)
          );
        } catch (dateError) {
          throw new Error(
            "Invalid expiryDate format. Please use a valid date string or timestamp."
          );
        }
      }

      await newBatchRef.set(newBatch);
      const doc = await newBatchRef.get();
      const formattedDoc = formatDoc(doc);

      if (formattedDoc) {
        formattedDoc.productType = productType;

        const productData = productDoc.data();
        formattedDoc.product = {
          productId: batchData.productId,
          productType: productType,
          name: productData.name,
          originalListerId: productData.originalListerId,
          originalListerName: productData.originalListerName,
          isActive: productData.isActive,
          createdAt: productData.createdAt,
          lastUpdatedAt: productData.lastUpdatedAt,
          ownerId: productData.ownerId || productData.originalListerId,
          ownerName: productData.ownerName || productData.originalListerName,
        };

        // Send notification to product owner about new batch
        await this.notifyBatchCreated(
          productData.ownerId || productData.originalListerId,
          formattedDoc,
          productData
        );

        // Check if batch is expiring soon and notify
        await this.checkAndNotifyExpiringBatch(formattedDoc, productData);
      }

      return formattedDoc;
    } catch (error) {
      console.error("Error creating batch:", error);
      throw error;
    }
  },

  async getById(batchId) {
    try {
      const doc = await batchesRef.doc(batchId).get();
      const batch = formatDoc(doc);
      if (batch) {
        // Optionally enrich with productType if needed by resolver/client directly
        const productDoc = await productsRef.doc(batch.productId).get();
        if (productDoc.exists) {
          batch.productType = productDoc.data().productType;
        }
      }
      return batch;
    } catch (error) {
      console.error("Error getting batch by ID:", error);
      throw error;
    }
  },

  async getByProductId(
    productId,
    { limit, offset, sortBy = "addedAt", sortOrder = "desc" }
  ) {
    try {
      // Guard against invalid productId
      if (!productId) {
        console.warn("getByProductId called with invalid productId");
        return [];
      }

      const { limit: limitVal, offset: offsetVal } = paginationParams(
        limit,
        offset
      );

      let query = batchesRef
        .where("productId", "==", productId)
        .orderBy(sortBy, sortOrder);

      if (offsetVal > 0) {
        const offsetSnapshot = await query.limit(offsetVal).get();
        
        if (!offsetSnapshot.empty) {
          const lastVisible =
            offsetSnapshot.docs[offsetSnapshot.docs.length - 1];
          query = query.startAfter(lastVisible);
        }
      }

      const snapshot = await query.limit(limitVal).get();
      const results = snapshot.empty ? [] : formatDocs(snapshot.docs);

      // Get product type to add to each batch
      let productType = null;
      try {
        const productDoc = await productsRef.doc(productId).get();
        
        if (productDoc.exists) {
          productType = productDoc.data().productType;
        }
      } catch (err) {
        console.error("Error fetching product type:", err);
      }

      // Add productType to each batch if available
      const enrichedResults = results.map((batch) => ({
        ...batch,
        productType: productType || batch.productType,
      }));
      
      return enrichedResults;
    } catch (error) {
      console.error("Error getting batches by product ID:", error);
      return [];
    }
  },

  async getAll({ limit, offset, sortBy = "addedAt", sortOrder = "desc" }) {
    try {
      const { limit: limitVal, offset: offsetVal } = paginationParams(
        limit,
        offset
      );
      let query = batchesRef.orderBy(sortBy, sortOrder);

      if (offsetVal > 0) {
        const offsetSnapshot = await query.limit(offsetVal).get();
        if (!offsetSnapshot.empty) {
          const lastVisible =
            offsetSnapshot.docs[offsetSnapshot.docs.length - 1];
          query = query.startAfter(lastVisible);
        }
      }

      const snapshot = await query.limit(limitVal).get();
      return snapshot.empty ? [] : formatDocs(snapshot.docs);
    } catch (error) {
      console.error("Error getting all batches:", error);
      return [];
    }
  },


  async update(batchId, updateData) {
    try {
      const batchRef = batchesRef.doc(batchId);
      const doc = await batchRef.get();
      if (!doc.exists) {
        throw new Error("Batch not found");
      }

      const oldBatchData = doc.data();
      const sanitizedData = sanitizeInput(updateData);
      const updatedBatch = {
        ...sanitizedData,
        lastUpdatedAt: timestamp(),
      };

      // Handle expiryDate conversion for updates
      if (
        updatedBatch.expiryDate &&
        !(updatedBatch.expiryDate instanceof admin.firestore.Timestamp) &&
        !updatedBatch.expiryDate.toDate
      ) {
        try {
          updatedBatch.expiryDate = admin.firestore.Timestamp.fromDate(
            new Date(updatedBatch.expiryDate)
          );
        } catch (dateError) {
          throw new Error(
            "Invalid expiryDate format for update. Please use a valid date string or timestamp."
          );
        }
      }

      await batchRef.update(updatedBatch);
      const updatedDoc = await batchRef.get();
      const formattedDoc = formatDoc(updatedDoc);
      
      if (formattedDoc) {
        // Add productType hint
        const productDoc = await productsRef.doc(formattedDoc.productId).get();
        if (productDoc.exists) {
          formattedDoc.productType = productDoc.data().productType;
          const productData = productDoc.data();

          // Send notification about batch update
          await this.notifyBatchUpdated(
            productData.ownerId || productData.originalListerId,
            formattedDoc,
            oldBatchData,
            updateData,
            productData
          );

          // Check if updated batch is now expiring soon
          await this.checkAndNotifyExpiringBatch(formattedDoc, productData);
        }
      }
      
      return formattedDoc;
    } catch (error) {
      console.error("Error updating batch:", error);
      throw error;
    }
  },

  async delete(batchId) {
    try {
      const batchRef = batchesRef.doc(batchId);
      const doc = await batchRef.get();
      if (!doc.exists) {
        throw new Error("Batch not found for deletion");
      }

      const batchData = doc.data();
      
      // Get product info for notification
      const productDoc = await productsRef.doc(batchData.productId).get();
      let productData = null;
      if (productDoc.exists) {
        productData = productDoc.data();
      }

      await batchRef.delete();

      // Send notification about batch deletion
      if (productData) {
        await this.notifyBatchDeleted(
          productData.ownerId || productData.originalListerId,
          batchData,
          productData
        );
      }

      return true;
    } catch (error) {
      console.error("Error deleting batch:", error);
      throw error;
    }
  },

  // Notification methods
  async notifyBatchCreated(userId, batchData, productData) {
    if (!this.notificationService || !userId) return;

    try {
      const message = `New batch added for ${productData.name}`;
      const metadata = {
        batchId: batchData.batchId,
        productId: batchData.productId,
        productName: productData.name,
        quantity: batchData.quantity,
        actionUrl: `/products/${batchData.productId}/batches`,
        batchNumber: batchData.batchNumber || batchData.batchId,
      };

      await this.notificationService.createNotification(
        userId,
        "batch_created",
        message,
        metadata,
        "normal"
      );
    } catch (error) {
      console.error("Error sending batch created notification:", error);
    }
  },

  async notifyBatchUpdated(userId, newBatchData, oldBatchData, updateData, productData) {
    if (!this.notificationService || !userId) return;

    try {
      // Determine what was updated
      const changes = [];
      if (updateData.quantity && updateData.quantity !== oldBatchData.quantity) {
        changes.push(`quantity: ${oldBatchData.quantity} → ${updateData.quantity}`);
      }
      if (updateData.expiryDate) {
        changes.push('expiry date updated');
      }
      if (updateData.location && updateData.location !== oldBatchData.location) {
        changes.push(`location: ${updateData.location}`);
      }

      const changeText = changes.length > 0 ? ` (${changes.join(', ')})` : '';
      const message = `Batch updated for ${productData.name}${changeText}`;

      const metadata = {
        batchId: newBatchData.batchId,
        productId: newBatchData.productId,
        productName: productData.name,
        changes: updateData,
        actionUrl: `/products/${newBatchData.productId}/batches`,
        batchNumber: newBatchData.batchNumber || newBatchData.batchId,
      };

      // Use higher priority if quantity significantly changed
      const priority = updateData.quantity && 
        Math.abs(updateData.quantity - oldBatchData.quantity) > (oldBatchData.quantity * 0.5) 
        ? "high" : "normal";

      await this.notificationService.createNotification(
        userId,
        "batch_updated",
        message,
        metadata,
        priority
      );
    } catch (error) {
      console.error("Error sending batch updated notification:", error);
    }
  },

  async notifyBatchDeleted(userId, batchData, productData) {
    if (!this.notificationService || !userId) return;

    try {
      const message = `Batch removed from ${productData.name}`;
      const metadata = {
        batchId: batchData.batchId,
        productId: batchData.productId,
        productName: productData.name,
        quantity: batchData.quantity,
        actionUrl: `/products/${batchData.productId}/batches`,
        batchNumber: batchData.batchNumber || batchData.batchId,
      };

      await this.notificationService.createNotification(
        userId,
        "batch_deleted",
        message,
        metadata,
        "normal"
      );
    } catch (error) {
      console.error("Error sending batch deleted notification:", error);
    }
  },

  async checkAndNotifyExpiringBatch(batchData, productData) {
    if (!this.notificationService || !batchData.expiryDate) return;

    try {
      const now = new Date();
      const expiryDate = batchData.expiryDate.toDate ? batchData.expiryDate.toDate() : new Date(batchData.expiryDate);
      const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

      // Notify if expiring within 7 days
      if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
        const message = daysUntilExpiry === 1 
          ? `Batch for ${productData.name} expires tomorrow!`
          : `Batch for ${productData.name} expires in ${daysUntilExpiry} days`;

        const priority = daysUntilExpiry <= 2 ? "urgent" : daysUntilExpiry <= 5 ? "high" : "normal";

        const metadata = {
          batchId: batchData.batchId,
          productId: batchData.productId,
          productName: productData.name,
          expiryDate: expiryDate.toISOString(),
          daysUntilExpiry,
          actionUrl: `/products/${batchData.productId}/batches`,
          batchNumber: batchData.batchNumber || batchData.batchId,
        };

        await this.notificationService.createNotification(
          productData.ownerId || productData.originalListerId,
          "batch_expiring",
          message,
          metadata,
          priority
        );
      }
      // Notify if already expired
      else if (daysUntilExpiry <= 0) {
        const message = `Batch for ${productData.name} has expired!`;
        
        const metadata = {
          batchId: batchData.batchId,
          productId: batchData.productId,
          productName: productData.name,
          expiryDate: expiryDate.toISOString(),
          daysOverdue: Math.abs(daysUntilExpiry),
          actionUrl: `/products/${batchData.productId}/batches`,
          batchNumber: batchData.batchNumber || batchData.batchId,
        };

        await this.notificationService.createNotification(
          productData.ownerId || productData.originalListerId,
          "batch_expired",
          message,
          metadata,
          "urgent"
        );
      }
    } catch (error) {
      console.error("Error checking batch expiry:", error);
    }
  },

  // Method to notify low stock based on batch quantities
  async checkAndNotifyLowStock(productId) {
    if (!this.notificationService) return;

    try {
      // Get all batches for this product
      const batchesSnapshot = await batchesRef
        .where("productId", "==", productId)
        .get();

      if (batchesSnapshot.empty) return;

      // Calculate total available quantity
      let totalQuantity = 0;
      batchesSnapshot.docs.forEach(doc => {
        const batch = doc.data();
        if (batch.quantity && batch.quantity > 0) {
          totalQuantity += batch.quantity;
        }
      });

      // Get product details
      const productDoc = await productsRef.doc(productId).get();
      if (!productDoc.exists) return;

      const productData = productDoc.data();
      const minimumStock = productData.minimumStock || 10; // Default minimum stock

      // Check if stock is low
      if (totalQuantity <= minimumStock) {
        await this.notificationService.notifyLowInventory(
          productData.ownerId || productData.originalListerId,
          {
            productId,
            productName: productData.name,
            currentStock: totalQuantity,
            minimumStock,
          }
        );
      }
    } catch (error) {
      console.error("Error checking low stock:", error);
    }
  },

  // Method to send bulk notifications for expiring batches (can be called by a cron job)
  async notifyAllExpiringBatches() {
    if (!this.notificationService) return;

    try {
      const now = new Date();
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      // Get batches expiring within 7 days
      const expiringBatchesSnapshot = await batchesRef
        .where("expiryDate", "<=", admin.firestore.Timestamp.fromDate(sevenDaysFromNow))
        .where("expiryDate", ">", admin.firestore.Timestamp.fromDate(now))
        .get();

      const notificationPromises = expiringBatchesSnapshot.docs.map(async (doc) => {
        const batchData = { ...doc.data(), batchId: doc.id };
        
        try {
          const productDoc = await productsRef.doc(batchData.productId).get();
          if (productDoc.exists) {
            await this.checkAndNotifyExpiringBatch(batchData, productDoc.data());
          }
        } catch (error) {
          console.error(`Error processing expiring batch ${doc.id}:`, error);
        }
      });

      await Promise.allSettled(notificationPromises);
      console.log(`Processed ${expiringBatchesSnapshot.size} expiring batches`);
    } catch (error) {
      console.error("Error notifying expiring batches:", error);
    }
  },
};

module.exports = BatchModel;