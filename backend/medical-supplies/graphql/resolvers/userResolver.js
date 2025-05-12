// /graphql/ms-resolvers.js
const { GraphQLScalarType } = require("graphql");
const { Kind } = require("graphql/language");
const MSUserModel = require("../../models/msUser");
const {
  AuthenticationError,
  ForbiddenError,
} = require("apollo-server-express");

// Custom scalar for Date
const dateScalar = new GraphQLScalarType({
  name: "Date",
  description: "Date custom scalar type",
  serialize(value) {
    // Handle Firestore timestamp objects
    if (
      value &&
      value._seconds !== undefined &&
      value._nanoseconds !== undefined
    ) {
      // Convert Firestore timestamp to milliseconds
      return value._seconds * 1000 + Math.floor(value._nanoseconds / 1000000);
    }

    if (value instanceof Date) {
      return value.getTime(); // Convert outgoing Date to integer for JSON
    }

    if (typeof value === "string" || typeof value === "number") {
      return new Date(value).getTime();
    }

    console.log("Failed to serialize date value:", value);
    return null;
  },
  parseValue(value) {
    return new Date(value); // Convert incoming integer to Date
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.INT) {
      return new Date(parseInt(ast.value, 10)); // Convert hard-coded AST string to integer and then to Date
    }
    return null; // Invalid hard-coded value (not an integer)
  },
});

// Check if user is authenticated
const isAuthenticated = (context) => {
  if (!context.user) {
    throw new AuthenticationError("Authentication required");
  }
  return context.user;
};

// Check if user has admin role
const isAdmin = async (context) => {
  const user = isAuthenticated(context);

  const userDoc = await MSUserModel.getById(user.uid);
  if (!userDoc || userDoc.role !== "admin") {
    throw new ForbiddenError("Admin access required");
  }

  return user;
};

// Check if user has specified role
const hasRole = async (context, roles) => {
  const user = isAuthenticated(context);

  const userDoc = await MSUserModel.getById(user.uid);
  if (!userDoc || !roles.includes(userDoc.role)) {
    throw new ForbiddenError(`Required role: ${roles.join(" or ")}`);
  }

  return user;
};

const resolvers = {
  Date: dateScalar,
  GeoPoint: {
    latitude: (geoPoint) => {
      if (geoPoint && typeof geoPoint.latitude === "function") {
        // Handle Firestore GeoPoint object
        return geoPoint.latitude();
      }
      return geoPoint ? geoPoint.latitude : null;
    },
    longitude: (geoPoint) => {
      if (geoPoint && typeof geoPoint.longitude === "function") {
        // Handle Firestore GeoPoint object
        return geoPoint.longitude();
      }
      return geoPoint ? geoPoint.longitude : null;
    },
  },
  Query: {
    // Get current authenticated user
    msMe: async (_, __, context) => {
      try {
        // Check if we have a user in context
        if (!context.user) {
          console.log("No user in context");
          return null;
        }

        // Get user ID from context
        const userId = context.user.uid;
        console.log("Resolver: msMe - userId from context:", userId);

        if (!userId) {
          console.log("User ID is null/undefined");
          return null;
        }

        // Find and return the user
        const userDoc = await MSUserModel.getById(userId);
        console.log("User doc found:", !!userDoc);
        return userDoc;
      } catch (error) {
        console.error("Error in msMe resolver:", error);
        return null;
      }
    },

    // Get user by ID (admin only)
    msUserById: async (_, { userId }, context) => {
      await isAdmin(context);
      return await MSUserModel.getById(userId);
    },

    // Get users by role (admin only)
    msUsersByRole: async (_, { role }, context) => {
      await isAdmin(context);
      return await MSUserModel.getByRole(role);
    },

    // Get pending approval users (admin only)
    pendingApprovalUsers: async (_, { limit, offset }, context) => {
      await isAdmin(context);
      return await MSUserModel.getPendingApproval(limit, offset);
    },

    // Search users (admin only)
    searchMSUsers: async (_, { query, limit, offset }, context) => {
      await isAdmin(context);
      return await MSUserModel.search(query, limit, offset);
    },
  },

  Mutation: {
    // Initialize user profile
    initializeMSUserProfile: async (_, { email }, context) => {
      const user = isAuthenticated(context);

      // Check if user document already exists to prevent overwriting
      const existingUser = await MSUserModel.getById(user.uid);
      if (existingUser) {
        console.log(`User profile already exists for ${user.uid}`);
        return existingUser;
      }

      // Create the basic user document
      return await MSUserModel.initializeUser(user.uid, email);
    },

    // Update user profile
    updateMSUserProfile: async (_, { input }, context) => {
      const user = isAuthenticated(context);
      return await MSUserModel.update(user.uid, input);
    },

    // Complete registration
    completeMSRegistration: async (_, { input }, context) => {
      const user = isAuthenticated(context);

      try {
        return await MSUserModel.completeRegistration(user.uid, input);
      } catch (error) {
        console.error("Error in completeMSRegistration:", error);
        throw new Error(`Registration failed: ${error.message}`);
      }
    },

    // Approve user (admin only)
    approveMSUser: async (_, { userId }, context) => {
      const admin = await isAdmin(context);
      return await MSUserModel.approve(userId, admin.uid);
    },

    // Reject user (admin only)
    rejectMSUser: async (_, { userId, reason }, context) => {
      await isAdmin(context);
      return await MSUserModel.reject(userId, reason);
    },

    // Add to cart
    addToCart: async (
      _,
      { productId, quantity, price, productName, productImage },
      context
    ) => {
      const user = await hasRole(context, ["facility", "supplier"]);
      return await MSUserModel.addToCart(user.uid, {
        productId,
        quantity,
        price,
        productName,
        productImage,
      });
    },

    // Update cart item
    updateCartItem: async (_, { productId, quantity }, context) => {
      const user = await hasRole(context, ["facility", "supplier"]);
      return await MSUserModel.updateCartItem(user.uid, productId, quantity);
    },

    // Remove from cart
    removeFromCart: async (_, { productId }, context) => {
      const user = await hasRole(context, ["facility", "supplier"]);
      return await MSUserModel.removeFromCart(user.uid, productId);
    },

    // Clear cart
    clearCart: async (_, __, context) => {
      const user = await hasRole(context, ["facility", "supplier"]);
      return await MSUserModel.clearCart(user.uid);
    },
  },
};

module.exports = resolvers;


