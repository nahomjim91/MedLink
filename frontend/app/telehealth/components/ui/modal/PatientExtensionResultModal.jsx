import React, { useEffect, useState } from 'react';
import { X, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

const PatientExtensionResultModal = ({ 
  isOpen, 
  onClose, 
  extensionStatus, // { isAccepted, isRejected, message, doctorReason }
  autoCloseDelay = 8000 // Auto close after 8 seconds
}) => {
  const [countdown, setCountdown] = useState(autoCloseDelay / 1000);

  useEffect(() => {
    if (!isOpen) return;

    // Start countdown
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Reset countdown when modal opens
    setCountdown(autoCloseDelay / 1000);

    return () => {
      clearInterval(interval);
    };
  }, [isOpen, onClose, autoCloseDelay]);

  if (!isOpen) return null;

  const isAccepted = extensionStatus?.isAccepted;
  const isRejected = extensionStatus?.isRejected;
  const message = extensionStatus?.message;
  const doctorReason = extensionStatus?.doctorReason;

  return (
    <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 scale-100">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              isAccepted ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {isAccepted ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                Extension {isAccepted ? 'Approved' : 'Declined'}
              </h2>
              <p className="text-sm text-gray-500">
                Response from your doctor
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Status Message */}
          <div className={`flex items-start gap-3 p-4 rounded-lg ${
            isAccepted ? 'bg-green-50' : 'bg-red-50'
          }`}>
            {isAccepted ? (
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            )}
            <div className={`text-sm ${isAccepted ? 'text-green-800' : 'text-red-800'}`}>
              <p className="font-medium">
                {isAccepted ? 'Extension Approved!' : 'Extension Declined'}
              </p>
              <p className="mt-1">
                {isAccepted 
                  ? 'Your doctor has approved the extension request. You have additional time for this appointment.'
                  : 'Your doctor has declined the extension request. Please wrap up the appointment.'
                }
              </p>
            </div>
          </div>

          {/* Doctor's Reason/Message */}
          {(doctorReason || message) && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-2">
                {isAccepted ? 'Doctor\'s note:' : 'Reason for decline:'}
              </p>
              <p className="text-sm text-gray-600 italic">
                "{doctorReason || message}"
              </p>
            </div>
          )}

          {/* Next Steps */}
          <div className={`p-4 rounded-lg border-l-4 ${
            isAccepted ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
          }`}>
            <div className="flex items-start gap-3">
              <AlertCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                isAccepted ? 'text-green-600' : 'text-red-600'
              }`} />
              <div className={`text-sm ${
                isAccepted ? 'text-green-800' : 'text-red-800'
              }`}>
                <p className="font-medium">
                  {isAccepted ? 'What happens next:' : 'Next steps:'}
                </p>
                <ul className="mt-1 list-disc list-inside space-y-1">
                  {isAccepted ? (
                    <>
                      <li>Continue with your appointment</li>
                      <li>You have additional time to discuss your concerns</li>
                      <li>No additional charges will apply</li>
                    </>
                  ) : (
                    <>
                      <li>Please conclude your appointment</li>
                      <li>You can book a follow-up appointment if needed</li>
                      <li>Contact support if you have questions</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* Auto-close countdown */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>This notification will close automatically</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {countdown}s
            </span>
          </div>

          {/* Action Button */}
          <button
            onClick={onClose}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
              isAccepted 
                ? 'bg-green-600 text-white hover:bg-green-700' 
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            {isAccepted ? 'Continue Appointment' : 'Understood'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PatientExtensionResultModal;