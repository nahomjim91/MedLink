import { gql } from '@apollo/client';
import { DRUG_BATCH_FIELDS, DRUG_PRODUCT_FIELDS, EQUIPMENT_BATCH_FIELDS, EQUIPMENT_PRODUCT_FIELDS } from './productFragments';


// Query to get a product by ID
export const GET_PRODUCT_BY_ID = gql`
  query GetProductById($productId: ID!) {
    productById(productId: $productId) {
      ... on DrugProduct {
        ...DrugProductFields
        batches {
          ... on DrugBatch {
            ...DrugBatchFields
          }
        }
      }
      ... on EquipmentProduct {
        ...EquipmentProductFields
        batches {
          ... on EquipmentBatch {
            ...EquipmentBatchFields
          }
        }
      }
    }
  }
  ${DRUG_PRODUCT_FIELDS}
  ${EQUIPMENT_PRODUCT_FIELDS}
  ${DRUG_BATCH_FIELDS}
  ${EQUIPMENT_BATCH_FIELDS}
`;

// Query to get all products, optionally filtered by type
export const GET_PRODUCTS = gql`
  query GetProducts($productType: String, $ownerId: ID, $category: String, $limit: Int, $offset: Int) {
    products(
      productType: $productType, 
      ownerId: $ownerId, 
      category: $category, 
      limit: $limit, 
      offset: $offset
    ) {
      ... on DrugProduct {
        ...DrugProductFields
      }
      ... on EquipmentProduct {
        ...EquipmentProductFields
      }
    }
  }
  ${DRUG_PRODUCT_FIELDS}
  ${EQUIPMENT_PRODUCT_FIELDS}
`;

// Query to get my products
export const GET_MY_PRODUCTS = gql`
  query GetMyProducts($productType: String, $category: String, $limit: Int, $offset: Int) {
    myProducts(
      productType: $productType, 
      category: $category, 
      limit: $limit, 
      offset: $offset
    ) {
      ... on DrugProduct {
        ...DrugProductFields
      }
      ... on EquipmentProduct {
        ...EquipmentProductFields
      }
    }
  }
  ${DRUG_PRODUCT_FIELDS}
  ${EQUIPMENT_PRODUCT_FIELDS}
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
  query GetAllBatches($ownerId: ID, $productType: String, $limit: Int, $offset: Int) {
    allBatches(
      ownerId: $ownerId,
      productType: $productType,
      limit: $limit, 
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
    myBatches(
      productType: $productType,
      limit: $limit, 
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