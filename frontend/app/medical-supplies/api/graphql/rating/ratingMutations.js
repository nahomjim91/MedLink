// api/graphql/rating/ratingMutation.js
import { gql } from "@apollo/client";

export const CREATE_USER_RATING = gql`
  mutation CreateUserRating($input: CreateUserRatingInput!) {
    createUserRating(input: $input) {
      id
      raterId
      raterName
      raterCompanyName
      ratedUserId
      ratedUserName
      ratedUserCompanyName
      raterProfileImage
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

export const CREATE_PRODUCT_RATING = gql`
  mutation CreateProductRating($input: CreateProductRatingInput!) {
    createProductRating(input: $input) {
      id
      userId
      userName
      userCompanyName
      userProfileImage
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

export const DELETE_RATING = gql`
  mutation DeleteRating($ratingId: ID!, $reason: String!) {
    deleteRating(ratingId: $ratingId, reason: $reason)
  }
`;