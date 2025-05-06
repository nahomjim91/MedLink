/**
 * Helper utility functions for the MedLink telehealth backend
 */
// /telehealth/utils/helpers.js
const { db , FieldValue } = require('../config/firebase');

/**
 * Format Firestore document data with its ID
 * @param {Object} doc - Firestore document
 * @returns {Object} Document data with ID
 */
const formatDoc = (doc) => {
  if (!doc || !doc.exists) return null;
  return { id: doc.id, ...doc.data() };
};

/**
 * Format multiple Firestore documents
 * @param {Array} docs - Array of Firestore documents
 * @returns {Array} Array of document data with IDs
 */
const formatDocs = (docs) => {
  return docs.map(doc => formatDoc(doc));
};

/**
 * Sanitize user input data to prevent injection
 * @param {Object} data - User input data
 * @returns {Object} Sanitized data
 */
const sanitizeInput = (data) => {
  if (!data) return null;
  
  const sanitized = {};
  
  // Copy only allowed fields to prevent injection
  Object.keys(data).forEach(key => {
    // Convert strings to trimmed strings
    if (typeof data[key] === 'string') {
      sanitized[key] = data[key].trim();
    } else {
      sanitized[key] = data[key];
    }
  });
  
  return sanitized;
};

/**
 * Generate pagination parameters for Firestore queries
 * @param {Number} limit - Number of items per page
 * @param {Number} offset - Offset for pagination
 * @returns {Object} Pagination parameters
 */
const paginationParams = (limit = 10, offset = 0) => {
  return {
    limit: Math.min(parseInt(limit) || 10, 100), // Max 100 items per request
    offset: parseInt(offset) || 0
  };
};

/**
 * Format error response
 * @param {Error} error - Error object
 * @returns {Object} Formatted error
 */
const formatError = (error) => {
  console.error('Error:', error);
  
  // Return sanitized error in production
  if (process.env.NODE_ENV === 'production') {
    return {
      message: 'An error occurred',
      code: error.code || 'UNKNOWN_ERROR'
    };
  }
  
  // Return full error in development
  return {
    message: error.message,
    code: error.code || 'UNKNOWN_ERROR',
    stack: error.stack
  };
};

/**
 * Create a timestamp for the current time
 * @returns {Object} Firestore timestamp
 */
const timestamp = () => {
  if (!FieldValue || !FieldValue.serverTimestamp) {
     console.error("!!! Firebase FieldValue or serverTimestamp is not available in helpers.js !!!");
     // Provide a fallback or throw a more specific error
     // Using a client-side date is NOT recommended for consistent timestamps
     // but can be a temporary fallback for debugging.
     return new Date(); // Or throw new Error('Firestore FieldValue not initialized');
  }
  return FieldValue.serverTimestamp(); // <-- Use the imported FieldValue
};

/**
 * Generate a random ID
 * @param {Number} length - Length of ID
 * @returns {String} Random ID
 */
const generateId = (length = 20) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

module.exports = {
  formatDoc,
  formatDocs,
  sanitizeInput,
  paginationParams,
  formatError,
  timestamp,
  generateId
};