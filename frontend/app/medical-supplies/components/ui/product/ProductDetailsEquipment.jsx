"use client";
import { useState, useEffect, useCallback } from "react";
import { StepButtons } from "../Button";
import {
  TextInput,
  SelectInput,
  TextAreaInput,
  DynamicList,
} from "../Input";

// Validation helper
const validateField = (value) => value !== undefined && value !== "";

export default function ProductDetailsEquipment({
  productData,
  onUpdate,
  onNext,
  onPrevious,
  isLoading,
}) {
  // Local form state that syncs with parent component
  const [formData, setFormData] = useState({
    name: productData.name || "",
    category: productData.category || "",
    brandName: productData.brandName || "",
    modelNumber: productData.modelNumber || "",
    description: productData.description || "",
    sparePartInfo: productData.sparePartInfo || [],
  });

  // Field validation state
  const [validationState, setValidationState] = useState({
    name: false,
    category: false,
    brandName: false,
    modelNumber: false,
    description: false,
    // sparePartInfo is optional
  });

  // Category options - could be fetched from API
  const categoryOptions = [
    { label: "Category 1", value: "category1" },
    { label: "Category 2", value: "category2" },
    { label: "Category 3", value: "category3" },
  ];

  // Update local form state when parent data changes
  useEffect(() => {
    if (productData) {
      setFormData({
        name: productData.name || "",
        category: productData.category || "",
        brandName: productData.brandName || "",
        modelNumber: productData.modelNumber || "",
        description: productData.description || "",
        sparePartInfo: productData.sparePartInfo || [],
      });
    }
  }, [productData]);

  // Handle form validation on data change
  useEffect(() => {
    setValidationState({
      name: validateField(formData.name),
      category: validateField(formData.category),
      brandName: validateField(formData.brandName),
      modelNumber: validateField(formData.modelNumber),
      description: validateField(formData.description),
    });
  }, [formData]);

  // Handle input changes
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  // Submit form data and proceed
  const handleSubmit = useCallback((e) => {
    if (e) e.preventDefault();
    
    // Update parent component with form data
    onUpdate(formData);
    
    // Proceed to next step
    onNext();
  }, [formData, onUpdate, onNext]);

  // Check if all required fields are valid
  const isFormValid = Object.values(validationState).every(Boolean);

  return (
    <div className="px-6">
      <h2 className="text-xl font-semibold text-secondary/80 mb-2">
        Product Details
      </h2>

      <form onSubmit={handleSubmit}>
        <div className="grid md:grid-cols-2 md:gap-4">
          <TextInput
            name="name"
            label="Name"
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
            options={categoryOptions}
            required={true}
          />
        </div>
        
        <div className="grid md:grid-cols-2 md:gap-4">
          <TextInput
            name="brandName"
            label="Brand Name"
            className="mb-4"
            placeholder="Enter it's brand name"
            value={formData.brandName}
            onChange={handleChange}
            required={true}
          />
          
          <TextInput
            name="modelNumber"
            label="Model Number"
            className="mb-4"
            placeholder="Enter it's model number"
            value={formData.modelNumber}
            onChange={handleChange}
            required={true}
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
          
          <DynamicList
            name="sparePartInfo"
            label="Spare Part Info"
            className="mb-4"
            value={formData.sparePartInfo}
            onChange={handleChange}
            placeholder="Enter spare part information"
            // Not required
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