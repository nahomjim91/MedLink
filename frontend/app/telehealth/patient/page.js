"use client";
import React, { useState } from "react";
import {
  Heart,
  Eye,
  Stethoscope,
  Plus,
  Star,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { UpcomingAppointmentCard } from "../components/ui/Card";
import CalendarAppointments from "../components/ui/CalendarAppointments";
import TelehealthAddFunds from "../components/ui/AddFound";
import { useAuth } from "../hooks/useAuth";

export default function TelehealthPatientPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAddFunds, setShowAddFunds] = useState(false);
  const {user} = useAuth();

  const appointmentHistory = [
    {
      id: 1,
      doctor: "Dr. Vinny Vong",
      specialty: "Dentist",
      date: "11 May, Friday",
      diagnosis: "Covid-19",
    },
    {
      id: 2,
      doctor: "Dr. Vinny Vong",
      specialty: "Dentist",
      date: "11 May, Friday",
      diagnosis: "Covid-19",
    },
    {
      id: 3,
      doctor: "Dr. Vinny Vong",
      specialty: "Dentist",
      date: "11 May, Friday",
      diagnosis: "Covid-19",
    },
    {
      id: 4,
      doctor: "Dr. Vinny Vong",
      specialty: "Dentist",
      date: "11 May, Friday",
      diagnosis: "Covid-19",
    },
  ];

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

  const specialties = [
    { name: "Dentist", icon: Heart, active: true },
    { name: "Oculist", icon: Eye, active: false },
    { name: "Cardio", icon: Stethoscope, active: false },
    { name: "Gen", icon: Heart, active: false },
  ];

  // Calendar helper functions
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const navigateMonth = (direction) => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const monthYear = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="">
      {/* Header with New Appointment button */}
      <div className="flex  justify-between md:justify-end items-center mb-6 md:mb-2">
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

        <UpcomingAppointmentCard
          upcomingAppointment={{
            id: 1,
            doctorName: "Dr. Vinny Vong",
            specialty: "Dentist",
            date: "11 May, Friday",
            time: "11am - 11:30am",
            avatar:
              "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&h=150&fit=crop&crop=face",
          }}
        />

        {/* Calendar */}
        <CalendarAppointments />
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
              <div>Diagnosis</div>
            </div>

            {appointmentHistory.map((appointment) => (
              <div
                key={appointment.id}
                className="grid grid-cols-4 gap-4 py-3 text-sm border-b border-gray-100 last:border-b-0 text-secondary/60"
              >
                <div className=" flex items-center gap-2">
                  <div className=" hidden md:block w-8 h-8 rounded-full bg-gray-300"></div>
                  <span className=" font-medium text-gray-900">
                    {appointment.doctor}
                  </span>
                </div>
                <div className="">{appointment.specialty}</div>
                <div className="">{appointment.date}</div>
                <div className="">{appointment.diagnosis}</div>
              </div>
            ))}
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
                const IconComponent = specialty.icon;
                return (
                  <button
                    key={specialty.name}
                    className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                      specialty.active
                        ? "bg-teal-500 text-white"
                        : "bg-gray-100 text-secondary/80 hover:bg-gray-200"
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                    {specialty.name}
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
              <h2 className="text-lg font-semibold text-secondary">My Wallet</h2>
              <button className="text-teal-500 text-sm font-medium hover:text-teal-600"  onClick={() => setShowAddFunds(true)}>
                Add Funds
              </button>
            </div>

            <div className="text-center flex justify-between items-center">
              <p className="text-sm text-secondary/80 mb-2 md:mb-1">Current Balance</p>
              <div className="bg-teal-500 text-white px-6 py-1 rounded-full inline-block">
                <span className="text-xl font-bold">{user.patientProfile.telehealthWalletBalance} Birr</span>
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
