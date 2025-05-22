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
  return status?.toUpperCase().replace(/-/g, '_');
};

// Convert GraphQL enum to database status
const convertOrderStatusToDb = (status) => {
  return status?.toLowerCase().replace(/_/g, '-');
};

// Convert database payment status to GraphQL enum
const convertPaymentStatus = (status) => {
  return status?.toUpperCase().replace(/-/g, '_');
};

// Convert GraphQL enum to database payment status
const convertPaymentStatusToDb = (status) => {
  return status?.toLowerCase().replace(/_/g, '-');
};

const orderResolvers = {
  // Custom scalars and enums
  OrderStatus: {
    PENDING_CONFIRMATION: "pending_confirmation",
    CONFIRMED: "confirmed",
    REJECTED_BY_SELLER: "rejected_by_seller",
    PREPARING: "preparing",
    READY_FOR_PICKUP: "ready_for_pickup",
    PICKUP_SCHEDULED: "pickup_scheduled",
    PICKUP_CONFIRMED: "pickup_confirmed",
    COMPLETED: "completed",
    CANCELLED: "cancelled",
    DISPUTED: "disputed"
  },

  PaymentStatus: {
    PENDING: "pending",
    PROCESSING: "processing",
    PAID_HELD_BY_SYSTEM: "paid_held_by_system",
    RELEASED_TO_SELLER: "released_to_seller",
    REFUNDED: "refunded",
    FAILED: "failed"
  },

  // Type resolvers
  Order: {
    status: (order) => convertOrderStatus(order.status),
    paymentStatus: (order) => convertPaymentStatus(order.paymentStatus),
  },

  OrderSummary: {
    status: (order) => convertOrderStatus(order.status),
    paymentStatus: (order) => convertPaymentStatus(order.paymentStatus),
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

        return order;
      } catch (error) {
        console.error("Error in order resolver:", error);
        throw error;
      }
    },

    // Get my orders (as buyer)
    myOrders: async (_, { limit, offset, status }, context) => {
      try {
        const user = await hasRole(context, ["facility", "supplier"]);
        
        const options = { limit, offset };
        if (status) {
          options.status = convertOrderStatusToDb(status);
        }

        return await OrderModel.getByBuyerId(user.uid, options);
      } catch (error) {
        console.error("Error in myOrders resolver:", error);
        throw error;
      }
    },

    // Get orders I need to fulfill (as seller)
    ordersToFulfill: async (_, { limit, offset, status }, context) => {
      try {
        const user = await hasRole(context, ["facility", "supplier"]);
        
        const options = { limit, offset };
        if (status) {
          options.status = convertOrderStatusToDb(status);
        }

        return await OrderModel.getBySellerId(user.uid, options);
      } catch (error) {
        console.error("Error in ordersToFulfill resolver:", error);
        throw error;
      }
    },

    // Get order summaries
    orderSummaries: async (_, { filter, limit, offset }, context) => {
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

        return await OrderModel.getOrderSummaries(dbFilter, limit, offset);
      } catch (error) {
        console.error("Error in orderSummaries resolver:", error);
        throw error;
      }
    },

    // Get orders by status (admin only)
    ordersByStatus: async (_, { status, limit, offset }, context) => {
      try {
        await isAdmin(context);
        
        const dbStatus = convertOrderStatusToDb(status);
        return await OrderModel.getByStatus(dbStatus, { limit, offset });
      } catch (error) {
        console.error("Error in ordersByStatus resolver:", error);
        throw error;
      }
    }
  },

  Mutation: {
    // Create order from cart
    createOrderFromCart: async (_, { input }, context) => {
      try {
        const user = await hasRole(context, ["facility", "supplier"]);
        
        const { sellerId, notes, pickupScheduledDate } = input;
        
        const orderInput = {
          sellerId,
          notes,
          pickupScheduledDate
        };

        return await OrderModel.createOrderFromCart(user.uid, orderInput);
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
        
        return await OrderModel.updateStatus(orderId, dbStatus, user.uid);
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
        
        return await OrderModel.updatePaymentStatus(orderId, dbPaymentStatus, transactionId);
      } catch (error) {
        console.error("Error in updatePaymentStatus resolver:", error);
        throw error;
      }
    },

    // Schedule pickup
    schedulePickup: async (_, { orderId, pickupDate }, context) => {
      try {
        const user = isAuthenticated(context);
        
        return await OrderModel.schedulePickup(orderId, pickupDate, user.uid);
      } catch (error) {
        console.error("Error in schedulePickup resolver:", error);
        throw error;
      }
    },

    // Confirm pickup
    confirmPickup: async (_, { orderId }, context) => {
      try {
        const user = isAuthenticated(context);
        
        return await OrderModel.updateStatus(orderId, "pickup_confirmed", user.uid);
      } catch (error) {
        console.error("Error in confirmPickup resolver:", error);
        throw error;
      }
    },

    // Cancel order
    cancelOrder: async (_, { orderId, reason }, context) => {
      try {
        const user = isAuthenticated(context);
        
        return await OrderModel.cancelOrder(orderId, user.uid, reason);
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
        const disputableStatuses = ["completed", "pickup_confirmed"];
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

        return await OrderModel.getById(orderId);
      } catch (error) {
        console.error("Error in disputeOrder resolver:", error);
        throw error;
      }
    }
  }
};

module.exports = orderResolvers;
