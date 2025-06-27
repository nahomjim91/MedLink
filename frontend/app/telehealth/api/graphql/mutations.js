import { gql } from "@apollo/client";

export const INITIALIZE_USER_PROFILE = gql`
  mutation InitializeUserProfile($email: String!) {
    initializeUserProfile(email: $email) {
      id
      email
      profileComplete
    }
  }
`;

export const COMPLETE_REGISTRATION = gql`
  mutation CompleteRegistration(
    $THuserInput: THUserInput!
    $doctorInput: DoctorProfileInput
    $patientInput: PatientProfileInput
  ) {
    completeRegistration(
      THuserInput: $THuserInput
      doctorInput: $doctorInput
      patientInput: $patientInput
    ) {
      id
      email
      role
      profileComplete
      firstName
      lastName
    }
  }
`;

// Add Certificate Mutation (for doctors)
export const ADD_CERTIFICATE = gql`
  mutation AddCertificate($certificate: CertificateInput!) {
    addCertificate(certificate: $certificate) {
      doctorId
      displayName
      certificates {
        name
        url
      }
    }
  }
`;
// User Profile Update Mutation
export const UPDATE_USER_PROFILE = gql`
  mutation UpdateUserProfile($input: THUserInput!) {
    updateUserProfile(input: $input) {
      id
      email
      firstName
      lastName
      role
      gender
      dob
      phoneNumber
      profileComplete
      profileImageUrl
      createdAt
    }
  }
`;
export const UPDATE_DOCTOR_PROFILE = gql`
  mutation UpdateDoctorProfile($input: DoctorProfileInput!) {
    updateDoctorProfile(input: $input) {
      doctorId
      specialization
      experienceYears
      aboutMe
      pricePerSession
      telehealthWalletBalance
      averageRating
      ratingCount
      isApproved
      approvedAt
      rejectionReason
      certificates {
        name
        url
      }
      user {
        id
        firstName
        lastName
        phoneNumber
        gender
        profileImageUrl
      }
      createdAt
      updatedAt
    }
  }
`;

// Patient Profile Update Mutation 
export const UPDATE_PATIENT_PROFILE = gql`
  mutation UpdatePatientProfile($input: PatientProfileInput!) {
    updatePatientProfile(input: $input) {
      id
      firstName
      lastName
      phoneNumber
      gender
      dob
      profileImageUrl
      profileComplete
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