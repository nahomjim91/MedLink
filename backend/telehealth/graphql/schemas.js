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

    # Availability queries
    doctorAvailableSlots(doctorId: ID!, date: String): [DoctorAvailabilitySlot]
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
