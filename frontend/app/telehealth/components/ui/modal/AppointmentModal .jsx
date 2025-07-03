import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  User,
  DollarSign,
  X,
  Check,
  AlertTriangle,
  CreditCard,
  Phone,
  Mail,
  MapPin,
  FileText,
  Stethoscope,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

import { TextAreaInput } from "../Input";
import { Button } from "../Button";
import {
  formatAppointmentDate,
  formatAppointmentTime,
  getStatusBadgeClass,
} from "../../../utils/appointmentUtils";
import { useAppointment } from "../../../hooks/useAppointment ";
import Link from "next/link";

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
          <div
            className={`flex items-center justify-between p-3 rounded-lg border ${
              hasSufficientFunds
                ? "bg-gradient-to-r from-teal-50 to-emerald-50 border-teal-200"
                : "bg-gradient-to-r from-red-50 to-red-100 border-red-200"
            }`}
          >
            <div className="flex items-center space-x-2">
              <DollarSign
                className={`w-5 h-5 ${
                  hasSufficientFunds ? "text-teal-600" : "text-red-600"
                }`}
              />
              <span className="text-sm text-gray-600">Consultation Fee</span>
            </div>
            <span
              className={`text-xl font-bold ${
                hasSufficientFunds ? "text-teal-600" : "text-red-600"
              }`}
            >
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
                    You need ${balanceDeficit.toFixed(2)} more to book this
                    appointment. Current balance: ${userBalance.toFixed(2)}
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
                  Remaining balance after appointment: $
                  {(userBalance - consultationFee).toFixed(2)}
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
              Add ${balanceDeficit.toFixed(2)} to your wallet to book this
              appointment
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

export const AppointmentDetailModal = ({
  isOpen,
  onClose,
  appointmentId,
  userRole = "PATIENT", // "PATIENT" or "DOCTOR"
}) => {
  const [appointment, setAppointments] = useState(null);
  const [loading, setLoading] = useState(false);
  const { fetchAppointment } = useAppointment();

  useEffect(() => {
    const fetchAppointmentLocally = async () => {
      if (appointmentId && isOpen) {
        setLoading(true);
        try {
          const data = await fetchAppointment(appointmentId);
          setAppointments(data);
        } catch (error) {
          console.error("Error fetching appointment:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchAppointmentLocally();
  }, [appointmentId, isOpen, fetchAppointment]);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // console.log("appointment", appointment);
  if (!isOpen || !appointmentId) return null;

// Show loading state
if (loading || !appointment) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-center mt-2">Loading appointment details...</p>
      </div>
    </div>
  );
}

  // Payment status styling
  const getPaymentStatusClass = (status) => {
    switch (status) {
      case "PAID":
      case "COMPLETED":
        return "bg-emerald-100 text-emerald-700 border border-emerald-200";
      case "PENDING":
        return "bg-yellow-100 text-yellow-700 border border-yellow-200";
      case "FAILED":
      case "CANCELLED":
        return "bg-red-100 text-red-700 border border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border border-gray-200";
    }
  };

  // Get the other person's details based on user role
  const otherPerson =
    userRole === "DOCTOR" ? appointment.patient : appointment.doctor;
  const otherPersonTitle = userRole === "DOCTOR" ? "Patient" : "Doctor";

  return (
    <div
      onClick={handleOverlayClick}
      className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4 transition-opacity duration-300"
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-hide transform transition-all duration-300 animate-modal-enter">
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white rounded-t-2xl">
          <div>
            <h3 className="text-xl md:text-2xl font-bold text-secondary/70">
              Appointment Details
            </h3>
            <p className="text-sm text-secondary/60 mt-1">
              ID: #{appointment.appointmentId}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-secondary" />
          </button>
        </div>

        <div className="p-4 md:p-6">
          {/* Status and Payment Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-secondary/80">
                  Status
                </span>
                <span
                  className={`px-3 py-1.5 text-xs font-semibold rounded-full ${getStatusBadgeClass(
                    appointment.status
                  )}`}
                >
                  {appointment.status.replace("_", " ")}
                </span>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-secondary/80">
                  Payment Status
                </span>
                <span
                  className={`px-3 py-1.5 text-xs font-semibold rounded-full ${getPaymentStatusClass(
                    appointment.paymentStatus
                  )}`}
                >
                  {appointment.paymentStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Date & Time Card */}
              <div className="bg-gradient-to-br from-primary/10 to-primary/20 rounded-xl p-4 md:p-6 border border-primary/20">
                <h4 className="font-semibold text-secondary/80 mb-4 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-primary" />
                  Schedule
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-4 h-4 text-primary" />
                    <div>
                      <p className="font-medium text-secondary/70">
                        {formatAppointmentDate(appointment.scheduledStartTime)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Clock className="w-4 h-4 text-primary" />
                    <div>
                      <p className="font-medium text-secondary/70">
                        {formatAppointmentTime(appointment.scheduledStartTime)}{" "}
                        - {formatAppointmentTime(appointment.scheduledEndTime)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div className="bg-gradient-to-br from-blue-50 to-teal-50 rounded-xl p-4 md:p-6 border border-blue-100">
                <h4 className="font-semibold text-secondary/80 mb-4 flex items-center">
                  <DollarSign className="w-5 h-5 mr-2 text-primary/60" />
                  Payment Information
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-secondary/60">Consultation Fee:</span>
                    <span className="font-semibold text-secondary/70">
                      ${appointment.price}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-secondary/60">Payment Method:</span>
                    <div className="flex items-center space-x-2">
                      <CreditCard className="w-4 h-4 text-primary/60" />
                      <span className="font-medium text-secondary/70">
                        Online Payment
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reason/Notes */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 md:p-6 border border-purple-100">
                <h4 className="font-semibold text-secondary/80 mb-3 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-purple-600" />
                  Reason for Visit
                </h4>
                <p className="text-secondary/70 leading-relaxed">
                  {appointment.reasonNote || "No specific reason provided"}
                </p>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Other Person's Profile */}
              <div className="bg-white rounded-xl p-4 md:p-6 border-2 border-gray-100 shadow-sm">
                <h4 className="font-semibold text-secondary/80 mb-4 flex items-center">
                  {userRole === "DOCTOR" ? (
                    <Users className="w-5 h-5 mr-2 text-gray-600" />
                  ) : (
                    <Stethoscope className="w-5 h-5 mr-2 text-gray-600" />
                  )}
                  {otherPersonTitle} Information
                </h4>

                <div className="flex jusc items-center space-x-4">
                  <img
                    src={
                      otherPerson?.profileImageUrl ||
                      `https://placehold.co/80x80/E2E8F0/4A5568?text=${otherPersonTitle.charAt(
                        0
                      )}`
                    }
                    alt={`${otherPerson?.firstName} ${otherPerson?.lastName}`}
                    className="w-16 h-16 md:w-20 md:h-20 rounded-full border-3 border-gray-200 object-cover"
                    onError={(e) => {
                      e.target.src = `https://placehold.co/80x80/E2E8F0/4A5568?text=${otherPersonTitle.charAt(
                        0
                      )}`;
                    }}
                  />
                  <div className="flex-1">
                    <h5 className="font-bold text-lg text-secondary/70 mb-1">
                      {userRole === "DOCTOR"
                        ? `${otherPerson?.firstName} ${otherPerson?.lastName}`
                        : `Dr. ${otherPerson?.firstName} ${otherPerson?.lastName}`}
                    </h5>
                    {userRole === "PATIENT" && (
                      <p className="text-secondary/60 font-medium mb-2">
                        {otherPerson?.doctorProfile?.specialization ||
                          "General Practitioner"}
                      </p>
                    )}

                    <div className="space-y-2 text-sm">
                      {otherPerson?.email && (
                        <div className="flex items-center space-x-2">
                          <Mail className="w-4 h-4 text-gray-500" />
                          <span className="text-secondary/60">
                            {otherPerson.email}
                          </span>
                        </div>
                      )}
                      {otherPerson?.phoneNumber && (
                        <div className="flex items-center space-x-2">
                          <Phone className="w-4 h-4 text-gray-500" />
                          <span className="text-secondary/60">
                            {otherPerson.phoneNumber}
                          </span>
                        </div>
                      )}
                      {otherPerson?.address && (
                        <div className="flex items-start space-x-2">
                          <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                          <span className="text-secondary/60">
                            {otherPerson.address}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-4 md:p-6 border border-gray-200">
                <h4 className="font-semibold text-secondary/80 mb-4 flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2 text-gray-600" />
                  Additional Information
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-secondary/60">Appointment Type:</span>
                    <span className="font-medium text-secondary/70">
                      {appointment.appointmentType || "Consultation"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary/60">Created On:</span>
                    <span className="font-medium text-secondary/70">
                      {appointment.createdAt
                        ? new Date(appointment.createdAt).toLocaleDateString()
                        : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary/60">Last Updated:</span>
                    <span className="font-medium text-secondary/70">
                      {appointment.updatedAt
                        ? new Date(appointment.updatedAt).toLocaleDateString()
                        : "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="bg-white rounded-xl p-4 md:p-6 border border-gray-200">
                <h4 className="font-semibold text-secondary/80 mb-4">
                  Quick Actions
                </h4>
                <div className="space-y-3">
                  {appointment.status === "UPCOMING" ||
                  appointment.status === "CONFIRMED" ? (
                    <>
                      <button className="w-full px-4 py-3 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white rounded-xl font-semibold transition-all shadow-lg">
                        Join Video Call
                      </button>
                      <button className="w-full px-4 py-3 border-2 border-red-300 text-red-600 hover:bg-red-50 rounded-xl font-semibold transition-all">
                        Cancel Appointment
                      </button>
                    </>
                  ) : appointment.status === "COMPLETED" ? (
                    <button className="w-full px-4 py-3 border-2 border-blue-300 text-blue-600 hover:bg-blue-50 rounded-xl font-semibold transition-all">
                      View Medical Records
                    </button>
                  ) : null}

                  <Link href={`/telehealth/${userRole.toLocaleLowerCase()}/chats?appointmentId=${appointmentId}`} className="w-full px-4 py-3 border-2 border-gray-300 text-secondary/70 hover:bg-gray-50 rounded-xl font-semibold transition-all">
                    Contact {otherPersonTitle}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes modal-enter {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-modal-enter {
          animation: modal-enter 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};
