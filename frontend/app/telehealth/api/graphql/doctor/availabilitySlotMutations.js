// /graphql/doctor/availabilitySlotMutations.js
import { gql } from '@apollo/client';

export const ADD_AVAILABILITY_SLOT = gql`
  mutation AddAvailabilitySlot($input: AvailabilitySlotInput!) {
    addAvailabilitySlot(input: $input) {
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

export const UPDATE_AVAILABILITY_SLOT = gql`
  mutation UpdateAvailabilitySlot($input: UpdateAvailabilitySlotInput!) {
    updateAvailabilitySlot(input: $input) {
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

export const DELETE_AVAILABILITY_SLOT = gql`
  mutation DeleteAvailabilitySlot($slotId: ID!) {
    deleteAvailabilitySlot(slotId: $slotId)
  }
`;

export const DELETE_MULTIPLE_SLOTS = gql`
  mutation DeleteMultipleSlots($slotIds: [ID!]!) {
    deleteMultipleSlots(slotIds: $slotIds)
  }
`;