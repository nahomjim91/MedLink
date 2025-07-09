// /graphql/schemas.js - Updated with Availability Slots
const { gql } = require("apollo-server-express");

const typeDefs = gql`
  scalar Date

  type THUser {
    id: ID!
    email: String!
    role: String
    firstName: String
    lastName: String
    phoneNumber: String
    gender: String
    dob: Date
    profileImageUrl: String
    createdAt: Date
    profileComplete: Boolean
    doctorProfile: DoctorProfile
    patientProfile: PatientProfile
  }

  type DoctorProfile {
    doctorId: ID!
    specialization: [String]
    experienceYears: Int
    aboutMe: String
    certificates: [Certificate]
    averageRating: Float
    ratingCount: Int
    isApproved: Boolean
    approvedAt: Date
    rejectionReason: String
    pricePerSession: Float
    telehealthWalletBalance: Float
    availabilitySlots: [DoctorAvailabilitySlot]
    user: THUser
    createdAt: Date
    updatedAt: Date
  }

  type DoctorAvailabilitySlot {
    slotId: ID!
    doctorId: ID!
    startTime: Date!
    endTime: Date!
    isBooked: Boolean!
    appointmentId: String
    patientId: String
    createdAt: Date!

  }

  type Certificate {
    name: String
    url: String
  }

  type PatientProfile {
    patientId: ID!
    height: Float
    weight: Float
    bloodType: String
    telehealthWalletBalance: Float
    user: THUser
    createdAt: Date
    updatedAt: Date
  }

  input THUserInput {
    firstName: String
    lastName: String
    phoneNumber: String
    gender: String
    dob: Date
    role: String
    profileImageUrl: String
    profileComplete: Boolean
    telehealthWalletBalance: Float
  }

  input DoctorProfileInput {
    displayName: String
    gender: String
    specialization: [String]
    experienceYears: Int
    aboutMe: String
    profileImageUrl: String
    pricePerSession: Float
    telehealthWalletBalance: Float
    certificates: [CertificateInput]

  }

  input CertificateInput {
    name: String!
    url: String!
  }

  input PatientProfileInput {
    height: Float
    weight: Float
    bloodType: String
  }

  input AvailabilitySlotInput {
    startTime: Date!
    endTime: Date!
  }

  input UpdateAvailabilitySlotInput {
    slotId: ID!
    startTime: Date
    endTime: Date
  }

  # Filter and search inputs
  input DoctorSearchInput {
    searchTerm: String
    specialization: [String]
    minExperience: Int
    maxExperience: Int
    minPrice: Float
    maxPrice: Float
    minRating: Float
    gender: String
    isApproved: Boolean
    sortBy: String # "rating", "experience", "price", "name"
    sortOrder: String # "asc", "desc"
  }

  input DoctorFilterInput {
    specializations: [String]
    experienceRange: ExperienceRangeInput
    priceRange: PriceRangeInput
    rating: Float
    gender: String
  }

  input ExperienceRangeInput {
    min: Int
    max: Int
  }

  input PriceRangeInput {
    min: Float
    max: Float
  }

  type DoctorSearchResult {
    doctors: [DoctorProfile]
    totalCount: Int
    hasMore: Boolean
  }

  type Query {
    # User queries
    me: THUser
    thUserById(id: ID!): THUser

    # Doctor queries
    doctorById(id: ID!): DoctorProfile
    doctorsBySpecialization(specialization: String!): [DoctorProfile]
    allDoctors(limit: Int, offset: Int): [DoctorProfile]

    # Search and filter queries
    searchDoctors(
      input: DoctorSearchInput!
      limit: Int
      offset: Int
    ): DoctorSearchResult
    filterDoctors(
      filter: DoctorFilterInput!
      limit: Int
      offset: Int
    ): DoctorSearchResult
    getDoctorSpecializations: [String]

    # Patient queries
    patientById(id: ID!): THUser
    # Admin queries
    allPatients(limit: Int, offset: Int): [PatientProfile]

    # Availability queries
    doctorAvailableSlots(doctorId: ID!, date: String): [DoctorAvailabilitySlot]
    doctorSlots(doctorId: ID!, date: String): [DoctorAvailabilitySlot]
    myAvailabilitySlots: [DoctorAvailabilitySlot]
  }

  type Mutation {
    # User mutations
    initializeUserProfile(email: String!): THUser
    updateUserProfile(input: THUserInput!): THUser

    # Doctor mutations
    updateDoctorProfile(input: DoctorProfileInput!): DoctorProfile
    addCertificate(certificate: CertificateInput!): DoctorProfile

    # Patient mutations
    updatePatientProfile(input: PatientProfileInput!): THUser

    # Admin mutations
    approveDoctorProfile(doctorId: ID!): DoctorProfile

    # Availability mutations
    addAvailabilitySlot(input: AvailabilitySlotInput!): [DoctorAvailabilitySlot]
    updateAvailabilitySlot(
      input: UpdateAvailabilitySlotInput!
    ): DoctorAvailabilitySlot
    deleteAvailabilitySlot(slotId: ID!): Boolean
    deleteMultipleSlots(slotIds: [ID!]!): Boolean

    # Registration
    completeRegistration(
      THuserInput: THUserInput!
      doctorInput: DoctorProfileInput
      patientInput: PatientProfileInput
    ): THUser
  }
`;

module.exports = typeDefs;
// /graphql/transactionSchema.js
const { gql } = require("apollo-server-express");

const transactionTypeDefs = gql`
  type Transaction {
    transactionId: ID!
    userId: String!
    type: TransactionType!
    amount: Float!
    reason: String
    relatedAppointmentId: String
    chapaRef: String
    status: TransactionStatus!
    createdAt: Date!
    completedAt: Date
    failedAt: Date
    patient: THUser
    relatedAppointment: Appointment
  }

  type Refund {
    refundId: ID!
    userId: String!
    originalWalletTransactionId: String
    relatedAppointmentId: String!
    amount: Float!
    status: RefundStatus!
    reason: String
    requestedAt: Date!
    processedAt: Date
    patient: THUser
    originalTransaction: Transaction
    relatedAppointment: Appointment
  }

  enum TransactionType {
    DEPOSIT
    PAYMENT
    REFUND
    DEBIT
    CREDIT
  }

  enum TransactionStatus {
    PENDING
    SUCCESS
    FAILED
  }

  enum RefundStatus {
    REQUESTED
    APPROVED
    PROCESSED
    REJECTED
  }

  input CreateTransactionInput {
    type: TransactionType!
    amount: Float!
    reason: String
    relatedAppointmentId: String
    chapaRef: String
  }

  input UpdateTransactionInput {
    transactionId: ID!
    status: TransactionStatus
    chapaRef: String
    reason: String
  }

  input CreateRefundInput {
    originalWalletTransactionId: String!
    relatedAppointmentId: String!
    amount: Float!
    reason: String!
  }

  input UpdateRefundInput {
    refundId: ID!
    status: RefundStatus!
    reason: String
  }

  input TransactionFilterInput {
    userId: String
    type: [TransactionType]
    status: [TransactionStatus]
    relatedAppointmentId: String
    startDate: Date
    endDate: Date
    orderBy: String # "createdAt", "amount"
    orderDirection: String # "asc", "desc"
  }

  input RefundFilterInput {
    userId: String
    status: [RefundStatus]
    relatedAppointmentId: String
    startDate: Date
    endDate: Date
    orderBy: String # "requestedAt", "processedAt", "amount"
    orderDirection: String # "asc", "desc"
  }

  type TransactionSearchResult {
    transactions: [Transaction]
    totalCount: Int
    hasMore: Boolean
  }

  type RefundSearchResult {
    refunds: [Refund]
    totalCount: Int
    hasMore: Boolean
  }

  type TransactionStats {
    total: Int!
    success: Int!
    pending: Int!
    failed: Int!
    totalAmount: Float!
    successAmount: Float!
    pendingAmount: Float!
  }

  type RefundStats {
    total: Int!
    requested: Int!
    approved: Int!
    processed: Int!
    rejected: Int!
    totalAmount: Float!
    processedAmount: Float!
  }

  extend type Query {
    # Get single transaction
    transaction(transactionId: ID!): Transaction
    
    # Get single refund
    refund(refundId: ID!): Refund
    
    # Get transactions for current user (patient)
    myTransactions(limit: Int, offset: Int): [Transaction]
    
    # Get refunds for current user (patient)
    myRefunds(limit: Int, offset: Int): [Refund]
    
    # Get transactions by patient ID (admin only)
    patientTransactions(userId: String!, limit: Int, offset: Int): [Transaction]
    
    # Get refunds by patient ID (admin only)
    patientRefunds(userId: String!, limit: Int, offset: Int): [Refund]
    
    # Get transactions by type (admin only)
    transactionsByType(type: TransactionType!, limit: Int, offset: Int): [Transaction]
    
    # Get transactions by status (admin only)
    transactionsByStatus(status: TransactionStatus!, limit: Int, offset: Int): [Transaction]
    
    # Get refunds by status (admin only)
    refundsByStatus(status: RefundStatus!, limit: Int, offset: Int): [Refund]
    
    # Get transactions by appointment ID
    appointmentTransactions(appointmentId: String!): [Transaction]
    
    # Get refunds by appointment ID
    appointmentRefunds(appointmentId: String!): [Refund]
    
    # Search transactions with filters
    searchTransactions(
      filter: TransactionFilterInput
      limit: Int
      offset: Int
    ): TransactionSearchResult
    
    # Search refunds with filters
    searchRefunds(
      filter: RefundFilterInput
      limit: Int
      offset: Int
    ): RefundSearchResult
    
    # Get transaction statistics for current user
    transactionStats: TransactionStats
    
    # Get refund statistics for current user
    refundStats: RefundStats
    
    # Get all transaction statistics (admin only)
    allTransactionStats: TransactionStats
    
    # Get all refund statistics (admin only)
    allRefundStats: RefundStats
  }

  extend type Mutation {
    # Create new transaction (patient only)
    createTransaction(input: CreateTransactionInput!): Transaction
    
    # Update transaction (admin only, or system updates)
    updateTransaction(input: UpdateTransactionInput!): Transaction
    
    # Update transaction status (admin only, or system updates)
    updateTransactionStatus(
      transactionId: ID!
      status: TransactionStatus!
      additionalData: String
    ): Transaction
    
    # Create refund request (patient only)
    requestRefund(input: CreateRefundInput!): Refund
    
    # Update refund (admin only)
    updateRefund(input: UpdateRefundInput!): Refund
    
    # Admin refund actions
    approveRefund(refundId: ID!, reason: String): Refund
    rejectRefund(refundId: ID!, reason: String!): Refund
    processRefund(refundId: ID!, transactionRef: String): Refund
    
    # Process deposit (called after successful Chapa payment)
    processDeposit(
      transactionId: ID!
      chapaRef: String!
      amount: Float!
    ): Transaction
    
    # Process payment for appointment (internal system call)
    processAppointmentPayment(
      appointmentId: String!
      amount: Float!
    ): Transaction
    
    # Process refund payment (internal system call after refund approval)
    processRefundPayment(
      refundId: ID!
      transactionRef: String!
    ): Transaction
    
    # Initiate Chapa payment for deposit
    initiateDeposit(amount: Float!): Transaction
    
    # Cancel pending transaction
    cancelTransaction(transactionId: ID!): Transaction
    
    # Bulk process transactions (admin only)
    bulkProcessTransactions(transactionIds: [ID!]!): [Transaction]
  }
`;

module.exports = transactionTypeDefs;

const { gql } = require("apollo-server-express");

const thRatingTypeDefs = gql`
  enum THRatingType {
    doctor_rating
    patient_rating
  }

  type THRatingStats {
    totalRatings: Int!
    averageRating: Float!
    lastUpdated: Date
  }

  type THRating {
    id: ID!
    raterId: ID!
    raterName: String!
    raterRole: String!
    raterProfileImage: String
    ratedUserId: ID!
    ratedUserName: String!
    ratedUserRole: String!
    appointmentId: ID!
    rating: Int!
    comment: String
    ratingType: THRatingType!
    createdAt: Date!
    updatedAt: Date!
  }

  input CreateTHRatingInput {
    ratedUserId: ID!
    appointmentId: ID!
    rating: Int!
    comment: String
    ratingType: THRatingType!
  }

  extend type Query {
    # Get doctor ratings (ratings received by a doctor)
    doctorRatings(doctorId: ID!, limit: Int, offset: Int): [THRating!]!
    
    # Get patient ratings (ratings received by a patient)
    patientRatings(patientId: ID!, limit: Int, offset: Int): [THRating!]!
    
    # Get ratings given by current user
    myTHRatings(limit: Int, offset: Int): [THRating!]!
    
    # Get ratings for a specific appointment
    appointmentRatings(appointmentId: ID!): [THRating!]!
    
    # Get doctor rating statistics
    doctorRatingStats(doctorId: ID!): THRatingStats!
    
    # Check if user can rate another user for specific appointment
    canRateUser(appointmentId: ID!, ratedUserId: ID!): Boolean!
  }

  extend type Mutation {
    # Create rating between doctor and patient
    createTHRating(input: CreateTHRatingInput!): THRating!
    
    # Delete rating (admin only)
    deleteTHRating(ratingId: ID!, reason: String!): Boolean!
  }
`;

module.exports = thRatingTypeDefs;

// graphql/schemas/prescriptionSchema.js
const prescriptionTypeDefs = `
  type Prescription {
    id: ID!
    appointmentId: ID!
    patientDetails: PrescriptionPatientDetails!
    doctorDetails: PrescriptionDoctorDetails!
    medications: [Medication!]!
    recommendations: String
    signature: String
    status: String
    createdAt: Date!
    updatedAt: Date!
  }

  type PrescriptionPatientDetails {
    patientId: ID!
    name: String!
    profileImage: String
  }

  type PrescriptionDoctorDetails {
    doctorId: ID!
    name: String!
    profileImage: String
  }

  type Medication {
    drugName: String!
    dosage: String!
    route: String!
    frequency: String!
    duration: String!
    instructions: String!
  }

  input PrescriptionInput {
    appointmentId: ID!
    patientDetails: PrescriptionPatientDetailsInput!
    doctorDetails: PrescriptionDoctorDetailsInput!
    medications: [MedicationInput!]!
    recommendations: String
    signature: String
    status: String
  }

  input PrescriptionPatientDetailsInput {
    patientId: ID!
    name: String!
    profileImage: String
  }

  input PrescriptionDoctorDetailsInput {
    doctorId: ID!
    name: String!
    profileImage: String
  }

  input MedicationInput {
    drugName: String!
    dosage: String!
    route: String!
    frequency: String!
    duration: String!
    instructions: String!
  }

  extend type Query {
    # Prescription queries
    prescriptionById(id: ID!): Prescription
    prescriptionsByAppointmentId(appointmentId: ID!): [Prescription!]!
    prescriptionsByPatientId(patientId: ID!): [Prescription!]!
    prescriptionsByDoctorId(doctorId: ID!): [Prescription!]!
    myPrescriptions: [Prescription!]!
    myPatientsPrescriptions: [Prescription!]!
    #admin
    allPrescriptions: [Prescription!]
  }

  extend type Mutation {
    # Prescription mutations
    createPrescription(input: PrescriptionInput!): Prescription!
  }
`;

module.exports = prescriptionTypeDefs;
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

