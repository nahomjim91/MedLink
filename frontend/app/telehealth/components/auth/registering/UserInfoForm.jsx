"use client";
import { useState, useEffect } from "react";
import { Button, StepButtons } from "../../ui/Button";
import { DateInput, NumberInput, SelectInput, TextInput } from "../../ui/Input";

export default function UserInfoForm({
  userData,
  onUpdate,
  onNext,
  onPrevious,
  isLoading,
}) {
  const [formData, setFormData] = useState({
    firstName: userData.firstName || "",
    lastName: userData.lastName || "",
    gender: userData.gender || "",
    dateOfBirth: userData.dateOfBirth || "",
    phoneNumber: userData.phoneNumber || "",
  });

  const [errors, setErrors] = useState({});

  // Update local form state when userData prop changes
  useEffect(() => {
    setFormData({
      firstName: userData.firstName || "",
      lastName: userData.lastName || "",
      gender: userData.gender || "",
      dateOfBirth: userData.dateOfBirth || "",
      phoneNumber: userData.phoneNumber || "",
    });
  }, [userData]);

  // Enhanced validation functions
  const isValidEthiopianPhone = (phone) => {
    const digitsOnly = phone.replace(/\D/g, "");
    return (
      digitsOnly.length === 10 &&
      (digitsOnly.startsWith("09") || digitsOnly.startsWith("07"))
    );
  };

  const isValidName = (name) => {
    return name.trim().length >= 2 && /^[a-zA-Z\s'-]+$/.test(name.trim());
  };

  const isValidAge = (dateOfBirth) => {
    if (!dateOfBirth) return false;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age >= 18 && age <= 120; // Must be between 18 and 120 years old
  };

  const validateField = (name, value) => {
    let error = "";

    switch (name) {
      case "firstName":
        if (!value.trim()) {
          error = "First name is required";
        } else if (!isValidName(value)) {
          if (value.trim().length < 2) {
            error = "First name must be at least 2 characters long";
          } else {
            error = "First name can only contain letters, spaces, hyphens, and apostrophes";
          }
        }
        break;

      case "lastName":
        if (!value.trim()) {
          error = "Last name is required";
        } else if (!isValidName(value)) {
          if (value.trim().length < 2) {
            error = "Last name must be at least 2 characters long";
          } else {
            error = "Last name can only contain letters, spaces, hyphens, and apostrophes";
          }
        }
        break;

      case "gender":
        if (!value || value === "") {
          error = "Please select your gender";
        }
        break;

      case "dateOfBirth":
        if (!value) {
          error = "Date of birth is required";
        } else if (!isValidAge(value)) {
          const today = new Date();
          const birthDate = new Date(value);
          let age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();

          if (
            monthDiff < 0 ||
            (monthDiff === 0 && today.getDate() < birthDate.getDate())
          ) {
            age--;
          }

          if (age < 18) {
            error = "You must be at least 18 years old to register";
          } else if (age > 120) {
            error = "Please enter a valid date of birth";
          } else {
            error = "Please enter a valid date of birth";
          }
        }
        break;

      case "phoneNumber":
        if (!value.trim()) {
          error = "Phone number is required";
        } else if (!isValidEthiopianPhone(value)) {
          const digitsOnly = value.replace(/\D/g, "");
          if (digitsOnly.length !== 10) {
            error = "Phone number must be exactly 10 digits";
          } else if (!digitsOnly.startsWith("09") && !digitsOnly.startsWith("07")) {
            error = "Phone number must start with 09 or 07";
          } else {
            error = "Please enter a valid Ethiopian phone number";
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
    console.log("Field changed:", name, "Value:", value);
    
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

  // Enhanced form validation
  const isFormValid = () => {
    const validations = {
      firstName: formData.firstName && isValidName(formData.firstName),
      lastName: formData.lastName && isValidName(formData.lastName),
      gender: formData.gender && formData.gender !== "",
      dateOfBirth: formData.dateOfBirth && isValidAge(formData.dateOfBirth),
      phoneNumber: formData.phoneNumber && isValidEthiopianPhone(formData.phoneNumber),
    };

    return (
      validations.firstName &&
      validations.lastName &&
      validations.gender &&
      validations.dateOfBirth &&
      validations.phoneNumber &&
      Object.keys(errors).every(key => !errors[key])
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted:", isValidAge(formData.dateOfBirth));
    
    if (validateForm()) {
      // Update parent component with form data
      onUpdate(formData);
      onNext();
    }
  };

  return (
    <div className="px-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-secondary/80 mb-2">
          Personal Information
        </h2>
        <p className="text-sm text-secondary/60">Tell us more about yourself</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid md:grid-cols-2 md:gap-4">
          <div className="mb-4">
            <TextInput
              name="firstName"
              label="First Name"
              validation="name"
              placeholder="Enter your first name"
              value={formData.firstName}
              onChange={handleChange}
              required={true}
            />
            {errors.firstName && (
              <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
            )}
          </div>
          
          <div className="mb-4">
            <TextInput
              name="lastName"
              label="Last Name"
              validation="name"
              placeholder="Enter your last name"
              value={formData.lastName}
              onChange={handleChange}
              required={true}
            />
            {errors.lastName && (
              <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 md:gap-4">
          <div className="mb-4">
            <SelectInput
              name="gender"
              label="Gender"
              placeholder="Select your gender"
              value={formData.gender}
              onChange={handleChange}
              options={[
                { value: "", label: "Select your gender" },
                { value: "M", label: "Male" },
                { value: "F", label: "Female" },
              ]}
              required={true}
            />
            {errors.gender && (
              <p className="text-red-500 text-xs mt-1">{errors.gender}</p>
            )}
          </div>
          
          <div className="mb-4">
            <DateInput
              label="Date of Birth"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              min="1900-01-01"
              max={new Date().toISOString().split("T")[0]} // Today's date as max
              errorMessage="Please select a valid date (must be 18+ years old)"
              required={true}
              fullWidth
            />
            {errors.dateOfBirth && (
              <p className="text-red-500 text-xs mt-1">{errors.dateOfBirth}</p>
            )}
          </div>
        </div>

        <div className="mb-4">
          <TextInput
            name="phoneNumber"
            type="tel"
            label="Phone Number"
            validation="phoneEthiopia"
            placeholder="0912345678 or 0712345678"
            value={formData.phoneNumber}
            onChange={handleChange}
            required={true}
          />
          {errors.phoneNumber && (
            <p className="text-red-500 text-xs mt-1">{errors.phoneNumber}</p>
          )}
          <p className="text-xs text-secondary/50 mt-1">
            Enter 10-digit Ethiopian phone number starting with 09 or 07
          </p>
        </div>

        <StepButtons
          onNext={handleSubmit}
          onPrevious={onPrevious}
          isLoading={isLoading}
          nextDisabled={!isFormValid()}
        />
      </form>
    </div>
  );
}