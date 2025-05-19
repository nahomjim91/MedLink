// /api/graphql/mutations.js
import { gql } from "@apollo/client";

// Mutation to initialize a medical supplies user profile
export const INITIALIZE_MS_USER_PROFILE = gql`
  mutation InitializeMSUserProfile($email: String!) {
    initializeMSUserProfile(email: $email) {
      userId
      email
      role
    }
  }
`;

// Mutation to update user profile
export const UPDATE_MS_USER_PROFILE = gql`
  mutation UpdateMSUserProfile($input: MSUserInput!) {
    updateMSUserProfile(input: $input) {
      userId
      email
      role
      companyName
      contactName
      phoneNumber
      address {
        street
        city
        state
        country
        postalCode
        geoLocation {
          latitude
          longitude
        }
        geoLocationText
      }
      profileComplete
      rejectionReason
      profileImageUrl
      efdaLicenseUrl
      businessLicenseUrl
    }
  }
`;

// Mutation to complete registration
export const COMPLETE_MS_REGISTRATION = gql`
  mutation CompleteMSRegistration($input: MSUserInput!) {
    completeMSRegistration(input: $input) {
      userId
      email
      role
      companyName
      contactName
      phoneNumber
      address {
        street
        city
        state
        country
        postalCode
        geoLocation {
          latitude
          longitude
        }
        geoLocationText
      }
      profileImageUrl
      efdaLicenseUrl
      businessLicenseUrl
      isApproved
    }
  }
`;

// Mutation to approve a user (admin only)
export const APPROVE_MS_USER = gql`
  mutation ApproveMSUser($userId: ID!) {
    approveMSUser(userId: $userId) {
      userId
      email
      isApproved
      approvedBy
      approvedAt
    }
  }
`;

// Mutation to reject a user (admin only)
export const REJECT_MS_USER = gql`
  mutation RejectMSUser($userId: ID!, $reason: String!) {
    rejectMSUser(userId: $userId, reason: $reason)
  }
`;

