// api/graphql/rating/ratingQueries.js
import { gql } from "@apollo/client";

// Get doctor ratings (ratings received by a doctor)
export const GET_DOCTOR_RATINGS = gql`
  query GetDoctorRatings($doctorId: ID!, $limit: Int, $offset: Int) {
    doctorRatings(doctorId: $doctorId, limit: $limit, offset: $offset) {
      id
      raterId
      raterName
      raterRole
      raterProfileImage
      ratedUserId
      ratedUserName
      ratedUserRole
      appointmentId
      rating
      comment
      ratingType
      createdAt
      updatedAt
    }
  }
`;

// Get patient ratings (ratings received by a patient)
export const GET_PATIENT_RATINGS = gql`
  query GetPatientRatings($patientId: ID!, $limit: Int, $offset: Int) {
    patientRatings(patientId: $patientId, limit: $limit, offset: $offset) {
      id
      raterId
      raterName
      raterRole
      raterProfileImage
      ratedUserId
      ratedUserName
      ratedUserRole
      appointmentId
      rating
      comment
      ratingType
      createdAt
      updatedAt
    }
  }
`;

// Get ratings given by current user
export const GET_MY_TH_RATINGS = gql`
  query GetMyTHRatings($limit: Int, $offset: Int) {
    myTHRatings(limit: $limit, offset: $offset) {
      id
      raterId
      raterName
      raterRole
      raterProfileImage
      ratedUserId
      ratedUserName
      ratedUserRole
      appointmentId
      rating
      comment
      ratingType
      createdAt
      updatedAt
    }
  }
`;

// Get ratings for a specific appointment
export const GET_APPOINTMENT_RATINGS = gql`
  query GetAppointmentRatings($appointmentId: ID!) {
    appointmentRatings(appointmentId: $appointmentId) {
      id
      raterId
      raterName
      raterRole
      raterProfileImage
      ratedUserId
      ratedUserName
      ratedUserRole
      appointmentId
      rating
      comment
      ratingType
      createdAt
      updatedAt
    }
  }
`;

// Get doctor rating statistics
export const GET_DOCTOR_RATING_STATS = gql`
  query GetDoctorRatingStats($doctorId: ID!) {
    doctorRatingStats(doctorId: $doctorId) {
      totalRatings
      averageRating
      lastUpdated
    }
  }
`;

// Check if user can rate another user for specific appointment
export const CAN_RATE_USER = gql`
  query CanRateUser($appointmentId: ID!, $ratedUserId: ID!) {
    canRateUser(appointmentId: $appointmentId, ratedUserId: $ratedUserId)
  }
`;

// Combined query for appointment with ratings check
export const GET_APPOINTMENT_WITH_RATINGS = gql`
  query GetAppointmentWithRatings($appointmentId: ID!) {
    appointmentRatings(appointmentId: $appointmentId) {
      id
      raterId
      raterName
      raterRole
      raterProfileImage
      ratedUserId
      ratedUserName
      ratedUserRole
      appointmentId
      rating
      comment
      ratingType
      createdAt
      updatedAt
    }
  }
`;

// Get user ratings by type (doctor or patient)
export const GET_USER_RATINGS_BY_TYPE = gql`
  query GetUserRatingsByType($userId: ID!, $ratingType: THRatingType!, $limit: Int, $offset: Int) {
    doctorRatings(doctorId: $userId, limit: $limit, offset: $offset) @include(if: $isDoctorRating)
    patientRatings(patientId: $userId, limit: $limit, offset: $offset) @include(if: $isPatientRating)
  }
`;

// Fragment for rating data
export const RATING_FRAGMENT = gql`
  fragment RatingData on THRating {
    id
    raterId
    raterName
    raterRole
    raterProfileImage
    ratedUserId
    ratedUserName
    ratedUserRole
    appointmentId
    rating
    comment
    ratingType
    createdAt
    updatedAt
  }
`;

// Fragment for rating stats
export const RATING_STATS_FRAGMENT = gql`
  fragment RatingStatsData on THRatingStats {
    totalRatings
    averageRating
    lastUpdated
  }
`;