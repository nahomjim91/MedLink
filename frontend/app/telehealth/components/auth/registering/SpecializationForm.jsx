"use client";
import { useState } from "react";
import { StepButtons } from "../../ui/Button";
import { FileUploader } from "../../ui/FileUploader";
import { NumberInput, TextInput } from "../../ui/Input";

export default function SpecializationForm({
  specialization,
  experienceYears,
  aboutYou,
  certificates,
  onUpdate,
  onDocumentsUpload,
  onNext,
  onPrevious,
}) {
  // Helper function to normalize specialization to string
  const normalizeSpecialization = (spec) => {
    if (Array.isArray(spec)) {
      return spec.join(", ");
    }
    return spec || "";
  };

  const [formData, setFormData] = useState({
    specialization: normalizeSpecialization(specialization),
    experienceYears: experienceYears || "",
    aboutYou: aboutYou || "",
  });

  const [documents, setDocuments] = useState(certificates?.map(cert => cert.url) || []);
  const [errors, setErrors] = useState({});

  const validateField = (name, value) => {
    let error = "";

    switch (name) {
      case "specialization":
        // Ensure value is a string before calling trim
        const specValue = typeof value === 'string' ? value : String(value || '');
        if (!specValue.trim()) {
          error = "Specialization is required";
        } else {
          // Check if specializations are separated by commas and each is valid
          const specializations = specValue.split(",").map(s => s.trim()).filter(s => s.length > 0);
          if (specializations.length === 0) {
            error = "Please enter at least one specialization";
          } else if (specializations.some(s => s.length < 2)) {
            error = "Each specialization must be at least 2 characters long";
          }
        }
        break;

      case "experienceYears":
        if (!value.toString().trim()) {
          error = "Years of experience is required";
        } else {
          const years = parseInt(value);
          if (isNaN(years) || years < 0) {
            error = "Please enter a valid number of years";
          } else if (years > 70) {
            error = "Years of experience cannot exceed 70 years";
          }
        }
        break;

      case "aboutYou":
        const aboutValue = typeof value === 'string' ? value : String(value || '');
        if (aboutValue.trim() && aboutValue.trim().length < 10) {
          error = "About you section should be at least 10 characters if provided";
        } else if (aboutValue.trim().length > 500) {
          error = "About you section cannot exceed 500 characters";
        }
        break;

      default:
        break;
    }

    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Update form data
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Validate field and update errors
    const error = validateField(name, value);
    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  };

const handleDocumentsUpload = (files) => {
    setDocuments(files);
    console.log("Documents uploaded:", files);
    const mappedFiles = files.map(file => ({name: file, url: file}));
    onDocumentsUpload(mappedFiles);
};

  const validateForm = () => {
    const newErrors = {};
    
    // Validate all required fields
    Object.keys(formData).forEach((key) => {
      const error = validateField(key, formData[key]);
      if (error) {
        newErrors[key] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Process specializations into array format if needed
      const processedData = {
        ...formData,
        specialization: formData.specialization
          .split(",")
          .map(s => s.trim())
          .filter(s => s.length > 0)
      };
      
      onUpdate(processedData);
      onNext();
    }
  };

  const isFormValid = () => {
    // Ensure specialization is treated as string
    const specValue = typeof formData.specialization === 'string' 
      ? formData.specialization 
      : String(formData.specialization || '');
    
    return (
      specValue.trim() !== "" &&
      formData.experienceYears.toString().trim() !== "" &&
      Object.keys(errors).every(key => !errors[key])
    );
  };

  return (
    <div className="px-6">
      <div className="mb-4">
        <h2 className="text-base md:text-xl font-semibold text-secondary/80 mb-2">
          Professional Information
        </h2>
        <p className="text-xs md:text-sm text-secondary/60">
          Tell us about your medical expertise
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <TextInput
            label="Specialization"
            placeholder="e.g., Cardiology, Dermatology, Neurology"
            value={formData.specialization}
            onChange={handleChange}
            fullWidth={true}
            required={true}
            name="specialization"
          />
          {errors.specialization && (
            <p className="text-red-500 text-xs mt-1">{errors.specialization}</p>
          )}
          <p className="text-xs text-secondary/50 mt-1">
            Separate multiple specializations with commas
          </p>
        </div>
        
        <div>
          <NumberInput
            label="Years of Experience"
            value={formData.experienceYears}
            onChange={handleChange}
            required={true}
            name="experienceYears"
            min={0}
            max={70}
          />
          {errors.experienceYears && (
            <p className="text-red-500 text-xs mt-1">{errors.experienceYears}</p>
          )}
        </div>
      </div>

      <div className="mb-4">
        <label
          htmlFor="aboutYou"
          className="block text-xs md:text-sm font-medium text-secondary/70 mb-1"
        >
          About You
        </label>
        <textarea
          id="aboutYou"
          name="aboutYou"
          value={formData.aboutYou}
          onChange={handleChange}
          rows="2"
          placeholder="Share your professional background, approach to patient care, etc."
          className={`w-full px-3 py-2 border ${
            errors.aboutYou ? 'border-red-500' : 'border-gray-300'
          } rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-xs md:text-sm`}
          maxLength={500}
        />
        {errors.aboutYou && (
          <p className="text-red-500 text-xs mt-1">{errors.aboutYou}</p>
        )}
        <p className="text-xs text-secondary/50 mt-1">
          {String(formData.aboutYou || '').length}/500 characters
        </p>
      </div>

      {/* Certificates/Documents Upload */}
      <FileUploader
        label="Upload Your Certificates"
        accept=".pdf,.jpg,.jpeg,.png"
        multiple={true}
        onFileUpload={handleDocumentsUpload}
        initialFiles={documents}
        showPreview={true}
        previewType="document"

      />

      <StepButtons 
        onNext={handleSubmit} 
        onPrevious={onPrevious}
        nextDisabled={!isFormValid()}
      />
    </div>
  );
}