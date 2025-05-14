"use client";
import { useState, useEffect, useCallback } from "react";
import { useMutation } from "@apollo/client";
import { StepProgressIndicator } from "../StepProgressIndicator";

// GraphQL Mutations
import { 
  CREATE_DRUG_PRODUCT, 
  CREATE_EQUIPMENT_PRODUCT,
  CREATE_DRUG_BATCH,
  CREATE_EQUIPMENT_BATCH
} from "../../../api/graphql/productMutations";

// Step Components
import ProductSelector from "./ProductSelector";
import ProductDetailsDrug from "./ProductDetailsDrug";
import ProductDetailsEquipment from "./ProductDetailsEquipment";
import ProductImage from "./ProductImage";
import ProductDrugInventory from "./ProductDrugInventory";
import ProductEquipmentInventory from "./ProductEquipmentInventory";
import ProductSummaryDrug from "./ProductSummaryDrug";
import ProductSummaryEquipment from "./ProductSummaryEquipment";
import SuccessUpload from "./SuccessUpload";

// Initial product data state schema
const initialProductData = {
  productType: "", // "DRUG" or "EQUIPMENT"
  // Common product fields
  name: "",
  category: "",
  description: "",
  imageList: [],
  isActive: true,
  originalListerId: "", // Will be set from user context
  originalListerName: "", // Will be set from user context

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
};

export default function AddProductMultiSteps({ onClose, userData }) {
  // Core state
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submissionComplete, setSubmissionComplete] = useState(false);
  const [productData, setProductData] = useState({
    ...initialProductData,
    originalListerId: userData?.uid || "",
    originalListerName: userData?.companyName || userData?.email || "",
  });
  const [createdProductId, setCreatedProductId] = useState(null);

  // Set up GraphQL mutations
  const [createDrugProduct] = useMutation(CREATE_DRUG_PRODUCT, {
    onError: (error) => {
      console.error("Error creating drug product:", error);
      setError(`Failed to create drug product: ${error.message}`);
      setIsLoading(false);
    },
  });

  const [createEquipmentProduct ]  = useMutation(CREATE_EQUIPMENT_PRODUCT, {
    onError: (error) => {
      console.error("Error creating equipment product:", error);
      setError(`Failed to create equipment product: ${error.message}`);
      setIsLoading(false);
    },
  });

  const [createDrugBatch] = useMutation(CREATE_DRUG_BATCH, {
    onError: (error) => {
      console.error("Error creating drug batch:", error);
      setError(`Failed to create drug batch: ${error.message}`);
      setIsLoading(false);
    },
  });

  const [createEquipmentBatch] = useMutation(CREATE_EQUIPMENT_BATCH, {
    onError: (error) => {
      console.error("Error creating equipment batch:", error);
      setError(`Failed to create equipment batch: ${error.message}`);
      setIsLoading(false);
    },
  });

  // Get total steps based on product type
  const getTotalSteps = useCallback(() => {
    return productData.productType ? 6 : 6; // 6 steps for all product types
  }, [productData.productType]);

  // Update product data - memoized to prevent unnecessary re-renders
  const updateProductData = useCallback((newData) => {
    setProductData((prev) => ({ ...prev, ...newData }));
  }, []);

  // Update batch data - memoized to prevent unnecessary re-renders
  const updateBatchData = useCallback((newBatchData) => {
    setProductData((prev) => ({
      ...prev,
      batch: { ...prev.batch, ...newBatchData },
    }));
  }, []);

  // Validation logic
  const validateCurrentStep = useCallback(() => {
    setError(null);

    const validators = {
      1: () => {
        if (!productData.productType) {
          setError("Please select a product type to continue.");
          return false;
        }
        return true;
      },
      2: () => {
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
        return true;
      },
      3: () => true, // No validation for image upload step
      4: () => {
        if (productData.batch.quantity <= 0) {
          setError("Quantity must be greater than zero.");
          return false;
        }

        if (productData.productType === "DRUG" && !productData.batch.expiryDate) {
          setError("Expiry date is required for drugs.");
          return false;
        }
        return true;
      },
      5: () => true, // No validation for summary step
    };

    return validators[currentStep] ? validators[currentStep]() : true;
  }, [currentStep, productData]);

  // Navigation handlers
  const handleNext = useCallback(async () => {
    if (!validateCurrentStep()) {
      return;
    }

    if (currentStep === getTotalSteps() - 1) {
      await handleSubmitProduct();
      return;
    }

    setCurrentStep((prev) => Math.min(prev + 1, getTotalSteps()));
  }, [currentStep, getTotalSteps, validateCurrentStep]);

  const handlePrevious = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  }, []);

  // Image handlers
  const handleImageUpload = useCallback((imageUrl) => {
    setProductData((prev) => ({
      ...prev,
      imageList: [...prev.imageList, imageUrl],
    }));
  }, []);

  const handleRemoveImage = useCallback((indexToRemove) => {
    setProductData((prev) => ({
      ...prev,
      imageList: prev.imageList.filter((_, index) => index !== indexToRemove),
    }));
  }, []);

  // Submit product data to backend
  const handleSubmitProduct = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Prepare the product input based on type
      const commonProductFields = {
        name: productData.name,
        originalListerId: productData.originalListerId,
        originalListerName: productData.originalListerName,
        category: productData.category,
        description: productData.description,
        imageList: productData.imageList,
        isActive: productData.isActive,
      };

      // First create the product
      let createdProductResponse;

      if (productData.productType === "DRUG") {
        const drugProductInput = {
          ...commonProductFields,
          packageType: productData.packageType,
          concentration: productData.concentration,
          requiresPrescription: productData.requiresPrescription,
        };

        createdProductResponse = await createDrugProduct({
          variables: { input: drugProductInput },
        });

        setCreatedProductId(createdProductResponse.data.createDrugProduct.productId);
        
        // Then create the batch for the product
        const drugBatchInput = {
          productId: createdProductResponse.data.createDrugProduct.productId,
          currentOwnerId: productData.originalListerId,
          currentOwnerName: productData.originalListerName,
          quantity: parseFloat(productData.batch.quantity),
          costPrice: parseFloat(productData.batch.costPrice),
          sellingPrice: parseFloat(productData.batch.sellingPrice),
          expiryDate: productData.batch.expiryDate,
          sizePerPackage: parseFloat(productData.batch.sizePerPackage) || 0,
          manufacturer: productData.batch.manufacturer,
          manufacturerCountry: productData.batch.manufacturerCountry,
        };

        await createDrugBatch({
          variables: { input: drugBatchInput },
        });
      } else {
        const equipmentProductInput = {
          ...commonProductFields,
          brandName: productData.brandName,
          modelNumber: productData.modelNumber,
          warrantyInfo: productData.warrantyInfo,
          sparePartInfo: productData.sparePartInfo,
          documentUrls: productData.documentUrls,
        };

        createdProductResponse = await createEquipmentProduct({
          variables: { input: equipmentProductInput },
        });

        setCreatedProductId(createdProductResponse.data.createEquipmentProduct.productId);
        
        // Then create the batch for the product
        const equipmentBatchInput = {
          productId: createdProductResponse.data.createEquipmentProduct.productId,
          currentOwnerId: productData.originalListerId,
          currentOwnerName: productData.originalListerName,
          quantity: parseFloat(productData.batch.quantity),
          costPrice: parseFloat(productData.batch.costPrice),
          sellingPrice: parseFloat(productData.batch.sellingPrice),
          serialNumbers: productData.batch.serialNumbers,
        };

        await createEquipmentBatch({
          variables: { input: equipmentBatchInput },
        });
      }

      setSubmissionComplete(true);
      setCurrentStep(getTotalSteps()); // Move to success step
    } catch (err) {
      console.error("Error submitting product:", err);
      setError(`Failed to submit product: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [
    productData, 
    getTotalSteps, 
    createDrugProduct, 
    createEquipmentProduct, 
    createDrugBatch, 
    createEquipmentBatch
  ]);

  // Handle completion
  const handleComplete = useCallback(() => {
    if (onClose) onClose();
  }, [onClose]);

  // Step components and props map
  const stepComponents = {
    1: (
      <ProductSelector
        selectedType={productData.productType}
        onTypeSelect={(type) => updateProductData({ productType: type })}
        onNext={handleNext}
        isLoading={isLoading}
      />
    ),
    2: productData.productType === "DRUG" ? (
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
    ),
    3: (
      <ProductImage
        images={productData.imageList}
        onImageUpload={handleImageUpload}
        onRemoveImage={handleRemoveImage}
        onNext={handleNext}
        onPrevious={handlePrevious}
        isLoading={isLoading}
      />
    ),
    4: productData.productType === "DRUG" ? (
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
    ),
    5: productData.productType === "DRUG" ? (
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
    ),
    6: (
      <SuccessUpload
        productData={productData}
        productId={createdProductId}
        onComplete={handleComplete}
        message={`Your ${productData.productType.toLowerCase()} product has been successfully added to the inventory!`}
      />
    ),
  };

  // Get dynamic title based on step and product type
  const getFormTitle = useCallback(() => {
    if (submissionComplete) {
      return `Product Added (${productData.productType || "Product"})`;
    }
    
    if (!productData.productType) {
      return "Add New Product";
    }
    
    return `Add New (${productData.productType})`;
  }, [submissionComplete, productData.productType]);

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="w-full max-w-md md:max-w-5xl mx-auto bg-white rounded-2xl shadow-md p-6 md:py-6 md:px-12">
        <h1 className="text-2xl font-bold text-secondary mb-6">
          {getFormTitle()}
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
            totalSteps={getTotalSteps() - 1}
            className="mb-8"
          />
        )}
        
        {/* Current step content */}
        <div className="overflow-y-auto max-h-[60vh] pr-2">
          {stepComponents[currentStep]}
        </div>
      </div>
    </div>
  );
}