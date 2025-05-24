// src/graphql/cartMutation.js
import { gql } from "@apollo/client";
// Order Mutation
// This mutation creates a new order directly from the cart
export const CREATE_ORDER_DIRECTLY = gql`
  mutation CreateOrder($input: CreateOrderDirectInput!) {
    createOrderDirect(input: $input) {
      orderId
      orderNumber
      status
      paymentStatus
      totalCost
      items {
        orderItemId
        productName
        totalQuantity
        totalPrice
        batchItems {
          orderBatchItemId
          batchId
          quantity
          unitPrice
          subtotal
        }
      }
    }
  }
`;


// Mutation to update order status
export const UPDATE_ORDER_STATUS = gql`
  mutation UpdateOrderStatus($orderId: ID!, $status: OrderStatus!) {
    updateOrderStatus(orderId: $orderId, status: $status) {
      orderId
      status
      updatedAt
    }
  }
`;

// Mutation to schedule pickup
export const SCHEDULE_PICKUP = gql`
  mutation SchedulePickup($orderId: ID!, $pickupDate: Date!) {
    schedulePickup(orderId: $orderId, pickupDate: $pickupDate) {
      orderId
      pickupScheduledDate
      status
    }
  }
`;

// Mutation to cancel order
export const CANCEL_ORDER = gql`
  mutation CancelOrder($orderId: ID!, $reason: String) {
    cancelOrder(orderId: $orderId, reason: $reason) {
      orderId
      status
      cancellationReason
    }
  }
`;

