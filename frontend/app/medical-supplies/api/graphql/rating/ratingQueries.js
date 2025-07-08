// api/graphql/rating/ratingQuery.js
import { gql } from "@apollo/client";

export const GET_USER_RATINGS = gql`
  query GetUserRatings($userId: ID!, $limit: Int, $offset: Int) {
    userRatings(userId: $userId, limit: $limit, offset: $offset) {
      id
      raterId
      raterName
      raterCompanyName
      ratedUserId
      ratedUserName
      ratedUserCompanyName
      orderId
      rating
      comment
      ratingType
      type
      createdAt
      updatedAt
    }
  }
`;

export const GET_PRODUCT_RATINGS = gql`
  query GetProductRatings($productId: ID!, $limit: Int, $offset: Int) {
    productRatings(productId: $productId, limit: $limit, offset: $offset) {
      id
      userId
      userName
      userCompanyName
      productId
      productName
      productSellerId
      orderId
      rating
      comment
      type
      createdAt
      updatedAt
    }
  }
`;

export const GET_MY_RATINGS = gql`
  query GetMyRatings($limit: Int, $offset: Int) {
    myRatings(limit: $limit, offset: $offset) {
      ... on UserRating {
        id
        raterId
        raterName
        raterCompanyName
        ratedUserId
        ratedUserName
        ratedUserCompanyName
        orderId
        rating
        comment
        ratingType
        type
        createdAt
        updatedAt
      }
      ... on ProductRating {
        id
        userId
        userName
        userCompanyName
        productId
        productName
        productSellerId
        orderId
        rating
        comment
        type
        createdAt
        updatedAt
      }
    }
  }
`;

export const GET_ORDER_RATINGS = gql`
  query GetOrderRatings($orderId: ID!) {
    orderRatings(orderId: $orderId) {
      ... on UserRating {
        id
        raterId
        raterName
        raterCompanyName
        ratedUserId
        ratedUserName
        ratedUserCompanyName
        orderId
        rating
        comment
        ratingType
        type
        createdAt
        updatedAt
      }
      ... on ProductRating {
        id
        userId
        userName
        userCompanyName
        productId
        productName
        productSellerId
        orderId
        rating
        comment
        type
        createdAt
        updatedAt
      }
    }
  }
`;

export const GET_USER_RATING_STATS = gql`
  query GetUserRatingStats($userId: ID!) {
    userRatingStats(userId: $userId) {
      totalRatings
      averageRating
      lastUpdated
    }
  }
`;

export const GET_PRODUCT_RATING_STATS = gql`
  query GetProductRatingStats($productId: ID!) {
    productRatingStats(productId: $productId) {
      totalRatings
      averageRating
      lastUpdated
    }
  }
`;

export const CAN_RATE_USER = gql`
  query CanRateUser($orderId: ID!, $ratedUserId: ID!) {
    canRateUser(orderId: $orderId, ratedUserId: $ratedUserId)
  }
`;

export const CAN_RATE_PRODUCT = gql`
  query CanRateProduct($orderId: ID!, $productId: ID!) {
    canRateProduct(orderId: $orderId, productId: $productId)
  }
`;
