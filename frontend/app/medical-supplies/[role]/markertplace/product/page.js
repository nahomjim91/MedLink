"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@apollo/client";
import { GET_PRODUCT_BY_ID } from "../../../api/graphql/productQueries";
import { useMSAuth } from "../../../hooks/useMSAuth";
import { ProductImageGallery } from "../../../components/ui/ProductImageGallery";
import {
  LongTextField,
  Rating,
  TextField,
} from "../../../components/ui/FormField";
import { NumberInput } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";

export default function ProductDetails() {
  const searchParams = useSearchParams();
  const productId = searchParams.get("id");
  const { data, loading, error, refetch } = useQuery(GET_PRODUCT_BY_ID, {
    variables: { productId },
    skip: !productId, // skip if no ID
  });
  const { user } = useMSAuth();
  const [activeTab, setActiveTab] = useState("automatically");
  const [quantity, setQuantity] = useState(1);
  const [selectedBatches, setSelectedBatches] = useState({});

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

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSelectedBatches({});
  };

  const handleBatchSelection = (batchId, quantity) => {
    setSelectedBatches((prev) => ({
      ...prev,
      [batchId]: quantity,
    }));
  };

  const handleAddToCart = () => {
    // Implement add to cart logic
    console.log("Adding to cart:", {
      productId: product.productId,
      quantity,
      selectedBatches: activeTab === "automatically" ? {} : selectedBatches,
    });
    // Call your add to cart mutation here
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
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
            <div className="max-w-4xl mx-auto px-6  rounded-lg">
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
                  <>
                    <InfoRow
                      label="Brand Name"
                      value={product.brandName || "MediPlus"}
                    />
                    <InfoRow
                      label="Model Number"
                      value={product.modelNumber || "MP-2023"}
                    />
                    <InfoRow
                      label="Manufactured"
                      value={product.manufacturedDate || "20/20/2023"}
                    />
                  </>
                )}

                {/* Description - common for both types */}
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

                {/* Equipment-specific fields */}
                {isEquipmentProduct && (
                  <>
                    <InfoRow
                      label="Warranty information"
                      value={product.warrantyInfo || "Three and half year"}
                    />
                    <InfoRow
                      label="Spare Parts"
                      value={(product.sparePartInfo || ["Handle", "Base"]).join(
                        ", "
                      )}
                    />
                  </>
                )}
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
              {/* Quantity selector */}
              {activeTab !== "manually" && (
                <div className="w-1/3">
                  <NumberInput
                    value={quantity}
                    label={"Quantity"}
                    onChange={handleQuantityChange}
                    min={1}
                    max={product.batches
                      .map((batch) => batch.quantity)
                      .reduce((a, b) => a + b, 0)}
                  />
                </div>
              )}

              {/* Batch selection (manual mode for drugs or equipment) */}
              <div className="w-full px-4">
                {/* <h2 className="text-xl font-bold">Available Batches</h2> */}
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
                              <div>Total pricing</div>
                              <div>
                                $
                                {(
                                  (batch.sellingPrice || 120) *
                                  (selectedBatches[batch.batchId] || 0)
                                ).toFixed(2)}
                              </div>
                            </div>
                            <div className="mt-2">
                              <NumberInput
                                value={quantity}
                                label={"Quantity"}
                                onChange={handleQuantityChange}
                                min={1}
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
              <div className="flex space-x-4 pb-5">
                <Button
                  onClick={handleAddToCart}
                >
                  Add To Cart
                </Button>
                <Button variant="outline" className="px-8">
                  Contact
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
