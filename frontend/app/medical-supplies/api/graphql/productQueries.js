import { gql } from '@apollo/client';

// Product Fragments
export const PRODUCT_CORE_FIELDS = gql`
  fragment ProductCoreFields on Product {
    productId
    productType
    name
    originalListerId
    originalListerName
    category
    description
    imageList
    isActive
    createdAt
    lastUpdatedAt
  }
`;

export const DRUG_PRODUCT_FIELDS = gql`
  fragment DrugProductFields on DrugProduct {
    ...ProductCoreFields
    packageType
    concentration
    requiresPrescription
  }
  ${PRODUCT_CORE_FIELDS}
`;

export const EQUIPMENT_PRODUCT_FIELDS = gql`
  fragment EquipmentProductFields on EquipmentProduct {
    ...ProductCoreFields
    brandName
    modelNumber
    warrantyInfo
    sparePartInfo
    documentUrls
  }
  ${PRODUCT_CORE_FIELDS}
`;

// Batch Fragments
export const BATCH_CORE_FIELDS = gql`
  fragment BatchCoreFields on Batch {
    batchId
    productId
    currentOwnerId
    currentOwnerName
    quantity
    costPrice
    sellingPrice
    addedAt
    product {
      productId
      name
      productType
    }
  }
`;

export const DRUG_BATCH_FIELDS = gql`
  fragment DrugBatchFields on DrugBatch {
    ...BatchCoreFields
    expiryDate
    sizePerPackage
    manufacturer
    manufacturerCountry
  }
  ${BATCH_CORE_FIELDS}
`;

export const EQUIPMENT_BATCH_FIELDS = gql`
  fragment EquipmentBatchFields on EquipmentBatch {
    ...BatchCoreFields
    serialNumbers
  }
  ${BATCH_CORE_FIELDS}
`;

// Query to get a product by ID
export const GET_PRODUCT_BY_ID = gql`
  query GetProductById($productId: ID!) {
    productById(productId: $productId) {
      ... on DrugProduct {
        productId
        productType
        name
        originalListerId
        originalListerName
        category
        description
        imageList
        isActive
        createdAt
        lastUpdatedAt
        packageType
        concentration
        requiresPrescription
        batches {
          batchId
          productId
          currentOwnerId
          currentOwnerName
          quantity
          costPrice
          sellingPrice
          addedAt
          expiryDate
          sizePerPackage
          manufacturer
          manufacturerCountry
        }
      }
      ... on EquipmentProduct {
        productId
        productType
        name
        originalListerId
        originalListerName
        category
        description
        imageList
        isActive
        createdAt
        lastUpdatedAt
        brandName
        modelNumber
        warrantyInfo
        sparePartInfo
        documentUrls
        batches {
          batchId
          productId
          currentOwnerId
          currentOwnerName
          quantity
          costPrice
          sellingPrice
          addedAt
          serialNumbers
        }
      }
    }
  }
`;

// Query to get all products, optionally filtered by type
export const GET_PRODUCTS = gql`
  query GetProducts($productType: String, $limit: Int, $offset: Int) {
    products(productType: $productType, limit: $limit, offset: $offset) {
      ... on DrugProduct {
        productId
        productType
        name
        originalListerId
        originalListerName
        category
        description
        imageList
        isActive
        createdAt
        lastUpdatedAt
        packageType
        concentration
        requiresPrescription
      }
      ... on EquipmentProduct {
        productId
        productType
        name
        originalListerId
        originalListerName
        category
        description
        imageList
        isActive
        createdAt
        lastUpdatedAt
        brandName
        modelNumber
        warrantyInfo
        sparePartInfo
        documentUrls
      }
    }
  }
`;

// Query to get a batch by ID
export const GET_BATCH_BY_ID = gql`
  query GetBatchById($batchId: ID!) {
    batchById(batchId: $batchId) {
      ... on DrugBatch {
        batchId
        productId
        currentOwnerId
        currentOwnerName
        quantity
        costPrice
        sellingPrice
        addedAt
        expiryDate
        sizePerPackage
        manufacturer
        manufacturerCountry
        product {
          productId
          name
          productType
        }
      }
      ... on EquipmentBatch {
        batchId
        productId
        currentOwnerId
        currentOwnerName
        quantity
        costPrice
        sellingPrice
        addedAt
        serialNumbers
        product {
          productId
          name
          productType
        }
      }
    }
  }
`;

// Query to get all batches for a specific product
export const GET_PRODUCT_BATCHES = gql`
  query GetProductBatches($productId: ID!, $limit: Int, $offset: Int) {
    batchesByProductId(productId: $productId, limit: $limit, offset: $offset) {
      ... on DrugBatch {
        batchId
        productId
        currentOwnerId
        currentOwnerName
        quantity
        costPrice
        sellingPrice
        addedAt
        expiryDate
        sizePerPackage
        manufacturer
        manufacturerCountry
        product {
          productId
          name
          productType
        }
      }
      ... on EquipmentBatch {
        batchId
        productId
        currentOwnerId
        currentOwnerName
        quantity
        costPrice
        sellingPrice
        addedAt
        serialNumbers
        product {
          productId
          name
          productType
        }
      }
    }
  }
`;

// Query to get all batches with pagination
export const GET_ALL_BATCHES = gql`
  query GetAllBatches($limit: Int, $offset: Int) {
    allBatches(limit: $limit, offset: $offset) {
      ... on DrugBatch {
        batchId
        productId
        currentOwnerId
        currentOwnerName
        quantity
        costPrice
        sellingPrice
        addedAt
        expiryDate
        sizePerPackage
        manufacturer
        manufacturerCountry
        product {
          productId
          name
          productType
        }
      }
      ... on EquipmentBatch {
        batchId
        productId
        currentOwnerId
        currentOwnerName
        quantity
        costPrice
        sellingPrice
        addedAt
        serialNumbers
        product {
          productId
          name
          productType
        }
      }
    }
  }
`;