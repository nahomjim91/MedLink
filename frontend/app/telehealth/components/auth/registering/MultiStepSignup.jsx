"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../../hooks/useAuth";
import { useMutation } from "@apollo/client";
import {
  COMPLETE_REGISTRATION,
  UPDATE_USER_PROFILE,
} from "../../../api/graphql/mutations";
import RoleSelection from "./RoleSelection";
import UserInfoForm from "./UserInfoForm";
import SpecializationForm from "./SpecializationForm";
import ProfileUpload from "./ProfileUpload";
import { StepProgressIndicator } from "../../ui/StepProgressIndicator";
import HealthInfoStep from "./HealthInfoStep";
import client from "../../../api/graphql/client";

// Import the confirmation step and signup success components
import ConfirmationStep from "./ConfirmationStep";
import { SignupSuccess } from "./SignupSuccess";

export default function MultiStepSignup({ email }) {
  const router = useRouter();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [registrationComplete, setRegistrationComplete] = useState(false);

  // Initialize userData with values from auth context if available
  const [userData, setUserData] = useState({
    role: user?.role || "",
    email: email || user?.email || "",
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    gender: user?.gender || "",
    dateOfBirth: user?.dob || "",
    phoneNumber: user?.phoneNumber || "",
    // Patient specific fields
    height: "",
    weight: "",
    bloodType: "",
    // Doctor specific fields
    specialization: user?.doctorProfile?.specialization || "",
    experienceYears: user?.doctorProfile?.experienceYears || "",
    aboutYou: user?.doctorProfile?.aboutMe || "",
    certificates: null,
    profileImage: null,
  });

  // Set up GraphQL mutations
  const [completeRegistration] = useMutation(COMPLETE_REGISTRATION, { client });

  // Pre-fill form fields if user data is available
  useEffect(() => {
    if (user) {
      setUserData((prevData) => ({
        ...prevData,
        role: user.role || prevData.role,
        email: user.email || prevData.email,
        firstName: user.firstName || prevData.firstName,
        lastName: user.lastName || prevData.lastName,
        gender: user.gender || prevData.gender,
        dateOfBirth: user.dob || prevData.dateOfBirth,
        phoneNumber: user.phoneNumber || prevData.phoneNumber,
        specialization:
          user.doctorProfile?.specialization || prevData.specialization,
        experienceYears:
          user.doctorProfile?.experienceYears || prevData.experienceYears,
        aboutYou: user.doctorProfile?.aboutMe || prevData.aboutYou,
      }));
    }
  }, [user]);

  // Total number of steps depends on the selected role
  const getTotalSteps = () => {
    switch (userData.role) {
      case "doctor":
        return 6; // Role, Personal Info, Specialization, Profile Upload, Confirmation, Success
      case "patient":
        return 6; // Role, Personal Info, Health Info, Profile Upload, Confirmation, Success
      default:
        return 4; // Role Selection, Personal Info, Confirmation, Success
    }
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

  // Save all user data via GraphQL - only called after confirmation
  const saveUserData = async () => {
    if (!user?.id) {
      setError("No user authenticated. Please log in again.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Validate required fields before submission
      const requiredBaseFields = [
        "firstName",
        "lastName",
        "gender",
        "dateOfBirth",
        "phoneNumber",
        "role",
      ];
      for (const field of requiredBaseFields) {
        if (!userData[field]) {
          setError(`Please complete all required fields. Missing: ${field}`);
          setIsLoading(false);
          return;
        }
      }

      // Prepare data objects based on GraphQL schema
      const userInput = {
        firstName: userData.firstName,
        lastName: userData.lastName,
        gender: userData.gender,
        dob: userData.dateOfBirth, // Match the schema field name
        phoneNumber: userData.phoneNumber,
        role: userData.role,
      };

      // Only include role-specific data if relevant
      let doctorInput = null;
      let patientInput = null;

      if (userData.role === "patient") {
        // Validate required patient fields
        if (!userData.height || !userData.weight || !userData.bloodType) {
          setError("Please complete all health information fields.");
          setIsLoading(false);
          return;
        }

        patientInput = {
          height: userData.height,
          weight: userData.weight,
          bloodType: userData.bloodType,
        };
      } else if (userData.role === "doctor") {
        // Validate required doctor fields
        if (!userData.specialization || !userData.experienceYears) {
          setError("Please complete all specialization fields.");
          setIsLoading(false);
          return;
        }

        doctorInput = {
          specialization: userData.specialization,
          experienceYears: parseInt(userData.experienceYears) || 0,
          aboutMe: userData.aboutYou || "", // Match the schema field name
          // Profile image URL would be handled separately if needed
        };
      }

      console.log("Submitting registration data:", {
        userInput,
        doctorInput,
        patientInput,
      });

      // Call the completeRegistration mutation
      const { data } = await completeRegistration({
        variables: {
          THuserInput: userInput,
          doctorInput,
          patientInput,
        },
      });

      console.log("Registration response:", data);

      if (!data || !data.completeRegistration) {
        throw new Error("Registration failed - no data returned");
      }

      // Force refresh Apollo client cache
      await client.refetchQueries({
        include: ["GetMyProfile"],
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
    router.push(
      userData.role === "patient"
        ? "/telehealth/dashboard"
        : "/medical-supplies/dashboard"
    );
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
          <UserInfoForm
            userData={userData}
            onUpdate={updateUserData}
            onNext={handleNext}
            onPrevious={handlePrevious}
            isLoading={isLoading}
          />
        );

      case 3:
        // Role-specific forms
        if (userData.role === "doctor") {
          return (
            <SpecializationForm
              specialization={userData.specialization}
              experienceYears={userData.experienceYears}
              aboutYou={userData.aboutYou}
              onUpdate={updateUserData}
              onNext={handleNext}
              certificates={userData.certificates}
              onDocumentsUpload={(certificates) =>
                updateUserData({ certificates })
              }
              onPrevious={handlePrevious}
              isLoading={isLoading}
            />
          );
        }
        if (userData.role === "patient") {
          return (
            <HealthInfoStep
              height={userData.height}
              weight={userData.weight}
              bloodType={userData.bloodType}
              onUpdate={updateUserData}
              onNext={handleNext}
              onPrevious={handlePrevious}
              isLoading={isLoading}
            />
          );
        }
        // For roles without specialized forms, go to confirmation
        return (
          <ConfirmationStep
            userData={userData}
            onNext={handleNext}
            onPrevious={handlePrevious}
            isLoading={isLoading}
          />
        );

      case 4:
        // For doctors and patients: profile image upload step
        if (userData.role === "doctor" || userData.role === "patient") {
          return (
            <ProfileUpload
              profileImage={userData.profileImage}
              onImageUpload={(profileImage) => updateUserData({ profileImage })}
              onNext={handleNext}
              onPrevious={handlePrevious}
              isLoading={isLoading}
            />
          );
        }

        // For other roles: go straight to confirmation
        return (
          <ConfirmationStep
            userData={userData}
            onNext={handleNext}
            onPrevious={handlePrevious}
            isLoading={isLoading}
          />
        );

      case 5:
        // Confirmation step for doctors and patients
        if (userData.role === "doctor" || userData.role === "patient") {
          return (
            <ConfirmationStep
              userData={userData}
              onNext={handleNext}
              onPrevious={handlePrevious}
              isLoading={isLoading}
            />
          );
        }
        return (
          <SignupSuccess userData={userData} onComplete={handleComplete} />
        );

      case 6:
        return (
          <SignupSuccess userData={userData} onComplete={handleComplete} />
        );

      default:
        return null;
    }
  };

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
