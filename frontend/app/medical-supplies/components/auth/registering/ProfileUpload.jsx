"use client";
import { useState } from "react";
import { StepButtons } from "../../ui/Button";
import { FileUploader } from "../../ui/FileUploader";

export default function ProfileUpload({ profileImage, onProfileImageUpload, onNext, onPrevious, isLoading }) {
  const [uploadedImage, setUploadedImage] = useState(profileImage);

  const handleProfileImageUpload = (file) => {
    setUploadedImage(file);
    onProfileImageUpload(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onNext();
  };

  return (
    <div className="px-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-secondary/80 mb-2">
          Upload Company Logo
        </h2>
        <p className="text-sm text-secondary/60">
          Add your company logo to personalize your account
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Profile Image Upload */}
        <FileUploader
          label="Company Logo"
          accept="image/png,image/jpeg"
          multiple={false}
          onFileUpload={handleProfileImageUpload}
          initialFiles={uploadedImage}
          showPreview={true}
          previewType="image"
          className="mb-8"
        />

        <StepButtons 
          onNext={onNext} 
          onPrevious={onPrevious} 
          isLoading={isLoading}
        />
      </form>
    </div>
  );
}