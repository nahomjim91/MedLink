"use client";
import { useState, useEffect, useCallback } from "react";
import { useMutation } from "@apollo/client";
import { StepProgressIndicator } from "../../StepProgressIndicator";
import { useMSAuth } from "../../../../hooks/useMSAuth";

// GraphQL Mutations
import { 
  CREATE_DRUG_BATCH,
  CREATE_EQUIPMENT_BATCH
} from "../../../../api/graphql/product/productMutations";

// Step Components
import ProductDrugInventory from "./ProductDrugInventory";
import ProductEquipmentInventory from "./ProductEquipmentInventory";
import BatchSummaryDrug from "./BatchSummaryDrug";
import BatchSummaryEquipment from "./BatchSummaryEquipment";
import SuccessUpload from "../SuccessUpload";

// Initial batch data state schema
const initialBatchData = {
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
};

export default function AddBatchMultiSteps({ productData , productId, onClose ,  }) {
  // Core state
  const [currentStep, setCurrentStep] = useState(1);
  const userData = useMSAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submissionComplete, setSubmissionComplete] = useState(false);
  const [batchData, setBatchData] = useState({
    ...initialBatchData,
    currentOwnerId: userData?.userId || "",
    currentOwnerName: userData?.companyName || userData?.email || "",
  });
  const [createdBatchId, setCreatedBatchId] = useState(null);

  // Set up GraphQL mutations
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
    return 3; // 3 steps for all batch types: inventory details, summary, success
  }, []);

  // Update batch data - memoized to prevent unnecessary re-renders
  const updateBatchData = useCallback((newData) => {
    setBatchData((prev) => ({ ...prev, ...newData }));
  }, []);

  // Validation logic
  const validateCurrentStep = useCallback(() => {
    setError(null);

    const validators = {
      1: () => {
        if (batchData.quantity <= 0) {
          setError("Quantity must be greater than zero.");
          return false;
        }

        if (productData.productType === "DRUG" && !batchData.expiryDate) {
          setError("Expiry date is required for drugs.");
          return false;
        }

        if (batchData.costPrice <= 0) {
          setError("Cost price must be greater than zero.");
          return false;
        }

        if (batchData.sellingPrice <= 0) {
          setError("Selling price must be greater than zero.");
          return false;
        }

        return true;
      },
      2: () => true, // No validation for summary step
    };

    return validators[currentStep] ? validators[currentStep]() : true;
  }, [currentStep, batchData, productData.productType]);

  // Navigation handlers
  const handleNext = useCallback(async () => {
    if (!validateCurrentStep()) {
      return;
    }

    if (currentStep === getTotalSteps() - 1) {
      await handleSubmitBatch();
      return;
    }

    setCurrentStep((prev) => Math.min(prev + 1, getTotalSteps()));
  }, [currentStep, getTotalSteps, validateCurrentStep]);

  const handlePrevious = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  }, []);

  // Submit batch data to backend
  const handleSubmitBatch = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Then create the batch for the product
      let createdBatchResponse;
      
      if (productData.productType === "DRUG") {
        const drugBatchInput = {
          productId: productId,
          currentOwnerId: batchData.currentOwnerId,
          currentOwnerName: batchData.currentOwnerName,
          quantity: parseFloat(batchData.quantity),
          costPrice: parseFloat(batchData.costPrice),
          sellingPrice: parseFloat(batchData.sellingPrice),
          expiryDate: batchData.expiryDate,
          sizePerPackage: parseFloat(batchData.sizePerPackage) || 0,
          manufacturer: batchData.manufacturer,
          manufacturerCountry: batchData.manufacturerCountry,
        };
console.log("DRUG BATCH INPUT:", drugBatchInput);
        createdBatchResponse = await createDrugBatch({
          variables: { input: drugBatchInput },
        });
        
        setCreatedBatchId(createdBatchResponse.data.createDrugBatch.batchId);
      } else {
        const equipmentBatchInput = {
          productId: productId,
          currentOwnerId: batchData.currentOwnerId,
          currentOwnerName: batchData.currentOwnerName,
          quantity: parseFloat(batchData.quantity),
          costPrice: parseFloat(batchData.costPrice),
          sellingPrice: parseFloat(batchData.sellingPrice),
          serialNumbers: batchData.serialNumbers,
        };

        createdBatchResponse = await createEquipmentBatch({
          variables: { input: equipmentBatchInput },
        });
        
        setCreatedBatchId(createdBatchResponse.data.createEquipmentBatch.batchId);
      }

      setSubmissionComplete(true);
      setCurrentStep(getTotalSteps()); // Move to success step
    } catch (err) {
      console.error("Error submitting batch:", err);
      setError(`Failed to submit batch: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [
    batchData, 
    productData,
    getTotalSteps, 
    createDrugBatch, 
    createEquipmentBatch
  ]);

  // Handle completion
  const handleComplete = useCallback(() => {
    if (onClose) onClose();
  }, [onClose]);

  // Step components and props map
  const stepComponents = {
    1: productData.productType === "DRUG" ? (
      <ProductDrugInventory
        productType={productData.productType}
        productData={productData}
        onUpdate={updateBatchData}
        batchData={batchData}
        onNext={handleNext}
        onPrevious={handlePrevious}
        isLoading={isLoading}
      />
    ) : (
      <ProductEquipmentInventory
        productType={productData.productType}
        batchData={batchData}
        onUpdate={updateBatchData}
        onNext={handleNext}
        onPrevious={handlePrevious}
        isLoading={isLoading}
      />
    ),
    2: productData.productType === "DRUG" ? (
      <BatchSummaryDrug
        batch={batchData}
        onSubmit={handleNext}
        onPrevious={handlePrevious}
        isLoading={isLoading}
      />
    ) : (
      <BatchSummaryEquipment
        batch={batchData}
        onSubmit={handleNext}
        onPrevious={handlePrevious}
        isLoading={isLoading}
      />
    ),
    3: (
      <SuccessUpload
        productData={productData}
        batchId={createdBatchId}
        onComplete={handleComplete}
        message={`Your batch for ${productData.name} has been successfully added to the inventory!`}
      />
    ),
  };

  // Get dynamic title based on step and product type
  const getFormTitle = useCallback(() => {
    if (submissionComplete) {
      return `Batch Added for ${productData.name}`;
    }
    
    return `Add New Batch for ${productData.name}`;
  }, [submissionComplete, productData.name]);

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