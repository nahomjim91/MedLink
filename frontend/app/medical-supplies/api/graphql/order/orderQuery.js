// queries/orderQueries.js
// graphql/orders.js
import { gql } from '@apollo/client';
// Query to get orders based on user role
export const GET_MY_ORDERS = gql`
  query GetMyOrders($limit: Int, $offset: Int, $status: OrderStatus) {
    myOrders(limit: $limit, offset: $offset, status: $status) {
      orderId
      orderNumber
      buyerName
      buyerCompanyName
      sellerName
      sellerCompanyName
      totalItems
      totalCost
      status
      paymentStatus
      orderDate
      pickupScheduledDate
      items {
        orderItemId
        productName
        totalQuantity
        totalPrice
      }
    }
  }
`;

// Query to get orders to fulfill (for sellers)
export const GET_ORDERS_TO_FULFILL = gql`
  query GetOrdersToFulfill($limit: Int, $offset: Int, $status: OrderStatus) {
    ordersToFulfill(limit: $limit, offset: $offset, status: $status) {
      orderId
      orderNumber
      buyerName
      buyerCompanyName
      sellerName
      sellerCompanyName
      totalItems
      totalCost
      status
      paymentStatus
      orderDate
      pickupScheduledDate
      items {
        orderItemId
        productName
        totalQuantity
        totalPrice
      }
    }
  }
`;

// Query to get order summaries with filters
export const GET_ORDER_SUMMARIES = gql`
  query GetOrderSummaries($filter: OrderFilterInput, $limit: Int, $offset: Int) {
    orderSummaries(filter: $filter, limit: $limit, offset: $offset) {
      orderId
      orderNumber
      buyerName
      sellerName
      totalItems
      totalCost
      status
      paymentStatus
      orderDate
      pickupScheduledDate
    }
  }
`;