// models/ProductModel.js
const { db } = require("../config/firebase");
const {
  formatDoc,
  formatDocs,
  sanitizeInput,
  timestamp,
  paginationParams,
  formatDistanceText,
  calculateDistance,
} = require("../../utils/helpers");
const { createNotificationService } = require("../service/notificationService");
const MSUserModel = require("./msUser");

const productsRef = db.collection("products");
const batchesRef = db.collection("batches");
const orderItemsRef = db.collection("orderItems");

const ProductModel = {
  notificationService: null,

  setNotificationService(io) {
    this.notificationService = createNotificationService(io);
  },

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

      if (userId) {
        query = query.where("ownerId", "==", userId);
      }

      if (productType && productType.trim() !== "") {
        query = query.where("productType", "==", productType);
      }

      if (category && category.trim() !== "") {
        query = query.where("category", "==", category);
      }

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
      return results;
    } catch (error) {
      console.error("Error getting user products:", error);
      throw error;
    }
  },

  async addDistanceToProducts(products, currentUserId) {
    try {
      // Get current user's location
      const currentUser = await MSUserModel.getById(currentUserId);
      if (!currentUser?.address?.geoLocation) {
        console.log(
          "=== DEBUG: Current user has no geo location, skipping distance calculation"
        );
        // Return products with null distance if current user has no location
        return products.map((product) => ({
          ...product,
          distance: null,
          distanceText: "Location not available",
        }));
      }

      const currentUserLat = currentUser.address.geoLocation.latitude;
      const currentUserLon = currentUser.address.geoLocation.longitude;

      console.log(
        `=== DEBUG: Current user location: ${currentUserLat}, ${currentUserLon}`
      );

      // Process products in batches to avoid overwhelming the system
      const productsWithDistance = [];
      const batchSize = 10;

      for (let i = 0; i < products.length; i += batchSize) {
        const batch = products.slice(i, i + batchSize);

        const batchPromises = batch.map(async (product) => {
          try {
            // Get product owner's location
            const owner = await MSUserModel.getById(product.ownerId);

            if (!owner?.address?.geoLocation) {
              console.log(
                `=== DEBUG: Owner ${product.ownerId} has no geo location`
              );
              return {
                ...product,
                distance: null,
                distanceText: "Owner location not available",
              };
            }

            const ownerLat = owner.address.geoLocation.latitude;
            const ownerLon = owner.address.geoLocation.longitude;

            // Calculate distance
            const distance = calculateDistance(
              currentUserLat,
              currentUserLon,
              ownerLat,
              ownerLon
            );

            const roundedDistance = Math.round(distance * 100) / 100;

            return {
              ...product,
              distance: roundedDistance,
              distanceText: formatDistanceText(roundedDistance),
            };
          } catch (error) {
            console.error(
              `=== DEBUG: Error calculating distance for product ${product.productId}:`,
              error
            );
            return {
              ...product,
              distance: null,
              distanceText: "Distance calculation failed",
            };
          }
        });

        const batchResults = await Promise.all(batchPromises);
        productsWithDistance.push(...batchResults);
      }

      console.log(
        `=== DEBUG: Added distance to ${productsWithDistance.length} products`
      );
      return productsWithDistance;
    } catch (error) {
      console.error("=== DEBUG: Error in addDistanceToProducts:", error);
      // Return original products without distance if there's an error
      return products.map((product) => ({
        ...product,
        distance: null,
        distanceText: "Distance calculation error",
      }));
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
      sortByDistance = false, // New parameter to enable distance sorting
      maxDistance = null, // Optional: filter by maximum distance in km
    },
    currentUserId
  ) {
    try {
      // Get current user's role
      console.log("Current user ID:", currentUserId);
      const userDoc = await MSUserModel.getById(currentUserId);
      const currentUserRole = userDoc?.role;

      console.log("Current user role:", currentUserRole);
      // console.log("User doc:", userDoc);

      const { limit: limitVal, offset: offsetVal } = paginationParams(
        limit,
        offset
      );

      let query = productsRef;

      if (productType && productType.trim() !== "") {
        query = query.where("productType", "==", productType);
      }

      // Only apply Firestore ordering if not sorting by distance
      if (!sortByDistance) {
        query = query.orderBy(sortBy, sortOrder);
      }

      let snapshot = await query.get();
      let allProducts = formatDocs(snapshot.docs);

      // Filter out current user's own products
      if (currentUserId) {
        const beforeFilter = allProducts.length;
        allProducts = allProducts.filter(
          (product) => product.ownerId !== currentUserId
        );
      }

      // Filter by active products
      const beforeActiveFilter = allProducts.length;
      allProducts = allProducts.filter((product) => product.isActive === true);

      // Role-based filtering
      if (currentUserRole) {
        const allowedOwnerIds = await this.getAllowedOwnerIds(
          currentUserRole,
          currentUserId
        );

        if (allowedOwnerIds.length > 0) {
          const beforeRoleFilter = allProducts.length;

          // Log some product owner IDs for debugging

          allProducts = allProducts.filter((product) => {
            const isAllowed = allowedOwnerIds.includes(product.ownerId);
            if (!isAllowed) {
            }
            return isAllowed;
          });
        } else {
          return [];
        }
      }

      // Check for valid batches
      const hasValidBatches = async (product) => {
        try {
          const batchQuery = batchesRef.where(
            "productId",
            "==",
            product.productId
          );
          const batchesSnapshot = await batchQuery.get();
          const batches = formatDocs(batchesSnapshot.docs);

          const hasValid = batches.some(
            (batch) => batch.sellingPrice && batch.sellingPrice > 0
          );

          return hasValid;
        } catch (error) {
          console.error(
            `Error checking batches for product ${product.productId}:`,
            error
          );
          return false;
        }
      };

      const validProducts = [];
      const batchSize = 10;
      for (let i = 0; i < allProducts.length; i += batchSize) {
        const batch = allProducts.slice(i, i + batchSize);
        const batchPromises = batch.map(async (product) => {
          const isValid = await hasValidBatches(product);
          return isValid ? product : null;
        });

        const batchResults = await Promise.all(batchPromises);
        validProducts.push(
          ...batchResults.filter((product) => product !== null)
        );
      }

      // Add distance information to all valid products
      let productsWithDistance = await this.addDistanceToProducts(
        validProducts,
        currentUserId
      );

      // Filter by maximum distance if specified
      if (maxDistance !== null && maxDistance > 0) {
        const beforeDistanceFilter = productsWithDistance.length;
        productsWithDistance = productsWithDistance.filter(
          (product) =>
            product.distance !== null && product.distance <= maxDistance
        );
        // console.log(
        //   `=== DEBUG: After distance filtering (${maxDistance}km): ${
        //     productsWithDistance.length
        //   } (removed ${beforeDistanceFilter - productsWithDistance.length})`
        // );
      }

      // Handle search term filtering
      let finalProducts = productsWithDistance;

      if (searchTerm && searchTerm.trim() !== "") {
        const lowerSearchTerm = searchTerm.toLowerCase().trim();
        const matchingProducts = [];
        const processedProductIds = new Set();

        const productMatchesSearch = (product) => {
          if (product.name?.toLowerCase().includes(lowerSearchTerm))
            return true;
          if (product.description?.toLowerCase().includes(lowerSearchTerm))
            return true;
          if (product.category?.toLowerCase().includes(lowerSearchTerm))
            return true;

          if (product.productType === "DRUG") {
            if (product.concentration?.toLowerCase().includes(lowerSearchTerm))
              return true;
            if (product.packageType?.toLowerCase().includes(lowerSearchTerm))
              return true;
          }

          if (product.productType === "EQUIPMENT") {
            if (product.brandName?.toLowerCase().includes(lowerSearchTerm))
              return true;
            if (product.modelNumber?.toLowerCase().includes(lowerSearchTerm))
              return true;
          }

          return false;
        };

        for (const product of productsWithDistance) {
          if (productMatchesSearch(product)) {
            if (!processedProductIds.has(product.productId)) {
              matchingProducts.push(product);
              processedProductIds.add(product.productId);
            }
          }
        }

        finalProducts = matchingProducts;
        // console.log(
        //   `=== DEBUG: After search filtering: ${finalProducts.length} products match search term`
        // );
      }

      // Sort products
      if (sortByDistance) {
        // Sort by distance (closest first), with null distances at the end
        finalProducts.sort((a, b) => {
          if (a.distance === null && b.distance === null) return 0;
          if (a.distance === null) return 1;
          if (b.distance === null) return -1;
          return a.distance - b.distance;
        });
        ////////// console.log("=== DEBUG: Products sorted by distance");
      } else {
        // Apply original sorting
        finalProducts.sort((a, b) => {
          const aValue = a[sortBy];
          const bValue = b[sortBy];

          if (sortOrder === "asc") {
            return aValue > bValue ? 1 : -1;
          } else {
            return aValue < bValue ? 1 : -1;
          }
        });
        // console.log(`=== DEBUG: Products sorted by ${sortBy} ${sortOrder}`);
      }

      // Apply pagination
      const paginatedResults = finalProducts.slice(
        offsetVal,
        offsetVal + limitVal
      );

      // console.log(`=== DEBUG: Final results count: ${paginatedResults.length}`);
      // console.log(
      //   "=== DEBUG: Sample results with distance:",
      //   paginatedResults.slice(0, 3).map((p) => ({
      //     productId: p.productId,
      //     name: p.name,
      //     distance: p.distance,
      //     distanceText: p.distanceText,
      //   }))
      // );

      return paginatedResults;
    } catch (error) {
      console.error("Error searching products:", error);
      throw error;
    }
  },

  // Debug version of getAllowedOwnerIds with detailed logging
  async getAllowedOwnerIds(currentUserRole, currentUserId) {
    try {
      // console.log(
      //   `=== DEBUG: Getting allowed owners for role: ${currentUserRole}`
      // );

      let allowedOwnerIds = [];

      switch (currentUserRole) {
        case "supplier":
          ////////// console.log("=== DEBUG: Fetching importers and suppliers");
          allowedOwnerIds = await MSUserModel.getUserIdsByRoles([
            "importer",
            "supplier",
          ]);
          break;

        case "healthcare-facility":
          //////// console.log("=== DEBUG: Fetching suppliers only");
          allowedOwnerIds = await MSUserModel.getUserIdsByRoles(["supplier"]);
          break;

        case "importer":
          //////// console.log("=== DEBUG: Fetching importers and suppliers");
          allowedOwnerIds = await MSUserModel.getUserIdsByRoles([
            "importer",
            "supplier",
          ]);
          break;

        default:
          console.warn(`Unknown user role: ${currentUserRole}`);
          return [];
      }

      // console.log(
      //   `=== DEBUG: Found ${allowedOwnerIds.length} users with allowed roles:`,
      //   allowedOwnerIds
      // );

      // Remove current user from allowed owners
      const filteredIds = allowedOwnerIds.filter((id) => id !== currentUserId);
      // console.log(
      //   `=== DEBUG: After removing current user, ${filteredIds.length} allowed owners remain`
      // );

      return filteredIds;
    } catch (error) {
      console.error("Error getting allowed owner IDs:", error);
      return [];
    }
  },

  // Additional debug function to check a specific product owner
  async debugProductOwner(productOwnerId) {
    try {
      // console.log(`=== DEBUG: Checking owner ${productOwnerId}`);
      const ownerDoc = await MSUserModel.getById(productOwnerId);
      console.log("Owner details:", {
        uid: ownerDoc?.uid,
        role: ownerDoc?.role,
        name: ownerDoc?.name,
        // Add other relevant fields
      });
      return ownerDoc;
    } catch (error) {
      console.error(`Error fetching owner ${productOwnerId}:`, error);
      return null;
    }
  },

  async create(productData) {
    try {
      const sanitizedData = sanitizeInput(productData);
      const now = timestamp();

      const newProductRef = productsRef.doc();
      const newProduct = {
        productId: newProductRef.id,
        ...sanitizedData,
        isActive:
          sanitizedData.isActive === undefined ? true : sanitizedData.isActive,
        createdAt: now,
        lastUpdatedAt: now,
      };

      await newProductRef.set(newProduct);
      const doc = await newProductRef.get();
      const createdProduct = formatDoc(doc);

      // Send notification to the product owner about successful creation
      if (this.notificationService && createdProduct.ownerId) {
        await this.notificationService.createNotification(
          createdProduct.ownerId,
          "product_created",
          `Your product "${createdProduct.name}" has been successfully created`,
          {
            productId: createdProduct.productId,
            productName: createdProduct.name,
            productType: createdProduct.productType,
            category: createdProduct.category,
            actionUrl: `/products/${createdProduct.productId}`,
          },
          "normal"
        );

        // Notify relevant users if it's a high-demand category
        if (
          createdProduct.category &&
          this.isHighDemandCategory(createdProduct.category)
        ) {
          await this.notifyInterestedUsers(createdProduct);
        }
      }

      return createdProduct;
    } catch (error) {
      console.error("Error creating product:", error);

      // Send error notification to the user if we have their ID
      if (this.notificationService && productData.ownerId) {
        await this.notificationService.createNotification(
          productData.ownerId,
          "product_error",
          `Failed to create product "${
            productData.name || "Unknown"
          }". Please try again.`,
          {
            error: error.message,
            productData: {
              name: productData.name,
              category: productData.category,
            },
          },
          "high"
        );
      }

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

      const originalProduct = formatDoc(doc);
      const sanitizedData = sanitizeInput(updateData);
      const updatedProduct = {
        ...sanitizedData,
        lastUpdatedAt: timestamp(),
      };

      await productRef.update(updatedProduct);
      const updatedDoc = await productRef.get();
      const finalProduct = formatDoc(updatedDoc);

      // Send notifications for significant updates
      if (this.notificationService && originalProduct.ownerId) {
        // Basic update notification
        await this.notificationService.createNotification(
          originalProduct.ownerId,
          "product_updated",
          `Your product "${finalProduct.name}" has been updated successfully`,
          {
            productId: finalProduct.productId,
            productName: finalProduct.name,
            updatedFields: Object.keys(sanitizedData),
            actionUrl: `/products/${finalProduct.productId}`,
          },
          "normal"
        );

        // Check for status changes that affect visibility
        if (originalProduct.isActive !== finalProduct.isActive) {
          const statusMessage = finalProduct.isActive
            ? `Your product "${finalProduct.name}" is now active and visible to buyers`
            : `Your product "${finalProduct.name}" has been deactivated`;

          await this.notificationService.createNotification(
            originalProduct.ownerId,
            "product_status_change",
            statusMessage,
            {
              productId: finalProduct.productId,
              productName: finalProduct.name,
              newStatus: finalProduct.isActive ? "active" : "inactive",
              actionUrl: `/products/${finalProduct.productId}`,
            },
            finalProduct.isActive ? "normal" : "high"
          );
        }

        // Notify about price changes
        if (
          sanitizedData.hasOwnProperty("price") &&
          originalProduct.price !== finalProduct.price
        ) {
          await this.notificationService.createNotification(
            originalProduct.ownerId,
            "price_update",
            `Price updated for "${finalProduct.name}" from $${originalProduct.price} to $${finalProduct.price}`,
            {
              productId: finalProduct.productId,
              productName: finalProduct.name,
              oldPrice: originalProduct.price,
              newPrice: finalProduct.price,
              actionUrl: `/products/${finalProduct.productId}`,
            },
            "normal"
          );
        }
      }

      return finalProduct;
    } catch (error) {
      console.error("Error updating product:", error);

      // Send error notification
      if (this.notificationService && updateData.ownerId) {
        await this.notificationService.createNotification(
          updateData.ownerId,
          "product_error",
          `Failed to update product. Please try again.`,
          {
            productId: productId,
            error: error.message,
          },
          "high"
        );
      }

      throw error;
    }
  },

  async delete(productId) {
    try {
      console.log("Starting deletion process for product:", productId);

      const productRef = productsRef.doc(productId);
      const doc = await productRef.get();

      if (!doc.exists) {
        console.log("Product not found:", productId);
        throw new Error("Product not found for deletion");
      }

      const product = formatDoc(doc);

      // Check if product exists in any orders
      const orderItemsQuery = orderItemsRef.where("productId", "==", productId);
      const orderItemsSnapshot = await orderItemsQuery.get();

      if (!orderItemsSnapshot.empty) {
        console.log("Product exists in orders, cannot delete:", productId);

        // Notify user about deletion failure
        if (this.notificationService && product.ownerId) {
          await this.notificationService.createNotification(
            product.ownerId,
            "product_deletion_failed",
            `Cannot delete "${product.name}" because it exists in one or more orders`,
            {
              productId: product.productId,
              productName: product.name,
              reason: "Product exists in orders",
              actionUrl: `/products/${product.productId}`,
            },
            "high"
          );
        }

        throw new Error(
          "Cannot delete product. It exists in one or more orders."
        );
      }

      // Use batch for atomic deletion
      const batch = db.batch();

      // Add all batches to deletion batch
      const batchesQuery = batchesRef.where("productId", "==", productId);
      const batchesSnapshot = await batchesQuery.get();

      if (!batchesSnapshot.empty) {
        console.log(
          "Adding associated batches to deletion batch:",
          batchesSnapshot.size
        );
        batchesSnapshot.docs.forEach((batchDoc) => {
          batch.delete(batchDoc.ref);
        });
      }

      // Add product to deletion batch
      batch.delete(productRef);

      // Execute all deletions atomically
      await batch.commit();
      console.log(
        "Product and all associated batches deleted successfully:",
        productId
      );

      // Send success notification
      if (this.notificationService && product.ownerId) {
        await this.notificationService.createNotification(
          product.ownerId,
          "product_deleted",
          `Your product "${product.name}" and all associated batches have been deleted successfully`,
          {
            productId: product.productId,
            productName: product.name,
            deletedBatches: batchesSnapshot.size,
            actionUrl: "/products",
          },
          "normal"
        );
      }

      return true;
    } catch (error) {
      console.error("Error in ProductModel.delete:", error);

      // Send error notification if we have product info
      if (this.notificationService && error.message.includes("not found")) {
        // Handle case where we don't have product owner info
        console.log(
          "Cannot send deletion error notification - product not found"
        );
      }

      throw error;
    }
  },

  // Helper method to check if a category is high-demand
  isHighDemandCategory(category) {
    const highDemandCategories = [
      "Emergency Medicine",
      "Antibiotics",
      "Vaccines",
      "Surgical Equipment",
      "Diagnostic Equipment",
    ];
    return highDemandCategories.includes(category);
  },

  // Helper method to notify interested users about new products
  async notifyInterestedUsers(product) {
    try {
      // This would typically query for users who have shown interest in this category
      // For now, we'll send to users who have the supplier role
      await this.notificationService.notifyByRole(
        "supplier",
        "new_product_available",
        `New ${product.category} product available: ${product.name}`,
        {
          productId: product.productId,
          productName: product.name,
          category: product.category,
          productType: product.productType,
          actionUrl: `/products/${product.productId}`,
        },
        "normal"
      );
    } catch (error) {
      console.error("Error notifying interested users:", error);
      // Don't throw error as this is not critical
    }
  },
};

module.exports = ProductModel;
