"use client";
import { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { GET_MY_PRODUCTS, GET_MY_PRODUCTS_WITH_BATCHES } from "../../api/graphql/productQueries"
import { StatCard } from '../../components/ui/Cards';
import { TableCard } from '../../components/ui/Cards';
import AddProductMultiSteps from '../../components/ui/product/AddProductMultiSteps';
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
  const [productType, setProductType] = useState(''); // For filtering by product type
  
  // Pagination
  const ITEMS_PER_PAGE = 10;
  const offset = (productsPage - 1) * ITEMS_PER_PAGE;
  
  // Fetch products from GraphQL API
  const { loading, error, data, refetch } = useQuery(GET_MY_PRODUCTS_WITH_BATCHES, {
    variables: { 
      productType: productType,
      limit: ITEMS_PER_PAGE, 
      offset: offset 
    },
    fetchPolicy: 'cache-and-network',
  });
  
  // Format products data for the table
  const formatProductsData = (products) => {
    console.log("Formatted products data:", products);
    if (!products) return [];
    
    return products.map(product => {
      // Extract the first batch information if available (we'll need a separate query for this in a full implementation)
      // For now, using placeholder data for batch-related fields
      
      // Determine availability based on quantity (simplified logic)
      const availability = product.isActive ? "In-stock" : "Out of stock";
      
      return {
        id: product.productId,
        name: product.name,
        buyingPrice: "$XXX", // This would come from batch information
        quantity: "X Packets", // This would come from batch information
        stockLevel: "X Packets", // This would come from batch information
        closestExpiry: product.__typename === "DrugProduct" ? "XX/XX/XX" : "N/A", // This would come from batch information
        availability: availability,
        category: product.category,
        productType: product.productType,
        // Add more fields as needed for detail view
      };
    });
  };
  console.log("Formatted products data:",data);
  
  const productsData = data ? formatProductsData(data.myProducts) : [];
  const totalCount = data?.myProducts?.length || 0; // In a real implementation, you'd get total count from the API
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE) || 1;
  
  // Category counts - in a real implementation, you'd get these from the API
  const drugCount = data?.myProducts?.filter(p => p.__typename === "DrugProduct").length || 0;
  const equipmentCount = data?.myProducts?.filter(p => p.__typename === "EquipmentProduct").length || 0;
  
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

  return (
    <div className="flex flex-col gap-2">
      <div className="w-full flex gap-4">
        <StatCard
          title="Categories"
          metrics={[
            { value: "Drugs", label: `${drugCount} items` },
            { value: "Equipment", label: `${equipmentCount} items` },
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
            { value: "Active", label: `${productsData.filter(p => p.availability === "In-stock").length} items` },
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
            { value: "N/A", label: "Last 7 days" },
            { value: "$N/A", label: "Revenue" },
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
            { value: "N/A", label: "Below threshold" },
            { value: "N/A", label: "Out of stock" },
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
          <div className="text-center py-10 text-red-500">Error loading products: {error.message}</div>
        ) : (
          <TableCard
            title="Products"
            data={productsData}
            columns={productsColumns}
            page={productsPage}
            totalPages={totalPages}
            onPageChange={(page) => {
              setProductsPage(page);
              refetch({ 
                productType: productType,
                limit: ITEMS_PER_PAGE, 
                offset: (page - 1) * ITEMS_PER_PAGE 
              });
            }}
            onAddItem={() => setIsAddingProduct(true)}
            onFilter={() => setProductType(productType === "DRUG" ? "EQUIPMENT" : productType === "EQUIPMENT" ? null : "DRUG")}
            onDownload={() => {
              // Implement download functionality
              alert("Download functionality will be implemented here");
            }}
            isLoading={loading}
          />
        )}
        {/* add product card */}
        {isAddingProduct && (
          <AddProductMultiSteps
            onClose={() => setIsAddingProduct(false)}
            onSubmit={handleAddProduct}
          />
        )}
      </div>
    </div>
  );
}