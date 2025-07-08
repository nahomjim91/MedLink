// api/graphql/thRating/ratingMutations.js
import { gql } from "@apollo/client";

// Create rating between doctor and patient
export const CREATE_TH_RATING = gql`
  mutation CreateTHRating($input: CreateTHRatingInput!) {
    createTHRating(input: $input) {
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

// Delete rating (admin only)
export const DELETE_TH_RATING = gql`
  mutation DeleteTHRating($ratingId: ID!, $reason: String!) {
    deleteTHRating(ratingId: $ratingId, reason: $reason)
  }
`;

// Batch create ratings (for multiple users in same appointment)
export const CREATE_MULTIPLE_TH_RATINGS = gql`
  mutation CreateMultipleTHRatings($inputs: [CreateTHRatingInput!]!) {
    createMultipleTHRatings(inputs: $inputs) {
      success
      ratings {
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
      errors {
        message
        input
      }
    }
  }
`;

// Update rating (if editing is allowed)
export const UPDATE_TH_RATING = gql`
  mutation UpdateTHRating($ratingId: ID!, $input: UpdateTHRatingInput!) {
    updateTHRating(ratingId: $ratingId, input: $input) {
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

// Report rating (for inappropriate content)
export const REPORT_TH_RATING = gql`
  mutation ReportTHRating($ratingId: ID!, $reason: String!, $description: String) {
    reportTHRating(ratingId: $ratingId, reason: $reason, description: $description) {
      success
      message
    }
  }
`;