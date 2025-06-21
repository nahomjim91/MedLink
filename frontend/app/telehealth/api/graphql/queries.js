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
      displayName
      gender
      profileImageUrl
      specialization
      experienceYears
      aboutMe
      certificates {
        name
        url
      }
      averageRating
      ratingCount
      isApproved
    }
  }
`;

// Query to get doctors by specialization
export const GET_DOCTORS_BY_SPECIALIZATION = gql`
  query GetDoctorsBySpecialization($specialization: String!) {
    doctorsBySpecialization(specialization: $specialization) {
      doctorId
      displayName
      gender
      profileImageUrl
      specialization
      experienceYears
      averageRating
      ratingCount
      isApproved
    }
  }
`;

// Query to get all doctors with pagination
export const GET_ALL_DOCTORS = gql`
  query GetAllDoctors($limit: Int, $offset: Int) {
    allDoctors(limit: $limit, offset: $offset) {
      doctorId
      displayName
      gender
      profileImageUrl
      specialization
      experienceYears
      averageRating
      ratingCount
      isApproved
    }
  }
`;
