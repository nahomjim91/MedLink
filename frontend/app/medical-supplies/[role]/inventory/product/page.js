"use client";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "@apollo/client";
import { GET_PRODUCT_BY_ID } from "../../../api/graphql/product/productQueries";
import {
  UPDATE_DRUG_BATCH,
  UPDATE_DRUG_PRODUCT,
  UPDATE_EQUIPMENT_BATCH,
  UPDATE_EQUIPMENT_PRODUCT,
  DELETE_PRODUCT,
} from "../../../api/graphql/product/productMutations";
import { useMSAuth } from "../../../hooks/useMSAuth";
import { useEffect, useState } from "react";
import { Button } from "../../../components/ui/Button";
import { Check, X, Pen, Plus, Trash2 } from "lucide-react";
import { TextField, LongTextField } from "../../../components/ui/FormField";
import { TableCard } from "../../../components/ui/Cards";
import { EditableImageGallery } from "../../../components/ui/ProductImageGallery";
import AddBatchMultiSteps from "../../../components/ui/product/batch/AddBatchMultiSteps";
import { toast } from "react-hot-toast"; // Make sure to install this package
import {
  EditableTextAreaField,
  EditableTextField,
} from "../../../components/ui/Input";
import { useRouter } from "next/navigation";
import { ConfirmationModal } from "../../../components/modal/ConfirmationModal";

export default function ProductPage() {
  const searchParams = useSearchParams();
  const productId = searchParams.get("id");
  const { user } = useMSAuth();
  const [productData, setProductData] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [batchesPage, setBatchesPage] = useState(1);
  const [isAddingBatch, setIsAddingBatch] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProductData, setEditedProductData] = useState(null);
  const [newImages, setNewImages] = useState([]);
  const [removedImages, setRemovedImages] = useState([]);
  const [editingBatchId, setEditingBatchId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const router = useRouter();

  // Pagination
  const ITEMS_PER_PAGE = 10;
  const offset = (batchesPage - 1) * ITEMS_PER_PAGE;

  const { data, loading, error, refetch } = useQuery(GET_PRODUCT_BY_ID, {
    variables: { productId },
    skip: !productId,
    fetchPolicy: "cache-and-network",
  });

  // Mutations for updating products
  const [updateDrugProduct, { loading: updatingDrug }] =
    useMutation(UPDATE_DRUG_PRODUCT);
  const [updateEquipmentProduct, { loading: updatingEquipment }] = useMutation(
    UPDATE_EQUIPMENT_PRODUCT
  );
  const [updateDrugBatch] = useMutation(UPDATE_DRUG_BATCH);
  const [updateEquipmentBatch] = useMutation(UPDATE_EQUIPMENT_BATCH);
  const [deleteProduct, { loading: deletingProduct }] =
    useMutation(DELETE_PRODUCT);

  useEffect(() => {
    if (loading) return;
    if (!data) return;

    if (!user) {
      // Not authenticated
      router.push("/medical-supplies/auth/login");
      return;
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

      if (
        editedProductData.__typename === "DrugProduct" ||
        editedProductData.productType === "DRUG"
      ) {
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

  const handleBatchUpdate = async (batch, field, value) => {
    try {
      const updates = {
        [field]: parseFloat(value) || value,
      };

      if (productData.productType === "DRUG") {
        await updateDrugBatch({
          variables: {
            batchId: batch.BatchID,
            input: {
              quantity: updates["Quantity"],
              costPrice: updates["Cost Price"],
              sellingPrice: updates["Selling Price"],
            },
          },
        });
      } else {
        await updateEquipmentBatch({
          variables: {
            batchId: batch.BatchID,
            input: {
              quantity: updates["Quantity"],
              costPrice: updates["Cost Price"],
              sellingPrice: updates["Selling Price"],
            },
          },
        });
      }
      refetch();
      toast.success("Batch updated successfully!");
    } catch (error) {
      toast.error("Failed to update batch: " + error.message);
    }
  };

  const handleDeleteProduct = async () => {
    try {
      const result = await deleteProduct({
        variables: { productId },
        errorPolicy: "all", // This ensures errors are returned
      });

      console.log("Delete result:", result); // Add this log

      if (result.data?.deleteProduct) {
        toast.success("Product deleted successfully!");
        router.push("/medical-supplies/products");
      }
    } catch (error) {
      console.error("Error deleting product:", error);

      // Handle GraphQL errors specifically
      if (error.graphQLErrors?.length > 0) {
        const message = error.graphQLErrors[0].message;
        toast.error("Failed to delete product: " + message);
      } else if (error.networkError) {
        toast.error("Network error occurred while deleting product");
      } else {
        toast.error("Failed to delete product: " + error.message);
      }
    } finally {
      setShowDeleteModal(false);
    }
  };
  const handleEditToggle = (batchId) => {
    setEditingBatchId(editingBatchId === batchId ? null : batchId);
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
    console.log("productType", productType);
    return productType === "DRUG"
      ? [
          { key: "BatchID", label: "BatchID" },
          { key: "Expiry Date", label: "Expiry Date" },
          { key: "Size Per Package", label: "Size Per Package" },
          { key: "Manufacturer", label: "Manufacturer" },
          { key: "Manufacturer Country", label: "Manufacturer Country" },
          { key: "Manufactuer Date", label: "Manufactuer Date" },
          { key: "Buying Price", label: "Buying Price" },
          { key: "Selling Price", label: "Selling Price" },
          { key: "Quantity", label: "Quantity" },
        ]
      : [
          { key: "BatchID", label: "BatchID" },
          { key: "Manufacturer", label: "Manufacturer" },
          { key: "Manufacturer Country", label: "Manufacturer Country" },
          { key: "Manufactuer Date", label: "Manufactuer Date" },
          { key: "Buying Price", label: "Buying Price" },
          { key: "Selling Price", label: "Selling Price" },
          { key: "Quantity", label: "Quantity" },
        ];
  };

  const formatProductsData = (batches, productType) => {
    if (!batches || !Array.isArray(batches)) return [];

    // Helper function to format timestamps
    const formatDate = (timestamp) => {
      if (!timestamp || timestamp === "-") return "-";

      // Handle both string and number timestamps
      const numericTimestamp =
        typeof timestamp === "string" ? parseInt(timestamp) : timestamp;

      // Check if it's a valid timestamp
      if (isNaN(numericTimestamp) || numericTimestamp <= 0) return "-";

      try {
        const date = new Date(numericTimestamp);
        // Check if date is valid
        if (isNaN(date.getTime())) return "-";

        // Format as readable date (you can customize this format)
        return date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "2-digit",
        });

        // Alternative formats you can use:
        // return date.toISOString().split('T')[0]; // YYYY-MM-DD
        // return date.toLocaleDateString(); // Default locale format
        // return date.toDateString(); // "Mon Jan 01 2025" format
      } catch (error) {
        return "-";
      }
    };

    return batches.map((batch) => {
      // console.log( "Manufacturer Date", formatDate(batch.manufactureredDate), )
      if (productType === "DRUG") {
        return {
          BatchID: batch.batchId || "-",
          "Expiry Date": formatDate(batch.expiryDate),
          "Size Per Package": batch.sizePerPackage || "-",
          Manufacturer: batch.manufacturer || "-",
          "Manufacturer Country": batch.manufacturerCountry || "-",
          "Manufactuer Date": formatDate(batch.manufactureredDate),
          "Buying Price": batch.costPrice || "-",
          "Selling Price": batch.sellingPrice || "-",
          Quantity: batch.quantity || "-",
        };
      } else {
        return {
          BatchID: batch.batchId || "-",
          "Added At": formatDate(batch.addedAt),
          Manufacturer: batch.manufacturer || "-",
          "Manufacturer Country": batch.manufacturerCountry || "-",
          "Manufactuer Date": formatDate(batch.manufactureredDate),
          "Buying Price": batch.costPrice || "-",
          "Selling Price": batch.sellingPrice || "-",
          Quantity: batch.quantity || "-",
        };
      }
    });
  };

  const allProductsData = productData.batches
    ? formatProductsData(productData.batches, productData.productType)
    : [];
  const totalCount = productData.batches?.length || 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE) || 1;
  console.log("prodcut details", productData);

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
              className="flex gap-1 items-center "
              color="error"
              onClick={() => setShowDeleteModal(true)}
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
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
                refetch();
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
            <div className="w-1/2 pr-4 h-[67vh] overflow-y-auto">
              <h3 className="text-md font-bold text-secondary mb-4">
                Product Detail
              </h3>
              <div className="space-y-4 px-8">
                {isEditing ? (
                  <>
                    {/* Common fields for both product types */}
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
                      value={editedProductData.category || ""}
                      name="category"
                      onChange={handleInputChange}
                    />
                    <EditableTextAreaField
                      label="Description"
                      value={editedProductData.description || ""}
                      name="description"
                      onChange={handleInputChange}
                    />

                    {/* Conditional fields based on product type */}
                    {editedProductData.productType === "DRUG" ||
                    editedProductData.__typename === "DrugProduct" ? (
                      <>
                        <EditableTextField
                          label="Package Type"
                          value={editedProductData.packageType || ""}
                          name="packageType"
                          onChange={handleInputChange}
                        />
                        <EditableTextField
                          label="Concentration"
                          value={editedProductData.concentration || ""}
                          name="concentration"
                          onChange={handleInputChange}
                        />
                        <div className="flex flex-col">
                          <label className="text-sm font-medium text-gray-700 mb-1">
                            Requires Prescription
                          </label>
                          <select
                            name="requiresPrescription"
                            value={
                              editedProductData.requiresPrescription || false
                            }
                            onChange={(e) =>
                              handleInputChange({
                                target: {
                                  name: "requiresPrescription",
                                  value: e.target.value === "true",
                                },
                              })
                            }
                            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                          >
                            <option value={false}>No</option>
                            <option value={true}>Yes</option>
                          </select>
                        </div>
                      </>
                    ) : (
                      <>
                        <EditableTextField
                          label="Brand Name"
                          value={editedProductData.brandName || ""}
                          name="brandName"
                          onChange={handleInputChange}
                        />
                        <EditableTextField
                          label="Model Number"
                          value={editedProductData.modelNumber || ""}
                          name="modelNumber"
                          onChange={handleInputChange}
                        />
                        <EditableTextAreaField
                          label="Warranty Info"
                          value={editedProductData.warrantyInfo || ""}
                          name="warrantyInfo"
                          onChange={handleInputChange}
                        />
                        <EditableTextAreaField
                          label="Spare Part Info"
                          value={
                            editedProductData.sparePartInfo?.join(", ") || ""
                          }
                          name="sparePartInfo"
                          onChange={(e) =>
                            handleInputChange({
                              target: {
                                name: "sparePartInfo",
                                value: e.target.value
                                  .split(",")
                                  .map((item) => item.trim())
                                  .filter((item) => item),
                              },
                            })
                          }
                          placeholder="Enter spare parts separated by commas"
                        />
                      </>
                    )}
                  </>
                ) : (
                  <>
                    {/* Common fields for both product types */}
                    <TextField label="Product name" value={productData.name} />
                    <TextField label="Product id" value={productId} />
                    <TextField
                      label="Product Type"
                      value={productData.productType}
                    />
                    <TextField
                      label="Category"
                      value={productData.category || "-"}
                    />
                    <TextField
                      label="Owner"
                      value={productData.ownerName || "-"}
                    />
                    <TextField
                      label="Original Lister"
                      value={productData.originalListerName || "-"}
                    />
                    <LongTextField
                      label="Description"
                      value={productData.description || "-"}
                    />

                    {/* Conditional fields based on product type */}
                    {productData.productType === "DRUG" ||
                    productData.__typename === "DrugProduct" ? (
                      <>
                        <TextField
                          label="Package Type"
                          value={productData.packageType || "-"}
                        />
                        <TextField
                          label="Concentration"
                          value={productData.concentration || "-"}
                        />
                        <TextField
                          label="Requires Prescription"
                          value={
                            productData.requiresPrescription ? "Yes" : "No"
                          }
                        />
                      </>
                    ) : (
                      <>
                        <TextField
                          label="Brand Name"
                          value={productData.brandName || "-"}
                        />
                        <TextField
                          label="Model Number"
                          value={productData.modelNumber || "-"}
                        />
                        <LongTextField
                          label="Warranty Info"
                          value={productData.warrantyInfo || "-"}
                        />
                        <TextField
                          label="Spare Parts"
                          value={productData.sparePartInfo?.join(", ") || "-"}
                        />
                        {productData.documentUrls &&
                          productData.documentUrls.length > 0 && (
                            <div className="flex flex-col">
                              <label className="text-sm font-medium text-gray-700 mb-1">
                                Documents
                              </label>
                              <div className="space-y-1">
                                {productData.documentUrls.map((url, index) => (
                                  <a
                                    key={index}
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 underline text-sm"
                                  >
                                    Document {index + 1}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                      </>
                    )}

                    {/* Common status fields */}
                    <TextField
                      label="Status"
                      value={productData.isActive ? "Active" : "Inactive"}
                    />
                    <TextField
                      label="Created At"
                      value={
                        productData.createdAt
                          ? new Date(
                              parseInt(productData.createdAt)
                            ).toLocaleDateString()
                          : "-"
                      }
                    />
                    <TextField
                      label="Last Updated"
                      value={
                        productData.lastUpdatedAt
                          ? new Date(
                              parseInt(productData.lastUpdatedAt)
                            ).toLocaleDateString()
                          : "-"
                      }
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
            isEditable={true}
            editableColumns={"Selling Price"} ///{["Buying Price", "Selling Price", "Quantity"]}
            onUpdateItem={handleBatchUpdate}
            onEditToggle={handleEditToggle}
            editingRowId={editingBatchId}
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
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteProduct}
        title="Delete Product"
        message={`Are you sure you want to permanently delete "${productData?.name}"? This will completely remove the product and all associated batches from the system. This action cannot be undone. The product cannot be deleted if it exists in any orders.`}
        confirmText="Delete Product"
        cancelText="Cancel"
        type="danger"
        isLoading={deletingProduct}
      />
    </div>
  );
}
