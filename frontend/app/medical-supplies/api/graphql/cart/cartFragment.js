// src/graphql/fragment.js
import { gql } from '@apollo/client';

export const CART_FRAGMENT = gql`
  fragment CartFields on Cart {
    userId
    totalItems
    totalPrice
    lastUpdated
    items {
      productId
      productName
      productType
      productImage
      productImage
      totalQuantity
      totalPrice
      batchItems {
        batchId
        productId
        quantity
        unitPrice
        addedAt
        expiryDate
        batchSellerName
        batchSellerId
      }
    }
  }
`;