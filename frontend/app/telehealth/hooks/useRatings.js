// hooks/useTHRatings.js
import { useQuery, useMutation, useLazyQuery } from "@apollo/client";
import { useCallback, useMemo } from "react";
import {
  GET_DOCTOR_RATINGS,
  GET_PATIENT_RATINGS,
  GET_MY_TH_RATINGS,
  GET_APPOINTMENT_RATINGS,
  GET_DOCTOR_RATING_STATS,
  CAN_RATE_USER,
  GET_APPOINTMENT_WITH_RATINGS,
} from "../api/graphql/rating/ratingQueries";
import {
  CREATE_TH_RATING,
  DELETE_TH_RATING,
  CREATE_MULTIPLE_TH_RATINGS,
  UPDATE_TH_RATING,
  REPORT_TH_RATING,
} from "../api/graphql/rating/ratingMutations";

export const useTHRatings = (options = {}) => {
  const {
    doctorId = null,
    patientId = null,
    appointmentId = null,
    userId = null,
    limit = 20,
    offset = 0,
    autoFetch = true,
    pollInterval = 0,
  } = options;

  // Query for doctor ratings (ratings received by a doctor)
  const {
    data: doctorRatingsData,
    loading: doctorRatingsLoading,
    error: doctorRatingsError,
    refetch: refetchDoctorRatings,
    fetchMore: fetchMoreDoctorRatings,
  } = useQuery(GET_DOCTOR_RATINGS, {
    variables: { doctorId, limit, offset },
    fetchPolicy: "cache-and-network",
    errorPolicy: "all",
    skip: !doctorId || !autoFetch,
    pollInterval,
  });

  // Query for patient ratings (ratings received by a patient)
  const {
    data: patientRatingsData,
    loading: patientRatingsLoading,
    error: patientRatingsError,
    refetch: refetchPatientRatings,
    fetchMore: fetchMorePatientRatings,
  } = useQuery(GET_PATIENT_RATINGS, {
    variables: { patientId, limit, offset },
    fetchPolicy: "cache-and-network",
    errorPolicy: "all",
    skip: !patientId || !autoFetch,
    pollInterval,
  });

  // Query for ratings given by current user
  const {
    data: myTHRatingsData,
    loading: myTHRatingsLoading,
    error: myTHRatingsError,
    refetch: refetchMyTHRatings,
    fetchMore: fetchMoreMyTHRatings,
  } = useQuery(GET_MY_TH_RATINGS, {
    variables: { limit, offset },
    fetchPolicy: "cache-and-network",
    errorPolicy: "all",
    skip: !autoFetch,
    pollInterval,
  });

  // Query for ratings of a specific appointment
  const {
    data: appointmentRatingsData,
    loading: appointmentRatingsLoading,
    error: appointmentRatingsError,
    refetch: refetchAppointmentRatings,
  } = useQuery(GET_APPOINTMENT_RATINGS, {
    variables: { appointmentId },
    fetchPolicy: "cache-and-network",
    errorPolicy: "all",
    skip: !appointmentId || !autoFetch,
    pollInterval,
  });

  // Query for doctor rating statistics
  const {
    data: doctorRatingStatsData,
    loading: doctorRatingStatsLoading,
    error: doctorRatingStatsError,
    refetch: refetchDoctorRatingStats,
  } = useQuery(GET_DOCTOR_RATING_STATS, {
    variables: { doctorId },
    fetchPolicy: "cache-and-network",
    errorPolicy: "all",
    skip: !doctorId || !autoFetch,
    pollInterval,
  });

  // Lazy queries for conditional fetching
  const [
    getDoctorRatings,
    { data: lazyDoctorRatingsData, loading: lazyDoctorRatingsLoading },
  ] = useLazyQuery(GET_DOCTOR_RATINGS, {
    fetchPolicy: "cache-and-network",
    errorPolicy: "all",
  });

  const [
    getPatientRatings,
    { data: lazyPatientRatingsData, loading: lazyPatientRatingsLoading },
  ] = useLazyQuery(GET_PATIENT_RATINGS, {
    fetchPolicy: "cache-and-network",
    errorPolicy: "all",
  });

  const [
    getAppointmentRatings,
    { data: lazyAppointmentRatingsData, loading: lazyAppointmentRatingsLoading },
  ] = useLazyQuery(GET_APPOINTMENT_RATINGS, {
    fetchPolicy: "network-only",
    errorPolicy: "all",
  });

  const [
    checkCanRateUser,
    { data: canRateUserData, loading: canRateUserLoading },
  ] = useLazyQuery(CAN_RATE_USER, {
    fetchPolicy: "cache-and-network",
    errorPolicy: "all",
  });

  // Enhanced refetch function with delay
  const refetchAppointmentRatingsWithDelay = useCallback(async (delay = 0) => {
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    if (appointmentId) {
      return await getAppointmentRatings({
        variables: { appointmentId },
        fetchPolicy: "network-only",
      });
    }
  }, [appointmentId, getAppointmentRatings]);

  // Mutations
  const [createTHRatingMutation, { loading: createTHRatingLoading }] =
    useMutation(CREATE_TH_RATING, {
      onCompleted: async (data) => {
        try {
          console.log("TH rating created successfully:", data);

          // Refetch appointment ratings immediately
          await refetchAppointmentRatingsWithDelay(0);

          // Refetch other relevant queries
          await refetchMyTHRatings();
          if (doctorId) await refetchDoctorRatings();
          if (patientId) await refetchPatientRatings();
          if (doctorId) await refetchDoctorRatingStats();

          // Force another refetch after a delay to ensure consistency
          setTimeout(() => {
            refetchAppointmentRatingsWithDelay(0);
          }, 1000);
        } catch (error) {
          console.error("Error in onCompleted refetch:", error);
        }
      },
      onError: (error) => {
        console.error("Error creating TH rating:", error);
      },
      update: (cache, { data: { createTHRating } }) => {
        try {
          // Update appointment ratings cache
          if (appointmentId) {
            const existingData = cache.readQuery({
              query: GET_APPOINTMENT_RATINGS,
              variables: { appointmentId },
            });

            if (existingData) {
              cache.writeQuery({
                query: GET_APPOINTMENT_RATINGS,
                variables: { appointmentId },
                data: {
                  appointmentRatings: [
                    ...existingData.appointmentRatings,
                    createTHRating,
                  ],
                },
              });
            }
          }

          // Update doctor ratings cache if it's a doctor rating
          if (createTHRating.ratingType === "doctor_rating" && doctorId) {
            const existingData = cache.readQuery({
              query: GET_DOCTOR_RATINGS,
              variables: { doctorId, limit, offset: 0 },
            });

            if (existingData) {
              cache.writeQuery({
                query: GET_DOCTOR_RATINGS,
                variables: { doctorId, limit, offset: 0 },
                data: {
                  doctorRatings: [createTHRating, ...existingData.doctorRatings],
                },
              });
            }
          }

          // Update patient ratings cache if it's a patient rating
          if (createTHRating.ratingType === "patient_rating" && patientId) {
            const existingData = cache.readQuery({
              query: GET_PATIENT_RATINGS,
              variables: { patientId, limit, offset: 0 },
            });

            if (existingData) {
              cache.writeQuery({
                query: GET_PATIENT_RATINGS,
                variables: { patientId, limit, offset: 0 },
                data: {
                  patientRatings: [createTHRating, ...existingData.patientRatings],
                },
              });
            }
          }
        } catch (error) {
          console.error("Error updating cache after TH rating creation:", error);
        }
      },
    });

  const [reportTHRatingMutation, { loading: reportTHRatingLoading }] =
    useMutation(REPORT_TH_RATING, {
      onCompleted: (data) => {
        console.log("TH rating reported successfully:", data);
      },
      onError: (error) => {
        console.error("Error reporting TH rating:", error);
      },
    });

  // Combine loading states
  const loading = useMemo(() => {
    return (
      doctorRatingsLoading ||
      patientRatingsLoading ||
      myTHRatingsLoading ||
      appointmentRatingsLoading ||
      doctorRatingStatsLoading
    );
  }, [
    doctorRatingsLoading,
    patientRatingsLoading,
    myTHRatingsLoading,
    appointmentRatingsLoading,
    doctorRatingStatsLoading,
  ]);

  // Combine errors
  const error = useMemo(() => {
    return (
      doctorRatingsError ||
      patientRatingsError ||
      myTHRatingsError ||
      appointmentRatingsError ||
      doctorRatingStatsError
    );
  }, [
    doctorRatingsError,
    patientRatingsError,
    myTHRatingsError,
    appointmentRatingsError,
    doctorRatingStatsError,
  ]);

  // Helper functions
  const createTHRating = useCallback(async (input) => {
    try {
      const result = await createTHRatingMutation({
        variables: { input },
      });
      return result.data.createTHRating;
    } catch (error) {
      console.error("Error creating TH rating:", error);
      throw error;
    }
  }, [createTHRatingMutation]);

  const reportTHRating = useCallback(async (ratingId, reason, description) => {
    try {
      const result = await reportTHRatingMutation({
        variables: { ratingId, reason, description },
      });
      return result.data.reportTHRating;
    } catch (error) {
      console.error("Error reporting TH rating:", error);
      throw error;
    }
  }, [reportTHRatingMutation]);

  const canRateUser = useCallback(async (appointmentId, ratedUserId) => {
    if (!appointmentId || !ratedUserId) return false;

    try {
      const result = await checkCanRateUser({
        variables: { appointmentId, ratedUserId },
      });
      return result?.data?.canRateUser ?? false;
    } catch (error) {
      console.error("Error checking if can rate user:", error);
      return false;
    }
  }, [checkCanRateUser]);

  // Enhanced refetch function
  const refetch = useCallback(async () => {
    const promises = [];

    if (doctorId) promises.push(refetchDoctorRatings());
    if (patientId) promises.push(refetchPatientRatings());
    promises.push(refetchMyTHRatings());
    if (appointmentId) promises.push(refetchAppointmentRatingsWithDelay(0));
    if (doctorId) promises.push(refetchDoctorRatingStats());

    try {
      await Promise.all(promises);
    } catch (error) {
      console.error("Error refetching TH ratings:", error);
    }
  }, [
    doctorId,
    patientId,
    appointmentId,
    refetchDoctorRatings,
    refetchPatientRatings,
    refetchMyTHRatings,
    refetchAppointmentRatingsWithDelay,
    refetchDoctorRatingStats,
  ]);

  // Helper function to get ratings by type
  const getRatingsByType = useCallback((ratings, type) => {
    if (!ratings) return [];
    return ratings.filter((rating) => rating.ratingType === type);
  }, []);

  // Helper function to calculate average rating
  const calculateAverageRating = useCallback((ratings) => {
    if (!ratings || ratings.length === 0) return 0;
    const total = ratings.reduce((sum, rating) => sum + rating.rating, 0);
    return Math.round((total / ratings.length) * 10) / 10; // Round to 1 decimal place
  }, []);

  // Helper function to get rating distribution
  const getRatingDistribution = useCallback((ratings) => {
    if (!ratings || ratings.length === 0) return { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratings.forEach((rating) => {
      distribution[rating.rating] = (distribution[rating.rating] || 0) + 1;
    });
    
    return distribution;
  }, []);

  // Helper function to check if user has rated in appointment
  const hasUserRated = useCallback((appointmentRatings, userId, ratedUserId) => {
    if (!appointmentRatings || !userId || !ratedUserId) return false;
    return appointmentRatings.some(
      (rating) => rating.raterId === userId && rating.ratedUserId === ratedUserId
    );
  }, []);

  // Helper function to get user's rating for specific appointment
  const getUserRatingForAppointment = useCallback((appointmentRatings, userId, ratedUserId) => {
    if (!appointmentRatings || !userId || !ratedUserId) return null;
    return appointmentRatings.find(
      (rating) => rating.raterId === userId && rating.ratedUserId === ratedUserId
    );
  }, []);

  // Pagination helpers
  const loadMoreDoctorRatings = useCallback(async () => {
    if (!doctorId) return;
    
    try {
      await fetchMoreDoctorRatings({
        variables: {
          doctorId,
          limit,
          offset: doctorRatingsData?.doctorRatings.length || 0,
        },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult) return prev;
          return {
            ...prev,
            doctorRatings: [...prev.doctorRatings, ...fetchMoreResult.doctorRatings],
          };
        },
      });
    } catch (error) {
      console.error("Error loading more doctor ratings:", error);
    }
  }, [doctorId, limit, doctorRatingsData, fetchMoreDoctorRatings]);

  const loadMorePatientRatings = useCallback(async () => {
    if (!patientId) return;
    
    try {
      await fetchMorePatientRatings({
        variables: {
          patientId,
          limit,
          offset: patientRatingsData?.patientRatings.length || 0,
        },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult) return prev;
          return {
            ...prev,
            patientRatings: [...prev.patientRatings, ...fetchMoreResult.patientRatings],
          };
        },
      });
    } catch (error) {
      console.error("Error loading more patient ratings:", error);
    }
  }, [patientId, limit, patientRatingsData, fetchMorePatientRatings]);

  const loadMoreMyTHRatings = useCallback(async () => {
    try {
      await fetchMoreMyTHRatings({
        variables: {
          limit,
          offset: myTHRatingsData?.myTHRatings.length || 0,
        },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult) return prev;
          return {
            ...prev,
            myTHRatings: [...prev.myTHRatings, ...fetchMoreResult.myTHRatings],
          };
        },
      });
    } catch (error) {
      console.error("Error loading more my TH ratings:", error);
    }
  }, [limit, myTHRatingsData, fetchMoreMyTHRatings]);

  return {
    // Data
    doctorRatings: doctorRatingsData?.doctorRatings || [],
    patientRatings: patientRatingsData?.patientRatings || [],
    myTHRatings: myTHRatingsData?.myTHRatings || [],
    appointmentRatings: appointmentRatingsData?.appointmentRatings || [],
    doctorRatingStats: doctorRatingStatsData?.doctorRatingStats || null,

    // Lazy query data
    lazyDoctorRatings: lazyDoctorRatingsData?.doctorRatings || [],
    lazyPatientRatings: lazyPatientRatingsData?.patientRatings || [],
    lazyAppointmentRatings: lazyAppointmentRatingsData?.appointmentRatings || [],
    canRateUserResult: canRateUserData?.canRateUser || false,

    // Loading states
    loading,
    createTHRatingLoading,
    reportTHRatingLoading,
    canRateUserLoading,
    lazyDoctorRatingsLoading,
    lazyPatientRatingsLoading,
    lazyAppointmentRatingsLoading,

    // Error states
    error,

    // Functions
    createTHRating,
    reportTHRating,
    canRateUser,
    refetch,
    refetchAppointmentRatingsWithDelay,

    // Lazy query functions
    getDoctorRatings,
    getPatientRatings,
    getAppointmentRatings,

    // Helper functions
    getRatingsByType,
    calculateAverageRating,
    getRatingDistribution,
    hasUserRated,
    getUserRatingForAppointment,

    // Pagination functions
    loadMoreDoctorRatings,
    loadMorePatientRatings,
    loadMoreMyTHRatings,
  };
};