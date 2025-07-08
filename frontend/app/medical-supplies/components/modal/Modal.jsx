"use client";
import { useEffect } from "react";
import { StepProgressIndicator } from "../ui/StepProgressIndicator";
import { X } from "lucide-react";

// for product and batch creation
export function ProductAndBatchModel({
  onClose,
  currentStep,
  getTotalSteps,
  getFormTitle,
  error,
  stepComponents,
}) {
  // Handle escape key press
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscapeKey);

    // Cleanup event listener on component unmount
    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";

    // Cleanup - restore body scroll on unmount
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    // Only close if clicking the backdrop itself, not the modal content
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      {/* Backdrop - clickable to close */}
      <div
        className="absolute inset-0 bg-black/30"
        onClick={handleBackdropClick}
        aria-label="Close modal"
      />

      {/* Modal content */}
      <div className="relative w-full max-w-md md:max-w-5xl mx-auto bg-white rounded-2xl shadow-md p-6 md:py-6 md:px-12">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
          aria-label="Close modal"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <h1 className="text-2xl font-bold text-secondary mb-6 pr-8">
          {getFormTitle()}
        </h1>

        {/* Error message display */}
        {error && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 relative"
            role="alert"
          >
            <span className="block sm:inline">{error}</span>
            <button
              onClick={() => setError("")} // Assuming you have a setError function
              className="absolute top-2 right-2 text-red-700 hover:text-red-900"
              aria-label="Dismiss error"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        )}

        {/* Progress indicator - Hide on success page */}
        {currentStep < getTotalSteps() && (
          <StepProgressIndicator
            currentStep={currentStep}
            totalSteps={getTotalSteps() - 1}
            className="mb-8"
          />
        )}

        {/* Current step content */}
        <div className="overflow-y-auto max-h-[60vh] pr-2">
          {stepComponents[currentStep]}
        </div>
      </div>
    </div>
  );
}

export const Modal = ({
  isOpen,
  onClose,
  children,
  title,
  size = "md",
  hideCloseButton = false,
}) => {
  // Effect to handle Escape key press for closing the modal
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    // Cleanup the event listener on component unmount or when modal is closed
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  // Effect to prevent body scrolling when the modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    // Cleanup the style on component unmount
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  // Don't render anything if the modal is not open
  if (!isOpen) {
    return null;
  }

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
  };

  return (
    // Backdrop: a full-screen semi-transparent overlay
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 bg-opacity-50 transition-opacity"
      onClick={onClose} // Close modal on backdrop click
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
    >
      {/* Modal Panel: the main content box */}
      <div
        className={`relative w-full ${sizeClasses[size]} m-4 bg-white rounded-lg shadow-xl flex flex-col max-h-[90vh]`}
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
      >
        {/* Modal Header */}
        {title && (
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3
              id="modal-title"
              className="text-lg font-semibold text-gray-900"
            >
              {title}
            </h3>
            {!hideCloseButton && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                aria-label="Close modal"
              >
                <X size={24} />
              </button>
            )}
          </div>
        )}

        {/* Modal Content */}
        {/* If there's no title, the content area handles the close button */}
        {!title && !hideCloseButton && (
          <button
            onClick={onClose}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 focus:outline-none"
            aria-label="Close modal"
          >
            <X size={24} />
          </button>
        )}

        <div className="overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};
