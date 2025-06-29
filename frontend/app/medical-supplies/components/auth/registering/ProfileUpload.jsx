"use client";
import { useState } from "react";
import { StepButtons } from "../../ui/Button";
import { FileUploader } from "../../ui/FileUploader";
import useFileUpload from "../../../hooks/useFileUpoload";


export default function ProfileUpload({profileImageUrl, onProfileImageUpload, onNext, onPrevious, isLoading }) {
  // Use profileImageUrl if profileImage is not provided (for backward compatibility)
  const initialImage =  profileImageUrl || null;
  const [uploadedImage, setUploadedImage] = useState(initialImage);
  
  console.log("profileImageUrl", profileImageUrl);
  console.log("uploadedImage", uploadedImage);
  const { uploadSingle, deleteFile , uploading } = useFileUpload();

  const handleProfileImageUpload = async(file) => {
    console.log("Profile image uploaded:", file);
    let uploadResult = await uploadSingle(file);
    setUploadedImage(uploadResult.fileUrl);
    onProfileImageUpload(uploadResult.fileUrl);
  };
   const handleProfileImageRemove = async() => {
    console.log("Profile image uploaded:", initialImage);
    await deleteFile(initialImage);
    setUploadedImage(null);
    onProfileImageUpload(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if(!uploadedImage) return;
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
          onRemoveFile={handleProfileImageRemove}
          showPreview={true}
          previewType="image"
          className="mb-8"
        />

        <StepButtons 
          onNext={onNext} 
          onPrevious={onPrevious} 
          isLoading={isLoading}
          nextDisabled={!uploadedImage} // Add this line to disable next when no image
        />
      </form>
    </div>
  );
}