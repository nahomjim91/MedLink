"use client";
import { useState, useEffect } from "react";
import { StepButtons } from "../Button";
import { FileUploader } from "../FileUploader";

export default function ProductImage({
  images,
  onImageUpload,
  onRemoveImage,
  onNext,
  onPrevious,
  isLoading,
}) {
  // We need to track the actual File objects for preview
  const [uploadedFiles, setUploadedFiles] = useState([]);
  
  // When parent's images array changes (names only), log it
  useEffect(() => {
    console.log("Parent images updated:", images);
  }, [images]);

  // This function handles file upload
  const handleProfileImageUpload = (files) => {
    if (!files || files.length === 0) return;
    
    // Store files for preview purposes
    setUploadedFiles(Array.isArray(files) ? files : [files]);
    
    // If files is an array, handle multiple files
    if (Array.isArray(files)) {
      // For each file, pass just the name to parent
      files.forEach(file => {
        if (file && file.name) {
          onImageUpload(file.name);
        }
      });
    } else {
      // Handle single file case - just pass the name
      if (files && files.name) {
        onImageUpload(files.name);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onNext();
  };

  return (
    <div className="px-6">
      <h2 className="text-xl font-semibold text-secondary/80 mb-4">
        Product Images
      </h2>
  
      <p className="text-gray-600 mb-6">
        Upload high-quality images of your product. You can upload multiple
        images to show different angles or features of the product.
      </p>
  
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Image Upload Section */}
        <div className="mb-6">
          {/* Profile Image Upload */}
          <FileUploader
            label="Product Images"
            accept="image/png,image/jpeg,application/pdf"
            multiple={true}
            onFileUpload={handleProfileImageUpload}
            initialFiles={uploadedFiles}
            showPreview={true}
            previewType="image"
            className="mb-8"
          />
  
          {/* Display list of uploaded image names */}
          {images && images.length > 0 && (
            <div className="mt-4">
              <h3 className="font-medium mb-2">Uploaded Images:</h3>
              <ul className="list-disc list-inside">
                {images.map((imageName, index) => (
                  <li key={index} className="flex items-center justify-between">
                    <span>{imageName}</span>
                    <button 
                      type="button"
                      onClick={() => onRemoveImage(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
  
          {/* Image Guidelines */}
          <div className="text-sm text-gray-500 mt-4">
            <p>Image guidelines:</p>
            <ul className="list-disc list-inside ml-2">
              <li>Images should be clear and well-lit</li>
              <li>Recommended size: 1000 x 1000 pixels or larger</li>
              <li>Maximum file size: 5MB per image</li>
            </ul>
          </div>
        </div>
  
        {/* Navigation Buttons */}
        <StepButtons
          onNext={onNext}
          onPrevious={onPrevious}
          isLoading={isLoading}
        />
      </form>
    </div>
  );
}