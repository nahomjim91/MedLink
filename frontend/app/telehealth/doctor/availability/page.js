"use client";
import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  Edit,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  CalendarRange,
  CalendarCheck,
  Loader2,
  AlertCircle,
  CheckCircle,
  RefreshCw,
} from "lucide-react";
import { GET_MY_AVAILABILITY_SLOTS } from "../../api/graphql/doctor/availabilitySlotQueries";
import {
  ADD_AVAILABILITY_SLOT,
  DELETE_AVAILABILITY_SLOT,
  DELETE_MULTIPLE_SLOTS,
} from "../../api/graphql/doctor/availabilitySlotMutations";
import { DateInput } from "../../components/ui/Input";

const DoctorAvailabilityCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("Month");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [newSlot, setNewSlot] = useState({
    date: "",
    startTime: "09:00",
    endTime: "09:30",
  });
  const [notification, setNotification] = useState(null);

  // Utility functions
  const formatDateForQuery = (date) => {
    return date.toISOString().split("T")[0];
  };

  // Get current time in HH:MM format
  const getCurrentTime = () => {
    const now = new Date();
    return now.toTimeString().slice(0, 5);
  };

  // Check if selected date is today
  const isToday = (dateString) => {
    const today = new Date().toISOString().split("T")[0];
    return dateString === today;
  };

  // Check for time slot overlaps
  const hasTimeOverlap = (newStartTime, newEndTime, existingSlots) => {
    const newStart = new Date(`2000-01-01T${newStartTime}:00`);
    const newEnd = new Date(`2000-01-01T${newEndTime}:00`);

    return existingSlots.some((slot) => {
      const existingStart = new Date(slot.startTime);
      const existingEnd = new Date(slot.endTime);

      // Convert to same date for comparison
      const existingStartTime = new Date(
        `2000-01-01T${existingStart.toTimeString().slice(0, 8)}`
      );
      const existingEndTime = new Date(
        `2000-01-01T${existingEnd.toTimeString().slice(0, 8)}`
      );

      // Check for overlap: new slot starts before existing ends AND new slot ends after existing starts
      return newStart < existingEndTime && newEnd > existingStartTime;
    });
  };

  // GraphQL hooks
  const { data, loading, error, refetch } = useQuery(
    GET_MY_AVAILABILITY_SLOTS,
    {
      variables: { date: formatDateForQuery(currentDate) },
      fetchPolicy: "cache-and-network",
    }
  );

  const [addAvailabilitySlot, { loading: addingSlot }] = useMutation(
    ADD_AVAILABILITY_SLOT,
    {
      onCompleted: () => {
        showNotification("Slot added successfully!", "success");
        refetch();
        resetForm();
      },
      onError: (error) => {
        showNotification(`Error adding slot: ${error.message}`, "error");
      },
    }
  );

  const [deleteAvailabilitySlot, { loading: deletingSlot }] = useMutation(
    DELETE_AVAILABILITY_SLOT,
    {
      onCompleted: () => {
        showNotification("Slot deleted successfully!", "success");
        refetch();
      },
      onError: (error) => {
        showNotification(`Error deleting slot: ${error.message}`, "error");
      },
    }
  );

  const [deleteMultipleSlots, { loading: deletingMultiple }] = useMutation(
    DELETE_MULTIPLE_SLOTS,
    {
      onCompleted: () => {
        showNotification(
          `${selectedSlots.length} slots deleted successfully!`,
          "success"
        );
        setSelectedSlots([]);
        refetch();
      },
      onError: (error) => {
        showNotification(`Error deleting slots: ${error.message}`, "error");
      },
    }
  );

  useEffect(() => {
    const today = new Date();
    const formattedDate = today.toISOString().split("T")[0];
    setNewSlot((prev) => ({ ...prev, date: formattedDate }));
  }, []);

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const resetForm = () => {
    const currentTime = getCurrentTime();
    const endTime = new Date(`2000-01-01T${currentTime}`);
    endTime.setMinutes(endTime.getMinutes() + 30);

    setNewSlot((prev) => ({
      ...prev,
      startTime: currentTime,
      endTime: endTime.toTimeString().slice(0, 5),
    }));
  };

  const getMonthName = (date) => {
    return date.toLocaleString("default", { month: "long", year: "numeric" });
  };

  const getWeekRange = (date) => {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day;
    startOfWeek.setDate(diff);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    return { start: startOfWeek, end: endOfWeek };
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      const prevMonthDay = new Date(
        year,
        month,
        0 - (startingDayOfWeek - 1 - i)
      );
      days.push({ date: prevMonthDay, isCurrentMonth: false });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const day = new Date(year, month, i);
      days.push({ date: day, isCurrentMonth: true });
    }

    const remainingCells = 42 - days.length;
    for (let i = 1; i <= remainingCells; i++) {
      const nextMonthDay = new Date(year, month + 1, i);
      days.push({ date: nextMonthDay, isCurrentMonth: false });
    }

    return days;
  };

  const getWeekDays = (date) => {
    const { start } = getWeekRange(date);
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const getSlotsForDate = (date) => {
    if (!data?.myAvailabilitySlots) return [];
    return data.myAvailabilitySlots.filter((slot) => {
      const slotDate = new Date(slot.startTime);
      return slotDate.toDateString() === date.toDateString();
    });
  };

  const navigateDate = (direction) => {
    const newDate = new Date(currentDate);
    if (viewMode === "Month") {
      newDate.setMonth(
        currentDate.getMonth() + (direction === "next" ? 1 : -1)
      );
    } else if (viewMode === "Week") {
      newDate.setDate(currentDate.getDate() + (direction === "next" ? 7 : -7));
    } else if (viewMode === "Day") {
      newDate.setDate(currentDate.getDate() + (direction === "next" ? 1 : -1));
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleAddSlot = async () => {
    try {
      const dateStr = newSlot.date;
      const startTime = new Date(`${dateStr}T${newSlot.startTime}:00`);
      const endTime = new Date(`${dateStr}T${newSlot.endTime}:00`);

      // Validation checks
      if (startTime >= endTime) {
        showNotification("End time must be after start time", "error");
        return;
      }

      // Check if the slot is in the past (for today's date)
      if (isToday(dateStr)) {
        const now = new Date();
        if (startTime <= now) {
          showNotification("Cannot create slots in the past", "error");
          return;
        }
      }

      // Check for overlaps with existing slots
      const existingSlotsForDate = getSlotsForDate(new Date(dateStr));
      if (
        hasTimeOverlap(newSlot.startTime, newSlot.endTime, existingSlotsForDate)
      ) {
        showNotification(
          "Time slot overlaps with existing availability",
          "error"
        );
        return;
      }

      // Check minimum duration (30 minutes)
      const durationMinutes = (endTime - startTime) / (1000 * 60);
      if (durationMinutes < 30) {
        showNotification("Minimum slot duration is 30 minutes", "error");
        return;
      }

      await addAvailabilitySlot({
        variables: {
          input: { startTime, endTime },
        },
      });
    } catch (error) {
      console.error("Error adding slot:", error);
    }
  };

  const handleDeleteSlot = async (slot) => {
    try {
      if (!slot || !slot._id) return;

      if (slot.isBooked) {
        showNotification("Cannot delete a booked slot.", "error");
        return;
      }

      await deleteAvailabilitySlot({
        variables: { slotId: slot._id },
      });

      showNotification("Slot deleted successfully.", "success");
    } catch (error) {
      console.error("Error deleting slot:", error);
      showNotification("Something went wrong while deleting.", "error");
    }
  };

  const handleDeleteMultiple = async () => {
    if (selectedSlots.length === 0) return;

    // Assume selectedSlots is an array of full slot objects (not just IDs)
    const bookedSlots = selectedSlots.filter((slot) => slot.isBooked);

    if (bookedSlots.length > 0) {
      showNotification(
        "One or more selected slots are booked and cannot be deleted.",
        "error"
      );
      return;
    }

    try {
      const slotIds = selectedSlots.map((slot) => slot._id); // if selectedSlots are objects
      await deleteMultipleSlots({
        variables: { slotIds },
      });

      showNotification("Slots deleted successfully.", "success");
    } catch (error) {
      console.error("Error deleting multiple slots:", error);
      showNotification(
        "Something went wrong while deleting multiple slots.",
        "error"
      );
    }
  };

  const toggleSlotSelection = (slotId) => {
    setSelectedSlots((prev) =>
      prev.includes(slotId)
        ? prev.filter((id) => id !== slotId)
        : [...prev, slotId]
    );
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getViewModeIcon = (mode) => {
    switch (mode) {
      case "Month":
        return <Calendar className="w-4 h-4" />;
      case "Week":
        return <CalendarRange className="w-4 h-4" />;
      case "Day":
        return <CalendarDays className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  const renderSlotItem = (slot, isCompact = false) => {
    const isSelected = selectedSlots.includes(slot.slotId);

    return (
      <div
        key={slot.slotId}
        className={`${
          isCompact ? "text-xs p-1 mb-1" : "p-3 mb-2"
        } rounded-lg border transition-all duration-200 ${
          slot.isBooked
            ? "bg-red-50 border-red-200 text-red-700"
            : isSelected
            ? "bg-primary/90  border-primary/30 text-white"
            : "bg-green-50 border-green-200 text-primary hover:bg-green-100"
        } ${!slot.isBooked ? "cursor-pointer" : ""}`}
        onClick={() => !slot.isBooked && toggleSlotSelection(slot.slotId)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Clock className={`${isCompact ? "w-3 h-3" : "w-4 h-4"} mr-2`} />
            <span className={isCompact ? "text-xs" : "font-medium"}>
              {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
            </span>
          </div>
          {!slot.isBooked && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteSlot(slot.slotId);
              }}
              className="text-red-500 hover:text-red-700 transition-colors"
              disabled={deletingSlot}
            >
              {deletingSlot ? (
                <Loader2
                  className={`${
                    isCompact ? "w-3 h-3" : "w-4 h-4"
                  } animate-spin`}
                />
              ) : (
                <Trash2 className={`${isCompact ? "w-3 h-3" : "w-4 h-4"}`} />
              )}
            </button>
          )}
        </div>
        {!isCompact && (
          <div
            className={`text-xs mt-1 ${
              slot.isBooked ? "text-red-600" : "text-green-600"
            }`}
          >
            {slot.isBooked ? "Booked" : "Available"}
          </div>
        )}
      </div>
    );
  };

  const renderMonthView = () => {
    const days = getDaysInMonth(currentDate);
    const weekDays = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    return (
      <div className="bg-white rounded-lg border shadow-sm">
        <div className="grid grid-cols-7 border-b bg-gray-50">
          {weekDays.map((day) => (
            <div
              key={day}
              className="p-4 text-sm font-semibold text-gray-700 text-center border-r last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {days.map((day, index) => {
            const daySlots = getSlotsForDate(day.date);
            const isToday =
              day.date.toDateString() === new Date().toDateString();
            const availableSlots = daySlots.filter((slot) => !slot.isBooked);
            const bookedSlots = daySlots.filter((slot) => slot.isBooked);

            return (
              <div
                key={index}
                className={`min-h-[140px] p-3 border-r border-b last:border-r-0 ${
                  !day.isCurrentMonth ? "bg-gray-50" : "bg-white"
                } hover:bg-gray-50 transition-colors`}
              >
                <div
                  className={`text-sm font-medium mb-2 flex items-center justify-between ${
                    !day.isCurrentMonth
                      ? "text-gray-400"
                      : isToday
                      ? "text-blue-600 font-bold"
                      : "text-gray-900"
                  }`}
                >
                  <span>{day.date.getDate()}</span>
                  {daySlots.length > 0 && (
                    <div className="flex space-x-1">
                      {availableSlots.length > 0 && (
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      )}
                      {bookedSlots.length > 0 && (
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  {daySlots
                    .slice(0, 3)
                    .map((slot) => renderSlotItem(slot, true))}
                  {daySlots.length > 3 && (
                    <div className="text-xs text-gray-500 text-center">
                      +{daySlots.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const weekDays = getWeekDays(currentDate);
    const weekDayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    return (
      <div className="bg-white rounded-lg border shadow-sm">
        <div className="grid grid-cols-7 border-b bg-gray-50">
          {weekDays.map((day, index) => {
            const isToday = day.toDateString() === new Date().toDateString();
            return (
              <div
                key={index}
                className="p-4 text-center border-r last:border-r-0"
              >
                <div className="text-sm font-medium text-gray-500">
                  {weekDayNames[index]}
                </div>
                <div
                  className={`text-lg font-semibold ${
                    isToday ? "text-blue-600" : "text-gray-900"
                  }`}
                >
                  {day.getDate()}
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-7 min-h-[500px]">
          {weekDays.map((day, index) => {
            const daySlots = getSlotsForDate(day);

            return (
              <div
                key={index}
                className="p-3 border-r last:border-r-0 border-b"
              >
                <div className="space-y-2">
                  {daySlots.map((slot) => renderSlotItem(slot, false))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const daySlots = getSlotsForDate(currentDate);
    const isToday = currentDate.toDateString() === new Date().toDateString();

    return (
      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-6 border-b bg-gray-50">
          <div className="text-center">
            <div className="text-sm font-medium text-gray-500">
              {currentDate.toLocaleDateString("en-US", { weekday: "long" })}
            </div>
            <div
              className={`text-2xl font-bold ${
                isToday ? "text-blue-600" : "text-gray-900"
              }`}
            >
              {currentDate.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-3">
            {daySlots.length > 0 ? (
              daySlots.map((slot) => renderSlotItem(slot, false))
            ) : (
              <div className="text-center py-12 text-gray-500">
                <CalendarCheck className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No slots scheduled for this day</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderCalendar = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-96 bg-white rounded-lg border">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-96 bg-white rounded-lg border">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <p className="text-red-600 mb-4">
              Error loading availability slots
            </p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4 inline mr-2" />
              Retry
            </button>
          </div>
        </div>
      );
    }

    switch (viewMode) {
      case "Month":
        return renderMonthView();
      case "Week":
        return renderWeekView();
      case "Day":
        return renderDayView();
      default:
        return renderMonthView();
    }
  };

  // Get minimum time for today
  const getMinTimeForDate = (dateString) => {
    if (isToday(dateString)) {
      return getCurrentTime();
    }
    return "00:00";
  };

  return (
    <div className="flex  bg-white p-4 rounded-xl shadow-md">
      {/* Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
            notification.type === "success"
              ? "bg-green-500 text-white"
              : "bg-red-500 text-white"
          }`}
        >
          <div className="flex items-center">
            {notification.type === "success" ? (
              <CheckCircle className="w-5 h-5 mr-2" />
            ) : (
              <AlertCircle className="w-5 h-5 mr-2" />
            )}
            {notification.message}
          </div>
        </div>
      )}

      {/* Main Calendar Area */}
      <div className="flex-1 ">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={goToToday}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-primary/30 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Today
            </button>
            <div className="flex items-center ">
              <button
                onClick={() => navigateDate("prev")}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-xl font text-secondary min-w-[250px] text-center">
                {viewMode === "Month" && getMonthName(currentDate)}
                {viewMode === "Week" &&
                  `${getWeekRange(
                    currentDate
                  ).start.toLocaleDateString()} - ${getWeekRange(
                    currentDate
                  ).end.toLocaleDateString()}`}
                {viewMode === "Day" &&
                  currentDate.toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
              </span>
              <button
                onClick={() => navigateDate("next")}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {["Month", "Week", "Day"].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center space-x-2 transition-colors ${
                  viewMode === mode
                    ? "bg-primary text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {getViewModeIcon(mode)}
                <span>{mode}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Slots Actions */}
        {selectedSlots.length > 0 && (
          <div className="mb-2 p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-primary">
                {selectedSlots.length} slot{selectedSlots.length > 1 ? "s" : ""}{" "}
                selected
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() => setSelectedSlots([])}
                  className="px-3 py-1 text-sm text-primary/80 hover:text-primary transition-colors"
                >
                  Clear Selection
                </button>
                <button
                  onClick={handleDeleteMultiple}
                  disabled={deletingMultiple}
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {deletingMultiple ? (
                    <>
                      <Loader2 className="w-4 h-4 inline mr-1 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 inline mr-1" />
                      Delete Selected
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Calendar */}
        {renderCalendar()}
      </div>

      {/* Add New Slot Sidebar */}
      <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Add New Slot
          </h2>

          <div className="space-y-4">
            {/* Date Input */}
            <DateInput
              label="Date"
              name="date"
              value={newSlot.date}
              onChange={(e) => {
                const selectedDate = e.target.value;
                setNewSlot({ ...newSlot, date: selectedDate });
                // Reset times when date changes to avoid conflicts
                if (isToday(selectedDate)) {
                  const currentTime = getCurrentTime();
                  const endTime = new Date(`2000-01-01T${currentTime}`);
                  endTime.setMinutes(endTime.getMinutes() + 30);
                  setNewSlot((prev) => ({
                    ...prev,
                    date: selectedDate,
                    startTime: currentTime,
                    endTime: endTime.toTimeString().slice(0, 5),
                  }));
                }
              }}
              min={new Date().toISOString().split("T")[0]}
            />

            {/* Time Inputs */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary mb-1">
                  From
                </label>
                <div className="relative">
                  <input
                    type="time"
                    value={newSlot.startTime}
                    onChange={(e) => {
                      const startTime = e.target.value;
                      setNewSlot((prev) => ({ ...prev, startTime }));

                      // Auto-adjust end time to be 30 minutes after start time
                      const start = new Date(`2000-01-01T${startTime}:00`);
                      start.setMinutes(start.getMinutes() + 30);
                      const endTime = start.toTimeString().slice(0, 5);
                      setNewSlot((prev) => ({ ...prev, endTime }));
                    }}
                    min={getMinTimeForDate(newSlot.date)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-none "
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary mb-1">
                  To
                </label>
                <div className="relative">
                  <input
                    type="time"
                    value={newSlot.endTime}
                    onChange={(e) =>
                      setNewSlot({ ...newSlot, endTime: e.target.value })
                    }
                    min={newSlot.startTime || undefined}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-none "
                  />
                </div>
              </div>
            </div>

            {/* Validation Messages */}
            {newSlot.date && newSlot.startTime && newSlot.endTime && (
              <div className="text-sm">
                {!isToday(newSlot.date) && (
                  <p className="text-red-500">
                    The selected date is not today.
                  </p>
                )}
                {newSlot.startTime >= newSlot.endTime && (
                  <p className="text-red-500">
                    The end time must be after the start time.
                  </p>
                )}
              </div>
            )}

            {/* Add Slot Button */}
            <button
              onClick={handleAddSlot}
              disabled={
                addingSlot ||
                !newSlot.date ||
                !newSlot.startTime ||
                !newSlot.endTime
              }
              className="w-full py-3 px-4 bg-primary/70 text-white font-medium rounded-xl hover:bg-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {addingSlot ? (
                <>
                  <Loader2 className="w-4 h-4 inline mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 inline mr-2" />
                  Add Slot
                </>
              )}
            </button>
          </div>
        </div>
        {/* Today's Slots */}
        <div>
          <h3 className="text-md font-medium text-gray-900 mb-3">
            Today&apos;s Slots
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {getSlotsForDate(new Date()).map((slot) =>
              renderSlotItem(slot, false)
            )}

            {getSlotsForDate(new Date()).length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <CalendarCheck className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No slots for today</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorAvailabilityCalendar;
