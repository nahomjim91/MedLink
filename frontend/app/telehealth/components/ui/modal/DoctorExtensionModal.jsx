import React, { useState } from 'react';
import { X, Clock, CheckCircle, XCircle, User, AlertCircle } from 'lucide-react';

const DoctorExtensionModal = ({ 
  isOpen, 
  onClose, 
  extensionRequestData, // Contains patient info, request message, etc.
  onAcceptExtension, 
  onRejectExtension,
  appointmentId,
  isProcessing = false
}) => {
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  if (!isOpen) return null;

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      await onAcceptExtension(appointmentId);
      // Modal will close automatically via parent component
    } catch (error) {
      console.error('Error accepting extension:', error);
    } finally {
      setIsAccepting(false);
    }
  };

  const handleReject = async () => {
    setIsRejecting(true);
    try {
      await onRejectExtension(appointmentId, rejectReason);
      setRejectReason('');
      setShowRejectForm(false);
      // Modal will close automatically via parent component
    } catch (error) {
      console.error('Error rejecting extension:', error);
    } finally {
      setIsRejecting(false);
    }
  };

  const handleShowRejectForm = () => {
    setShowRejectForm(true);
  };

  const handleCancelReject = () => {
    setShowRejectForm(false);
    setRejectReason('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 transform transition-all duration-300 scale-100">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                Extension Request
              </h2>
              <p className="text-sm text-gray-500">
                Patient requesting additional time
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
        <div className="p-6">
          {/* Patient Request Info */}
          <div className="space-y-4">
            {/* Patient Info */}
            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
              <User className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-blue-900">
                  {extensionRequestData?.patientName || 'Patient'}
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  has requested an extension for this appointment
                </p>
                {extensionRequestData?.requestTime && (
                  <p className="text-xs text-blue-600 mt-1">
                    Requested: {new Date(extensionRequestData.requestTime).toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>

            {/* Request Message */}
            {extensionRequestData?.message && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Reason for extension:
                </p>
                <p className="text-sm text-gray-600 italic">
                  "{extensionRequestData.message}"
                </p>
              </div>
            )}

            {/* Current Appointment Info */}
            <div className="text-sm text-gray-600 space-y-1">
              <p>
                <span className="font-medium">Appointment:</span> {extensionRequestData?.appointmentTime || 'Current session'}
              </p>
              <p>
                <span className="font-medium">Duration:</span> {extensionRequestData?.originalDuration || '30 minutes'}
              </p>
            </div>

            {/* Action Buttons */}
            {!showRejectForm && (
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleAccept}
                  disabled={isAccepting || isProcessing}
                  className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {isAccepting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Accepting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Accept Extension
                    </>
                  )}
                </button>
                <button
                  onClick={handleShowRejectForm}
                  disabled={isProcessing}
                  className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  <XCircle className="w-5 h-5" />
                  Decline
                </button>
              </div>
            )}

            {/* Reject Form */}
            {showRejectForm && (
              <div className="space-y-4 pt-4 border-t border-gray-200">
                <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-red-800">
                    <p className="font-medium">Declining Extension Request</p>
                    <p className="mt-1">
                      Please provide a reason for declining the extension request.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for declining (optional)
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="e.g., Need to keep to schedule, next appointment waiting, etc."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                    rows={3}
                    maxLength={200}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {rejectReason.length}/200 characters
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleReject}
                    disabled={isRejecting || isProcessing}
                    className="flex-1 bg-red-600 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {isRejecting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Declining...
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4" />
                        Confirm Decline
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleCancelReject}
                    disabled={isRejecting || isProcessing}
                    className="flex-1 bg-gray-100 text-gray-700 py-2.5 px-4 rounded-lg font-medium hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorExtensionModal;