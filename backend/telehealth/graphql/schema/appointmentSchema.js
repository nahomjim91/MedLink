// /graphql/schema/appointmentSchema.js
const { gql } = require("apollo-server-express");

const appointmentTypeDefs = gql`
  scalar Date

  type Appointment {
    appointmentId: ID!
    patientId: String!
    patientName: String
    doctorId: String!
    doctorName: String
    status: String!
    scheduledStartTime: Date
    scheduledEndTime: Date
    actualStartTime: Date
    actualEndTime: Date
    createdAt: Date
    updatedAt: Date
  }

  type AvailableSlot {
    slotId: ID!
    doctorId: String!
    doctorName: String
    startTime: Date!
    endTime: Date!
    isBooked: Boolean!
    createdAt: Date
    updatedAt: Date
  }

  enum AppointmentStatus {
    SCHEDULED
    CONFIRMED
    CANCELLED
    COMPLETED
    NO_SHOW
  }

  input AppointmentInput {
    doctorId: String!
    doctorName: String
    scheduledStartTime: Date!
    scheduledEndTime: Date!
  }

  input AvailableSlotInput {
    startTime: Date!
    endTime: Date!
  }

  input UpdateAppointmentInput {
    status: AppointmentStatus
  }

  extend type Query {
    myAppointments: [Appointment]
    doctorAppointments(doctorId: ID!): [Appointment]
    appointmentById(id: ID!): Appointment
    doctorAvailableSlots(doctorId: ID!): [AvailableSlot]
    availableSlotsByDate(doctorId: ID!, date: Date!): [AvailableSlot]
  }

  extend type Mutation {
    createAppointment(input: AppointmentInput!): Appointment
    updateAppointment(id: ID!, input: UpdateAppointmentInput!): Appointment
    deleteAppointment(id: ID!): Boolean
    createAvailableSlot(input: AvailableSlotInput!): AvailableSlot
    deleteAvailableSlot(slotId: ID!): Boolean
  }
`;

module.exports = appointmentTypeDefs;
