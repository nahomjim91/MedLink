"use client";
import React, { useState, useEffect } from "react";
import { useQuery } from "@apollo/client";
import {
  ChevronLeft,
  ChevronRight,
  Star,
  ThumbsUp,
  MessageCircle,
  Award,
  Clock,
  DollarSign,
  Users,
  Loader2,
  FileText,
} from "lucide-react";
import ProfileImage from "../../../components/ui/ProfileImage";
import { useParams } from "next/navigation";
import { GET_DOCTOR_BY_ID } from "../../../api/graphql/queries";
import { GET_DOCTOR_AVAILABLE_SLOTS } from "../../../api/graphql/doctor/availabilitySlotQueries";
import { AboutMeCard, InfoCard ,CertificatesList} from "../../../components/ui/Card";
import AppointmentModal from "../../../components/ui/modal/AppointmentModal ";
import { useAppointment } from "../../../hooks/useAppointment ";
import { useAuth } from "../../../hooks/useAuth";
import TelehealthAddFunds from "../../../components/ui/AddFound";

export default function DoctorProfileResponsive() {
  const params = useParams();
  const doctorId = params.doctorId;
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const { user, refetchUser } = useAuth();

  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedTime, setSelectedTime] = useState("");
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(
    new Date().toLocaleString("default", { month: "long" })
  );
  const [currentYear, setCurrentYear] = useState(2025);
  const [formattedSelectedDate, setFormattedSelectedDate] = useState("");
  const [weekOffset, setWeekOffset] = useState(0);
  const daysPerWeek = 7;

  // GraphQL Queries
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
  } = useQuery(GET_DOCTOR_AVAILABLE_SLOTS, {
    variables: {
      doctorId: doctorId,
      date: formattedSelectedDate,
    },
    skip: !doctorId || !formattedSelectedDate,
  });

  const {
    createAppointment,
    loading: appointmentLoading,
    error: appointmentError,
  } = useAppointment();

  // Set initial selected date to today or first available date
  useEffect(() => {
    const today = new Date();
    const todayDate = today.getDate();
    setSelectedDate(todayDate);

    // Format date for GraphQL query (YYYY-MM-DD format)
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(todayDate).padStart(2, "0");
    setFormattedSelectedDate(`${year}-${month}-${day}`);
  }, []);

  // Update formatted date when selected date changes
  useEffect(() => {
    if (selectedDate) {
      const year = currentYear;
      const month = String(getMonthNumber(currentMonth)).padStart(2, "0");
      const day = String(selectedDate).padStart(2, "0");
      setFormattedSelectedDate(`${year}-${month}-${day}`);
    }
  }, [selectedDate, currentMonth, currentYear]);

  // Reset selected time when date changes
  useEffect(() => {
    setSelectedTime("");
  }, [selectedDate]);

  const doctor = doctorData?.doctorById;
  const availableSlots = slotsData?.doctorAvailableSlots || [];
  console.log("Available Slots:", availableSlots);

  // Convert available slots to time format
  const formatSlotTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Generate calendar days for current month
  const generateCalendarDays = () => {
    const daysInMonth = new Date(
      currentYear,
      getMonthNumber(currentMonth),
      0
    ).getDate();
    const firstDayOfMonth = new Date(
      currentYear,
      getMonthNumber(currentMonth) - 1,
      1
    ).getDay();
    const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < adjustedFirstDay; i++) {
      days.push({ day: null, disabled: true });
    }

    // Add actual days
    for (let day = 1; day <= daysInMonth; day++) {
      // For now, make all future dates available (you can customize this logic)
      const today = new Date();
      today.setHours(0, 0, 0, 0); // make today midnight

      const currentDate = new Date(
        currentYear,
        getMonthNumber(currentMonth) - 1,
        day
      );
      currentDate.setHours(0, 0, 0, 0); // also set this to midnight

      const isAvailable = currentDate >= today;
      days.push({ day, disabled: !isAvailable });
    }

    return days;
  };

  const getMonthNumber = (monthName) => {
    const months = {
      January: 1,
      February: 2,
      March: 3,
      April: 4,
      May: 5,
      June: 6,
      July: 7,
      August: 8,
      September: 9,
      October: 10,
      November: 11,
      December: 12,
    };
    return months[monthName] || 5;
  };

  const navigateMonth = (direction) => {
    const months = [
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
    const currentIndex = months.indexOf(currentMonth);

    if (direction === "prev") {
      if (currentIndex === 0) {
        setCurrentMonth("December");
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(months[currentIndex - 1]);
      }
    } else {
      if (currentIndex === 11) {
        setCurrentMonth("January");
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(months[currentIndex + 1]);
      }
    }
  };

  const handleDateSelect = (day) => {
    setSelectedDate(day);
  };

  const handleTimeSelect = (slotId, timeString) => {
    setSelectedTime(timeString);
  };

  const handleBookAppointment = () => {
    const selectedSlot = availableSlots.find(
      (slot) => formatSlotTime(slot.startTime) === selectedTime
    );

    if (selectedSlot) {
      setSelectedSlot(selectedSlot);
      setShowAppointmentModal(true);
    }
  };

  const handleUpdate = (formData) => {
    // Handle form data update logic here
    // console.log("Form Data Updated:", formData);
  };

  // Updated handleConfirm to actually create the appointment
  const handleConfirm = async (appointmentData) => {
    try {
      // console.log("Creating appointment with data:", appointmentData);

      // Prepare the appointment input data
      const appointmentInput = {
        doctorId:
          appointmentData.doctor?.doctorId || appointmentData.doctor?._id,
        doctorName: `${appointmentData.doctor?.user?.firstName || "Dr."} ${
          appointmentData.doctor?.user?.lastName || "Doctor"
        }`,
        reasonNote: appointmentData.reason,
        scheduledStartTime:
          appointmentData.slot?.startTime ||
          new Date(
            appointmentData.date + " " + appointmentData.time.split(" - ")[0]
          ),
        scheduledEndTime:
          appointmentData.slot?.endTime ||
          new Date(
            appointmentData.date + " " + appointmentData.time.split(" - ")[1]
          ),
        associatedSlotId:
          appointmentData.slot?.slotId || appointmentData.slot?._id,
      };

      // Create the appointment using the hook
      const newAppointment = await createAppointment(appointmentInput);

      refetchSlots();
      refetchUser();
      return newAppointment;
    } catch (error) {
      console.error("Failed to create appointment:", error);
      // Handle error - you might want to show an error toast here
      throw error; // Re-throw so the modal can handle the error state
    }
  };

  const handleCloseModal = () => {
    setShowAppointmentModal(false);
    setSelectedSlot(null);
  };

  const allDates = generateCalendarDays().filter(
    (date) => date.day && !date.disabled
  );

  const mobileDates = allDates
    .slice(weekOffset * daysPerWeek, (weekOffset + 1) * daysPerWeek)
    .map((date) => ({
      day: date.day,
      label: new Date(currentYear, getMonthNumber(currentMonth) - 1, date.day)
        .toLocaleDateString("en-US", { weekday: "short" })
        .slice(0, 2),
    }));

 

  // Loading state
  if (doctorLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    );
  }

  // Error state
  if (doctorError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-2">Error loading doctor profile</p>
          <p className="text-gray-500 text-sm">{doctorError.message}</p>
        </div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Doctor not found</p>
      </div>
    );
  }

  const reviews = [
    {
      id: 1,
      name: "Martha Tesfaye",
      rating: 5,
      comment:
        "Dr. Nahome is one of the most compassionate doctors I've ever met. He took the time to explain everything clearly and helped me feel at ease during a stressful time.",
      date: "May 12, 2025 09:45 AM",
      likes: 142,
      avatar: "/api/placeholder/40/40",
    },
    {
      id: 2,
      name: "Samuel Berhane",
      rating: 4,
      comment:
        "Very knowledgeable and professional. The clinic was busy, but he still gave me his full attention. I appreciate the thorough heart check-up.",
      date: "April 28, 2025 02:10 PM",
      likes: 97,
      avatar: "/api/placeholder/40/40",
    },
    {
      id: 3,
      name: "Lidya Abay",
      rating: 5,
      comment:
        "Dr. Nahome saved my father's life with early diagnosis. I can’t thank him enough. Highly recommend for anyone with heart conditions.",
      date: "March 6, 2025 11:20 AM",
      likes: 186,
      avatar: "/api/placeholder/40/40",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Desktop Layout */}
      <div className="hidden lg:block">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-12 gap-3">
            {/* Doctor Profile Card */}
            <div className="col-span-3 bg-white rounded-2xl p-4 shadow-sm h-fit">
              <div className="text-center mb-6 flex flex-col items-center">
                <ProfileImage
                  profileImageUrl={doctor.user?.profileImageUrl}
                  altText={`${doctor.user?.firstName} ${doctor.user?.lastName}`}
                  userName={`Dr. ${doctor.user?.firstName} ${doctor.user?.lastName}`}
                />
                <h2 className="text-2xl font-bold text-secondary/80 mt-5">
                  Dr. {doctor.user?.firstName} {doctor.user?.lastName}
                </h2>
              </div>
            </div>

            {/* Doctor Details Card */}
            <div className="col-span-9 bg-white rounded-2xl p-3 shadow-sm h-fit flex gap-6">
              <div className="flex-1/3">
                <h3 className="text-lg font-bold text-secondary/80 mb-4">
                  General Info
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-secondary/60">Gender</span>
                    <span className="text-secondary/60 font-semibold">
                      {doctor.user?.gender || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-secondary/60">Specialization</span>
                    <span className="text-secondary/60 font-semibold">
                      {doctor.specialization[0]}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-secondary/60">Experience</span>
                    <span className="text-secondary/60 font-semibold">
                      {doctor.experienceYears}+ years
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-secondary/60">Rating</span>
                    <span className="text-secondary/60 font-semibold">
                      {doctor.averageRating || "3.5"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-secondary/60">Per Session</span>
                    <span className="text-secondary/60 font-semibold">
                      ${doctor.pricePerSession}
                    </span>
                  </div>
                </div>
              </div>
              <AboutMeCard doctor={doctor} />
            </div>

            {/* Calendar Section */}
            <div className="col-span-4 bg-white rounded-2xl p-3 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-xl font-bold text-secondary/80">
                  Calendar
                </h3>
                <div className="flex items-center">
                  <button
                    onClick={() => navigateMonth("prev")}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-secondary/60" />
                  </button>
                  <span className="text-secondary/60 font-medium min-w-24 text-center">
                    {currentMonth} {currentYear}
                  </span>
                  <button
                    onClick={() => navigateMonth("next")}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-secondary/60" />
                  </button>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                  (day) => (
                    <div
                      key={day}
                      className="text-center text-xs font-medium text-teal-500 py-2"
                    >
                      {day}
                    </div>
                  )
                )}
                {generateCalendarDays().map((date, index) => (
                  <button
                    key={index}
                    onClick={() =>
                      date.day && !date.disabled && handleDateSelect(date.day)
                    }
                    className={`h-10 w-10 rounded-lg text-sm font-medium transition-colors ${
                      !date.day
                        ? "invisible"
                        : date.disabled
                        ? "text-gray-300 cursor-not-allowed"
                        : selectedDate === date.day
                        ? "bg-teal-500 text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    disabled={date.disabled || !date.day}
                  >
                    {date.day}
                  </button>
                ))}
              </div>

              {/* Time Slots */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-bold text-secondary/80">
                    Select Time
                  </h4>
                  <span className="text-secondary/60 font-medium text-sm">
                    {slotsLoading
                      ? "Loading..."
                      : `${availableSlots.length} Slots`}
                  </span>
                </div>

                {slotsLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
                  </div>
                ) : slotsError ? (
                  <div className="text-center py-4">
                    <p className="text-red-500 text-sm">Error loading slots</p>
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-gray-500 text-sm">
                      {selectedDate
                        ? "No slots available for this date"
                        : "Select a date to view slots"}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {availableSlots
                      .filter((slot) => !slot.isBooked)
                      .map((slot) => {
                        const timeString = formatSlotTime(slot.startTime);
                        return (
                          <button
                            key={slot.slotId}
                            onClick={() =>
                              handleTimeSelect(slot.slotId, timeString)
                            }
                            className={`py-2 px-2 rounded-lg text-sm font-medium transition-colors ${
                              selectedTime === timeString
                                ? "bg-teal-500 text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                          >
                            {timeString}
                          </button>
                        );
                      })}
                  </div>
                )}

                <button
                  onClick={handleBookAppointment}
                  disabled={!selectedTime || slotsLoading}
                  className="w-full bg-teal-500 hover:bg-teal-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl transition-colors"
                >
                  ${doctor.pricePerSession} Book Now
                </button>
              </div>
            </div>

            {/* Certificate Section */}

            <div className="col-span-4 bg-white rounded-2xl p-3 shadow-sm">
              <InfoCard title="Certificates & Qualifications">
                <CertificatesList certificates={doctor.certificates} />
              </InfoCard>
            </div>

            {/* Reviews Section */}
            <div className="col-span-4 bg-white rounded-2xl p-3 shadow-sm">
              <h3 className="text-xl font-bold text-secondary/80 mb-6">
                Reviews
              </h3>
              <div className="space-y-6">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="border-b border-gray-100 pb-6 last:border-b-0"
                  >
                    <div className="flex gap-1 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className="w-4 h-4 fill-teal-400 text-teal-400"
                        />
                      ))}
                    </div>
                    <p className="text-secondary/80 font-semibold mb-2">
                      {review.comment}
                    </p>
                    <p className="text-gray-500 text-sm mb-3">{review.date}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                        <span className="text-gray-700 font-medium text-sm">
                          {review.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <ThumbsUp className="w-4 h-4 text-secondary/60" />
                          <span className="text-secondary/60 text-sm">
                            {review.likes}
                          </span>
                        </div>
                        <MessageCircle className="w-4 h-4 text-secondary/60" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="lg:hidden min-h-screen">
        {/* Doctor Profile Header */}
        <div className="text-center py-6 px-6 flex flex-col items-center">
          <ProfileImage
            imageUrl={doctor.user?.profileImageUrl}
            altText={`${doctor.user?.firstName} ${doctor.user?.lastName}`}
            userName={`Dr. ${doctor.user?.firstName} ${doctor.user?.lastName}`}
          />
          <h1 className="text-xl font-bold text-secondary/80 mb-1">
            Dr. {doctor.user?.firstName} {doctor.user?.lastName}
          </h1>
          <p className="text-secondary/60 text-sm">
            {doctor.specialization} | {doctor.experienceYears}+ years exp
          </p>
        </div>

        {/* Stats Grid */}
        <div className="px-6 mb-6">
          <div className="grid grid-cols-5 gap-3 text-center">
            <div>
              <div className="w-10 h-10 mx-auto mb-2 bg-primary/10 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <p className="text-lg font-bold text-secondary/80">
                {doctor.ratingCount || 0}+
              </p>
              <p className="text-xs text-secondary/60">Patients</p>
            </div>
            <div>
              <div className="w-10 h-10 mx-auto mb-2 bg-primary/10 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <p className="text-lg font-bold text-secondary/80">
                {doctor.experienceYears}+
              </p>
              <p className="text-xs text-secondary/60">Experience</p>
            </div>
            <div>
              <div className="w-10 h-10 mx-auto mb-2 bg-primary/10 rounded-lg flex items-center justify-center">
                <Star className="w-5 h-5 text-primary" />
              </div>
              <p className="text-lg font-bold text-secondary/80">
                {doctor.averageRating || "N/A"}
              </p>
              <p className="text-xs text-secondary/60">Rating</p>
            </div>
            <div>
              <div className="w-10 h-10 mx-auto mb-2 bg-primary/10 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-primary" />
              </div>
              <p className="text-lg font-bold text-secondary/80">
                {doctor.ratingCount || 0}+
              </p>
              <p className="text-xs text-secondary/60">Reviews</p>
            </div>
            <div>
              <div className="w-10 h-10 mx-auto mb-2 bg-primary/10 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <p className="text-lg font-bold text-secondary/80">
                ${doctor.pricePerSession}
              </p>
              <p className="text-xs text-secondary/60">Session</p>
            </div>
          </div>
        </div>

        {/* About Me */}
        <AboutMeCard doctor={doctor} />

        {/* Available Slots */}
        <div className="px-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-secondary/80">
              Available Slots
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateMonth("prev")}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-secondary/60" />
              </button>
              <span className="text-secondary/60 font-medium text-sm">
                {currentMonth} {currentYear}
              </span>
              <button
                onClick={() => navigateMonth("next")}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-secondary/60" />
              </button>
            </div>
          </div>

          {/* Mobile Date Picker */}
          <div className="flex justify-between items-center mb-2 px-2">
            <button
              onClick={() => setWeekOffset((prev) => Math.max(prev - 1, 0))}
              className="text-sm text-gray-600 hover:text-teal-500"
            >
              ← Prev
            </button>
            <button
              onClick={() =>
                setWeekOffset((prev) =>
                  (prev + 1) * daysPerWeek < allDates.length ? prev + 1 : prev
                )
              }
              className="text-sm text-gray-600 hover:text-teal-500"
            >
              Next →
            </button>
          </div>
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {mobileDates.map((date) => (
              <button
                key={date.day}
                onClick={() => handleDateSelect(date.day)}
                className={`flex-shrink-0 w-10 h-16 rounded-lg flex flex-col items-center justify-center text-sm font-medium transition-colors ${
                  selectedDate === date.day
                    ? "bg-teal-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <span className="text-xs mb-1">{date.label}</span>
                <span className="text-lg">{date.day}</span>
              </button>
            ))}
          </div>

          {/* Select Time */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-secondary/80">Select Time</h3>
              <span className="text-sm text-secondary/60">
                {slotsLoading ? "Loading..." : `${availableSlots.length} Slots`}
              </span>
            </div>

            {slotsLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
              </div>
            ) : slotsError ? (
              <div className="text-center py-4">
                <p className="text-red-500 text-sm">Error loading slots</p>
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-gray-500 text-sm">
                  {selectedDate
                    ? "No slots available for this date"
                    : "Select a date to view slots"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {availableSlots
                  .filter((slot) => !slot.isBooked)
                  .map((slot) => {
                    const timeString = formatSlotTime(slot.startTime);
                    return (
                      <button
                        key={slot.slotId}
                        onClick={() =>
                          handleTimeSelect(slot.slotId, timeString)
                        }
                        className={`py-3 px-3 rounded-lg text-sm font-medium transition-colors ${
                          selectedTime === timeString
                            ? "bg-teal-500 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {timeString}
                      </button>
                    );
                  })}
              </div>
            )}

            <button
              onClick={handleBookAppointment}
              disabled={!selectedTime || slotsLoading}
              className="w-full bg-teal-500 hover:bg-teal-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl transition-colors"
            >
              ${doctor.pricePerSession} Book Now
            </button>
          </div>
        </div>
      </div>
      {showAppointmentModal && (
        <AppointmentModal
          doctor={doctor}
          slot={selectedSlot}
          date={formattedSelectedDate}
          time={selectedTime} // Pass the time if you have it
          onClose={handleCloseModal}
          onConfirm={handleConfirm}
          onUpdate={handleUpdate}
          isLowFounds={
            user.patientProfile.telehealthWalletBalance < doctor.pricePerSession
          }
          openAddfoundsModal={() => setShowAddFundsModal(true)}
          userBalance={user.patientProfile.telehealthWalletBalance}
        />
      )}
      {showAddFundsModal && (
        <TelehealthAddFunds onClose={() => setShowAddFundsModal(false)} />
      )}
    </div>
  );
}
