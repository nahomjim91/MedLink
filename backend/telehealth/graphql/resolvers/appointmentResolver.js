// /graphql/appointmentResolvers.js
const AppointmentModel = require("../../models/appointment");
const UserModel = require("../../models/user");
const DoctorProfileModel = require("../../models/doctorProfile");
const PatientProfileModel = require("../../models/patientProfile");
const DoctorAvailabilitySlotModel = require("../../models/availabilitySlot");
const {
  AuthenticationError,
  ForbiddenError,
  UserInputError,
} = require("apollo-server-express");
const { db } = require("../../config/firebase");
const { timestamp } = require("../../../utils/helpers");

// Helper functions for authentication and authorization
const isAuthenticated = (context) => {
  if (!context.user) {
    throw new AuthenticationError("Authentication required");
  }
  return context.user;
};

const isPatient = async (context) => {
  const user = isAuthenticated(context);
  const userDoc = await UserModel.getById(user.uid);
  if (!userDoc || userDoc.role !== "patient") {
    throw new ForbiddenError("Patient access required");
  }
  return user;
};

const isDoctor = async (context) => {
  const user = isAuthenticated(context);
  const userDoc = await UserModel.getById(user.uid);
  if (!userDoc || userDoc.role !== "doctor") {
    throw new ForbiddenError("Doctor access required");
  }
  return user;
};

const isAdmin = async (context) => {
  const user = isAuthenticated(context);
  const userDoc = await UserModel.getById(user.uid);
  if (!userDoc || userDoc.role !== "admin") {
    throw new ForbiddenError("Admin access required");
  }
  return user;
};

// Check if user can access appointment
const canAccessAppointment = async (appointmentId, context) => {
  const user = isAuthenticated(context);
  const appointment = await AppointmentModel.getById(appointmentId);

  if (!appointment) {
    throw new UserInputError("Appointment not found");
  }

  const userDoc = await UserModel.getById(user.uid);

  // Admin can access all appointments
  if (userDoc.role === "admin") {
    return { appointment, user: userDoc };
  }

  // Patients can only access their own appointments
  if (userDoc.role === "patient" && appointment.patientId !== user.uid) {
    throw new ForbiddenError("Access denied");
  }

  // Doctors can only access their own appointments
  if (userDoc.role === "doctor" && appointment.doctorId !== user.uid) {
    throw new ForbiddenError("Access denied");
  }

  return { appointment, user: userDoc };
};

const appointmentResolvers = {
  Appointment: {
    async patient(parent) {
      return await UserModel.getById(parent.patientId);
    },
    async doctor(parent) {
      return await UserModel.getById(parent.doctorId);
    },
  },

  Query: {
    // Get single appointment
    appointment: async (_, { appointmentId }, context) => {
      const { appointment } = await canAccessAppointment(
        appointmentId,
        context
      );
      return appointment;
    },

    // Get appointments for current user
    myAppointments: async (_, { limit = 20, offset = 0 }, context) => {
      const user = isAuthenticated(context);
      const userDoc = await UserModel.getById(user.uid);

      if (userDoc.role === "patient") {
        return await AppointmentModel.getByPatientId(user.uid, limit, offset);
      } else if (userDoc.role === "doctor") {
        return await AppointmentModel.getByDoctorId(user.uid, limit, offset);
      } else {
        throw new ForbiddenError("Invalid user role for appointments");
      }
    },

    // Get appointments by patient ID
    patientAppointments: async (
      _,
      { patientId, limit = 20, offset = 0 },
      context
    ) => {
      const user = isAuthenticated(context);
      const userDoc = await UserModel.getById(user.uid);

      // Admin can view any patient's appointments, patients can only view their own
      if (
        userDoc.role === "admin" ||
        (userDoc.role === "patient" && user.uid === patientId)
      ) {
        return await AppointmentModel.getByPatientId(
          patientId || user.uid,
          limit,
          offset
        );
      }

      throw new ForbiddenError("Access denied");
    },

    // Get appointments by doctor ID
    doctorAppointments: async (
      _,
      { doctorId, limit = 20, offset = 0 },
      context
    ) => {
      const user = isAuthenticated(context);
      const userDoc = await UserModel.getById(user.uid);

      // Admin can view any doctor's appointments, doctors can only view their own
      if (
        userDoc.role === "admin" ||
        (userDoc.role === "doctor" && user.uid === doctorId)
      ) {
        return await AppointmentModel.getByDoctorId(
          doctorId || user.uid,
          limit,
          offset
        );
      }

      throw new ForbiddenError("Access denied");
    },

    // Get appointments by status
    appointmentsByStatus: async (
      _,
      { status, limit = 20, offset = 0 },
      context
    ) => {
      await isAdmin(context); // Only admins can query by status across all appointments
      return await AppointmentModel.getByStatus(
        status.toLowerCase(),
        limit,
        offset
      );
    },

    // Get upcoming appointments
    upcomingAppointments: async (_, { limit = 10 }, context) => {
      const user = isAuthenticated(context);
      const userDoc = await UserModel.getById(user.uid);

      if (userDoc.role === "patient" || userDoc.role === "doctor") {
        return await AppointmentModel.getUpcoming(
          user.uid,
          userDoc.role,
          limit
        );
      }

      throw new ForbiddenError("Invalid user role for appointments");
    },

    // Search appointments with filters
    searchAppointments: async (
      _,
      { filter, limit = 20, offset = 0 },
      context
    ) => {
      const user = isAuthenticated(context);
      const userDoc = await UserModel.getById(user.uid);

      // Apply user-specific filters based on role
      let searchFilter = { ...filter };

      if (userDoc.role === "patient") {
        searchFilter.patientId = user.uid;
      } else if (userDoc.role === "doctor") {
        searchFilter.doctorId = user.uid;
      }
      // Admin can search without restrictions

      // Convert enum values to lowercase for database
      if (searchFilter.status) {
        searchFilter.status = Array.isArray(searchFilter.status)
          ? searchFilter.status.map((s) => s.toLowerCase())
          : searchFilter.status.toLowerCase();
      }

      if (searchFilter.paymentStatus) {
        searchFilter.paymentStatus = searchFilter.paymentStatus.toLowerCase();
      }

      return await AppointmentModel.searchAppointments(
        searchFilter,
        limit,
        offset
      );
    },

    // Get appointment statistics
    appointmentStats: async (_, __, context) => {
      const user = isAuthenticated(context);
      const userDoc = await UserModel.getById(user.uid);

      // if (userDoc.role === "patient" || userDoc.role === "doctor") {
        return await AppointmentModel.getAppointmentStats(
          user.uid,
          userDoc.role
        );
      // }

    },

    appointmentFinancialSummary: async (_, { appointmentId }, context) => {
      const { appointment, user } = await canAccessAppointment(
        appointmentId,
        context
      );

      // Only admin, the patient, or the doctor can view financial summary
      if (
        user.role !== "admin" &&
        appointment.patientId !== context.user.uid &&
        appointment.doctorId !== context.user.uid
      ) {
        throw new ForbiddenError("Access denied to financial summary");
      }

      return await AppointmentModel.getFinancialSummary(appointmentId);
    },
  },

  Mutation: {
    // Create new appointment (patient only)
    createAppointment: async (_, { input }, context) => {
      const user = await isPatient(context);
      const patientDoc = await UserModel.getById(user.uid);

      // Check if patient document exists
      if (!patientDoc) {
        throw new UserInputError("Patient profile not found");
      }
      // Verify the slot exists and is available
      const slot = await DoctorAvailabilitySlotModel.getById(
        input.associatedSlotId
      );
      if (!slot || slot.isBooked) {
        throw new UserInputError("Selected time slot is not available");
      }

      // Get doctor profile for price information
      const doctorProfile = await DoctorProfileModel.getById(input.doctorId);
      if (!doctorProfile) {
        throw new UserInputError("Doctor not found");
      }

      const appointmentData = {
        ...input,
        patientId: user.uid,
        patientName: `${patientDoc.firstName} ${patientDoc.lastName}`,
        price: doctorProfile.pricePerSession,
      };

      // Use Firestore transaction to ensure atomicity
      const appointment = await db.runTransaction(async (transaction) => {
        // Create appointment with wallet deduction
        const createdAppointment = await AppointmentModel.create(
          appointmentData,
          transaction
        );

        // Mark slot as booked within the same transaction
        const slotRef = db
          .collection("doctorAvailabilitySlots")
          .doc(input.associatedSlotId);
        transaction.update(slotRef, {
          isBooked: true,
          appointmentId: createdAppointment.appointmentId,
          patientId: user.uid,
          updatedAt: timestamp(),
        });

        return createdAppointment;
      });

      return appointment;
    },

    // Update appointment details (patient only, before confirmation)
    updateAppointment: async (_, { input }, context) => {
      const { appointment, user } = await canAccessAppointment(
        input.appointmentId,
        context
      );

      // Only patients can update appointment details
      if (user.role !== "patient") {
        throw new ForbiddenError(
          "Only patients can update appointment details"
        );
      }

      // Can only update if appointment is still in requested status
      if (appointment.status !== "REQUESTED") {
        throw new UserInputError(
          "Cannot update appointment after it has been processed"
        );
      }

      const updateData = { ...input };
      delete updateData.appointmentId;

      return await AppointmentModel.update(input.appointmentId, updateData);
    },

    // Update appointment status
    updateAppointmentStatus: async (_, { input }, context) => {
      const { appointment, user } = await canAccessAppointment(
        input.appointmentId,
        context
      );

      const newStatus = input.status.toLowerCase();

      // Validate status transitions based on user role
      const validTransitions = {
        doctor: {
          requested: ["confirmed", "rejected"],
          upcoming: ["in_progress", "cancelled_doctor", "no_show"],
          in_progress: ["completed"],
          confirmed: ["upcoming", "cancelled_doctor"],
        },
        patient: {
          requested: ["cancelled_patient"],
          confirmed: ["cancelled_patient"],
          upcoming: ["cancelled_patient"],
        },
      };

      const userTransitions = validTransitions[user.role] || {};
      const allowedStatuses = userTransitions[appointment.status] || [];

      if (!allowedStatuses.includes(newStatus)) {
        throw new ForbiddenError(
          `Cannot change status from ${appointment.status} to ${newStatus}`
        );
      }

      return await AppointmentModel.updateStatus(
        input.appointmentId,
        newStatus,
        user.role,
        { reasonNote: input.reasonNote }
      );
    },

    // Soft delete appointment
    deleteAppointment: async (_, { appointmentId, reason }, context) => {
      const { appointment, user } = await canAccessAppointment(
        appointmentId,
        context
      );

      // Only allow deletion if appointment is not completed
      const deletableStatuses = [
        "requested",
        "confirmed",
        "cancelled_patient",
        "cancelled_doctor",
        "rejected",
        "no_show",
      ];
      if (!deletableStatuses.includes(appointment.status)) {
        throw new UserInputError("Cannot delete completed appointments");
      }

      // Free up the associated slot if exists
      if (appointment.associatedSlotId) {
        await DoctorAvailabilitySlotModel.updateSlot(
          appointment.associatedSlotId,
          {
            isBooked: false,
            appointmentId: null,
            patientId: null,
          }
        );
      }

      return await AppointmentModel.delete(appointmentId, user.role);
    },

    // Update payment status (admin only)
    updateAppointmentPaymentStatus: async (
      _,
      { appointmentId, paymentStatus, paymentData },
      context
    ) => {
      await isAdmin(context); // Only admins can update payment status

      const { appointment } = await canAccessAppointment(
        appointmentId,
        context
      );

      let additionalData = {};
      if (paymentData) {
        try {
          additionalData = JSON.parse(paymentData);
        } catch (error) {
          throw new UserInputError("Invalid payment data format");
        }
      }

      return await AppointmentModel.updatePaymentStatus(
        appointmentId,
        paymentStatus.toLowerCase(),
        additionalData
      );
    },

    // Cancel appointment
    cancelAppointment: async (_, { appointmentId, reason }, context) => {
      const { appointment, user } = await canAccessAppointment(
        appointmentId,
        context
      );


      // Check if appointment can be cancelled
      const cancellableStatuses = ["requested", "confirmed", "upcoming"];
      if (!cancellableStatuses.includes(appointment.status.toLowerCase())) {
        throw new UserInputError("Cannot cancel appointment in current status");
      }
      // Free up the associated slot
      if (appointment.associatedSlotId) {
        await DoctorAvailabilitySlotModel.updateSlot(
          appointment.associatedSlotId,
          {
            isBooked: false,
            appointmentId: null,
            patientId: null,
          }
          ,user.id
        );
      }

      // Use the model's cancelAppointment method which handles refunds
      return await AppointmentModel.cancelAppointment(
        appointmentId,
        user.role,
        reason
      );
    },

    // Doctor-specific actions
    confirmAppointment: async (_, { appointmentId }, context) => {
      const user = await isDoctor(context);
      const { appointment } = await canAccessAppointment(
        appointmentId,
        context
      );

      if (appointment.status !== "REQUESTED") {
        throw new UserInputError("Can only confirm requested appointments");
      }

      return await AppointmentModel.updateStatus(
        appointmentId,
        "confirmed",
        "doctor"
      );
    },

    rejectAppointment: async (_, { appointmentId, reason }, context) => {
      const user = await isDoctor(context);
      const { appointment } = await canAccessAppointment(
        appointmentId,
        context
      );

      if (appointment.status !== "REQUESTED") {
        throw new UserInputError("Can only reject requested appointments");
      }

      // Free up the associated slot
      if (appointment.associatedSlotId) {
        await DoctorAvailabilitySlotModel.updateSlot(
          appointment.associatedSlotId,
          {
            isBooked: false,
            appointmentId: null,
            patientId: null,
          }
        );
      }

      return await AppointmentModel.updateStatus(
        appointmentId,
        "rejected",
        "doctor",
        { reasonNote: reason }
      );
    },

    startAppointment: async (_, { appointmentId }, context) => {
      const user = await isDoctor(context);
      const { appointment } = await canAccessAppointment(
        appointmentId,
        context
      );

      if (appointment.status !== "UPCOMING") {
        throw new UserInputError("Can only start upcoming appointments");
      }

      return await AppointmentModel.updateStatus(
        appointmentId,
        "in_progress",
        "doctor"
      );
    },

    completeAppointment: async (_, { appointmentId, notes }, context) => {
      const user = await isDoctor(context);
      const { appointment } = await canAccessAppointment(
        appointmentId,
        context
      );

      if (appointment.status !== "IN_PROGRESS") {
        throw new UserInputError(
          "Can only complete appointments that are in progress"
        );
      }

      // Use the model's completeAppointment method which handles doctor payment
      return await AppointmentModel.completeAppointment(appointmentId, notes);
    },

    markNoShow: async (_, { appointmentId, reason }, context) => {
      const user = await isDoctor(context);
      const { appointment } = await canAccessAppointment(
        appointmentId,
        context
      );

      if (!["upcoming", "confirmed"].includes(appointment.status)) {
        throw new UserInputError(
          "Can only mark upcoming or confirmed appointments as no-show"
        );
      }

      // Free up the associated slot
      if (appointment.associatedSlotId) {
        await DoctorAvailabilitySlotModel.updateSlot(
          appointment.associatedSlotId,
          {
            isBooked: false,
            appointmentId: null,
            patientId: null,
          }
        );
      }

      return await AppointmentModel.updateStatus(
        appointmentId,
        "no_show",
        "doctor",
        { reasonNote: reason }
      );
    },

    // Patient-specific actions
    rescheduleAppointment: async (
      _,
      { appointmentId, newStartTime, newEndTime, newSlotId },
      context
    ) => {
      const user = await isPatient(context);
      const { appointment } = await canAccessAppointment(
        appointmentId,
        context
      );

      // Check if appointment can be rescheduled
      const reschedulableStatuses = ["requested", "confirmed"];
      if (!reschedulableStatuses.includes(appointment.status)) {
        throw new UserInputError(
          "Cannot reschedule appointment in current status"
        );
      }

      // Verify the new slot exists and is available
      const newSlot = await DoctorAvailabilitySlotModel.getById(newSlotId);
      if (!newSlot || newSlot.isBooked) {
        throw new UserInputError("Selected new time slot is not available");
      }

      // Free up the old slot
      if (appointment.associatedSlotId) {
        await DoctorAvailabilitySlotModel.updateSlot(
          appointment.associatedSlotId,
          {
            isBooked: false,
            appointmentId: null,
            patientId: null,
          }
        );
      }

      // Book the new slot
      await DoctorAvailabilitySlotModel.updateSlot(newSlotId, {
        isBooked: true,
        appointmentId: appointmentId,
        patientId: user.uid,
      });

      // Update appointment with new time and slot
      const updateData = {
        scheduledStartTime: newStartTime,
        scheduledEndTime: newEndTime,
        associatedSlotId: newSlotId,
        status: "requested", // Reset to requested status for doctor to confirm again
      };

      return await AppointmentModel.update(appointmentId, updateData);
    },
  },
};

module.exports = appointmentResolvers;
