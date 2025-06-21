// /graphql/doctor/availabilitySlotQueries.js
import { gql } from '@apollo/client';

// Queries
export const GET_MY_AVAILABILITY_SLOTS = gql`
  query GetMyAvailabilitySlots {
    myAvailabilitySlots {
      slotId
      doctorId
      startTime
      endTime
      isBooked
      appointmentId
      patientId
      createdAt
    }
  }
`;

export const GET_DOCTOR_AVAILABLE_SLOTS = gql`
  query GetDoctorAvailableSlots($doctorId: ID!, $date: String) {
    doctorAvailableSlots(doctorId: $doctorId, date: $date) {
      slotId
      doctorId
      startTime
      endTime
      isBooked
      appointmentId
      patientId
      createdAt
    }
  }
`;

