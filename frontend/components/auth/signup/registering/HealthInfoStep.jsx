"use client";
import { useState } from "react";
import { StepButtons } from "@/components/ui/Button";
import { NumberInput, SelectInput, TextInput } from "@/components/ui/Input";

export default function HealthInfoStep({
  hegiht,
  weight,
  bloodGroup,
  onUpdate,
  onNext,
  onPrevious,
}) {
  const [formData, setFormData] = useState({
    hegiht: hegiht || "",
    weight: weight || "",
    bloodGroup: bloodGroup || "",
  });

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
    formData.hegiht.trim() !== "" && formData.weight.trim() !== "";

  return (
    <div className="px-6 ">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-secondary/80 mb-2">
          Patient Information
        </h2>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid md:grid-cols-2 gap-4">
          <NumberInput
            name="hegiht"
            label="Height (cm)"
            placeholder={"Enter your height in cm"}
            className={"mb-4"}
            value={formData.hegiht}
            onChange={handleChange}
          />

          <NumberInput
            name="weight"
            label="Weight (kg)"
            placeholder={"Enter your weight in kg"}
            className={"mb-4"}
            value={formData.weight}
            onChange={handleChange}
          />
        </div>

        <SelectInput
          name="bloodGroup"
          label="Blood Group"
          className={"mb-4"}
          placeholder={"Select your blood group"}
          value={formData.bloodGroup}
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

        <StepButtons onNext={onNext} onPrevious={onPrevious} />
      </form>
    </div>
  );
}
