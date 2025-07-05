import { gql } from '@apollo/client';

// Dashboard Overview Query
export const DASHBOARD_OVERVIEW_QUERY = gql`
  query DashboardOverview {
    orderSummaries {
      orderId
      orderNumber
      buyerName
      sellerName
      totalItems
      totalCost
      status
      paymentStatus
      orderDate
    }
    
    transactionSummaries {
      transactionId
      orderId
      amount
      currency
      status
      createdAt
    }
    
    products {
      productId
      name
      productType
      ownerId
      ownerName
      category
      isActive
      createdAt
    }
    
    pendingApprovalUsers {
      userId
      email
      companyName
      contactName
      phoneNumber
      createdAt
      isApproved
      rejectionReason
    }
  }
`;

// Orders Query
export const ORDERS_QUERY = gql`
  query GetAllOrders($status: OrderStatus) {
    ordersByStatus(status: $status) {
      orderId
      orderNumber
      buyerId
      buyerName
      buyerCompanyName
      sellerId
      sellerName
      sellerCompanyName
      items {
        orderItemId
        productName
        productType
        totalQuantity
        totalPrice
        batchItems {
          batchId
          quantity
          unitPrice
          expiryDate
          batchSellerName
        }
      }
      totalItems
      totalCost
      orderDate
      status
      paymentStatus
      pickupScheduledDate
      transactionId
      notes
    }
  }
`;

// Users Query
export const USERS_QUERY = gql`
  query GetUsers($role: String!) {
    msUsersByRole(role: $role) {
      userId
      email
      role
      companyName
      contactName
      phoneNumber
      address {
        street
        city
        state
        country
      }
      profileImageUrl
      createdAt
      isApproved
      rejectionReason
      approvedBy
      approvedAt
      profileComplete
    }
  }
`;

// Transactions Query
export const TRANSACTIONS_QUERY = gql`
  query GetTransactions($status: TransactionStatus) {
    transactionsByStatus(status: $status) {
      transactionId
      orderId
      buyerId
      sellerId
      chapaRef
      chapaStatus
      amount
      currency
      status
      createdAt
      updatedAt
    }
  }
`;

// Products Query
export const PRODUCTS_QUERY = gql`
  query GetProducts($productType: String, $limit: Int, $offset: Int) {
    products(productType: $productType, limit: $limit, offset: $offset) {
      productId
      productType
      name
      originalListerId
      originalListerName
      ownerId
      ownerName
      category
      description
      imageList
      isActive
      createdAt
      lastUpdatedAt
      batches {
        batchId
        quantity
        sellingPrice
        currentOwnerId
        currentOwnerName
        addedAt
      }
    }
  }
`;