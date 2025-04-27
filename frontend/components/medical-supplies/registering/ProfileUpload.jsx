'use client';
import { useState } from "react";
import { StepButtons } from "@/components/ui/Button";
import { FileUploader } from "@/components/ui/FileUploader"; // Make sure this path is correct

export default function ProfileUploader({ onProfileImageUpload, onNext, onPrevious }) {
  const [profileImage, setProfileImage] = useState(null);

  const handleProfileImageUpload = (file) => {
    setProfileImage(file);
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
          Upload Profile Picture
        </h2>
        <p className="text-sm text-secondary/60">
          Add a profile picture to personalize your account
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Profile Image Upload */}
        <FileUploader
          label="Profile Picture"
          accept="image/png,image/jpeg"
          multiple={false}
          onFileUpload={handleProfileImageUpload}
          initialFiles={profileImage}
          showPreview={true}
          previewType="image"
        />

        <StepButtons onNext={onNext} onPrevious={onPrevious} />
      </form>
    </div>
  );
}