'use client';
const { useQuery } = require("@apollo/client");
const { GET_PRODUCT_BY_ID } = require("../api/graphql/product/productQueries");

// Product Context Hook
const useProductContext = (productId) => {
  const { data, loading, error } = useQuery(GET_PRODUCT_BY_ID, {
    variables: { productId },
    skip: !productId,
  });

  const formatProductForChat = (product) => {
    if (!product) return null;

    const batch = product.batches?.[0]; // Get first available batch
    const imageUrl = product.imageList?.[0] || null; 
    
    return {
      productId: product.productId,
      title: product.name,
      price: batch?.sellingPrice || 0,
      stock: batch?.quantity || 0,
      imageUrl,
      category: product.category,
      description: product.description,
      productType: product.productType,
      ownerName: product.ownerName,
      ownerId: product.ownerId,
    };
  };

  return {
    productData: data?.productById ? formatProductForChat(data.productById) : null,
    loading,
    error
  };
};

export default useProductContext;