'use client';
import { useState, useEffect } from "react";
import { StepButtons } from "../../ui/Button";
import { FileUploader } from "../../ui/FileUploader";

export default function ProfileUpload({ 
  profileImage, 
  onImageUpload, 
  onNext, 
  onPrevious,
  isLoading
}) {
  const [localProfileImage, setLocalProfileImage] = useState(profileImage || null);

  // Update local state when props change
  useEffect(() => {
    if (profileImage !== undefined) {
      setLocalProfileImage(profileImage);
    }
  }, [profileImage]);

  const handleProfileImageUpload = (file) => {
    setLocalProfileImage(file);
    onImageUpload(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onNext();
  };

  return (
    <div className="px-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-secondary/80 mb-2">
          Upload Profile Picture
        </h2>
        <p className="text-sm text-secondary/60">
          Add a profile picture to personalize your account
        </p>
      </div>

        {/* Profile Image Upload */}
        <FileUploader
          label="Profile Picture"
          accept="image/png,image/jpeg"
          multiple={false}
          onFileUpload={handleProfileImageUpload}
          initialFiles={localProfileImage}
          showPreview={true}
          previewType="image"
        />

        <StepButtons 
          onNext={localProfileImage && handleSubmit} 
          onPrevious={onPrevious}
          isLoading={isLoading} 
        />
    </div>
  );
}