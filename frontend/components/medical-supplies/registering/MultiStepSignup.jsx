"use client";
import { useState } from "react";
import RoleSelection from "./RoleSelection";

import CompanyInfoForm from "./CompanyInfoForm";
import ProfileUpload from "./ProfileUpload";
import SignupSuccess from "./SignupSuccess";
import { StepProgressIndicator } from "@/components/ui/StepProgressIndicator";

export default function MultiStepSignup({ email }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [userData, setUserData] = useState({
    role: "", // patient, doctor, or admin
    email: email || "", // Pre-filled email if available
    companyName: "",
    contactName: "",
    dateOfBirth: "",
    companyPhoneNumber: "",
    address: "",
    profileImage: null,
    EFDA: null,
    license: null,
  });

  // Total number of steps depends on the selected role
  const getTotalSteps = () => {
    switch (userData.role) {
      default:
        return 4; // Default to maximum
    }
  };

  const handleNext = () => {
    setCurrentStep((prev) => Math.min(prev + 1, getTotalSteps()));
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const updateUserData = (newData) => {
    setUserData((prev) => ({ ...prev, ...newData }));
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
          />
        );

      case 2:
        return (
          <CompanyInfoForm
            userData={userData}
            onUpdate={updateUserData}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onEFDAUpload={(EFDA) => updateUserData({ EFDA })}
            onLicenseUpload={(license) => updateUserData({ license })}
          />
        );
      case 3:
        // For patients and admins, show document upload at step 4
        return (
          <ProfileUpload
            onProfileImageUpload={(profileImage) =>
              updateUserData({ profileImage })
            }
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );

      default:
        return <SignupSuccess userData={userData} />;
    }
  };

  return (
    <div className="w-full max-w-md md:max-w-3xl mx-auto bg-white rounded-2xl shadow-md p-6 md:py-6 md:px-12">
      <h1 className="text-2xl font-bold text-center mb-6">
        Finishing Registering
      </h1>

      {/* Progress indicator */}
      <StepProgressIndicator
        currentStep={currentStep}
        totalSteps={getTotalSteps()}
        className="mb-8"
      />

      {/* Current step content */}
      {renderStep()}
    </div>
  );
}
