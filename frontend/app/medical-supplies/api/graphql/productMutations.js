// src/lib/graphql/product-mutations.js
import { gql } from '@apollo/client';
import { 
  DRUG_PRODUCT_FIELDS, 
  EQUIPMENT_PRODUCT_FIELDS,
  DRUG_BATCH_FIELDS,
  EQUIPMENT_BATCH_FIELDS
} from './productQueries';

// Product Mutations
export const CREATE_DRUG_PRODUCT = gql`
  mutation CreateDrugProduct($input: CreateDrugProductInput!) {
    createDrugProduct(input: $input) {
      ...DrugProductFields
    }
  }
  ${DRUG_PRODUCT_FIELDS}
`;

export const CREATE_EQUIPMENT_PRODUCT = gql`
  mutation CreateEquipmentProduct($input: CreateEquipmentProductInput!) {
    createEquipmentProduct(input: $input) {
      ...EquipmentProductFields
    }
  }
  ${EQUIPMENT_PRODUCT_FIELDS}
`;

export const UPDATE_DRUG_PRODUCT = gql`
  mutation UpdateDrugProduct($productId: ID!, $input: UpdateDrugProductInput!) {
    updateDrugProduct(productId: $productId, input: $input) {
      ...DrugProductFields
    }
  }
  ${DRUG_PRODUCT_FIELDS}
`;

export const UPDATE_EQUIPMENT_PRODUCT = gql`
  mutation UpdateEquipmentProduct($productId: ID!, $input: UpdateEquipmentProductInput!) {
    updateEquipmentProduct(productId: $productId, input: $input) {
      ...EquipmentProductFields
    }
  }
  ${EQUIPMENT_PRODUCT_FIELDS}
`;

export const DELETE_PRODUCT = gql`
  mutation DeleteProduct($productId: ID!) {
    deleteProduct(productId: $productId)
  }
`;

// Batch Mutations
export const CREATE_DRUG_BATCH = gql`
  mutation CreateDrugBatch($input: CreateDrugBatchInput!) {
    createDrugBatch(input: $input) {
      ...DrugBatchFields
    }
  }
  ${DRUG_BATCH_FIELDS}
`;

export const CREATE_EQUIPMENT_BATCH = gql`
  mutation CreateEquipmentBatch($input: CreateEquipmentBatchInput!) {
    createEquipmentBatch(input: $input) {
      ...EquipmentBatchFields
    }
  }
  ${EQUIPMENT_BATCH_FIELDS}
`;

export const UPDATE_DRUG_BATCH = gql`
  mutation UpdateDrugBatch($batchId: ID!, $input: UpdateDrugBatchInput!) {
    updateDrugBatch(batchId: $batchId, input: $input) {
      ...DrugBatchFields
    }
  }
  ${DRUG_BATCH_FIELDS}
`;

export const UPDATE_EQUIPMENT_BATCH = gql`
  mutation UpdateEquipmentBatch($batchId: ID!, $input: UpdateEquipmentBatchInput!) {
    updateEquipmentBatch(batchId: $batchId, input: $input) {
      ...EquipmentBatchFields
    }
  }
  ${EQUIPMENT_BATCH_FIELDS}
`;

export const DELETE_BATCH = gql`
  mutation DeleteBatch($batchId: ID!) {
    deleteBatch(batchId: $batchId)
  }
`;