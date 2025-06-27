"use client";
import React, { useState, useEffect } from "react";
import { X, Save, Loader2 } from "lucide-react";
import { useProfileUpdate } from "../../hooks/useProfileUpdate";
import { NumberInput, SelectInput, TextInput } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import ProfileImage from "../../components/ui/ProfileImage";
import { tr } from "date-fns/locale";

export default function EditProfileModal({ isOpen, onClose, user, onSuccess }) {
  const [errors, setErrors] = useState({});

  // Initialize the hook with user data
  const initialData = {
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    phoneNumber: user?.phoneNumber || "",
    bloodType: user?.patientProfile?.bloodType || "",
    weight: user?.patientProfile?.weight || "",
    height: user?.patientProfile?.height || "",
    profileImageUrl: user?.profileImageUrl || "",
  };
  console.log("Initial data:", initialData);

  const {
    formData,
    handleInputChange,
    handleSave,
    loading,
    error,
    updateFormData,
  } = useProfileUpdate("PATIENT", initialData);

  // Update form data when modal opens or user data changes
  useEffect(() => {
    if (isOpen && user) {
      const userData = {
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phoneNumber: user.phoneNumber || "",
        bloodType: user.patientProfile?.bloodType || "",
        weight: user.patientProfile?.weight || "",
        height: user.patientProfile?.height || "",
        profileImageUrl: user.profileImageUrl || "",
      };
      updateFormData(userData);
      setErrors({});
    }
  }, [isOpen, user, updateFormData]);

  // Validation functions
  const isValidName = (name) => {
    return name.trim().length >= 2 && /^[a-zA-Z\s'-]+$/.test(name.trim());
  };

  const isValidEthiopianPhone = (phone) => {
    const digitsOnly = phone.replace(/\D/g, "");
    return (
      digitsOnly.length === 10 &&
      (digitsOnly.startsWith("09") || digitsOnly.startsWith("07"))
    );
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
            error =
              "First name can only contain letters, spaces, hyphens, and apostrophes";
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
            error =
              "Last name can only contain letters, spaces, hyphens, and apostrophes";
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
          } else if (
            !digitsOnly.startsWith("09") &&
            !digitsOnly.startsWith("07")
          ) {
            error = "Phone number must start with 09 or 07";
          } else {
            error = "Please enter a valid Ethiopian phone number";
          }
        }
        break;

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
            error =
              "Height seems too low. Please verify (minimum realistic: 100cm)";
          } else if (heightValue > 250) {
            error =
              "Height seems too high. Please verify (maximum realistic: 250cm)";
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
            error =
              "Weight seems too low. Please verify (minimum realistic: 20kg)";
          } else if (weightValue > 300) {
            error =
              "Weight seems too high. Please verify (maximum realistic: 300kg)";
          }
        }
        break;

      case "bloodType":
        if (!value || !value.toString().trim()) {
          error = "Blood type is required";
        } else {
          const validBloodTypes = [
            "A+",
            "B+",
            "AB+",
            "O+",
            "A-",
            "B-",
            "AB-",
            "O-",
          ];
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

    // Update form data using the hook's method
    handleInputChange(name, value);

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

  const isFormValid = () => {
    return (
      formData.firstName?.trim() !== "" &&
      formData.lastName?.trim() !== "" &&
      formData.phoneNumber?.trim() !== "" &&
      formData.height?.toString().trim() !== "" &&
      formData.weight?.toString().trim() !== "" &&
      formData.bloodType?.toString().trim() !== "" &&
      Object.keys(errors).every((key) => !errors[key])
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const result = await handleSave();

      if (result.success) {
        // Process the data for the callback
        const processedData = {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          phoneNumber: formData.phoneNumber.trim(),
          bloodType: formData.bloodType,
          height: parseFloat(formData.height),
          weight: parseFloat(formData.weight),
          profileImageUrl: formData.profileImageUrl,
        };

        if (onSuccess) {
          onSuccess(processedData);
        }

        onClose();
      } else {
        console.error("Error updating profile:", result.error);
        // You might want to show a toast or error message here
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      // You might want to show a toast or error message here
    }
  };

  const handleClose = () => {
    if (!loading) {
      setErrors({});
      onClose();

    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 bg-opacity-10 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] scrollbar-hide overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Edit Profile</h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-4">
                Personal Information
              </h3>

              <ProfileImage
                    profileImageUrl ={formData.profileImageUrl }
                    altText="Profile"
                    isEditing={true}
                    userName={formData.firstName}
                    onImageChange={(value) => handleInputChange("profileImageUrl", value)}
                  />

              <div className="grid grid-cols-2 gap-4">
                <TextInput
                  name="firstName"
                  label="First Name"
                  value={formData.firstName}
                  onChange={handleChange}
                  error={errors.firstName}
                  placeholder="Enter your first name"
                  required
                />

                <TextInput
                  name="lastName"
                  label="Last Name"
                  value={formData.lastName}
                  onChange={handleChange}
                  error={errors.lastName}
                  placeholder="Enter your last name"
                  required
                />
              </div>

              <TextInput
                name="phoneNumber"
                label="Phone Number"
                value={formData.phoneNumber}
                onChange={handleChange}
                error={errors.phoneNumber}
                placeholder="0912345678 or 0712345678"
                required
              />
            </div>

            {/* Health Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-4">
                Health Information
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <NumberInput
                  name="height"
                  label="Height (cm)"
                  value={formData.height}
                  onChange={handleChange}
                  error={errors.height}
                  placeholder="Enter height in cm"
                  min={30}
                  max={300}
                  required
                />

                <NumberInput
                  name="weight"
                  label="Weight (kg)"
                  value={formData.weight}
                  onChange={handleChange}
                  error={errors.weight}
                  placeholder="Enter weight in kg"
                  min={1}
                  max={1000}
                  required
                />
              </div>

              <SelectInput
                name="bloodType"
                label="Blood Type"
                value={formData.bloodType}
                onChange={handleChange}
                error={errors.bloodType}
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
                required
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              color="error"
              onClick={handleClose}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={!isFormValid() || loading}
              className="flex-1 flex items-center justify-around *:disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}