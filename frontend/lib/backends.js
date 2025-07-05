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
    myOrders( status: OrderStatus): [Order!]!

    # Get orders I need to fulfill (as seller)
    ordersToFulfill(
      
      status: OrderStatus
    ): [Order!]!

    # Get order summaries (lightweight for listing)
    orderSummaries(
      filter: OrderFilterInput
     
    ): [OrderSummary!]!

    # Get orders by status (admin)
    ordersByStatus(
      status: OrderStatus!
    
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

// /graphql/schemas/product-schema.js
const { gql } = require("apollo-server-express");

const productSchema = gql`
  scalar Date # Custom Date scalar for Firestore Timestamps
  "Interface for common product fields"
  interface Product {
    productId: ID!
    productType: String! # e.g., "DRUG", "EQUIPMENT"
    name: String!
    originalListerId: ID!
    originalListerName: String!
    ownerId: ID! # Current owner ID
    ownerName: String! # Current owner name
    category: String
    description: String
    imageList: [String] # URLs for images
    isActive: Boolean!
    createdAt: Date!
    distanceText: String
    distance: Float
    lastUpdatedAt: Date!
    # Relationship to batches
    batches: [Batch]
  }

  "Represents a Drug Product"
  type DrugProduct implements Product {
    # Fields from Product interface
    productId: ID!
    productType: String!
    name: String!
    originalListerId: ID!
    originalListerName: String!
    ownerId: ID!
    ownerName: String!
    category: String
    description: String
    imageList: [String]
    isActive: Boolean!
    createdAt: Date!
    lastUpdatedAt: Date!
    distanceText: String
    distance: Float
    batches: [Batch]

    # Drug-specific fields
    packageType: String
    concentration: String
    requiresPrescription: Boolean!
  }

  "Represents an Equipment Product"
  type EquipmentProduct implements Product {
    # Fields from Product interface
    productId: ID!
    productType: String!
    name: String!
    originalListerId: ID!
    originalListerName: String!
    ownerId: ID!
    ownerName: String!
    category: String
    description: String
    imageList: [String]
    isActive: Boolean!
    createdAt: Date!
    lastUpdatedAt: Date!
    distanceText: String
    distance: Float
    batches: [Batch]

    # Equipment-specific fields

    brandName: String
    modelNumber: String
    warrantyInfo: String
    sparePartInfo: [String]
  }

  "Interface for common batch fields"
  interface Batch {
    batchId: ID!
    productId: ID!
    product: Product! # The product this batch belongs to
    currentOwnerId: ID!
    currentOwnerName: String!
    quantity: Float! # Using Float for Number type
    costPrice: Float
    sellingPrice: Float
    addedAt: Date!
    lastUpdatedAt: Date
    # If this batch was copied from another batch during purchase
    sourceOriginalBatchId: ID
    manufacturer: String
    manufacturerCountry: String
    manufactureredDate: Date
  }

  "Represents a Drug Batch"
  type DrugBatch implements Batch {
    # Fields from Batch interface
    batchId: ID!
    productId: ID!
    product: Product!
    currentOwnerId: ID!
    currentOwnerName: String!
    quantity: Float!
    costPrice: Float
    sellingPrice: Float
    addedAt: Date!
    lastUpdatedAt: Date
    sourceOriginalBatchId: ID
    manufacturer: String
    manufacturerCountry: String
    manufactureredDate: Date

    # DrugBatch-specific fields
    expiryDate: Date!
    sizePerPackage: Float # Using Float for Number type
  }

  "Represents an Equipment Batch"
  type EquipmentBatch implements Batch {
    # Fields from Batch interface
    batchId: ID!
    productId: ID!
    product: Product!
    currentOwnerId: ID!
    currentOwnerName: String!
    quantity: Float!
    costPrice: Float
    sellingPrice: Float
    addedAt: Date!
    lastUpdatedAt: Date
    sourceOriginalBatchId: ID
    manufacturer: String
    manufacturerCountry: String
    manufactureredDate: Date

    # EquipmentBatch-specific fields
    serialNumbers: [String]
    technicalSpecifications: String
    userManuals: [String]
    certification: String
  }

  # Input types for creating products
  input CreateDrugProductInput {
    name: String!
    category: String
    description: String
    originalListerId: ID!
    originalListerName: String!
    imageList: [String]
    isActive: Boolean = true
    packageType: String
    concentration: String
    requiresPrescription: Boolean!
  }

  input CreateEquipmentProductInput {
    name: String!
    category: String
    description: String
    imageList: [String]
    originalListerName: String!
    originalListerId: ID!
    isActive: Boolean = true
    brandName: String
    modelNumber: String
    warrantyInfo: String
    sparePartInfo: [String]
  }

  # Input types for updating products
  input UpdateDrugProductInput {
    name: String
    category: String
    description: String
    imageList: [String]
    isActive: Boolean
    packageType: String
    concentration: String
    requiresPrescription: Boolean
  }

  input UpdateEquipmentProductInput {
    name: String
    category: String
    description: String
    imageList: [String]
    isActive: Boolean
    brandName: String
    modelNumber: String
    warrantyInfo: String
    sparePartInfo: [String]
  }

  # Input types for creating batches
  input CreateDrugBatchInput {
    currentOwnerId: ID!
    currentOwnerName: String
    productId: ID!
    quantity: Float!
    costPrice: Float
    sellingPrice: Float
    expiryDate: Date!
    sizePerPackage: Float
    manufacturer: String
    manufacturerCountry: String
    manufactureredDate: Date
  }

  input CreateEquipmentBatchInput {
    productId: ID!
    quantity: Float!
    costPrice: Float
    sellingPrice: Float
    serialNumbers: [String]
    currentOwnerId: ID!
    currentOwnerName: String
    manufacturer: String
    manufacturerCountry: String
    manufactureredDate: Date
    technicalSpecifications: String
    userManuals: [String]
    certification: String
  }

  # Input types for updating batches
  input UpdateDrugBatchInput {
    quantity: Float
    costPrice: Float
    sellingPrice: Float
    expiryDate: Date
    sizePerPackage: Float
    manufacturer: String
    manufacturerCountry: String
    manufactureredDate: Date
  }

  input UpdateEquipmentBatchInput {
    quantity: Float
    costPrice: Float
    sellingPrice: Float
    serialNumbers: [String]
    manufacturer: String
    manufacturerCountry: String
    manufactureredDate: Date
    technicalSpecifications: String
    userManuals: [String]
    certification: String
  }

  # Input for purchasing a product (will create a copy for the buyer)
  input PurchaseProductInput {
    productId: ID!
    batchId: ID!
    quantity: Float!
    purchasePrice: Float!
    notes: String
  }

  # Input for searching products
  input SearchProductsInput {
    searchTerm: String
    productType: String
    category: String
    expiryDateStart: Date
    expiryDateEnd: Date
    sortByDistance: Boolean
    maxDistance: Float
    limit: Int
    offset: Int
    sortBy: String
    sortOrder: String
  }

  type Query {
    "Get a product by its ID. Returns either DrugProduct or EquipmentProduct"
    productById(productId: ID!): Product

    "Get all products. Can be filtered by productType or ownership"
    products(
      productType: String
      ownerId: ID
      category: String
      limit: Int
      offset: Int
    ): [Product!]!

    "Get products owned by the current authenticated user"
    myProducts(
      productType: String
      category: String
      limit: Int
      offset: Int
    ): [Product!]!

    "Search products by various criteria"
    searchProducts(searchInput: SearchProductsInput!): [Product!]!

    "Get a batch by its ID. Returns either DrugBatch or EquipmentBatch"
    batchById(batchId: ID!): Batch

    "Get all batches for a specific product"
    batchesByProductId(productId: ID!, limit: Int, offset: Int): [Batch!]!

    "Get all batches. Can be filtered by type or owner"
    allBatches(
      ownerId: ID
      productType: String
      limit: Int
      offset: Int
    ): [Batch!]!

    "Get batches owned by the current authenticated user"
    myBatches(productType: String, limit: Int, offset: Int): [Batch!]!
  }

  type Mutation {
    "Create a new Drug Product"
    createDrugProduct(input: CreateDrugProductInput!): DrugProduct!

    "Create a new Equipment Product"
    createEquipmentProduct(
      input: CreateEquipmentProductInput!
    ): EquipmentProduct!

    "Update a Drug Product"
    updateDrugProduct(
      productId: ID!
      input: UpdateDrugProductInput!
    ): DrugProduct!

    "Update an Equipment Product"
    updateEquipmentProduct(
      productId: ID!
      input: UpdateEquipmentProductInput!
    ): EquipmentProduct!

    "Delete a product (sets isActive to false)"
    deleteProduct(productId: ID!): Boolean!

    "Create a new Drug Batch"
    createDrugBatch(input: CreateDrugBatchInput!): DrugBatch!

    "Create a new Equipment Batch"
    createEquipmentBatch(input: CreateEquipmentBatchInput!): EquipmentBatch!

    "Update a Drug Batch"
    updateDrugBatch(batchId: ID!, input: UpdateDrugBatchInput!): DrugBatch!

    "Update an Equipment Batch"
    updateEquipmentBatch(
      batchId: ID!
      input: UpdateEquipmentBatchInput!
    ): EquipmentBatch!

    "Delete a batch"
    deleteBatch(batchId: ID!): Boolean!

    "Purchase a product - creates a copy of the product and a new batch for the buyer"
    purchaseProduct(input: PurchaseProductInput!): Product!
  }
`;

module.exports = productSchema;

// /graphql/transactionSchema.js
const { gql } = require("apollo-server-express");

const transactionTypeDefs = gql`
  # Transaction Status Enum
  enum TransactionStatus {
    PENDING
    PROCESSING
    PAID_HELD_BY_SYSTEM
    RELEASED_TO_SELLER
    REFUNDED
    FAILED
    CANCELLED
  }

  # Transaction Type
  type Transaction {
    buyerId: ID
    sellerId: ID
    transactionId: ID!
    orderId: ID!
    chapaRef: String
    chapaStatus: String
    amount: Float!
    currency: String!
    status: TransactionStatus!
    createdAt: Date!
    updatedAt: Date!
  }

  # Transaction Summary Type (for lists)
  type TransactionSummary {
    buyerId: ID
    sellerId: ID
    transactionId: ID!
    orderId: ID!
    chapaRef: String
    chapaStatus: String
    amount: Float!
    currency: String!
    status: TransactionStatus!
    createdAt: Date!
  }

  # Input Types
  input CreateTransactionInput {
    buyerId: ID
    sellerId: ID
    transactionId: ID!
    orderId: ID!
    chapaRef: String
    chapaStatus: String
    amount: Float!
    currency: String = "ETB"
    status: TransactionStatus = PENDING
  }

  input UpdateTransactionInput {
    chapaRef: String
    chapaStatus: String
    amount: Float
    currency: String
    status: TransactionStatus
  }

  input TransactionFilterInput {
    buyerId: ID
    sellerId: ID
    orderId: ID
    chapaRef: String
    chapaStatus: String
    status: TransactionStatus
    dateFrom: Date
    dateTo: Date
    minAmount: Float
    maxAmount: Float
  }

  # Extend existing Query type
  extend type Query {
    # Get single transaction
    transaction(transactionId: ID!): Transaction

    # Get transactions by order ID
    transactionsByOrder(orderId: ID!): [Transaction!]!

    # Get my transactions (user's transactions based on their orders)
    myTransactions(status: TransactionStatus): [Transaction!]!

    # Get transaction summaries (lightweight for listing)
    transactionSummaries(filter: TransactionFilterInput): [TransactionSummary!]!

    # Get transactions by status (admin)
    transactionsByStatus(status: TransactionStatus!): [Transaction!]!

    # Get transactions by Chapa reference
    transactionByChapa(chapaRef: String!): Transaction
  }

  # Extend existing Mutation type
  extend type Mutation {
    # Create new transaction
    createTransaction(input: CreateTransactionInput!): Transaction!

    # Update transaction
    updateTransaction(
      transactionId: ID!
      input: UpdateTransactionInput!
    ): Transaction!

    # Update transaction status
    updateTransactionStatus(
      transactionId: ID!
      status: TransactionStatus!
      chapaRef: String
    ): Transaction!
  }
`;

module.exports = transactionTypeDefs;

// /graphql/msSchemas.js
const { gql } = require("apollo-server-express");

const typeDefs = gql`
  scalar Date

  type GeoPoint {
    latitude: Float!
    longitude: Float!
  }

  type Address {
    street: String
    city: String
    state: String
    country: String
    postalCode: String
    geoLocation: GeoPoint
    geoLocationText: String
  }

  type MSUser {
    userId: ID!
    email: String!
    role: String
    companyName: String
    contactName: String
    phoneNumber: String
    address: Address
    profileImageUrl: String
    createdAt: Date
    isApproved: Boolean
    rejectionReason: String
    approvedBy: String
    approvedAt: Date
    efdaLicenseUrl: String
    businessLicenseUrl: String
    profileComplete: Boolean
  }


  #"Represents a single batch item in a cart"
  type CartBatchItem {
    batchId: ID!
    productId: ID!
    quantity: Float!
    unitPrice: Float!
    addedAt: Date!
    expiryDate: Date
    batchSellerName: String!
    batchSellerId: ID!
  }

  #"Represents a product in the cart, potentially with multiple batches"
  type CartItem {
    productId: ID!
    productName: String!
    productType: String!
    productImage: String
    productCategory: String
    batchItems: [CartBatchItem!]!
    totalQuantity: Float!
    totalPrice: Float!
  }

  #"Represents the user's shopping cart"
  type Cart {
    userId: ID!
    items: [CartItem]
    totalItems: Int
    totalPrice: Float
    lastUpdated: Date
  }

  
  #"Input for adding a specific batch to cart"
  input AddSpecificBatchToCartInput {
    productId: ID!
    batchId: ID!
    quantity: Float!
  }

  #"Input for adding product to cart with auto-batch selection"
  input AddToCartInput {
    productId: ID!
    quantity: Float!
  }

  #"Input for updating a specific batch quantity in cart"
  input UpdateCartBatchItemInput {
    productId: ID!
    batchId: ID!
    quantity: Float!
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

  input GeoPointInput {
    latitude: Float!
    longitude: Float!
  }

  input MSUserInput {
    email: String
    role: String
    companyName: String
    contactName: String
    phoneNumber: String
    address: AddressInput
    profileImageUrl: String
    efdaLicenseUrl: String
    businessLicenseUrl: String
    profileComplete: Boolean
    rejectionReason: String
  }

  type Query {
    # User queries
    msMe: MSUser
    msUserById(userId: ID!): MSUser
    msUsersByRole(role: String!): [MSUser]
    pendingApprovalUsers(limit: Int, offset: Int): [MSUser]

    # Search queries
    searchMSUsers(query: String!): [MSUser]

    # Cart queries
    myCart: Cart
    cartItemsByProduct(productId: ID!): CartItem
  }

  type Mutation {
    # User mutations
    initializeMSUserProfile(email: String!): MSUser
    updateMSUserProfile(input: MSUserInput!): MSUser
    completeMSRegistration(input: MSUserInput!): MSUser

    # Admin mutations
    approveMSUser(userId: ID!): MSUser
    rejectMSUser(userId: ID!, reason: String!): Boolean

    # Cart mutations
    addToCart(input: AddToCartInput!): Cart!
    addSpecificBatchToCart(input: AddSpecificBatchToCartInput!): Cart!
    updateCartBatchItem(input: UpdateCartBatchItemInput!): Cart!
    removeProductFromCart(productId: ID!): Cart!
    removeBatchFromCart(productId: ID!, batchId: ID!): Cart!
    clearCart: Cart!
  }
`;

module.exports = typeDefs;

