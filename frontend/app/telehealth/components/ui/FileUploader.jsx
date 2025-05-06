'use client';
import { useState, useEffect } from "react";

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

  const handleFiles = (selectedFiles) => {
    if (multiple) {
      const newFiles = [...(Array.isArray(files) ? files : []), ...Array.from(selectedFiles)];
      setFiles(newFiles);
      onFileUpload(newFiles);
    } else {
      const file = selectedFiles[0];
      setFiles(file);
      onFileUpload(file);
    }
  };

  const removeFile = (fileToRemove, index) => {
    if (multiple) {
      const newFiles = files.filter((_, i) => i !== index);
      setFiles(newFiles);
      onFileUpload(newFiles);
    } else {
      setFiles(null);
      onFileUpload(null);
    }
  };

  const renderPreview = () => {
    if (!showPreview || !files) return null;

    if (!multiple) {
      if (previewType === "image" && files) {
        return (
          <div className="relative w-16 h-16 md:w-20 md:h-20 mx-auto mb-2">
            <img 
              src={URL.createObjectURL(files)} 
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
          </div>
        );
      }
      
      return (
        <div className="flex items-center justify-between bg-gray-100 p-2 rounded mb-2 w-full">
          <span className="text-xs md:text-sm truncate max-w-[85%]">{files.name}</span>
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
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
        {files.map((file, index) => (
          <div key={index} className="flex items-center justify-between bg-gray-100 p-2 rounded">
            <span className="text-xs md:text-sm truncate max-w-[80%]">{file.name}</span>
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
    );
  };

  return (
    <div className={`mb-4 ${className}`}>
      <label className="block text-xs md:text-sm font-medium text-secondary/70 mb-2">
        {label}
      </label>
      <div
        className={`border-2 border-dashed rounded-lg p-3 md:p-6 flex flex-col items-center justify-center cursor-pointer transition-all ${
          isDragging ? 'border-primary bg-primary/5' : 'border-gray-300'
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <p className="text-xs md:text-sm text-center text-secondary/70 mb-1">
              {multiple ? "Upload files" : "Upload file"}
            </p>
            <p className="text-xs text-center text-secondary/50">
              {accept.replace(/\./g, '').replace(/,/g, ', ')}
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