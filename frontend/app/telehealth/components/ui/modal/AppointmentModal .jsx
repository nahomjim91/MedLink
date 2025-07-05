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
  Wallet,
  ExternalLink,
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
import { useAuth } from "../../../hooks/useAuth";
import { useQuery } from "@apollo/client";
import { GET_DOCTOR_BY_ID } from "../../../api/graphql/queries";
import {
  GET_DOCTOR_AVAILABLE_SLOTS,
  GET_DOCTOR_SLOTS,
} from "../../../api/graphql/doctor/availabilitySlotQueries";

import TelehealthAddFunds from "../AddFound";
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
          <h3 className="text-lg font-semibold text-secondary">
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
              className="text-sm md:text-base"
              onClick={onClose}
              disabled={loading}
            >
              Keep Appointment
            </Button>
            <Button
              type="submit"
              className="bg-red-500 hover:bg-red-600 text-sm md:text-base"
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

export function AppointmentModal({
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
          <h2 className="text-2xl font-bold text-secondary mb-1">
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
              <p className="font-medium text-secondary">{formattedDate.date}</p>
              <p className="text-sm text-gray-600">{formattedDate.day}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <Clock className="w-5 h-5 text-purple-600" />
            <div>
              <p className="font-medium text-secondary">{timeSlot}</p>
              <p className="text-sm text-gray-600">{duration}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <User className="w-5 h-5 text-green-600" />
            <div>
              <p className="font-medium text-secondary">{doctorInfo.name}</p>
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
            <span className="text-lg font-semibold text-secondary">
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
                      process.env.NEXT_PUBLIC_TELEHEALTH_API_URL +
                      otherPerson?.profileImageUrl
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
                    <Link
                      href={`/telehealth/${userRole.toLocaleLowerCase()}/chats?appointmentId=${appointmentId}`}
                      className="w-full px-4 py-3 border-2 border-blue-300 text-blue-600 hover:bg-blue-50 rounded-xl font-semibold transition-all"
                    >
                      View Medical Records
                    </Link>
                  ) : null}
                  {appointment.status !== "COMPLETED" && (
                    <Link
                      href={`/telehealth/${userRole.toLocaleLowerCase()}/chats?appointmentId=${appointmentId}`}
                      className="w-full px-4 py-3 border-2 border-gray-300 text-secondary/70 hover:bg-gray-50 rounded-xl font-semibold transition-all"
                    >
                      Contact {otherPersonTitle}
                    </Link>
                  )}
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

export const ExtensionRequestModal = ({
  isOpen,
  onClose,
  appointmentId,
  onSendRequest,
}) => {
  const { user } = useAuth();
  const { fetchAppointment } = useAppointment();
  const [appointment, setAppointment] = useState(null);
  const [doctorId, setDoctorId] = useState(null);
  const [formattedSelectedDate, setFormattedSelectedDate] = useState("");
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasConflictingAppointments, setHasConflictingAppointments] =
    useState(false);

  useEffect(() => {
    const today = new Date();
    const todayDate = today.getDate();
    // Format date for GraphQL query (YYYY-MM-DD format)
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(todayDate).padStart(2, "0");
    setFormattedSelectedDate(`${year}-${month}-${day}`);
  }, []);

  // Fetch doctor data
  const {
    data: doctorData,
    loading: doctorLoading,
    error: doctorError,
  } = useQuery(GET_DOCTOR_BY_ID, {
    variables: { id: doctorId },
    skip: !doctorId,
  });
  const {
    data: slotsData,
    loading: slotsLoading,
    error: slotsError,
    refetch: refetchSlots,
  } = useQuery(GET_DOCTOR_SLOTS, {
    variables: {
      doctorId: doctorId,
      date: formattedSelectedDate,
    },
    skip: !doctorId || !formattedSelectedDate,
  });
  const doctor = doctorData?.doctorById;
  const doctorUpcomingSlots = slotsData?.doctorSlots || [];
  useEffect(() => {
    if (appointment && doctorUpcomingSlots.length > 0) {
      const appointmentEndTime = new Date(appointment.scheduledEndTime);

      const hasConflict = checkForConflicts(appointmentEndTime, 30);
      setHasConflictingAppointments(hasConflict);
    }
  }, [appointment, doctorUpcomingSlots]);
  // Load appointment data
  useEffect(() => {
    const loadAppointmentData = async () => {
      if (!appointmentId) return;

      try {
        setLoading(true);
        setError(null);

        const appointmentData = await fetchAppointment(appointmentId);
        setAppointment(appointmentData);

        // Extract doctor ID from appointment
        const extractedDoctorId =
          appointmentData?.doctorId || appointmentData?.doctor?.id;
        setDoctorId(extractedDoctorId);

        // Check for conflicting appointments (appointments scheduled after this one ends)
        // This is a simplified check - you might need to implement proper conflict checking
        // based on your appointment scheduling system
        const appointmentEndTime = new Date(
          appointmentData.scheduledEndTime._seconds * 1000
        );
        const checkTime = new Date(
          appointmentEndTime.getTime() + 30 * 60 * 1000
        ); // 30 minutes extension

        // You'll need to implement this check based on your backend
        // setHasConflictingAppointments(checkForConflicts(doctorId, appointmentEndTime, checkTime));
      } catch (err) {
        console.error("Failed to load appointment:", err);
        setError("Failed to load appointment details");
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && appointmentId) {
      loadAppointmentData();
    }
  }, [isOpen, appointmentId, fetchAppointment]);

  // Function to check for conflicting appointments
  const checkForConflicts = (appointmentEndTime, extensionDuration = 30) => {
    if (!doctorUpcomingSlots || doctorUpcomingSlots.length === 0) return false;

    // Calculate the proposed new end time (current end time + extension)
    const proposedEndTime = new Date(
      appointmentEndTime.getTime() + extensionDuration * 60 * 1000
    );

    // console.log("appointmentEndTime: ", appointmentEndTime)
    // console.log("proposedEndTime: ", proposedEndTime)
    // Check if any slots are booked during the extension period
    const hasConflict = doctorUpcomingSlots.some((slot) => {
      if (!slot.isBooked) return false; // Skip available slots

      const slotStartTime = new Date(slot.startTime);
      const slotEndTime = new Date(slot.endTime);
      // console.log("slotStartTime: ", slotStartTime);
      // console.log("slotEndTime: ", slotEndTime)

      // Check if the booked slot overlaps with the extension period
      // Overlap occurs if: slotStart < proposedEnd AND slotEnd > appointmentEnd
      return (
        slotStartTime < proposedEndTime && slotEndTime > appointmentEndTime
      );
    });

    return hasConflict;
  };

  // Check wallet balance
  const hasInsufficientFunds =
    user?.patientProfile?.telehealthWalletBalance <
    (doctor?.pricePerSession || 0);

  const handleSendRequest = () => {
    if (onSendRequest) {
      onSendRequest();
    }
    onClose();
  };

  const handleAddFunds = () => {
    setShowAddFundsModal(true);
  };

  const handleGoToDoctorProfile = () => {
    // Navigate to doctor profile
    // You'll need to implement this based on your routing system
    window.location.href = `/doctors/${doctorId}`;
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-40 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center">
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-secondary">
                    Request Extension
                  </h3>
                  <p className="text-sm text-gray-600">
                    Extend your appointment by 30 minutes
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600 font-medium">{error}</p>
              </div>
            ) : (
              <>
                {/* Appointment Info */}
                {appointment && (
                  <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-4 border border-teal-200">
                    <div className="flex items-center space-x-3 mb-3">
                      <Calendar className="w-5 h-5 text-teal-600" />
                      <div>
                        <h4 className="font-semibold text-secondary">
                          Current Appointment
                        </h4>
                        <p className="text-sm text-gray-600">
                          #{appointment.appointmentId?.substring(0, 8)}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-700">
                      <p>
                        <span className="font-medium">Doctor:</span> Dr.{" "}
                        {appointment?.doctorName}
                      </p>
                      <p>
                        <span className="font-medium">Current End Time:</span>{" "}
                        {appointment.scheduledEndTime
                          ? new Date(
                              appointment.scheduledEndTime
                            ).toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                              hour12: true,
                            })
                          : "Unknown"}
                        {/* {console.log("appointment: ", appointment)} */}
                      </p>
                    </div>
                  </div>
                )}

                {/* Doctor has conflicting appointments */}
                {hasConflictingAppointments && (
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4 border border-orange-200">
                    <div className="flex items-start space-x-3">
                      <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-orange-900 mb-2">
                          Doctor Has Upcoming Appointments
                        </h4>
                        <p className="text-sm text-orange-800 mb-3">
                          The doctor has other appointments scheduled after
                          yours. You can view available slots and reschedule if
                          needed.
                        </p>
                        <button
                          onClick={handleGoToDoctorProfile}
                          className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:from-orange-600 hover:to-red-600 transition-all duration-200 shadow-md hover:shadow-lg text-sm font-medium"
                        >
                          <User className="w-4 h-4" />
                          <span>View Doctor Profile</span>
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Insufficient funds */}
                {hasInsufficientFunds && !hasConflictingAppointments && (
                  <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-4 border border-red-200">
                    <div className="flex items-start space-x-3">
                      <Wallet className="w-5 h-5 text-red-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-red-900 mb-2">
                          Insufficient Wallet Balance
                        </h4>
                        <div className="text-sm text-red-800 mb-3">
                          <p className="mb-1">
                            <span className="font-medium">Session Cost:</span> $
                            {doctor?.pricePerSession || 0}
                          </p>
                          <p className="mb-3">
                            <span className="font-medium">
                              Current Balance:
                            </span>{" "}
                            $
                            {user?.patientProfile?.telehealthWalletBalance || 0}
                          </p>
                          <p>
                            You need to add funds to your wallet before
                            requesting an extension.
                          </p>
                        </div>
                        <button
                          onClick={handleAddFunds}
                          className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:from-red-600 hover:to-pink-600 transition-all duration-200 shadow-md hover:shadow-lg text-sm font-medium"
                        >
                          <Wallet className="w-4 h-4" />
                          <span>Add Funds</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Can send request */}
                {!hasConflictingAppointments &&
                  !hasInsufficientFunds &&
                  doctor && (
                    <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl p-4 border border-green-200">
                      <div className="flex items-start space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-green-900 mb-2">
                            Ready to Request Extension
                          </h4>
                          <div className="text-sm text-green-800 mb-3">
                            <p className="mb-1">
                              <span className="font-medium">
                                Extension Duration:
                              </span>{" "}
                              30 minutes
                            </p>
                            <p className="mb-1">
                              <span className="font-medium">Cost:</span> $
                              {doctor.pricePerSession}
                            </p>
                            <p className="mb-3">
                              <span className="font-medium">Your Balance:</span>{" "}
                              $
                              {user?.patientProfile?.telehealthWalletBalance ||
                                0}
                            </p>
                            <p>
                              Your request will be sent to the doctor for
                              approval.
                            </p>
                          </div>
                          <button
                            onClick={handleSendRequest}
                            className="bg-gradient-to-r from-green-500 to-teal-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:from-green-600 hover:to-teal-600 transition-all duration-200 shadow-md hover:shadow-lg text-sm font-medium"
                          >
                            <Clock className="w-4 h-4" />
                            <span>Send Request</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Add Funds Modal */}
      {showAddFundsModal && (
        <TelehealthAddFunds onClose={() => setShowAddFundsModal(false)} />
      )}
    </>
  );
};
