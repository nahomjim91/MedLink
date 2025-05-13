"use client";
import { useState } from "react";
import { StepButtons } from "../Button";
import { FileUploader } from "../FileUploader";

export default function ProductImage({
  images,
  onImageUpload,
  onNext,
  onPrevious,
  isLoading,
}) {
  const [uploadedImage, setUploadedImage] = useState(images);

  const handleProfileImageUpload = (file) => {
    setUploadedImage(file);
    onImageUpload(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onNext();
  };

  return (
    <div className="px-6">
      <h2 className="text-xl font-semibold text-secondary/80 mb-2">
        Product Image
      </h2>

      <form onSubmit={handleSubmit}>
        {/* Profile Image Upload */}
        <FileUploader
          label="Company Logo"
          accept="image/png,image/jpeg, application/pdf"
          multiple={true}
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
