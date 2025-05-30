'use client';
import { useEffect } from 'react';
import { X, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "danger", // "danger", "warning", "info"
  isLoading = false,
}) {
  // Handle escape key press
  useEffect(() => {
    if (!isOpen) return;

    const handleEscapeKey = (event) => {
      if (event.key === 'Escape' && !isLoading) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    
    // Cleanup event listener on component unmount
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [onClose, isOpen, isLoading]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;

    document.body.style.overflow = 'hidden';
    
    // Cleanup - restore body scroll on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    // Only close if clicking the backdrop itself, not the modal content, and not loading
    if (e.target === e.currentTarget && !isLoading) {
      onClose();
    }
  };

  // Get icon and styles based on type
  const getTypeConfig = () => {
    switch (type) {
      case "danger":
        return {
          icon: AlertTriangle,
          iconColor: "text-red-500",
          iconBg: "bg-red-100",
          confirmBtn: "bg-red-500 hover:bg-red-600 text-white",
        };
      case "warning":
        return {
          icon: AlertCircle,
          iconColor: "text-yellow-500",
          iconBg: "bg-yellow-100",
          confirmBtn: "bg-yellow-500 hover:bg-yellow-600 text-white",
        };
      case "info":
        return {
          icon: Info,
          iconColor: "text-blue-500",
          iconBg: "bg-blue-100",
          confirmBtn: "bg-blue-500 hover:bg-blue-600 text-white",
        };
      default:
        return {
          icon: AlertTriangle,
          iconColor: "text-red-500",
          iconBg: "bg-red-100",
          confirmBtn: "bg-red-500 hover:bg-red-600 text-white",
        };
    }
  };

  const config = getTypeConfig();
  const IconComponent = config.icon;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      {/* Backdrop - clickable to close */}
      <div 
        className="absolute inset-0 bg-black/30" 
        onClick={handleBackdropClick}
        aria-label="Close modal"
      />
      
      {/* Modal content */}
      <div className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-md p-6">
        {/* Close button */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header with icon and title */}
        <div className="flex items-center gap-3 mb-4 pr-8">
          <div className={`p-2 rounded-full ${config.iconBg}`}>
            <IconComponent className={`w-5 h-5 ${config.iconColor}`} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>

        {/* Message */}
        <p className="text-gray-600 mb-6 leading-relaxed">{message}</p>

        {/* Action buttons */}
        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="transition-colors"
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className={`${config.confirmBtn} transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isLoading ? "Processing..." : confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}

// how to use it 
{/* <ConfirmationModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  onConfirm={handleConfirm}
  title="Delete Item"
  message="This action cannot be undone. Are you sure?"
  type="danger"
  isLoading={isDeleting}
/> */}