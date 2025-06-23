"use client";
import React, { useState, useEffect } from "react";
import { Plus, Star } from "lucide-react";
import { Button } from "../components/ui/Button";
import { UpcomingAppointmentCard } from "../components/ui/Card";
import CalendarAppointments from "../components/ui/CalendarAppointments";
import TelehealthAddFunds from "../components/ui/AddFound";
import { useAuth } from "../hooks/useAuth";
import { GET_DOCTOR_SPECIALIZATIONS } from "../api/graphql/queries";
import { useQuery } from "@apollo/client";
import { useAppointment } from "../hooks/useAppointment ";

export default function TelehealthPatientPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [historyAppointments, setHistoryAppointments] = useState([]);
  
  const { user } = useAuth();
  const { fetchMyAppointments, loading: appointmentsLoading } = useAppointment();

  const {
    data: specializationsData,
    loading: specializationsLoading,
    error: specializationsError,
  } = useQuery(GET_DOCTOR_SPECIALIZATIONS);
  const specialties = specializationsData?.getDoctorSpecializations || [];

  // Fetch appointments on component mount
  useEffect(() => {
    const loadAppointments = async () => {
      try {
        const appointmentsData = await fetchMyAppointments();
        setAppointments(appointmentsData);
        
        console.log('Appointments Data:', appointmentsData);
        // Filter appointments for history (cancelled and finished)
        const historyData = appointmentsData.filter(
          appointment => 
            appointment.status === 'CANCELLED' || 
            appointment.status === 'COMPLETED'
        );
        setHistoryAppointments(historyData);
      } catch (error) {
        console.error('Error fetching appointments:', error);
      }
    };

    loadAppointments();
  }, [fetchMyAppointments]);

  // Get the closest upcoming appointment
  const getUpcomingAppointment = () => {

    const upcomingAppointments = appointments.filter(
      appointment => 
        appointment.status === 'CONFIRMED' || 
        appointment.status === 'PENDING' ||
        appointment.status === 'REQUESTED' ||
        appointment.status === 'SCHEDULED'
    );
    
    if (upcomingAppointments.length === 0) return null;
    
    // Sort by scheduled start time and get the closest one
    const sortedAppointments = upcomingAppointments.sort((a, b) => {
      const timeA = new Date(a.scheduledStartTime);
      const timeB = new Date(b.scheduledStartTime);
      return timeA - timeB;
    });
    
    const closest = sortedAppointments[0];
    
    // Transform to match UpcomingAppointmentCard expected format
    return {
      id: closest.id,
      doctorName: closest.doctor?.name || closest.doctor?.user?.name || 'Unknown Doctor',
      specialty: closest.doctor?.specialization || 'General',
      date: new Date(closest.scheduledStartTime).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        weekday: 'long'
      }),
      time: `${new Date(closest.scheduledStartTime).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })} - ${new Date(closest.scheduledEndTime).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })}`,
      avatar: closest.doctor?.profilePicture || 
        "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&h=150&fit=crop&crop=face",
      status: closest.status
    };
  };

  // Transform appointments for calendar
 const getCalendarAppointments = () => {
  return appointments.map(appointment => ({
    id: appointment.id,
    doctorName: appointment.doctor?.name || appointment.doctor?.user?.name || 'Unknown Doctor',
    specialty: appointment.doctor?.specialization || 'General',
    date: new Date(appointment.scheduledStartTime), // Convert to Date object
    time: `${new Date(appointment.scheduledStartTime).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })} - ${new Date(appointment.scheduledEndTime).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })}`,
    status: appointment.status,
    avatar: appointment.doctor?.profilePicture || "/api/placeholder/60/60"
  }));
};

  // Transform history appointments
  const getHistoryAppointments = () => {
    return historyAppointments.map(appointment => ({
      id: appointment.id,
      doctor: appointment.doctor?.name || appointment.doctor?.user?.name || 'Unknown Doctor',
      specialty: appointment.doctor?.specialization || 'General',
      date: new Date(appointment.scheduledStartTime).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        weekday: 'long'
      }),
      diagnosis: appointment.diagnosis || appointment.notes || (
        appointment.status === 'CANCELLED' ? 'Cancelled' : 'Completed'
      ),
      status: appointment.status,
      avatar: appointment.doctor?.profilePicture || "/api/placeholder/60/60"
    }));
  };

  const specialtyDoctors = [
    {
      id: 1,
      name: "Dr. Vinny Vong",
      specialty: "Dentist",
      rating: 5.0,
      price: 30,
      avatar: "/api/placeholder/60/60",
      experience: "5",
    },
    {
      id: 2,
      name: "Dr. Sarah Johnson",
      specialty: "Cardiologist",
      rating: 4.8,
      price: 45,
      avatar: "/api/placeholder/60/60",
    },
  ];

  const upcomingAppointment = getUpcomingAppointment();
  const calendarAppointments = getCalendarAppointments();
  const historyData = getHistoryAppointments();

  return (
    <div className="">
      {/* Header with New Appointment button */}
      <div className="flex justify-between md:justify-end items-center mb-6 md:mb-2">
        <div className="md:hidden">
          <h1 className="text-2xl font-bold text-gray-900">Hello, Ms X</h1>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Appointment
        </Button>
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
          <UpcomingAppointmentCard upcomingAppointment={upcomingAppointment} />
        ) : (
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="text-lg font-semibold text-secondary mb-4">Upcoming Appointment</h2>
            <p className="text-gray-500 text-center">No upcoming appointments</p>
          </div>
        )}

        {/* Calendar */}
        <CalendarAppointments appointments={calendarAppointments} />
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* History Table */}
        <div className="lg:col-span-2 bg-white p-3 rounded-xl shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold text-secondary">History</h2>
            <button className="text-primary/70 text-sm font-medium hover:text-primary">
              See All
            </button>
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
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="grid grid-cols-4 gap-4 py-3 animate-pulse">
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
                        src={appointment.avatar} 
                        alt={appointment.doctor}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                    <span className="font-medium text-gray-900">
                      {appointment.doctor}
                    </span>
                  </div>
                  <div className="">{appointment.specialty}</div>
                  <div className="">{appointment.date}</div>
                  <div className={`flex items-center gap-1 ${
                    appointment.status === 'CANCELLED' 
                      ? 'text-red-600' 
                      : appointment.status === 'COMPLETED'
                      ? 'text-green-600'
                      : 'text-gray-600'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${
                      appointment.status === 'CANCELLED' 
                        ? 'bg-red-400' 
                        : appointment.status === 'COMPLETED'
                        ? 'bg-green-400'
                        : 'bg-gray-400'
                    }`}></span>
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
                Specialty
              </h2>
              <button className="text-teal-500 text-sm font-medium hover:text-teal-600">
                See All
              </button>
            </div>

            <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
              {specialties.map((specialty) => {
                return (
                  <button
                    key={specialty}
                    className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                      specialty.active
                        ? "bg-teal-500 text-white"
                        : "bg-gray-100 text-secondary/80 hover:bg-gray-200"
                    }`}
                  >
                    {specialty}
                  </button>
                );
              })}
            </div>

            <div className="">
              {/* Mobile Layout - Vertical cards with horizontal scroll */}
              <div className="lg:hidden">
                <div className="flex gap-4 overflow-x-auto scrollbar-hide">
                  {specialtyDoctors.map((doctor) => (
                    <div
                      key={doctor.id}
                      className="flex-none w-80 bg-white rounded-2xl shadow-sm border border-gray-100 p-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-orange-200 overflow-hidden flex-shrink-0">
                          <img
                            src={doctor.avatar}
                            alt={doctor.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-lg truncate">
                            {doctor.name}
                          </h3>
                          <p className="text-secondary/80 text-sm">
                            {doctor.specialty}
                          </p>
                          <p className="text-gray-500 text-xs mt-1">
                            {doctor.experience}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-teal-400 fill-current" />
                            <span className="font-semibold text-teal-400">
                              {doctor.rating}
                            </span>
                          </div>
                          <span className="font-bold text-teal-400 text-lg">
                            ${doctor.price}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Desktop Layout - Horizontal compact cards with horizontal scroll */}
              <div className="hidden lg:block">
                <div className="flex gap-3 overflow-x-auto pb- scrollbar-hide">
                  {specialtyDoctors.map((doctor) => (
                    <div
                      key={doctor.id}
                      className="flex-none w-[90%] bg-white rounded-xl shadow-sm border border-gray-100 p-3"
                    >
                      <div className="flex justify-between items-center gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-orange-200 overflow-hidden flex-shrink-0">
                            <img
                              src={doctor.avatar}
                              alt={doctor.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <h3 className="font-semibold text-secondary whitespace-nowrap">
                              {doctor.name}
                            </h3>
                            <p className="text-secondary/80 text-sm whitespace-nowrap">
                              {doctor.experience}+ years
                            </p>
                            <span className="text-secondary/80 text-sm whitespace-nowrap">
                              {doctor.specialty}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items- gap-4">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-teal-400 fill-current" />
                            <span className="font-semibold text-teal-400">
                              {doctor.rating}
                            </span>
                          </div>
                          <span className="font-bold text-teal-400">
                            ${doctor.price}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

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
    </div>
  );
}