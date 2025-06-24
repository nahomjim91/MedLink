// hooks/useOrders.js
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_MY_ORDERS,
  GET_ORDERS_TO_FULFILL
} from "../api/graphql/order/orderQuery";
import {
  UPDATE_ORDER_STATUS,
  SCHEDULE_PICKUP,
  CANCEL_ORDER,
} from "../api/graphql/order/orderMutation";

export const useOrders = (userRole, limit = 20, offset = 0, status = null) => {
  const role = userRole?.toLowerCase();

  // Query for orders where user is the buyer (their purchases)
  const { 
    data: myOrdersData, 
    loading: myOrdersLoading, 
    error: myOrdersError, 
    refetch: refetchMyOrders 
  } = useQuery(GET_MY_ORDERS, {
    variables: { limit, offset, status },
    fetchPolicy: "cache-and-network",
    errorPolicy: "all",
    skip: role === 'importer', // Importers don't buy, only sell
  });

  // Query for orders where user is the seller (orders to fulfill)
  const { 
    data: ordersToFulfillData, 
    loading: ordersToFulfillLoading, 
    error: ordersToFulfillError, 
    refetch: refetchOrdersToFulfill 
  } = useQuery(GET_ORDERS_TO_FULFILL, {
    variables: { limit, offset, status },
    fetchPolicy: "cache-and-network",
    errorPolicy: "all",
    skip: role === 'healthcare-facility', // Health facilities don't sell, only buy
  });

  // Mutations
  const [updateOrderStatusMutation] = useMutation(UPDATE_ORDER_STATUS, {
    onCompleted: () => {
      // Refetch relevant queries after status update
      if (role !== 'importer') refetchMyOrders();
      if (role !== 'healthcare-facility') refetchOrdersToFulfill();
    },
    onError: (error) => {
      console.error('Error updating order status:', error);
    }
  });

  const [schedulePickupMutation] = useMutation(SCHEDULE_PICKUP, {
    onCompleted: () => {
      if (role !== 'importer') refetchMyOrders();
      if (role !== 'healthcare-facility') refetchOrdersToFulfill();
    },
    onError: (error) => {
      console.error('Error scheduling pickup:', error);
    }
  });

  const [cancelOrderMutation] = useMutation(CANCEL_ORDER, {
    onCompleted: () => {
      if (role !== 'importer') refetchMyOrders();
      if (role !== 'healthcare-facility') refetchOrdersToFulfill();
    },
    onError: (error) => {
      console.error('Error cancelling order:', error);
    }
  });

  // Combine loading states
  const loading = myOrdersLoading || ordersToFulfillLoading;
  
  // Combine errors
  const error = myOrdersError || ordersToFulfillError;

  // Refetch function
  const refetch = async () => {
    const promises = [];
    if (role !== 'importer') promises.push(refetchMyOrders());
    if (role !== 'healthcare-facility') promises.push(refetchOrdersToFulfill());
    
    try {
      await Promise.all(promises);
    } catch (error) {
      console.error('Error refetching orders:', error);
    }
  };

  return {
    // Separate data for different perspectives
    orders: myOrdersData?.myOrders || [],
    ordersToFulfill: ordersToFulfillData?.ordersToFulfill || [],
    
    // Combined data (for backward compatibility)
    allOrders: [
      ...(myOrdersData?.myOrders || []),
      ...(ordersToFulfillData?.ordersToFulfill || [])
    ],
    
    loading,
    error,
    refetch,
    
    // Mutation functions
    updateOrderStatus: updateOrderStatusMutation,
    schedulePickup: schedulePickupMutation,
    cancelOrder: cancelOrderMutation,
  };
};