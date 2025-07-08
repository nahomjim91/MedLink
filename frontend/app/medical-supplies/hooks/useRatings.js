// hooks/useRatings.js
import { useQuery, useMutation, useLazyQuery } from "@apollo/client";
import {
  GET_USER_RATINGS,
  GET_PRODUCT_RATINGS,
  GET_MY_RATINGS,
  GET_ORDER_RATINGS,
  GET_USER_RATING_STATS,
  GET_PRODUCT_RATING_STATS,
  CAN_RATE_USER,
  CAN_RATE_PRODUCT,
} from "../api/graphql/rating/ratingQueries";
import {
  CREATE_USER_RATING,
  CREATE_PRODUCT_RATING,
  DELETE_RATING,
} from "../api/graphql/rating/ratingMutations";

export const useRatings = (options = {}) => {
  const {
    userId = null,
    productId = null,
    orderId = null,
    limit = 20,
    offset = 0,
    autoFetch = true,
  } = options;

  // Query for user ratings (ratings received by a user)
  const {
    data: userRatingsData,
    loading: userRatingsLoading,
    error: userRatingsError,
    refetch: refetchUserRatings,
  } = useQuery(GET_USER_RATINGS, {
    variables: { userId, limit, offset },
    fetchPolicy: "cache-and-network",
    errorPolicy: "all",
    skip: !userId || !autoFetch,
  });

  // Query for product ratings
  const {
    data: productRatingsData,
    loading: productRatingsLoading,
    error: productRatingsError,
    refetch: refetchProductRatings,
  } = useQuery(GET_PRODUCT_RATINGS, {
    variables: { productId, limit, offset },
    fetchPolicy: "cache-and-network",
    errorPolicy: "all",
    skip: !productId || !autoFetch,
  });

  // Query for ratings given by current user
  const {
    data: myRatingsData,
    loading: myRatingsLoading,
    error: myRatingsError,
    refetch: refetchMyRatings,
  } = useQuery(GET_MY_RATINGS, {
    variables: { limit, offset },
    fetchPolicy: "cache-and-network",
    errorPolicy: "all",
    skip: !autoFetch,
  });

  // Query for ratings of a specific order
  const {
    data: orderRatingsData,
    loading: orderRatingsLoading,
    error: orderRatingsError,
    refetch: refetchOrderRatings,
  } = useQuery(GET_ORDER_RATINGS, {
    variables: { orderId },
    fetchPolicy: "cache-and-network",
    errorPolicy: "all",
    skip: !orderId || !autoFetch,
  });

  // Query for user rating statistics
  const {
    data: userRatingStatsData,
    loading: userRatingStatsLoading,
    error: userRatingStatsError,
    refetch: refetchUserRatingStats,
  } = useQuery(GET_USER_RATING_STATS, {
    variables: { userId },
    fetchPolicy: "cache-and-network",
    errorPolicy: "all",
    skip: !userId || !autoFetch,
  });

  // Query for product rating statistics
  const {
    data: productRatingStatsData,
    loading: productRatingStatsLoading,
    error: productRatingStatsError,
    refetch: refetchProductRatingStats,
  } = useQuery(GET_PRODUCT_RATING_STATS, {
    variables: { productId },
    fetchPolicy: "cache-and-network",
    errorPolicy: "all",
    skip: !productId || !autoFetch,
  });

  // Lazy queries for conditional fetching
  const [
    getUserRatings,
    { data: lazyUserRatingsData, loading: lazyUserRatingsLoading },
  ] = useLazyQuery(GET_USER_RATINGS, {
    fetchPolicy: "cache-and-network",
    errorPolicy: "all",
  });

  const [
    getProductRatings,
    { data: lazyProductRatingsData, loading: lazyProductRatingsLoading },
  ] = useLazyQuery(GET_PRODUCT_RATINGS, {
    fetchPolicy: "cache-and-network",
    errorPolicy: "all",
  });

  const [
    getOrderRatings,
    { data: lazyOrderRatingsData, loading: lazyOrderRatingsLoading },
  ] = useLazyQuery(GET_ORDER_RATINGS, {
    fetchPolicy: "network-only", // Changed to network-only to ensure fresh data
    errorPolicy: "all",
  });

  const [
    checkCanRateUser,
    { data: canRateUserData, loading: canRateUserLoading },
  ] = useLazyQuery(CAN_RATE_USER, {
    fetchPolicy: "cache-and-network",
    errorPolicy: "all",
  });

  const [
    checkCanRateProduct,
    { data: canRateProductData, loading: canRateProductLoading },
  ] = useLazyQuery(CAN_RATE_PRODUCT, {
    fetchPolicy: "cache-and-network",
    errorPolicy: "all",
  });

  // Enhanced refetch function
  const refetchOrderRatingsWithDelay = async (delay = 0) => {
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    if (orderId) {
      return await getOrderRatings({
        variables: { orderId },
        fetchPolicy: "network-only", // Force fresh data
      });
    }
  };

  // Mutations
  const [createUserRatingMutation, { loading: createUserRatingLoading }] =
    useMutation(CREATE_USER_RATING, {
      onCompleted: async (data) => {
        try {
          console.log("User rating created successfully:", data);

          // Refetch order ratings immediately
          await refetchOrderRatingsWithDelay(0);

          // Refetch other relevant queries
          await refetchMyRatings();
          if (userId) await refetchUserRatings();
          if (userId) await refetchUserRatingStats();

          // Force another refetch after a delay to ensure consistency
          setTimeout(() => {
            refetchOrderRatingsWithDelay(0);
          }, 1000);
        } catch (error) {
          console.error("Error in onCompleted refetch:", error);
        }
      },
      onError: (error) => {
        console.error("Error creating user rating:", error);
      },
      // Add update function to manually update cache
      update: (cache, { data: { createProductRating } }) => {
        try {
          if (orderId) {
            const existingData = cache.readQuery({
              query: GET_ORDER_RATINGS,
              variables: { orderId },
            });

            if (existingData) {
              cache.writeQuery({
                query: GET_ORDER_RATINGS,
                variables: { orderId },
                data: {
                  orderRatings: [
                    ...existingData.orderRatings,
                    createProductRating,
                  ],
                },
              });
            }
          }
        } catch (error) {
          console.error(
            "Error updating cache after product rating creation:",
            error
          );
        }
      },
    });

  const [deleteRatingMutation, { loading: deleteRatingLoading }] = useMutation(
    DELETE_RATING,
    {
      onCompleted: async () => {
        try {
          // Refetch order ratings immediately
          await refetchOrderRatingsWithDelay(0);

          // Refetch all relevant queries after deleting rating
          await refetchMyRatings();
          if (userId) await refetchUserRatings();
          if (productId) await refetchProductRatings();
          if (userId) await refetchUserRatingStats();
          if (productId) await refetchProductRatingStats();
        } catch (error) {
          console.error("Error in onCompleted refetch:", error);
        }
      },
      onError: (error) => {
        console.error("Error deleting rating:", error);
      },
    }
  );

  // Combine loading states
  const loading =
    userRatingsLoading ||
    productRatingsLoading ||
    myRatingsLoading ||
    orderRatingsLoading ||
    userRatingStatsLoading ||
    productRatingStatsLoading;

  // Combine errors
  const error =
    userRatingsError ||
    productRatingsError ||
    myRatingsError ||
    orderRatingsError ||
    userRatingStatsError ||
    productRatingStatsError;

  // Helper functions
  const createUserRating = async (input) => {
    try {
      const result = await createUserRatingMutation({
        variables: { input },
      });
      return result.data.createUserRating;
    } catch (error) {
      console.error("Error creating user rating:", error);
      throw error;
    }
  };
  const [createProductRatingMutation, { loading: createProductRatingLoading }] =
    useMutation(CREATE_PRODUCT_RATING, {
      onCompleted: async (data) => {
        try {
          console.log("Product rating created successfully:", data);

          // Refetch order ratings
          await refetchOrderRatingsWithDelay(0);
          await refetchMyRatings();
          if (productId) await refetchProductRatings();
          if (productId) await refetchProductRatingStats();

          // Optional delayed refetch
          setTimeout(() => {
            refetchOrderRatingsWithDelay(0);
          }, 1000);
        } catch (error) {
          console.error("Error in onCompleted refetch (product):", error);
        }
      },
      onError: (error) => {
        console.error("Error creating product rating:", error);
      },
      update: (cache, { data: { createProductRating } }) => {
        try {
          if (orderId) {
            const existingData = cache.readQuery({
              query: GET_ORDER_RATINGS,
              variables: { orderId },
            });

            if (existingData) {
              cache.writeQuery({
                query: GET_ORDER_RATINGS,
                variables: { orderId },
                data: {
                  orderRatings: [
                    ...existingData.orderRatings,
                    createProductRating,
                  ],
                },
              });
            }
          }
        } catch (error) {
          console.error(
            "Error updating cache after product rating creation:",
            error
          );
        }
      },
    });

  const createProductRating = async (input) => {
    try {
      const result = await createProductRatingMutation({
        variables: { input },
      });
      return result.data.createProductRating;
    } catch (error) {
      console.error("Error creating product rating:", error);
      throw error;
    }
  };

  const deleteRating = async (ratingId, reason) => {
    try {
      const result = await deleteRatingMutation({
        variables: { ratingId, reason },
      });
      return result.data.deleteRating;
    } catch (error) {
      console.error("Error deleting rating:", error);
      throw error;
    }
  };

  const extractProductId = (orderItemId) => {
    if (!orderItemId) return null;
    // Extract productId from format: "item_1751708595497_PGJ30Ys8w4rKk7YERhZ9"
    const parts = orderItemId.split("_");
    if (parts.length >= 3) {
      return parts.slice(2).join("_"); // Join remaining parts in case productId contains underscores
    }
    return orderItemId; // Fallback to original if format is unexpected
  };

  const canRateUser = async (orderId, ratedUserId) => {
    if (!orderId || !ratedUserId) return false;

    try {
      const result = await checkCanRateUser({
        variables: { orderId, ratedUserId },
      });
      return result?.data?.canRateUser ?? false;
    } catch (error) {
      console.error("Error checking if can rate user:", error);
      return false;
    }
  };

  const canRateProduct = async (orderId, productId) => {
    if (!orderId || !productId) return false;

    try {
      const result = await checkCanRateProduct({
        variables: { orderId, productId },
      });
      return result?.data?.canRateProduct ?? false;
    } catch (error) {
      console.error("Error checking if can rate product:", error);
      return false;
    }
  };

  // Enhanced refetch function
  const refetch = async () => {
    const promises = [];

    if (userId) promises.push(refetchUserRatings());
    if (productId) promises.push(refetchProductRatings());
    promises.push(refetchMyRatings());
    if (orderId) promises.push(refetchOrderRatingsWithDelay(0));
    if (userId) promises.push(refetchUserRatingStats());
    if (productId) promises.push(refetchProductRatingStats());

    try {
      await Promise.all(promises);
    } catch (error) {
      console.error("Error refetching ratings:", error);
    }
  };

  // Helper function to get ratings by type
  const getRatingsByType = (ratings, type) => {
    if (!ratings) return [];
    return ratings.filter(
      (rating) => rating.type === type || rating.ratingType === type
    );
  };

  // Helper function to calculate average rating
  const calculateAverageRating = (ratings) => {
    if (!ratings || ratings.length === 0) return 0;
    const total = ratings.reduce((sum, rating) => sum + rating.rating, 0);
    return total / ratings.length;
  };

  return {
    // Data
    userRatings: userRatingsData?.userRatings || [],
    productRatings: productRatingsData?.productRatings || [],
    myRatings: myRatingsData?.myRatings || [],
    orderRatings: orderRatingsData?.orderRatings || [],
    userRatingStats: userRatingStatsData?.userRatingStats || null,
    productRatingStats: productRatingStatsData?.productRatingStats || null,

    // Lazy query data
    lazyUserRatings: lazyUserRatingsData?.userRatings || [],
    lazyProductRatings: lazyProductRatingsData?.productRatings || [],
    lazyOrderRatings: lazyOrderRatingsData?.orderRatings || [],
    canRateUserResult: canRateUserData?.canRateUser || false,
    canRateProductResult: canRateProductData?.canRateProduct || false,

    // Loading states
    loading,
    createUserRatingLoading,
    createProductRatingLoading,
    deleteRatingLoading,
    canRateUserLoading,
    canRateProductLoading,
    lazyUserRatingsLoading,
    lazyProductRatingsLoading,
    lazyOrderRatingsLoading,

    // Error states
    error,

    // Functions
    createUserRating,
    createProductRating,
    deleteRating,
    canRateUser,
    canRateProduct,
    refetch,
    refetchOrderRatingsWithDelay, // New enhanced function

    // Lazy query functions
    getUserRatings,
    getProductRatings,
    getOrderRatings,
    extractProductId,

    // Helper functions
    getRatingsByType,
    calculateAverageRating,

    // Mutation functions (for direct access)
    createUserRatingMutation,
    createProductRatingMutation,
    deleteRatingMutation,
  };
};

// Specialized hooks for specific use cases
export const useUserRatings = (userId, options = {}) => {
  return useRatings({ userId, ...options });
};

export const useProductRatings = (productId, options = {}) => {
  return useRatings({ productId, ...options });
};

export const useOrderRatings = (orderId, options = {}) => {
  return useRatings({ orderId, ...options });
};

export const useMyRatings = (options = {}) => {
  return useRatings({ ...options });
};
