import React, { useState, useEffect } from "react";
import { Calendar, Clock, User, DollarSign, X, Check, AlertTriangle, CreditCard } from "lucide-react";
import { TextAreaInput } from "../Input";
import { Button } from "../Button";

export default function AppointmentModal({
  doctor,
  slot,
  date,
  time,
  onClose,
  onConfirm,
  onUpdate,
  openAddfoundsModal,
  isLowFounds = false,
  userBalance = 0, // Add user's current balance
  onBalanceUpdate, // Callback when balance is updated
}) {
  const [formData, setFormData] = useState({
    reason: "",
  });
  const [errors, setErrors] = useState({});
  const [isConfirming, setIsConfirming] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [showBalanceWarning, setShowBalanceWarning] = useState(false);

  // Check if user has sufficient funds
  const doctorInfo = getDoctorInfo();
  const consultationFee = parseFloat(doctorInfo.fee);
  const hasSufficientFunds = userBalance >= consultationFee;
  const balanceDeficit = Math.max(0, consultationFee - userBalance);

  useEffect(() => {
    // Show balance warning if funds are insufficient
    if (!hasSufficientFunds) {
      setShowBalanceWarning(true);
    }
  }, [hasSufficientFunds]);

  // Validation function
  const validateField = (name, value) => {
    switch (name) {
      case "reason":
        if (!value.trim())
          return "Please provide a reason for your appointment";
        if (value.trim().length < 10)
          return "Please provide more details (minimum 10 characters)";
        if (value.trim().length > 500)
          return "Description is too long (maximum 500 characters)";
        return "";
      default:
        return "";
    }
  };

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log("Field changed:", name, "Value:", value);

    // Update form data
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Validate field and update errors
    const error = validateField(name, value);
    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));

    // Call onUpdate if provided
    if (onUpdate) {
      onUpdate({ ...formData, [name]: value });
    }
  };

  const handleConfirm = async () => {
    // Check funds first
    if (!hasSufficientFunds) {
      setShowBalanceWarning(true);
      return;
    }

    // Validate all fields before confirming
    const reasonError = validateField("reason", formData.reason);
    if (reasonError) {
      setErrors((prev) => ({ ...prev, reason: reasonError }));
      return;
    }

    setIsConfirming(true);

    try {
      // Call onConfirm prop if provided
      if (onConfirm) {
        await onConfirm({
          doctor,
          slot,
          date,
          time,
          reason: formData.reason,
          fee: consultationFee,
        });
      } else {
        // Simulate API call if no onConfirm provided
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }

      setIsConfirming(false);
      setIsConfirmed(true);

      // Auto close after success
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error) {
      setIsConfirming(false);
      console.error("Confirmation failed:", error);
      // Handle error state here if needed
    }
  };

  const handleAddFunds = () => {
    if (openAddfoundsModal) {
      openAddfoundsModal({
        minimumAmount: balanceDeficit,
        recommendedAmount: Math.max(balanceDeficit + 50, 100), // Suggest adding extra
        currentBalance: userBalance,
        requiredAmount: consultationFee,
      });
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return { date: "23 June, 2025", day: "Monday" };
    const date = new Date(dateString);
    const options = { day: "numeric", month: "long", year: "numeric" };
    const dayOptions = { weekday: "long" };
    return {
      date: date.toLocaleDateString("en-US", options),
      day: date.toLocaleDateString("en-US", dayOptions),
    };
  };

  // Format time slot from timestamps
  const formatTimeSlot = () => {
    if (time) return time; // Use provided time if available

    if (slot?.startTime && slot?.endTime) {
      const startTime = new Date(slot.startTime);
      const endTime = new Date(slot.endTime);

      const formatTime = (date) => {
        return date.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
      };

      return `${formatTime(startTime)} - ${formatTime(endTime)}`;
    }

    return "10:24 AM - 10:54 AM"; // Fallback
  };

  // Calculate duration
  const calculateDuration = () => {
    if (slot?.startTime && slot?.endTime) {
      const duration = Math.round(
        (slot.endTime - slot.startTime) / (1000 * 60)
      ); // in minutes
      return `${duration} minutes`;
    }
    return "30 minutes"; // Default duration
  };

  // Extract doctor information
  function getDoctorInfo() {
    if (!doctor) {
      return {
        name: "Dr. Don Bob",
        specialty: "Healthcare Provider",
        fee: "24.09",
      };
    }

    const firstName = doctor.user?.firstName || "Doctor";
    const lastName = doctor.user?.lastName || "";
    const name = `Dr. ${firstName} ${lastName}`.trim();

    const specialties = doctor.specialization || [];
    const specialty =
      specialties.length > 0 ? specialties.join(", ") : "Healthcare Provider";

    const fee =
      doctor.pricePerSession != null
        ? Number(doctor.pricePerSession).toFixed(2)
        : "24.09";

    return { name, specialty, fee };
  }

  const formattedDate = formatDate(date);
  const timeSlot = formatTimeSlot();
  const duration = calculateDuration();
  const hasErrors = Object.values(errors).some((error) => error !== "");
  const isFormValid = formData.reason.trim() && !hasErrors;
  const canConfirm = isFormValid && hasSufficientFunds;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-30 animate-in fade-in duration-200 ">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform animate-in slide-in-from-bottom-4 duration-300 h-[97vh] overflow-y-auto scrollbar-hide">
        {/* Header */}
        <div className="relative p-4 pb-4">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            Confirm Appointment
          </h2>
          <p className="text-gray-600 text-sm">
            Please review your appointment details
          </p>
        </div>

        {/* Appointment Details */}
        <div className="px-3 pb-4 space-y-4">
          <div className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
            <Calendar className="w-5 h-5 text-blue-600" />
            <div>
              <p className="font-medium text-gray-900">{formattedDate.date}</p>
              <p className="text-sm text-gray-600">{formattedDate.day}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <Clock className="w-5 h-5 text-purple-600" />
            <div>
              <p className="font-medium text-gray-900">{timeSlot}</p>
              <p className="text-sm text-gray-600">{duration}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <User className="w-5 h-5 text-green-600" />
            <div>
              <p className="font-medium text-gray-900">{doctorInfo.name}</p>
              <p className="text-sm text-gray-600">{doctorInfo.specialty}</p>
              {doctor?.experienceYears && (
                <p className="text-xs text-gray-500">
                  {doctor.experienceYears} years experience
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Appointment Reason */}
        <div className="px-6 pb-4">
          <TextAreaInput
            name="reason"
            label="Appointment Reason (10-500 characters)"
            className="mb-4"
            placeholder="Please describe the reason for your appointment..."
            value={formData.reason}
            onChange={handleChange}
            required={true}
            errors={errors.reason}
          />

          <div className="mt-1 text-xs text-gray-500 text-right">
            {formData.reason.length}/500 characters
          </div>
        </div>

        {/* Balance and Fee Information */}
        <div className="px-6 pb-4 space-y-3">
          {/* Current Balance */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-gray-600">Current Balance</span>
            </div>
            <span className="text-lg font-semibold text-gray-900">
              ${userBalance.toFixed(2)}
            </span>
          </div>

          {/* Consultation Fee */}
          <div className={`flex items-center justify-between p-3 rounded-lg border ${
            hasSufficientFunds
              ? "bg-gradient-to-r from-teal-50 to-emerald-50 border-teal-200"
              : "bg-gradient-to-r from-red-50 to-red-100 border-red-200"
          }`}>
            <div className="flex items-center space-x-2">
              <DollarSign className={`w-5 h-5 ${hasSufficientFunds ? "text-teal-600" : "text-red-600"}`} />
              <span className="text-sm text-gray-600">Consultation Fee</span>
            </div>
            <span className={`text-xl font-bold ${hasSufficientFunds ? "text-teal-600" : "text-red-600"}`}>
              ${doctorInfo.fee}
            </span>
          </div>

          {/* Low Funds Warning */}
          {!hasSufficientFunds && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-semibold text-red-900 mb-1">
                    Insufficient Funds
                  </h4>
                  <p className="text-sm text-red-700 mb-3">
                    You need ${balanceDeficit.toFixed(2)} more to book this appointment.
                    Current balance: ${userBalance.toFixed(2)}
                  </p>
                  <button
                    onClick={handleAddFunds}
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors duration-200"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Add Funds</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Success Balance Message */}
          {hasSufficientFunds && userBalance > consultationFee && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <Check className="w-5 h-5 text-green-600" />
                <p className="text-sm text-green-700">
                  Remaining balance after appointment: ${(userBalance - consultationFee).toFixed(2)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Confirm Button */}
        <div className="px-6 pb-6">
          <button
            onClick={handleConfirm}
            disabled={isConfirming || isConfirmed || !canConfirm}
            className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-300 transform ${
              isConfirmed
                ? "bg-green-500 hover:bg-green-600"
                : isConfirming
                ? "bg-teal-400 cursor-not-allowed"
                : canConfirm
                ? "bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 hover:scale-105 shadow-lg hover:shadow-xl"
                : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            {isConfirmed ? (
              <div className="flex items-center justify-center space-x-2">
                <Check className="w-5 h-5" />
                <span>Confirmed!</span>
              </div>
            ) : isConfirming ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Confirming...</span>
              </div>
            ) : !hasSufficientFunds ? (
              <span>Add Funds to Continue</span>
            ) : (
              <span>Confirm Appointment</span>
            )}
          </button>

          {/* Helper Text */}
          {!isFormValid && !hasErrors && (
            <p className="text-sm text-gray-500 mt-2 text-center">
              Please provide a reason for your appointment
            </p>
          )}
          
          {!hasSufficientFunds && isFormValid && (
            <p className="text-sm text-red-500 mt-2 text-center">
              Add ${balanceDeficit.toFixed(2)} to your wallet to book this appointment
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Cancel Modal Component
export const CancelModal = ({ appointment, onClose, onConfirm, loading }) => {
  const [reason, setReason] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Cancel reason submitted:", reason);
    console.log("Appointment ID:", appointment);
    if (reason.trim()) {
      onConfirm(appointment.id, reason.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-red-500" />
          <h3 className="text-lg font-semibold text-gray-900">
            Cancel Appointment
          </h3>
        </div>

        <p className="text-gray-600 mb-4">
          Are you sure you want to cancel your appointment with{" "}
          {appointment.doctorName}?
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for cancellation (required)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              rows="3"
              placeholder="Please provide a reason..."
              required
              disabled={loading}
            />
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={loading}
            >
              Keep Appointment
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-red-500 hover:bg-red-600"
              disabled={loading || !reason.trim()}
            >
              {loading ? "Cancelling..." : "Cancel Appointment"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

