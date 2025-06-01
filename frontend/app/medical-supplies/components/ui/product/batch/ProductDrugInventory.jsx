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

// Validation helper
const validateField = (value) => {
  if (typeof value === "number") return value > 0;
  return value !== undefined && value !== "" && value !== null;
};

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
    fdaCertificate: productData.batch?.fdaCertificate || null,
    license: productData.batch?.license || null,
  });

  // Field validation state
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
    // Optional fields don't need validation entries
  });

  // Country options - could be fetched from an API
  const countryOptions = [
    { label: "Country 1", value: "country1" },
    { label: "Country 2", value: "country2" },
    { label: "Country 3", value: "country3" },
  ];

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
        fdaCertificate: productData.batch.fdaCertificate || null,
        license: productData.batch.license || null,
      });
    }
  }, [productData]);

  // Update validation state when batch data changes
  useEffect(() => {
    setValidationState({
      batchNumber: validateField(batchData.batchNumber),
      expiryDate: validateField(batchData.expiryDate),
      quantity: validateField(batchData.quantity) && batchData.quantity > 0,
      costPrice: validateField(batchData.costPrice) && batchData.costPrice > 0,
      sellingPrice:
        validateField(batchData.sellingPrice) && batchData.sellingPrice > 0,
      sizePerPackage:
        validateField(batchData.sizePerPackage) && batchData.sizePerPackage > 0,
      manufacturer: validateField(batchData.manufacturer),
      manufacturerCountry: validateField(batchData.manufacturerCountry),
      manufactureredDate: validateField(batchData.manufactureredDate),
    });
  }, [batchData]);

  // Handle input changes - memoized to prevent unnecessary re-renders
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;

    // For number inputs, convert the value to a number
    if (
      ["quantity", "costPrice", "sellingPrice", "sizePerPackage"].includes(name)
    ) {
      setBatchData((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setBatchData((prev) => ({ ...prev, [name]: value }));
    }
  }, []);

  // Handle file change - memoized to prevent unnecessary re-renders
  const handleFileChange = useCallback((name, file) => {
    setBatchData((prev) => ({ ...prev, [name]: file }));
  }, []);

  // Submit form data - memoized to prevent unnecessary re-renders
  const handleSubmit = useCallback(
    (e) => {
      if (e) e.preventDefault();

      // Pass the complete batch data to the parent component
      onUpdate(batchData);
      onNext();
    },
    [batchData, onUpdate, onNext]
  );

  // Check if all required fields are valid
  const isFormValid = Object.values(validationState).every(Boolean);

  return (
    <div className="px-6">
      <h2 className="text-xl font-semibold text-secondary/80 mb-6">
        Inventory Details
      </h2>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Batch Information Section */}
        <div className="grid md:grid-cols-2 md:gap-4">
          <TextInput
            name="batchNumber"
            label="Batch Number"
            placeholder="#1234567"
            value={batchData.batchNumber}
            onChange={handleChange}
            required={true}
            className="w-full"
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
            // helpText="Short expiry products will be visually flagged"
          />
        </div>

        {/* Pricing and Quantity Section */}
        <div className="grid md:grid-cols-3 md:gap-4">
          <NumberInput
            name="quantity"
            label="Quantity"
            value={batchData.quantity}
            onChange={handleChange}
            required={true}
            className="w-full"
            min={0}
          />

          <NumberInput
            name="costPrice"
            label="Cost Price (Birr)"
            value={batchData.costPrice}
            onChange={handleChange}
            required={true}
            className="w-full"
            min={0}
            prefix="$"
          />

          <NumberInput
            name="sellingPrice"
            label="Selling Price (Birr)"
            value={batchData.sellingPrice}
            onChange={handleChange}
            required={true}
            className="w-full"
            min={0}
            prefix="$"
          />
        </div>

        {/* Package Information */}
        <div className="grid md:grid-cols-2 md:gap-4">
          <NumberInput
            name="sizePerPackage"
            label="Size Per Package"
            placeholder="100 tablets per bottle"
            value={batchData.sizePerPackage}
            onChange={handleChange}
            required={true}
            className="w-full"
            min={0}
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
          />

          <SelectInput
            name="manufacturerCountry"
            label="Manufacturer Country"
            placeholder="Select country"
            value={batchData.manufacturerCountry}
            onChange={handleChange}
            required={true}
            options={countryOptions}
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
            // helpText="Short expiry products will be visually flagged"
          />
        </div>

        {/* Optional Documentation */}
        <div className="grid md:grid-cols-2 md:gap-4">
          <FileInput
            name="fdaCertificate"
            label="FDA Certificate (Optional)"
            onChange={(file) => handleFileChange("fdaCertificate", file)}
            accept=".pdf,.doc,.docx"
            className="w-full"
          />

          <FileInput
            name="license"
            label="License (Optional)"
            onChange={(file) => handleFileChange("license", file)}
            accept=".pdf,.doc,.docx"
            className="w-full"
          />
        </div>

        <div className="pt-4">
          <StepButtons
            onNext={handleSubmit}
            onPrevious={onPrevious}
            nextDisabled={!isFormValid}
            isLoading={isLoading}
          />
        </div>
      </form>
    </div>
  );
}
