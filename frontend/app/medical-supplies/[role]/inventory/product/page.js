"use client";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "@apollo/client";
import { GET_PRODUCT_BY_ID } from "../../../api/graphql/product/productQueries";
import {
  UPDATE_DRUG_PRODUCT,
  UPDATE_EQUIPMENT_PRODUCT,
} from "../../../api/graphql/product/productMutations";
import { useMSAuth } from "../../../hooks/useMSAuth";
import { useEffect, useState } from "react";
import { Button } from "../../../components/ui/Button";
import { Check, X, Pen, Plus } from "lucide-react";
import { TextField, LongTextField } from "../../../components/ui/FormField";
import { TableCard } from "../../../components/ui/Cards";
import { EditableImageGallery } from "../../../components/ui/ProductImageGallery";
import AddBatchMultiSteps from "../../../components/ui/product/batch/AddBatchMultiSteps";
import { toast } from "react-hot-toast"; // Make sure to install this package
import { EditableTextAreaField, EditableTextField } from "../../../components/ui/Input";

export default function ProductPage() {
  const searchParams = useSearchParams();
  const productId = searchParams.get("id");
  const { user } = useMSAuth();
  const [isOwner, setIsOwner] = useState(false);
  const [productData, setProductData] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [batchesPage, setBatchesPage] = useState(1);
  const [isAddingBatch, setIsAddingBatch] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProductData, setEditedProductData] = useState(null);
  const [newImages, setNewImages] = useState([]);
  const [removedImages, setRemovedImages] = useState([]);

  // Pagination
  const ITEMS_PER_PAGE = 10;
  const offset = (batchesPage - 1) * ITEMS_PER_PAGE;

  const { data, loading, error, refetch } = useQuery(GET_PRODUCT_BY_ID, {
    variables: { productId },
    skip: !productId, // skip if no ID
  });

  // Mutations for updating products
  const [updateDrugProduct, { loading: updatingDrug }] =
    useMutation(UPDATE_DRUG_PRODUCT);
  const [updateEquipmentProduct, { loading: updatingEquipment }] = useMutation(
    UPDATE_EQUIPMENT_PRODUCT
  );

  useEffect(() => {
    if (loading) return;
    if (!data) return;

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

    setProductData(data.productById);
    setEditedProductData(data.productById);
  }, [user, loading, data]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedProductData({
      ...editedProductData,
      [name]: value,
    });
  };

  const handleSaveChanges = async () => {
    try {
      // Prepare the input object based on product type
      const commonInput = {
        name: editedProductData.name,
        category: editedProductData.category,
        description: editedProductData.description,
      };

      // Handle image list updates
      if (newImages.length > 0 || removedImages.length > 0) {
        // Filter out removed images and add new ones
        commonInput.imageList = [
          ...editedProductData.imageList.filter(
            (img) => !removedImages.includes(img)
          ),
          ...newImages,
        ];
      }
console.log("editedProductData" , editedProductData);
      if (editedProductData.__typename === "DrugProduct") {
        const drugInput = {
          ...commonInput,
          packageType: editedProductData.packageType,
          concentration: editedProductData.concentration,
          requiresPrescription: editedProductData.requiresPrescription,
        };

        const { data } = await updateDrugProduct({
          variables: {
            productId,
            input: drugInput,
          },
        });

        // Update local state with returned data
        setProductData(data.updateDrugProduct);
        setEditedProductData(data.updateDrugProduct);
      } else {
        const equipmentInput = {
          ...commonInput,
          brandName: editedProductData.brandName,
          modelNumber: editedProductData.modelNumber,
          warrantyInfo: editedProductData.warrantyInfo,
          sparePartInfo: editedProductData.sparePartInfo,
        };

        const { data } = await updateEquipmentProduct({
          variables: {
            productId,
            input: equipmentInput,
          },
        });

        // Update local state with returned data
        setProductData(data.updateEquipmentProduct);
        setEditedProductData(data.updateEquipmentProduct);
      }

      // Reset image tracking arrays
      setNewImages([]);
      setRemovedImages([]);

      // Exit edit mode
      setIsEditing(false);

      toast.success("Product updated successfully!");
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error("Failed to update product: " + error.message);
    }
  };

  const handleImageUpload = (imageUrls) => {
    setNewImages([...newImages, ...imageUrls]);
  };

  const handleImageRemove = (imageUrl) => {
    if (editedProductData.imageList.includes(imageUrl)) {
      // If it's an existing image, mark it for removal
      setRemovedImages([...removedImages, imageUrl]);
    } else {
      // If it's a newly added image, remove it from new images
      setNewImages(newImages.filter((img) => img !== imageUrl));
    }
  };

  const handleAddBatch = () => {
    refetch();
    setIsAddingBatch(false);
  };

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

  const allProductsData = productData.batches
    ? formatProductsData(productData.batches, productData.productType)
    : [];
  const totalCount = productData.batches?.length || 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE) || 1;

  return (
    <div className="relative bg-white rounded-lg py-1.5 shadow-sm h-full">
      <div className="flex justify-between p-5">
        <h2 className="text-lg font-semibold text-gray-700">
          {productData.name}
        </h2>
        {!isEditing ? (
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex gap-1 items-center"
              onClick={() => setIsEditing(true)}
            >
              <Pen className="w-4 h-4" />
              Edit
            </Button>
            <Button
              className="flex gap-1 items-center bg-teal-500 text-white hover:bg-teal-600"
              onClick={() => setIsAddingBatch(true)}
            >
              <Plus className="w-4 h-4" />
              Add Batch
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="outline"
              color="error"
              className="flex gap-1 items-center text-red-500 hover:bg-red-50"
              onClick={() => {
                setIsEditing(false);
                setEditedProductData(productData);
                setNewImages([]);
                setRemovedImages([]);
              }}
            >
              <X className="w-4 h-4" />
              Cancel
            </Button>
            <Button
              className="flex gap-1 items-center bg-teal-500 text-white hover:bg-teal-600"
              onClick={handleSaveChanges}
              disabled={updatingDrug || updatingEquipment}
            >
              <Check className="w-4 h-4" />
              {updatingDrug || updatingEquipment ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-3">
          {["Overview", "Batches", "History"].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab.toLowerCase());
                setIsEditing(false);
              }}
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
                {isEditing ? (
                  <>
                    <EditableTextField
                      label="Product name"
                      value={editedProductData.name}
                      name="name"
                      onChange={handleInputChange}
                      required
                    />
                    <TextField label="Product id" value={productId} />
                    <EditableTextField
                      label="Category"
                      value={editedProductData.category}
                      name="category"
                      onChange={handleInputChange}
                    />
                    <EditableTextField
                      label="Package Type"
                      value={editedProductData.packageType}
                      name="packageType"
                      onChange={handleInputChange}
                    />
                    <EditableTextField
                      label="Concentration"
                      value={editedProductData.concentration}
                      name="concentration"
                      onChange={handleInputChange}
                    />
                    <EditableTextAreaField
                      label="Description"
                      value={editedProductData.description}
                      name="description"
                      onChange={handleInputChange}
                    />
                  </>
                ) : (
                  <>
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
                    <LongTextField
                      label="Description"
                      value={productData.description}
                    />
                  </>
                )}
              </div>
            </div>
            <div className="w-1/2 pl-4">
              <EditableImageGallery
                images={editedProductData.imageList || []}
                type={editedProductData.productType}
                isEditing={isEditing}
                onUpload={handleImageUpload}
                onRemove={handleImageRemove}
                removedImages={removedImages}
              />
            </div>
          </div>
        )}

        {activeTab === "batches" && (
          <TableCard
            data={allProductsData}
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
              alert("Download functionality will be implemented here");
            }}
            isLoading={loading}
            isAddButton={false}
            isOrderButton={false}
          />
        )}

        {activeTab === "history" && (
          <div className="p-4">
            <h3 className="text-lg font-medium mb-4">Product History</h3>
            <p>Product history data would appear here.</p>
          </div>
        )}
      </div>

      {isAddingBatch && (
        <AddBatchMultiSteps
          productData={productData}
          productId={productId}
          onClose={handleAddBatch}
        />
      )}
    </div>
  );
}
