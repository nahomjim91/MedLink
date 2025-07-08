const THRatingModel = require("../../models/thRatingModel");
const UserModel = require("../../models/thUser");
const {
  AuthenticationError,
  ForbiddenError,
  UserInputError,
} = require("apollo-server-express");

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

// Check if user can rate (doctor or patient)
const canRate = async (context) => {
  const user = isAuthenticated(context);
  const userDoc = await UserModel.getById(user.uid);
  if (!userDoc || !["doctor", "patient"].includes(userDoc.role)) {
    throw new ForbiddenError("Only doctors and patients can create ratings");
  }
  return user;
};

const thRatingResolvers = {
  Query: {
    // Get doctor ratings (ratings received by a doctor)
    doctorRatings: async (_, { doctorId, limit, offset }, context) => {
      try {
        isAuthenticated(context);
        return await THRatingModel.getDoctorRatings(doctorId, limit, offset);
      } catch (error) {
        console.error("Error in doctorRatings resolver:", error);
        throw error;
      }
    },

    // Get patient ratings (ratings received by a patient)
    patientRatings: async (_, { patientId, limit, offset }, context) => {
      try {
        isAuthenticated(context);
        return await THRatingModel.getPatientRatings(patientId, limit, offset);
      } catch (error) {
        console.error("Error in patientRatings resolver:", error);
        throw error;
      }
    },

    // Get ratings given by current user
    myTHRatings: async (_, { limit, offset }, context) => {
      try {
        const user = isAuthenticated(context);
        return await THRatingModel.getRatingsByUser(user.uid, limit, offset);
      } catch (error) {
        console.error("Error in myTHRatings resolver:", error);
        throw error;
      }
    },

    // Get ratings for a specific appointment
    appointmentRatings: async (_, { appointmentId }, context) => {
      try {
        isAuthenticated(context);
        return await THRatingModel.getRatingsByAppointment(appointmentId);
      } catch (error) {
        console.error("Error in appointmentRatings resolver:", error);
        throw error;
      }
    },

    // Get doctor rating statistics
    doctorRatingStats: async (_, { doctorId }, context) => {
      try {
        return await THRatingModel.getDoctorRatingStats(doctorId);
      } catch (error) {
        console.error("Error in doctorRatingStats resolver:", error);
        throw error;
      }
    },

    // Check if user can rate another user for specific appointment
    canRateUser: async (_, { appointmentId, ratedUserId }, context) => {
      try {
        const user = await canRate(context);
        return await THRatingModel.canRateUser(appointmentId, user.uid, ratedUserId);
      } catch (error) {
        console.error("Error in canRateUser resolver:", error);
        return false;
      }
    },
  },

  Mutation: {
    // Create rating between doctor and patient
    createTHRating: async (_, { input }, context) => {
      try {
        const user = await canRate(context);
        
        // Validate input
        if (!input.ratedUserId || !input.appointmentId || !input.rating) {
          throw new UserInputError("Missing required fields");
        }

        if (input.rating < 1 || input.rating > 5) {
          throw new UserInputError("Rating must be between 1 and 5");
        }

        if (user.uid === input.ratedUserId) {
          throw new UserInputError("Cannot rate yourself");
        }

        // Validate rating type
        if (!["doctor_rating", "patient_rating"].includes(input.ratingType)) {
          throw new UserInputError("Invalid rating type");
        }

        // Get user details to validate rating type
        const userDoc = await UserModel.getById(user.uid);
        const ratedUserDoc = await UserModel.getById(input.ratedUserId);

        // Validate rating type based on user roles
        if (userDoc.role === "patient" && input.ratingType !== "doctor_rating") {
          throw new UserInputError("Patients can only give doctor ratings");
        }
        if (userDoc.role === "doctor" && input.ratingType !== "patient_rating") {
          throw new UserInputError("Doctors can only give patient ratings");
        }
        if (userDoc.role === "patient" && ratedUserDoc.role !== "doctor") {
          throw new UserInputError("Patients can only rate doctors");
        }
        if (userDoc.role === "doctor" && ratedUserDoc.role !== "patient") {
          throw new UserInputError("Doctors can only rate patients");
        }

        return await THRatingModel.createRating(
          user.uid,
          input.ratedUserId,
          input.appointmentId,
          input.rating,
          input.comment,
          input.ratingType
        );
      } catch (error) {
        console.error("Error in createTHRating resolver:", error);
        throw error;
      }
    },

    // Delete rating (admin only)
    deleteTHRating: async (_, { ratingId, reason }, context) => {
      try {
        const admin = await isAdmin(context);
        return await THRatingModel.deleteRating(ratingId, admin.uid, reason);
      } catch (error) {
        console.error("Error in deleteTHRating resolver:", error);
        throw error;
      }
    },
  },
};

module.exports = thRatingResolvers;