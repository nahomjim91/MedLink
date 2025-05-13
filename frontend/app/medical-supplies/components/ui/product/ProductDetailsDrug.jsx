"use client";
import { useState, useEffect, useRef } from "react";
import { StepButtons } from "../Button";
import {
  TextInput,
  SelectInput,
  NumberWithUnitInput,
  TextAreaInput,
  RadioGroup,
} from "../Input";
import { FileUploader } from "../FileUploader";

export default function ProductDetailsDrug({
  productData,
  onUpdate,
  onNext,
  onPrevious,
  isLoading,
}) {
  // Create a ref to track if data has been submitted
  const hasSubmittedRef = useRef(false);
  
  const [formData, setFormData] = useState({
    name: productData.name || "",
    category: productData.category || "",
    packageType: productData.packageType || "",
    concentration: productData.concentration || "",
    description: productData.description || "",
    requiresPrescription: productData.requiresPrescription === true,
  });

  // Update local form state when userData prop changes
  useEffect(() => {
    setFormData({
      name: productData.name || "",
      category: productData.category || "",
      packageType: productData.packageType || "",
      concentration: productData.concentration || "",
      description: productData.description || "",
      requiresPrescription: productData.requiresPrescription === true,
    });
  }, [productData]);

  // Effect to handle async update and navigation
  useEffect(() => {
    // If data has been submitted and the local formData name matches the productData name,
    // it means the update was successful and we can proceed
    if (
      hasSubmittedRef.current && 
      productData.name === formData.name && 
      productData.description === formData.description
    ) {
      hasSubmittedRef.current = false; // Reset the flag
      onNext(); // Proceed to next step
    }
  }, [productData, formData, onNext]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Handle radio button value conversion for requiresPrescription
    if (name === "requiresPrescription") {
      const boolValue = value === "true" || value === true;
      setFormData((prev) => ({ ...prev, [name]: boolValue }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();

    console.log("Form data:", formData);
    
    // Set the submission flag to true
    hasSubmittedRef.current = true;
    
    // Update parent component with form data
    onUpdate(formData);
    
    // The navigation to next step will happen in the useEffect after the productData is updated
  };

  const isFormValid =
    formData.name &&
    formData.category &&
    formData.packageType &&
    formData.concentration &&
    formData.description;

  return (
    <div className="px-6">
      <h2 className="text-xl font-semibold text-secondary/80 mb-2">
        Product Details
      </h2>
      <form onSubmit={handleSubmit}>
        <div className="grid md:grid-cols-2 md:gap-4">
          <TextInput
            name="name"
            label="Product Name"
            className="mb-4"
            placeholder="Enter your product name"
            value={formData.name}
            onChange={handleChange}
            required={true}
          />

          <SelectInput
            name="category"
            label="Category"
            className="mb-4"
            placeholder="Select category"
            value={formData.category}
            onChange={handleChange}
            options={[
              { label: "Category 1", value: "category1" },
              { label: "Category 2", value: "category2" },
              { label: "Category 3", value: "category3" },
            ]}
            required={true}
          />
        </div>
        <div className="grid md:grid-cols-2 md:gap-4">
          <SelectInput
            name="packageType"
            label="Package Type"
            className="mb-4"
            placeholder="Select package type"
            value={formData.packageType}
            onChange={handleChange}
            options={[
              { label: "Package Type 1", value: "packageType1" },
              { label: "Package Type 2", value: "packageType2" },
              { label: "Package Type 3", value: "packageType3" },
            ]}
            required={true}
          />
          <NumberWithUnitInput
            name="concentration"
            label="Concentration"
            className="mb-4"
            placeholder="Enter concentration"
            value={formData.concentration}
            onChange={handleChange}
            required={true}
            unitOptions={[
              { label: "mg", value: "mg" },
              { label: "g", value: "g" },
            ]}
          />
        </div>
        <div className="grid md:grid-cols-2 md:gap-4">
          <TextAreaInput
            name="description"
            label="Description"
            className="mb-4"
            placeholder="Enter product description"
            value={formData.description}
            onChange={handleChange}
            required={true}
          />
          <RadioGroup
            name="requiresPrescription"
            label="Requires Prescription"
            className="mb-4"
            value={formData.requiresPrescription}
            onChange={handleChange}
            options={[
              { label: "Yes", value: true },
              { label: "No", value: false },
            ]}
            required={true}
          />
        </div>

        <StepButtons
          onNext={handleSubmit}
          onPrevious={onPrevious}
          nextDisabled={!isFormValid}
          isLoading={isLoading}
        />
      </form>
    </div>
  );
}