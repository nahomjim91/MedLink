"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  Users,
  TrendingUp,
  Eye,
  Check,
  X,
  DollarSign,
  Wallet,
} from "lucide-react";
import { MinimalCalendar } from "../components/ui/CalendarAppointments";
import { useAppointment } from "../hooks/useAppointment ";
import Link from "next/link";
import { useAuth } from "../hooks/useAuth";

export default function DoctorDashboardPage() {
  const [selectedPendingAppointments, setSelectedPendingAppointments] =
    useState([]);
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [calendarAppointments, setCalendarAppointments] = useState([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const {user} = useAuth();

  const {
    loading,
    error,
    appointmentStats,
    fetchMyAppointments,
    confirmAppointment,
    rejectAppointment,
    cancelAppointment,
    clearError,
  } = useAppointment();

  // Load appointments on component mount
  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      const appointmentsData = await fetchMyAppointments(50, 0); // Get more appointments
      setAppointments(appointmentsData || []);

      // Transform appointments for calendar component
      const calendarData =
        appointmentsData?.map((apt) => ({
          id: apt.appointmentId,
          patientName: apt.patientName,
          note: apt.reasonNote || "note", // Fallback to "note" if empty
          date: new Date(apt.scheduledStartTime).toISOString().split("T")[0],
          time: `${formatTime(apt.scheduledStartTime)} - ${formatTime(
            apt.scheduledEndTime
          )}`,
          avatar: apt.patient?.profileImageUrl || "/api/placeholder/50/50",
        })) || [];

      setCalendarAppointments(calendarData);
    } catch (err) {
      console.error("Error loading appointments:", err);
    }
  };

  // Filter appointments by status
  const pendingAppointments = appointments.filter((apt) =>
    ["REQUESTED", "CONFIRMED"].includes(apt.status)
  );

  const historyAppointments = appointments.filter((apt) =>
    [
      "COMPLETED",
      "CANCELLED_PATIENT",
      "CANCELLED_DOCTOR",
      "NO_SHOW",
      "REJECTED",
    ].includes(apt.status)
  );

  const upcomingAppointments = appointments.filter((apt) =>
    ["CONFIRMED", "UPCOMING"].includes(apt.status)
  );

  // Statistics calculations from real data
  const totalPatients = new Set(appointments.map((apt) => apt.patientId)).size;
  const totalAppointments = appointments.length;
  const completedAppointments = appointments.filter(
    (apt) => apt.status === "COMPLETED"
  ).length;
  const monthlyRevenue = appointments
    .filter((apt) => apt.status === "COMPLETED")
    .reduce((sum, apt) => sum + (apt.price || 0), 0);

  const handleSelectPendingAppointment = (appointmentId) => {
    setSelectedPendingAppointments((prev) =>
      prev.includes(appointmentId)
        ? prev.filter((id) => id !== appointmentId)
        : [...prev, appointmentId]
    );
  };

  const handleBulkAction = async (action) => {
    if (selectedPendingAppointments.length === 0) return;

    setIsUpdating(true);
    try {
      const promises = selectedPendingAppointments.map((appointmentId) => {
        switch (action) {
          case "accept":
            return confirmAppointment(appointmentId);
          case "cancel":
            return cancelAppointment(appointmentId, "Cancelled by doctor");
          case "reject":
            return rejectAppointment(appointmentId, "Rejected by doctor");
          default:
            return Promise.resolve();
        }
      });

      await Promise.all(promises);

      // Reload appointments to reflect changes
      await loadAppointments();
      setSelectedPendingAppointments([]);

      console.log(
        `${action} completed for ${selectedPendingAppointments.length} appointments`
      );
    } catch (err) {
      console.error(`Error performing bulk ${action}:`, err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSingleAppointmentAction = async (appointmentId, action) => {
    setIsUpdating(true);
    try {
      switch (action) {
        case "accept":
          await confirmAppointment(appointmentId);
          break;
        case "cancel":
          await cancelAppointment(appointmentId, "Cancelled by doctor");
          break;
        case "reject":
          await rejectAppointment(appointmentId, "Rejected by doctor");
          break;
        default:
          return;
      }

      // Reload appointments to reflect changes
      await loadAppointments();

      console.log(`${action} completed for appointment ${appointmentId}`);
    } catch (err) {
      console.error(`Error performing ${action}:`, err);
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "REQUESTED":
        return "bg-yellow-100 text-yellow-800";
      case "CONFIRMED":
        return "bg-blue-100 text-blue-800";
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      case "CANCELLED_PATIENT":
      case "CANCELLED_DOCTOR":
      case "CANCELLED_ADMIN":
        return "bg-red-100 text-red-800";
      case "NO_SHOW":
        return "bg-gray-100 text-gray-800";
      case "UPCOMING":
        return "bg-purple-100 text-purple-800";
      case "IN_PROGRESS":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusDisplayText = (status) => {
    switch (status) {
      case "CANCELLED_PATIENT":
        return "cancelled by patient";
      case "CANCELLED_DOCTOR":
        return "cancelled by doctor";
      case "CANCELLED_ADMIN":
        return "cancelled by admin";
      case "IN_PROGRESS":
        return "in progress";
      case "NO_SHOW":
        return "no show";
      default:
        return status.toLowerCase().replace("_", " ");
    }
  };

  // Clear error when component unmounts or when needed
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  return (
    <div className="flex flex-col gap-3 w-full ">
      {/* Display loading or error states */}
      {loading && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
          Loading appointments...
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          Error: {error}
        </div>
      )}

      {/* Doctor Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Patients */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Patients</p>
              <p className="text-2xl font-bold text-gray-800">
                {totalPatients}
              </p>
            </div>
            <div className="p-3 bg-teal-500 rounded-full">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        {/* Total Appointments */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Appointments</p>
              <p className="text-2xl font-bold text-gray-800">
                {totalAppointments}
              </p>
            </div>
            <div className="p-3 bg-blue-500 rounded-full">
              <Calendar className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        {/* Monthly Revenue */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Monthly Revenue</p>
              <p className="text-2xl font-bold text-gray-800">
                {monthlyRevenue.toFixed(2)} Birr
              </p>
            </div>
            <div className="p-3 bg-purple-500 rounded-full">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        {/* Wallet */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold text-secondary">My Wallet</h2>
            <button
              className="text-teal-500 text-sm font-medium hover:text-teal-600"
              onClick={() => setShowAddFunds(true)}
            >
              Withdraw
            </button>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
            <p className="text-sm text-gray-500 mb-2 sm:mb-0">
              Current Balance
            </p>
            <div className="bg-teal-500 text-white px-4 py-2 rounded-full text-center">
              <span className="text-lg font-bold">
                {user?.doctorProfile?.telehealthWalletBalance || 0} Birr
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Appointments and Calendar */}
      <div className="flex md:flex-row flex-col gap-4 ">
        {/* Upcoming appointments */}
        <div className="flex-2/5 bg-white p-4 rounded-2xl shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-secondary">
              Next Appointment
            </h3>
            <Link href={`/telehealth/${user.role}/appointments`} className="text-teal-500 text-sm font-medium hover:text-teal-600">
              See All
            </Link>
          </div>

          {upcomingAppointments.length > 0 ? (
            <div className="space-y-4">
              {upcomingAppointments.slice(0, 1).map((appointment) => (
                <div
                  key={appointment.appointmentId}
                  className="border-l-4 border-teal-500 pl-4"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <img
                      src={
                        appointment.patient?.profileImageUrl ||
                        "/api/placeholder/40/40"
                      }
                      alt="Patient"
                      className="w-12 h-12 rounded-full"
                    />
                    <div>
                      <h4 className="font-medium text-gray-800">
                        {appointment.patientName}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {appointment.reasonNote}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(appointment.scheduledStartTime)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>
                        {formatTime(appointment.scheduledStartTime)} -{" "}
                        {formatTime(appointment.scheduledEndTime)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">
              No upcoming appointments
            </p>
          )}
        </div>

        {/* Calendar appointments */}
        <MinimalCalendar
          appointments={calendarAppointments}
          loading={loading}
        />
      </div>

      {/* Pending and history appointments */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Pending appointments */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg md:h-[35vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-secondary">
              Pending Appointments
            </h3>
            <Link href={`/telehealth/${user.role}/appointments`} className="text-teal-500 text-sm font-medium hover:text-teal-600">
              See All
            </Link>
          </div>

          {selectedPendingAppointments.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-end gap-2 mb-4">
              <button
                onClick={() => handleBulkAction("accept")}
                disabled={isUpdating}
                className="flex items-center justify-center gap-1 px-3 py-1 bg-primary/75 text-white text-sm rounded-full hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="w-4 h-4" />
                Accept ({selectedPendingAppointments.length})
              </button>
              <button
                onClick={() => handleBulkAction("reject")}
                disabled={isUpdating}
                className="flex items-center justify-center gap-1 px-3 py-1 bg-orange-500 text-white text-sm rounded-full hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-4 h-4" />
                Reject ({selectedPendingAppointments.length})
              </button>
              <button
                onClick={() => handleBulkAction("cancel")}
                disabled={isUpdating}
                className="flex items-center justify-center gap-1 px-3 py-1 bg-red-500 text-white text-sm rounded-full hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-4 h-4" />
                Cancel ({selectedPendingAppointments.length})
              </button>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-2 text-left">
                    <input
                      type="checkbox"
                      className="rounded"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPendingAppointments(
                            pendingAppointments.map((apt) => apt.appointmentId)
                          );
                        } else {
                          setSelectedPendingAppointments([]);
                        }
                      }}
                      checked={
                        selectedPendingAppointments.length ===
                          pendingAppointments.length &&
                        pendingAppointments.length > 0
                      }
                    />
                  </th>
                  <th className="p-2 text-left font-medium text-secondary min-w-[120px]">
                    Patient
                  </th>
                  <th className="p-2 text-left font-medium text-secondary hidden sm:table-cell">
                    Reason
                  </th>
                  <th className="p-2 text-left font-medium text-secondary">
                    Date
                  </th>
                  <th className="p-2 text-left font-medium text-secondary">
                    Status
                  </th>
                  <th className="p-2 text-left font-medium text-secondary">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pendingAppointments.map((appointment) => (
                  <tr
                    key={appointment.appointmentId}
                    className="hover:bg-gray-50"
                  >
                    <td className="p-2">
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={selectedPendingAppointments.includes(
                          appointment.appointmentId
                        )}
                        onChange={() =>
                          handleSelectPendingAppointment(
                            appointment.appointmentId
                          )
                        }
                      />
                    </td>
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <img
                          src={
                            appointment.patient?.profileImageUrl ||
                            "/api/placeholder/40/40"
                          }
                          alt="Patient"
                          className="w-8 h-8 rounded-full"
                        />
                        <span className="font-medium text-gray-800">
                          {appointment.patientName}
                        </span>
                      </div>
                    </td>
                    <td className="p-2 text-gray-500 hidden sm:table-cell">
                      {appointment.reasonNote}
                    </td>
                    <td className="p-2 text-gray-500">
                      {formatDate(appointment.scheduledStartTime)}
                    </td>
                    <td className="p-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          appointment.status
                        )}`}
                      >
                        {getStatusDisplayText(appointment.status)}
                      </span>
                    </td>
                    <td className="p-2">
                      <div className="flex gap-1">
                        {appointment.status === "REQUESTED" && (
                          <>
                            <button
                              onClick={() =>
                                handleSingleAppointmentAction(
                                  appointment.appointmentId,
                                  "accept"
                                )
                              }
                              disabled={isUpdating}
                              className="p-1 text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
                              title="Accept"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                handleSingleAppointmentAction(
                                  appointment.appointmentId,
                                  "reject"
                                )
                              }
                              disabled={isUpdating}
                              className="p-1 text-orange-600 hover:bg-orange-50 rounded disabled:opacity-50"
                              title="Reject"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() =>
                            handleSingleAppointmentAction(
                              appointment.appointmentId,
                              "cancel"
                            )
                          }
                          disabled={isUpdating}
                          className="p-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {pendingAppointments.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                No pending appointments
              </div>
            )}
          </div>
        </div>

        {/* History appointments */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg md:h-[35vh]  md:h-">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-secondary">History</h3>
            <Link href={`/telehealth/${user.role}/appointments`} className="text-teal-500 text-sm font-medium hover:text-teal-600">
              See All
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-2 text-left font-medium text-secondary min-w-[120px]">
                    Patient
                  </th>
                  <th className="p-2 text-left font-medium text-secondary hidden sm:table-cell">
                    Reason
                  </th>
                  <th className="p-2 text-left font-medium text-secondary">
                    Date
                  </th>
                  <th className="p-2 text-left font-medium text-secondary">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {historyAppointments
                  .filter(
                    (appointment) =>
                      new Date(appointment.scheduledStartTime) < new Date()
                  )
                  .sort(
                    (a, b) =>
                      new Date(a.scheduledStartTime) -
                      new Date(b.scheduledStartTime)
                  )
                  // Take top 3
                  .slice(0, 3)
                  .map((appointment) => (
                    <tr
                      key={appointment.appointmentId}
                      className="hover:bg-gray-50"
                    >
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <img
                            src={
                              appointment.patient?.profileImageUrl ||
                              "/api/placeholder/40/40"
                            }
                            alt="Patient"
                            className="w-8 h-8 rounded-full"
                          />
                          <span className="font-medium text-gray-800">
                            {appointment.patientName}
                          </span>
                        </div>
                      </td>
                      <td className="p-2 text-gray-500 hidden sm:table-cell">
                        {appointment.reasonNote}
                      </td>
                      <td className="p-2 text-gray-500">
                        {formatDate(appointment.scheduledStartTime)}
                      </td>
                      <td className="p-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            appointment.status
                          )}`}
                        >
                          {getStatusDisplayText(appointment.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>

            {historyAppointments.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                No appointment history
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
