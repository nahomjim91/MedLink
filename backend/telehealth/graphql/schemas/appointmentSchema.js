// /graphql/appointmentSchema.js
const { gql } = require("apollo-server-express");

const appointmentTypeDefs = gql`
  type Appointment {
    appointmentId: ID!
    patientId: String!
    patientName: String!
    doctorId: String!
    doctorName: String!
    status: AppointmentStatus!
    reasonNote: String
    scheduledStartTime: Date!
    scheduledEndTime: Date!
    actualStartTime: Date
    actualEndTime: Date
    price: Float!
    associatedSlotId: String
    paymentStatus: PaymentStatus!
    createdAt: Date!
    updatedAt: Date!
    cancelledAt: Date
    patient: THUser
    doctor: THUser
    cancellationReason: String
    completionNotes: String
    patientUpdatedAt: Date
    doctorUpdatedAt: Date
    deletedAt: Date
  }

  type AppointmentFinancialSummary {
    appointment: Appointment!
    transactions: [Transaction!]!
    refunds: [Refund!]!
    totalPaid: Float!
    totalRefunded: Float!
    doctorEarnings: Float!
  }

  enum AppointmentStatus {
    REQUESTED
    CONFIRMED
    REJECTED
    CANCELLED_PATIENT
    CANCELLED_DOCTOR
    CANCELLED_ADMIN
    UPCOMING
    IN_PROGRESS
    COMPLETED
    NO_SHOW
    ACTIVE
  }

  enum PaymentStatus {
    PENDING
    PAID
    REFUNDED
    FAILED
  }

  input CreateAppointmentInput {
    doctorId: String!
    doctorName: String!
    reasonNote: String
    scheduledStartTime: Date!
    scheduledEndTime: Date!
    associatedSlotId: String!
  }

  input UpdateAppointmentInput {
    appointmentId: ID!
    reasonNote: String
    scheduledStartTime: Date
    scheduledEndTime: Date
  }

  input UpdateAppointmentStatusInput {
    appointmentId: ID!
    status: AppointmentStatus!
    reasonNote: String
  }

  input AppointmentFilterInput {
    patientId: String
    doctorId: String
    status: [AppointmentStatus]
    paymentStatus: PaymentStatus
    startDate: Date
    endDate: Date
    orderBy: String # "scheduledStartTime", "createdAt", "updatedAt"
    orderDirection: String # "asc", "desc"
  }

  type AppointmentSearchResult {
    appointments: [Appointment]
    totalCount: Int
    hasMore: Boolean
  }

  type AppointmentStats {
    total: Int!
    completed: Int!
    upcoming: Int!
    cancelled: Int!
  }

  extend type Query {
    # Get single appointment
    appointment(appointmentId: ID!): Appointment

    # Get appointments for current user (patient or doctor)
    myAppointments(limit: Int, offset: Int): [Appointment]

    # Get appointments by patient ID (admin or the patient themselves)
    patientAppointments(
      patientId: String
      limit: Int
      offset: Int
    ): [Appointment]

    # Get appointments by doctor ID (admin or the doctor themselves)
    doctorAppointments(doctorId: String, limit: Int, offset: Int): [Appointment]

    # Get appointments by status
    appointmentsByStatus(
      status: AppointmentStatus!
      limit: Int
      offset: Int
    ): [Appointment]

    # Get upcoming appointments for current user
    upcomingAppointments(limit: Int): [Appointment]

    # Search appointments with filters
    searchAppointments(
      filter: AppointmentFilterInput
      limit: Int
      offset: Int
    ): AppointmentSearchResult

    # Get appointment statistics for current user
    appointmentStats: AppointmentStats

    # Get financial summary for an appointment
    appointmentFinancialSummary(appointmentId: ID!): AppointmentFinancialSummary
  }

  extend type Mutation {
    # Create new appointment (patient only)
    createAppointment(input: CreateAppointmentInput!): Appointment

    # Update appointment details (patient only, before confirmation)
    updateAppointment(input: UpdateAppointmentInput!): Appointment

    # Update appointment status (doctor or patient based on status)
    updateAppointmentStatus(input: UpdateAppointmentStatusInput!): Appointment

    # Soft delete appointment
    deleteAppointment(appointmentId: ID!, reason: String): Boolean

    # Update payment status (admin only)
    updateAppointmentPaymentStatus(
      appointmentId: ID!
      paymentStatus: PaymentStatus!
      paymentData: String # JSON string for additional payment data
    ): Appointment

    # Cancel appointment (patient or doctor)
    cancelAppointment(appointmentId: ID!, reason: String): Appointment

    # Doctor actions
    confirmAppointment(appointmentId: ID!): Appointment
    rejectAppointment(appointmentId: ID!, reason: String!): Appointment
    startAppointment(appointmentId: ID!): Appointment
    completeAppointment(appointmentId: ID!, notes: String): Appointment
    markNoShow(appointmentId: ID!, reason: String): Appointment

    # Patient actions
    rescheduleAppointment(
      appointmentId: ID!
      newStartTime: Date!
      newEndTime: Date!
      newSlotId: String!
    ): Appointment
  }
`;

module.exports = appointmentTypeDefs;

