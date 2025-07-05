"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search,
  Filter,
  ChevronDown,
  Syringe,
  Pill,
  Star,
  X,
  Calendar,
  ShoppingBag,
  Package,
  MapPin,
} from "lucide-react";
import { useQuery } from "@apollo/client";
import { SEARCH_PRODUCTS } from "../../api/graphql/product/productQueries";
import Image from "next/image";
import { Button } from "../../components/ui/Button";
import { SelectInput } from "../../components/ui/Input";
import { useRouter } from "next/navigation";
import { useMSAuth } from "../../hooks/useMSAuth";

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Sample categories based on schema
const categories = [
  "Respiratory",
  "Protection",
  "Hygiene",
  "Mobility",
  "Furniture",
  "Diagnostic",
  "Surgery",
  "Monitoring",
  "Emergency",
  "Pain Relief",
  "Antibiotics",
  "Cardiovascular",
];

const Marketplace = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();
  const { user } = useMSAuth();

  // Initialize filters with a stable object to prevent recreation
  const [filters, setFilters] = useState(() => ({
    productType: "",
    category: "",
    expiryDateStart: null,
    expiryDateEnd: null,
    sortBy: "name",
    sortOrder: "asc",
  }));

  const [showFilters, setShowFilters] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Destructure filters for stable dependencies
  const {
    productType,
    category,
    expiryDateStart,
    expiryDateEnd,
    sortBy,
    sortOrder,
  } = filters;

  // Configure search parameters for GraphQL query using useMemo
  const searchInput = useMemo(
    () => ({
      searchTerm: debouncedSearchTerm,
      productType: productType || null,
      category: category || null,
      expiryDateStart: expiryDateStart || null,
      expiryDateEnd: expiryDateEnd || null,
      sortByDistance: true,

      sortBy: sortBy || null,
      sortOrder: sortOrder || null,
      limit: 50,
      offset: 0,
    }),
    [
      debouncedSearchTerm,
      productType,
      category,
      expiryDateStart,
      expiryDateEnd,
      sortBy,
      sortOrder,
    ]
  );

  // GraphQL query
  const { loading, error, data } = useQuery(SEARCH_PRODUCTS, {
    variables: { searchInput },
    fetchPolicy: "network-only",
  });

  const products = data?.searchProducts || [];
  console.log("Products:", products);

  // Handle search input change
  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  // Use useCallback to prevent unnecessary re-renders
  const handleFilterChange = useCallback((name, value) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const handleProductClick = useCallback(
    (product) => {
      router.push(
        `/medical-supplies/${user.role}/marketplace/product?id=${product.productId}`
      );
    },
    [router]
  );

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({
      productType: "",
      category: "",
      expiryDateStart: null,
      expiryDateEnd: null,
      sortBy: "name",
      sortOrder: "asc",
    });
    setSearchTerm("");
  }, []);

  // Product card component
  const ProductCard = React.memo(({ product }) => {
    const productPrice =
      product.batches && product.batches[0]
        ? product.batches[0].sellingPrice
        : 0;
    const isOutStock = product.batches.every((batch) => batch.quantity === 0);
    const isEquipment = product.productType === "EQUIPMENT";
    const ProductIcon = isEquipment ? Syringe : Pill;

    // Helper function to format distance display
    const formatDistance = (distance, distanceText) => {
      if (distance === null || distance === undefined) {
        return null;
      }
      // You can choose to show either the number or the text
      // Option 1: Show just the number with "km"
      if (distance < 1) {
        return `${Math.round(distance * 1000)}m`;
      }
      return `${distance}km`;

      // Option 2: Show the full text (uncomment this instead)
      // return distanceText;
    };

    return (
      <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100 relative">
        {/* Out of Stock Badge */}
        {isOutStock && (
          <div className="absolute top-2 left-2 z-10">
            <span className="bg-red-500 text-white text-xs font-medium px-2 py-1 rounded-full">
              Out of Stock
            </span>
          </div>
        )}

        {/* Distance Badge */}
        {formatDistance(product.distance, product.distanceText) && (
          <div className="absolute top-2 right-2 z-10">
            <span className="bg-primary text-white text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1">
              <MapPin size={10} />
              {formatDistance(product.distance, product.distanceText)}
            </span>
          </div>
        )}

        <div className={`h-32 bg-gray-100 flex items-center justify-center`}>
          {product.imageList && product.imageList.length > 0 ? (
            <Image
              src={
                product.imageList[0] === "Untitled.jpeg"
                  ? "/image/Untitled.jpeg"
                  : process.env.NEXT_PUBLIC_MEDICAL_SUPPLIES_API_URL +
                    product.imageList[0]
              }
              alt={product.name}
              className="h-full w-full object-contain"
              width={400}
              height={400}
            />
          ) : (
            <ProductIcon size={64} className="text-primary" />
          )}
        </div>

        <div className="p-4">
          <h3 className={`font-mediumtext-secondary/80`}>{product.name}</h3>

          <div className="flex justify-between items-center mt-1">
            <p className={`font-boldtext-secondary`}>
              ${productPrice ? productPrice.toFixed(2) : "0.00"}
            </p>
            {product.rating && (
              <div className="flex items-center">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="ml-1 text-sm text-secondary/60">
                  {product.rating}
                </span>
              </div>
            )}
          </div>

          {/* Distance info in the card body (alternative placement) */}
          {formatDistance(product.distance, product.distanceText) && (
            <div className="flex items-center gap-1 mt-2 text-sm text-gray-500">
              <MapPin size={12} className="text-primary" />
              <span>
                {formatDistance(product.distance, product.distanceText)} away
              </span>
            </div>
          )}

          <Button
            className={`mt-3 w-full py-2 px-4 flex items-center justify-center gap-3 `}
            onClick={() => handleProductClick(product)}
            // disabled={isOutStock}
          >
            See Detail
            <ShoppingBag size={16} className="mr-2" />
          </Button>
        </div>
      </div>
    );
  });

  ProductCard.displayName = "ProductCard";

  // Filter panel component
  // Filter panel component - Replace the existing FilterPanel component with this improved version
  const FilterPanel = React.memo(() => {
    if (!showFilters) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <Filter size={20} className="text-primary" />
                Filter Products
              </h3>
              <button
                onClick={() => setShowFilters(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
          </div>

          {/* Filter Content */}
          <div className="p-6 space-y-6">
            {/* Product Type & Category Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Product Type
                </label>
                <SelectInput
                  name="productType"
                  value={filters.productType}
                  onChange={(e) =>
                    handleFilterChange("productType", e.target.value)
                  }
                  options={[
                    { value: "", label: "All Products" },
                    { value: "DRUG", label: "Drugs" },
                    { value: "EQUIPMENT", label: "Equipment" },
                  ]}
                  placeholder="Select product type"
                  className="w-full"
                  defaultToFirstOption={false}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Category
                </label>
                <SelectInput
                  name="category"
                  value={filters.category}
                  onChange={(e) =>
                    handleFilterChange("category", e.target.value)
                  }
                  options={[
                    { value: "", label: "All Categories" },
                    ...categories.map((category) => ({
                      value: category,
                      label: category,
                    })),
                  ]}
                  placeholder="Select category"
                  className="w-full"
                  defaultToFirstOption={false}
                />
              </div>
            </div>

            {/* Sort Options */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Package size={16} className="text-primary" />
                Sort Options
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-600">
                    Sort By
                  </label>
                  <SelectInput
                    name="sortBy"
                    value={filters.sortBy}
                    onChange={(e) =>
                      handleFilterChange("sortBy", e.target.value)
                    }
                    options={[
                      { value: "name", label: "Name" },
                      { value: "createdAt", label: "Newest" },
                      { value: "category", label: "Category" },
                    ]}
                    className="w-full"
                    defaultToFirstOption={false}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-600">
                    Order
                  </label>
                  <SelectInput
                    name="sortOrder"
                    value={filters.sortOrder}
                    onChange={(e) =>
                      handleFilterChange("sortOrder", e.target.value)
                    }
                    options={[
                      { value: "asc", label: "Ascending" },
                      { value: "desc", label: "Descending" },
                    ]}
                    className="w-full"
                    defaultToFirstOption={false}
                  />
                </div>
              </div>
            </div>

            {/* Date Range Filters - Only shown for DRUG products */}
            {filters.productType === "DRUG" && (
              <div className="space-y-4 border-t pt-4">
                <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Calendar size={16} className="text-primary" />
                  Expiry Date Range
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-gray-600">
                      From Date
                    </label>
                    <input
                      type="date"
                      value={filters.expiryDateStart || ""}
                      onChange={(e) =>
                        handleFilterChange("expiryDateStart", e.target.value)
                      }
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-gray-600">
                      To Date
                    </label>
                    <input
                      type="date"
                      value={filters.expiryDateEnd || ""}
                      onChange={(e) =>
                        handleFilterChange("expiryDateEnd", e.target.value)
                      }
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Active Filters Display */}
            {(filters.productType ||
              filters.category ||
              filters.expiryDateStart ||
              filters.expiryDateEnd) && (
              <div className="space-y-3 border-t pt-4">
                <h4 className="text-sm font-medium text-gray-700">
                  Active Filters
                </h4>
                <div className="flex flex-wrap gap-2">
                  {filters.productType && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                      Type: {filters.productType}
                      <button
                        onClick={() => handleFilterChange("productType", "")}
                        className="ml-1 hover:text-primary/80"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  )}
                  {filters.category && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                      Category: {filters.category}
                      <button
                        onClick={() => handleFilterChange("category", "")}
                        className="ml-1 hover:text-primary/80"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  )}
                  {filters.expiryDateStart && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                      From: {filters.expiryDateStart}
                      <button
                        onClick={() =>
                          handleFilterChange("expiryDateStart", null)
                        }
                        className="ml-1 hover:text-primary/80"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  )}
                  {filters.expiryDateEnd && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                      To: {filters.expiryDateEnd}
                      <button
                        onClick={() =>
                          handleFilterChange("expiryDateEnd", null)
                        }
                        className="ml-1 hover:text-primary/80"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer with Actions */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-xl">
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-between">
              <button
                onClick={clearFilters}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <X size={16} />
                Clear All Filters
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="flex items-center justify-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                Apply Filters
                <Filter size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  });
  FilterPanel.displayName = "FilterPanel";

  return (
    <div className="relative overflow-hidden h-[89vh] mx-auto p-4 bg-white rounded-xl">
      {/* Search and Filter Bar */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-primary/70" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search Anything..."
            className="pl-10 pr-4 py-2 w-full bg-background/50 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-full hover:bg-gray-50 md:w-auto"
          >
            <Filter size={16} />
            <span>Filters</span>
            <ChevronDown
              size={16}
              className={`transition-transform ${
                showFilters ? "rotate-180" : ""
              }`}
            />
          </Button>
        </div>
      </div>

      {/* Filter Panel */}
      <FilterPanel />

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading products...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-12">
          <div className="text-red-500 mb-4">Error loading products</div>
          <p className="text-gray-500">{error.message}</p>
        </div>
      )}

      {/* Products Grid */}
      {!loading && !error && products.length > 0 && (
        <div className="h-[75vh] overflow-y-scroll scrollbar-hide">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {products.map((product) => (
              <ProductCard key={product.productId} product={product} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && products.length === 0 && (
        <div className="text-center py-12">
          <Syringe size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-medium text-gray-700 mb-2">
            No products found
          </h3>
          <p className="text-gray-500">
            Try adjusting your search or filter criteria
          </p>
          <button
            onClick={clearFilters}
            className="mt-4 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-md hover:bg-emerald-200 transition-colors"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
};

export default Marketplace;
