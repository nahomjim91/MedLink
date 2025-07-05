"use client";
import { useState, useEffect } from "react";

export function FileUploader({
  label,
  accept,
  multiple = false,
  onFileUpload,
  initialFiles = null,
  showPreview = true,
  previewType = "image", // "image" or "document"
  onRemoveFile, // Optional callback for when files are removed
  className = "",
  disabled = false, // Add disabled prop
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState(initialFiles || (multiple ? [] : null));

  // Helper function to extract filename from URL or get file name
  const getFileName = (file) => {
    
    if (typeof file.url === "string") {
      // Extract filename from URL
      console.log("Received file:", file);

      const urlParts = file.url.split("/");
      const fullFileName = urlParts[urlParts.length - 1];
      
      // Check if filename contains a dash (timestamp prefix)
      const dashIndex = fullFileName.indexOf('-');
      if (dashIndex !== -1) {
        // Return the part after the dash
        return fullFileName.substring(dashIndex + 1);
      }
      
      // If no dash found, return the full filename
      return fullFileName;
    } else {
      // It's a File object, return its name
      return file.url;
    }
  };

  useEffect(() => {
    // Make sure we're always handling initialFiles correctly
    if (initialFiles === null) {
      setFiles(multiple ? [] : null);
    } else if (Array.isArray(initialFiles)) {
      setFiles(initialFiles);
    } else {
      // If initialFiles is provided but not an array and multiple is true,
      // wrap it in an array, otherwise use as is
      setFiles(multiple ? [initialFiles] : initialFiles);
    }
  }, [initialFiles, multiple]);

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = () => {
    if (!disabled) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (disabled) return;

    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e) => {
    if (disabled) return;

    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (selectedFiles) => {
    const fileArray = Array.from(selectedFiles);

    if (multiple) {
      // For multiple files, replace the current files with new ones
      // This prevents accumulation and lets the parent handle the upload
      setFiles(fileArray);
      onFileUpload(fileArray);
    } else {
      const file = fileArray[0];
      setFiles(file);
      onFileUpload(file);
    }
  };

  const removeFile = (fileToRemove, index) => {
    if (disabled) return;

    if (multiple) {
      const newFiles = files.filter((_, i) => i !== index);
      setFiles(newFiles);

      // Call onRemoveFile callback if provided (for parent to handle server deletion)
      if (onRemoveFile) {
        onRemoveFile(index, fileToRemove);
      }

      // Don't call onFileUpload here - let parent handle removal logic
    } else {
      setFiles(null);

      // Call onRemoveFile callback if provided
      if (onRemoveFile) {
        onRemoveFile(0, fileToRemove);
      }

      // Don't call onFileUpload here - let parent handle removal logic
    }
  };

  const renderPreview = () => {
    if (!showPreview || !files) return null;

    // Handle single file
    if (!multiple) {
      // For image preview type
      if (previewType === "image" && files) {
        console.log("files", typeof files === "string" ? files : URL.createObjectURL(files));
        return (
          <div className="relative w-16 h-16 md:w-20 md:h-20 mx-auto mb-2">
            <img
              src={
                typeof files === "string" ? process.env.NEXT_PUBLIC_MEDICAL_SUPPLIES_API_URL+files : URL.createObjectURL(files)
              }
              alt="Preview"
              className="w-full h-full object-cover rounded-full"
              onError={(e) => {
                // Fallback for broken image URLs
                e.target.style.display = "none";
              }}
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeFile(files);
              }}
              disabled={disabled}
              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ×
            </button>
          </div>
        );
      }

      // For document preview type
      return (
        <div className="flex items-center justify-between bg-gray-100 p-2 rounded mb-2 w-full">
          <span className="text-xs md:text-sm truncate max-w-[85%]">
            {getFileName(files)}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              removeFile(files);
            }}
            disabled={disabled}
            className="text-red-500 hover:text-red-700 ml-2 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ×
          </button>
        </div>
      );
    }

    // Handle multiple files
    return (
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
        {files.map((file, index) =>
          previewType === "image" ? (
            <div
              key={index}
              className="relative w-16 h-16 md:w-20 md:h-20 mx-auto mb-2"
            >
              <img
                src={
                  typeof file === "string" ? process.env.NEXT_PUBLIC_MEDICAL_SUPPLIES_API_URL+file : URL.createObjectURL(file)
                }
                alt="Preview"
                className="w-full h-full object-cover rounded-full"
                onError={(e) => {
                  // Fallback for broken image URLs
                  e.target.style.display = "none";
                }}
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(file, index);
                }}
                disabled={disabled}
                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ×
              </button>
            </div>
          ) : (
            <div
              key={index}
              className="flex items-center justify-between bg-gray-100 p-2 rounded"
            >
              <span className="text-xs md:text-sm truncate max-w-[80%]">
                {getFileName(file)}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(file, index);
                }}
                disabled={disabled}
                className="text-red-500 hover:text-red-700 ml-2 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ×
              </button>
            </div>
          )
        )}
      </div>
    );
  };

  // Check if we have files to display
  const hasFiles = multiple
    ? Array.isArray(files) && files.length > 0
    : files !== null;

  const handleClick = () => {
    if (!disabled) {
      document.getElementById(`fileInput-${label}`).click();
    }
  };

  return (
    <div className={`mb-4 ${className}`}>
      <label className="block text-xs md:text-sm font-medium text-secondary/70 mb-2">
        {label}
      </label>
      <div
        className={`border-2 border-dashed rounded-lg p-3 md:p-6 flex flex-col items-center justify-center transition-all ${
          disabled
            ? "border-gray-200 bg-gray-50 cursor-not-allowed opacity-50"
            : isDragging
            ? "border-primary bg-primary/5 cursor-pointer"
            : "border-gray-300 cursor-pointer hover:border-gray-400"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        {hasFiles ? (
          <div className="text-center w-full">
            {renderPreview()}
            <p className="text-xs md:text-sm text-secondary/60 mt-1">
              {disabled
                ? "Upload in progress..."
                : `Click to ${multiple ? "add more" : "change"}`}
            </p>
          </div>
        ) : (
          <>
            <div className="w-10 h-10 md:w-14 md:h-14 bg-gray-100 rounded-full flex items-center justify-center mb-3 md:mb-4">
              <svg
                className="w-6 h-6 md:w-8 md:h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
            <p className="text-xs md:text-sm text-center text-secondary/70 mb-1">
              {disabled
                ? "Upload in progress..."
                : multiple
                ? "Upload files"
                : "Upload file"}
            </p>
            <p className="text-xs text-center text-secondary/50">
              {accept.replace(/\./g, "").replace(/,/g, ", ")}
            </p>
          </>
        )}
        <input
          id={`fileInput-${label}`}
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleChange}
          multiple={multiple}
          disabled={disabled}
        />
      </div>
    </div>
  );
}