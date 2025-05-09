// /api/graphql/mutations.js
import { gql } from "@apollo/client";

// Mutation to initialize a medical supplies user profile
export const INITIALIZE_MS_USER_PROFILE = gql`
  mutation InitializeMSUserProfile($email: String!) {
    initializeMSUserProfile(email: $email) {
      userId
      email
      role
    }
  }
`;

// Mutation to update user profile
export const UPDATE_MS_USER_PROFILE = gql`
  mutation UpdateMSUserProfile($input: MSUserInput!) {
    updateMSUserProfile(input: $input) {
      userId
      email
      role
      companyName
      contactName
      phoneNumber
      address {
        street
        city
        state
        country
        postalCode
        geoLocation {
          latitude
          longitude
        }
      }
      profileImageUrl
      efdaLicenseUrl
      businessLicenseUrl
    }
  }
`;

// Mutation to complete registration
export const COMPLETE_MS_REGISTRATION = gql`
  mutation CompleteMSRegistration($input: MSUserInput!) {
    completeMSRegistration(input: $input) {
      userId
      email
      role
      companyName
      contactName
      phoneNumber
      address {
        street
        city
        state
        country
        postalCode
        geoLocation {
          latitude
          longitude
        }
        geoLocationText
      }
      profileImageUrl
      efdaLicenseUrl
      businessLicenseUrl
      isApproved
    }
  }
`;

// Mutation to approve a user (admin only)
export const APPROVE_MS_USER = gql`
  mutation ApproveMSUser($userId: ID!) {
    approveMSUser(userId: $userId) {
      userId
      email
      isApproved
      approvedBy
      approvedAt
    }
  }
`;

// Mutation to reject a user (admin only)
export const REJECT_MS_USER = gql`
  mutation RejectMSUser($userId: ID!, $reason: String!) {
    rejectMSUser(userId: $userId, reason: $reason)
  }
`;

// Cart mutations
export const ADD_TO_CART = gql`
  mutation AddToCart(
    $productId: ID!
    $quantity: Int!
    $price: Float!
    $productName: String
    $productImage: String
  ) {
    addToCart(
      productId: $productId
      quantity: $quantity
      price: $price
      productName: $productName
      productImage: $productImage
    ) {
      userId
      cart {
        items {
          productId
          quantity
          price
          productName
          productImage
        }
        total
        lastUpdated
      }
    }
  }
`;

export const UPDATE_CART_ITEM = gql`
  mutation UpdateCartItem($productId: ID!, $quantity: Int!) {
    updateCartItem(productId: $productId, quantity: $quantity) {
      userId
      cart {
        items {
          productId
          quantity
          price
          productName
          productImage
        }
        total
        lastUpdated
      }
    }
  }
`;

export const REMOVE_FROM_CART = gql`
  mutation RemoveFromCart($productId: ID!) {
    removeFromCart(productId: $productId) {
      userId
      cart {
        items {
          productId
          quantity
          price
          productName
          productImage
        }
        total
        lastUpdated
      }
    }
  }
`;

export const CLEAR_CART = gql`
  mutation ClearCart {
    clearCart {
      userId
      cart {
        items {
          productId
          quantity
          price
          productName
          productImage
        }
        total
        lastUpdated
      }
    }
  }
`;
