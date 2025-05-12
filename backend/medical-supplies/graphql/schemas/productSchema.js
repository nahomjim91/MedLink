// /graphql/ms-schemas.js
const { gql } = require("apollo-server-express");

const productSchema = gql`
  scalar Date # Assuming you have a custom Date scalar like in your example
  "Interface for common product fields"
  interface Product {
    productId: ID!
    productType: String! # e.g., "DRUG", "EQUIPMENT"
    name: String!
    originalListerId: ID!
    originalListerName: String!
    category: String
    description: String
    imageList: [String] # Assuming URLs or identifiers for images
    isActive: Boolean!
    createdAt: Date!
    lastUpdatedAt: Date!
    batches: [Batch!] # A product can have multiple batches
  }

  "Represents a Drug Product"
  type DrugProduct implements Product {
    # Fields from Product interface
    productId: ID!
    productType: String!
    name: String!
    originalListerId: ID!
    originalListerName: String!
    category: String
    description: String
    imageList: [String]
    isActive: Boolean!
    createdAt: Date!
    lastUpdatedAt: Date!
    batches: [Batch!]

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
    category: String
    description: String
    imageList: [String]
    isActive: Boolean!
    createdAt: Date!
    lastUpdatedAt: Date!
    batches: [Batch!]

    # Equipment-specific fields
    brandName: String
    modelNumber: String
    warrantyInfo: String
    sparePartInfo: String
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

    # EquipmentBatch-specific fields
    serialNumbers: [String]
  }

  # Input types for creating products
  input CreateDrugProductInput {
    name: String!
    originalListerId: ID! # Assuming this is set, or derived from context
    originalListerName: String! # Assuming this is set, or derived from context
    category: String
    description: String
    imageList: [String]
    isActive: Boolean = true
    packageType: String
    concentration: String
    requiresPrescription: Boolean!
  }

  input CreateEquipmentProductInput {
    name: String!
    originalListerId: ID!
    originalListerName: String!
    category: String
    description: String
    imageList: [String]
    isActive: Boolean = true
    brandName: String
    modelNumber: String
    warrantyInfo: String
    sparePartInfo: String
    documentUrls: [String]
  }

  # Input types for updating products (making fields optional)
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
    sparePartInfo: String
    documentUrls: [String]
  }

  # Input types for creating batches
  input CreateDrugBatchInput {
    productId: ID!
    currentOwnerId: ID!
    currentOwnerName: String!
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
    currentOwnerId: ID!
    currentOwnerName: String!
    quantity: Float!
    costPrice: Float
    sellingPrice: Float
    serialNumbers: [String]
  }

  # Input types for updating batches
  input UpdateDrugBatchInput {
    currentOwnerId: ID
    currentOwnerName: String
    quantity: Float
    costPrice: Float
    sellingPrice: Float
    expiryDate: Date
    sizePerPackage: Float
    manufacturer: String
    manufacturerCountry: String
  }

  input UpdateEquipmentBatchInput {
    currentOwnerId: ID
    currentOwnerName: String
    quantity: Float
    costPrice: Float
    sellingPrice: Float
    serialNumbers: [String]
  }

  type Query {
    "Get a product by its ID. Returns either DrugProduct or EquipmentProduct"
    productById(productId: ID!): Product

    "Get all products. Can be filtered by productType"
    products(productType: String, limit: Int, offset: Int): [Product!]

    "Get a batch by its ID. Returns either DrugBatch or EquipmentBatch"
    batchById(batchId: ID!): Batch

    "Get all batches for a specific product"
    batchesByProductId(productId: ID!, limit: Int, offset: Int): [Batch!]

    "Get all batches. Can be filtered by type (implicitly via product type or specific batch fields if needed)"
    allBatches(limit: Int, offset: Int): [Batch!]
  }

  type Mutation {
    "Create a new Drug Product"
    createDrugProduct(input: CreateDrugProductInput!): DrugProduct
    "Create a new Equipment Product"
    createEquipmentProduct(
      input: CreateEquipmentProductInput!
    ): EquipmentProduct

    "Update a Drug Product"
    updateDrugProduct(
      productId: ID!
      input: UpdateDrugProductInput!
    ): DrugProduct
    "Update an Equipment Product"
    updateEquipmentProduct(
      productId: ID!
      input: UpdateEquipmentProductInput!
    ): EquipmentProduct

    "Delete a product (sets isActive to false or actual delete)"
    deleteProduct(productId: ID!): Boolean # Or return the Product
    "Create a new Drug Batch"
    createDrugBatch(input: CreateDrugBatchInput!): DrugBatch
    "Create a new Equipment Batch"
    createEquipmentBatch(input: CreateEquipmentBatchInput!): EquipmentBatch

    "Update a Drug Batch"
    updateDrugBatch(batchId: ID!, input: UpdateDrugBatchInput!): DrugBatch
    "Update an Equipment Batch"
    updateEquipmentBatch(
      batchId: ID!
      input: UpdateEquipmentBatchInput!
    ): EquipmentBatch

    "Delete a batch"
    deleteBatch(batchId: ID!): Boolean # Or return the Batch
  }
`;

module.exports = productSchema;
