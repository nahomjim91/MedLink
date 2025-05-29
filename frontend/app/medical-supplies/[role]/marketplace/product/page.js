"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@apollo/client";
import {
  GET_PRODUCT_BY_ID,
  SEARCH_PRODUCTS,
} from "../../../api/graphql/product/productQueries";
import { useMSAuth } from "../../../hooks/useMSAuth";
import { ProductImageGallery } from "../../../components/ui/ProductImageGallery";
import { Rating } from "../../../components/ui/FormField";
import { NumberInput } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { StarIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Syringe, Pill } from "lucide-react";

// Move RelatedProducts component outside to prevent unnecessary re-renders
const RelatedProducts = ({ currentProductId, productType, category, role }) => {
  const [relatedProducts, setRelatedProducts] = useState([]);

  const { data, loading, error } = useQuery(SEARCH_PRODUCTS, {
    variables: {
      searchInput: {
        productType: productType,
        category: category,
        limit: 5, // Get 5 related products
        offset: 0,
        sortBy: "name",
        sortOrder: "asc",
      },
    },
    skip: !productType, // skip if no product type
    fetchPolicy: "cache-first", // Use cache-first instead of network-only for better performance
  });

  useEffect(() => {
    if (data?.searchProducts) {
      // Filter out the current product and limit to 4 products
      const filtered = data.searchProducts
        .filter((product) => product.productId !== currentProductId)
        .slice(0, 4);
      setRelatedProducts(filtered);
    }
  }, [data, currentProductId]);

  if (loading) return <div className="py-4">Loading related products...</div>;
  if (error)
    return (
      <div className="py-4 text-red-500">
        Error loading related products: {error.message}
      </div>
    );
  if (!relatedProducts || relatedProducts.length === 0) return null;

  const isEquipment = productType === "EQUIPMENT";
  const ProductIcon = isEquipment ? Syringe : Pill;

  return (
    <div className="mt-10 pb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-secondary/70">
          Related Products
        </h2>
        <Link
          href={`/products?type=${productType}`}
          className="text-sm text-secondary/60 hover:text-secondary/80 pr-5"
        >
          View All
        </Link>
      </div>

      <div className="relative w-full overflow-x-auto pb-4">
        <div className="flex space-x-4 w-max">
          {relatedProducts.map((product) => (
            <Link
              href={`/medical-supplies/${role}/marketplace/product?id=${product.productId}`}
              key={product.productId}
            >
              <div className="border border-gray-200 rounded-md overflow-hidden hover:shadow-md transition-shadow duration-200 flex flex-col w-48 md:w-56 lg:w-64">
                <div className="h-32 md:h-40 relative bg-gray-100 flex justify-center items-center">
                  {product.imageList && product.imageList.length > 0 ? (
                    <Image
                      src={product.imageList[0]}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <ProductIcon size={64} className="text-primary" />
                  )}
                </div>

                <div className="p-3 flex-grow flex flex-col">
                  <div className="text-xs text-secondary/50 mb-1">
                    {product.originalListerName || "John Lewis"}
                  </div>
                  <h3 className="font-medium text-sm mb-1 line-clamp-2">
                    {product.name}
                  </h3>
                  <div className="mt-auto">
                    <div className="font-bold text-secondary/90 mt-1">
                      $
                      {(product.batches &&
                        product.batches[0]?.sellingPrice?.toFixed(2)) ||
                        "32"}
                    </div>
                    <div className="flex items-center mt-1">
                      <div className="flex items-center">
                        <StarIcon className="h-3 w-3 text-green-500 fill-green-500" />
                        <span className="text-xs ml-1 text-secondary/70">
                          {(Math.random() * (5 - 4) + 4).toFixed(1)}
                        </span>
                      </div>
                      <span className="text-xs text-secondary/50 ml-2">
                        {Math.floor(Math.random() * 1000) + 200} Sold
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function ProductDetails() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const productId = searchParams.get("id");

  // GraphQL query
  const {
    data: rawData,
    loading,
    error,
    refetch,
  } = useQuery(GET_PRODUCT_BY_ID, {
    variables: { productId },
    skip: !productId,
    fetchPolicy: "cache-and-network", // Better caching strategy
    errorPolicy: "all",
  });

  // Auth and cart data
  const {
    user,
    addToCart,
    addSpecificBatchToCart,
    updateCartBatchItem,
    refreshCart,
    cart: cartData,
  } = useMSAuth();

  // Local state
  const [activeTab, setActiveTab] = useState("automatically");
  const [quantity, setQuantity] = useState(1);
  const [selectedBatches, setSelectedBatches] = useState({});
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [cartMessage, setCartMessage] = useState({ type: "", message: "" });

  // Memoized cart product to avoid unnecessary recalculations
  const cartProduct = useMemo(() => {
    return cartData?.items?.find((item) => item.productId === productId);
  }, [cartData?.items, productId]);

  // Memoized function to get available quantity for a batch
  const getAvailableQuantity = useCallback(
    (batch) => {
      if (!cartProduct?.batchItems || !batch) return batch?.quantity || 0;

      const batchInCart = cartProduct.batchItems.find(
        (cartBatch) => cartBatch.batchId === batch.batchId
      );

      return batchInCart
        ? Math.max(0, (batch.quantity || 0) - batchInCart.quantity)
        : batch.quantity || 0;
    },
    [cartProduct?.batchItems]
  );

  // Process and filter product data based on cart quantities
  const processedData = useMemo(() => {
    if (!rawData?.productById) return null;

    const product = rawData.productById;
    const originalBatches = product.batches || [];

    // Filter out batches with no available quantity
    const processedBatches = originalBatches
      .map((batch) => ({
        ...batch,
        availableQuantity: getAvailableQuantity(batch),
        originalQuantity: batch.quantity,
      }))
      .filter((batch) => batch.availableQuantity > 0);

    return {
      ...product,
      batches: processedBatches,
    };
  }, [rawData, getAvailableQuantity]);

  // Memoized total available quantity
  const totalAvailableQuantity = useMemo(() => {
    if (!processedData?.batches) return 0;
    return processedData.batches.reduce(
      (total, batch) => total + batch.availableQuantity,
      0
    );
  }, [processedData?.batches]);

  // Memoized sorted batches for drug products
  const sortedBatches = useMemo(() => {
    if (!processedData?.batches) return [];

    const isDrugProduct = processedData.__typename === "DrugProduct";

    return isDrugProduct
      ? [...processedData.batches].sort(
          (a, b) => new Date(a.expiryDate) - new Date(b.expiryDate)
        )
      : processedData.batches;
  }, [processedData]);

  // Reset quantity when total available quantity changes
  useEffect(() => {
    if (quantity > totalAvailableQuantity && totalAvailableQuantity > 0) {
      setQuantity(Math.min(quantity, totalAvailableQuantity));
    }
  }, [totalAvailableQuantity, quantity]);

  // Reset selected batches when switching to manual mode or when cart updates
  useEffect(() => {
    if (activeTab === "manually" && processedData?.batches) {
      setSelectedBatches((prevBatches) => {
        const updatedBatches = {};

        // Only keep batches that still exist and have available quantity
        Object.entries(prevBatches).forEach(([batchId, selectedQty]) => {
          const batch = processedData.batches.find(
            (b) => b.batchId === batchId
          );
          if (batch && batch.availableQuantity > 0) {
            updatedBatches[batchId] = Math.min(
              selectedQty,
              batch.availableQuantity
            );
          }
        });

        return updatedBatches;
      });
    }
  }, [activeTab, processedData?.batches]);

  // Clear cart message after 5 seconds
  useEffect(() => {
    if (cartMessage.message) {
      const timer = setTimeout(() => {
        setCartMessage({ type: "", message: "" });
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [cartMessage.message]);

  // Event handlers
  const handleQuantityChange = useCallback(
    (e) => {
      const value = parseInt(e.target.value, 10);
      if (!isNaN(value) && value > 0) {
        setQuantity(Math.min(value, totalAvailableQuantity));
      }
    },
    [totalAvailableQuantity]
  );

  const handleBatchQuantityChange = useCallback(
    (batchId, value) => {
      const newQuantity = parseInt(value, 10);
      if (isNaN(newQuantity) || newQuantity < 0) return;

      const batch = processedData?.batches?.find((b) => b.batchId === batchId);
      if (!batch) return;

      setSelectedBatches((prev) => ({
        ...prev,
        [batchId]: Math.min(newQuantity, batch.availableQuantity),
      }));
    },
    [processedData?.batches]
  );

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
    setSelectedBatches({});
    setCartMessage({ type: "", message: "" });
  }, []);

  const handleAddToCart = useCallback(async () => {
    if (isAddingToCart) return;

    setIsAddingToCart(true);
    setCartMessage({ type: "", message: "" });

    try {
      if (activeTab === "automatically") {
        await handleAutomaticAddToCart();
      } else {
        await handleManualAddToCart();
      }

      // Refresh cart and product data
      await Promise.all([refreshCart(), refetch()]);
    } catch (error) {
      console.error("Error adding to cart:", error);
      setCartMessage({
        type: "error",
        message: `Error adding to cart: ${error.message}`,
      });
    } finally {
      setIsAddingToCart(false);
    }
  }, [
    isAddingToCart,
    activeTab,
    quantity,
    selectedBatches,
    processedData,
    cartProduct,
  ]);

  const handleAutomaticAddToCart = async () => {
    let remainingQuantity = quantity;
    let totalAdded = 0;

    for (const batch of sortedBatches) {
      if (remainingQuantity <= 0) break;

      const quantityFromBatch = Math.min(
        remainingQuantity,
        batch.availableQuantity
      );
      if (quantityFromBatch <= 0) continue;

      const batchInCart = cartProduct?.batchItems?.find(
        (b) => b.batchId === batch.batchId
      );

      if (batchInCart) {
        await updateCartBatchItem(
          processedData.productId,
          batch.batchId,
          batchInCart.quantity + quantityFromBatch
        );
      } else {
        await addSpecificBatchToCart(
          processedData.productId,
          batch.batchId,
          quantityFromBatch
        );
      }

      remainingQuantity -= quantityFromBatch;
      totalAdded += quantityFromBatch;
    }

    if (totalAdded > 0) {
      setCartMessage({
        type: remainingQuantity > 0 ? "warning" : "success",
        message:
          remainingQuantity > 0
            ? `Added ${totalAdded} items to cart. Could not add remaining ${remainingQuantity} due to insufficient stock.`
            : `Added ${totalAdded} items to cart`,
      });
      setQuantity(1);
    } else {
      setCartMessage({
        type: "error",
        message: "Could not add to cart. Insufficient stock available.",
      });
    }
  };

  const handleManualAddToCart = async () => {
    const batchSelections = Object.entries(selectedBatches).filter(
      ([_, qty]) => qty > 0
    );

    if (batchSelections.length === 0) {
      setCartMessage({
        type: "error",
        message: "Please select quantities for at least one batch",
      });
      return;
    }

    let totalAdded = 0;

    for (const [batchId, batchQuantity] of batchSelections) {
      const batchInCart = cartProduct?.batchItems?.find(
        (b) => b.batchId === batchId
      );

      if (batchInCart) {
        await updateCartBatchItem(
          processedData.productId,
          batchId,
          batchInCart.quantity + batchQuantity
        );
      } else {
        await addSpecificBatchToCart(
          processedData.productId,
          batchId,
          batchQuantity
        );
      }

      totalAdded += batchQuantity;
    }

    setCartMessage({
      type: "success",
      message: `Added ${totalAdded} items to cart from selected batches`,
    });
    setSelectedBatches({});
  };

  // Utility functions
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  const InfoRow = ({ label, value }) => (
    <div className="flex flex-col md:flex-row">
      <div className="w-full md:w-1/3">
        <h2 className="text-lg font-semibold text-secondary/80">{label}</h2>
      </div>
      <div className="w-full md:w-2/3">
        <p className="text-secondary/60">{value || "N/A"}</p>
      </div>
    </div>
  );

  // Memoize the props for RelatedProducts to prevent unnecessary re-renders
  const relatedProductsProps = useMemo(
    () => ({
      productType:
        processedData?.__typename === "DrugProduct" ? "DRUG" : "EQUIPMENT",
      currentProductId: processedData?.productId,
      category: processedData?.category,
      role: user?.role,
    }),
    [
      processedData?.__typename,
      processedData?.productId,
      processedData?.category,
      user?.role,
    ]
  );

  // Loading and error states
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen text-red-500">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Error Loading Product</h2>
          <p>{error.message}</p>
          <Button onClick={() => refetch()} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!processedData) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-bold">Product Not Found</h2>
          <p className="text-gray-600 mt-2">
            The requested product could not be found.
          </p>
        </div>
      </div>
    );
  }

  const isDrugProduct = processedData.__typename === "DrugProduct";
  const isEquipmentProduct = processedData.__typename === "EquipmentProduct";

  return (
    <div className="overflow-hidden mx-auto p-4 bg-white rounded-xl">
      <div className="h-[85vh] overflow-y-auto w-full">
        {/* Product content */}
        <div className="flex flex-col md:flex-row gap-6 w-full">
          {/* Image Gallery */}
          <div className="w-full md:w-1/3 pl-4">
            <ProductImageGallery
              images={processedData.imageList || []}
              type={isDrugProduct ? "DRUG" : "EQUIPMENT"}
              imageSize="h-64"
            />
          </div>

          {/* Product details */}
          <div className="w-full md:w-2/3 px-5">
            {/* Header */}
            <div className="mb-4 border-b border-secondary/20 border-dashed pb-4">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-secondary">
                  {processedData.name}{" "}
                  {isDrugProduct && processedData.concentration}
                </h1>
                <div className="flex items-center">
                  <span className="text-secondary/50 mr-2">1238 Sold</span>
                  <Rating value={4.5} maxStars={5} />
                </div>
              </div>
            </div>

            {/* Main product info */}
            <div className="max-w-4xl mx-auto px-6 rounded-lg">
              <div className="space-y-2">
                <InfoRow label="Category" value={processedData.category} />

                {isDrugProduct ? (
                  <>
                    <InfoRow
                      label="Package Type"
                      value={processedData.packageType}
                    />
                    <InfoRow
                      label="Manufacturer"
                      value={processedData.batches?.[0]?.manufacturer}
                    />
                    <InfoRow
                      label="Country"
                      value={processedData.batches?.[0]?.manufacturerCountry}
                    />
                  </>
                ) : isEquipmentProduct ? (
                  <>
                    <InfoRow
                      label="Warranty information"
                      value={processedData.warrantyInfo}
                    />
                    <InfoRow
                      label="Spare Parts"
                      value={processedData.sparePartInfo?.join(", ")}
                    />
                  </>
                ) : null}

                <div className="flex flex-col">
                  <div>
                    <h2 className="text-lg font-bold text-secondary/80">
                      Description:
                    </h2>
                  </div>
                  <div className="mt-2">
                    <p className="text-secondary/60">
                      {processedData.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Purchase section */}
            <div className="mt-3">
              {/* Selection mode tabs for drugs */}

              <div className="flex border-b border-secondary/20 mb-4">
                <button
                  className={`py-2 px-4 font-semibold transition-colors ${
                    activeTab === "automatically"
                      ? "border-b-2 border-primary text-primary"
                      : "text-secondary/80 hover:text-secondary"
                  }`}
                  onClick={() => handleTabChange("automatically")}
                >
                  Automatically
                </button>
                <button
                  className={`py-2 px-4 font-semibold transition-colors ${
                    activeTab === "manually"
                      ? "border-b-2 border-primary text-primary"
                      : "text-secondary/80 hover:text-secondary"
                  }`}
                  onClick={() => handleTabChange("manually")}
                >
                  Manually
                </button>
              </div>

              {/* Cart message feedback */}
              {cartMessage.message && (
                <div
                  className={`mb-4 p-3 rounded-lg border ${
                    cartMessage.type === "success"
                      ? "bg-green-50 text-green-800 border-green-200"
                      : cartMessage.type === "warning"
                      ? "bg-yellow-50 text-yellow-800 border-yellow-200"
                      : "bg-red-50 text-red-800 border-red-200"
                  }`}
                >
                  {cartMessage.message}
                </div>
              )}

              {/* Quantity selector for automatic mode */}
              {activeTab === "automatically" && (
                <div className="w-1/3 mb-4">
                  <NumberInput
                    value={quantity}
                    label="Quantity"
                    onChange={handleQuantityChange}
                    min={1}
                    max={totalAvailableQuantity}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Available: {totalAvailableQuantity} units
                  </p>
                </div>
              )}

              {/* Batch selection */}
              {activeTab === "manually" &&
                processedData.batches?.length > 0 && (
                  <div className="w-full px-4">
                    <div className="flex gap-4 overflow-x-auto pb-4 snap-x scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200">
                      {processedData.batches.map((batch) => (
                        <div
                          key={batch.batchId}
                          className="flex-shrink-0 bg-background/20 rounded-lg p-3 pb-0 relative shadow-lg hover:shadow-xl w-64 snap-start border border-gray-200 transition-shadow"
                        >
                          <div className="text-sm">
                            <div className="flex justify-between mb-1">
                              <span className="font-medium">Expire Date</span>
                              <span>
                                {isDrugProduct
                                  ? formatDate(batch.expiryDate)
                                  : "N/A"}
                              </span>
                            </div>
                            <div className="flex justify-between mb-1">
                              <span className="font-medium">Package Size</span>
                              <span>
                                {isDrugProduct
                                  ? `${batch.sizePerPackage || 24}/pack`
                                  : batch.serialNumbers?.length || 0}
                              </span>
                            </div>
                            <div className="flex justify-between mb-1">
                              <span className="font-medium">Available</span>
                              <span className="text-green-600 font-semibold">
                                {batch.availableQuantity} units
                              </span>
                            </div>
                            <div className="flex justify-between mb-1">
                              <span className="font-medium">Manufacturer</span>
                              <span>{batch.manufacturer || "N/A"}</span>
                            </div>
                            <div className="flex justify-between mb-1">
                              <span className="font-medium">Country</span>
                              <span>{batch.manufacturerCountry || "N/A"}</span>
                            </div>
                            <div className="flex justify-between mb-2">
                              <span className="font-medium">Unit Price</span>
                              <span>
                                ${batch.sellingPrice?.toFixed(2) || "120.00"}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 mb-2">
                              <div className="flex justify-between">
                                <span>Total pricing</span>
                                <span className="font-semibold">
                                  $
                                  {(
                                    (batch.sellingPrice || 120) *
                                    (selectedBatches[batch.batchId] || 0)
                                  ).toFixed(2)}
                                </span>
                              </div>
                            </div>
                            <div className="mt-2">
                              <NumberInput
                                value={selectedBatches[batch.batchId] || 0}
                                label="Quantity"
                                onChange={(e) =>
                                  handleBatchQuantityChange(
                                    batch.batchId,
                                    e.target.value
                                  )
                                }
                                min={0}
                                max={batch.availableQuantity}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Add to cart button */}
              <div className="flex space-x-4 pb-5 mt-4">
                <Button
                  onClick={handleAddToCart}
                  disabled={isAddingToCart || totalAvailableQuantity === 0}
                  className={
                    isAddingToCart || totalAvailableQuantity === 0
                      ? "opacity-70 cursor-not-allowed"
                      : ""
                  }
                >
                  {isAddingToCart
                    ? "Adding..."
                    : totalAvailableQuantity === 0
                    ? "Out of Stock"
                    : "Add To Cart"}
                </Button>
                <Button
                  variant="outline"
                  className="px-8"
                  onClick={() => {
                    const params = new URLSearchParams({
                      productId: processedData?.productId || "",
                      sellerId: processedData?.ownerId || "",
                    });

                    router.push(
                      `/medical-supplies/${
                        user.role
                      }/chats?${params.toString()}`
                    );
                  }}
                >
                  Contact
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        <div>
          <RelatedProducts {...relatedProductsProps} />
        </div>
      </div>
    </div>
  );
}
