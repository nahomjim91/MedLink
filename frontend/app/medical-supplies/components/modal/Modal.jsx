'use client';
import { useEffect } from 'react';
import { StepProgressIndicator } from '../ui/StepProgressIndicator';

// for product and batch creation
export  function ProductAndBatchModel({ onClose, currentStep, getTotalSteps, getFormTitle, error, stepComponents }) {
  // Handle escape key press
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    
    // Cleanup event listener on component unmount
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    
    // Cleanup - restore body scroll on unmount
    return () => {
      document.body.style.overflow = 'unset';
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
              onClick={() => setError('')} // Assuming you have a setError function
              className="absolute top-2 right-2 text-red-700 hover:text-red-900"
              aria-label="Dismiss error"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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