// graphql/appointmentQueries.js
import { gql } from '@apollo/client';
import { APPOINTMENT_FRAGMENT } from './appointmentFragment';



// QUERIES
export const GET_APPOINTMENT = gql`
  ${APPOINTMENT_FRAGMENT}
  query GetAppointment($appointmentId: ID!) {
    appointment(appointmentId: $appointmentId) {
      ...AppointmentFragment
    }
  }
`;

export const GET_MY_APPOINTMENTS = gql`
  ${APPOINTMENT_FRAGMENT}
  query GetMyAppointments($limit: Int, $offset: Int) {
    myAppointments(limit: $limit, offset: $offset) {
      ...AppointmentFragment
    }
  }
`;

export const GET_PATIENT_APPOINTMENTS = gql`
  ${APPOINTMENT_FRAGMENT}
  query GetPatientAppointments($patientId: String, $limit: Int, $offset: Int) {
    patientAppointments(patientId: $patientId, limit: $limit, offset: $offset) {
      ...AppointmentFragment
    }
  }
`;

export const GET_DOCTOR_APPOINTMENTS = gql`
  ${APPOINTMENT_FRAGMENT}
  query GetDoctorAppointments($doctorId: String, $limit: Int, $offset: Int) {
    doctorAppointments(doctorId: $doctorId, limit: $limit, offset: $offset) {
      ...AppointmentFragment
    }
  }
`;

export const GET_APPOINTMENTS_BY_STATUS = gql`
  ${APPOINTMENT_FRAGMENT}
  query GetAppointmentsByStatus($status: AppointmentStatus!, $limit: Int, $offset: Int) {
    appointmentsByStatus(status: $status, limit: $limit, offset: $offset) {
      ...AppointmentFragment
    }
  }
`;

export const GET_UPCOMING_APPOINTMENTS = gql`
  ${APPOINTMENT_FRAGMENT}
  query GetUpcomingAppointments($limit: Int) {
    upcomingAppointments(limit: $limit) {
      ...AppointmentFragment
    }
  }
`;

export const SEARCH_APPOINTMENTS = gql`
  ${APPOINTMENT_FRAGMENT}
  query SearchAppointments($filter: AppointmentFilterInput!, $limit: Int, $offset: Int) {
    searchAppointments(filter: $filter, limit: $limit, offset: $offset) {
      appointments {
        ...AppointmentFragment
      }
      totalCount
      hasMore
    }
  }
`;

export const GET_APPOINTMENT_STATS = gql`
  query GetAppointmentStats {
    appointmentStats {
      total
      completed
      upcoming
      cancelled
    }
  }
`;

export const GET_APPOINTMENT_FINANCIAL_SUMMARY = gql`
  query GetAppointmentFinancialSummary($appointmentId: ID!) {
    appointmentFinancialSummary(appointmentId: $appointmentId) {
      appointment {
        ...AppointmentFragment
      }
      transactions {
        id
        amount
        type
        status
        createdAt
      }
      refunds {
        id
        amount
        reason
        createdAt
      }
      totalPaid
      totalRefunded
      doctorEarnings
    }
  }
`;