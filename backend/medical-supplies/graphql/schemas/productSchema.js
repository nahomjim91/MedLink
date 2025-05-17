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
    batches: [Batch]

    # Equipment-specific fields
    brandName: String
    modelNumber: String
    warrantyInfo: String
    sparePartInfo: [String]
    documentUrls: [String]
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

    # DrugBatch-specific fields
    expiryDate: Date!
    sizePerPackage: Float # Using Float for Number type
    manufacturer: String
    manufacturerCountry: String
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

    # EquipmentBatch-specific fields
    serialNumbers: [String]
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
    documentUrls: [String]
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
    documentUrls: [String]
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
  }

  input CreateEquipmentBatchInput {
    productId: ID!
    quantity: Float!
    costPrice: Float
    sellingPrice: Float
    serialNumbers: [String]
    currentOwnerId: ID!
    currentOwnerName: String
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
  }

  input UpdateEquipmentBatchInput {
    quantity: Float
    costPrice: Float
    sellingPrice: Float
    serialNumbers: [String]
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
    searchProducts(
      searchInput: SearchProductsInput!
    ): [Product!]!


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
