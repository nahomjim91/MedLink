import { gql } from "@apollo/client";

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

export const CREATE_APPOINTMENT = gql`
  mutation CreateAppointment($input: AppointmentInput!) {
    createAppointment(input: $input) {
      appointmentId
      patientId
      patientName
      doctorId
      doctorName
      status
      scheduledStartTime
      scheduledEndTime
      actualStartTime
      actualEndTime
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_APPOINTMENT = gql`
  mutation UpdateAppointment($id: ID!, $input: UpdateAppointmentInput!) {
    updateAppointment(id: $id, input: $input) {
      appointmentId
      status
      updatedAt
    }
  }
`;

export const CANCEL_APPOINTMENT = gql`
  mutation CancelAppointment($id: ID!) {
    cancelAppointment(id: $id) {
      appointmentId
      status
      updatedAt
    }
  }
`;

export const Create_Available_Slot = gql`
  mutation CreateAvailableSlot($input: AvailableSlotInput!) {
    createAvailableSlot(input: $input) {
      slotId
      doctorId
      doctorName
      startTime
      endTime
      isBooked
      createdAt
    }
  }
`;

export const REMOVE_AVAILABLE_SLOT = gql`
  mutation RemoveAvailableSlot($slotId: ID!) {
    removeAvailableSlot(slotId: $slotId)
  }
`;
