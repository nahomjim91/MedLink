// src/graphql/cartMutation.js
import { gql } from '@apollo/client';
import { CART_FRAGMENT } from './cartFragment';

// Mutations
export const ADD_TO_CART = gql`
  mutation AddToCart($input: AddToCartInput!) {
    addToCart(input: $input) {
      ...CartFields
    }
  }
  ${CART_FRAGMENT}
`;

export const ADD_SPECIFIC_BATCH_TO_CART = gql`
  mutation AddSpecificBatchToCart($input: AddSpecificBatchToCartInput!) {
    addSpecificBatchToCart(input: $input) {
      ...CartFields
    }
  }
  ${CART_FRAGMENT}
`;

export const UPDATE_CART_BATCH_ITEM = gql`
  mutation UpdateCartBatchItem($input: UpdateCartBatchItemInput!) {
    updateCartBatchItem(input: $input) {
      ...CartFields
    }
  }
  ${CART_FRAGMENT}
`;

export const REMOVE_PRODUCT_FROM_CART = gql`
  mutation RemoveProductFromCart($productId: ID!) {
    removeProductFromCart(productId: $productId) {
      ...CartFields
    }
  }
  ${CART_FRAGMENT}
`;

export const REMOVE_BATCH_FROM_CART = gql`
  mutation RemoveBatchFromCart($productId: ID!, $batchId: ID!) {
    removeBatchFromCart(productId: $productId, batchId: $batchId) {
      ...CartFields
    }
  }
  ${CART_FRAGMENT}
`;

export const CLEAR_CART = gql`
  mutation ClearCart {
    clearCart {
      ...CartFields
    }
  }
  ${CART_FRAGMENT}
`;