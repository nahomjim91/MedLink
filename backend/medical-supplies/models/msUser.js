/**
 * Medical Supplies User model
 */
const { db, GeoPoint } = require('../../config/firebase');
const { formatDoc, formatDocs, sanitizeInput, paginationParams, timestamp } = require('../../utils/helpers');

// Collection reference
const msUsersRef = db.collection('msUsers');

/**
 * Medical Supplies User model
 */
const MSUserModel = {
  /**
   * Get user by ID
   * @param {String} id - User ID
   * @returns {Object} User data
   */
  async getById(id) {
    try {
      const doc = await msUsersRef.doc(id).get();
      return formatDoc(doc);
    } catch (error) {
      console.error('Error getting MS user by ID:', error);
      throw error;
    }
  },

  /**
   * Get user by email
   * @param {String} email - User email
   * @returns {Object} User data
   */
  async getByEmail(email) {
    try {
      const snapshot = await msUsersRef.where('email', '==', email).limit(1).get();
      if (snapshot.empty) return null;
      return formatDoc(snapshot.docs[0]);
    } catch (error) {
      console.error('Error getting MS user by email:', error);
      throw error;
    }
  },

  /**
   * Get users by role
   * @param {String} role - User role
   * @param {Number} limit - Number of users to return
   * @param {Number} offset - Offset for pagination
   * @returns {Array} Array of users
   */
  async getByRole(role, limit, offset) {
    try {
      const { limit: limitVal, offset: offsetVal } = paginationParams(limit, offset);
      
      let query = msUsersRef
        .where('role', '==', role)
        .orderBy('createdAt', 'desc');
      
      // Apply pagination
      if (offsetVal > 0) {
        // Get the last document from the previous page
        const prevPageSnapshot = await msUsersRef
          .where('role', '==', role)
          .orderBy('createdAt', 'desc')
          .limit(offsetVal)
          .get();
        
        const lastDoc = prevPageSnapshot.docs[prevPageSnapshot.docs.length - 1];
        if (lastDoc) {
          query = query.startAfter(lastDoc);
        }
      }
      
      // Apply limit
      query = query.limit(limitVal);
      
      const snapshot = await query.get();
      return formatDocs(snapshot.docs);
    } catch (error) {
      console.error('Error getting MS users by role:', error);
      throw error;
    }
  },

  /**
   * Get pending approval users
   * @param {Number} limit - Number of users to return
   * @param {Number} offset - Offset for pagination
   * @returns {Array} Array of users
   */
  async getPendingApproval(limit, offset) {
    try {
      const { limit: limitVal, offset: offsetVal } = paginationParams(limit, offset);
      
      let query = msUsersRef
        .where('isApproved', '==', false)
        .orderBy('createdAt', 'asc');
      
      // Apply pagination
      if (offsetVal > 0) {
        // Get the last document from the previous page
        const prevPageSnapshot = await msUsersRef
          .where('isApproved', '==', false)
          .orderBy('createdAt', 'asc')
          .limit(offsetVal)
          .get();
        
        const lastDoc = prevPageSnapshot.docs[prevPageSnapshot.docs.length - 1];
        if (lastDoc) {
          query = query.startAfter(lastDoc);
        }
      }
      
      // Apply limit
      query = query.limit(limitVal);
      
      const snapshot = await query.get();
      return formatDocs(snapshot.docs);
    } catch (error) {
      console.error('Error getting pending approval MS users:', error);
      throw error;
    }
  },

  /**
   * Search users
   * @param {String} query - Search query
   * @param {Number} limit - Number of users to return
   * @param {Number} offset - Offset for pagination
   * @returns {Array} Array of users
   */
  async search(query, limit, offset) {
    try {
      const { limit: limitVal, offset: offsetVal } = paginationParams(limit, offset);
      
      // Normalize query
      const normalizedQuery = query.toLowerCase().trim();
      
      // Get all users
      const snapshot = await msUsersRef.get();
      
      // Filter users locally (Firestore doesn't support full-text search)
      const filteredDocs = snapshot.docs.filter(doc => {
        const data = doc.data();
        
        // Check company name
        if (data.companyName && data.companyName.toLowerCase().includes(normalizedQuery)) {
          return true;
        }
        
        // Check contact name
        if (data.contactName && data.contactName.toLowerCase().includes(normalizedQuery)) {
          return true;
        }
        
        // Check email
        if (data.email && data.email.toLowerCase().includes(normalizedQuery)) {
          return true;
        }
        
        // Check phone number
        if (data.phoneNumber && data.phoneNumber.includes(normalizedQuery)) {
          return true;
        }
        
        // Check address
        if (data.address) {
          const address = data.address;
          
          if (address.street && address.street.toLowerCase().includes(normalizedQuery)) {
            return true;
          }
          
          if (address.city && address.city.toLowerCase().includes(normalizedQuery)) {
            return true;
          }
          
          if (address.state && address.state.toLowerCase().includes(normalizedQuery)) {
            return true;
          }
          
          if (address.country && address.country.toLowerCase().includes(normalizedQuery)) {
            return true;
          }
        }
        
        return false;
      });
      
      // Apply pagination
      const paginatedDocs = filteredDocs.slice(offsetVal, offsetVal + limitVal);
      
      return formatDocs(paginatedDocs);
    } catch (error) {
      console.error('Error searching MS users:', error);
      throw error;
    }
  },

  /**
   * Initialize user
   * @param {String} id - User ID
   * @param {String} email - User email
   * @returns {Object} User data
   */
  async initializeUser(id, email) {
    try {
      const userRef = msUsersRef.doc(id);
      
      // Check if user already exists
      const userDoc = await userRef.get();
      if (userDoc.exists) {
        return formatDoc(userDoc);
      }
      
      // Create user
      const userData = {
        userId: id,
        email,
        role: null, // Will be set during registration
        createdAt: timestamp(),
        isApproved: false,
        profileComplete: false,
        cart: {
          items: [],
          total: 0,
          lastUpdated: timestamp()
        }
      };
      
      
      await userRef.set(userData);
      
      // Get created user
      const createdUserDoc = await userRef.get();
      return formatDoc(createdUserDoc);
    } catch (error) {
      console.error('Error initializing MS user:', error);
      throw error;
    }
  },

  /**
   * Update user
   * @param {String} id - User ID
   * @param {Object} data - User data
   * @returns {Object} Updated user data
   */
  async update(id, data) {
    try {
      const sanitizedData = sanitizeInput(data);
      const userRef = msUsersRef.doc(id);
      
      // Handle GeoPoint conversion for address.geoLocation
      if (sanitizedData.address && sanitizedData.address.geoLocation) {
        const { latitude, longitude } = sanitizedData.address.geoLocation;
        if (latitude !== undefined && longitude !== undefined) {
          sanitizedData.address.geoLocation = new GeoPoint(latitude, longitude);
        }
      }
      
      // Update user
      await userRef.update({
        ...sanitizedData,
        updatedAt: timestamp()
      });
      
      // Get updated user
      const updatedUserDoc = await userRef.get();
      return formatDoc(updatedUserDoc);
    } catch (error) {
      console.error('Error updating MS user:', error);
      throw error;
    }
  },

  /**
   * Complete registration
   * @param {String} id - User ID
   * @param {Object} data - User data
   * @returns {Object} Updated user data
   */
  async completeRegistration(id, data) {
    try {
      const sanitizedData = sanitizeInput(data);
      const userRef = msUsersRef.doc(id);
      
      // Handle GeoPoint conversion for address.geoLocation
      if (sanitizedData.address && sanitizedData.address.geoLocation) {
        const { latitude, longitude } = sanitizedData.address.geoLocation;
        if (latitude !== undefined && longitude !== undefined) {
          sanitizedData.address.geoLocation = new GeoPoint(latitude, longitude);
        }
      }
      
      // Update user
      await userRef.update({
        ...sanitizedData,
        profileComplete: true,
        isApproved: sanitizedData.role === 'admin' ? true : false, // Auto-approve admins
        updatedAt: timestamp()
      });
      
      // Get updated user
      const updatedUserDoc = await userRef.get();
      return formatDoc(updatedUserDoc);
    } catch (error) {
      console.error('Error completing MS user registration:', error);
      throw error;
    }
  },

  /**
   * Approve user
   * @param {String} id - User ID
   * @param {String} approvedByUserId - ID of admin who approved
   * @returns {Object} Updated user data
   */
  async approve(id, approvedByUserId) {
    try {
      const userRef = msUsersRef.doc(id);
      
      // Update user
      await userRef.update({
        isApproved: true,
        approvedBy: approvedByUserId,
        approvedAt: timestamp(),
        updatedAt: timestamp()
      });
      
      // Get updated user
      const updatedUserDoc = await userRef.get();
      return formatDoc(updatedUserDoc);
    } catch (error) {
      console.error('Error approving MS user:', error);
      throw error;
    }
  },

  /**
   * Reject user
   * @param {String} id - User ID
   * @param {String} reason - Rejection reason
   * @returns {Boolean} Success status
   */
  async reject(id, reason) {
    try {
      const userRef = msUsersRef.doc(id);
      
      // Update user
      await userRef.update({
        isApproved: false,
        rejectionReason: reason,
        updatedAt: timestamp()
      });
      
      return true;
    } catch (error) {
      console.error('Error rejecting MS user:', error);
      throw error;
    }
  },

  /**
   * Add item to cart
   * @param {String} userId - User ID
   * @param {Object} item - Cart item
   * @returns {Object} Updated user data
   */
  async addToCart(userId, item) {
    try {
      const userRef = msUsersRef.doc(userId);
      
      // Get user
      const userDoc = await userRef.get();
      if (!userDoc.exists) {
        throw new Error('User not found');
      }
      
      const userData = userDoc.data();
      const cart = userData.cart || { items: [], total: 0 };
      
      // Check if item already exists in cart
      const existingItemIndex = cart.items.findIndex(i => i.productId === item.productId);
      
      if (existingItemIndex >= 0) {
        // Update existing item
        cart.items[existingItemIndex].quantity += item.quantity;
      } else {
        // Add new item
        cart.items.push(item);
      }
      
      // Recalculate total
      cart.total = cart.items.reduce((total, i) => total + (i.price * i.quantity), 0);
      
      // Update cart
      await userRef.update({
        cart: {
          items: cart.items,
          total: cart.total,
          lastUpdated: timestamp()
        }
      });
      
      // Get updated user
      const updatedUserDoc = await userRef.get();
      return formatDoc(updatedUserDoc);
    } catch (error) {
      console.error('Error adding item to cart:', error);
      throw error;
    }
  },

  /**
   * Update cart item
   * @param {String} userId - User ID
   * @param {String} productId - Product ID
   * @param {Number} quantity - New quantity
   * @returns {Object} Updated user data
   */
  async updateCartItem(userId, productId, quantity) {
    try {
      const userRef = msUsersRef.doc(userId);
      
      // Get user
      const userDoc = await userRef.get();
      if (!userDoc.exists) {
        throw new Error('User not found');
      }
      
      const userData = userDoc.data();
      const cart = userData.cart || { items: [], total: 0 };
      
      // Find item
      const itemIndex = cart.items.findIndex(i => i.productId === productId);
      
      if (itemIndex < 0) {
        throw new Error('Item not found in cart');
      }
      
      // Update item quantity
      cart.items[itemIndex].quantity = quantity;
      
      // Recalculate total
      cart.total = cart.items.reduce((total, i) => total + (i.price * i.quantity), 0);
      
      // Update cart
      await userRef.update({
        cart: {
          items: cart.items,
          total: cart.total,
          lastUpdated: timestamp()
        }
      });
      
      // Get updated user
      const updatedUserDoc = await userRef.get();
      return formatDoc(updatedUserDoc);
    } catch (error) {
      console.error('Error updating cart item:', error);
      throw error;
    }
  },

  /**
   * Remove item from cart
   * @param {String} userId - User ID
   * @param {String} productId - Product ID
   * @returns {Object} Updated user data
   */
  async removeFromCart(userId, productId) {
    try {
      const userRef = msUsersRef.doc(userId);
      
      // Get user
      const userDoc = await userRef.get();
      if (!userDoc.exists) {
        throw new Error('User not found');
      }
      
      const userData = userDoc.data();
      const cart = userData.cart || { items: [], total: 0 };
      
      // Remove item
      cart.items = cart.items.filter(i => i.productId !== productId);
      
      // Recalculate total
      cart.total = cart.items.reduce((total, i) => total + (i.price * i.quantity), 0);
      
      // Update cart
      await userRef.update({
        cart: {
          items: cart.items,
          total: cart.total,
          lastUpdated: timestamp()
        }
      });
      
      // Get updated user
      const updatedUserDoc = await userRef.get();
      return formatDoc(updatedUserDoc);
    } catch (error) {
      console.error('Error removing item from cart:', error);
      throw error;
    }
  },

  /**
   * Clear cart
   * @param {String} userId - User ID
   * @returns {Object} Updated user data
   */
  async clearCart(userId) {
    try {
      const userRef = msUsersRef.doc(userId);
      
      // Update cart
      await userRef.update({
        cart: {
          items: [],
          total: 0,
          lastUpdated: timestamp()
        }
      });
      
      // Get updated user
      const updatedUserDoc = await userRef.get();
      return formatDoc(updatedUserDoc);
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  },

  /**
   * Delete user
   * @param {String} id - User ID
   * @returns {Boolean} Success status
   */
  async delete(id) {
    try {
      await msUsersRef.doc(id).delete();
      return true;
    } catch (error) {
      console.error('Error deleting MS user:', error);
      throw error;
    }
  }
};

module.exports = MSUserModel;