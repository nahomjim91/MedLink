"use client";
import { useState, useEffect } from "react";
import { StepButtons } from "../Button";
import { FileUploader } from "../FileUploader";
import useFileUpload from "../../../hooks/useFileUpoload";

export default function ProductImage({
  images,
  onImageUpload,
  onRemoveImage,
  onNext,
  onPrevious,
  isLoading,
}) {
  const { deleteFile, uploadMultiple, uploadSingle, uploading } =
    useFileUpload();
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadError, setUploadError] = useState(null);

  // When parent's images array changes, log it
  useEffect(() => {
    console.log("Parent images updated:", images);
  }, [images]);

  // This function handles file upload to server
  const handleProfileImageUpload = async (files) => {
    if (!files || (Array.isArray(files) && files.length === 0)) return;

    setUploadError(null);

    try {
      // Store files for preview purposes
      const fileArray = Array.isArray(files) ? files : [files];
      setUploadedFiles(fileArray);

      let uploadResponse;

      // Upload files to server
      if (fileArray.length === 1) {
        // Single file upload
        uploadResponse = await uploadSingle(fileArray[0]);
        if (uploadResponse) {
          // Pass the server response (which should contain file URL/name) to parent
          onImageUpload(
            uploadResponse.fileUrl ||
              uploadResponse.fileName ||
              uploadResponse.name
          );
        }
      } else {
        // Multiple file upload
        uploadResponse = await uploadMultiple(fileArray);
        if (uploadResponse && uploadResponse.files) {
          // Pass each uploaded file info to parent
          uploadResponse.files.forEach((fileInfo) => {
            onImageUpload(
              fileInfo.fileUrl || fileInfo.fileName || fileInfo.name
            );
          });
        }
      }
    } catch (error) {
      console.error("Upload failed:", error);
      setUploadError(error.message || "Upload failed");
      // Clear the preview files on error
      setUploadedFiles([]);
    }
  };

  // Handle removing image from server and state
  const handleRemoveImageWithDelete = async (index, imageName) => {
    try {
      setUploadError(null);
      console.log("Deleting image:", imageName);
      console.log("Index:", index);

      // Try to delete from server first
      await deleteFile(images[index]);

      // If successful, remove from parent state
      onRemoveImage(index);

      // Also remove from local preview files if it exists
      setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
    } catch (error) {
      console.error("Delete failed:", error);
      setUploadError(error.message || "Failed to delete file");

      // Still remove from parent state even if server delete failed
      // (in case the file doesn't exist on server anymore)
      onRemoveImage(index);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!uploading) {
      onNext();
    }
  };

  // Combine loading states
  const isUploadingOrLoading = uploading || isLoading;

  return (
    <div className="px-6">
      <h2 className="text-xl font-semibold text-secondary/80 mb-2">
        Product Images
      </h2>

      <p className="text-gray-600 mb-4">
        Upload high-quality images of your product. You can upload multiple
        images to show different angles or features of the product.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Image Upload Section */}
        <div className="mb-6">
          {/* Show upload error if any */}
          {uploadError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {uploadError}
            </div>
          )}

          {/* Show uploading status */}
          {uploading && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded mb-4">
              Uploading files... Please wait.
            </div>
          )}

          {/* Profile Image Upload */}
          <FileUploader
            label="Product Images"
            accept="image/png,image/jpeg,application/pdf"
            multiple={true}
            onFileUpload={handleProfileImageUpload}
            onRemoveFile={handleRemoveImageWithDelete}
            initialFiles={uploadedFiles}
            showPreview={true}
            previewType="image"
            className="mb-8"
            disabled={uploading} // Disable during upload
          />

          {/* Display list of uploaded image names */}
          {images && images.length > 0 && (
            <div className="mt-4">
              <h3 className="font-medium mb-2">Uploaded Images:</h3>
              <ul className="list-disc list-inside space-y-2">
                {images.map((imageName, index) => (
                  <li
                    key={index}
                    className="flex items-center justify-between bg-gray-50 p-2 rounded"
                  >
                    <span className="truncate">{imageName}</span>
                    <button
                      type="button"
                      onClick={() =>
                        handleRemoveImageWithDelete(index, imageName)
                      }
                      disabled={uploading}
                      className="text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed px-2 py-1"
                    >
                      {uploading ? "Processing..." : "Remove"}
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
  onNext={() => {
    if (images.length > 0) {
      console.log("Next clicked");
      onNext();
    }
  }}
  onPrevious={onPrevious}
  isLoading={isUploadingOrLoading}
  nextDisabled={uploading || images.length === 0}
/>
      </form>
    </div>
  );
}
