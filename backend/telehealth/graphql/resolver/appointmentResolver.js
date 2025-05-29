// /graphql/resolver/appointmentResolver.js
const AppointmentModel = require("../../models/appointment");
const SlotModel = require("../../models/availableSlot");
const { AuthenticationError } = require("apollo-server-express");

const appointmentResolvers = {
  Query: {
    myAppointments: async (_, __, context) => {
      if (!context.user) throw new AuthenticationError("You must be logged in");
      return await AppointmentModel.getByPatientId(context.user.uid);
    },
    doctorAppointments: async (_, { doctorId }) => {
      return await AppointmentModel.getByDoctorId(doctorId);
    },
    appointmentById: async (_, { id }) => {
      return await AppointmentModel.getById(id);
    },
    doctorAvailableSlots: async (_, { doctorId }) => {
      return await SlotModel.getByDoctorId(doctorId);
    },
    availableSlotsByDate: async (_, { doctorId, date }) => {
      return await SlotModel.getByDoctorIdAndDate(doctorId, date);
    },
  },

  Mutation: {
    createAppointment: async (_, { input }, context) => {
      if (!context.user) throw new AuthenticationError("Not authenticated");
      return await AppointmentModel.create(context.user.uid, input);
    },
    updateAppointment: async (_, { id, input }) => {
      return await AppointmentModel.update(id, input);
    },
    deleteAppointment: async (_, { id }) => {
      return await AppointmentModel.delete(id);
    },
    createAvailableSlot: async (_, { input }, context) => {
      if (!context.user) throw new AuthenticationError("Not authenticated");

      return await SlotModel.create(context.user.uid, input);
    },
    deleteAvailableSlot: async (_, { slotId }) => {
      return await SlotModel.delete(slotId);
    },
  },
};

module.exports = appointmentResolvers;
