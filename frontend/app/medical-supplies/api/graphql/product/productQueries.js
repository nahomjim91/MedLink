import { gql } from "@apollo/client";
import {
  DRUG_BATCH_FIELDS,
  EQUIPMENT_BATCH_FIELDS,
} from "./productFragments";

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
        ownerId
        ownerName
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
          ... on DrugBatch {
            batchId
            productId
            currentOwnerId
            currentOwnerName
            quantity
            costPrice
            sellingPrice
            addedAt
            lastUpdatedAt
            sourceOriginalBatchId
            expiryDate
            sizePerPackage
            manufacturer
            manufacturerCountry
            manufactureredDate
          }
        }
      }
      ... on EquipmentProduct {
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
        brandName
        modelNumber
        warrantyInfo
        sparePartInfo
        documentUrls
        batches {
          ... on EquipmentBatch {
            batchId
            productId
            currentOwnerId
            currentOwnerName  
            quantity
            costPrice
            sellingPrice
            addedAt
            lastUpdatedAt
            sourceOriginalBatchId
            serialNumbers
            manufacturer
            manufacturerCountry
            manufactureredDate
          }
        }
      }
    }
  }
`;


export const GET_MY_PRODUCTS = gql`
  query GetMyProducts(
    $productType: String
    $category: String
    $limit: Int
    $offset: Int
  ) {
    myProducts(
      productType: $productType
      category: $category
      limit: $limit
      offset: $offset
    ) {
      ... on DrugProduct {
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
        ownerId
        ownerName
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
// Fix the EquipmentProduct fragment in your GraphQL query
export const GET_MY_PRODUCTS_WITH_BATCHES = gql`
  query GetMyProducts(
    $productType: String
    $category: String
    $limit: Int
    $offset: Int
  ) {
    myProducts(
      productType: $productType
      category: $category
      limit: $limit
      offset: $offset
    ) {
      ... on DrugProduct {
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
        packageType
        concentration
        requiresPrescription
        batches {
          ... on DrugBatch {
            batchId
            productId
            currentOwnerId
            currentOwnerName
            quantity
            costPrice
            sellingPrice
            addedAt
            lastUpdatedAt
            sourceOriginalBatchId
            expiryDate
            sizePerPackage
            manufacturer
            manufacturerCountry
          }
        }
      }
      ... on EquipmentProduct {
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
        brandName
        modelNumber
        warrantyInfo
        sparePartInfo
        documentUrls
        batches {
          ... on EquipmentBatch {
            batchId
            productId
            currentOwnerId
            currentOwnerName
            quantity
            costPrice
            sellingPrice
            addedAt
            lastUpdatedAt
            sourceOriginalBatchId
            serialNumbers
          }
        }
      }
    }
  }
`;

// Query to get a batch by ID
export const GET_BATCH_BY_ID = gql`
  query GetBatchById($batchId: ID!) {
    batchById(batchId: $batchId) {
      ... on DrugBatch {
        ...DrugBatchFields
      }
      ... on EquipmentBatch {
        ...EquipmentBatchFields
      }
    }
  }
  ${DRUG_BATCH_FIELDS}
  ${EQUIPMENT_BATCH_FIELDS}
`;

// Query to get all batches for a specific product
export const GET_PRODUCT_BATCHES = gql`
  query GetProductBatches($productId: ID!, $limit: Int, $offset: Int) {
    batchesByProductId(productId: $productId, limit: $limit, offset: $offset) {
      ... on DrugBatch {
        ...DrugBatchFields
      }
      ... on EquipmentBatch {
        ...EquipmentBatchFields
      }
    }
  }
  ${DRUG_BATCH_FIELDS}
  ${EQUIPMENT_BATCH_FIELDS}
`;

// Query to get all batches with pagination
export const GET_ALL_BATCHES = gql`
  query GetAllBatches(
    $ownerId: ID
    $productType: String
    $limit: Int
    $offset: Int
  ) {
    allBatches(
      ownerId: $ownerId
      productType: $productType
      limit: $limit
      offset: $offset
    ) {
      ... on DrugBatch {
        ...DrugBatchFields
      }
      ... on EquipmentBatch {
        ...EquipmentBatchFields
      }
    }
  }
  ${DRUG_BATCH_FIELDS}
  ${EQUIPMENT_BATCH_FIELDS}
`;

// Query to get my batches
export const GET_MY_BATCHES = gql`
  query GetMyBatches($productType: String, $limit: Int, $offset: Int) {
    myBatches(productType: $productType, limit: $limit, offset: $offset) {
      ... on DrugBatch {
        ...DrugBatchFields
      }
      ... on EquipmentBatch {
        ...EquipmentBatchFields
      }
    }
  }
  ${DRUG_BATCH_FIELDS}
  ${EQUIPMENT_BATCH_FIELDS}
`;

// Query to searching products
export const SEARCH_PRODUCTS = gql`
  query SearchProducts($searchInput: SearchProductsInput!) {
    searchProducts(searchInput: $searchInput) {
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
      ... on DrugProduct {
        packageType
        concentration
        requiresPrescription
      }
      ... on EquipmentProduct {
        brandName
        modelNumber
        warrantyInfo
      }
      batches {
        batchId
        quantity
        sellingPrice
        costPrice
        ... on DrugBatch {
          expiryDate
          manufacturer
        }
        ... on EquipmentBatch {
          serialNumbers
        }
      }
    }
  }
`;

// Add these queries to your GraphQL queries file
export const GET_BATCH_CURRENT_QUANTITY = gql`
  query GetBatchCurrentQuantity($batchId: ID!) {
    batchById(batchId: $batchId) {
      ... on DrugBatch {
        batchId
        quantity
        sellingPrice
        product {
          productId
          name
        }
      }
      ... on EquipmentBatch {
        batchId
        quantity
        sellingPrice
        product {
          productId
          name
        }
      }
    }
  }
`;