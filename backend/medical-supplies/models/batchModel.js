// models/BatchModel.js
const { db ,admin} = require('../../config/firebase');
const { formatDoc, formatDocs, sanitizeInput, timestamp, paginationParams } = require('../../utils/helpers'); 

const batchesRef = db.collection('batches');
const productsRef = db.collection('products'); // To verify product exists and get its type

const BatchModel = {
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
      console.error('Error getting batch by ID:', error);
      throw error;
    }
  },

  async getByProductId(productId, { limit, offset, sortBy = 'addedAt', sortOrder = 'desc' }) {
    try {
      const { limit: limitVal, offset: offsetVal } = paginationParams(limit, offset);
      let query = batchesRef.where('productId', '==', productId)
                          .orderBy(sortBy, sortOrder);

      if (offsetVal > 0) {
        const offsetSnapshot = await query.limit(offsetVal).get();
        if (!offsetSnapshot.empty) {
            const lastVisible = offsetSnapshot.docs[offsetSnapshot.docs.length - 1];
            query = query.startAfter(lastVisible);
        }
      }
      
      const snapshot = await query.limit(limitVal).get();
      // Optionally enrich with productType here as well if needed for all items in a list
      // For performance, it might be better to pass productType from the calling context (e.g., resolver)
      return formatDocs(snapshot.docs);
    } catch (error) {
      console.error('Error getting batches by product ID:', error);
      throw error;
    }
  },

  async getAll({ limit, offset, sortBy = 'addedAt', sortOrder = 'desc' }) {
    try {
        const { limit: limitVal, offset: offsetVal } = paginationParams(limit, offset);
        let query = batchesRef.orderBy(sortBy, sortOrder);

        if (offsetVal > 0) {
            const offsetSnapshot = await query.limit(offsetVal).get();
            if (!offsetSnapshot.empty) {
                const lastVisible = offsetSnapshot.docs[offsetSnapshot.docs.length - 1];
                query = query.startAfter(lastVisible);
            }
        }

        const snapshot = await query.limit(limitVal).get();
        return formatDocs(snapshot.docs);
    } catch (error)
    {
        console.error('Error getting all batches:', error);
        throw error;
    }
  },

  async create(batchData, productType) { // productType helps to validate specific fields
    try {
      // Verify product exists
      const productDoc = await productsRef.doc(batchData.productId).get();
      if (!productDoc.exists || productDoc.data().productType !== productType) {
        throw new Error(`Product with ID ${batchData.productId} not found or product type mismatch (expected ${productType}).`);
      }

      const sanitizedData = sanitizeInput(batchData);
      const now = timestamp();
      
      const newBatchRef = batchesRef.doc(); // Auto-generate ID
      const newBatch = {
        batchId: newBatchRef.id, // Store the ID within the document
        ...sanitizedData,
        addedAt: now,
        // Firestore Timestamps for dates like expiryDate should be Firestore Timestamp objects
        // If expiryDate is coming as string/number, convert it:
        // expiryDate: admin.firestore.Timestamp.fromDate(new Date(sanitizedData.expiryDate))
      };
      
      // Ensure expiryDate is a Firestore Timestamp if provided
      if (newBatch.expiryDate && !(newBatch.expiryDate instanceof admin.firestore.Timestamp) && !(newBatch.expiryDate.toDate)) {
          try {
              newBatch.expiryDate = admin.firestore.Timestamp.fromDate(new Date(newBatch.expiryDate));
          } catch (dateError) {
              throw new Error('Invalid expiryDate format. Please use a valid date string or timestamp.');
          }
      }


      await newBatchRef.set(newBatch);
      const doc = await newBatchRef.get();
      const formattedDoc = formatDoc(doc);
      if (formattedDoc) formattedDoc.productType = productType; // Add productType hint
      return formattedDoc;
    } catch (error) {
      console.error('Error creating batch:', error);
      throw error;
    }
  },

  async update(batchId, updateData) {
    try {
      const batchRef = batchesRef.doc(batchId);
      const doc = await batchRef.get();
      if (!doc.exists) {
        throw new Error('Batch not found');
      }

      const sanitizedData = sanitizeInput(updateData);
      const updatedBatch = {
        ...sanitizedData,
        // lastUpdatedAt: timestamp(), // Batches table doesn't have lastUpdatedAt, but could be added
      };

      // Ensure expiryDate is a Firestore Timestamp if provided and being updated
      if (updatedBatch.expiryDate && !(updatedBatch.expiryDate instanceof admin.firestore.Timestamp) && !(updatedBatch.expiryDate.toDate)) {
        try {
            updatedBatch.expiryDate = admin.firestore.Timestamp.fromDate(new Date(updatedBatch.expiryDate));
        } catch (dateError) {
            throw new Error('Invalid expiryDate format for update. Please use a valid date string or timestamp.');
        }
      }


      await batchRef.update(updatedBatch);
      const updatedDoc = await batchRef.get();
      const formattedDoc = formatDoc(updatedDoc);
      if (formattedDoc) { // Add productType hint if possible by fetching product
        const productDoc = await productsRef.doc(formattedDoc.productId).get();
        if (productDoc.exists) {
            formattedDoc.productType = productDoc.data().productType;
        }
      }
      return formattedDoc;
    } catch (error) {
      console.error('Error updating batch:', error);
      throw error;
    }
  },

  async delete(batchId) {
    try {
      const batchRef = batchesRef.doc(batchId);
      const doc = await batchRef.get();
      if (!doc.exists) {
        throw new Error('Batch not found for deletion');
      }
      await batchRef.delete();
      return true;
    } catch (error) {
      console.error('Error deleting batch:', error);
      throw error;
    }
  }
};

module.exports = BatchModel;