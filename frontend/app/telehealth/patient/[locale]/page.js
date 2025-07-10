"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, Star } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { UpcomingAppointmentCard } from "../../components/ui/Card";
import { CalendarAppointments } from "../../components/ui/CalendarAppointments";
import TelehealthAddFunds from "../../components/ui/AddFound";
import { useAuth } from "../../hooks/useAuth";
import {
  GET_DOCTOR_SPECIALIZATIONS,
  GET_DOCTORS_BY_SPECIALIZATION,
} from "../../api/graphql/queries";
import { useQuery } from "@apollo/client";
import { useAppointment } from "../../hooks/useAppointment ";
import Link from "next/link";
import { AppointmentDetailModal } from "../../components/ui/modal/AppointmentModal ";

export default function TelehealthPatientPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [historyAppointments, setHistoryAppointments] = useState([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [isDetailModalOpen, setDetailModalOpen] = useState(false);

  const { user } = useAuth();
  const {
    fetchMyAppointments,
    cancelAppointment,
    loading: appointmentsLoading,
  } = useAppointment();

  // Fetch specializations
  const { data: specializationsData, loading: specializationsLoading } =
    useQuery(GET_DOCTOR_SPECIALIZATIONS, {
      onCompleted: (data) => {
        // This code runs only ONCE when the query successfully finishes
        const fetchedSpecialties =
          data?.getDoctorSpecializations || data?.doctorSpecializations || [];
        // If we have specialties and none is selected yet, set the first one as default
        if (fetchedSpecialties.length > 0 && !selectedSpecialty) {
          console.log(
            "Setting default specialty from onCompleted:",
            fetchedSpecialties[0]
          );
          setSelectedSpecialty(fetchedSpecialties[0]);
        }
      },
      errorPolicy: "all",
      notifyOnNetworkStatusChange: true,
    });

  // Memoize specialties as before
  const specialties = useMemo(() => {
    return (
      specializationsData?.getDoctorSpecializations ||
      specializationsData?.doctorSpecializations ||
      []
    );
  }, [specializationsData]);

  // Fetch doctors by specialization
  const {
    data: doctorsData,
    loading: doctorsLoading,
    error: doctorsError,
  } = useQuery(GET_DOCTORS_BY_SPECIALIZATION, {
    variables: { specialization: selectedSpecialty },
    skip: !selectedSpecialty, // This is the key part
    fetchPolicy: "cache-and-network",
  });

  // Memoize doctors to handle different response structures
  const doctors = useMemo(() => {
    if (!doctorsData) return [];

    // Handle different possible response structures
    return (
      doctorsData.getDoctorsBySpecialization ||
      doctorsData.doctorsBySpecialization ||
      []
    );
  }, [doctorsData]);

  // Set default specialty when specialties are loaded

  // Memoized function to load appointments
  const loadAppointments = useCallback(async () => {
    try {
      console.log("Loading appointments...");
      const appointmentsData = await fetchMyAppointments();

      if (!appointmentsData) {
        console.log("No appointments data received");
        setAppointments([]);
        setHistoryAppointments([]);
        return;
      }

      console.log("Loaded appointments:", appointmentsData);
      setAppointments(appointmentsData);

      // Filter appointments for history (cancelled and finished)
      const historyData = appointmentsData.filter(
        (appointment) =>
          appointment.status === "CANCELLED_DOCTOR" ||
          appointment.status === "CANCELLED_PATIENT" ||
          appointment.status === "COMPLETED"
      );

      console.log("History appointments:", historyData);
      setHistoryAppointments(historyData);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      // Set empty arrays on error to prevent UI issues
      setAppointments([]);
      setHistoryAppointments([]);
    }
  }, [fetchMyAppointments]);

  // Fetch appointments on component mount
  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  // Enhanced appointment cancellation handler
  const handleCancelAppointment = useCallback(
    async (appointmentId, reason) => {
      if (!appointmentId) {
        console.error("No appointment ID provided for cancellation");
        throw new Error("Invalid appointment ID");
      }

      try {
        await cancelAppointment(appointmentId, reason);

        // Refresh appointments after cancellation
        await loadAppointments();

        console.log("Appointment cancelled successfully");
      } catch (error) {
        console.error("Failed to cancel appointment:", error);
        throw error; // Re-throw to let the component handle the error display
      }
    },
    [cancelAppointment, loadAppointments]
  );

  // Enhanced specialty selection handler
  const handleSpecialtySelect = useCallback((specialty) => {
    if (!specialty) {
      console.warn("No specialty provided");
      return;
    }

    console.log("Selecting specialty:", specialty);
    setSelectedSpecialty(specialty);
  }, []);

  // Enhanced doctor data transformation with better error handling
  const getDisplayDoctors = useMemo(() => {
    // console.log("Processing doctors - Selected specialty:", selectedSpecialty);
    // console.log("Raw doctors data:", doctors);

    if (!doctors || !Array.isArray(doctors) || doctors.length === 0) {
      console.log("No valid doctors data available");
      return [];
    }

    // console.log("Processing doctors data:", doctors);

    return doctors.map((doctor, index) => {
      try {
        // Enhanced null checks for nested properties
        const firstName = doctor?.user?.firstName || doctor?.firstName || "";
        const lastName = doctor?.user?.lastName || doctor?.lastName || "";
        const fullName = `Dr. ${firstName} ${lastName}`.trim();

        // Handle specialization - it might be an array or string
        let doctorSpecialty = selectedSpecialty;
        if (doctor.specialization) {
          doctorSpecialty = Array.isArray(doctor.specialization)
            ? doctor.specialization[0]
            : doctor.specialization;
        }

        const processedDoctor = {
          id: doctor.doctorId || doctor.id || `doctor-${index}`,
          name: fullName === "Dr." ? "Dr. Unknown" : fullName,
          specialty: doctorSpecialty || "General",
          rating: Math.max(0, parseFloat(doctor.averageRating || 0)),
          ratingCount: Math.max(0, parseInt(doctor.ratingCount || 0)),
          price: Math.max(0, parseFloat(doctor.pricePerSession || 0)),
          avatar: doctor?.user?.profileImageUrl || doctor?.profileImageUrl,
          experience: Math.max(0, parseInt(doctor.experienceYears || 0)),
          isApproved: Boolean(doctor.isApproved),
          gender: doctor?.user?.gender || doctor?.gender || "Not specified",
        };

        // console.log(`Processed doctor ${index + 1}:`, processedDoctor);
        return processedDoctor;
      } catch (error) {
        console.error(
          `Error processing doctor at index ${index}:`,
          error,
          doctor
        );
        // Return a fallback doctor object
        return {
          id: `doctor-error-${index}`,
          name: "Dr. Unknown",
          specialty: selectedSpecialty || "General",
          rating: 0,
          ratingCount: 0,
          price: 0,
          avatar: "/api/placeholder/60/60",
          experience: 0,
          isApproved: false,
          gender: "Not specified",
        };
      }
    });
  }, [doctors, selectedSpecialty]);

  // Enhanced upcoming appointment getter with better error handling
  const getUpcomingAppointment = useMemo(() => {
    if (!appointments || appointments.length === 0) return null;
    console.log("Getting upcoming appointment:", appointments);

    try {
      const upcomingAppointments = appointments.filter(
        (appointment) =>
          appointment?.status === "CONFIRMED" ||
          appointment?.status === "PENDING" ||
          appointment?.status === "REQUESTED" ||
          appointment?.status === "SCHEDULED" ||
          appointment?.status === "UPCOMING" ||
          appointment?.status === "IN_PROGRESS"
      );

      if (upcomingAppointments.length === 0) return null;

      // Sort by scheduled start time and get the closest one
      const sortedAppointments = upcomingAppointments.sort((a, b) => {
        const timeA = new Date(a.scheduledStartTime);
        const timeB = new Date(b.scheduledStartTime);
        return timeA - timeB;
      });

      const closest = sortedAppointments[0];
      if (!closest) return null;

      // Enhanced doctor name extraction
      const getDoctorName = (appointment) => {
        const doctor = appointment.doctor;
        if (!doctor) return "Unknown Doctor";

        const firstName = doctor.firstName || doctor.user?.firstName || "";
        const lastName = doctor.lastName || doctor.user?.lastName || "";

        return firstName || lastName
          ? `Dr. ${firstName} ${lastName}`.trim()
          : "Unknown Doctor";
      };

      // Enhanced specialty extraction
      const getSpecialty = (appointment) => {
        const doctor = appointment.doctor;
        if (!doctor) return "General";

        const specialization = doctor.doctorProfile?.specialization;
        if (Array.isArray(specialization) && specialization.length > 0) {
          return specialization.join(", ");
        }
        return specialization || "General";
      };

      // Transform to match UpcomingAppointmentCard expected format
      return {
        id: closest.appointmentId,
        doctorName: getDoctorName(closest),
        specialty: getSpecialty(closest),
        date: new Date(closest.scheduledStartTime).toLocaleDateString("en-US", {
          day: "numeric",
          month: "short",
          weekday: "long",
        }),
        time: `${new Date(closest.scheduledStartTime).toLocaleTimeString(
          "en-US",
          {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          }
        )} - ${new Date(closest.scheduledEndTime).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })}`,
        avatar:
          closest.doctor?.profileImageUrl ||
          closest.doctor?.user?.profileImageUrl ||
          "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&h=150&fit=crop&crop=face",
        status: closest.status,
      };
    } catch (error) {
      console.error("Error getting upcoming appointment:", error);
      return null;
    }
  }, [appointments]);

  // Enhanced calendar appointments transformation
  const getCalendarAppointments = useMemo(() => {
    if (!appointments || appointments.length === 0) return [];

    return appointments.map((appointment, index) => {
      try {
        const getDoctorName = (appt) => {
          const doctor = appt.doctor;
          if (!doctor) return "Unknown Doctor";

          const firstName = doctor.firstName || doctor.user?.firstName || "";
          const lastName = doctor.lastName || doctor.user?.lastName || "";

          return firstName || lastName
            ? `Dr. ${firstName} ${lastName}`.trim()
            : "Unknown Doctor";
        };

        const getSpecialty = (appt) => {
          const doctor = appt.doctor;
          if (!doctor) return "General";

          const specialization = doctor.doctorProfile?.specialization;
          if (Array.isArray(specialization) && specialization.length > 0) {
            return specialization.join(", ");
          }
          return specialization || "General";
        };

        return {
          id: appointment.appointmentId || `appointment-${index}`,
          doctorName: getDoctorName(appointment),
          specialty: getSpecialty(appointment),
          date: new Date(appointment.scheduledStartTime),
          time: `${new Date(appointment.scheduledStartTime).toLocaleTimeString(
            "en-US",
            {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            }
          )} - ${new Date(appointment.scheduledEndTime).toLocaleTimeString(
            "en-US",
            {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            }
          )}`,
          status: appointment.status,
          avatar:
            appointment.doctor?.profilePicture ||
            appointment.doctor?.profileImageUrl,
        };
      } catch (error) {
        console.error(
          `Error processing calendar appointment at index ${index}:`,
          error
        );
        return {
          id: `appointment-error-${index}`,
          doctorName: "Unknown Doctor",
          specialty: "General",
          date: new Date(),
          time: "Time not available",
          status: "UNKNOWN",
          avatar: "/api/placeholder/60/60",
        };
      }
    });
  }, [appointments]);

  // Enhanced history appointments transformation
  const getHistoryAppointments = useMemo(() => {
    if (!historyAppointments || historyAppointments.length === 0) return [];

    return historyAppointments.map((appointment, index) => {
      try {
        const getDoctorName = (appt) => {
          const doctor = appt.doctor;
          if (!doctor) return "Unknown Doctor";

          const firstName = doctor.firstName || doctor.user?.firstName || "";
          const lastName = doctor.lastName || doctor.user?.lastName || "";

          return firstName || lastName
            ? `Dr. ${firstName} ${lastName}`.trim()
            : "Unknown Doctor";
        };

        const getSpecialty = (appt) => {
          const doctor = appt.doctor;
          if (!doctor || !doctor.doctorProfile) return "General";

          const specialization = doctor.doctorProfile.specialization;
          if (Array.isArray(specialization) && specialization.length > 0) {
            return specialization[0];
          }
          return specialization || "General";
        };

        const getDiagnosis = (appt) => {
          if (appt.diagnosis) return appt.diagnosis;
          if (appt.notes) return appt.notes;

          switch (appt.status) {
            case "CANCELLED_DOCTOR":
              return "Cancelled by Doctor";
            case "CANCELLED_PATIENT":
              return "Cancelled";
            case "COMPLETED":
              return "Completed";
            default:
              return "No diagnosis available";
          }
        };

        return {
          id: appointment.appointmentId || `history-${index}`,
          doctor: getDoctorName(appointment),
          specialty: getSpecialty(appointment),
          date: new Date(appointment.scheduledStartTime).toLocaleDateString(
            "en-US",
            {
              day: "numeric",
              month: "short",
              weekday: "long",
            }
          ),
          diagnosis: getDiagnosis(appointment),
          status: appointment.status,
          avatar:
            appointment.doctor?.profileImageUrl ||
            appointment.doctor?.user?.profileImageUrl,
        };
      } catch (error) {
        console.error(
          `Error processing history appointment at index ${index}:`,
          error
        );
        return {
          id: `history-error-${index}`,
          doctor: "Unknown Doctor",
          specialty: "General",
          date: "Date not available",
          diagnosis: "Information not available",
          status: "UNKNOWN",
          avatar: "/api/placeholder/60/60",
        };
      }
    });
  }, [historyAppointments]);

  // Memoize computed values
  const upcomingAppointment = getUpcomingAppointment;
  const calendarAppointments = getCalendarAppointments;
  const historyData = getHistoryAppointments;
  const displayDoctors = getDisplayDoctors;

  return (
    <div className="">
      {/* Header with New Appointment button */}
      <div className="flex justify-between md:justify-end items-center mb-6 md:mb-2">
        <div className="md:hidden">
          <h1 className="text-2xl font-bold text-secondary">Hello, Ms X</h1>
        </div>
        <Link href={`/telehealth/patient/doctors`}>
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Appointment
          </Button>
        </Link>
      </div>

      {/* Upcoming Appointments and Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
        {/* Upcoming Appointments */}
        {appointmentsLoading ? (
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          </div>
        ) : upcomingAppointment ? (
          <UpcomingAppointmentCard
            upcomingAppointment={upcomingAppointment}
            onCancelAppointment={handleCancelAppointment}
            onViewProfile={() => {
              setSelectedAppointment(upcomingAppointment.id);
              setDetailModalOpen(true);
            }}
            loading={appointmentsLoading}
            userRole={user.role}
          />
        ) : (
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="text-lg font-semibold text-secondary mb-4">
              Upcoming Appointment
            </h2>
            <p className="text-gray-500 text-center">
              No upcoming appointments
            </p>
          </div>
        )}

        {/* Calendar with methods passed */}
        <CalendarAppointments
          appointments={calendarAppointments}
          onCancelAppointment={() => {
            console.log("dsjldhbjlsdbh");
          }}
          // onCancelAppointment={handleCancelAppointment}
          loading={appointmentsLoading}
          onViewProfile={(id) => {
            console.log("idsds", id);
            setSelectedAppointment(id);
            setDetailModalOpen(true);
          }}
        />
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* History Table */}
        <div className="lg:col-span-2 bg-white p-3 rounded-xl shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold text-secondary">History</h2>
            <Link
              href="/telehealth/patient/appointments"
              className="text-primary/70 text-sm font-medium hover:text-primary"
            >
              See All
            </Link>
          </div>

          <div className="overflow-x-auto">
            <div className="grid grid-cols-4 gap-4 text-sm font-medium text-secondary/80 pb-2 border-b">
              <div>Doctor</div>
              <div>Speciality</div>
              <div>Date of Visit</div>
              <div>Status/Diagnosis</div>
            </div>

            {appointmentsLoading ? (
              // Loading skeleton
              Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="grid grid-cols-4 gap-4 py-3 animate-pulse"
                >
                  <div className="flex items-center gap-2">
                    <div className="hidden md:block w-8 h-8 rounded-full bg-gray-200"></div>
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-4 bg-gray-200 rounded w-18"></div>
                </div>
              ))
            ) : historyData.length > 0 ? (
              historyData.map((appointment) => (
                <div
                  key={appointment.id}
                  className="grid grid-cols-4 gap-4 py-3 text-sm border-b border-gray-100 last:border-b-0 text-secondary/60"
                >
                  <div className="flex items-center gap-2">
                    <div className="hidden md:block w-8 h-8 rounded-full bg-gray-300 overflow-hidden">
                      <img
                        src={
                          process.env.NEXT_PUBLIC_TELEHEALTH_API_URL +
                          appointment.avatar
                        }
                        alt={appointment.doctor}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    </div>
                    <span className="font-medium text-secondary">
                      {appointment.doctor}
                    </span>
                  </div>
                  <div className="">{appointment.specialty}</div>
                  <div className="">{appointment.date}</div>
                  <div
                    className={`flex items-center gap-1 ${
                      appointment.status === "CANCELLED"
                        ? "text-red-600"
                        : appointment.status === "COMPLETED"
                        ? "text-green-600"
                        : "text-gray-600"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        appointment.status === "CANCELLED"
                          ? "bg-red-400"
                          : appointment.status === "COMPLETED"
                          ? "bg-green-400"
                          : "bg-gray-400"
                      }`}
                    ></span>
                    {appointment.diagnosis}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-gray-500">
                No appointment history found
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-3">
          {/* Specialty Doctors */}
          <div className="bg-white p-3 rounded-xl shadow-sm">
            <div className="flex justify-between items-center mb-4 md:mb-2">
              <h2 className="text-lg font-semibold text-secondary">
                Specialty Doctors
              </h2>
              <Link
                href="/telehealth/patient/doctors"
                className="text-teal-500 text-sm font-medium hover:text-teal-600"
              >
                See All
              </Link>
            </div>

            {/* Specialty Selection Buttons */}
            <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
              {specializationsLoading
                ? // Loading skeleton for specialties
                  Array.from({ length: 3 }).map((_, index) => (
                    <div
                      key={index}
                      className="flex-shrink-0 px-4 py-2 bg-gray-200 rounded-full animate-pulse"
                    >
                      <div className="h-4 w-16 bg-gray-300 rounded"></div>
                    </div>
                  ))
                : specialties.map((specialty) => (
                    <button
                      key={specialty}
                      onClick={() => handleSpecialtySelect(specialty)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                        selectedSpecialty === specialty
                          ? "bg-teal-500 text-white"
                          : "bg-gray-100 text-secondary/80 hover:bg-gray-200"
                      }`}
                    >
                      {specialty}
                    </button>
                  ))}
            </div>

            {/* Doctors List */}
            <div className="">
              {doctorsLoading ? (
                // Loading skeleton for doctors
                <div className="flex gap-4 overflow-x-auto scrollbar-hide ">
                  {Array.from({ length: 2 }).map((_, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl animate-pulse"
                    >
                      <div className="w-12 h-12 rounded-full bg-gray-200"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className="h-4 bg-gray-200 rounded w-12"></div>
                        <div className="h-4 bg-gray-200 rounded w-8"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : doctorsError ? (
                <div className="text-center py-4 text-red-500">
                  Error loading doctors: {doctorsError.message}
                  <br />
                  <button
                    onClick={() => refetchDoctors()}
                    className="text-sm text-blue-500 underline mt-2"
                  >
                    Retry
                  </button>
                </div>
              ) : displayDoctors.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  {selectedSpecialty
                    ? `No doctors found for ${selectedSpecialty}`
                    : "Select a specialty to view doctors"}
                </div>
              ) : (
                <>
                  {/* Mobile Layout - Vertical cards with horizontal scroll */}
                  <div className="lg:hidden">
                    <div className="flex gap-4 overflow-x-auto scrollbar-hide">
                      {displayDoctors.map((doctor) => (
                        <Link
                          href={`/telehealth/patient/doctors/${doctor.id}`}
                          key={doctor.id}
                          className="flex-none w-80 bg-white rounded-2xl shadow-sm border border-gray-100 p-4"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-primary/20 overflow-hidden flex-shrink-0">
                              <img
                                src={
                                  process.env.NEXT_PUBLIC_TELEHEALTH_API_URL +
                                  doctor.avatar
                                }
                                alt={doctor.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-secondary text-lg truncate">
                                {doctor.name}
                              </h3>
                              <p className="text-secondary/80 text-sm">
                                {doctor.specialty}
                              </p>
                              <p className="text-gray-500 text-xs mt-1">
                                {doctor.experience} years experience
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-teal-400 fill-current" />
                                <span className="font-semibold text-teal-400">
                                  {doctor.rating.toFixed(1)}
                                </span>
                                <span className="text-xs text-gray-500">
                                  ({doctor.ratingCount})
                                </span>
                              </div>
                              <span className="font-bold text-teal-400 text-lg">
                                {doctor.price} Birr
                              </span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Desktop Layout - Horizontal compact cards */}
                  <div className="hidden lg:block">
                    <div className="flex gap-3 overflow-x-auto pb- scrollbar-hide">
                      {displayDoctors.map((doctor) => (
                        <Link
                          href={`/telehealth/patient/doctors/${doctor.id}`}
                          key={doctor.id}
                          className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 hover:shadow-md transition-shadow cursor-pointer"
                        >
                          <div className="flex items-center gap-6">
                            <div className="w-12 h-12 rounded-full bg-orange-200 overflow-hidden flex-shrink-0">
                              {console.log(
                                process.env.NEXT_PUBLIC_TELEHEALTH_API_URL +
                                  doctor.avatar
                              )}
                              <img
                                src={
                                  process.env.NEXT_PUBLIC_TELEHEALTH_API_URL +
                                  doctor.avatar
                                }
                                alt={doctor.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-secondary truncate">
                                {doctor.name}
                              </h3>
                              <p className="text-secondary/80 text-sm">
                                {doctor.experience}+ years experience
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex items-center gap-1">
                                  <Star className="w-3 h-3 text-teal-400 fill-current" />
                                  <span className="text-sm font-medium text-teal-400">
                                    {doctor.rating.toFixed(1)}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    ({doctor.ratingCount})
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <span className="font-bold text-teal-400">
                                {doctor.price} Birr
                              </span>
                              {!doctor.isApproved && (
                                <span className="text-xs text-orange-500 bg-orange-50 px-2 py-1 rounded-full">
                                  Pending
                                </span>
                              )}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Custom scrollbar styling */}
              <style jsx>{`
                .scrollbar-hide {
                  -ms-overflow-style: none;
                  scrollbar-width: none;
                }
                .scrollbar-hide::-webkit-scrollbar {
                  display: none;
                }
              `}</style>
            </div>
          </div>

          {/* My Wallet */}
          <div className="bg-white p-3 rounded-xl shadow-sm">
            <div className="flex justify-between items-center mb-4 md:mb-2">
              <h2 className="text-lg font-semibold text-secondary">
                My Wallet
              </h2>
              <button
                className="text-teal-500 text-sm font-medium hover:text-teal-600"
                onClick={() => setShowAddFunds(true)}
              >
                Add Funds
              </button>
            </div>

            <div className="text-center flex justify-between items-center">
              <p className="text-sm text-secondary/80 mb-2 md:mb-1">
                Current Balance
              </p>
              <div className="bg-teal-500 text-white px-6 py-1 rounded-full inline-block">
                <span className="text-xl font-bold">
                  {user?.patientProfile?.telehealthWalletBalance || 0} Birr
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Funds Modal */}
      {showAddFunds && (
        <TelehealthAddFunds onClose={() => setShowAddFunds(false)} />
      )}

      <AppointmentDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        appointmentId={selectedAppointment}
        userRole={user.role.toUpperCase()}
      />
    </div>
  );
}
