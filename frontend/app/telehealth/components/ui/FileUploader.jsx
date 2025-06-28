"use client";
import { useState, useEffect } from "react";
import useFileUpload from "../../hooks/useFileUpoload";

// Reusable FileUploader component
export function FileUploader({
  label,
  accept,
  multiple = false,
  onFileUpload,
  initialFiles = null,
  showPreview = true,
  previewType = "image", // "image" or "document"
  className = "", 
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState(initialFiles || (multiple ? [] : null));
  const {
    uploadSingle,
    uploadMultiple,
    deleteFile,
    uploading,
    progress,
    error,
  } = useFileUpload();

  useEffect(() => {
    if (initialFiles) {
      setFiles(initialFiles);
    }
  }, [initialFiles]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFiles = async (selectedFiles) => {
    try {
      // Validate that files were actually selected
      if (!selectedFiles || selectedFiles.length === 0) {
        console.warn("No files selected");
        return;
      }

      if (multiple) {
        const newFiles = [
          ...(Array.isArray(files) ? files : []),
          ...Array.from(selectedFiles),
        ];

        // Upload multiple files
        const uploadResult = await uploadMultiple(Array.from(selectedFiles));
        console.log("Multiple upload result:", uploadResult);

        // Validate upload result before using it
        if (uploadResult && uploadResult.files) {
          let fileUrls = uploadResult.files.map((file) => file.fileUrl);
          onFileUpload(fileUrls);
          setFiles(fileUrls);
        } else {
          console.error("Upload result is missing fileUrl:", uploadResult);
        }
      } else {
        const file = selectedFiles[0];

        // Validate the single file
        if (!file) {
          console.warn("No file selected");
          return;
        }

        // Upload single file
        const uploadResult = await uploadSingle(file);
        console.log("Single upload result:", uploadResult);

        // Validate upload result before using it
        if (uploadResult) {
          // Handle different possible return formats
          let fileUrl;
          if (typeof uploadResult === "string") {
            fileUrl = uploadResult;
          } else if (uploadResult.fileUrl) {
            fileUrl = uploadResult.fileUrl;
          } else if (uploadResult.url) {
            fileUrl = uploadResult.url;
          }

          // Ensure we have a valid URL before proceeding
          if (fileUrl && fileUrl.trim() !== "") {
            onFileUpload(fileUrl);
            setFiles(file);
          } else {
            console.error(
              "Upload result does not contain a valid URL:",
              uploadResult
            );
          }
        } else {
          console.error("Upload failed - no result returned");
        }
      }
    } catch (error) {
      console.error("Upload failed:", error);
      // Optional: You might want to show user feedback here
      // setError("Upload failed. Please try again.");
    }
  };

  const removeFile = async (fileToRemove, index) => {
    if (multiple) {
      const newFiles = files.filter((_, i) => i !== index);
      // remove the file from the server
      await deleteFile(fileToRemove);
      console.log("fileToRemove: ", fileToRemove);
      setFiles(newFiles);
      onFileUpload(newFiles);
    } else {
      setFiles(null);
      onFileUpload(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const renderPreview = () => {
    if (!showPreview || !files) return null;

    if (!multiple) {
      if (previewType === "image" && files) {
        return (
          <div className="relative w-16 h-16 md:w-20 md:h-20 mx-auto mb-2">
            {uploading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <img
                  src={files}
                  alt="Preview"
                  className="w-full h-full object-cover rounded-full"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(files);
                  }}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
                >
                  ×
                </button>
              </>
            )}
          </div>
        );
      }

      return (
        <div className="flex items-center justify-between bg-gray-100 p-2 rounded mb-2 w-full">
          <span className="text-xs md:text-sm truncate max-w-[85%]">
            {files.name}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              removeFile(files);
            }}
            className="text-red-500 hover:text-red-700 ml-2 flex-shrink-0"
          >
            ×
          </button>
        </div>
      );
    }

    return (
      uploading ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
        </div>
        ) : (
        
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
        {files.map((file, index) => (
          <div
            key={index}
            className="flex items-center justify-between bg-gray-100 p-2 rounded"
          >
            <span className="text-xs md:text-sm truncate max-w-[80%]">
              {file}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeFile(file, index);
              }}
              className="text-red-500 hover:text-red-700 ml-2 flex-shrink-0"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      )
    );
  };

  return (
    <div className={`mb-4 ${className}`}>
      <label className="block text-xs md:text-sm font-medium text-secondary/70 mb-2">
        {label}
      </label>
      <div
        className={`border-2 border-dashed rounded-lg p-3 md:p-6 flex flex-col items-center justify-center cursor-pointer transition-all ${
          isDragging ? "border-primary bg-primary/5" : "border-gray-300"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById(`fileInput-${label}`).click()}
      >
        {files && (multiple ? files.length > 0 : files) ? (
          <div className="text-center w-full">
            {renderPreview()}
            <p className="text-xs md:text-sm text-secondary/60 mt-1">
              Click to {multiple ? "add more" : "change"}
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
              {multiple ? "Upload files" : "Upload file"}
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
        />
      </div>
    </div>
  );
}
