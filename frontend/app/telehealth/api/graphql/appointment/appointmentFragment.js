// /graphql/appointment/appointmentFragment.js
import { gql } from '@apollo/client';

// Fragment for appointment data
export const APPOINTMENT_FRAGMENT = gql`
  fragment AppointmentFragment on Appointment {
    appointmentId
    patientId
    patientName
    doctorId
    doctorName
    status
    reasonNote
    scheduledStartTime
    scheduledEndTime
    actualStartTime
    actualEndTime
    price
    associatedSlotId
    paymentStatus
    createdAt
    updatedAt
    cancelledAt
    patient {
      id
      firstName
      lastName
      email
      phoneNumber
    }
    doctor {
      id
      firstName
      lastName
      email
      phoneNumber
    }
  }
`;