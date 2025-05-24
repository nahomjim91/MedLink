// /graphql/orderSchema.js
const { gql } = require("apollo-server-express");

const orderTypeDefs = gql`
  # Order Status Enum
  enum OrderStatus {
    PENDING_CONFIRMATION
    CONFIRMED
    REJECTED_BY_SELLER
    PREPARING
    READY_FOR_PICKUP
    PICKUP_SCHEDULED
    PICKUP_CONFIRMED
    COMPLETED
    CANCELLED
    DISPUTED
  }

  # Payment Status Enum
  enum PaymentStatus {
    PENDING
    PROCESSING
    PAID_HELD_BY_SYSTEM
    RELEASED_TO_SELLER
    REFUNDED
    FAILED
  }

  # Contact Information Type
  type ContactInfo {
    phone: String
    email: String!
    address: Address
  }

  # Order Batch Item Type
  type OrderBatchItem {
    orderBatchItemId: ID!
    orderItemId: ID!
    orderId: ID!
    batchId: ID!
    productId: ID!
    quantity: Float!
    unitPrice: Float!
    subtotal: Float!
    expiryDate: Date
    manufacturingDate: Date
    lotNumber: String
    batchSellerId: ID!
    batchSellerName: String!
    createdAt: Date!
  }

  # Order Item Type
  type OrderItem {
    orderItemId: ID!
    orderId: ID!
    productId: ID!
    productName: String!
    productType: String!
    productCategory: String!
    productImage: String
    batchItems: [OrderBatchItem!]!
    totalQuantity: Float!
    totalPrice: Float!
    createdAt: Date!
  }

  # Main Order Type
  type Order {
    orderId: ID!
    orderNumber: Int!
    buyerId: ID!
    buyerName: String!
    buyerCompanyName: String
    buyerContactInfo: ContactInfo!
    sellerId: ID!
    sellerName: String!
    sellerCompanyName: String
    sellerContactInfo: ContactInfo
    items: [OrderItem!]!
    totalItems: Int!
    totalCost: Float!
    orderDate: Date!
    status: OrderStatus!
    paymentStatus: PaymentStatus!
    pickupScheduledDate: Date
    pickupConfirmedDate: Date
    transactionId: String
    notes: String
    cancellationReason: String
    cancelledBy: ID
    cancelledAt: Date
    createdAt: Date!
    updatedAt: Date!
  }

  # Order Summary Type (for lists)
  type OrderSummary {
    orderId: ID!
    orderNumber: Int!
    buyerName: String!
    sellerName: String!
    totalItems: Int!
    totalCost: Float!
    status: OrderStatus!
    paymentStatus: PaymentStatus!
    orderDate: Date!
    pickupScheduledDate: Date
  }

  # Input Types for creating orders directly
  input OrderBatchItemInput {
    orderBatchItemId: ID!
    batchId: ID!
    quantity: Float!
    unitPrice: Float!
    subtotal: Float
    expiryDate: Date
    manufacturingDate: Date
    lotNumber: String
    batchSellerId: ID!
    batchSellerName: String!
    createdAt: Date
  }

  input OrderItemInput {
    orderItemId: ID!
    productId: ID!
    productName: String!
    productType: String!
    productCategory: String
    productImage: String
    batchItems: [OrderBatchItemInput!]!
    totalQuantity: Float!
    totalPrice: Float!
    createdAt: Date
  }

  input CreateOrderDirectInput {
    orderId: ID!
    orderNumber: Int
    buyerId: ID!
    buyerName: String!
    buyerCompanyName: String
    buyerContactInfo: ContactInfoInput!
    sellerId: ID!
    sellerName: String!
    sellerCompanyName: String
    sellerContactInfo: ContactInfoInput
    items: [OrderItemInput!]!
    totalItems: Int!
    totalCost: Float!
    orderDate: Date
    status: OrderStatus
    paymentStatus: PaymentStatus
    pickupScheduledDate: Date
    pickupConfirmedDate: Date
    transactionId: String
    notes: String
  }

  # Legacy input for cart-based orders
  input CreateOrderInput {
    sellerId: ID!
    notes: String
    pickupScheduledDate: Date
  }

  input OrderFilterInput {
    status: OrderStatus
    paymentStatus: PaymentStatus
    sellerId: ID
    buyerId: ID
    dateFrom: Date
    dateTo: Date
  }

  input ContactInfoInput {
    phone: String
    email: String!
    address: AddressInput
  }

  input AddressInput {
    street: String
    city: String
    state: String
    country: String
    postalCode: String
    geoLocation: GeoPointInput
    geoLocationText: String
  }
  # Extend existing Query type
  extend type Query {
    # Get single order
    order(orderId: ID!): Order

    # Get my orders (as buyer)
    myOrders(limit: Int = 20, offset: Int = 0, status: OrderStatus): [Order!]!

    # Get orders I need to fulfill (as seller)
    ordersToFulfill(
      limit: Int = 20
      offset: Int = 0
      status: OrderStatus
    ): [Order!]!

    # Get order summaries (lightweight for listing)
    orderSummaries(
      filter: OrderFilterInput
      limit: Int = 20
      offset: Int = 0
    ): [OrderSummary!]!

    # Get orders by status (admin)
    ordersByStatus(
      status: OrderStatus!
      limit: Int = 20
      offset: Int = 0
    ): [Order!]!
  }

  # Extend existing Mutation type
  extend type Mutation {
    # Create order directly with complete data (new method)
    createOrderDirect(input: CreateOrderDirectInput!): Order!

    # Create order from cart (legacy method)
    createOrderFromCart(input: CreateOrderInput!): Order!

    # Update order status
    updateOrderStatus(orderId: ID!, status: OrderStatus!): Order!

    # Update payment status (system/admin only)
    updatePaymentStatus(
      orderId: ID!
      paymentStatus: PaymentStatus!
      transactionId: String
    ): Order!

    # Schedule pickup
    schedulePickup(orderId: ID!, pickupDate: Date!): Order!

    # Confirm pickup
    confirmPickup(orderId: ID!): Order!

    # Cancel order
    cancelOrder(orderId: ID!, reason: String): Order!

    # Dispute order
    disputeOrder(orderId: ID!, reason: String!): Order!
  }
`;

module.exports = orderTypeDefs;
