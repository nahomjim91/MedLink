// /graphql/resolvers.js
const { GraphQLScalarType } = require("graphql");
const { Kind } = require("graphql/language");
const UserModel = require("../../models/user");
const DoctorProfileModel = require("../../models/doctorProfile");
const PatientProfileModel = require("../../models/patientProfile");
const DoctorAvailabilitySlotModel = require("../../models/availabilitySlot");
const {
  AuthenticationError,
  ForbiddenError,
} = require("apollo-server-express");

const dateScalar = new GraphQLScalarType({
  name: "Date",
  description: "Date custom scalar type",
  serialize(value) {
    // Debug logging to help identify the issue
    // console.log("Date scalar serializing:", value);

    // Handle case when value is null or undefined
    if (value == null) {
      // console.log("Date value is null/undefined, returning null");
      return null;
    }

    // Handle Firestore timestamp objects
    if (
      value &&
      value._seconds !== undefined &&
      value._nanoseconds !== undefined
    ) {
      // console.log("Converting Firestore timestamp to milliseconds");
      // Convert Firestore timestamp to milliseconds
      return value._seconds * 1000 + Math.floor(value._nanoseconds / 1000000);
    }

    // Handle ServerTimestampTransform objects and empty objects
    if (
      value &&
      ((value.constructor &&
        value.constructor.name === "ServerTimestampTransform") ||
        (typeof value === "object" && Object.keys(value).length === 0))
    ) {
      // console.log(
      //   "Handling ServerTimestampTransform or empty object, returning current timestamp"
      // );
      // Always return current timestamp for server timestamp transforms
      return Date.now();
    }

    if (value instanceof Date) {
      // console.log("Converting Date object to timestamp");
      return value.getTime(); // Convert outgoing Date to integer for JSON
    }

    if (typeof value === "string") {
      // console.log("Converting string date to timestamp");
      return new Date(value).getTime();
    }

    if (typeof value === "number") {
      // console.log("Value is already a number timestamp");
      return value;
    }

    return Date.now();
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
    async patientProfile(parent) {
      if (parent.role !== "patient") return null;
      return await PatientProfileModel.getById(parent.id);
    },
  },
  DoctorProfile: {
    async availabilitySlots(parent) {
      return await DoctorAvailabilitySlotModel.getDoctorSlots(parent.doctorId);
    },
    async user(parent) {
      return await UserModel.getById(parent.doctorId);
    },
  },
  PatientProfile: {
    async user(parent) {
      return await UserModel.getById(parent.patientId);
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
      // console.log("Resolver: doctorsBySpecialization - specialization:", specialization);
      return await DoctorProfileModel.getBySpecialization(specialization);
    },

    // Get all approved doctors
    allDoctors: async (_, { limit, offset }) => {
      return await DoctorProfileModel.getAllApproved(limit, offset);
    },

    // Search doctors with comprehensive filtering
    searchDoctors: async (_, { input, limit = 20, offset = 0 }) => {
      try {
        const result = await DoctorProfileModel.searchDoctors(
          input,
          limit,
          offset
        );
        return result;
      } catch (error) {
        console.error("Error searching doctors:", error);
        throw error;
      }
    },

    // Filter doctors
    filterDoctors: async (_, { filter, limit = 20, offset = 0 }) => {
      try {
        const result = await DoctorProfileModel.filterDoctors(
          filter,
          limit,
          offset
        );
        return result;
      } catch (error) {
        console.error("Error filtering doctors:", error);
        throw error;
      } 
    },

    // Get all unique specializations
    getDoctorSpecializations: async () => {
      try {
        return await DoctorProfileModel.getAllSpecializations();
      } catch (error) {
        console.error("Error getting specializations:", error);
        throw error;
      }
    },

    // Get available slots for a specific doctor
    doctorAvailableSlots: async (_, { doctorId, date }) => {
      return await DoctorAvailabilitySlotModel.getAvailableSlots(
        doctorId,
        date
      );
    },

    // Get current doctor's availability slots
    myAvailabilitySlots: async (_, {}, context) => {
      const user = await isDoctor(context);
      return await DoctorAvailabilitySlotModel.getDoctorSlots(user.uid);
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
      console.log("Resolver: updateDoctorProfile - input:", input);
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

    // Create availability slot(s)
    addAvailabilitySlot: async (_, { input }, context) => {
      const user = await isDoctor(context);
      const { startTime, endTime } = input;

      return await DoctorAvailabilitySlotModel.createSlots(
        user.uid,
        startTime,
        endTime
      );
    },

    // Update availability slot
    updateAvailabilitySlot: async (_, { input }, context) => {
      const user = await isDoctor(context);
      const { slotId, ...updateData } = input;

      // Verify the slot belongs to the doctor
      const slot = await DoctorAvailabilitySlotModel.getDoctorSlots(user.uid);
      const userSlot = slot.find((s) => s.slotId === slotId);

      if (!userSlot) {
        throw new ForbiddenError("Slot not found or access denied");
      }

      return await DoctorAvailabilitySlotModel.updateSlot(slotId, updateData);
    },

    // Delete single availability slot
    deleteAvailabilitySlot: async (_, { slotId }, context) => {
      const user = await isDoctor(context);

      // Verify the slot belongs to the doctor
      const slot = await DoctorAvailabilitySlotModel.getDoctorSlots(user.uid);
      const userSlot = slot.find((s) => s.slotId === slotId);

      if (!userSlot) {
        throw new ForbiddenError("Slot not found or access denied");
      }

      return await DoctorAvailabilitySlotModel.deleteSlot(slotId);
    },

    // Delete multiple availability slots
    deleteMultipleSlots: async (_, { slotIds }, context) => {
      const user = await isDoctor(context);

      // Verify all slots belong to the doctor
      const slots = await DoctorAvailabilitySlotModel.getDoctorSlots(user.uid);
      const userSlotIds = slots.map((s) => s.slotId);

      const unauthorizedSlots = slotIds.filter(
        (id) => !userSlotIds.includes(id)
      );
      if (unauthorizedSlots.length > 0) {
        throw new ForbiddenError("Some slots not found or access denied");
      }

      return await DoctorAvailabilitySlotModel.deleteMultipleSlots(slotIds);
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
