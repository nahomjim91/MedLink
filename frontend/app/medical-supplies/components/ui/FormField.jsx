import React from "react";
import {
  Download,
  ExternalLink,
  FileText,
  Star,
  Image,
  FileArchive,
  File,
} from "lucide-react";

// Base form field component that other components will extend

const FormField = ({ label, children, className = "", bigSize }) => {
  return (
    <div
      className={`flex flex-col md:flex-row items-start w-full mb-4 ${className}`}
    >
      <label
        className={`text-gray-800 font-medium text-base ${
          !bigSize ? "md:w-1/2" : "md:w-1/4"
        } mb-1 md:mb-0`}
      >
        {label}
      </label>
      <div className={`${!bigSize ? "md:w-1/2" : "md:w-3/4"} w-full`}>
        {children}
      </div>
    </div>
  );
};

// Improved Text field with proper text wrapping
export const TextField = ({
  label,
  value,
  icon: Icon,
  iconColor = "text-primary",
  bigSize = true,
}) => {
  return (
    <FormField label={label} bigSize={bigSize}>
      <div className="bg-gray-50 rounded-lg p-3 flex items-start">
        {Icon && (
          <Icon className={`mr-2 ${iconColor} flex-shrink-0 mt-1`} size={20} />
        )}
        <span className="text-gray-500 break-words whitespace-pre-wrap">
          {value || "—"}
        </span>
      </div>
    </FormField>
  );
};

// Long text field specifically for descriptions and other lengthy content
export const LongTextField = ({
  label,
  value,
  icon: Icon,
  iconColor = "text-primary",
  bigSize = true,
  maxHeight = null,
}) => {
  return (
    <FormField label={label} bigSize={bigSize}>
      <div className="bg-gray-50 rounded-lg p-3 flex items-start">
        {Icon && (
          <Icon className={`mr-2 ${iconColor} flex-shrink-0 mt-1`} size={20} />
        )}
        <div
          className={`text-gray-500 break-words whitespace-pre-wrap overflow-y-auto w-full ${
            maxHeight ? "" : "max-h-40"
          }`}
          style={maxHeight ? { maxHeight } : {}}
        >
          {value || "—"}
        </div>
      </div>
    </FormField>
  );
};

// Read-only textarea field for multiline content display
export const TextAreaField = ({
  label,
  value,
  icon: Icon,
  iconColor = "text-primary",
  bigSize = true,
  rows = 3,
}) => {
  return (
    <FormField label={label} bigSize={bigSize}>
      <div className="bg-gray-50 rounded-lg p-3 w-full">
        {Icon && <Icon className={`mb-2 ${iconColor}`} size={20} />}
        <textarea
          className="w-full bg-transparent border-0 text-gray-500 resize-none focus:ring-0"
          value={value || ""}
          rows={rows}
          readOnly
        />
      </div>
    </FormField>
  );
};
// File field with icon
export const FileField = ({ label, fileName, fileUrl, fileType }) => {
  // Function to extract filename from the full path (similar to CertificatesList)
  const extractFilename = (fullPath) => {
    if (!fullPath) return "Not available";

    // Split by '/' and get the last part
    const parts = fullPath.split("/");
    const filename = parts[parts.length - 1];

    // Remove the timestamp prefix (everything before the first '-')
    const dashIndex = filename.indexOf("-");
    if (dashIndex !== -1) {
      return filename.substring(dashIndex + 1);
    }

    return filename;
  };

  // Function to truncate long filenames
  const truncateFilename = (filename, maxLength = 20) => {
    if (!filename || filename.length <= maxLength) return filename;
    
    // Find the last dot for file extension
    const lastDotIndex = filename.lastIndexOf('.');
    
    if (lastDotIndex === -1) {
      // No extension, just truncate
      return filename.substring(0, maxLength - 3) + '...';
    }
    
    const extension = filename.substring(lastDotIndex);
    const nameWithoutExt = filename.substring(0, lastDotIndex);
    
    // If even the extension is too long, just truncate everything
    if (extension.length > maxLength - 3) {
      return filename.substring(0, maxLength - 3) + '...';
    }
    
    // Truncate the name part but keep the extension
    const availableLength = maxLength - 3 - extension.length;
    if (nameWithoutExt.length > availableLength) {
      return nameWithoutExt.substring(0, availableLength) + '...' + extension;
    }
    
    return filename;
  };

  // Function to handle file click
  const handleFileClick = () => {
    const url = fileUrl || fileName;
    if (url && url !== "Not available") {
      window.open(url, "_blank");
    }
  };

  // Determine if the file is clickable
  const isClickable = fileUrl && fileUrl !== "Not available";
  const displayName = truncateFilename(extractFilename(fileName || fileUrl));

  return (
    <FormField label={label}>
      <div 
        className={`bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-between transition-colors ${
          isClickable 
            ? 'hover:border-primary/30 hover:bg-gray-50 cursor-pointer group' 
            : ''
        }`}
        onClick={isClickable ? handleFileClick : undefined}
      >
        <FileText 
          className={`mr-2 ${
            isClickable 
              ? 'text-green-500 group-hover:text-primary' 
              : 'text-green-500'
          }`} 
          size={20} 
        />
        <span className={`flex-grow ${
          isClickable 
            ? 'text-secondary group-hover:text-secondary/80' 
            : 'text-secondary/50'
        }`}>
          {displayName}
        </span>
        {isClickable && (
          <span className="text-xs text-primary/60 group-hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity">
            Click to view
          </span>
        )}
      </div>
    </FormField>
  );
};

export const Rating = ({ label, value, showValue = true, maxStars = 5 }) => {
  // Ensure value is between 0 and maxStars
  const ratingValue = Math.max(0, Math.min(maxStars, value));

  // Generate array of star indices
  const stars = Array.from({ length: maxStars }, (_, i) => i + 1);

  return (
    <div className="flex items-center bg-gray-50 rounded-lg p-3">
      <div className="flex items-center">
        {stars.map((star) => {
          // Full star
          if (star <= Math.floor(ratingValue)) {
            return (
              <Star
                key={star}
                className="text-primary/60 fill-primary"
                size={18}
              />
            );
          }
          // Half star
          else if (star <= ratingValue + 0.5) {
            return (
              <div key={star} className="relative">
                {/* Empty star as background */}
                <Star className="text-primary/60" size={18} />
                {/* Half-filled star (clipped) */}
                <div className="absolute inset-0 overflow-hidden w-1/2">
                  <Star className="text-primary/60 fill-primary" size={18} />
                </div>
              </div>
            );
          }
          // Empty star
          else {
            return <Star key={star} className="text-primary/60" size={18} />;
          }
        })}
      </div>

      {showValue && (
        <span className="ml-2 text-base font-bold">
          {ratingValue.toFixed(1)}
        </span>
      )}
    </div>
  );
};

// FileViewer component that displays file name with icon based on file type

export default function FileViewer({ fileName, fileType, fileUrl }) {
  // Extract file name from URL if provided
 const extractFileNameFromUrl = (url) => {
  if (!url) return fileName;

  // Get last part of URL path
  const urlParts = url.split("/");
  let potentialFileName = urlParts[urlParts.length - 1].split("?")[0];

  // Remove prefix before first hyphen
  const dashIndex = potentialFileName.indexOf("-");
  if (dashIndex !== -1) {
    potentialFileName = potentialFileName.substring(dashIndex + 1);
  }

  return decodeURIComponent(potentialFileName);
};

  const displayName = fileUrl ? extractFileNameFromUrl(fileUrl) : fileName;

  const truncateFileName = (name) => {
    const maxLength = 20;
    if (!name || name.length <= maxLength) return name || "";
    const lastDotIndex = name.lastIndexOf(".");
    let extension = "";
    let baseName = name;
    if (lastDotIndex !== -1) {
      extension = name.substring(lastDotIndex);
      baseName = name.substring(0, lastDotIndex);
    }
    return `${baseName.substring(0, maxLength - 3)}...${extension}`;
  };

  const determineFileType = () => {
    if (fileType) return fileType;
    if (!fileUrl) return "";
    const extension = fileUrl.split(".").pop().toLowerCase();
    const mimeMap = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      pdf: "application/pdf",
      zip: "application/zip",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    };
    return mimeMap[extension] || "";
  };

  const currentFileType = determineFileType();

  const getFileIcon = () => {
    if (!currentFileType) return <File className="text-gray-500" size={20} />;
    if (currentFileType.startsWith("image/")) {
      return <Image className="text-teal-500" size={20} />;
    } else if (currentFileType.includes("pdf")) {
      return <FileText className="text-red-500" size={20} />;
    } else if (
      currentFileType.includes("zip") ||
      currentFileType.includes("archive")
    ) {
      return <FileArchive className="text-yellow-500" size={20} />;
    } else {
      return <FileText className="text-gray-500" size={20} />;
    }
  };

  const handleFileClick = () => {
    if (!fileUrl) return;
    window.open(fileUrl, "_blank");
  };

  return (
    <div
      className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200 w-full max-w-xs cursor-pointer hover:bg-gray-100 transition-colors"
      onClick={handleFileClick}
      title={`Click to view ${displayName}`}
    >
      <div className="mr-3">{getFileIcon()}</div>
      <div className="truncate text-gray-700 flex-grow">
        {truncateFileName(displayName)}
      </div>
      <div className="ml-2 text-gray-500">
        <ExternalLink size={16} />
      </div>
    </div>
  );
}

