// src/lib/graphql/productFragments.js
import { gql } from "@apollo/client";

// Product Fragments
export const PRODUCT_CORE_FIELDS = gql`
  fragment ProductCoreFields on Product {
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
    lastUpdatedAt
    sourceOriginalBatchId
    manufacturer
    manufacturerCountry
    manufactureredDate
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
