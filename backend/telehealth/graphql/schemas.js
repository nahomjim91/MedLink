// /graphql/schemas.js
const { gql } = require('apollo-server-express');

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
  }

  type DoctorProfile {
    doctorId: ID!
    displayName: String
    gender: String
    profileImageUrl: String
    specialization: String
    experienceYears: Int
    aboutMe: String
    certificates: [Certificate]
    averageRating: Float
    ratingCount: Int
    isApproved: Boolean
    approvedAt: Date
  }

  type Certificate {
    name: String
    url: String
  }

  type PatientProfile {
    patientId: ID!
    height: String
    weight: String
    bloodType: String
    telehealthWalletBalance: Float
  }

  input THUserInput {
    firstName: String
    lastName: String
    phoneNumber: String
    gender: String
    dob: Date
    role: String
    profileImageUrl: String
  }

  input DoctorProfileInput {
    displayName: String
    gender: String
    specialization: String
    experienceYears: Int
    aboutMe: String
    profileImageUrl: String
  }

  input CertificateInput {
    name: String!
    url: String!
  }

  input PatientProfileInput {
    height: String
    weight: String
    bloodType: String
  }

  type Query {
    # User queries
    me: THUser
    thUserById(id: ID!): THUser

    # Doctor queries
    doctorById(id: ID!): DoctorProfile
    doctorsBySpecialization(specialization: String!): [DoctorProfile]
    allDoctors(limit: Int, offset: Int): [DoctorProfile]
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
    
    # Registration
    completeRegistration(
      THuserInput: THUserInput!
      doctorInput: DoctorProfileInput
      patientInput: PatientProfileInput
    ): THUser
  }
`;

module.exports = typeDefs;

