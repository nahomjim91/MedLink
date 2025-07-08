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

