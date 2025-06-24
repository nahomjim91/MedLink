// hooks/useAppointment.js
import { useState, useCallback } from "react";
import { useLazyQuery, useMutation, useQuery } from "@apollo/client";
import {
  GET_APPOINTMENT,
  GET_MY_APPOINTMENTS,
  GET_PATIENT_APPOINTMENTS,
  GET_DOCTOR_APPOINTMENTS,
  GET_APPOINTMENTS_BY_STATUS,
  GET_UPCOMING_APPOINTMENTS,
  SEARCH_APPOINTMENTS,
  GET_APPOINTMENT_STATS,
  GET_APPOINTMENT_FINANCIAL_SUMMARY,
} from "../api/graphql/appointment/appointmentQueries";
import {
  CREATE_APPOINTMENT,
  UPDATE_APPOINTMENT,
  UPDATE_APPOINTMENT_STATUS,
  CANCEL_APPOINTMENT,
  CONFIRM_APPOINTMENT,
  REJECT_APPOINTMENT,
  START_APPOINTMENT,
  COMPLETE_APPOINTMENT,
  MARK_NO_SHOW,
  RESCHEDULE_APPOINTMENT,
  DELETE_APPOINTMENT,
  UPDATE_APPOINTMENT_PAYMENT_STATUS,
} from "../api/graphql/appointment/appointmentMutations";

export const useAppointment = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Query hooks
  const [getAppointment] = useLazyQuery(GET_APPOINTMENT);
  const [getMyAppointments] = useLazyQuery(GET_MY_APPOINTMENTS);
  const [getPatientAppointments] = useLazyQuery(GET_PATIENT_APPOINTMENTS);
  const [getDoctorAppointments] = useLazyQuery(GET_DOCTOR_APPOINTMENTS);
  const [getAppointmentsByStatus] = useLazyQuery(GET_APPOINTMENTS_BY_STATUS);
  const [getUpcomingAppointments] = useLazyQuery(GET_UPCOMING_APPOINTMENTS);
  const [searchAppointments] = useLazyQuery(SEARCH_APPOINTMENTS);
  const [getAppointmentFinancialSummary] = useLazyQuery(
    GET_APPOINTMENT_FINANCIAL_SUMMARY
  );

  const { data: appointmentStats, refetch: refetchStats } = useQuery(
    GET_APPOINTMENT_STATS
  );

  // Mutation hooks
  const [createAppointmentMutation] = useMutation(CREATE_APPOINTMENT);
  const [updateAppointmentMutation] = useMutation(UPDATE_APPOINTMENT);
  const [updateAppointmentStatusMutation] = useMutation(
    UPDATE_APPOINTMENT_STATUS
  );
  const [cancelAppointmentMutation] = useMutation(CANCEL_APPOINTMENT);
  const [confirmAppointmentMutation] = useMutation(CONFIRM_APPOINTMENT);
  const [rejectAppointmentMutation] = useMutation(REJECT_APPOINTMENT);
  const [startAppointmentMutation] = useMutation(START_APPOINTMENT);
  const [completeAppointmentMutation] = useMutation(COMPLETE_APPOINTMENT);
  const [markNoShowMutation] = useMutation(MARK_NO_SHOW);
  const [rescheduleAppointmentMutation] = useMutation(RESCHEDULE_APPOINTMENT);
  const [deleteAppointmentMutation] = useMutation(DELETE_APPOINTMENT);
  const [updateAppointmentPaymentStatusMutation] = useMutation(
    UPDATE_APPOINTMENT_PAYMENT_STATUS
  );

  // Helper function to handle errors
  const handleError = useCallback((error) => {
    setError(error.message || "An error occurred");
    setLoading(false);
  }, []);

  // Helper function to handle success
  const handleSuccess = useCallback(() => {
    setError(null);
    setLoading(false);
  }, []);

  // Query functions
  const fetchAppointment = useCallback(
    async (appointmentId) => {
      try {
        setLoading(true);
        setError(null);
        const { data } = await getAppointment({
          variables: { appointmentId },
        });
        handleSuccess();
        return data.appointment;
      } catch (error) {
        handleError(error);
        throw error;
      }
    },
    [getAppointment, handleError, handleSuccess]
  );

  const fetchMyAppointments = useCallback(
  async (limit = 10, offset = 0) => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await getMyAppointments({
        variables: { limit, offset },
      });

      const sortedAppointments =
        [...(data.myAppointments || [])].sort((a, b) => {
          const timeA = new Date(a.scheduledStartTime);
          const timeB = new Date(b.scheduledStartTime);
          const now = new Date();

          const diffA = Math.abs(timeA - now);
          const diffB = Math.abs(timeB - now);

          return diffA - diffB;
        });

      handleSuccess();
      return sortedAppointments;
    } catch (error) {
      handleError(error);
      throw error;
    }
  },
  [getMyAppointments, handleError, handleSuccess]
);

  const fetchPatientAppointments = useCallback(
    async (patientId, limit = 10, offset = 0) => {
      try {
        setLoading(true);
        setError(null);
        const { data } = await getPatientAppointments({
          variables: { patientId, limit, offset },
        });
        handleSuccess();
        return data.patientAppointments;
      } catch (error) {
        handleError(error);
        throw error;
      }
    },
    [getPatientAppointments, handleError, handleSuccess]
  );

  const fetchDoctorAppointments = useCallback(
    async (doctorId, limit = 10, offset = 0) => {
      try {
        setLoading(true);
        setError(null);
        const { data } = await getDoctorAppointments({
          variables: { doctorId, limit, offset },
        });
        handleSuccess();
        return data.doctorAppointments;
      } catch (error) {
        handleError(error);
        throw error;
      }
    },
    [getDoctorAppointments, handleError, handleSuccess]
  );

  const fetchAppointmentsByStatus = useCallback(
    async (status, limit = 10, offset = 0) => {
      try {
        setLoading(true);
        setError(null);
        const { data } = await getAppointmentsByStatus({
          variables: { status, limit, offset },
        });
        handleSuccess();
        return data.appointmentsByStatus;
      } catch (error) {
        handleError(error);
        throw error;
      }
    },
    [getAppointmentsByStatus, handleError, handleSuccess]
  );

  const fetchUpcomingAppointments = useCallback(
    async (limit = 10) => {
      try {
        setLoading(true);
        setError(null);
        const { data } = await getUpcomingAppointments({
          variables: { limit },
        });
        handleSuccess();
        return data.upcomingAppointments;
      } catch (error) {
        handleError(error);
        throw error;
      }
    },
    [getUpcomingAppointments, handleError, handleSuccess]
  );
  //  Fetch appointment financial summary
  const fetchAppointmentFinancialSummary = useCallback(
    async (appointmentId) => {
      try {
        setLoading(true);
        setError(null);
        const { data } = await getAppointmentFinancialSummary({
          variables: { appointmentId },
        });
        handleSuccess();
        return data.appointmentFinancialSummary;
      } catch (error) {
        handleError(error);
        throw error;
      }
    },
    [getAppointmentFinancialSummary, handleError, handleSuccess]
  );

  const searchAppointmentsData = useCallback(
    async (filter, limit = 10, offset = 0) => {
      try {
        setLoading(true);
        setError(null);
        const { data } = await searchAppointments({
          variables: { filter, limit, offset },
        });
        handleSuccess();
        return data.searchAppointments;
      } catch (error) {
        handleError(error);
        throw error;
      }
    },
    [searchAppointments, handleError, handleSuccess]
  );

  // Mutation functions
  const createAppointment = useCallback(
    async (input) => {
      try {
        setLoading(true);
        setError(null);
        const { data } = await createAppointmentMutation({
          variables: { input },
        });
        handleSuccess();
        // Refetch stats after creating appointment
        refetchStats();
        return data.createAppointment;
      } catch (error) {
        handleError(error);
        throw error;
      }
    },
    [createAppointmentMutation, handleError, handleSuccess, refetchStats]
  );

  const updateAppointment = useCallback(
    async (input) => {
      try {
        setLoading(true);
        setError(null);
        const { data } = await updateAppointmentMutation({
          variables: { input },
        });
        handleSuccess();
        return data.updateAppointment;
      } catch (error) {
        handleError(error);
        throw error;
      }
    },
    [updateAppointmentMutation, handleError, handleSuccess]
  );

  const updateAppointmentStatus = useCallback(
    async (input) => {
      try {
        setLoading(true);
        setError(null);
        const { data } = await updateAppointmentStatusMutation({
          variables: { input },
        });
        handleSuccess();
        refetchStats();
        return data.updateAppointmentStatus;
      } catch (error) {
        handleError(error);
        throw error;
      }
    },
    [updateAppointmentStatusMutation, handleError, handleSuccess, refetchStats]
  );

  const cancelAppointment = useCallback(
    async (appointmentId, reason) => {
      try {
        setLoading(true);
        setError(null);
        const { data } = await cancelAppointmentMutation({
          variables: { appointmentId, reason },
        });
        handleSuccess();
        refetchStats();
        return data.cancelAppointment;
      } catch (error) {
        handleError(error);
        throw error;
      }
    },
    [cancelAppointmentMutation, handleError, handleSuccess, refetchStats]
  );

  const confirmAppointment = useCallback(
    async (appointmentId) => {
      try {
        setLoading(true);
        setError(null);
        const { data } = await confirmAppointmentMutation({
          variables: { appointmentId },
        });
        handleSuccess();
        refetchStats();
        return data.confirmAppointment;
      } catch (error) {
        handleError(error);
        throw error;
      }
    },
    [confirmAppointmentMutation, handleError, handleSuccess, refetchStats]
  );

  const rejectAppointment = useCallback(
    async (appointmentId, reason) => {
      try {
        setLoading(true);
        setError(null);
        const { data } = await rejectAppointmentMutation({
          variables: { appointmentId, reason },
        });
        handleSuccess();
        refetchStats();
        return data.rejectAppointment;
      } catch (error) {
        handleError(error);
        throw error;
      }
    },
    [rejectAppointmentMutation, handleError, handleSuccess, refetchStats]
  );

  const startAppointment = useCallback(
    async (appointmentId) => {
      try {
        setLoading(true);
        setError(null);
        const { data } = await startAppointmentMutation({
          variables: { appointmentId },
        });
        handleSuccess();
        refetchStats();
        return data.startAppointment;
      } catch (error) {
        handleError(error);
        throw error;
      }
    },
    [startAppointmentMutation, handleError, handleSuccess, refetchStats]
  );

  const completeAppointment = useCallback(
    async (appointmentId, notes) => {
      try {
        setLoading(true);
        setError(null);
        const { data } = await completeAppointmentMutation({
          variables: { appointmentId, notes },
        });
        handleSuccess();
        refetchStats();
        return data.completeAppointment;
      } catch (error) {
        handleError(error);
        throw error;
      }
    },
    [completeAppointmentMutation, handleError, handleSuccess, refetchStats]
  );

  const markNoShow = useCallback(
    async (appointmentId, reason) => {
      try {
        setLoading(true);
        setError(null);
        const { data } = await markNoShowMutation({
          variables: { appointmentId, reason },
        });
        handleSuccess();
        refetchStats();
        return data.markNoShow;
      } catch (error) {
        handleError(error);
        throw error;
      }
    },
    [markNoShowMutation, handleError, handleSuccess, refetchStats]
  );

  const rescheduleAppointment = useCallback(
    async (appointmentId, newStartTime, newEndTime, newSlotId) => {
      try {
        setLoading(true);
        setError(null);
        const { data } = await rescheduleAppointmentMutation({
          variables: {
            appointmentId,
            newStartTime,
            newEndTime,
            newSlotId,
          },
        });
        handleSuccess();
        refetchStats();
        return data.rescheduleAppointment;
      } catch (error) {
        handleError(error);
        throw error;
      }
    },
    [rescheduleAppointmentMutation, handleError, handleSuccess, refetchStats]
  );

  // Delete appointment
  const deleteAppointment = useCallback(
    async (appointmentId, reason) => {
      try {
        setLoading(true);
        setError(null);
        const { data } = await deleteAppointmentMutation({
          variables: { appointmentId, reason },
        });
        handleSuccess();
        refetchStats();
        return data.deleteAppointment;
      } catch (error) {
        handleError(error);
        throw error;
      }
    },
    [deleteAppointmentMutation, handleError, handleSuccess, refetchStats]
  );

  //  Update appointment payment status
  const updateAppointmentPaymentStatus = useCallback(
    async (appointmentId, paymentStatus, paymentData) => {
      try {
        setLoading(true);
        setError(null);
        const { data } = await updateAppointmentPaymentStatusMutation({
          variables: { appointmentId, paymentStatus, paymentData },
        });
        handleSuccess();
        refetchStats();
        return data.updateAppointmentPaymentStatus;
      } catch (error) {
        handleError(error);
        throw error;
      }
    },
    [
      updateAppointmentPaymentStatusMutation,
      handleError,
      handleSuccess,
      refetchStats,
    ]
  );

  // Clear error function
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    loading,
    error,
    appointmentStats: appointmentStats?.appointmentStats,

    // Query functions
    fetchAppointment,
    fetchMyAppointments,
    fetchPatientAppointments,
    fetchDoctorAppointments,
    fetchAppointmentsByStatus,
    fetchUpcomingAppointments,
    searchAppointments: searchAppointmentsData,
    fetchAppointmentFinancialSummary,

    // Mutation functions
    createAppointment,
    updateAppointment,
    updateAppointmentStatus,
    cancelAppointment,
    confirmAppointment,
    rejectAppointment,
    startAppointment,
    completeAppointment,
    markNoShow,
    rescheduleAppointment,
    deleteAppointment,
    updateAppointmentPaymentStatus,

    // Utility functions
    clearError,
    refetchStats,
  };
};
