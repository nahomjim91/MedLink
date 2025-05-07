import { gql } from '@apollo/client';

// Mutation to update user profile
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
    }
  }
`;

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

// Mutation to update doctor profile
export const UPDATE_DOCTOR_PROFILE = gql`
  mutation UpdateDoctorProfile($input: DoctorProfileInput!) {
    updateDoctorProfile(input: $input) {
      doctorId
      displayName
      specialization
      experienceYears
      aboutMe
      profileImageUrl
      isApproved
    }
  }
`;

// Mutation to update patient profile
export const UPDATE_PATIENT_PROFILE = gql`
  mutation UpdatePatientProfile($input: PatientProfileInput!) {
    updatePatientProfile(input: $input) {
      id
      profileComplete
    }
  }
`;

// Mutation to add a certificate
export const ADD_CERTIFICATE = gql`
  mutation AddCertificate($certificate: CertificateInput!) {
    addCertificate(certificate: $certificate) {
      doctorId
      certificates {
        name
        url
      }
    }
  }
`;