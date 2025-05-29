// /graphql/resolvers.js
const { GraphQLScalarType } = require("graphql");
const { Kind } = require("graphql/language");
const UserModel = require("../../models/user");
const DoctorProfileModel = require("../../models/doctorProfile");
const PatientProfileModel = require("../../models/patientProfile");
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

  const userDoc = await UserModel.getById(user.uid);
  if (!userDoc || userDoc.role !== "admin") {
    throw new ForbiddenError("Admin access required");
  }

  return user;
};

// Check if user has doctor role
const isDoctor = async (context) => {
  const user = isAuthenticated(context);

  const userDoc = await UserModel.getById(user.uid);
  if (!userDoc || userDoc.role !== "doctor") {
    throw new ForbiddenError("Doctor access required");
  }

  return user;
};

const resolvers = {
  Date: dateScalar,

  THUser: {
    async doctorProfile(parent) {
      if (parent.role !== "doctor") return null;
      return await DoctorProfileModel.getById(parent.id);
    },
  },

  Query: {
    // Get current authenticated user
    me: async (_, __, context) => {
      try {
        // Check if we have a user in context
        if (!context.user) {
          console.log("No user in context");
          return null;
        }

        // Get user ID from context
        const userId = context.user.uid;
        console.log("Resolver: me - userId from context:", userId);

        if (!userId) {
          console.log("User ID is null/undefined");
          return null;
        }

        // Find and return the user
        const userDoc = await UserModel.getById(userId);
        console.log("User doc found:", !!userDoc);
        return userDoc;
      } catch (error) {
        console.error("Error in me resolver:", error);
        return null;
      }
    },

    // Get user by ID (admin only)
    thUserById: async (_, { id }, context) => {
      await isAdmin(context);
      return await UserModel.getById(id);
    },

    // Get doctor by ID
    doctorById: async (_, { id }) => {
      return await DoctorProfileModel.getById(id);
    },

    // Get doctors by specialization
    doctorsBySpecialization: async (_, { specialization }) => {
      return await DoctorProfileModel.getBySpecialization(specialization);
    },

    // Get all approved doctors
    allDoctors: async (_, { limit, offset }) => {
      return await DoctorProfileModel.getAllApproved(limit, offset);
    },
  },

  Mutation: {
    // Update user profile
    updateUserProfile: async (_, { input }, context) => {
      const user = isAuthenticated(context);
      return await UserModel.createOrUpdate(user.uid, input);
    },

    // Update doctor profile
    updateDoctorProfile: async (_, { input }, context) => {
      const user = await isDoctor(context);
      return await DoctorProfileModel.update(user.uid, input);
    },

    // Add certificate to doctor profile
    addCertificate: async (_, { certificate }, context) => {
      const user = await isDoctor(context);
      return await DoctorProfileModel.addCertificate(user.uid, certificate);
    },

    // Update patient profile
    updatePatientProfile: async (_, { input }, context) => {
      const user = isAuthenticated(context);

      // Get user to check role
      const userDoc = await UserModel.getById(user.uid);
      if (!userDoc || userDoc.role !== "patient") {
        throw new ForbiddenError("Patient access required");
      }

      // Update patient profile
      await PatientProfileModel.update(user.uid, input);

      // Return updated user
      return await UserModel.getById(user.uid);
    },

    // Approve doctor profile (admin only)
    approveDoctorProfile: async (_, { doctorId }, context) => {
      await isAdmin(context);
      return await DoctorProfileModel.approve(doctorId);
    },

    initializeUserProfile: async (_, { email }, context) => {
      const user = isAuthenticated(context); // Ensure user is authenticated
      // Check if user document already exists to prevent overwriting
      const existingUser = await UserModel.getById(user.uid);
      if (existingUser) {
        console.log(`User profile already exists for ${user.uid}`);
        return existingUser; // Return existing user if found
      }
      // Create the basic user document
      return await UserModel.initializeUser(user.uid, email);
    },

    completeRegistration: async (
      _,
      { THuserInput, doctorInput, patientInput },
      context
    ) => {
      // Get the authenticated user ID from context
      const userId = context.user?.uid;
      if (!userId) {
        throw new AuthenticationError("Authentication required");
      }
      console.log(
        "Resolver: completeRegistration - userId from context:",
        userId
      );
      console.log("Resolver: completeRegistration - THuserInput:", THuserInput);

      try {
        // 1. Update the base user information
        const updatedUser = await UserModel.createOrUpdate(userId, {
          ...THuserInput,
          profileComplete: true,
        });

        const user = isAuthenticated(context);
        let roleSpecificData = null;
        if (THuserInput.role === "doctor" && doctorInput) {
          roleSpecificData = doctorInput;
        } else if (THuserInput.role === "patient" && patientInput) {
          roleSpecificData = patientInput;
        }
        // Ensure completeRegistration uses the correct data structure
        return await UserModel.completeRegistration(
          user.uid,
          THuserInput,
          roleSpecificData
        );
      } catch (error) {
        console.error("Error in completeRegistration:", error);
        throw new Error(`Registration failed: ${error.message}`);
      }
    },
  },
};

module.exports = resolvers;
