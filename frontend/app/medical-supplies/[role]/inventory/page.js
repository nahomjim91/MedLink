"use client";
import { useState, useEffect } from "react";
import { useQuery } from "@apollo/client";
import {
  GET_MY_PRODUCTS,
  GET_MY_PRODUCTS_WITH_BATCHES,
} from "../../api/graphql/product/productQueries";
import { StatCard } from "../../components/ui/Cards";
import { TableCard } from "../../components/ui/Cards";
import AddProductMultiSteps from "../../components/ui/product/AddProductMultiSteps";
import { useRouter } from "next/navigation";
import { useMSAuth } from "../../hooks/useMSAuth";
// import icons from '../lib/icons';

const icons = {
  categories: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="3" y="3" width="7" height="7" rx="1"></rect>
  <rect x="14" y="3" width="7" height="7" rx="1"></rect>
  <rect x="3" y="14" width="7" height="7" rx="1"></rect>
  <rect x="14" y="14" width="7" height="7" rx="1"></rect>
</svg>`,

  // Top Product Icon - star with product box
  topProduct: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2z"></path>
  <rect x="8" y="10" width="8" height="8" rx="1" stroke-dasharray="2"></rect>
</svg>`,

  // Top Selling Icon - upward trending chart with dollar sign
  topSelling: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M22 12L18 8L15 11L9 5L2 12"></path>
  <path d="M9 5L9 19"></path>
  <circle cx="9" cy="19" r="2"></circle>
  <path d="M14.5 14.5C14.5 12 16.5 11 16.5 11C16.5 11 18.5 12 18.5 14.5C18.5 17 16.5 18 16.5 18C16.5 18 14.5 17 14.5 14.5Z"></path>
  <path d="M16.5 13V16"></path>
  <path d="M15 14.5H18"></path>
</svg>`,

  // Low Stock Icon - depleted inventory with warning
  lowStock: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M4 20H20"></path>
  <rect x="5" y="14" width="4" height="6"></rect>
  <rect x="15" y="16" width="4" height="4"></rect>
  <rect x="10" y="12" width="4" height="8"></rect>
  <path d="M12 7V9"></path>
  <path d="M12 3V5"></path>
</svg>`,
};

export default function InventoryPage() {
  const [productsPage, setProductsPage] = useState(1);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [productType, setProductType] = useState(""); // For filtering by product type
  const [activeTab, setActiveTab] = useState("all"); // Default active tab
  const router = useRouter();
  const {user} = useMSAuth();
  const role = user.role;

  // Pagination
  const ITEMS_PER_PAGE = 10;
  const offset = (productsPage - 1) * ITEMS_PER_PAGE;

  // Fetch products from GraphQL API
  const { loading, error, data, refetch } = useQuery(
    GET_MY_PRODUCTS_WITH_BATCHES,
    {
      variables: {
        productType: productType,
        limit: ITEMS_PER_PAGE,
        offset: offset,
      },
      fetchPolicy: "cache-and-network",
    }
  );

  // Helper function to format currency
  const formatCurrency = (amount) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Find closest expiry batch for a product
  const getClosestExpiryBatch = (batches) => {
    if (!batches || batches.length === 0) return null;

    // Filter out batches without expiry dates
    const batchesWithExpiry = batches.filter(
      (batch) => batch.__typename === "DrugBatch" && batch.expiryDate
    );

    if (batchesWithExpiry.length === 0) return null;

    // Sort by expiry date (ascending)
    return batchesWithExpiry.sort(
      (a, b) => new Date(a.expiryDate) - new Date(b.expiryDate)
    )[0];
  };

  // Calculate total quantity across all batches for a product
  const calculateTotalQuantity = (batches) => {
    if (!batches || batches.length === 0) return 0;
    return batches.reduce((sum, batch) => sum + (batch.quantity || 0), 0);
  };

  // Determine stock level status
  const getStockLevelStatus = (quantity) => {
    // Define thresholds based on your business logic
    if (quantity <= 0) return "Out of stock";
    if (quantity < 5) return "Low stock";
    if (quantity < 10) return "Medium stock";
    return "High stock";
  };

  // Format products data for the table
  const formatProductsData = (products) => {
    if (!products) return [];

    return products.map((product) => {
      const totalQuantity = calculateTotalQuantity(product.batches);
      const closestExpiryBatch = getClosestExpiryBatch(product.batches);
      const stockLevel = getStockLevelStatus(totalQuantity);

      // Get the first batch's cost price for buying price
      const firstBatch =
        product.batches && product.batches.length > 0
          ? product.batches[0]
          : null;
      const buyingPrice = firstBatch
        ? formatCurrency(firstBatch.costPrice)
        : "N/A";

      // Format expiry date
      const closestExpiry = closestExpiryBatch
        ? formatDate(closestExpiryBatch.expiryDate)
        : product.__typename === "DrugProduct"
        ? "No expiry data"
        : "N/A";

      // Determine availability based on quantity and isActive
      const availability =
        product.isActive && totalQuantity > 0 ? "In-stock" : "Out of stock";

      return {
        id: product.productId,
        name: product.name,
        buyingPrice: buyingPrice,
        quantity: `${totalQuantity} ${
          product.__typename === "DrugProduct" ? "Units" : "Items"
        }`,
        stockLevel: stockLevel,
        closestExpiry: closestExpiry,
        availability: availability,
        category: product.category,
        productType: product.productType,
      };
    });
  };

  const allProductsData = data ? formatProductsData(data.myProducts) : [];
  const totalCount = data?.myProducts?.length || 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE) || 1;

  // Prepare data for tabs
  const prepareTabData = () => {
    if (!allProductsData) return {};

    // All products tab (unfiltered)
    const all = allProductsData;

    // In stock products
    const inStock = allProductsData.filter(
      (product) => product.availability === "In-stock"
    );

    // Out of stock products
    const outOfStock = allProductsData.filter(
      (product) => product.availability === "Out of stock"
    );

    // Low stock products
    const lowStock = allProductsData.filter(
      (product) => product.stockLevel === "Low stock"
    );

    // Drug products
    const drugs = allProductsData.filter(
      (product) => product.productType === "DRUG"
    );

    // Equipment products
    const equipment = allProductsData.filter(
      (product) => product.productType === "EQUIPMENT"
    );

    return {
      all,
      inStock,
      outOfStock,
      lowStock,
      drugs,
      equipment,
    };
  };

  const tabData = prepareTabData();

  // Calculate stats for cards
  const calculateStats = () => {
    if (!data || !data.myProducts)
      return {
        drugCount: 0,
        equipmentCount: 0,
        activeCount: 0,
        lowStockCount: 0,
        outOfStockCount: 0,
        topSellingProduct: "N/A",
        topSellingRevenue: "N/A",
      };

    const formattedProducts = formatProductsData(data.myProducts);

    return {
      drugCount: data.myProducts.filter((p) => p.__typename === "DrugProduct")
        .length,
      equipmentCount: data.myProducts.filter(
        (p) => p.__typename === "EquipmentProduct"
      ).length,
      activeCount: formattedProducts.filter(
        (p) => p.availability === "In-stock"
      ).length,
      lowStockCount: formattedProducts.filter(
        (p) => p.stockLevel === "Low stock"
      ).length,
      outOfStockCount: formattedProducts.filter(
        (p) => p.availability === "Out of stock"
      ).length,
      // Placeholder for top selling - would need sales data
      topSellingProduct: "N/A",
      topSellingRevenue: "N/A",
    };
  };

  const stats = calculateStats();

  // Define table tabs
  const productTabs = [
    { id: "all", label: "All Products", count: tabData.all?.length || 0 },
    { id: "inStock", label: "In Stock", count: tabData.inStock?.length || 0 },
    {
      id: "outOfStock",
      label: "Out of Stock",
      count: tabData.outOfStock?.length || 0,
    },
    {
      id: "lowStock",
      label: "Low Stock",
      count: tabData.lowStock?.length || 0,
    },
    { id: "drugs", label: "Drugs", count: tabData.drugs?.length || 0 },
    {
      id: "equipment",
      label: "Equipment",
      count: tabData.equipment?.length || 0,
    },
  ];

  const productsColumns = [
    { key: "name", label: "Products" },
    { key: "category", label: "Category" },
    { key: "buyingPrice", label: "Buying Price" },
    { key: "quantity", label: "Quantity" },
    { key: "stockLevel", label: "Stock Level" },
    { key: "closestExpiry", label: "Closest Expiry" },
    { key: "availability", label: "Availability" },
  ];

  // Handle product type filter
  const handleFilter = (type) => {
    setProductType(type);
    setProductsPage(1); // Reset to first page when filtering
    refetch({ productType: type, limit: ITEMS_PER_PAGE, offset: 0 });
  };

  // Handle product add form submission
  const handleAddProduct = (newProduct) => {
    // In a real implementation, you'd call a mutation to add the product
    // Then refetch to update the list
    refetch();
    setIsAddingProduct(false);
  };

  // Handle tab change
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setProductsPage(1); // Reset to first page when changing tabs
  };

  const onClikeRow = (product) => {
    // console.log("Product clicked:", product);
  router.push(`/medical-supplies/${role}/inventory/product?id=${product.id}`);
  };


  return (
    <div className="flex flex-col gap-2">
      <div className="w-full flex gap-4">
        <StatCard
          title="Categories"
          metrics={[
            { value: "Drugs", label: `${stats.drugCount} items` },
            { value: "Equipment", label: `${stats.equipmentCount} items` },
          ]}
          icon={
            <div
              dangerouslySetInnerHTML={{ __html: icons.categories }}
              className="text-primary"
            />
          }
          subtitle="Product Categories"
        />

        <StatCard
          title="Total Products"
          metrics={[
            { value: totalCount.toString(), label: "All Products" },
            { value: "Active", label: `${stats.activeCount} items` },
          ]}
          icon={
            <div
              dangerouslySetInnerHTML={{ __html: icons.topProduct }}
              className="text-primary"
            />
          }
        />

        <StatCard
          title="Top Selling"
          metrics={[
            { value: 2, label: "Last 7 days" },
            { value: 1, label: "Revenue" },
          ]}
          icon={
            <div
              dangerouslySetInnerHTML={{ __html: icons.topSelling }}
              className="text-primary"
            />
          }
        />

        <StatCard
          title="Low Stocks"
          metrics={[
            { value: stats.lowStockCount.toString(), label: "Below threshold" },
            { value: stats.outOfStockCount.toString(), label: "Out of stock" },
          ]}
          icon={
            <div
              dangerouslySetInnerHTML={{ __html: icons.lowStock }}
              className="text-primary"
            />
          }
        />
      </div>
      <div className="w-full">
        {loading ? (
          <div className="text-center py-10">Loading products...</div>
        ) : error ? (
          <div className="text-center py-10 text-red-500">
            Error loading products: {error.message}
          </div>
        ) : (
          <TableCard
            title="Products"
            data={allProductsData} // This becomes fallback data
            columns={productsColumns}
            page={productsPage}
            totalPages={totalPages}
            onPageChange={(page) => {
              setProductsPage(page);
              refetch({
                productType: productType,
                limit: ITEMS_PER_PAGE,
                offset: (page - 1) * ITEMS_PER_PAGE,
              });
            }}
            onAddItem={() => setIsAddingProduct(true)}
            onFilter={() =>
              setProductType(
                productType === "DRUG"
                  ? "EQUIPMENT"
                  : productType === "EQUIPMENT"
                  ? null
                  : "DRUG"
              )
            }
            onDownload={() => {
             router.push(`/medical-supplies/${role}/orders`);
            }}
            isLoading={loading}
            // New tab properties
            tabs={productTabs}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            tabData={tabData}
            isClickable={true}
            onClickRow={onClikeRow}
            isFilterButton={false}
          />
        )}
        {/* add product card */}
        {isAddingProduct && (
          <AddProductMultiSteps
            onClose={handleAddProduct}
          />
        )}
      </div>
    </div>
  );
}
