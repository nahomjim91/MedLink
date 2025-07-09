// resolvers/prescriptionResolver.js
const { AuthenticationError, ForbiddenError } = require("apollo-server-express");
const PrescriptionModel = require("../../models/prescriptionModels");
const UserModel = require("../../models/user");

const isAuthenticated = (context) => {
  if (!context.user) {
    throw new AuthenticationError("Authentication required");
  }
  return context.user;
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

const prescriptionResolvers = {
  Query: {
    // Get prescription by ID
    prescriptionById: async (_, { id }, context) => {
      const user = isAuthenticated(context);
      const prescription = await PrescriptionModel.getById(id);
      
      if (!prescription) return null;
      
      // Check if user has access to this prescription
      const userDoc = await UserModel.getById(user.uid);
      if (userDoc.role === 'admin' || 
          prescription.doctorDetails.doctorId === user.uid ||
          prescription.patientDetails.patientId === user.uid) {
        return prescription;
      }
      
      throw new ForbiddenError("Access denied to this prescription");
    },

    // Get prescriptions by appointment ID
    prescriptionsByAppointmentId: async (_, { appointmentId }, context) => {
      const user = isAuthenticated(context);
      const prescriptions = await PrescriptionModel.getByAppointmentId(appointmentId);
      
      // Filter prescriptions based on user access
      const userDoc = await UserModel.getById(user.uid);
      if (userDoc.role === 'admin') {
        return prescriptions;
      }
      
      return prescriptions.filter(prescription => 
        prescription.doctorDetails.doctorId === user.uid ||
        prescription.patientDetails.patientId === user.uid
      );
    },

    // Get prescriptions by patient ID
    prescriptionsByPatientId: async (_, { patientId }, context) => {
      const user = isAuthenticated(context);
      const userDoc = await UserModel.getById(user.uid);
      
      // Only admin, the patient themselves, or their doctors can view
      if (userDoc.role === 'admin' || user.uid === patientId) {
        return await PrescriptionModel.getByPatientId(patientId);
      }
      
      // If user is a doctor, only return prescriptions they created
      if (userDoc.role === 'doctor') {
        const prescriptions = await PrescriptionModel.getByPatientId(patientId);
        return prescriptions.filter(prescription => 
          prescription.doctorDetails.doctorId === user.uid
        );
      }
      
      throw new ForbiddenError("Access denied to patient prescriptions");
    },

    // Get prescriptions by doctor ID
    prescriptionsByDoctorId: async (_, { doctorId }, context) => {
      const user = isAuthenticated(context);
      const userDoc = await UserModel.getById(user.uid);
      
      // Only admin or the doctor themselves can view
      if (userDoc.role === 'admin' || user.uid === doctorId) {
        return await PrescriptionModel.getByDoctorId(doctorId);
      }
      
      throw new ForbiddenError("Access denied to doctor prescriptions");
    },

    // Get current user's prescriptions (if patient)
    myPrescriptions: async (_, __, context) => {
      const user = isAuthenticated(context);
      const userDoc = await UserModel.getById(user.uid);
      
      if (userDoc.role === 'patient') {
        return await PrescriptionModel.getByPatientId(user.uid);
      }
      
      throw new ForbiddenError("Only patients can view their prescriptions");
    },

    // Get prescriptions for current doctor's patients
    myPatientsPrescriptions: async (_, __, context) => {
      const user = await isDoctor(context);
      return await PrescriptionModel.getByDoctorId(user.uid);
    }
  },

  Mutation: {
    // Create a new prescription
    createPrescription: async (_, { input }, context) => {
      const user = await isDoctor(context);
      
      // Verify the doctor is creating prescription for their own appointment
      if (input.doctorDetails.doctorId !== user.uid) {
        throw new ForbiddenError("You can only create prescriptions for your own appointments");
      }
      
      try {
        return await PrescriptionModel.create(input);
      } catch (error) {
        console.error('Error creating prescription:', error);
        throw new Error(`Failed to create prescription: ${error.message}`);
      }
    }
  }
};

module.exports = prescriptionResolvers;