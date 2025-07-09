// /api/graphql/admin/mutations.js

import { gql } from "@apollo/client";

// Use the existing mutation from your schema
export const APPROVE_DOCTOR_PROFILE = gql`
  mutation ApproveDoctorProfile($doctorId: ID!) {
    approveDoctorProfile(doctorId: $doctorId) {
      doctorId
      isApproved
      approvedAt
    }
  }
`;

export const REJECT_DOCTOR_PROFILE = gql`
  mutation RejectDoctorProfile($doctorId: ID!, $reason: String!) {
    rejectDoctorProfile(doctorId: $doctorId, reason: $reason) {
      doctorId
      isApproved
      rejectionReason
    }
  }
`;
