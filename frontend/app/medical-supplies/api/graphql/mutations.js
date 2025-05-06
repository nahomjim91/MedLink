//app/telehealth/api/graphql/mutations.js:
import { gql } from "@apollo/client";

export const REGISTER = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      token
      user {
        id
        firstName
        lastName
        email
        role
      }
    }
  }
`;

export const CREATE_DOCTOR_PROFILE = gql`
  mutation CreateDoctorProfile($input: DoctorProfileInput!) {
    createDoctorProfile(input: $input) {
      id
      specialization
      experience
      bio
    }
  }
`;

export const CREATE_PATIENT_PROFILE = gql`
  mutation CreatePatientProfile($input: PatientProfileInput!) {
    createPatientProfile(input: $input) {
      id
      dateOfBirth
      gender
    }
  }
`;



export const UPDATE_DOCTOR_AVAILABILITY = gql`
  mutation UpdateDoctorAvailability($doctorId: ID!, $availabilities: [AvailabilityInput!]!) {
    updateDoctorAvailability(doctorId: $doctorId, availabilities: $availabilities) {
      id
      startTime
      endTime
    }
  }
`;

export const DELETE_AVAILABILITY = gql`
  mutation DeleteAvailability($id: ID!) {
    deleteAvailability(id: $id) {
      id
    }
  }
`;

export const BOOK_APPOINTMENT = gql`
  mutation BookAppointment($input: AppointmentInput!) {
    bookAppointment(input: $input) {
      id
      startTime
      endTime
      status
    }
  }
`;

export const UPDATE_APPOINTMENT_STATUS = gql`
  mutation UpdateAppointmentStatus($id: ID!, $status: AppointmentStatus!) {
    updateAppointmentStatus(id: $id, status: $status) {
      id
      status
      startTime
      endTime
      notes
      meetingLink
    }
  }
`;