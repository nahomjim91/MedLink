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
} from "lucide-react";
import { useQuery } from "@apollo/client";
import { SEARCH_PRODUCTS } from "../../api/graphql/product/productQueries";
import Image from "next/image";
import { Button } from "../../components/ui/Button";
import { SelectInput } from "../../components/ui/Input";
import { useRouter } from "next/navigation";

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
  const searchInput = useMemo(() => ({
    searchTerm: debouncedSearchTerm,
    productType: productType || null,
    category: category || null,
    expiryDateStart: expiryDateStart || null,
    expiryDateEnd: expiryDateEnd || null,
    sortBy: sortBy || null,
    sortOrder: sortOrder || null,
    limit: 50,
    offset: 0,
  }), [
    debouncedSearchTerm,
    productType,
    category,
    expiryDateStart,
    expiryDateEnd,
    sortBy,
    sortOrder
  ]);

  // GraphQL query
  const { loading, error, data } = useQuery(SEARCH_PRODUCTS, {
    variables: { searchInput },
    fetchPolicy: "network-only",
  });
  
  const products = data?.searchProducts || [];

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
 
  const handleProductClick = useCallback((product) => {
    router.push(`/marketplace/product?id=${product.productId}`);
  }, [router]);

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
    const isEquipment = product.productType === "EQUIPMENT";
    const ProductIcon = isEquipment ? Syringe : Pill;
    
    return (
      <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100">
        <div className="h-32 bg-gray-100 flex items-center justify-center">
          {product.imageList && product.imageList.length > 0 ? (
            <Image
              src={product.imageList[0]}
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
          <h3 className="font-medium text-secondary/80">{product.name}</h3>
          <div className="flex justify-between items-center mt-1">
            <p className="font-bold text-secondary">
              ${productPrice ? productPrice.toFixed(2) : '0.00'}
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
          <Button 
            className="mt-3 w-full py-2 px-4 flex items-center justify-center gap-3" 
            onClick={() => handleProductClick(product)}
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
  const FilterPanel = React.memo(() => (
    <div
      className={`bg-white rounded-lg p-4 shadow-md mb-6 transition-all duration-300 ${
        showFilters ? "block absolute right-40 left-40 z-10" : "hidden"
      }`}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium text-lg">Filters</h3>
        <button
          onClick={() => setShowFilters(false)}
          className="text-secondary hover:text-error transition-colors"
        >
          <X size={18} />
        </button>
      </div>
  
      <div className="flex flex-col gap-4">
        {/* Product Type & Category Filters */}
        <div className="w-full flex flex-col md:flex-row gap-4">
          <SelectInput
            label="Product Type"
            name="productType"
            value={filters.productType}
            onChange={(e) => handleFilterChange("productType", e.target.value)}
            options={[
              { value: "", label: "All Products" },
              { value: "DRUG", label: "Drugs" },
              { value: "EQUIPMENT", label: "Equipment" }
            ]}
            placeholder="Select product type"
            className="flex-grow"
            defaultToFirstOption={false}
          />
  
          <SelectInput
            label="Category"
            name="category"
            value={filters.category}
            onChange={(e) => handleFilterChange("category", e.target.value)}
            options={[
              { value: "", label: "All Categories" },
              ...categories.map(category => ({
                value: category,
                label: category
              }))
            ]}
            placeholder="Select category"
            className="flex-grow"
            defaultToFirstOption={false}
          />
        </div>
  
        {/* Sort By Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sort By
          </label>
          <div className="flex gap-2">
            <SelectInput
              name="sortBy"
              value={filters.sortBy}
              onChange={(e) => handleFilterChange("sortBy", e.target.value)}
              options={[
                { value: "name", label: "Name" },
                { value: "createdAt", label: "Newest"},
                { value: "category", label: "Category" }
              ]}
              className="flex-grow"
              defaultToFirstOption={false}
            />
            <SelectInput
              name="sortOrder"
              value={filters.sortOrder}
              onChange={(e) => handleFilterChange("sortOrder", e.target.value)}
              options={[
                { value: "asc", label: "Ascending" },
                { value: "desc", label: "Descending" }
              ]}
              className="w-36"
              defaultToFirstOption={false}
            />
          </div>
        </div>
  
        {/* Date Range Filters (for expiry date) - Only shown for DRUG products */}
        {filters.productType === "DRUG" && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Expiry Date Range
            </label>
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-gray-500" />
              <input
                type="date"
                value={filters.expiryDateStart || ""}
                onChange={(e) =>
                  handleFilterChange("expiryDateStart", e.target.value)
                }
                className="flex-grow p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="From"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={filters.expiryDateEnd || ""}
                onChange={(e) =>
                  handleFilterChange("expiryDateEnd", e.target.value)
                }
                className="flex-grow p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="To"
              />
            </div>
          </div>
        )}
  
        {/* Clear Filters Button */}
        <div className="pt-2">
          <button
            onClick={clearFilters}
            className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      </div>
    </div>
  ));
  FilterPanel.displayName = "FilterPanel";

  return (
    <div className="relative overflow-hidden mx-auto p-4 bg-white rounded-xl">
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
          <Button>Check Out</Button>
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
        <div className="h-[70vh] overflow-y-scroll">
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