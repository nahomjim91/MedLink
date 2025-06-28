"use client";
import { useState, useEffect, useCallback } from "react";
import { StepButtons } from "../../Button";
import {
  TextInput,
  NumberInput,
  DateInput,
  FileInput,
  SelectInput,
} from "../../Input";
import { getData } from "country-list";

export default function ProductDrugInventory({
  productData,
  onUpdate,
  onNext,
  onPrevious,
  isLoading,
}) {
  // Initialize local state from the parent's productData.batch
  const [batchData, setBatchData] = useState({
    batchNumber: productData.batch?.batchNumber || "",
    expiryDate: productData.batch?.expiryDate || "",
    quantity: productData.batch?.quantity || 0,
    costPrice: productData.batch?.costPrice || 0,
    sellingPrice: productData.batch?.sellingPrice || 0,
    sizePerPackage: productData.batch?.sizePerPackage || 0,
    manufacturer: productData.batch?.manufacturer || "",
    manufacturerCountry: productData.batch?.manufacturerCountry || "Ethiopia",
    manufactureredDate: productData.batch?.manufactureredDate || "",
  });

  // Track validation errors
  const [errors, setErrors] = useState({});

  // Country options - could be fetched from an API
  const countryOptions = getData().map((country) => ({
    label: country.name,
    value: country.code.toLowerCase(),
  }));

  // Update local state when productData prop changes
  useEffect(() => {
    if (productData.batch) {
      setBatchData({
        batchNumber: productData.batch.batchNumber || "",
        expiryDate: productData.batch.expiryDate || "",
        quantity: productData.batch.quantity || 0,
        costPrice: productData.batch.costPrice || 0,
        sellingPrice: productData.batch.sellingPrice || 0,
        sizePerPackage: productData.batch.sizePerPackage || 0,
        manufacturer: productData.batch.manufacturer || "",
        manufacturerCountry: productData.batch.manufacturerCountry || "",
        manufactureredDate: productData.batch.manufactureredDate || "",
      });
    }
  }, [productData]);

  const validateField = (value) =>
    value !== undefined && value !== "" && value !== null;

  // Validation state
  const [validationState, setValidationState] = useState({
    batchNumber: false,
    expiryDate: false,
    quantity: false,
    costPrice: false,
    sellingPrice: false,
    sizePerPackage: false,
    manufacturer: false,
    manufacturerCountry: false,
    manufactureredDate: false,
  });

  // Update validation state when batch data changes
  useEffect(() => {
    setValidationState({
      batchNumber: validateField(batchData.batchNumber),
      expiryDate: validateField(batchData.expiryDate),
      quantity: batchData.quantity > 0,
      costPrice: batchData.costPrice > 0,
      sellingPrice:
        batchData.sellingPrice > 0 &&
        batchData.sellingPrice >= batchData.costPrice,
      sizePerPackage: batchData.sizePerPackage > 0,
      manufacturer: validateField(batchData.manufacturer),
      manufacturerCountry: validateField(batchData.manufacturerCountry),
      manufactureredDate: validateField(batchData.manufactureredDate),
    });
  }, [batchData]);

  // Validate form function
  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!validationState.batchNumber) {
      newErrors.batchNumber = "Batch number is required";
    }

    if (!validationState.expiryDate) {
      newErrors.expiryDate = "Expiry date is required";
    }

    if (!validationState.quantity) {
      newErrors.quantity = "Quantity must be greater than zero";
    }

    if (!validationState.costPrice) {
      newErrors.costPrice = "Cost price must be greater than zero";
    }

    if (!validationState.sellingPrice) {
      if (batchData.sellingPrice <= 0) {
        newErrors.sellingPrice = "Selling price must be greater than zero";
      } else if (batchData.sellingPrice < batchData.costPrice) {
        newErrors.sellingPrice =
          "Selling price should be greater than or equal to cost price";
      }
    }

    if (!validationState.sizePerPackage) {
      newErrors.sizePerPackage = "Size per package must be greater than zero";
    }

    if (!validationState.manufacturer) {
      newErrors.manufacturer = "Manufacturer is required";
    }

    if (!validationState.manufacturerCountry) {
      newErrors.manufacturerCountry = "Manufacturer country is required";
    }

    if (!validationState.manufactureredDate) {
      newErrors.manufactureredDate = "Manufacturing date is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [batchData, validationState]);

  // Check if form is valid for button state
  const isFormValid = Object.values(validationState).every(Boolean);

  // Handle input changes - memoized to prevent unnecessary re-renders
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;

    // Clear the error for this field when the user is typing
    setErrors((prev) => ({ ...prev, [name]: null }));

    // For number inputs, convert the value to a number
    if (
      ["quantity", "costPrice", "sellingPrice", "sizePerPackage"].includes(name)
    ) {
      setBatchData((prev) => ({
        ...prev,
        [name]: parseFloat(value) || 0,
      }));
    } else {
      setBatchData((prev) => ({ ...prev, [name]: value }));
    }
  }, []);

  // Handle number input changes specifically for better validation
  const handleNumberChange = useCallback((name, value) => {
    // Clear the error for this field when the user is typing
    setErrors((prev) => ({ ...prev, [name]: null }));

    // Handle the case where NumberInput component passes value directly
    const numValue =
      value === "" || value === null || value === undefined
        ? 0
        : parseFloat(value);
    if (!isNaN(numValue)) {
      setBatchData((prev) => ({ ...prev, [name]: numValue }));
    }
  }, []);

  // Handle file change - memoized to prevent unnecessary re-renders
  const handleFileChange = useCallback((name, file) => {
    setErrors((prev) => ({ ...prev, [name]: null }));
    setBatchData((prev) => ({ ...prev, [name]: file }));
  }, []);

  // Submit form data - memoized to prevent unnecessary re-renders
  const handleSubmit = useCallback(
    (e) => {
      if (e) e.preventDefault();

      if (validateForm()) {
        // Pass the complete batch data to the parent component
        onUpdate(batchData);
        onNext();
      }
    },
    [batchData, onUpdate, onNext, validateForm]
  );

  return (
    <div className="px-6">
      <h2 className="text-xl font-semibold text-secondary/80 mb-6">
        Inventory Details
      </h2>
      {errors.message && <p className="text-red-600">{errors.message}</p>}

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Batch Information Section */}
        <div className="grid md:grid-cols-2 md:gap-4">
          <TextInput
            name="batchNumber"
            label="Batch Number"
            validation="batch"
            placeholder="#1234567"
            value={batchData.batchNumber}
            onChange={handleChange}
            required={true}
            className="w-full"
            error={errors.batchNumber}
          />

          <DateInput
            name="expiryDate"
            label="Expiration Date"
            placeholder="mm/dd/yyyy"
            value={batchData.expiryDate}
            onChange={handleChange}
            required={true}
            className="w-full"
            min={new Date().toISOString().split("T")[0]}
            error={errors.expiryDate}
            // helpText="Short expiry products will be visually flagged"
          />
        </div>

        {/* Pricing and Quantity Section */}
        <div className="grid md:grid-cols-3 md:gap-4">
          <NumberInput
            name="quantity"
            label="Quantity"
            value={batchData.quantity}
            onChange={(e) => {
              // Check if your NumberInput passes event or value directly
              if (e.target) {
                handleChange(e);
              } else {
                handleNumberChange("quantity", e);
              }
            }}
            required={true}
            className="w-full"
            min={0}
            error={errors.quantity}
          />

          <NumberInput
            name="costPrice"
            label="Cost Price (Birr)"
            value={batchData.costPrice}
            onChange={(e) => {
              if (e.target) {
                handleChange(e);
              } else {
                handleNumberChange("costPrice", e);
              }
            }}
            required={true}
            className="w-full"
            min={0}
            prefix="$"
            error={errors.costPrice}
          />

          <NumberInput
            name="sellingPrice"
            label="Selling Price (Birr)"
            value={batchData.sellingPrice}
            onChange={(e) => {
              if (e.target) {
                handleChange(e);
              } else {
                handleNumberChange("sellingPrice", e);
              }
            }}
            required={true}
            className="w-full"
            min={0}
            prefix="$"
            error={errors.sellingPrice}
          />
        </div>

        {/* Package Information */}
        <div className="grid md:grid-cols-2 md:gap-4">
          <NumberInput
            name="sizePerPackage"
            label="Size Per Package"
            placeholder="100 tablets per bottle"
            value={batchData.sizePerPackage}
            onChange={(e) => {
              if (e.target) {
                handleChange(e);
              } else {
                handleNumberChange("sizePerPackage", e);
              }
            }}
            required={true}
            className="w-full"
            min={0}
            error={errors.sizePerPackage}
          />
        </div>

        {/* Manufacturer Information */}
        <div className="grid md:grid-cols-2 md:gap-4">
          <TextInput
            name="manufacturer"
            label="Manufacturer"
            placeholder="Manufacturer name"
            value={batchData.manufacturer}
            onChange={handleChange}
            required={true}
            className="w-full"
            error={errors.manufacturer}
          />

          <SelectInput
            name="manufacturerCountry"
            label="Manufacturer Country"
            placeholder="Select country"
            value={batchData.manufacturerCountry}
            onChange={handleChange}
            required={true}
            options={countryOptions}
            error={errors.manufacturerCountry}
          />
        </div>
        <div className="grid md:grid-cols-2 md:gap-4">
          <DateInput
            name="manufactureredDate"
            label="Manufactured Date"
            placeholder="mm/dd/yyyy"
            value={batchData.manufactureredDate}
            onChange={handleChange}
            required={true}
            className="w-full"
            max={new Date().toISOString().split("T")[0]}
            error={errors.manufactureredDate}
            // helpText="Short expiry products will be visually flagged"
          />
        </div>

        <div className="pt-4">
          <StepButtons
            isLoading={isLoading}
            onPrevious={onPrevious}
            onNext={handleSubmit}
            isNextDisabled={!isFormValid}
          />
        </div>
      </form>
    </div>
  );
}
