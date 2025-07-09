// /graphql/queries/adminDashboardQueries.js
import { gql } from "@apollo/client";

// Dashboard Overview Query - Main stats and summaries
export const ADMIN_DASHBOARD_OVERVIEW_QUERY = gql`
  query AdminDashboardOverview(
    $transactionFilter: TransactionFilterInput
    $refundFilter: RefundFilterInput
  ) {
    # Transaction Statistics
    allTransactionStats(filter: $transactionFilter) {
      total
      success
      pending
      failed
      totalAmount
      successAmount
      pendingAmount
    }

    # Refund Statistics
    allRefundStats(filter: $refundFilter) {
      total
      requested
      approved
      processed
      rejected
      totalAmount
      processedAmount
    }

    # Appointment Statistics
    appointmentStats {
      total
      completed
      upcoming
      cancelled
    }

    # Recent Transactions (last 10)
    searchTransactions(
      filter: { orderBy: "createdAt", orderDirection: "desc" }
      limit: 10
    ) {
      transactions {
        transactionId
        userId
        type
        amount
        status
        createdAt
        patient {
          firstName
          lastName
          email
        }
        relatedAppointment {
          appointmentId
          doctorName
          scheduledStartTime
        }
      }
      totalCount
    }

    # Recent Appointments (last 10)
    searchAppointments(
      filter: { orderBy: "createdAt", orderDirection: "desc" }
      limit: 10
    ) {
      appointments {
        appointmentId
        patientName
        doctorName
        status
        paymentStatus
        price
        scheduledStartTime
        createdAt
        patient {
          firstName
          lastName
          email
        }
        doctor {
          firstName
          lastName
          email
        }
      }
      totalCount
    }

    # Pending Doctor Approvals
    allDoctors(limit: 50) {
      doctorId
      user {
        firstName
        lastName
        email
      }
      specialization
      experienceYears
      pricePerSession
      isApproved
      createdAt
    }

    # Recent Prescriptions (last 10)
    # Note: This would need to be added to your schema if you want it in overview
    # myPatientsPrescriptions
  }
`;

// Transactions Management Query
export const ADMIN_TRANSACTIONS_QUERY = gql`
  query AdminTransactions(
    $filter: TransactionFilterInput
    $limit: Int
    $offset: Int
  ) {
    searchTransactions(filter: $filter, limit: $limit, offset: $offset) {
      transactions {
        transactionId
        userId
        type
        amount
        reason
        relatedAppointmentId
        chapaRef
        status
        createdAt
        completedAt
        failedAt
        patient {
          id
          firstName
          lastName
          email
          phoneNumber
          patientProfile {
            telehealthWalletBalance
          }
        }
        relatedAppointment {
          appointmentId
          doctorName
          scheduledStartTime
          price
        }
      }
      totalCount
      hasMore
    }

    # Transaction stats for filtering
    allTransactionStats(filter: $filter) {
      total
      success
      pending
      failed
      totalAmount
      successAmount
      pendingAmount
    }
  }
`;

// Refunds Management Query
export const ADMIN_REFUNDS_QUERY = gql`
  query AdminRefunds($filter: RefundFilterInput, $limit: Int, $offset: Int) {
    searchRefunds(filter: $filter, limit: $limit, offset: $offset) {
      refunds {
        refundId
        userId
        originalWalletTransactionId
        relatedAppointmentId
        amount
        status
        reason
        requestedAt
        processedAt
        patient {
          id
          firstName
          lastName
          email
          phoneNumber
        }
        originalTransaction {
          transactionId
          type
          amount
          createdAt
        }
        relatedAppointment {
          appointmentId
          doctorName
          scheduledStartTime
        }
      }
      totalCount
      hasMore
    }

    # Refund stats for filtering
    allRefundStats(filter: $filter) {
      total
      requested
      approved
      processed
      rejected
      totalAmount
      processedAmount
    }
  }
`;

// Appointments Management Query
export const ADMIN_APPOINTMENTS_QUERY = gql`
  query AdminAppointments(
    $filter: AppointmentFilterInput
    $limit: Int
    $offset: Int
  ) {
    searchAppointments(filter: $filter, limit: $limit, offset: $offset) {
      appointments {
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
        paymentStatus
        createdAt
        updatedAt
        cancelledAt
        cancellationReason
        completionNotes
        patient {
          id
          firstName
          lastName
          email
          phoneNumber
          patientProfile {
            telehealthWalletBalance
          }
        }
        doctor {
          id
          firstName
          lastName
          email
          phoneNumber
          doctorProfile {
            specialization
            experienceYears
            pricePerSession
            telehealthWalletBalance
          }
        }
      }
      totalCount
      hasMore
    }

    # Get appointment financial summaries for selected appointments
    # appointmentFinancialSummary(appointmentId: $appointmentId) {
    #   appointment { ... }
    #   transactions { ... }
    #   refunds { ... }
    #   totalPaid
    #   totalRefunded
    #   doctorEarnings
    # }
  }
`;

// Users Management Query - Patients
export const ADMIN_PATIENTS_QUERY = gql`
  query AdminPatients($limit: Int, $offset: Int) {
    allPatients(limit: $limit, offset: $offset) {
      patientId
      height
      weight
      bloodType
      telehealthWalletBalance
      createdAt
      updatedAt
      user {
        id
        firstName
        lastName
        email
        phoneNumber
        gender
        dob
        profileImageUrl
        profileComplete
        createdAt
      }
    }
  }
`;

// Users Management Query - Doctors
export const ADMIN_DOCTORS_QUERY = gql`
  query AdminDoctors($limit: Int, $offset: Int) {
    allDoctors(limit: $limit, offset: $offset) {
      doctorId
      specialization
      experienceYears
      aboutMe
      averageRating
      ratingCount
      isApproved
      approvedAt
      rejectionReason
      pricePerSession
      telehealthWalletBalance
      createdAt
      updatedAt
      user {
        id
        firstName
        lastName
        email
        phoneNumber
        gender
        dob
        profileImageUrl
        profileComplete
      }
      certificates {
        name
        url
      }
    }
  }
`;

// Doctor Approval Management Query
export const ADMIN_DOCTOR_APPROVALS_QUERY = gql`
  query AdminDoctorApprovals($limit: Int, $offset: Int) {
    allDoctors(limit: $limit, offset: $offset) {
      doctorId
      specialization
      experienceYears
      aboutMe
      averageRating
      ratingCount
      isApproved
      approvedAt
      rejectionReason
      pricePerSession
      createdAt
      updatedAt
      user {
        id
        firstName
        lastName
        email
        phoneNumber
        gender
        profileImageUrl
      }
      certificates {
        name
        url
      }
    }
  }
`;

// Prescriptions Management Query
export const ADMIN_PRESCRIPTIONS_QUERY = gql`
  query AdminPrescriptions($limit: Int, $offset: Int) {
    allPrescriptions(limit: $limit, offset: $offset) {
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
      signature
      status
      createdAt
      updatedAt
    }
  }
`;

// Financial Analytics Query
export const ADMIN_FINANCIAL_ANALYTICS_QUERY = gql`
  query AdminFinancialAnalytics(
    $transactionFilter: TransactionFilterInput
    $refundFilter: RefundFilterInput
  ) {
    # Transaction analytics
    searchTransactions(filter: $transactionFilter, limit: 1000) {
      transactions {
        transactionId
        type
        amount
        status
        createdAt
        completedAt
        patient {
          firstName
          lastName
        }
        relatedAppointment {
          doctorName
          scheduledStartTime
        }
      }
      totalCount
    }

    # Refund analytics
    searchRefunds(filter: $refundFilter, limit: 1000) {
      refunds {
        refundId
        amount
        status
        requestedAt
        processedAt
        patient {
          firstName
          lastName
        }
        relatedAppointment {
          doctorName
        }
      }
      totalCount
    }

    # Overall stats
    allTransactionStats(filter: $transactionFilter) {
      total
      success
      pending
      failed
      totalAmount
      successAmount
      pendingAmount
    }

    allRefundStats(filter: $refundFilter) {
      total
      requested
      approved
      processed
      rejected
      totalAmount
      processedAmount
    }
  }
`;
// System Health Query
export const ADMIN_SYSTEM_HEALTH_QUERY = gql`
  query AdminSystemHealth(
    $transactionFilter: TransactionFilterInput
    $refundFilter: RefundFilterInput
  ) {
    # Transaction health
    allTransactionStats (filter: $transactionFilter) {
      total
      success
      pending
      failed
      totalAmount
      successAmount
      pendingAmount
    }

    # Appointment health
    appointmentStats {
      total
      completed
      upcoming
      cancelled
    }

    # Refund health
    allRefundStats (filter: $refundFilter) {
      total
      requested
      approved
      processed
      rejected
      totalAmount
      processedAmount
    }

    # Recent failures or issues
    searchTransactions(
      filter: { status: [FAILED], orderBy: "createdAt", orderDirection: "desc" }
      limit: 10
    ) {
      transactions {
        transactionId
        type
        amount
        failedAt
        reason
        patient {
          firstName
          lastName
        }
      }
    }
  }
`;

// Doctor Performance Query
export const ADMIN_DOCTOR_PERFORMANCE_QUERY = gql`
  query AdminDoctorPerformance($doctorId: ID, $limit: Int, $offset: Int) {
    # Doctor details
    doctorById(id: $doctorId) {
      doctorId
      specialization
      experienceYears
      averageRating
      ratingCount
      pricePerSession
      telehealthWalletBalance
      user {
        firstName
        lastName
        email
      }
    }

    # Doctor's appointments
    doctorAppointments(doctorId: $doctorId, limit: $limit, offset: $offset) {
      appointmentId
      patientName
      status
      scheduledStartTime
      scheduledEndTime
      actualStartTime
      actualEndTime
      price
      paymentStatus
      completionNotes
      createdAt
    }

    # Doctor's availability
    doctorAvailableSlots(doctorId: $doctorId) {
      slotId
      startTime
      endTime
      isBooked
      appointmentId
      patientId
    }
  }
`;

// Export all queries as a single object for easy importing
export const ADMIN_DASHBOARD_QUERIES = {
  ADMIN_DASHBOARD_OVERVIEW_QUERY,
  ADMIN_TRANSACTIONS_QUERY,
  ADMIN_REFUNDS_QUERY,
  ADMIN_APPOINTMENTS_QUERY,
  ADMIN_PATIENTS_QUERY,
  ADMIN_DOCTORS_QUERY,
  ADMIN_DOCTOR_APPROVALS_QUERY,
  ADMIN_PRESCRIPTIONS_QUERY,
  ADMIN_FINANCIAL_ANALYTICS_QUERY,
  ADMIN_SYSTEM_HEALTH_QUERY,
  ADMIN_DOCTOR_PERFORMANCE_QUERY,
};

// Helper function to get transaction filter for different time periods
export const getTransactionFilterForPeriod = (period) => {
  const now = new Date();
  let startDate;

  switch (period) {
    case "today":
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case "week":
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "month":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "year":
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  return {
    startDate: startDate.toISOString(),
    endDate: now.toISOString(),
    orderBy: "createdAt",
    orderDirection: "desc",
  };
};

// Helper function to get appointment filter for different statuses
export const getAppointmentFilterForStatus = (status) => {
  const baseFilter = {
    orderBy: "scheduledStartTime",
    orderDirection: "desc",
  };

  if (status && status !== "all") {
    return {
      ...baseFilter,
      status: [status.toUpperCase()],
    };
  }

  return baseFilter;
};

// Helper function to get refund filter for different statuses
export const getRefundFilterForStatus = (status) => {
  const baseFilter = {
    orderBy: "requestedAt",
    orderDirection: "desc",
  };

  if (status && status !== "all") {
    return {
      ...baseFilter,
      status: [status.toUpperCase()],
    };
  }

  return baseFilter;
};
