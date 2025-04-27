"use client";
import { useState } from "react";
import RoleSelection from "./RoleSelection";

import UserInfoForm from "./UserInfoForm";
import SpecializationForm from "./SpecializationForm";
import ProfileUpload from "./ProfileUpload";
import SignupSuccess from "./SignupSuccess";
import { StepProgressIndicator } from "@/components/ui/StepProgressIndicator";
import HealthInfoStep from "./HealthInfoStep";

export default function MultiStepSignup({ email }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [userData, setUserData] = useState({
    role: "", // patient, doctor, or admin
    email: email || "", // Pre-filled email if available
    password: "",
    firstName: "",
    lastName: "",
    gender: "",
    dateOfBirth: "",
    phoneNumber: "",
    // Patient specific fields
    hegiht: "",
    weight: "",
    bloodType: "",
    // Doctor specific fields
    specialization: "",
    experienceYears: "",
    aboutYou: "",
    certificates: null,
    profileImage: null,
  });

  // Total number of steps depends on the selected role
  const getTotalSteps = () => {
    switch (userData.role) {
      case "doctor":
        return 5; // Role, Register, Personal Info, Specialization, Document Upload
      case "patient":
        return 5; // Role, Register, Personal Info, Document Upload
      case "admin":
        return 4; // Role, Register, Personal Info, Document Upload
      default:
        return 5; // Default to maximum
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
          <UserInfoForm
            userData={userData}
            onUpdate={updateUserData}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 3:
        // If user is a doctor, show specialization form at step 4
        if (userData.role === "doctor") {
          return (
            <SpecializationForm
              specialization={userData.specialization}
              experienceYears={userData.experienceYears}
              certificates={userData.certificates}

              aboutYou={userData.aboutYou}
              onUpdate={updateUserData}
              onDocumentsUpload={(certificates) =>
                updateUserData({ certificates })
              }
              onNext={handleNext}
              onPrevious={handlePrevious}
            />
          );
        }
        if (userData.role === "patient") {
          return (
            <HealthInfoStep
              onUpdate={updateUserData}
              hegiht={userData.hegiht}
              weight={userData.weight}
              bloodType={userData.bloodType}
              onNext={handleNext}
              onPrevious={handlePrevious}
            />
          );
        }
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
      case 4:
        // For doctors, show document upload at step 5
        if (userData.role === "doctor") {
          return (
            <ProfileUpload
              onProfileImageUpload={(profileImage) =>
                updateUserData({ profileImage })
              }
              onNext={handleNext}
              onPrevious={handlePrevious}
            />
          );
        }
        if (userData.role === "patient") {
          return (
            <ProfileUpload
              onProfileImageUpload={(profileImage) =>
                updateUserData({ profileImage })
              }
              onNext={handleNext}
              onPrevious={handlePrevious}
            />
          );
        }
        // For others, show success
        return <SignupSuccess userData={userData} />;
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
