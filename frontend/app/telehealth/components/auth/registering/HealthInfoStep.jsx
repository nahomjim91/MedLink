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
    bloodType: bloodType || "A+",  
  });

  // Update local state when props change
  useEffect(() => {
    setFormData({
      height: height || formData.height,
      weight: weight || formData.weight,
      bloodType: bloodType || formData.bloodType,
    });
  }, [height, weight, bloodType]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(formData);
    onNext();
  };

  const isFormValid =
    formData.height?.toString().trim() !== "" && 
    formData.weight?.toString().trim() !== "" &&
    formData.bloodType?.trim() !== "";

  return (
    <div className="px-6 ">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-secondary/80 mb-2">
          Patient Information
        </h2>
      </div>

        <div className="grid md:grid-cols-2 gap-4">
          <NumberInput
            name="height"  // Changed from hegiht to height
            label="Height (cm)"
            placeholder={"Enter your height in cm"}
            className={"mb-4"}
            value={formData.height}
            onChange={handleChange}
            required={true}
          />

          <NumberInput
            name="weight"
            label="Weight (kg)"
            placeholder={"Enter your weight in kg"}
            className={"mb-4"}
            value={formData.weight}
            onChange={handleChange}
            required={true}
          />
        </div>

        <SelectInput
          name="bloodType"  // Changed from bloodGroup to bloodType
          label="Blood Type"
          className={"mb-4"}
          placeholder={"Select your blood type"}
          value={formData.bloodType}
          onChange={handleChange}
          options={[
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

        <StepButtons 
          onNext={handleSubmit} 
          onPrevious={onPrevious}
          nextDisabled={!isFormValid}
          isLoading={isLoading}
        />
    </div>
  );
}