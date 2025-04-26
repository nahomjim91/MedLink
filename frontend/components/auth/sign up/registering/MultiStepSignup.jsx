import { useState } from "react";
import RoleSelection from "./RoleSelection";
import RegisterForm from "./RegisterForm";
import UserInfoForm from "./UserInfoForm";
import SpecializationForm from "./SpecializationForm";
import DocumentUpload from "./DocumentUpload";
import SignupSuccess from "./SignupSuccess";
import StepProgressIndicator from "@/components/ui/StepProgressIndicator";

export default function MultiStepSignup() {
  const [currentStep, setCurrentStep] = useState(1);
  const [userData, setUserData] = useState({
    role: "", // patient, doctor, or admin
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    gender: "",
    dateOfBirth: "",
    phoneNumber: "",
    // Doctor specific fields
    specialization: "",
    experienceYears: "",
    aboutYou: "",
    certificates: null,
    profileImage: null
  });
  
  // Total number of steps depends on the selected role
  const getTotalSteps = () => {
    switch(userData.role) {
      case "doctor": return 5; // Role, Register, Personal Info, Specialization, Document Upload
      case "patient": return 4; // Role, Register, Personal Info, Document Upload
      case "admin": return 4;   // Role, Register, Personal Info, Document Upload
      default: return 5;        // Default to maximum
    }
  };

  const handleNext = () => {
    setCurrentStep(prev => Math.min(prev + 1, getTotalSteps()));
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const updateUserData = (newData) => {
    setUserData(prev => ({ ...prev, ...newData }));
  };

  // Render the appropriate step component
  const renderStep = () => {
    switch(currentStep) {
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
          <RegisterForm
            email={userData.email}
            password={userData.password}
            onUpdate={(data) => updateUserData(data)}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 3:
        return (
          <UserInfoForm
            userData={userData}
            onUpdate={updateUserData}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 4:
        // If user is a doctor, show specialization form at step 4
        if (userData.role === "doctor") {
          return (
            <SpecializationForm
              specialization={userData.specialization}
              experienceYears={userData.experienceYears}
              aboutYou={userData.aboutYou}
              onUpdate={updateUserData}
              onNext={handleNext}
              onPrevious={handlePrevious}
            />
          );
        } 
        // For patients and admins, show document upload at step 4
        return (
          <DocumentUpload
            onFileUpload={(certificates) => updateUserData({ certificates })}
            onProfileImageUpload={(profileImage) => updateUserData({ profileImage })}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 5:
        // For doctors, show document upload at step 5
        if (userData.role === "doctor") {
          return (
            <DocumentUpload
              onFileUpload={(certificates) => updateUserData({ certificates })}
              onProfileImageUpload={(profileImage) => updateUserData({ profileImage })}
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
    <div className="min-h-screen flex bg-gray-100">
      <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-bold text-center mb-6">Finishing Registering</h1>
          
          {/* Progress indicator */}
          <StepProgressIndicator 
            currentStep={currentStep} 
            totalSteps={getTotalSteps()} 
            className="mb-8"
          />
          
          {/* Current step component */}
          {renderStep()}
        </div>
      </div>
      <div className="hidden md:block md:w-1/2 bg-gray-100 relative">
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className="relative w-full h-full max-w-md">
            <img
              src="/api/placeholder/400/800"
              alt="Healthcare professional using MedLink platform"
              className="rounded-3xl shadow-lg object-cover w-full h-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}