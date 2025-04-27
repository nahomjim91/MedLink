"use client";
import { useState } from "react";
import { Button, StepButtons } from "@/components/ui/Button";
import {
  DateInput,
  NumberInput,
  SelectInput,
  TextInput,
} from "@/components/ui/Input";

export default function UserInfoForm({
  userData,
  onUpdate,
  onNext,
  onPrevious,
}) {
  const [formData, setFormData] = useState({
    firstName: userData.firstName || "",
    lastName: userData.lastName || "",
    gender: userData.gender || "",
    dateOfBirth: userData.dateOfBirth || "",
    phoneNumber: userData.phoneNumber || "",
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
    formData.firstName.trim() !== "" &&
    formData.lastName.trim() !== "" &&
    formData.gender.trim() !== "" &&
    formData.dateOfBirth.trim() !== "" &&
    formData.phoneNumber.trim() !== "";

  return (
    <div className="px-6 ">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-secondary/80 mb-2">
          Personal Information
        </h2>
        <p className="text-sm text-secondary/60">Tell us more about yourself</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid md:grid-cols-2 gap-4">
          <TextInput
            name="firstName"
            label="First Name"
            className={"mb-4"}
            placeholder={"Enter your first name"}
            value={formData.firstName}
            onChange={handleChange}
            required={true}
          />
          <TextInput
            name="lastName"
            label="Last Name"
            className={"mb-4"}
            placeholder={"Enter your last name"}
            value={formData.lastName}
            onChange={handleChange}
            required={true}
          />
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <SelectInput
            name="gender"
            label="Gender"
            className={"mb-4"}
            placeholder={"Select your gender"}
            value={formData.country}
            onChange={handleChange}
            options={[
              { value: "M", label: "Male" },
              { value: "F", label: "Female" },
              { value: "O", label: "Other" },
              { value: "P", label: "Prefer not to say" },
            ]}
            required={true}
          />

          <DateInput
            label="Date of Birth"
            value={formData.dateOfBirth}
            onChange={handleChange}
            min="1900-01-01" // Minimum date (adjust as needed)
            max={new Date().toISOString().split("T")[0]} // Today's date as max
            // error={dateError}
            errorMessage="Please select a valid date"
            required
            fullWidth
          />
        </div>
        <TextInput
          name="phoneNumber"
          type="tel"
          label="Phone Number"
          className={"mb-4"}
          placeholder={"Enter your phone number"}
          value={formData.phoneNumber}
          onChange={handleChange}
          required={true}
        />

        <StepButtons onNext={onNext} onPrevious={onPrevious} />
      </form>
    </div>
  );
}
