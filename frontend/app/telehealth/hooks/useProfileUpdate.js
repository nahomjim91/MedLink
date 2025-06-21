// hooks/useProfileUpdate.js
import { useState, useCallback } from "react";
import { useMutation } from "@apollo/client";
import {
  UPDATE_USER_PROFILE,
  UPDATE_DOCTOR_PROFILE,
  UPDATE_PATIENT_PROFILE,
} from "../api/graphql/mutations";

export const useProfileUpdate = (userRole, initialData = {}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(initialData);
  const [hasChanges, setHasChanges] = useState(false);

  // Mutations based on role
  const [updateUserProfile, { loading: userLoading, error: userError }] =
    useMutation(UPDATE_USER_PROFILE);
  const [updateDoctorProfile, { loading: doctorLoading, error: doctorError }] =
    useMutation(UPDATE_DOCTOR_PROFILE);
  const [
    updatePatientProfile,
    { loading: patientLoading, error: patientError },
  ] = useMutation(UPDATE_PATIENT_PROFILE);

  // Get appropriate mutation and loading state based on role
  const getMutationConfig = () => {
    switch (userRole.toUpperCase()) {
      case "DOCTOR":
        return {
          userMutation: updateUserProfile,
          profileMutation: updateDoctorProfile,
          loading: userLoading || doctorLoading,
          error: userError || doctorError,
        };
      case "PATIENT":
        return {
          userMutation: updateUserProfile,
          profileMutation: updatePatientProfile,
          loading: userLoading || patientLoading,
          error: userError || patientError,
        };
      case "ADMIN":
        return {
          userMutation: updateUserProfile,
          profileMutation: null,
          loading: userLoading,
          error: userError,
        };
      default:
        return {
          userMutation: updateUserProfile,
          profileMutation: null,
          loading: userLoading,
          error: userError,
        };
    }
  };

  const { userMutation, profileMutation, loading, error } = getMutationConfig();

  // Helper function to safely convert to number
  const safeParseFloat = (value) => {
    if (value === null || value === undefined || value === "") {
      return 0;
    }
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  };

  const safeParseInt = (value) => {
    if (value === null || value === undefined || value === "") {
      return 0;
    }
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Handle input changes
  const handleInputChange = useCallback(
    (field, value) => {
      setFormData((prev) => {
        const newData = { ...prev, [field]: value };

        // Check if there are changes compared to initial data
        const hasChanges = Object.keys(newData).some((key) => {
          const currentValue = newData[key];
          const initialValue = initialData[key];
          
          // Handle array comparison for specialization
          if (Array.isArray(currentValue) && Array.isArray(initialValue)) {
            return JSON.stringify(currentValue) !== JSON.stringify(initialValue);
          }
          
          // Handle number comparison
          if (typeof currentValue === 'number' && typeof initialValue === 'number') {
            return currentValue !== initialValue;
          }
          
          // Handle string/number comparison (like pricePerSession)
          if (field === 'pricePerSession' || field === 'experienceYears') {
            return safeParseFloat(currentValue) !== safeParseFloat(initialValue);
          }
          
          return currentValue !== initialValue;
        });
        
        setHasChanges(hasChanges);
        return newData;
      });
    },
    [initialData]
  );

  // Handle array field changes (like specialization)
  const handleArrayFieldChange = useCallback(
    (field, value) => {
      const arrayValue =
        typeof value === "string"
          ? value
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean)
          : value;
      handleInputChange(field, arrayValue);
    },
    [handleInputChange]
  );

  // Prepare data for mutations
  const prepareUserData = (data) => {
    const userData = {};
    const userFields = [
      "firstName",
      "lastName",
      "phoneNumber",
      "gender",
      "dob",
      "role",
      "profileImageUrl",
    ];

    userFields.forEach((field) => {
      if (data[field] !== undefined && data[field] !== "" && data[field] !== null) {
        userData[field] = data[field];
      }
    });

    return userData;
  };

  const prepareDoctorData = (data) => {
    const doctorData = {};
    // Only include doctor-specific fields, not user profile fields
    const doctorOnlyFields = [
      "specialization",
      "experienceYears", 
      "aboutMe",
      "telehealthWalletBalance",
      "pricePerSession",
    ];

    console.log("Preparing doctor data from:", data);

    doctorOnlyFields.forEach((field) => {
      console.log(`Processing field ${field}:`, data[field]);
      
      if (field === "experienceYears") {
        // Convert to integer for experience years
        const experienceValue = safeParseInt(data[field]);
        doctorData[field] = experienceValue;
        console.log(`Set ${field} to:`, experienceValue);
      } else if (field === "pricePerSession") {
        // Convert to float for price per session - always include
        const priceValue = safeParseFloat(data[field]);
        doctorData[field] = priceValue;
        console.log(`Set ${field} to:`, priceValue);
      } else if (field === "telehealthWalletBalance") {
        // Convert to float for wallet balance
        const balanceValue = safeParseFloat(data[field]);
        doctorData[field] = balanceValue;
        console.log(`Set ${field} to:`, balanceValue);
      } else if (field === "specialization") {
        // Handle specialization array
        if (Array.isArray(data[field])) {
          doctorData[field] = data[field];
        } else if (typeof data[field] === "string" && data[field].trim() !== "") {
          doctorData[field] = [data[field].trim()];
        } else {
          doctorData[field] = [];
        }
        console.log(`Set ${field} to:`, doctorData[field]);
      } else if (field === "aboutMe") {
        // Include aboutMe even if empty string
        doctorData[field] = data[field] || "";
        console.log(`Set ${field} to:`, doctorData[field]);
      }
    });

    console.log("Final doctor data:", doctorData);
    return doctorData;
  };

  const preparePatientData = (data) => {
    const patientData = {};
    const patientFields = [
      "height",
      "weight",
      "bloodType",
      "telehealthWalletBalance",
    ];

    patientFields.forEach((field) => {
      if (data[field] !== undefined && data[field] !== "" && data[field] !== null) {
        if (field === "height" || field === "weight" || field === "telehealthWalletBalance") {
          const numericValue = safeParseFloat(data[field]);
          if (numericValue >= 0) {
            patientData[field] = numericValue;
          }
        } else {
          patientData[field] = data[field];
        }
      }
    });

    return patientData;
  };

  // Save function
  const handleSave = useCallback(async () => {
    try {
      console.log("Saving profile data:", formData);
      console.log("User role:", userRole);
      
      const userData = prepareUserData(formData);
      let profileData = {};

      // Prepare profile data based on role
      if (userRole === "DOCTOR") {
        profileData = prepareDoctorData(formData);
        console.log("Doctor profile data prepared:", profileData);
      } else if (userRole === "PATIENT") {
        profileData = preparePatientData(formData);
        console.log("Patient profile data prepared:", profileData);
      }

      console.log("Prepared user data:", userData);
      console.log("Prepared profile data:", profileData);
      console.log("Profile mutation exists:", !!profileMutation);

      // Execute mutations
      const promises = [];

      // Update user profile if there's user data
      if (Object.keys(userData).length > 0) {
        console.log("Adding user profile update to promises");
        promises.push(
          userMutation({ variables: { input: userData } }).then(result => {
            console.log("User profile update result:", result);
            return result;
          })
        );
      }

      // Update role-specific profile - ALWAYS attempt if we have the mutation and are DOCTOR/PATIENT
      if (profileMutation && (userRole.toUpperCase() === "DOCTOR" || userRole.toUpperCase() === "PATIENT")) {
        console.log("Adding profile update to promises with data:", profileData);
        promises.push(
          profileMutation({ variables: { input: profileData } }).then(result => {
            console.log("Profile update result:", result);
            return result;
          }).catch(error => {
            console.error("Profile mutation error:", error);
            throw error;
          })
        );
      } else {
        console.log("Skipping profile mutation:", {
          hasMutation: !!profileMutation,
          userRole,
          isDoctor: userRole === "DOCTOR",
          isPatient: userRole === "PATIENT"
        });
      }

      console.log("Total promises to execute:", promises.length);

      // Wait for all mutations to complete
      const results = await Promise.all(promises);
      console.log("All mutations completed:", results);

      // Reset state
      setIsEditing(false);
      setHasChanges(false);

      return { success: true, results };
    } catch (err) {
      console.error("Error saving profile:", err);
      return { success: false, error: err.message };
    }
  }, [formData, userRole, userMutation, profileMutation]);

  // Cancel editing
  const handleCancel = useCallback(() => {
    setFormData(initialData);
    setIsEditing(false);
    setHasChanges(false);
  }, [initialData]);

  // Start editing
  const handleEdit = useCallback(() => {
    setIsEditing(true);
  }, []);

  // Reset form data when initial data changes
  const updateFormData = useCallback((newData) => {
    console.log("Updating form data:", newData);
    setFormData(newData);
    setHasChanges(false);
  }, []);

  return {
    // State
    isEditing,
    formData,
    hasChanges,
    loading,
    error,

    // Actions
    handleInputChange,
    handleArrayFieldChange,
    handleSave,
    handleCancel,
    handleEdit,
    updateFormData,

    // Utilities
    setIsEditing,
    setFormData,
  };
};