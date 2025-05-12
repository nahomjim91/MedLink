"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMSAuth } from "../../../hooks/useMSAuth";
import { useMutation } from "@apollo/client";
import { COMPLETE_MS_REGISTRATION } from "../../../api/graphql/mutations";
import RoleSelection from "./RoleSelection";
import CompanyInfoForm from "./CompanyInfoForm";
import ProfileUpload from "./ProfileUpload";
import ConfirmationStep from "./ConfirmationStep";
import SignupSuccess from "./SignupSuccess";
import { StepProgressIndicator } from "../../ui/StepProgressIndicator";
import client from "../../../api/graphql/client";

export default function MultiStepSignup({ email }) {
  const router = useRouter();
  const { user } = useMSAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [registrationComplete, setRegistrationComplete] = useState(false);

  // Initialize userData with values from auth context if available
  const [userData, setUserData] = useState({
    role: user?.role || "", // facility, supplier, or admin
    email: email || user?.email || "",
    companyName: user?.companyName || "",
    contactName: user?.contactName || "",
    phoneNumber: user?.phoneNumber || "",
    address: {
      street: user?.address?.street || "",
      city: user?.address?.city || "",
      state: user?.address?.state || "",
      country: user?.address?.country || "",
      postalCode: user?.address?.postalCode || "",
      geoLocation: user?.address?.geoLocation || {
        latitude: null,
        longitude: null,
      },
      geoLocationText: user?.address?.geoLocationText || "",
    },
    profileImage: null,
    efdaLicenseUrl: user?.efdaLicenseUrl || "",
    businessLicenseUrl: user?.businessLicenseUrl || "",
  });

  // Set up GraphQL mutation
  const [completeMSRegistration] = useMutation(COMPLETE_MS_REGISTRATION, {
    client,
  });

  // Pre-fill form fields if user data is available
  useEffect(() => {
    if (user) {
      setUserData((prevData) => ({
        ...prevData,
        role: user.role || prevData.role,
        email: user.email || prevData.email,
        companyName: user.companyName || prevData.companyName,
        contactName: user.contactName || prevData.contactName,
        phoneNumber: user.phoneNumber || prevData.phoneNumber,
        address: {
          street: user?.address?.street || prevData.address.street,
          city: user?.address?.city || prevData.address.city,
          state: user?.address?.state || prevData.address.state,
          country: user?.address?.country || prevData.address.country,
          postalCode: user?.address?.postalCode || prevData.address.postalCode,
          geoLocation:
            user?.address?.geoLocation || prevData.address.geoLocation,
          geoLocationText:
            user?.address?.geoLocationText || prevData.address.geoLocationText,
        },
        efdaLicenseUrl: user.efdaLicenseUrl || prevData.efdaLicenseUrl,
        businessLicenseUrl:
          user.businessLicenseUrl || prevData.businessLicenseUrl,
      }));
    }
  }, [user]);

  // Total number of steps depends on the selected role
  const getTotalSteps = () => {
    switch (userData.role) {
      case "health Facility":
      case "supplier":
      case "importer":
      case "admin":
        return 5; // Role, Company Info, Profile Upload, Confirmation, Success
      default:
        return 5; // Default to maximum
    }
  };

  // Function to remove __typename from objects
  const removeTypename = (obj) => {
    if (obj === null || typeof obj !== "object") return obj;

    const newObj = { ...obj };
    delete newObj.__typename;

    // Recursively remove __typename from nested objects
    for (const key in newObj) {
      if (newObj[key] && typeof newObj[key] === "object") {
        newObj[key] = removeTypename(newObj[key]);
      }
    }

    return newObj;
  };

  const handleNext = async () => {
    // If at the confirmation step, save user data
    if (currentStep === getTotalSteps() - 1) {
      await saveUserData();
      return;
    }

    // For intermediate steps, only validate and update local state
    if (currentStep < getTotalSteps()) {
      // For step 1 (RoleSelection), validate the role is selected
      if (currentStep === 1) {
        if (!userData.role) {
          setError("Please select a role to continue.");
          return;
        }
      }

      // Move to next step
      setCurrentStep((prev) => Math.min(prev + 1, getTotalSteps()));
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const updateUserData = (newData) => {
    console.log("Updating user data:", newData);
    setUserData((prev) => ({ ...prev, ...newData }));
  };

  // Handler for company information form
  const handleCompanyInfoUpdate = (data) => {
    updateUserData(data);
  };

  // Handle profile image upload
  const handleProfileImageUpload = (file) => {
    updateUserData({ profileImage: file });
  };

  // Handle license uploads
  const handleEFDAUpload = (url) => {
    updateUserData({ efdaLicenseUrl: url });
  };

  const handleLicenseUpload = (url) => {
    updateUserData({ businessLicenseUrl: url });
  };

  // Save all user data via GraphQL - only called after confirmation
  const saveUserData = async () => {
    if (!user?.uid) {
      setError("No user authenticated. Please log in again.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Validate required fields before submission
      const requiredBaseFields = [
        "role",
        "companyName",
        "contactName",
        "phoneNumber",
      ];

      for (const field of requiredBaseFields) {
        if (!userData[field]) {
          setError(`Please complete all required fields. Missing: ${field}`);
          setIsLoading(false);
          return;
        }
      }

      // Validate address fields
      const requiredAddressFields = [
        "street",
        "city",
        "state",
        "country",
        "postalCode",
      ];
      for (const field of requiredAddressFields) {
        if (!userData.address[field]) {
          setError(`Please complete all address fields. Missing: ${field}`);
          setIsLoading(false);
          return;
        }
      }

      // For suppliers and facilities, validate licenses
      // if ((userData.role === "supplier" || userData.role === "health Facility" || userData.role === "importer") &&
      //     (!userData.efdaLicenseUrl || !userData.businessLicenseUrl)) {
      //   setError("Please upload all required license documents.");
      //   setIsLoading(false);
      //   return;
      // }

      // Prepare data for GraphQL mutation
      const input = {
        email: userData.email,
        role: userData.role,
        companyName: userData.companyName,
        contactName: userData.contactName,
        phoneNumber: userData.phoneNumber,
        address: {
          street: userData.address.street,
          city: userData.address.city,
          state: userData.address.state,
          country: userData.address.country,
          postalCode: userData.address.postalCode,
          geoLocation: userData.address.geoLocation,
          geoLocationText: userData.address.geoLocationText,
        },
        profileImageUrl: userData.profileImage?.url || null,
        efdaLicenseUrl: userData.efdaLicenseUrl,
        businessLicenseUrl: userData.businessLicenseUrl,
      };

      console.log("Submitting registration data:", input);

      const cleanInput = removeTypename(input);
      console.log("Cleaned input:", cleanInput);

      // Call the completeMSRegistration mutation
      const { data } = await completeMSRegistration({
        variables: {
          input: cleanInput,
        },
      });

      console.log("Registration response:", data);

      if (!data || !data.completeMSRegistration) {
        throw new Error("Registration failed - no data returned");
      }

      // Force refresh Apollo client cache
      await client.refetchQueries({
        include: ["msMe"],
      });

      // Mark registration as complete and move to success step
      setRegistrationComplete(true);
      setCurrentStep(getTotalSteps()); // Move to success step
    } catch (error) {
      console.error("Error saving user data:", error);
      setError(`Failed to complete registration: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Navigate to dashboard after completion
  const handleComplete = () => {
    router.push(`/medical-supplies/${userData.role}`);
  };

  // Render the appropriate step component
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <RoleSelection
            selectedRole={userData.role}
            onRoleSelect={(role) => updateUserData({ role })}
            onNext={handleNext}
            isLoading={isLoading}
          />
        );

      case 2:
        return (
          <CompanyInfoForm
            userData={userData}
            onUpdate={handleCompanyInfoUpdate}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onEFDAUpload={handleEFDAUpload}
            onLicenseUpload={handleLicenseUpload}
            isLoading={isLoading}
          />
        );

      case 3:
        return (
          <ProfileUpload
            profileImage={userData.profileImage}
            onProfileImageUpload={handleProfileImageUpload}
            onNext={handleNext}
            onPrevious={handlePrevious}
            isLoading={isLoading}
          />
        );

      case 4:
        return (
          <ConfirmationStep
            userData={userData}
            onNext={handleNext}
            onPrevious={handlePrevious}
            isLoading={isLoading}
          />
        );

      case 5:
        return (
          <SignupSuccess
            userData={userData}
            onComplete={handleComplete}
            message="Your registration is complete! Your account is pending approval from our administrators. You will be notified once your account is approved."
          />
        );

      default:
        return null;
    }
  };

  // For debugging
  useEffect(() => {
    console.log("Current userData state:", userData);
  }, [userData]);

  return (
    <div className="w-full max-w-md md:max-w-3xl mx-auto bg-white rounded-2xl shadow-md p-6 md:py-6 md:px-12">
      <h1 className="text-2xl font-bold text-center mb-6">
        Complete Your Registration
      </h1>

      {/* Error message display */}
      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4"
          role="alert"
        >
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* Progress indicator - Hide on success page */}
      {currentStep < getTotalSteps() && (
        <StepProgressIndicator
          currentStep={currentStep}
          totalSteps={getTotalSteps() - 1} // Don't count success step in the progress
          className="mb-8"
        />
      )}

      {/* Current step content */}
      {renderStep()}
    </div>
  );
}
