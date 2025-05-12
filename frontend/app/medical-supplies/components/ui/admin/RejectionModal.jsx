// components/medical-supplies/admin/RejectionModal.js
import { useState } from "react";
import { Button } from "../Button";

export default function RejectionModal({
  isOpen,
  onClose,
  onSubmit,
  userName,
  isLoading,
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate reason
    if (!reason.trim()) {
      setError("Please provide a rejection reason");
      return;
    }

    // Submit the form
    onSubmit(reason);

    // Reset form state
    setReason("");
    setError("");
  };

  // If modal is not open, don't render anything
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full z-10 relative">
          {/* Header */}
          <div className="px-6 py-4 border-b border-secondary/40">
            <h3 className="text-lg font-medium text-secondary">
              Reject User Application
            </h3>
            <p className="text-sm text-secondary/70">
              Please provide a reason for rejecting {userName}'s application.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="px-6 py-4">
              <div className="mb-4">
                <label
                  htmlFor="reason"
                  className="block text-sm font-medium text-secondary/80 mb-1"
                >
                  Rejection Reason <span className="text-red-600">*</span>
                </label>
                <textarea
                  id="reason"
                  name="reason"
                  rows={4}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Please explain why this application is being rejected..."
                  className={`w-full px-3 py-2 border rounded-md resize-none focus:outline-none focus:ring-2 ${
                    error ? "border-error focus:border-error focus:ring-error/30" : "border-gray-200 focus:border-primary focus:ring-primary/20"
                  }`}
                />
                {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-2 rounded-b-lg">
              <Button
                type={"button"}
                variant="outline"
                className="px-6"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              {/* <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-red-600 border border-transparent rounded-md font-medium text-white hover:bg-red-700 focus:outline-none disabled:opacity-50"
              >
                {isLoading ? "Rejecting..." : "Reject Application"}
              </button> */}
              <Button
                type={"submit"}
                variant="fill"
                color="error"
                className="px-6"
                disabled={isLoading}
              >
                {" "}
                {isLoading ? "Rejecting..." : "Reject Application"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
