// /telehealth/utils/helpers.js
const { db, FieldValue } = require("../medical-supplies/config/firebase");

const formatDoc = (doc) => {
  if (!doc.exists) return null;

  const data = doc.data();
  const id = doc.id;

  // Convert all potential timestamp fields to Date objects
  const formatted = { ...data, id };

  // Handle timestamp fields that might cause serialization issues
  [
    "createdAt",
    "updatedAt",
    "lastUpdated",
    "addedAt",
    "approvedAt",
    "expiryDate",
  ].forEach((field) => {
    if (formatted[field]) {
      if (
        typeof formatted[field] === "object" &&
        (formatted[field]._seconds !== undefined ||
          formatted[field].constructor?.name === "ServerTimestampTransform")
      ) {
        // Convert Firestore timestamp to JavaScript Date
        if (formatted[field]._seconds !== undefined) {
          formatted[field] = new Date(formatted[field]._seconds * 1000);
        } else {
          // Handle ServerTimestampTransform
          formatted[field] = new Date();
        }
      }
    }
  });

  return formatted;
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

// Haversine formula to calculate distance between two points on Earth
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in kilometers

  return distance;
}

// Helper function to format distance text
function formatDistanceText(distance) {
  if (distance === null || distance === undefined) {
    return "Distance not available";
  }
  if (distance < 1) {
    return `${Math.round(distance * 1000)} m away`;
  }
  return `${distance} km away`;
}

module.exports = {
  formatDoc,
  formatDocs,
  sanitizeInput,
  paginationParams,
  formatError,
  timestamp,
  generateId,
  formatDistanceText,
  calculateDistance,
};
