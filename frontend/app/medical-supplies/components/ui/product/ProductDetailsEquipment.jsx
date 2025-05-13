"use client";
import { useState, useEffect, useRef } from "react";
import { StepButtons } from "../Button";
import {
  TextInput,
  SelectInput,
  NumberWithUnitInput,
  TextAreaInput,
  DynamicList,
  RadioGroup,
} from "../Input";

export default function ProductDetailsEquipment({
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
    brandName: productData.brandName || "",
    modelNumber: productData.modelNumber || "",
    description: productData.description || "",
    sparePartInfo: productData.sparePartInfo || [],
  });

  // Update local form state when userData prop changes
  useEffect(() => {
    setFormData({
      name: productData.name || "",
      category: productData.category || "",
      brandName: productData.brandName || "",
      modelNumber: productData.modelNumber || "",
      description: productData.description || "",
      sparePartInfo: productData.sparePartInfo || [],
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
    setFormData((prev) => ({ ...prev, [name]: value }));
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
    formData.brandName &&
    formData.modelNumber &&
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
            options={[
              { label: "Category 1", value: "category1" },
              { label: "Category 2", value: "category2" },
              { label: "Category 3", value: "category3" },
            ]}
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