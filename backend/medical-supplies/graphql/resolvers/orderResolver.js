// /graphql/orderResolvers.js
const OrderModel = require("../../models/orderModel");
const {
  AuthenticationError,
  ForbiddenError,
  UserInputError
} = require("apollo-server-express");

// Helper function to check authentication
const isAuthenticated = (context) => {
  if (!context.user) {
    throw new AuthenticationError("Authentication required");
  }
  return context.user;
};

// Helper function to check admin role
const isAdmin = async (context) => {
  const user = isAuthenticated(context);
  const MSUserModel = require("../../models/msUser");
  
  const userDoc = await MSUserModel.getById(user.uid);
  if (!userDoc || userDoc.role !== "admin") {
    throw new ForbiddenError("Admin access required");
  }
  
  return user;
};

// Helper function to check specific roles
const hasRole = async (context, roles) => {
  const user = isAuthenticated(context);
  const MSUserModel = require("../../models/msUser");
  
  const userDoc = await MSUserModel.getById(user.uid);
  if (!userDoc || !roles.includes(userDoc.role)) {
    throw new ForbiddenError(`Required role: ${roles.join(" or ")}`);
  }
  
  return user;
};

// Convert database status to GraphQL enum
const convertOrderStatus = (status) => {
  if (!status) return null;
  
  // Database format to GraphQL enum mapping
  const statusMap = {
    'pending-confirmation': 'PENDING_CONFIRMATION',
    'pending_confirmation': 'PENDING_CONFIRMATION',
    'confirmed': 'CONFIRMED',
    'rejected-by-seller': 'REJECTED_BY_SELLER',
    'rejected_by_seller': 'REJECTED_BY_SELLER',
    'preparing': 'PREPARING',
    'ready-for-pickup': 'READY_FOR_PICKUP',
    'ready_for_pickup': 'READY_FOR_PICKUP',
    'pickup-scheduled': 'PICKUP_SCHEDULED',
    'pickup_scheduled': 'PICKUP_SCHEDULED',
    'pickup-confirmed': 'PICKUP_CONFIRMED',
    'pickup_confirmed': 'PICKUP_CONFIRMED',
    'completed': 'COMPLETED',
    'cancelled': 'CANCELLED',
    'disputed': 'DISPUTED'
  };
  
  return statusMap[status.toLowerCase()] || status.toUpperCase().replace(/-/g, '_');
};

// Convert GraphQL enum to database status
const convertOrderStatusToDb = (status) => {
  if (!status) return null;
  
  // GraphQL enum to database format mapping
  const statusMap = {
    'PENDING_CONFIRMATION': 'pending-confirmation',
    'CONFIRMED': 'confirmed',
    'REJECTED_BY_SELLER': 'rejected-by-seller',
    'PREPARING': 'preparing',
    'READY_FOR_PICKUP': 'ready-for-pickup',
    'PICKUP_SCHEDULED': 'pickup-scheduled',
    'PICKUP_CONFIRMED': 'pickup-confirmed',
    'COMPLETED': 'completed',
    'CANCELLED': 'cancelled',
    'DISPUTED': 'disputed'
  };
  
  return statusMap[status] || status.toLowerCase().replace(/_/g, '-');
};

// Convert database payment status to GraphQL enum
const convertPaymentStatus = (status) => {
  if (!status) return null;
  
  // Database format to GraphQL enum mapping
  const statusMap = {
    'pending': 'PENDING',
    'processing': 'PROCESSING',
    'paid-held-by-system': 'PAID_HELD_BY_SYSTEM',
    'paid_held_by_system': 'PAID_HELD_BY_SYSTEM',
    'released-to-seller': 'RELEASED_TO_SELLER',
    'released_to_seller': 'RELEASED_TO_SELLER',
    'refunded': 'REFUNDED',
    'failed': 'FAILED'
  };
  
  return statusMap[status.toLowerCase()] || status.toUpperCase().replace(/-/g, '_');
};

// Convert GraphQL enum to database payment status
const convertPaymentStatusToDb = (status) => {
  if (!status) return null;
  
  // GraphQL enum to database format mapping
  const statusMap = {
    'PENDING': 'pending',
    'PROCESSING': 'processing',
    'PAID_HELD_BY_SYSTEM': 'paid-held-by-system',
    'RELEASED_TO_SELLER': 'released-to-seller',
    'REFUNDED': 'refunded',
    'FAILED': 'failed'
  };
  
  return statusMap[status] || status.toLowerCase().replace(/_/g, '-');
};

// Helper function to transform order data from database format to GraphQL format
const transformOrderForGraphQL = (order) => {
  if (!order) return null;
  
  return {
    ...order,
    status: convertOrderStatus(order.status),
    paymentStatus: convertPaymentStatus(order.paymentStatus)
  };
};

const orderResolvers = {
  // Type resolvers - these handle the conversion for nested queries
  Order: {
    status: (order) => {
      // If already converted, return as-is
      if (order.status && order.status.toUpperCase() === order.status) {
        return order.status;
      }
      // Otherwise convert from database format
      return convertOrderStatus(order.status);
    },
    paymentStatus: (order) => {
      // If already converted, return as-is  
      if (order.paymentStatus && order.paymentStatus.toUpperCase() === order.paymentStatus) {
        return order.paymentStatus;
      }
      // Otherwise convert from database format
      return convertPaymentStatus(order.paymentStatus);
    },
  },

  OrderSummary: {
    status: (order) => {
      // If already converted, return as-is
      if (order.status && order.status.toUpperCase() === order.status) {
        return order.status;
      }
      // Otherwise convert from database format
      return convertOrderStatus(order.status);
    },
    paymentStatus: (order) => {
      // If already converted, return as-is
      if (order.paymentStatus && order.paymentStatus.toUpperCase() === order.paymentStatus) {
        return order.paymentStatus;
      }
      // Otherwise convert from database format
      return convertPaymentStatus(order.paymentStatus);
    },
  },

  Query: {
    // Get single order
    order: async (_, { orderId }, context) => {
      try {
        const user = isAuthenticated(context);
        const order = await OrderModel.getById(orderId);
        
        if (!order) {
          throw new UserInputError("Order not found");
        }

        // Check if user has access to this order
        if (order.buyerId !== user.uid && order.sellerId !== user.uid) {
          // Check if user is admin
          try {
            await isAdmin(context);
          } catch {
            throw new ForbiddenError("Access denied");
          }
        }

        return transformOrderForGraphQL(order);
      } catch (error) {
        console.error("Error in order resolver:", error);
        throw error;
      }
    },

    // Get my orders (as buyer)
    myOrders: async (_, {  status }, context) => {
      try {
        const user = await hasRole(context, ["healthcare-facility", "supplier" ,]);
        
        const options = { };
        if (status) {
          options.status = convertOrderStatusToDb(status);
        }

        const orders = await OrderModel.getByBuyerId(user.uid, options);
        return orders.map(transformOrderForGraphQL);
      } catch (error) {
        console.error("Error in myOrders resolver:", error);
        throw error;
      }
    },

    // Get orders I need to fulfill (as seller)
    ordersToFulfill: async (_, { status }, context) => {
      try {
        const user = await hasRole(context, ["importer", "supplier" , "healthcare-facility"]);
        
        const options = {  };
        if (status) {
          options.status = convertOrderStatusToDb(status);
        }

        const orders = await OrderModel.getBySellerId(user.uid, options);
        return orders.map(transformOrderForGraphQL);
      } catch (error) {
        console.error("Error in ordersToFulfill resolver:", error);
        throw error;
      }
    },

    // Get order summaries
    orderSummaries: async (_, { filter, }, context) => {
      try {
        const user = isAuthenticated(context);
        
        // Convert filter statuses if provided
        const dbFilter = { ...filter };
        if (filter?.status) {
          dbFilter.status = convertOrderStatusToDb(filter.status);
        }
        if (filter?.paymentStatus) {
          dbFilter.paymentStatus = convertPaymentStatusToDb(filter.paymentStatus);
        }

        // For non-admin users, limit to their own orders
        const MSUserModel = require("../../models/msUser");
        const userDoc = await MSUserModel.getById(user.uid);
        
        if (userDoc?.role !== "admin") {
          // Add user filter based on role
          if (!dbFilter.buyerId && !dbFilter.sellerId) {
            dbFilter.buyerId = user.uid;
          }
        }

        const summaries = await OrderModel.getOrderSummaries(dbFilter,);
        return summaries.map(transformOrderForGraphQL);
      } catch (error) {
        console.error("Error in orderSummaries resolver:", error);
        throw error;
      }
    },

    // Get orders by status (admin only)
    ordersByStatus: async (_, { status, }, context) => {
      try {
        await isAdmin(context);
        
        const dbStatus = convertOrderStatusToDb(status);
        const orders = await OrderModel.getByStatus(dbStatus, );
        return orders.map(transformOrderForGraphQL);
      } catch (error) {
        console.error("Error in ordersByStatus resolver:", error);
        throw error;
      }
    }
  },

  Mutation: {
    // Create order directly with complete data (new method)
    createOrderDirect: async (_, { input }, context) => {
      try {
        const user = await hasRole(context, ["healthcare-facility", "supplier" , "healthcare-facility"]);
        
        // Validate that the user can create this order (must be the buyer)
        if (input.buyerId !== user.uid) {
          throw new ForbiddenError("You can only create orders as yourself");
        }

        // console.log('Input received:', input);

        // Convert frontend data structure to match model expectations
        const orderData = {
          ...input,
          // Convert status enums to database format
          status: input.status ? convertOrderStatusToDb(input.status) : "pending-confirmation",
          paymentStatus: input.paymentStatus ? convertPaymentStatusToDb(input.paymentStatus) : "pending",
          // Ensure dates are properly formatted
          orderDate: input.orderDate ? new Date(input.orderDate) : new Date(),
          pickupScheduledDate: input.pickupScheduledDate ? new Date(input.pickupScheduledDate) : null,
          pickupConfirmedDate: input.pickupConfirmedDate ? new Date(input.pickupConfirmedDate) : null,
          // Process items with proper date conversion
          items: input.items.map(item => ({
            ...item,
            createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
            batchItems: item.batchItems?.map(batchItem => ({
              ...batchItem,
              createdAt: batchItem.createdAt ? new Date(batchItem.createdAt) : new Date(),
              expiryDate: batchItem.expiryDate ? new Date(batchItem.expiryDate) : null,
              manufacturingDate: batchItem.manufacturingDate ? new Date(batchItem.manufacturingDate) : null
            })) || []
          }))
        };

        // console.log('Converted order data for database:', {
        //   ...orderData,
        //   status: orderData.status,
        //   paymentStatus: orderData.paymentStatus
        // });

        const createdOrder = await OrderModel.createOrder(orderData);
        
        // Transform the response to ensure proper enum values
        return transformOrderForGraphQL(createdOrder);
      } catch (error) {
        console.error("Error in createOrderDirect resolver:", error);
        throw error;
      }
    },

    // Create order from cart (legacy method)
    createOrderFromCart: async (_, { input }, context) => {
      try {
        const user = await hasRole(context, ["healthcare-facility", "supplier" , "healthcare-facility"]);
        
        const { sellerId, notes, pickupScheduledDate } = input;
        
        const orderInput = {
          sellerId,
          notes, 
          pickupScheduledDate
        };

        // Check if OrderModel has this method, otherwise throw error
        if (typeof OrderModel.createOrderFromCart !== 'function') {
          throw new UserInputError("createOrderFromCart method not implemented. Use createOrderDirect instead.");
        }

        const createdOrder = await OrderModel.createOrderFromCart(user.uid, orderInput);
        return transformOrderForGraphQL(createdOrder);
      } catch (error) {
        console.error("Error in createOrderFromCart resolver:", error);
        throw error;
      }
    },

    // Update order status
    updateOrderStatus: async (_, { orderId, status }, context) => {
      try {
        const user = isAuthenticated(context);
        const dbStatus = convertOrderStatusToDb(status);
        
        const updatedOrder = await OrderModel.updateStatus(orderId, dbStatus, user.uid);
        return transformOrderForGraphQL(updatedOrder);
      } catch (error) {
        console.error("Error in updateOrderStatus resolver:", error);
        throw error;
      }
    },

    // Update payment status (system/admin only)
    updatePaymentStatus: async (_, { orderId, paymentStatus, transactionId }, context) => {
      try {
        await isAdmin(context);
        
        const dbPaymentStatus = convertPaymentStatusToDb(paymentStatus);
        
        const updatedOrder = await OrderModel.updatePaymentStatus(orderId, dbPaymentStatus, transactionId);
        return transformOrderForGraphQL(updatedOrder);
      } catch (error) {
        console.error("Error in updatePaymentStatus resolver:", error);
        throw error;
      }
    },

    // Schedule pickup
    schedulePickup: async (_, { orderId, pickupDate }, context) => {
      try {
        const user = isAuthenticated(context);
        
        const updatedOrder = await OrderModel.schedulePickup(orderId, pickupDate, user.uid);
        return transformOrderForGraphQL(updatedOrder);
      } catch (error) {
        console.error("Error in schedulePickup resolver:", error);
        throw error;
      }
    },

    // Confirm pickup
    confirmPickup: async (_, { orderId }, context) => {
      try {
        const user = isAuthenticated(context);
        
        const updatedOrder = await OrderModel.updateStatus(orderId, "pickup-confirmed", user.uid);
        return transformOrderForGraphQL(updatedOrder);
      } catch (error) {
        console.error("Error in confirmPickup resolver:", error);
        throw error;
      }
    },

    // Cancel order
    cancelOrder: async (_, { orderId, reason }, context) => {
      try {
        const user = isAuthenticated(context);
        
        const cancelledOrder = await OrderModel.cancelOrder(orderId, user.uid, reason);
        return transformOrderForGraphQL(cancelledOrder);
      } catch (error) {
        console.error("Error in cancelOrder resolver:", error);
        throw error;
      }
    },

    // Dispute order
    disputeOrder: async (_, { orderId, reason }, context) => {
      try {
        const user = isAuthenticated(context);
        
        // First get the order to check permissions
        const order = await OrderModel.getById(orderId);
        if (!order) {
          throw new UserInputError("Order not found");
        }

        // Only buyer or seller can dispute an order
        if (order.buyerId !== user.uid && order.sellerId !== user.uid) {
          throw new ForbiddenError("Only buyer or seller can dispute an order");
        }

        // Check if order is in a disputable status
        const disputableStatuses = ["completed", "pickup-confirmed"];
        if (!disputableStatuses.includes(order.status)) {
          throw new UserInputError("Order cannot be disputed in current status");
        }

        // Update order to disputed status with reason
        const orderRef = require("../../config/firebase").db.collection("orders").doc(orderId);
        await orderRef.update({
          status: "disputed",
          disputeReason: reason,
          disputedBy: user.uid,
          disputedAt: require("../../utils/helpers").timestamp(),
          updatedAt: require("../../utils/helpers").timestamp()
        });

        const disputedOrder = await OrderModel.getById(orderId);
        return transformOrderForGraphQL(disputedOrder);
      } catch (error) {
        console.error("Error in disputeOrder resolver:", error);
        throw error;
      }
    }
  }
};

module.exports = orderResolvers;