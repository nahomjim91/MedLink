// /telehealth/utils/helpers.js
const { db, FieldValue } = require("../config/firebase");

const formatDoc = (doc) => {
  if (!doc || !doc.exists) return null;
  return { id: doc.id, ...doc.data() };
};

const formatDocs = (docs) => {
  return docs.map((doc) => formatDoc(doc));
};

const sanitizeInput = (data) => {
  if (!data) return null;

  const sanitized = {};

  // Copy only allowed fields to prevent injection
  Object.keys(data).forEach((key) => {
    // Convert strings to trimmed strings
    if (typeof data[key] === "string") {
      sanitized[key] = data[key].trim();
    } else {
      sanitized[key] = data[key];
    }
  });

  return sanitized;
};

const paginationParams = (limit = 10, offset = 0) => {
  return {
    limit: Math.min(parseInt(limit) || 10, 100), // Max 100 items per request
    offset: parseInt(offset) || 0,
  };
};

const formatError = (error) => {
  console.error("Error:", error);

  // Return sanitized error in production
  if (process.env.NODE_ENV === "production") {
    return {
      message: "An error occurred",
      code: error.code || "UNKNOWN_ERROR",
    };
  }

  // Return full error in development
  return {
    message: error.message,
    code: error.code || "UNKNOWN_ERROR",
    stack: error.stack,
  };
};

/**
 * Create a timestamp for the current time
 * @returns {Object} Firestore timestamp
 */
const timestamp = () => {
  if (!FieldValue || !FieldValue.serverTimestamp) {
    console.error(
      "!!! Firebase FieldValue or serverTimestamp is not available in helpers.js !!!"
    );
    return new Date();
  }
  return FieldValue.serverTimestamp();
};

const generateId = (length = 20) => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
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
  generateId,
};
