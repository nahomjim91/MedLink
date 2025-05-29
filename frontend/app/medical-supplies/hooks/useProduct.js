'use client';
const { useQuery } = require("@apollo/client");
const { GET_PRODUCT_BY_ID } = require("../api/graphql/product/productQueries");

// Product Context Hook
const useProductContext = (productId) => {
  const { data, loading, error } = useQuery(GET_PRODUCT_BY_ID, {
    variables: { productId },
    skip: !productId,
    fetchPolicy: "cache-first",
  });

  const formatProductForChat = (product) => {
    if (!product) return null;

    const batch = product.batches?.[0]; // Get first available batch
    const imageUrl = product.imageList?.[0] || null; 
    
    return {
      productId: product.productId,
      productType: product.productType,
      title: product.name,
      price: batch?.sellingPrice || 0,
      stock: batch?.quantity || 0,
      imageUrl,
      category: product.category,
      description: product.description,
      ownerName: product.ownerName,
      ownerId: product.ownerId,
    };
  };

  const formatFullProductData = (product) => {
    if (!product) return null;

    const isDrugProduct = product.__typename === "DrugProduct";
    const isEquipmentProduct = product.__typename === "EquipmentProduct";

    // Filter batches with available quantity > 0
    const availableBatches = (product.batches || []).filter(
      batch => (batch.quantity || 0) > 0
    );

    // Sort batches by expiry date for drug products
    const sortedBatches = isDrugProduct
      ? [...availableBatches].sort(
          (a, b) => new Date(a.expiryDate) - new Date(b.expiryDate)
        )
      : availableBatches;

    return {
      productId: product.productId,
      name: product.name,
      description: product.description,
      category: product.category,
      imageList: product.imageList || [],
      batches: sortedBatches,
      ownerName: product.ownerName,
      ownerId: product.ownerId,
      productType: isDrugProduct ? "DRUG" : "EQUIPMENT",
      __typename: product.__typename,
      
      // Drug-specific fields
      ...(isDrugProduct && {
        concentration: product.concentration,
        packageType: product.packageType
      }),
      
      // Equipment-specific fields
      ...(isEquipmentProduct && {
        warrantyInfo: product.warrantyInfo,
        sparePartInfo: product.sparePartInfo
      }),

      // Computed fields
      totalAvailableStock: sortedBatches.reduce(
        (total, batch) => total + (batch.quantity || 0), 0
      ),
      lowestPrice: Math.min(
        ...sortedBatches.map(batch => batch.sellingPrice || 0)
      ),
      averagePrice: sortedBatches.length > 0 
        ? sortedBatches.reduce((sum, batch) => sum + (batch.sellingPrice || 0), 0) / sortedBatches.length
        : 0
    };
  };

  return {
    // For chat/card display
    productData: data?.productById ? formatProductForChat(data.productById) : null,
    
    // For detailed modal display
    fullProductData: data?.productById ? formatFullProductData(data.productById) : null,
    
    loading,
    error,
    refetch: () => {
      // Add refetch capability if needed
    }
  };
};

export default useProductContext;