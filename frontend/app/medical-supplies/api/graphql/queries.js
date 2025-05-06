//app/telehealth/api/graphql/queries.js
import { gql } from "@apollo/client";

export const GET_USER = gql`
  query GetUser {
    me {
      id
      firstName
      lastName
      email
      role
    }
  }
`;

export const GET_USER_BY_ID = gql`
  query GetUserById($id: ID!) {
    getUserById(id: $id) {
      id
      firstName
      lastName
      email
      role
    }
  }
`;

export const GET_DOCTORS = gql`
  query GetDoctors($specialization: String, $searchTerm: String) {
    getDoctors(specialization: $specialization, searchTerm: $searchTerm) {
      id
      userId
      specialization
      experience
      consultationFee
      rating
      user {
        id
        firstName
        lastName
      }
    }
  }
`;

export const GET_DOCTOR_BY_USER_ID = gql`
  query GetDoctorByUserId($userId: ID!) {
    getDoctorByUserId(userId: $userId) {
      id
    }
  }
`;

export const GET_DOCTOR_APPOINTMENTS = gql`
  query GetDoctorAppointments($doctorId: ID!) {
    getDoctorAppointments(doctorId: $doctorId) {
      id
      startTime
      endTime
      status
      notes
      meetingLink
      patient {
        user {
          firstName
        }
      }
    }
  }
`;

export const GET_DOCTOR_AVAILABILITY = gql`
  query GetDoctorAvailability($doctorId: ID!) {
    getDoctorAvailability(doctorId: $doctorId) {
      id
      startTime
      endTime
    }
  }
`;

export const GET_AVAILABLE_SLOTS = gql`
  query GetAvailableSlots($doctorId: ID!, $date: String!) {
    getAvailableSlots(doctorId: $doctorId, date: $date)
  }
`;

export const GET_PATIENT_APPOINTMENTS = gql`
  query GetPatientAppointments($patientId: ID!, $status: AppointmentStatus) {
    getPatientAppointments(patientId: $patientId, status: $status) {
      id
      doctor {
        id
        user {
          firstName
          lastName
          email
        }
        specialization
      }
      startTime
      endTime
      status
      notes
      createdAt
    }
  }
`;

export const GET_PATIENT_BY_USER_ID = gql`
  query GetPatientByUserId($userId: ID!) {
    getPatientByUserId(userId: $userId) {
      id
    }
  }
`;

export const ADD_APPOINTMENT_NOTE = gql`
  mutation AddAppointmentNotes($id: ID!, $notes: String!) {
    addAppointmentNotes(id: $id, notes: $notes) {
      id
      notes
      status
    }
  }
`;

export const GET_USER_APPOINTMENTS = gql`
  query GetUserAppointments {
    getUserAppointments {
      id
      doctorId
      doctor {
        id
        specialization
        user {
          id
          firstName
          lastName
          email
          role
        }
      }
      lastTime
      lastMessage
      lastSenderId
      patientId
      patient {
        id
        dateOfBirth
        user {
          id
          firstName
          lastName
          email
          role
        }
      }
      startTime
      endTime
      status
      notes
      meetingLink
      createdAt
      updatedAt
    }
  }
`;

export const GET_APPOINTMENT_BY_ID = gql`
  query GetAppointmentById($id: ID!) {
    getAppointmentById(id: $id) {
      patientId
      doctorId
      patient {
        user {
          firstName
          lastName
        }
      }
      doctor {
        user {
          firstName
          lastName
        }
      }
    }
  }
`;
