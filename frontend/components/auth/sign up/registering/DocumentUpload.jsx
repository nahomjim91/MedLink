import { useState } from "react";
import { Button } from "@/components/ui/Button";

export default function DocumentUpload({ onFileUpload, onProfileImageUpload, onNext, onPrevious }) {
  const [isDraggingCertificates, setIsDraggingCertificates] = useState(false);
  const [isDraggingProfile, setIsDraggingProfile] = useState(false);
  const [certificateFiles, setCertificateFiles] = useState(null);
  const [profileImage, setProfileImage] = useState(null);

  const handleCertificatesDragOver = (e) => {
    e.preventDefault();
    setIsDraggingCertificates(true);
  };

  const handleCertificatesDragLeave = () => {
    setIsDraggingCertificates(false);
  };

  const handleCertificatesDrop = (e) => {
    e.preventDefault();
    setIsDraggingCertificates(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = e.dataTransfer.files;
      setCertificateFiles(files);
      onFileUpload(files);
    }
  };

  const handleCertificatesChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = e.target.files;
      setCertificateFiles(files);
      onFileUpload(files);
    }
  };

  const handleProfileDragOver = (e) => {
    e.preventDefault();
    setIsDraggingProfile(true);
  };

  const handleProfileDragLeave = () => {
    setIsDraggingProfile(false);
  };

  const handleProfileDrop = (e) => {
    e.preventDefault();
    setIsDraggingProfile(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setProfileImage(file);
      onProfileImageUpload(file);
    }
  };

  const handleProfileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfileImage(file);
      onProfileImageUpload(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onNext();
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm px-6 py-8">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-secondary/80 mb-2">
          Upload Documents
        </h2>
        <p className="text-sm text-secondary/60">
          Upload your profile picture and any necessary documents
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Profile Image Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-secondary/70 mb-2">
            Profile Picture
          </label>
          <div
            className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-all ${
              isDraggingProfile ? 'border-primary bg-primary/5' : 'border-gray-300'
            }`}
            onDragOver={handleProfileDragOver}
            onDragLeave={handleProfileDragLeave}
            onDrop={handleProfileDrop}
            onClick={() => document.getElementById('profileImage').click()}
          >
            {profileImage ? (
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg 
                    className="w-8 h-8 text-primary" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-sm text-secondary/80 font-medium">
                  {profileImage.name}
                </p>
                <p className="text-xs text-secondary/60 mt-1">
                  Click to change
                </p>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <svg 
                    className="w-8 h-8 text-gray-400" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <p className="text-sm text-center text-secondary/70 mb-1">
                  Click or drag file to this area to upload
                </p>
                <p className="text-xs text-center text-secondary/50">
                  Formats accepted are .png and .jpg
                </p>
              </>
            )}
            <input
              id="profileImage"
              type="file"
              accept="image/png, image/jpeg"
              className="hidden"
              onChange={handleProfileChange}
            />
          </div>
        </div>

        {/* Certificates Upload */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-secondary/70 mb-2">
            Upload Your Certificates
          </label>
          <div
            className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-all ${
              isDraggingCertificates ? 'border-primary bg-primary/5' : 'border-gray-300'
            }`}
            onDragOver={handleCertificatesDragOver}
            onDragLeave={handleCertificatesDragLeave}
            onDrop={handleCertificatesDrop}
            onClick={() => document.getElementById('certificateFiles').click()}
          >
            {certificateFiles ? (
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg 
                    className="w-8 h-8 text-primary" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-sm text-secondary/80 font-medium">
                  {certificateFiles.length} file(s) selected
                </p>
                <p className="text-xs text-secondary/60 mt-1">
                  Click to change
                </p>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <svg 
                    className="w-8 h-8 text-gray-400" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <p className="text-sm text-center text-secondary/70 mb-1">
                  Click or drag files to this area to upload
                </p>
                <p className="text-xs text-center text-secondary/50">
                  Formats accepted are .pdf and .jpg
                </p>
              </>
            )}
            <input
              id="certificateFiles"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={handleCertificatesChange}
              multiple
            />
          </div>
        </div>

        <div className="flex space-x-4 mt-8">
          <Button
            type="button"
            variant="outline"
            color="secondary"
            onClick={onPrevious}
            className="w-1/2"
          >
            Previous Step
          </Button>
          <Button
            type="submit"
            variant="fill"
            color="primary"
            className="w-1/2"
          >
            Next Step
          </Button>
        </div>
      </form>
    </div>
  );
}