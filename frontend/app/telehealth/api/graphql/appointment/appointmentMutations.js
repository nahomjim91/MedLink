// graphql/appointmentMutations.js
import { gql } from '@apollo/client';
import { APPOINTMENT_FRAGMENT } from './appointmentFragment';

// MUTATIONS
export const CREATE_APPOINTMENT = gql`
  ${APPOINTMENT_FRAGMENT}
  mutation CreateAppointment($input: CreateAppointmentInput!) {
    createAppointment(input: $input) {
      ...AppointmentFragment
    }
  }
`;

export const UPDATE_APPOINTMENT = gql`
  ${APPOINTMENT_FRAGMENT}
  mutation UpdateAppointment($input: UpdateAppointmentInput!) {
    updateAppointment(input: $input) {
      ...AppointmentFragment
    }
  }
`;

export const UPDATE_APPOINTMENT_STATUS = gql`
  ${APPOINTMENT_FRAGMENT}
  mutation UpdateAppointmentStatus($input: UpdateAppointmentStatusInput!) {
    updateAppointmentStatus(input: $input) {
      ...AppointmentFragment
    }
  }
`;

export const CANCEL_APPOINTMENT = gql`
  ${APPOINTMENT_FRAGMENT}
  mutation CancelAppointment($appointmentId: ID!, $reason: String) {
    cancelAppointment(appointmentId: $appointmentId, reason: $reason) {
      ...AppointmentFragment
    }
  }
`;

export const CONFIRM_APPOINTMENT = gql`
  ${APPOINTMENT_FRAGMENT}
  mutation ConfirmAppointment($appointmentId: ID!) {
    confirmAppointment(appointmentId: $appointmentId) {
      ...AppointmentFragment
    }
  }
`;

export const REJECT_APPOINTMENT = gql`
  ${APPOINTMENT_FRAGMENT}
  mutation RejectAppointment($appointmentId: ID!, $reason: String!) {
    rejectAppointment(appointmentId: $appointmentId, reason: $reason) {
      ...AppointmentFragment
    }
  }
`;

export const START_APPOINTMENT = gql`
  ${APPOINTMENT_FRAGMENT}
  mutation StartAppointment($appointmentId: ID!) {
    startAppointment(appointmentId: $appointmentId) {
      ...AppointmentFragment
    }
  }
`;

export const COMPLETE_APPOINTMENT = gql`
  ${APPOINTMENT_FRAGMENT}
  mutation CompleteAppointment($appointmentId: ID!, $notes: String) {
    completeAppointment(appointmentId: $appointmentId, notes: $notes) {
      ...AppointmentFragment
    }
  }
`;

export const MARK_NO_SHOW = gql`
  ${APPOINTMENT_FRAGMENT}
  mutation MarkNoShow($appointmentId: ID!, $reason: String) {
    markNoShow(appointmentId: $appointmentId, reason: $reason) {
      ...AppointmentFragment
    }
  }
`;

export const RESCHEDULE_APPOINTMENT = gql`
  ${APPOINTMENT_FRAGMENT}
  mutation RescheduleAppointment(
    $appointmentId: ID!
    $newStartTime: Date!
    $newEndTime: Date!
    $newSlotId: String!
  ) {
    rescheduleAppointment(
      appointmentId: $appointmentId
      newStartTime: $newStartTime
      newEndTime: $newEndTime
      newSlotId: $newSlotId
    ) {
      ...AppointmentFragment
    }
  }
`;

// Add these new mutations to your appointmentMutations.js file:

export const DELETE_APPOINTMENT = gql`
  mutation DeleteAppointment($appointmentId: ID!, $reason: String) {
    deleteAppointment(appointmentId: $appointmentId, reason: $reason)
  }
`;

export const UPDATE_APPOINTMENT_PAYMENT_STATUS = gql`
  ${APPOINTMENT_FRAGMENT}
  mutation UpdateAppointmentPaymentStatus(
    $appointmentId: ID!
    $paymentStatus: PaymentStatus!
    $paymentData: String
  ) {
    updateAppointmentPaymentStatus(
      appointmentId: $appointmentId
      paymentStatus: $paymentStatus
      paymentData: $paymentData
    ) {
      ...AppointmentFragment
    }
  }
`;