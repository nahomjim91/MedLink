// src/graphql/cartQuery.js
import { gql } from '@apollo/client';
import { CART_FRAGMENT } from './cartFragment';
// Queries
export const GET_MY_CART = gql`
  query GetMyCart {
    myCart {
      ...CartFields
    }
  }
  ${CART_FRAGMENT}
`;

export const GET_CART_ITEM_BY_PRODUCT = gql`
  query GetCartItemByProduct($productId: ID!) {
    cartItemsByProduct(productId: $productId) {
      productId
      productName
      productType
      productCategory
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

// Mutations
export const ADD_TO_CART = gql`
  mutation AddToCart($input: AddToCartInput!) {
    addToCart(input: $input) {
      ...CartFields
    }
  }
  ${CART_FRAGMENT}
`;