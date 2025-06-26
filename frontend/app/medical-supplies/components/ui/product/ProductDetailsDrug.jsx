"use client";
import { useState, useEffect, useCallback } from "react";
import { StepButtons } from "../Button";
import {
  TextInput,
  SelectInput,
  NumberWithUnitInput,
  TextAreaInput,
  RadioGroup,
} from "../Input";

// Validation helper
const validateField = (value) => value !== undefined && value !== "";

export default function ProductDetailsDrug({
  productData,
  onUpdate,
  onNext,
  onPrevious,
  isLoading,
}) {
  // Local form state that syncs with parent component
  const [formData, setFormData] = useState({
    name: productData.name || "",
    category: productData.category || "category1", 
    packageType: productData.packageType || "packageType1",
    concentration: productData.concentration || "",
    description: productData.description || "",
    requiresPrescription: productData.requiresPrescription === true,
  });

  // Field validation state
  const [validationState, setValidationState] = useState({
    name: false,
    category: false,
    packageType: false,
    concentration: false,
    description: false,
    requiresPrescription: true, // Default to true since it's a boolean
  });

  // Category options - could be fetched from API
// Real medical categories - for drug-related items
const categoryOptions = [
  { label: "Antibiotics", value: "antibiotics" },
  { label: "Antivirals", value: "antivirals" },
  { label: "Antifungals", value: "antifungals" },
  { label: "Analgesics (Pain Relief)", value: "analgesics" },
  { label: "Antipyretics (Fever Reducers)", value: "antipyretics" },
  { label: "Anti-inflammatory", value: "anti_inflammatory" },
  { label: "Antihistamines", value: "antihistamines" },
  { label: "Cough and Cold", value: "cough_cold" },
  { label: "Gastrointestinal", value: "gastrointestinal" },
  { label: "Cardiovascular", value: "cardiovascular" },
  { label: "Respiratory", value: "respiratory" },
  { label: "Endocrine (e.g. Diabetes, Thyroid)", value: "endocrine" },
  { label: "Neurological", value: "neurological" },
  { label: "Psychiatric", value: "psychiatric" },
  { label: "Dermatological", value: "dermatological" },
  { label: "Ophthalmic (Eye Care)", value: "ophthalmic" },
  { label: "Vitamins & Supplements", value: "vitamins_supplements" },
  { label: "Oncology (Cancer Treatment)", value: "oncology" },
  { label: "Immunological", value: "immunological" },
  { label: "Reproductive Health", value: "reproductive_health" },
];



  // Package type options - could be fetched from API 
 const packageTypeOptions = [
  { label: "Tablet", value: "tablet" },
  { label: "Capsule", value: "capsule" },
  { label: "Syrup", value: "syrup" },
  { label: "Injection", value: "injection" },
  { label: "Cream/Ointment", value: "cream_ointment" },
  { label: "Medical Equipment Kit", value: "equipment_kit" },
  { label: "Single-use Item", value: "single_use" },
];

  // Concentration unit options
  const concentrationUnitOptions = [
    { label: "mg", value: "mg" },
    { label: "g", value: "g" },
    { label: "mL", value: "mL" },
    { label: "%", value: "%" },
  ];

  // Update local form state when parent data changes
  useEffect(() => {
    if (productData) {
      setFormData({
        name: productData.name || "",
        category: productData.category || "",
        packageType: productData.packageType || "",
        concentration: productData.concentration || "",
        description: productData.description || "",
        requiresPrescription: productData.requiresPrescription === true,
      });
    }
  }, [productData]);

  // Handle form validation on data change
  useEffect(() => {
    setValidationState({
      name: validateField(formData.name),
      category: validateField(formData.category),
      packageType: validateField(formData.packageType),
      concentration: validateField(formData.concentration),
      description: validateField(formData.description),
      requiresPrescription: true, // Always valid as it's a boolean
    });
  }, [formData]);

  // Handle input changes
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    
    // Special handling for radio buttons
    if (name === "requiresPrescription") {
      const boolValue = value === "true" || value === true;
      setFormData((prev) => ({ ...prev, [name]: boolValue }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  }, []);

  // Submit form data and proceed
  const handleSubmit = useCallback((e) => {
    if (e) e.preventDefault();
    onUpdate(formData);
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
            validation="name"
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
            options={categoryOptions}
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
            options={packageTypeOptions}
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
            unitOptions={concentrationUnitOptions}
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
          onNext={isFormValid  && handleSubmit}
          onPrevious={onPrevious}
          nextDisabled={!isFormValid}
          isLoading={isLoading}
        />
      </form>
    </div>
  );
}