import { gql } from '@apollo/client';

// Prescription fragment for reusability
const PRESCRIPTION_FRAGMENT = gql`
  fragment PrescriptionDetails on Prescription {
    id
    appointmentId
    patientDetails {
      patientId
      name
      profileImage
    }
    doctorDetails {
      doctorId
      name
      profileImage
    }
    medications {
      drugName
      dosage
      route
      frequency
      duration
      instructions
    }
    recommendations
    createdAt
    updatedAt
  }
`;

// Query to get a prescription by ID
export const GET_PRESCRIPTION_BY_ID = gql`
  ${PRESCRIPTION_FRAGMENT}
  query GetPrescriptionById($id: ID!) {
    prescriptionById(id: $id) {
      ...PrescriptionDetails
    }
  }
`;

// Query to get prescriptions by appointment ID
export const GET_PRESCRIPTIONS_BY_APPOINTMENT_ID = gql`
  ${PRESCRIPTION_FRAGMENT}
  query GetPrescriptionsByAppointmentId($appointmentId: ID!) {
    prescriptionsByAppointmentId(appointmentId: $appointmentId) {
      ...PrescriptionDetails
    }
  }
`;

// Query to get prescriptions by patient ID
export const GET_PRESCRIPTIONS_BY_PATIENT_ID = gql`
  ${PRESCRIPTION_FRAGMENT}
  query GetPrescriptionsByPatientId($patientId: ID!) {
    prescriptionsByPatientId(patientId: $patientId) {
      ...PrescriptionDetails
    }
  }
`;

// Query to get prescriptions by doctor ID
export const GET_PRESCRIPTIONS_BY_DOCTOR_ID = gql`
  ${PRESCRIPTION_FRAGMENT}
  query GetPrescriptionsByDoctorId($doctorId: ID!) {
    prescriptionsByDoctorId(doctorId: $doctorId) {
      ...PrescriptionDetails
    }
  }
`;

// Query to get current user's prescriptions (patient view)
export const GET_MY_PRESCRIPTIONS = gql`
  ${PRESCRIPTION_FRAGMENT}
  query GetMyPrescriptions {
    myPrescriptions {
      ...PrescriptionDetails
    }
  }
`;

// Query to get current doctor's patients prescriptions
export const GET_MY_PATIENTS_PRESCRIPTIONS = gql`
  ${PRESCRIPTION_FRAGMENT}
  query GetMyPatientsPrescriptions {
    myPatientsPrescriptions {
      ...PrescriptionDetails
    }
  }
`;

// Mutation to create a prescription
export const CREATE_PRESCRIPTION = gql`
  ${PRESCRIPTION_FRAGMENT}
  mutation CreatePrescription($input: PrescriptionInput!) {
    createPrescription(input: $input) {
      ...PrescriptionDetails
    }
  }
`;

// Simplified queries for specific use cases

// Query to get prescription summary (lighter version)
export const GET_PRESCRIPTION_SUMMARY = gql`
  query GetPrescriptionSummary($id: ID!) {
    prescriptionById(id: $id) {
      id
      appointmentId
      patientDetails {
        name
      }
      doctorDetails {
        name
      }
      medications {
        drugName
        dosage
        frequency
      }
      createdAt
    }
  }
`;

// Query to get prescription list (for listing purposes)
export const GET_PRESCRIPTION_LIST = gql`
  query GetPrescriptionList($patientId: ID!) {
    prescriptionsByPatientId(patientId: $patientId) {
      id
      appointmentId
      doctorDetails {
        name
        profileImage
      }
      medications {
        drugName
        dosage
      }
      createdAt
    }
  }
`;

// Query to get doctor's prescription history
export const GET_DOCTOR_PRESCRIPTION_HISTORY = gql`
  query GetDoctorPrescriptionHistory($doctorId: ID!) {
    prescriptionsByDoctorId(doctorId: $doctorId) {
      id
      appointmentId
      patientDetails {
        name
        profileImage
      }
      medications {
        drugName
        dosage
        frequency
      }
      createdAt
    }
  }
`;

// Query to check if appointment has prescriptions
export const CHECK_APPOINTMENT_PRESCRIPTIONS = gql`
  query CheckAppointmentPrescriptions($appointmentId: ID!) {
    prescriptionsByAppointmentId(appointmentId: $appointmentId) {
      id
      createdAt
    }
  }
`;
