"use client";
import { useState, useEffect } from "react";
import { StepProgressIndicator } from "../StepProgressIndicator";

import ProductSelector from "./ProductSelector";
import ProductDetailsDrug from "./ProductDetailsDrug";
import ProductDetailsEquipment from "./ProductDetailsEquipment";
import ProductImage from "./ProductImage";
import ProductDrugInventory from "./ProductDrugInventory";
import ProductEquipmentInventory from "./ProductEquipmentInventory";
import ProductSummaryDrug from "./ProductSummaryDrug";
import ProductSummaryEquipment from "./ProductSummaryEquipment";
// import SuccessUpload from "./SuccessUpload";

export default function AddProductMultiSteps({ onClose }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submissionComplete, setSubmissionComplete] = useState(false);

  // Product data state
  const [productData, setProductData] = useState({
    productType: "", // "DRUG" or "EQUIPMENT"
    // Common product fields
    name: "",
    category: "",
    description: "",
    imageList: [],
    isActive: true,

    // Drug-specific fields
    packageType: "",
    concentration: "",
    requiresPrescription: false,

    // Equipment-specific fields
    brandName: "",
    modelNumber: "",
    warrantyInfo: "",
    sparePartInfo: [],
    documentUrls: [],

    // Batch information
    batch: {
      quantity: 0,
      costPrice: 0,
      sellingPrice: 0,

      // DrugBatch-specific
      expiryDate: "",
      sizePerPackage: 0,
      manufacturer: "",
      manufacturerCountry: "",

      // EquipmentBatch-specific
      serialNumbers: [],
    },
  });

  // Get total steps based on product type
  const getTotalSteps = () => {
    switch (productData.productType) {
      case "DRUG":
      case "EQUIPMENT":
        return 6; // Type, Details, Images, Inventory, Summary, Success
      default:
        return 6; // Default to maximum
    }
  };

  // Handle navigation
  const handleNext = async () => {
    // Validate current step
    if (!validateCurrentStep()) {
      return;
    }

    // If at the summary step, submit the product
    if (currentStep === getTotalSteps() - 1) {
      await handleSubmitProduct();
      return;
    }

    // Move to next step
    setCurrentStep((prev) => Math.min(prev + 1, getTotalSteps()));
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // Validate the current step
  const validateCurrentStep = () => {
    setError(null);

    // Step 1: Product Type Selection
    if (currentStep === 1) {
      if (!productData.productType) {
        setError("Please select a product type to continue.");
        return false;
      }
    }

    // Step 2: Product Details
    else if (currentStep === 2) {
      console.log("productData", productData);
      if (!productData.name) {
        setError("Product name is required.");
        return false;
      }

      if (
        productData.productType === "DRUG" &&
        productData.requiresPrescription === undefined
      ) {
        setError("Please specify if prescription is required.");
        return false;
      }
    }

    // Step 4: Inventory
    else if (currentStep === 4) {
      if (productData.batch.quantity <= 0) {
        setError("Quantity must be greater than zero.");
        return false;
      }

      if (productData.productType === "DRUG" && !productData.batch.expiryDate) {
        setError("Expiry date is required for drugs.");
        return false;
      }
    }

    return true;
  };

  // Update product data
  const updateProductData = (newData) => {
    setProductData((prev) => ({ ...prev, ...newData }));
  };

  // Update batch data
  const updateBatchData = (newBatchData) => {
    setProductData((prev) => ({
      ...prev,
      batch: { ...prev.batch, ...newBatchData },
    }));
  };

  // Handle image upload
  const handleImageUpload = (imageUrls) => {
    updateProductData({ imageList: [...productData.imageList, ...imageUrls] });
  };

  // Remove image
  const handleRemoveImage = (indexToRemove) => {
    const newImageList = productData.imageList.filter(
      (_, index) => index !== indexToRemove
    );
    updateProductData({ imageList: newImageList });
  };

  // Submit product data to backend
  const handleSubmitProduct = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Form the appropriate input based on product type
      let productInput;
      let batchInput;

      if (productData.productType === "DRUG") {
        productInput = {
          name: productData.name,
          category: productData.category,
          description: productData.description,
          imageList: productData.imageList,
          isActive: productData.isActive,
          packageType: productData.packageType,
          concentration: productData.concentration,
          requiresPrescription: productData.requiresPrescription,
        };

        batchInput = {
          quantity: parseFloat(productData.batch.quantity),
          costPrice: parseFloat(productData.batch.costPrice),
          sellingPrice: parseFloat(productData.batch.sellingPrice),
          expiryDate: productData.batch.expiryDate,
          sizePerPackage: parseFloat(productData.batch.sizePerPackage),
          manufacturer: productData.batch.manufacturer,
          manufacturerCountry: productData.batch.manufacturerCountry,
        };
      } else {
        productInput = {
          name: productData.name,
          category: productData.category,
          description: productData.description,
          imageList: productData.imageList,
          isActive: productData.isActive,
          brandName: productData.brandName,
          modelNumber: productData.modelNumber,
          warrantyInfo: productData.warrantyInfo,
          sparePartInfo: productData.sparePartInfo,
          documentUrls: productData.documentUrls,
        };

        batchInput = {
          quantity: parseFloat(productData.batch.quantity),
          costPrice: parseFloat(productData.batch.costPrice),
          sellingPrice: parseFloat(productData.batch.sellingPrice),
          serialNumbers: productData.batch.serialNumbers,
        };
      }

      console.log("Submitting product:", productInput);
      console.log("With batch:", batchInput);

      // Here you would make your API/GraphQL calls
      // const response = await createProduct(productInput, batchInput);

      // For now, simulate success
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setSubmissionComplete(true);
      setCurrentStep(getTotalSteps()); // Move to success step
    } catch (err) {
      console.error("Error submitting product:", err);
      setError(`Failed to submit product: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle completion and redirect
  const handleComplete = () => {
    // Close modal or redirect
    if (onClose) onClose();
    // Or redirect: router.push('/products');
  };

  // Render the appropriate step component
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <ProductSelector
            selectedType={productData.productType}
            onTypeSelect={(type) => updateProductData({ productType: type })}
            onNext={handleNext}
            isLoading={isLoading}
          />
        );

      case 2:
        return productData.productType === "DRUG" ? (
          <ProductDetailsDrug
            productData={productData}
            onUpdate={updateProductData}
            onNext={handleNext}
            onPrevious={handlePrevious}
            isLoading={isLoading}
          />
        ) : (
          <ProductDetailsEquipment
            productData={productData}
            onUpdate={updateProductData}
            onNext={handleNext}
            onPrevious={handlePrevious}
            isLoading={isLoading}
          />
        );

      case 3:
        return (
          <ProductImage
            images={productData.imageList}
            onImageUpload={handleImageUpload}
            onRemoveImage={handleRemoveImage}
            onNext={handleNext}
            onPrevious={handlePrevious}
            isLoading={isLoading}
          />
        );

      case 4:
        return productData.productType === "DRUG" ? (
          <ProductDrugInventory
            productType={productData.productType}
            productData={productData}
            onUpdate={updateBatchData}
            onNext={handleNext}
            onPrevious={handlePrevious}
            isLoading={isLoading}
          />
        ) : (
          <ProductEquipmentInventory
            productType={productData.productType}
            batchData={productData.batch}
            onUpdate={updateBatchData}
            onNext={handleNext}
            onPrevious={handlePrevious}
            isLoading={isLoading}
          />
        );

      case 5:
        return productData.productType === "DRUG" ? (
          <ProductSummaryDrug
            productData={productData}
            onSubmit={handleNext}
            onPrevious={handlePrevious}
            isLoading={isLoading}
          />
        ) : (
          <ProductSummaryEquipment
            productData={productData}
            onSubmit={handleNext}
            onPrevious={handlePrevious}
            isLoading={isLoading}
          />
        );

      case 6:
        return (
          <SuccessUpload
            productData={productData}
            onComplete={handleComplete}
            message={`Your ${productData.productType.toLowerCase()} product has been successfully added to the inventory!`}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="w-full max-w-md md:max-w-5xl mx-auto bg-white rounded-2xl shadow-md p-6 md:py-6 md:px-12">
        <h1 className="text-2xl font-bold text-secondary mb-6">
          {submissionComplete
            ? productData.productType === "DRUG"
              ? "Product Added (Drugs)"
              : productData.productType === "EQUIPMENT"
              ? "Product Added (Equipment)"
              : "Product Added"
            : productData.productType === "DRUG"
            ? "Add New (Drug)"
            : productData.productType === "EQUIPMENT"
            ? "Add New (Equipment)"
            : "Add New Product"}
        </h1>
        {/* Error message display */}
        {error && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4"
            role="alert"
          >
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        {/* Progress indicator - Hide on success page */}
        {currentStep < getTotalSteps() && (
          <StepProgressIndicator
            currentStep={currentStep}
            totalSteps={getTotalSteps() - 1} // Don't count success step in the progress
            className="mb-8"
          />
        )}
        {/* Current step content */}
        <div className="overflow-y-auto max-h-[60vh] pr-2">
          {renderStep()}
        </div>{" "}
      </div>
    </div>
  );
}
