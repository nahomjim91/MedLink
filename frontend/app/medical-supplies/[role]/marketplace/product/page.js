"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
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
    fetchPolicy: "network-only",
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
  console.log("Related products:", relatedProducts);

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
  const productId = searchParams.get("id");
  const { data, loading, error, refetch } = useQuery(GET_PRODUCT_BY_ID, {
    variables: { productId },
    skip: !productId, // skip if no ID
  });
  const { user, addToCart, addSpecificBatchToCart, refreshCart } = useMSAuth();
  const [activeTab, setActiveTab] = useState("automatically");
  const [quantity, setQuantity] = useState(1);
  const [selectedBatches, setSelectedBatches] = useState({});
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [cartMessage, setCartMessage] = useState({ type: "", message: "" });

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  if (error)
    return (
      <div className="flex justify-center items-center h-screen text-red-500">
        Error: {error.message}
      </div>
    );
  if (!data || !data.productById)
    return (
      <div className="flex justify-center items-center h-screen">
        Product not found
      </div>
    );

  const product = data.productById;
  const batches = product.batches || [];
  const isDrugProduct = product.__typename === "DrugProduct";
  const isEquipmentProduct = product.__typename === "EquipmentProduct";

  // Sort batches by expiry date for automatic selection (drugs only)
  const sortedBatches = isDrugProduct
    ? [...batches].sort(
        (a, b) => new Date(a.expiryDate) - new Date(b.expiryDate)
      )
    : batches;

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value > 0) {
      setQuantity(value);
    }
  };

  const handleBatchQuantityChange = (batchId, value) => {
    const newQuantity = parseInt(value, 10);
    if (!isNaN(newQuantity) && newQuantity >= 0) {
      setSelectedBatches((prev) => ({
        ...prev,
        [batchId]: newQuantity,
      }));
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSelectedBatches({});
  };

  const handleAddToCart = async () => {
    setIsAddingToCart(true);
    setCartMessage({ type: "", message: "" });

    try {
      if (activeTab === "automatically") {
        // Automatic mode: Distribute quantity across batches starting with the earliest expiry
        let remainingQuantity = quantity;
        let success = false;

        // For drugs with expiry dates, use sorted batches (earliest expiry first)
        // For equipment or when no expiry, use batches as is
        const batchesToUse = isDrugProduct ? sortedBatches : batches;

        // Try to fulfill the order with multiple batch additions if needed
        for (const batch of batchesToUse) {
          if (remainingQuantity <= 0) break;

          // Determine how much we can take from this batch
          const quantityFromBatch = Math.min(remainingQuantity, batch.quantity);

          if (quantityFromBatch > 0) {
            // Add this specific batch to cart
            await addSpecificBatchToCart(
              product.productId,
              batch.batchId,
              quantityFromBatch
            );

            remainingQuantity -= quantityFromBatch;
            success = true;
          }
        }

        if (success) {
          setCartMessage({
            type: "success",
            message: `Added ${quantity - remainingQuantity} items to cart`,
          });

          // If we couldn't fulfill the entire quantity, inform the user
          if (remainingQuantity > 0) {
            setCartMessage({
              type: "warning",
              message: `Added ${
                quantity - remainingQuantity
              } items to cart. Could not add remaining ${remainingQuantity} due to insufficient stock.`,
            });
          }
        } else {
          setCartMessage({
            type: "error",
            message: "Could not add to cart. Insufficient stock available.",
          });
        }
      } else {
        // Manual mode: Add selected batches as specified by user
        const batchSelections = Object.entries(selectedBatches);
        let totalAdded = 0;

        if (batchSelections.length === 0) {
          setCartMessage({
            type: "error",
            message: "Please select quantities for at least one batch",
          });
        } else {
          for (const [batchId, batchQuantity] of batchSelections) {
            if (batchQuantity > 0) {
              await addSpecificBatchToCart(
                product.productId,
                batchId,
                batchQuantity
              );
              totalAdded += batchQuantity;
            }
          }

          setCartMessage({
            type: "success",
            message: `Added ${totalAdded} items to cart from selected batches`,
          });
        }
      }

      // Refresh cart data after all operations
      await refreshCart();
    } catch (error) {
      console.error("Error adding to cart:", error);
      setCartMessage({
        type: "error",
        message: `Error adding to cart: ${error.message}`,
      });
    } finally {
      setIsAddingToCart(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  const getTotalAvailableQuantity = () => {
    return batches.reduce((total, batch) => total + (batch.quantity || 0), 0);
  };

  const InfoRow = ({ label, value }) => (
    <div className="flex flex-col md:flex-row">
      <div className="w-full md:w-1/3">
        <h2 className="text-lg font-semibold text-secondary/80">{label}</h2>
      </div>
      <div className="w-full md:w-2/3">
        <p className="text-secondary/60">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="overflow-hidden mx-auto p-4 bg-white rounded-xl">
      <div className="h-[85vh] overflow-y-scroll w-full">
        {/* Product content */}
        <div className="flex flex-col md:flex-row gap-6 w-full">
          {/* Image Gallery */}
          <div className="w-full md:w-1/3 pl-4">
            <ProductImageGallery
              images={product.imageList || []}
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
                  {product.name} {isDrugProduct && product.concentration}
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
                {/* Category - common for both types */}
                <InfoRow
                  label="Category"
                  value={product.category || "Antibiotics"}
                />

                {/* Conditional rendering based on product type */}
                {isDrugProduct ? (
                  <>
                    <InfoRow
                      label="Package Type"
                      value={product.packageType || "Tablets"}
                    />
                    <InfoRow
                      label="Manufacturer"
                      value={product.batches?.[0]?.manufacturer || "XYZ"}
                    />
                    <InfoRow
                      label="Country"
                      value={
                        product.batches?.[0]?.manufacturerCountry || "China"
                      }
                    />
                  </>
                ) : (
                  <></>
                )}

                {/* Description - common for both types */}
                {/* Equipment-specific fields */}
                {isEquipmentProduct && (
                  <>
                    <InfoRow
                      label="Warranty information"
                      value={product.warrantyInfo || "Three and half year"}
                    />
                    <InfoRow
                      label="Spare Parts"
                      value={product.sparePartInfo.join(", ")}
                    />
                  </>
                )}
                <div className="flex flex-col">
                  <div>
                    <h2 className="text-lg font-bold text-secondary/80">
                      Description:
                    </h2>
                  </div>
                  <div className="mt-2">
                    <p className="text-secondary/60">{product.description}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Purchase section */}
            <div className="mt-3">
              {/* Selection mode tabs for drugs */}
              {isDrugProduct && (
                <div className="flex border-b border-secondary/20 mb-4">
                  <button
                    className={`py-2 px-4 font-semibold ${
                      activeTab === "automatically"
                        ? "border-b-2 border-primary text-primary"
                        : "text-secondary/80"
                    }`}
                    onClick={() => handleTabChange("automatically")}
                  >
                    Automatically
                  </button>
                  <button
                    className={`py-2 px-4 font-semibold ${
                      activeTab === "manually"
                        ? "border-b-2 border-primary text-primary"
                        : "text-secondary/80"
                    }`}
                    onClick={() => handleTabChange("manually")}
                  >
                    Manually
                  </button>
                </div>
              )}

              {/* Cart message feedback */}
              {cartMessage.message && (
                <div
                  className={`mb-4 p-3 rounded-lg ${
                    cartMessage.type === "success"
                      ? "bg-green-100 text-green-800"
                      : cartMessage.type === "warning"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
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
                    label={"Quantity"}
                    onChange={handleQuantityChange}
                    min={1}
                    max={getTotalAvailableQuantity()}
                  />
                </div>
              )}

              {/* Batch selection (manual mode for drugs or equipment) */}
              <div className="w-full px-4">
                {(activeTab === "manually" || isEquipmentProduct) &&
                  batches.length > 0 && (
                    <div className="flex gap-4 overflow-x-auto pb-4 snap-x scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200">
                      {batches.map((batch) => (
                        <div
                          key={batch.batchId}
                          className="flex-shrink-0 bg-background/20 rounded-lg p-3 pb-0 relative shadow-lg hover:shadow-xl w-64 snap-start border border-gray-200"
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
                              <span className="font-medium">Item left</span>
                              <span>{batch.quantity || 5} units</span>
                            </div>
                            <div className="flex justify-between mb-1">
                              <span className="font-medium">Manufacturer</span>
                              <span>{batch.manufacturer || "XYZ MD"}</span>
                            </div>
                            <div className="flex justify-between mb-1">
                              <span className="font-medium">Country</span>
                              <span>
                                {batch.manufacturerCountry || "China"}
                              </span>
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
                                <span>
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
                                label={"Quantity"}
                                onChange={(e) =>
                                  handleBatchQuantityChange(
                                    batch.batchId,
                                    e.target.value
                                  )
                                }
                                min={0}
                                max={batch.quantity}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
              </div>

              {/* Add to cart button */}
              <div className="flex space-x-4 pb-5 mt-4">
                <Button
                  onClick={handleAddToCart}
                  disabled={isAddingToCart}
                  className={
                    isAddingToCart ? "opacity-70 cursor-not-allowed" : ""
                  }
                >
                  {isAddingToCart ? "Adding..." : "Add To Cart"}
                </Button>
                <Button variant="outline" className="px-8">
                  Contact
                </Button>
              </div>
            </div>
          </div>
        </div>
        {/* Related Products */}
        <div>
          <RelatedProducts
            productType={isDrugProduct ? "DRUG" : "EQUIPMENT"}
            currentProductId={product.productId}
            role={user.role}
          />
        </div>
      </div>
    </div>
  );
}
