"use client";
import { useState, useEffect, useCallback } from "react";
import { useMutation } from "@apollo/client";
import { StepProgressIndicator } from "../StepProgressIndicator";
import { useMSAuth } from "../../../../../hooks/useMSAuth";

// GraphQL Mutations
import {
  CREATE_DRUG_PRODUCT,
  CREATE_EQUIPMENT_PRODUCT,
  CREATE_DRUG_BATCH,
  CREATE_EQUIPMENT_BATCH,
} from "../../../api/graphql/product/productMutations";

// Step Components
import ProductSelector from "./ProductSelector";
import ProductDetailsDrug from "./ProductDetailsDrug";
import ProductDetailsEquipment from "./ProductDetailsEquipment";
import ProductImage from "./ProductImage";
import ProductDrugInventory from "./batch/ProductDrugInventory";
import ProductEquipmentInventory from "./batch/ProductEquipmentInventory";
import ProductSummaryDrug from "./ProductSummaryDrug";
import ProductSummaryEquipment from "./ProductSummaryEquipment";
import SuccessUpload from "./SuccessUpload";
import {ProductAndBatchModel} from "../../modal/Modal";

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
    manufactureredDate: "",

    // EquipmentBatch-specific
    serialNumbers: [],
  },
};

export default function AddProductMultiSteps({ onClose }) {
  // Core state
  const [currentStep, setCurrentStep] = useState(1);
  const userData = useMSAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submissionComplete, setSubmissionComplete] = useState(false);
  const [productData, setProductData] = useState({
    ...initialProductData,
    originalListerId: userData?.userId || "",
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

  const [createEquipmentProduct] = useMutation(CREATE_EQUIPMENT_PRODUCT, {
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

  // Navigation handlers
  const handleNext = useCallback(async () => {
  

    if (currentStep === getTotalSteps() - 1) {
      await handleSubmitProduct();
      return;
    }

    setCurrentStep((prev) => Math.min(prev + 1, getTotalSteps()));
  }, [currentStep, getTotalSteps, ]);

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

        setCreatedProductId(
          createdProductResponse.data.createDrugProduct.productId
        );

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
          manufactureredDate: productData.batch.manufactureredDate,
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

        setCreatedProductId(
          createdProductResponse.data.createEquipmentProduct.productId
        );

        // Then create the batch for the product
        const equipmentBatchInput = {
          productId:
            createdProductResponse.data.createEquipmentProduct.productId,
          currentOwnerId: productData.originalListerId,
          currentOwnerName: productData.originalListerName,
          quantity: parseFloat(productData.batch.quantity),
          costPrice: parseFloat(productData.batch.costPrice),
          sellingPrice: parseFloat(productData.batch.sellingPrice),
          serialNumbers: productData.batch.serialNumbers,
          manufacturer: productData.batch.manufacturer,
          manufacturerCountry: productData.batch.manufacturerCountry,
          manufactureredDate: productData.batch.manufactureredDate,
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
    createEquipmentBatch,
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
    2:
      productData.productType === "DRUG" ? (
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
    4:
      productData.productType === "DRUG" ? (
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
    5:
      productData.productType === "DRUG" ? (
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
    <ProductAndBatchModel
      {...{
        onClose,
        currentStep,
        getTotalSteps,
        getFormTitle,
        error,
        stepComponents,
      }}
    />
  );
}
