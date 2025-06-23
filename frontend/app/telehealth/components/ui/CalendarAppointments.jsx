import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
  AlertTriangle,
} from "lucide-react";
import { Button } from "./Button";
import CancelModal from "./modal/AppointmentModal "; 
// Cancel Modal Component


const AppointmentCard = ({
  appointment,
  onClose,
  onCancel,
  loading,
}) => {
  const [showCancelModal, setShowCancelModal] = useState(false);

  const canCancel = ["REQUESTED", "PENDING"].includes(appointment.status);
  const canReschedule = [
    "REQUESTED",
    "PENDING",
    "CONFIRMED",
    "SCHEDULED",
  ].includes(appointment.status);

  const handleCancelConfirm = async (appointmentId, reason) => {
    try {
      await onCancel(appointmentId, reason);
      setShowCancelModal(false);
      onClose();
    } catch (error) {
      // Error is handled by the parent component
      console.error("Cancel failed:", error);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/30 bg-opacity-50 flex items-center justify-center z-50 md:hidden">
        <div className="bg-white rounded-2xl p-6 m-4 max-w-sm w-full">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Appointment Details
            </h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
              <img
                src={appointment.avatar}
                alt={appointment.doctorName}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 text-lg">
                {appointment.doctorName}
              </h4>
              <p className="text-sm text-gray-500">{appointment.specialty}</p>
              <div className="flex items-center gap-2 mt-1">
                <div
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    appointment.status === "CONFIRMED"
                      ? "bg-green-100 text-green-700"
                      : appointment.status === "PENDING"
                      ? "bg-yellow-100 text-yellow-700"
                      : appointment.status === "REQUESTED"
                      ? "bg-blue-100 text-blue-700"
                      : appointment.status === "SCHEDULED"
                      ? "bg-teal-100 text-teal-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {appointment.status}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-6 mb-6">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  Date
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {appointment.formattedDate}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  Time
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {appointment.time}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Button
              className="w-full"
              onClick={() => {
                /* Handle view profile */
              }}
              disabled={loading}
            >
              View Profile
            </Button>

            {canCancel && (
              <Button
                variant="outline"
                className="w-full border-red-200 text-red-600 hover:bg-red-50"
                onClick={() => setShowCancelModal(true)}
                disabled={loading}
              >
                Cancel Appointment
              </Button>
            )}
          </div>
        </div>
      </div>

      {showCancelModal && (
        <CancelModal
          appointment={appointment}
          onClose={() => setShowCancelModal(false)}
          onConfirm={handleCancelConfirm}
          loading={loading}
        />
      )}
    </>
  );
};

export default function CalendarAppointments({
  appointments: propAppointments = [],
  onCancelAppointment,
  loading = false,
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [weekOffset, setWeekOffset] = useState(0);

  const appointments = propAppointments;

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const shortDayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Process appointments with formatted dates
  const processedAppointments = appointments.map((apt) => ({
    ...apt,
    formattedDate: new Date(apt.date).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      weekday: "long",
    }),
    dateKey: new Date(apt.date).toDateString(),
  }));

  const getCurrentMonthYear = () => {
    return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push({
        day,
        date,
        dateKey: date.toDateString(),
      });
    }

    return days;
  };

  const hasAppointment = (dateKey) => {
    return processedAppointments.some((apt) => apt.dateKey === dateKey);
  };

  const getAppointmentsForDay = (dateKey) => {
    // console.log("Fetching appointments for date:", processedAppointments.length);
    return processedAppointments.filter((apt) => apt.dateKey === dateKey);
  };

  const getAppointmentCount = (dateKey) => {
    return processedAppointments.filter((apt) => apt.dateKey === dateKey)
      .length;
  };

  const handleDateSelect = (dayObj) => {
    if (!dayObj) return;

    setSelectedDate(dayObj.dateKey);
    const appointments = getAppointmentsForDay(dayObj.dateKey);

    if (appointments.length > 0) {
      setSelectedAppointment([...appointments]);
    }
  };

  const getTodayDate = () => {
    const today = new Date();
    return `Today ${today.getDate()} ${monthNames[today.getMonth()]}`;
  };

  const selectedAppointmentsForDesktop = selectedDate
    ? getAppointmentsForDay(selectedDate)
    : [];

  // Generate week view for mobile
  const generateWeekDays = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + weekOffset * 7);

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      weekDays.push({
        date,
        day: date.getDate(),
        isToday: date.toDateString() === today.toDateString(),
        dateKey: date.toDateString(),
        shortDay: shortDayNames[date.getDay()],
      });
    }
    return weekDays;
  };

  // Get current week's month and year for mobile display
  const getCurrentWeekMonthYear = () => {
    const weekDays = generateWeekDays();
    const firstDay = weekDays[0].date;
    const lastDay = weekDays[6].date;

    if (firstDay.getMonth() === lastDay.getMonth()) {
      return `${monthNames[firstDay.getMonth()]} ${firstDay.getFullYear()}`;
    } else {
      return `${monthNames[firstDay.getMonth()]} - ${
        monthNames[lastDay.getMonth()]
      } ${firstDay.getFullYear()}`;
    }
  };

  const weekDays = generateWeekDays();
  const maxWeekOffset = Math.floor(365 / 7); // Rough estimate

  // Get appointments for selected date (mobile)
  const selectedDateAppointments = selectedDate
    ? getAppointmentsForDay(selectedDate)
    : processedAppointments.slice(0, 3); // Show upcoming if no date selected

  // Desktop appointment actions
  const DesktopAppointmentActions = ({ appointment }) => {
    const [showCancelModal, setShowCancelModal] = useState(false);
    const canCancel = ["REQUESTED", "PENDING"].includes(appointment.status);
    const canReschedule = [
      "REQUESTED",
      "PENDING",
      "CONFIRMED",
      "SCHEDULED",
    ].includes(appointment.status);

    const handleCancelConfirm = async (appointmentId, reason) => {
      try {
        await onCancelAppointment(appointmentId, reason);
        setShowCancelModal(false);
      } catch (error) {
        console.error("Cancel failed:", error);
      }
    };

    return (
      <>
        <div className="flex gap-3">
          {canCancel && (
            <Button
              variant="outline"
              className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
              onClick={() => setShowCancelModal(true)}
              disabled={loading}
              size="sm"
            >
              Cancel
            </Button>
          )}

          <Button
            className="flex-1"
            onClick={() => {
              /* Handle view profile */
            }}
            disabled={loading}
            size="sm"
          >
            View Profile
          </Button>
        </div>

        {showCancelModal && (
          <CancelModal
            appointment={appointment}
            onClose={() => setShowCancelModal(false)}
            onConfirm={handleCancelConfirm}
            loading={loading}
          />
        )}
      </>
    );
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2">
        {/* Calendar */}
        <div className="bg-white rounded-l-2xl shadow-sm border border-gray-100">
          <div className="p-2 md:p-3">
            <div className="flex justify-between items-center mb-4 md:mb-0">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900">
                Calendar
              </h2>

              {/* Desktop Month Navigation */}
              <div className="hidden md:flex items-center gap-2">
                <button
                  onClick={() => navigateMonth(-1)}
                  className="p-1 md:p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
                </button>
                <span className="text-sm md:text-base font-medium text-gray-600 min-w-24 md:min-w-32 text-center">
                  {getCurrentMonthYear()}
                </span>
                <button
                  onClick={() => navigateMonth(1)}
                  className="p-1 md:p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
                </button>
              </div>

              {/* Mobile Calendar Icon */}
              <div className="md:hidden">
                <Calendar className="w-5 h-5 text-gray-600" />
              </div>
            </div>

            {/* Mobile Week Navigation */}
            <div className="md:hidden mb-4">
              <div className="flex justify-between items-center mb-2 px-2">
                <button
                  onClick={() => setWeekOffset((prev) => Math.max(prev - 1, 0))}
                  className="text-sm text-gray-600 hover:text-teal-500"
                >
                  ← Prev
                </button>
                <span className="text-sm font-medium text-gray-600">
                  {getCurrentWeekMonthYear()}
                </span>
                <button
                  onClick={() =>
                    setWeekOffset((prev) =>
                      prev + 1 < maxWeekOffset ? prev + 1 : prev
                    )
                  }
                  className="text-sm text-gray-600 hover:text-teal-500"
                >
                  Next →
                </button>
              </div>

              {/* Mobile Week View */}
              <div className="flex gap-1 overflow-x-auto pb-2">
                {weekDays.map((dayObj, index) => {
                  const appointmentCount = getAppointmentCount(dayObj.dateKey);
                  return (
                    <button
                      key={index}
                      onClick={() => handleDateSelect(dayObj)}
                      className={`flex-shrink-0 flex flex-col items-center gap-1 p-3 rounded-2xl transition-colors relative ${
                        selectedDate === dayObj.dateKey
                          ? "bg-teal-500 text-white"
                          : dayObj.isToday
                          ? "bg-teal-400 text-white"
                          : hasAppointment(dayObj.dateKey)
                          ? "bg-teal-100 text-teal-700"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      <span className="text-xs font-medium">
                        {dayObj.shortDay}
                      </span>
                      <span className="text-lg font-semibold">
                        {dayObj.day}
                      </span>
                      {appointmentCount > 0 && (
                        <div className="flex gap-1">
                          {appointmentCount > 1 ? (
                            <span className="text-xs bg-white bg-opacity-30 rounded-full px-1">
                              {appointmentCount}
                            </span>
                          ) : (
                            <div className="w-1 h-1 bg-current rounded-full"></div>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Desktop Calendar Grid */}
            <div className="hidden md:block">
              <div className="grid grid-cols-7 gap-1">
                {shortDayNames.map((day) => (
                  <div
                    key={day}
                    className="text-center text-xs font-medium text-teal-500"
                  >
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1 mb-1">
                {generateCalendarDays().map((dayObj, index) => {
                  const appointmentCount = dayObj
                    ? getAppointmentCount(dayObj.dateKey)
                    : 0;
                  return (
                    <button
                      key={index}
                      onClick={() => handleDateSelect(dayObj)}
                      className={`h-8 w-8 rounded-lg text-sm font-medium transition-colors relative ${
                        !dayObj
                          ? "invisible"
                          : selectedDate === dayObj.dateKey
                          ? "bg-teal-500 text-white"
                          : hasAppointment(dayObj.dateKey)
                          ? "bg-teal-100 text-teal-700 hover:bg-teal-200"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {dayObj?.day}
                      {dayObj && appointmentCount > 0 && (
                        <div className="absolute -top-1 -right-1">
                          {appointmentCount > 1 ? (
                            <span className="bg-teal-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                              {appointmentCount}
                            </span>
                          ) : (
                            <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-600">{getTodayDate()}</p>
              </div>
            </div>
          </div>

          {/* Mobile Appointments List */}
          <div className="md:hidden border-t border-gray-100 p-4">
            <h3 className="font-semibold text-gray-900 mb-3">
              {selectedDate
                ? "Appointments for Selected Date"
                : "Upcoming Appointments"}
            </h3>
            <div className="space-y-2">
              {selectedDateAppointments.length > 0 ? (
                selectedDateAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-center gap-3 p-3 bg-background rounded-lg cursor-pointer hover:bg-gray-100"
                    onClick={() => setSelectedAppointment(appointment)}
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-white flex-shrink-0">
                      <img
                        src={appointment.avatar}
                        alt={appointment.doctorName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">
                        {appointment.doctorName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {appointment.formattedDate} • {appointment.time}
                      </p>
                      <div
                        className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                          appointment.status === "CONFIRMED"
                            ? "bg-green-100 text-green-700"
                            : appointment.status === "PENDING"
                            ? "bg-yellow-100 text-yellow-700"
                            : appointment.status === "REQUESTED"
                            ? "bg-blue-100 text-blue-700"
                            : appointment.status === "SCHEDULED"
                            ? "bg-teal-100 text-teal-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {appointment.status}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  No appointments for this date
                </p>
              )}
            </div>
            {selectedDate && (
              <button
                onClick={() => setSelectedDate(null)}
                className="w-full mt-3 text-sm text-teal-600 hover:text-teal-700"
              >
                Show all upcoming appointments
              </button>
            )}
          </div>
        </div>

        {/* Desktop Appointment Details */}
        <div className="hidden md:block">
          {selectedAppointmentsForDesktop.length > 0 ? (
            <div className="bg-white shadow-sm border border-gray-100 p-2 rounded-r-2xl">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-xl font-semibold text-gray-900">
                  {selectedAppointmentsForDesktop.length > 1
                    ? `${selectedAppointmentsForDesktop.length} Appointments`
                    : "Appointment Details"}
                </h3>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="p-1 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-3 h-[28vh] overflow-y-auto scrollbar-hide">
                {selectedAppointmentsForDesktop.map((appointment, index) => (
                
                  <div
                    key={appointment.id}
                    className={`${
                      index > 0 ? "border-t border-gray-100 pt-4" : ""
                    }`}
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                        <img
                          src={appointment.avatar}
                          alt={appointment.doctorName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-secondary">
                          {appointment.doctorName}
                        </h4>
                        <p className="text-sm text-secondary/60">
                          {appointment.specialty}
                        </p>
                        <div
                          className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                            appointment.status === "CONFIRMED"
                              ? "bg-green-100 text-green-700"
                              : appointment.status === "PENDING"
                              ? "bg-yellow-100 text-yellow-700"
                              : appointment.status === "REQUESTED"
                              ? "bg-blue-100 text-blue-700"
                              : appointment.status === "SCHEDULED"
                              ? "bg-teal-100 text-teal-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {appointment.status}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-6 mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">
                            Date
                          </p>
                          <p className="text-sm font-medium text-gray-900">
                            {appointment.formattedDate}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">
                            Time
                          </p>
                          <p className="text-sm font-medium text-gray-900">
                            {appointment.time}
                          </p>
                        </div>
                      </div>
                    </div>

                    <DesktopAppointmentActions appointment={appointment} />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-r-2xl shadow-sm border border-gray-100 p-4">
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Select a Date
                </h3>
                <p className="text-gray-500">
                  Click on a calendar date to view appointment details
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Appointment Modal */}
      {selectedAppointment && (
        <AppointmentCard
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          onCancel={onCancelAppointment}
          loading={loading}
        />
      )}
    </div>
  );
}
