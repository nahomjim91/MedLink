"use client";
import { useState, useEffect } from "react";
import { StepButtons } from "../../ui/Button";
import { NumberInput, SelectInput } from "../../ui/Input";

export default function HealthInfoStep({
  height,
  weight,
  bloodType,  // Changed from bloodGroup to match MultiStepSignup state
  onUpdate,
  onNext,
  onPrevious,
  isLoading
}) {
  const [formData, setFormData] = useState({
    height: height || "",
    weight: weight || "",
    bloodType: bloodType || "",  
  });

  const [errors, setErrors] = useState({});

  // Update local state when props change
  useEffect(() => {
    setFormData({
      height: height || formData.height,
      weight: weight || formData.weight,
      bloodType: bloodType || formData.bloodType,
    });
  }, [height, weight, bloodType]);

  const validateField = (name, value) => {
    let error = "";

    switch (name) {
      case "height":
        if (!value || !value.toString().trim()) {
          error = "Height is required";
        } else {
          const heightValue = parseFloat(value);
          if (isNaN(heightValue)) {
            error = "Please enter a valid height";
          } else if (heightValue < 30) {
            error = "Height must be at least 30 cm";
          } else if (heightValue > 300) {
            error = "Height cannot exceed 300 cm";
          } else if (heightValue < 100) {
            error = "Height seems too low. Please verify (minimum realistic: 100cm)";
          } else if (heightValue > 250) {
            error = "Height seems too high. Please verify (maximum realistic: 250cm)";
          }
        }
        break;

      case "weight":
        if (!value || !value.toString().trim()) {
          error = "Weight is required";
        } else {
          const weightValue = parseFloat(value);
          if (isNaN(weightValue)) {
            error = "Please enter a valid weight";
          } else if (weightValue < 1) {
            error = "Weight must be at least 1 kg";
          } else if (weightValue > 1000) {
            error = "Weight cannot exceed 1000 kg";
          } else if (weightValue < 20) {
            error = "Weight seems too low. Please verify (minimum realistic: 20kg)";
          } else if (weightValue > 300) {
            error = "Weight seems too high. Please verify (maximum realistic: 300kg)";
          }
        }
        break;

      case "bloodType":
        if (!value || !value.toString().trim()) {
          error = "Blood type is required";
        } else {
          const validBloodTypes = ["A+", "B+", "AB+", "O+", "A-", "B-", "AB-", "O-"];
          if (!validBloodTypes.includes(value)) {
            error = "Please select a valid blood type";
          }
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

  const validateForm = () => {
    const newErrors = {};
    
    // Validate all fields
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
      // Convert values to appropriate types before updating
      const processedData = {
        ...formData,
        height: parseFloat(formData.height),
        weight: parseFloat(formData.weight),
      };
      
      onUpdate(processedData);
      onNext();
    }
  };

  const isFormValid = () => {
    return (
      formData.height?.toString().trim() !== "" && 
      formData.weight?.toString().trim() !== "" &&
      formData.bloodType?.toString().trim() !== "" &&
      Object.keys(errors).every(key => !errors[key])
    );
  };

  return (
    <div className="px-6 ">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-secondary/80 mb-2">
          Patient Information
        </h2>
        <p className="text-xs md:text-sm text-secondary/60">
          Please provide your basic health information
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <NumberInput
            name="height"
            label="Height (cm)"
            placeholder="Enter your height in cm"
            className="mb-4"
            value={formData.height}
            onChange={handleChange}
            required={true}
            min={30}
            max={300}
            step={0.1}
          />
          {errors.height && (
            <p className="text-red-500 text-xs mt-1 mb-3">{errors.height}</p>
          )}
        </div>

        <div>
          <NumberInput
            name="weight"
            label="Weight (kg)"
            placeholder="Enter your weight in kg"
            className="mb-4"
            value={formData.weight}
            onChange={handleChange}
            required={true}
            min={1}
            max={1000}
            step={0.1}
          />
          {errors.weight && (
            <p className="text-red-500 text-xs mt-1 -mb-3">{errors.weight}</p>
          )}
        </div>
      </div>

      <div className="mb-4">
        <SelectInput
          name="bloodType"
          label="Blood Type"
          className="mb-4"
          placeholder="Select your blood type"
          value={formData.bloodType}
          onChange={handleChange}
          options={[
            { value: "", label: "Select your blood type" },
            { value: "A+", label: "A+" },
            { value: "B+", label: "B+" },
            { value: "AB+", label: "AB+" },
            { value: "O+", label: "O+" },
            { value: "A-", label: "A-" },
            { value: "B-", label: "B-" },
            { value: "AB-", label: "AB-" },
            { value: "O-", label: "O-" },
          ]}
          required={true}
        />
        {errors.bloodType && (
          <p className="text-red-500 text-xs mt-1">{errors.bloodType}</p>
        )}
      </div>

      <StepButtons 
        onNext={handleSubmit} 
        onPrevious={onPrevious}
        nextDisabled={!isFormValid()}
        isLoading={isLoading}
      />
    </div>
  );
}

