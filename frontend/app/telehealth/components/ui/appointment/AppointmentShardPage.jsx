"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  Calendar,
  Clock,
  Filter,

  Users,
  CheckCircle,
  XCircle,
  CalendarDays,
} from "lucide-react";

import { FilterAppointmentModal } from "../modal/FliterModal";
import { Pagination } from "../StepProgressIndicator";
import { useAuth } from "../../../hooks/useAuth";
import { useAppointment } from "../../../hooks/useAppointment ";
import { AppointmentDetailModal } from "../modal/AppointmentModal ";

export default function Appointments() {
  const [activeTab, setActiveTab] = useState("upcoming");
  const [isFilterModalOpen, setFilterModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isDetailModalOpen, setDetailModalOpen] = useState(false);

  const itemsPerPage = 5;
  const itemsPerPageForMobile = 2;

  // Get user and appointment hooks
  const { user } = useAuth();
  const {
    fetchMyAppointments,
    cancelAppointment,
    confirmAppointment,
    loading: appointmentsLoading,
  } = useAppointment();

  // Load appointments on component mount
  const loadAppointments = useCallback(async () => {
    try {
      setLoading(true);
      console.log("Loading appointments...");
      const appointmentsData = await fetchMyAppointments();

      if (!appointmentsData) {
        console.log("No appointments data received");
        setAppointments([]);
        return;
      }

      console.log("Loaded appointments:", appointmentsData);
      setAppointments(appointmentsData);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [fetchMyAppointments]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  // Handle appointment cancellation
  const handleCancelAppointment = useCallback(
    async (appointmentId, reason = "Cancelled by user") => {
      if (!appointmentId) {
        console.error("No appointment ID provided for cancellation");
        return;
      }

      try {
        console.log(
          "Canceling appointment with ID:",
          appointmentId,
          "Reason:",
          reason
        );
        await cancelAppointment(appointmentId, reason);

        // Refresh appointments after cancellation
        await loadAppointments();

        console.log("Appointment cancelled successfully");
      } catch (error) {
        console.error("Failed to cancel appointment:", error);
        // You might want to show an error message to the user here
      }
    },
    [cancelAppointment, loadAppointments]
  );

  // Handle appointment confirmation
  const handleConfirmAppointment = useCallback(
    async (appointmentId) => {
      if (!appointmentId) {
        console.error("No appointment ID provided for confirmation");
        return;
      }

      try {
        console.log("Confirming appointment with ID:", appointmentId);
        await confirmAppointment(appointmentId);

        // Refresh appointments after confirmation
        await loadAppointments();

        console.log("Appointment confirmed successfully");
      } catch (error) {
        console.error("Failed to confirm appointment:", error);
        // You might want to show an error message to the user here
      }
    },
    [confirmAppointment, loadAppointments]
  );

  // Transform appointment data to match the expected structure
  const transformAppointmentData = useCallback(
    (appointment) => {
      if (!appointment) return null;

      try {
        // Get the other person's name based on user role
        const getOtherPersonName = () => {
          if (user?.role.toUpperCase() === "DOCTOR") {
            // If current user is doctor, show patient name
            const firstName = appointment.patient?.firstName || "";
            const lastName = appointment.patient?.lastName || "";
            return firstName || lastName
              ? ` ${
                  user?.gender === "M" ? "Mr." : "Ms."
                } ${firstName} ${lastName}`.trim()
              : appointment.patientName || "Unknown Patient";
          } else {
            // If current user is patient, show doctor name
            const firstName = appointment.doctor?.firstName || "";
            const lastName = appointment.doctor?.lastName || "";
            return firstName || lastName
              ? `Dr. ${firstName} ${lastName}`.trim()
              : appointment.doctorName || "Unknown Doctor";
          }
        };

        // Get specialization
        const getSpecialization = () => {
          if (user?.role.toUpperCase() === "DOCTOR") {
            return "Patient"; // Show "Patient" for doctors viewing patient appointments
          } else {
            return (
              appointment.doctor?.doctorProfile?.specialization || "General"
            );
          }
        };

        // Get profile image
        const getProfileImage = () => {
          if (user?.role.toUpperCase().toUpperCase === "DOCTOR") {
            return (
              appointment.patient?.profileImageUrl ||
              "https://placehold.co/40x40/E2E8F0/4A5568?text=PT"
            );
          } else {
            return (
              appointment.doctor?.profileImageUrl ||
              "https://placehold.co/40x40/E2E8F0/4A5568?text=DR"
            );
          }
        };

        return {
          appointmentId: appointment.appointmentId,
          patientId: appointment.patientId,
          patientName: appointment.patientName,
          patient: {
            id:
              user?.role.toUpperCase() === "DOCTOR"
                ? appointment.patient?.id
                : appointment.doctor?.id,
            firstName:
              user?.role.toUpperCase() === "DOCTOR"
                ? appointment.patient?.firstName
                : appointment.doctor?.firstName,
            lastName:
              user?.role.toUpperCase() === "DOCTOR"
                ? appointment.patient?.lastName
                : appointment.doctor?.lastName,
            profileImageUrl: getProfileImage(),
          },
          doctorId: appointment.doctorId,
          doctorName: getOtherPersonName(),
          status: appointment.status,
          reasonNote: appointment.reasonNote,
          scheduledStartTime: appointment.scheduledStartTime,
          scheduledEndTime: appointment.scheduledEndTime,
          price: appointment.price,
          paymentStatus: appointment.paymentStatus,
          doctor: {
            id:
              user?.role.toUpperCase() === "DOCTOR"
                ? appointment.patient?.id
                : appointment.doctor?.id,
            firstName:
              user?.role.toUpperCase() === "DOCTOR"
                ? appointment.patient?.firstName
                : appointment.doctor?.firstName,
            lastName:
              user?.role.toUpperCase() === "DOCTOR"
                ? appointment.patient?.lastName
                : appointment.doctor?.lastName,
            profileImageUrl: getProfileImage(),
            doctorProfile: {
              specialization: getSpecialization(),
            },
          },
          // Keep original data for reference
          originalAppointment: appointment,
          createdAt: appointment.createdAt,
          updatedAt: appointment.updatedAt,
          cancelledAt: appointment.cancelledAt,
        };
      } catch (error) {
        console.error(
          "Error transforming appointment data:",
          error,
          appointment
        );
        return null;
      }
    },
    [user]
  );

  // Process appointments with role-based data
  const processedAppointments = useMemo(() => {
    if (!appointments || appointments.length === 0) return [];

    return appointments.map(transformAppointmentData).filter(Boolean); // Remove any null results from transformation errors
  }, [appointments, transformAppointmentData]);

  const { upcomingAppointments, historyAppointments, stats } = useMemo(() => {
    // Determine which statuses are considered "upcoming"
    const upcomingStatuses = [
      "REQUESTED",
      "CONFIRMED",
      "UPCOMING",
      "SCHEDULED",
    ];

    const upcoming = processedAppointments.filter((appt) =>
      upcomingStatuses.includes(appt.status)
    );

    const history = processedAppointments.filter(
      (appt) => !upcomingStatuses.includes(appt.status)
    );

    const attendedCount = processedAppointments.filter(
      (appt) => appt.status === "COMPLETED"
    ).length;

    const cancelledCount = processedAppointments.filter(
      (appt) =>
        appt.status === "CANCELLED_DOCTOR" ||
        appt.status === "CANCELLED_PATIENT"
    ).length;

    const stats = {
      upcoming: upcoming.length,
      made: processedAppointments.length,
      attended: attendedCount,
      cancelled: cancelledCount,
    };

    return {
      upcomingAppointments: upcoming,
      historyAppointments: history,
      stats,
    };
  }, [processedAppointments]);

  // Pagination logic
  const currentAppointments =
    activeTab === "upcoming" ? upcomingAppointments : historyAppointments;
  const currentItemsPerPage = isMobile ? itemsPerPageForMobile : itemsPerPage;
  const totalPages = Math.ceil(
    currentAppointments.length / currentItemsPerPage
  );
  const startIndex = (currentPage - 1) * currentItemsPerPage;
  const paginatedAppointments = currentAppointments.slice(
    startIndex,
    startIndex + currentItemsPerPage
  );

  // Reset to page 1 when tab changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  // Add this useEffect to detect mobile view
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const formatAppointmentDate = (dateString) => {
    const date = new Date(dateString);
    return date
      .toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        weekday: "long",
      })
      .replace(/,/g, "");
  };

  const formatAppointmentTime = (dateString) => {
    const date = new Date(dateString);
    return date
      .toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
      .toLowerCase();
  };

  const handleFilterApply = () => {
    console.log("Applying filters...");
    setFilterModalOpen(false);
  };

  const handleFilterReset = () => {
    console.log("Resetting filters...");
  };

  const handleViewDetails = (appointment) => {
    setSelectedAppointment(appointment);
    setDetailModalOpen(true);
  };

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white p-2 md:p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-secondary/60 text-sm md:text-base font-medium mb-1">
            {title}
          </p>
          <p className="text-2xl md:text-3xl font-bold text-secondary/70">
            {value}
          </p>
        </div>
        <div className={`p-3 md:p-4 rounded-2xl ${color}`}>
          <Icon className="w-6 h-6 md:w-8 md:h-8 text-white" />
        </div>
      </div>
    </div>
  );

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "COMPLETED":
        return "bg-emerald-100 text-emerald-700 border border-emerald-200";
      case "CONFIRMED":
      case "UPCOMING":
      case "SCHEDULED":
        return "bg-blue-100 text-blue-700 border border-blue-200";
      case "REQUESTED":
        return "bg-yellow-100 text-yellow-700 border border-yellow-200";
      case "CANCELLED_PATIENT":
      case "CANCELLED_DOCTOR":
        return "bg-red-100 text-red-700 border border-red-200";
      default:
        return "bg-gray-100 text-secondary/80 border border-gray-200";
    }
  };

  const handelChangeTab = (tab) => {
    setActiveTab(tab);
    loadAppointments();
  };

  // Show loading state
  if (loading || appointmentsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="">
      <div className="">
        {/* --- Enhanced Stat Cards --- */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-3">
          <StatCard
            title="Upcoming"
            value={stats.upcoming}
            icon={CalendarDays}
            color="bg-gradient-to-br from-blue-500 to-blue-600"
          />
          <StatCard
            title="Total Made"
            value={stats.made}
            icon={Users}
            color="bg-gradient-to-br from-purple-500 to-purple-600"
          />
          <StatCard
            title="Attended"
            value={stats.attended}
            icon={CheckCircle}
            color="bg-gradient-to-br from-emerald-500 to-emerald-600"
          />
          <StatCard
            title="Cancelled"
            value={stats.cancelled}
            icon={XCircle}
            color="bg-gradient-to-br from-red-500 to-red-600"
          />
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
          {/* Header with tabs and filter */}
          <div className="p-2 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              {/* Tabs - Now visible on all screen sizes */}
              <div className="flex items-center space-x-1 bg-gray-100 rounded-2xl p-1">
                <button
                  onClick={() => handelChangeTab("upcoming")}
                  className={`flex-1 sm:flex-none px-4 md:px-6 py-2 md:py-3 text-sm md:text-base font-semibold rounded-xl transition-all duration-200 ${
                    activeTab === "upcoming"
                      ? "bg-white text-primary shadow-md"
                      : "text-secondary/60 hover:text-secondary/70"
                  }`}
                >
                  Upcoming
                </button>
                <button
                  onClick={() => handelChangeTab("history")}
                  className={`flex-1 sm:flex-none px-4 md:px-6 py-2 md:py-3 text-sm md:text-base font-semibold rounded-xl transition-all duration-200 ${
                    activeTab === "history"
                      ? "bg-white text-primary shadow-md"
                      : "text-secondary/60 hover:text-secondary/70"
                  }`}
                >
                  History
                </button>
              </div>

              {/* Filter Button */}
              <button
                onClick={() => setFilterModalOpen(true)}
                className="flex items-center justify-center space-x-2 px-4 md:px-6 py-2 md:py-3 border-2 border-primary/50 rounded-xl text-primary hover:bg-primary hover:text-white transition-all duration-200 font-semibold"
              >
                <Filter className="w-4 h-4 md:w-5 md:h-5" />
                <span className="text-sm md:text-base">Filters</span>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 ">
            {/* --- Desktop Table View --- */}
            <div className="hidden lg:block overflow-x-auto h-[50vh] overflow-y-clip  ">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gradient-to-r from-teal-50 to-blue-50">
                    <th className="p-2 font-semibold text-secondary/80 rounded-l-xl">
                      {user?.role.toUpperCase() === "DOCTOR"
                        ? "Patient"
                        : "Doctor"}
                    </th>
                    <th className="p-2 font-semibold text-secondary/80">
                      {user?.role.toUpperCase() === "DOCTOR"
                        ? "Type"
                        : "Specialist"}
                    </th>
                    <th className="p-2 font-semibold text-secondary/80">
                      Date & Time
                    </th>
                    <th className="p-2 font-semibold text-secondary/80">
                      Reason
                    </th>
                    <th className="p-2 font-semibold text-secondary/80 text-center">
                      Status
                    </th>
                    <th className="p-2 font-semibold text-secondary/80 text-center rounded-r-xl">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedAppointments.length > 0 ? (
                    paginatedAppointments.map((appt, index) => (
                      <tr
                        key={appt.appointmentId}
                        className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                          index % 2 === 0 ? "bg-white" : "bg-secondary/50/50"
                        }`}
                      >
                        <td className="p-1">
                          <div className="flex items-center space-x-3">
                            <img
                              src={appt.doctor.profileImageUrl}
                              alt={appt.doctorName}
                              className="w-10 h-10 rounded-full border-2 border-gray-200"
                              onError={(e) => {
                                e.target.src =
                                  "https://placehold.co/40x40/E2E8F0/4A5568?text=" +
                                  (user?.role.toUpperCase() === "DOCTOR"
                                    ? "PT"
                                    : "DR");
                              }}
                            />
                            <span className="font-semibold text-secondary/70">
                              {appt.doctorName}
                            </span>
                          </div>
                        </td>
                        <td className="p-1 text-secondary/60 font-medium">
                          {appt.doctor.doctorProfile.specialization}
                        </td>
                        <td className="p-1 text-secondary/60">
                          <div className="space-y-1">
                            <div className="font-medium">
                              {formatAppointmentDate(appt.scheduledStartTime)}
                            </div>
                            <div className="text-sm text-secondary">
                              {formatAppointmentTime(appt.scheduledStartTime)}
                            </div>
                          </div>
                        </td>
                        <td className="p-1 text-secondary/60">
                          {appt.reasonNote}
                        </td>
                        <td className="p-1 text-center">
                          <span
                            className={`px-3 py-1.5 text-xs font-semibold rounded-full ${getStatusBadgeClass(
                              appt.status
                            )}`}
                          >
                            {appt.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="p-1">
                          <div className="flex justify-center items-center space-x-2">
                            {activeTab === "upcoming" &&
                              (appt.status === "REQUESTED" ||
                                appt.status === "CONFIRMED" ||
                                appt.paymentStatus === "PENDING") && (
                                <div className="flex justify-center items-center space-x-2">
                                  <button
                                    onClick={() =>
                                      handleCancelAppointment(
                                        appt.appointmentId
                                      )
                                    }
                                    className="px-4 py-2 text-xs font-semibold text-red-600 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
                                  >
                                    Cancel
                                  </button>
                                  {user.role.toUpperCase() === "DOCTOR" && (
                                    <button
                                      onClick={() =>
                                        handleConfirmAppointment(
                                          appt.appointmentId
                                        )
                                      }
                                      className="px-4 py-2 text-xs font-semibold text-white bg-primary/70 rounded-lg hover:bg-primary transition-colors"
                                    >
                                      Confirm
                                    </button>
                                  )}
                                </div>
                              )}
                            <button
                              onClick={() => handleViewDetails(appt)}
                              className="px-4 py-2 text-xs font-semibold text-primary border border-primary/50 rounded-lg hover:bg-teal-50 transition-colors"
                            >
                              View Profile
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-gray-500">
                        No {activeTab} appointments found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* --- Mobile Card View --- */}
            <div className="lg:hidden space-y-4">
              {paginatedAppointments.length > 0 ? (
                paginatedAppointments.map((appt) => (
                  <div
                    key={appt.appointmentId}
                    className="bg-white border border-gray-200 rounded-2xl p-2 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src={appt.doctor.profileImageUrl}
                          alt={appt.doctorName}
                          className="w-10 h-10 rounded-full border-2 border-gray-200"
                          onError={(e) => {
                            e.target.src =
                              "https://placehold.co/40x40/E2E8F0/4A5568?text=" +
                              (user?.role.toUpperCase() === "DOCTOR"
                                ? "PT"
                                : "DR");
                          }}
                        />
                        <div>
                          <p className="font-bold text-secondary/70 text-sm">
                            {appt.doctorName}
                          </p>
                          <p className="text-xs text-secondary">
                            {appt.doctor.doctorProfile.specialization}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(
                          appt.status
                        )}`}
                      >
                        {appt.status.replace("_", " ")}
                      </span>
                    </div>

                    <div className="border-t border-gray-100 pt-3 mb-4">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-secondary/60">
                            {formatAppointmentDate(appt.scheduledStartTime)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-secondary/60">
                            {formatAppointmentTime(appt.scheduledStartTime)}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2">
                        <p className="text-sm text-secondary/60">
                          <span className="font-medium">Reason:</span>{" "}
                          {appt.reasonNote}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col space-y-2">
                      {activeTab === "upcoming" &&
                        (appt.status === "REQUESTED" ||
                          appt.status === "CONFIRMED" ||
                          appt.paymentStatus === "PENDING") && (
                          <div className="flex justify-center items-center space-x-2">
                            <button
                              onClick={() =>
                                handleCancelAppointment(appt.appointmentId)
                              }
                              className="w-full px-4 py-2 text-xs font-semibold text-red-600 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() =>
                                handleConfirmAppointment(appt.appointmentId)
                              }
                              className="w-full px-4 py-2 text-xs font-semibold text-white bg-primary/70 rounded-lg hover:bg-primary transition-colors"
                            >
                              Confirm
                            </button>
                          </div>
                        )}
                      <button
                        onClick={() => handleViewDetails(appt)}
                        className="flex-1 px-4 py-2 text-sm font-semibold text-primary border border-primary/50 rounded-xl hover:bg-teal-50 transition-colors"
                      >
                        View Profile
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-gray-500">
                  No {activeTab} appointments found
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </div>
        </div>
      </div>
      <FilterAppointmentModal
        isOpen={isFilterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        onApply={handleFilterApply}
        onReset={handleFilterReset}
      />
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

      <AppointmentDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        appointment={selectedAppointment}
        userRole={user?.role.toUpperCase()}
        formatAppointmentTime={formatAppointmentTime}
        formatAppointmentDate={formatAppointmentDate}
        getStatusBadgeClass={getStatusBadgeClass}
      />
    </div>
  );
}
