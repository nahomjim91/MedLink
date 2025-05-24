// src/graphql/cartMutation.js
import { gql } from '@apollo/client';
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