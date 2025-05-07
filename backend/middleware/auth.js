const { auth } = require('../config/firebase');

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
 * GraphQL context function to provide user data to resolvers
 * Modified to not require models
 */
const createContext = async ({ req }) => {
  // Check for Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return { user: null, req: { userId: null } }; // No models import
  }
  // Extract token (remove 'Bearer ' prefix)
  const token = authHeader.split(' ')[1];
  if (!token) {
    return { user: null, req: { userId: null } }; // No models import
  }
  try {
    // Verify the token with Firebase Admin SDK
    const decodedToken = await auth.verifyIdToken(token);
   
    // Set up the context with both user object and req.userId for compatibility
    return {
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        // Add any other claims or user data as needed
      },
      req: {
        userId: decodedToken.uid // Add userId to req object for resolver compatibility
      }
      // Removed models from context
    };
  } catch (error) {
    console.error('Error verifying auth token:', error);
    return { user: null, req: { userId: null } }; // No models import
  }
};

module.exports = {
  authMiddleware,
  createContext
};
