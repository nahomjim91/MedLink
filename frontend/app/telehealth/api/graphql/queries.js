//app/telehealth/api/graphql/queries.js
import { gql } from "@apollo/client";
// Query to get current user profile
export const GET_MY_PROFILE = gql`
  query GetMyProfile {
    me {
      id
      email
      role
      firstName
      lastName
      phoneNumber
      gender
      dob
      profileImageUrl
      profileComplete
      createdAt
      doctorProfile {
        doctorId
        specialization
        experienceYears
        aboutMe
        isApproved
        telehealthWalletBalance
        pricePerSession
        certificates {
          name
          url
        }
      }
      patientProfile {
        patientId
        height
        weight
        bloodType
        telehealthWalletBalance
      }
    }
  }
`;

// Query to get a doctor by ID
export const GET_DOCTOR_BY_ID = gql`
  query GetDoctorById($id: ID!) {
    doctorById(id: $id) {
      doctorId
      specialization
      experienceYears
      aboutMe
      pricePerSession
      certificates {
        name
        url
      }
      averageRating
      ratingCount
      isApproved
      user {
        firstName
        lastName
        gender
        profileImageUrl
        dob
      }
    }
  }
`;

// Query to get doctors by specialization
export const GET_DOCTORS_BY_SPECIALIZATION = gql`
  query GetDoctorsBySpecialization($specialization: String!) {
    doctorsBySpecialization(specialization: $specialization) {
      doctorId
      specialization
      experienceYears
      pricePerSession
      averageRating
      ratingCount
      isApproved
      user {
        firstName
        lastName
        gender
        profileImageUrl
      }
    }
  }
`;
// Query to get all doctors with pagination
export const GET_ALL_DOCTORS = gql`
  query GetAllDoctors($limit: Int, $offset: Int) {
    allDoctors(limit: $limit, offset: $offset) {
      doctorId
      specialization
      experienceYears
      pricePerSession
      averageRating
      ratingCount
      isApproved
      user {
        firstName
        lastName
        gender
        profileImageUrl
      }
    }
  }
`;

export const SEARCH_DOCTORS = gql`
  query SearchDoctors($input: DoctorSearchInput!, $limit: Int, $offset: Int) {
    searchDoctors(input: $input, limit: $limit, offset: $offset) {
      doctors {
        doctorId
        specialization
        experienceYears
        averageRating
        ratingCount
        pricePerSession
        aboutMe
        isApproved
        user {
          firstName
          lastName
          gender
          profileImageUrl
        }
      }
      totalCount
      hasMore
    }
  }
`;

export const FILTER_DOCTORS = gql`
  query FilterDoctors($filter: DoctorFilterInput!, $limit: Int, $offset: Int) {
    filterDoctors(filter: $filter, limit: $limit, offset: $offset) {
      doctors {
        doctorId
        specialization
        experienceYears
        averageRating
        ratingCount
        pricePerSession
        aboutMe
        isApproved
        user {
          firstName
          lastName
          gender
          profileImageUrl
        }
      }
      totalCount
      hasMore
    }
  }
`;

export const GET_DOCTOR_SPECIALIZATIONS = gql`
  query GetDoctorSpecializations {
    getDoctorSpecializations
  }
`;
