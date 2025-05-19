// /api/graphql/queries.js
import { gql } from "@apollo/client";

// Query to get the current MS user profile
export const GET_MS_ME = gql`
  query GetMSMe {
    msMe {
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
      createdAt
      isApproved
      rejectionReason
      profileComplete
      approvedBy
      approvedAt
      efdaLicenseUrl
      businessLicenseUrl
     
    }
  }
`;

// Query to get a specific MS user by ID (for admin use)
export const GET_MS_USER_BY_ID = gql`
  query GetMSUserById($userId: ID!) {
    msUserById(userId: $userId) {
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
      createdAt
      isApproved
      approvedBy
      approvedAt
      efdaLicenseUrl
      businessLicenseUrl
    }
  }
`;

// Query to get users by role (for admin use)
export const GET_MS_USERS_BY_ROLE = gql`
  query GetMSUsersByRole($role: String!) {
    msUsersByRole(role: $role) {
      userId
      email
      companyName
      contactName
      phoneNumber
      profileImageUrl
      isApproved
      createdAt
    }
  }
`;

// Query to get pending approval users (for admin use)
export const GET_PENDING_APPROVAL_USERS = gql`
  query GetPendingApprovalUsers($limit: Int, $offset: Int) {
    pendingApprovalUsers(limit: $limit, offset: $offset) {
      userId
      email
      role
      companyName
      contactName
      phoneNumber
      profileImageUrl
      createdAt
      efdaLicenseUrl
      businessLicenseUrl
      rejectionReason
    }
  }
`;

// Query to search for users (for admin use)
export const SEARCH_MS_USERS = gql`
  query SearchMSUsers($query: String!, $limit: Int, $offset: Int) {
    searchMSUsers(query: $query, limit: $limit, offset: $offset) {
      userId
      email
      role
      companyName
      contactName
      phoneNumber
      profileImageUrl
      isApproved
    }
  }
`;


