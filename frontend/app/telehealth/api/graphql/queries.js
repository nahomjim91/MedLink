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
        certificates {
          name
          url
        }
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

export const GET_MY_APPOINTMENTS = gql`
  query GetMyAppointments {
    myAppointments {
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

export const GET_DOCTOR_APPOINTMENTS = gql`
  query GetDoctorAppointments($doctorId: ID!) {
    doctorAppointments(doctorId: $doctorId) {
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

export const GET_DOCTOR_AVAILABLE_SLOTS = gql`
  query GetDoctorAvailableSlots($doctorId: ID!) {
    doctorAvailableSlots(doctorId: $doctorId) {
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

export const GET_AVAILABLE_SLOTS_BY_DATE = gql`
  query GetAvailableSlotsByDate($doctorId: ID!, $date: Date!) {
    availableSlotsByDate(doctorId: $doctorId, date: $date) {
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
