"use client";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@apollo/client";
import { GET_PRODUCT_BY_ID } from "../../../api/graphql/productQueries"; // adjust path
import { useMSAuth } from "../../../hooks/useMSAuth";
import { useEffect, useState } from "react";
import { Button } from "../../../components/ui/Button";
import { Pen, Plus } from "lucide-react";
import { TextField } from "../../../components/ui/FormField";
import { TableCard } from "../../../components/ui/Cards";
import { ProductImageGallery } from "../../../components/ui/ProductImageGallery";

export default function ProductPage() {
  const searchParams = useSearchParams();
  const productId = searchParams.get("id");
  const { user } = useMSAuth();
  const [isOwner, setIsOwner] = useState(false);
  const [productData, setProductData] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [batchesPage, setBatchesPage] = useState(1);

  // Pagination
  const ITEMS_PER_PAGE = 10;
  const offset = (batchesPage - 1) * ITEMS_PER_PAGE;

  const { data, loading, error } = useQuery(GET_PRODUCT_BY_ID, {
    variables: { productId },
    skip: !productId, // skip if no ID
  });
  useEffect(() => {
    if (loading) return;

    if (!user) {
      // Not authenticated
      router.push("/medical-supplies/auth/login");
      return;
    }
    if (user.userId === data.productById.ownerId) {
      setIsOwner(true);
    } else {
      setIsOwner(false);
    }
    console.log("product", data.productById);
    console.log("user", user);

    setProductData(data.productById);
  }, [user, loading, data]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error loading product: {error.message}</p>;
  if (!productData) return <p>No product found</p>;
  const batchesColumns = (productType) => {
    return productType === "DrugProduct"
      ? [
          { key: "BatchID", label: "BatchID" },
          { key: "Expiry Date", label: "Expiry Date" },
          { key: "Size Per Package", label: "Size Per Package" },
          { key: "Manufacturer", label: "Manufacturer" },
          { key: "Manufacturer Country", label: "Manufacturer Country" },
          { key: "Added At", label: "Added At" },
          { key: "Buying Price", label: "Buying Price" },
          { key: "Selling Price", label: "Selling Price" },
          { key: "Quantity", label: "Quantity" },
        ]
      : [
          { key: "BatchID", label: "BatchID" },
          { key: "Added At", label: "Added At" },
          { key: "Serial Numbers", label: "Serial Numbers" },
          { key: "Buying Price", label: "Buying Price" },
          { key: "Selling Price", label: "Selling Price" },
          { key: "Quantity", label: "Quantity" },
        ];
  };

  const formatProductsData = (batches, productType) => {
    if (!batches || !Array.isArray(batches)) return [];
  
    return batches.map((batch) => {
      if (productType === "DrugProduct") {
        return {
          BatchID: batch.batchId,
          "Expiry Date": batch.expiryDate,
          "Size Per Package": batch.sizePerPackage,
          Manufacturer: batch.manufacturer,
          "Manufacturer Country": batch.manufacturerCountry,
          "Added At": batch.addedAt,
          "Buying Price": batch.costPrice,
          "Selling Price": batch.sellingPrice,
          Quantity: batch.quantity,
        };
      } else {
        return {
          BatchID: batch.batchId,
          "Added At": batch.addedAt,
          "Serial Numbers": batch.serialNumbers?.join(", ") || "-",
          "Buying Price": batch.costPrice,
          "Selling Price": batch.sellingPrice,
          Quantity: batch.quantity,
        };
      }
    });
  };
  
  const allProductsData = productData.batches ? formatProductsData(productData.batches) : [];
  const totalCount = productData.batches.length || 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE) || 1;

  return (
    <div className="relative bg-white rounded-lg  py-1.5 shadow-sm h-full">
      <div className="flex justify-between p-5">
        <h2 className="text-lg font-semibold text-gray-700">
          {productData.name}
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" className="flex gap-1 items-center">
            <Pen className="w-4 h-4" />
            Edit
          </Button>
          <Button className="flex gap-1 items-center bg-teal-500 text-white hover:bg-teal-600">
            <Plus className="w-4 h-4" />
            Add
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-3">
          {["Overview", "Batches", "History"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase())}
              className={`pb-2 px-1 ${
                activeTab === tab.toLowerCase()
                  ? "border-b-2 border-primary text-primary font-semibold"
                  : "text-secondary/50 hover:text-secondary"
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="py">
        {activeTab === "overview" && (
          <div className="flex px-8 py-4">
            <div className="w-1/2 pr-4">
              <h3 className="text-md font-bold text-secondary mb-4">
                Product Detail
              </h3>
              <div className="space-y-4 px-8">
                <TextField label="Product name" value={productData.name} />
                <TextField label="Product id" value={productId} />
                <TextField label="Category" value={productData.category} />
                <TextField
                  label="Package Type"
                  value={productData.packageType}
                />
                <TextField
                  label="Concentration"
                  value={productData.concentration}
                />
                <TextField
                  label="Description"
                  value={productData.description}
                />
              </div>
            </div>
         <ProductImageGallery images={productData.imageList} type={productData.productType} />
          </div>
        )}

        {activeTab === "batches" && (
            
           <TableCard
           data={allProductsData} // This becomes fallback data
           columns={batchesColumns(productData.productType)}
           limit={ITEMS_PER_PAGE}
           offset={0}
           page={batchesPage}
           totalPages={totalPages}
           onPageChange={(page) => {
             setBatchesPage(page);
             refetch();
           }}
           onAddItem={() => setIsAddingBatch(true)}
           onFilter={() =>
             alert("Filter functionality will be implemented here")
           }
           onDownload={() => {
             // Implement download functionality
             alert("Download functionality will be implemented here");
           }}
           isLoading={loading}
           isAddButton={false}
           isOrderButton={false}
         />
        )}

        {activeTab === "history" && (
         <div className="p-4">
            <h3 className="text-lg font-medium mb-4">Batches Information</h3>
            <p>Batch data would appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
