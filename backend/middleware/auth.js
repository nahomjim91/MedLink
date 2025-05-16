const { auth, db } = require('../config/firebase');

/**
 * Authentication middleware for Express
 * Verifies Firebase ID tokens passed in authorization header
 */
const authMiddleware = async (req, res, next) => {
  // Check for Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return next(); // No token provided, continue as unauthenticated
  }
  // Extract token (remove 'Bearer ' prefix)
  const token = authHeader.split(' ')[1];
  if (!token) {
    return next(); // Malformed token, continue as unauthenticated
  }
  try {
    // Verify the token with Firebase Admin SDK
    const decodedToken = await auth.verifyIdToken(token);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      // Add any other claims or user data as needed
    };
    return next();
  } catch (error) {
    console.error('Error verifying auth token:', error);
    return next(); // Invalid token, continue as unauthenticated
  }
};

/**
 * Fetch user data from Firestore database
 * Checks both "msUser" and "thUser" collections
 * @param {string} userId - Firebase user ID
 * @returns {Object|null} User data or null if not found
 */
const fetchUserFromDatabase = async (userId) => {
  try {
    // First try to find the user in the msUser collection
    const msUserDoc = await db.collection('msUsers').doc(userId).get();
    
    if (msUserDoc.exists) {
      return {
        ...msUserDoc.data(),
      };
    }
    
    // If not found in msUser, try thUser collection
    const thUserDoc = await db.collection('thUsers').doc(userId).get();
    
    if (thUserDoc.exists) {
      return {
        ...thUserDoc.data(),
      };
    }
    
    // User not found in either collection
    console.log('No user document found for ID:', userId);
    return null;
  } catch (error) {
    console.error('Error fetching user from database:', error);
    return null;
  }
};

/**
 * GraphQL context function to provide user data to resolvers
 * Enhanced to include user information from database
 */
const createContext = async ({ req }) => {
  // Check for Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return { user: null, req: { userId: null } };
  }
  // Extract token (remove 'Bearer ' prefix)
  const token = authHeader.split(' ')[1];
  if (!token) {
    return { user: null, req: { userId: null } };
  }
  try {
    // Verify the token with Firebase Admin SDK
    const decodedToken = await auth.verifyIdToken(token);
    
    // Fetch additional user data from Firebase database
    const dbUserData = await fetchUserFromDatabase(decodedToken.uid);
    
    // Combine token data with database data
    const userData = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      // Add any other claims from the token as needed
      
      // Add database fields if user exists in the database
      ...(dbUserData || {})
    };
   
    // Set up the context with both user object and req.userId for compatibility
    return {
      user: userData,
      req: {
        userId: decodedToken.uid // Add userId to req object for resolver compatibility
      }
    };
  } catch (error) {
    console.error('Error verifying auth token:', error);
    return { user: null, req: { userId: null } };
  }
};

module.exports = {
  authMiddleware,
  createContext,
  fetchUserFromDatabase // Export for potential reuse
};