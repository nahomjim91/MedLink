"use client";

import React, { useState, useMemo } from 'react';

// --- Enums and Data (as per your specification) ---
const AppointmentStatus = {
    REQUESTED: 'REQUESTED',
    CONFIRMED: 'CONFIRMED',
    REJECTED: 'REJECTED',
    CANCELLED_PATIENT: 'CANCELLED_PATIENT',
    CANCELLED_DOCTOR: 'CANCELLED_DOCTOR',
    UPCOMING: 'UPCOMING',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    NO_SHOW: 'NO_SHOW',
};

const PaymentStatus = {
    PENDING: 'PENDING',
    PAID: 'PAID',
    REFUNDED: 'REFUNDED',
    FAILED: 'FAILED',
};

// --- Helper Data (updated with new, detailed structure) ---
const allAppointments = [
  {
    appointmentId: 1,
    patientId: 101,
    patientName: 'John Doe',
    doctorId: 201,
    doctorName: 'Dr. Vinny Vang',
    status: AppointmentStatus.UPCOMING,
    reasonNote: 'Covid-19 checkup',
    scheduledStartTime: '2025-07-11T09:00:00',
    scheduledEndTime: '2025-07-11T09:30:00',
    price: 150,
    paymentStatus: PaymentStatus.PAID,
    doctor: {
      id: 201,
      firstName: 'Vinny',
      lastName: 'Vang',
      profileImageUrl: 'https://placehold.co/40x40/E2E8F0/4A5568?text=VV',
      doctorProfile: { specialization: 'Dentist' }
    }
  },
  {
    appointmentId: 2,
    patientId: 102,
    patientName: 'Jane Smith',
    doctorId: 202,
    doctorName: 'Dr. Sarah Lee',
    status: AppointmentStatus.UPCOMING,
    reasonNote: 'Annual Check-up',
    scheduledStartTime: '2025-07-12T10:00:00',
    scheduledEndTime: '2025-07-12T10:30:00',
    price: 200,
    paymentStatus: PaymentStatus.PENDING,
    doctor: {
      id: 202,
      firstName: 'Sarah',
      lastName: 'Lee',
      profileImageUrl: 'https://placehold.co/40x40/E2E8F0/4A5568?text=SL',
      doctorProfile: { specialization: 'Cardiologist' }
    }
  },
  {
    appointmentId: 3,
    patientId: 103,
    patientName: 'Peter Jones',
    doctorId: 203,
    doctorName: 'Dr. John Doe',
    status: AppointmentStatus.UPCOMING,
    reasonNote: 'Skin Rash',
    scheduledStartTime: '2025-07-12T11:00:00',
    scheduledEndTime: '2025-07-12T11:30:00',
    price: 120,
    paymentStatus: PaymentStatus.PAID,
    doctor: {
      id: 203,
      firstName: 'John',
      lastName: 'Doe',
      profileImageUrl: 'https://placehold.co/40x40/E2E8F0/4A5568?text=JD',
      doctorProfile: { specialization: 'Dermatologist' }
    }
  },
  {
    appointmentId: 4,
    patientId: 101,
    patientName: 'John Doe',
    doctorId: 201,
    doctorName: 'Dr. Vinny Vang',
    status: AppointmentStatus.COMPLETED,
    reasonNote: 'Root Canal',
    scheduledStartTime: '2025-03-01T09:00:00',
    scheduledEndTime: '2025-03-01T09:30:00',
    price: 350,
    paymentStatus: PaymentStatus.PAID,
    doctor: {
      id: 201,
      firstName: 'Vinny',
      lastName: 'Vang',
      profileImageUrl: 'https://placehold.co/40x40/E2E8F0/4A5568?text=VV',
      doctorProfile: { specialization: 'Dentist' }
    }
  },
  {
    appointmentId: 5,
    patientId: 104,
    patientName: 'Mary Lamb',
    doctorId: 204,
    doctorName: 'Dr. Michael Brown',
    status: AppointmentStatus.CANCELLED_PATIENT,
    reasonNote: 'Knee Pain Consultation',
    scheduledStartTime: '2025-02-15T15:00:00',
    scheduledEndTime: '2025-02-15T15:30:00',
    price: 180,
    paymentStatus: PaymentStatus.REFUNDED,
    doctor: {
      id: 204,
      firstName: 'Michael',
      lastName: 'Brown',
      profileImageUrl: 'https://placehold.co/40x40/E2E8F0/4A5568?text=MB',
      doctorProfile: { specialization: 'Orthopedic' }
    }
  },
  {
    appointmentId: 6,
    patientId: 101,
    patientName: 'John Doe',
    doctorId: 201,
    doctorName: 'Dr. Vinny Vang',
    status: AppointmentStatus.COMPLETED,
    reasonNote: 'Dental Filling',
    scheduledStartTime: '2025-01-10T11:00:00',
    scheduledEndTime: '2025-01-10T11:30:00',
    price: 100,
    paymentStatus: PaymentStatus.PAID,
    doctor: {
      id: 201,
      firstName: 'Vinny',
      lastName: 'Vang',
      profileImageUrl: 'https://placehold.co/40x40/E2E8F0/4A5568?text=VV',
      doctorProfile: { specialization: 'Dentist' }
    }
  },
];


// --- SVG Icons ---
const FilterIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-500"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
);

const CalendarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
);

const ClockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
);

const StatCardIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 hover:text-gray-800 transition-colors">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);


// --- Filter Modal Component (Enhanced) ---
const FilterModal = ({ isOpen, onClose, onApply, onReset }) => {
    if (!isOpen) return null;

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div onClick={handleOverlayClick} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 transition-opacity duration-300">
            <div className="bg-white rounded-2xl shadow-lg w-full max-w-md transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-800">Filters</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
                        <CloseIcon />
                    </button>
                </div>
                <div className="p-6">
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-gray-600 mb-2 block">Date Range</label>
                            <div className="flex space-x-2">
                                <input type="date" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-transparent transition"/>
                                <input type="date" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-transparent transition"/>
                            </div>
                        </div>
                         <div>
                            <label className="text-sm font-medium text-gray-600 mb-2 block">Specialists</label>
                            <select className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-transparent transition">
                                <option>All</option>
                                <option>Dentist</option>
                                <option>Cardiologist</option>
                                <option>Dermatologist</option>
                                <option>Orthopedic</option>
                            </select>
                        </div>
                    </div>
                    <div className="mt-8 flex justify-end space-x-3">
                        <button onClick={onReset} className="px-6 py-2 rounded-full text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors font-semibold">Reset</button>
                        <button onClick={onApply} className="px-6 py-2 rounded-full text-white bg-teal-500 hover:bg-teal-600 transition-colors font-semibold">Apply</button>
                    </div>
                </div>
            </div>
            <style jsx>{`
                @keyframes fade-in-scale {
                    from {
                        opacity: 0;
                        transform: scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
                .animate-fade-in-scale {
                    animation: fade-in-scale 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};


// --- Main Appointments Component (Refactored) ---
export default function Appointments() {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [isFilterModalOpen, setFilterModalOpen] = useState(false);

  const { upcomingAppointments, historyAppointments, stats } = useMemo(() => {
    const upcoming = allAppointments.filter(appt => appt.status === AppointmentStatus.UPCOMING);
    const history = allAppointments.filter(appt => appt.status !== AppointmentStatus.UPCOMING);

    const attendedCount = allAppointments.filter(appt => appt.status === AppointmentStatus.COMPLETED).length;
    const cancelledCount = allAppointments.filter(
        appt => appt.status === AppointmentStatus.CANCELLED_DOCTOR || appt.status === AppointmentStatus.CANCELLED_PATIENT
    ).length;
    
    const stats = {
        upcoming: upcoming.length,
        made: allAppointments.length,
        attended: attendedCount,
        cancelled: cancelledCount,
    };
    
    return { upcomingAppointments: upcoming, historyAppointments: history, stats };
  }, []);

  const formatAppointmentDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'long' }).replace(/,/g, '');
  };
  
  const formatAppointmentTime = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
  };

  const groupAppointmentsByDate = (appointments) => {
    return appointments.reduce((acc, appointment) => {
      const dateKey = new Date(appointment.scheduledStartTime).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(appointment);
      return acc;
    }, {});
  };
  
  const groupedUpcoming = groupAppointmentsByDate(upcomingAppointments);
  const groupedHistory = groupAppointmentsByDate(historyAppointments);

  const handleFilterApply = () => {
    console.log("Applying filters...");
    setFilterModalOpen(false);
  }
  
  const handleFilterReset = () => {
    console.log("Resetting filters...");
  }

  const StatCard = ({ title, value }) => (
    <div className="bg-white p-6 rounded-2xl shadow-md flex items-center space-x-4">
        <div className="bg-teal-100 p-3 rounded-full"><StatCardIcon /></div>
        <div>
            <p className="text-gray-500 font-medium">{title}</p>
            <p className="text-3xl font-bold text-gray-800">{value}</p>
        </div>
    </div>
  );

  const getStatusBadgeClass = (status) => {
      switch (status) {
          case AppointmentStatus.COMPLETED: return 'bg-green-100 text-green-700';
          case AppointmentStatus.UPCOMING: return 'bg-blue-100 text-blue-700';
          case AppointmentStatus.CANCELLED_PATIENT:
          case AppointmentStatus.CANCELLED_DOCTOR: return 'bg-red-100 text-red-700';
          default: return 'bg-gray-100 text-gray-700';
      }
  };

  return (
    <div className="bg-[#F8F9FA] min-h-screen p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">Appointments</h1>

        {/* --- Dynamic Stat Cards (4 cards) --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Upcoming" value={stats.upcoming} />
          <StatCard title="Total Made" value={stats.made} />
          <StatCard title="Attended" value={stats.attended} />
          <StatCard title="Cancelled" value={stats.cancelled} />
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="hidden lg:block">
                <div className="flex items-center space-x-2 border border-gray-200 rounded-full p-1">
                    <button 
                        onClick={() => setActiveTab('upcoming')}
                        className={`px-5 py-2 text-sm font-semibold rounded-full transition-colors ${activeTab === 'upcoming' ? 'bg-teal-500 text-white shadow' : 'text-gray-600 hover:bg-gray-100'}`}>
                        Upcoming
                    </button>
                    <button 
                        onClick={() => setActiveTab('history')}
                        className={`px-5 py-2 text-sm font-semibold rounded-full transition-colors ${activeTab === 'history' ? 'bg-teal-500 text-white shadow' : 'text-gray-600 hover:bg-gray-100'}`}>
                        History
                    </button>
                </div>
            </div>
             <div className="lg:hidden text-xl font-bold text-gray-700">
                {activeTab === 'upcoming' ? 'Upcoming' : 'History'}
            </div>
            <button 
              onClick={() => setFilterModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-2 border border-teal-400 rounded-full text-teal-500 hover:bg-teal-50 transition-colors">
              <FilterIcon />
              <span className="font-semibold text-sm">Filters</span>
            </button>
          </div>
          
          <div>
            {/* --- Desktop Table View --- */}
            <div className="hidden lg:block">
              <table className="w-full text-left">
                <thead className="bg-[#F7FDFA]">
                  <tr>
                    <th className="p-4 font-semibold text-gray-600">Doctor</th>
                    <th className="p-4 font-semibold text-gray-600">Specialist</th>
                    <th className="p-4 font-semibold text-gray-600">Date & Time</th>
                    <th className="p-4 font-semibold text-gray-600">Reason</th>
                    <th className="p-4 font-semibold text-gray-600 text-center">Status</th>
                    <th className="p-4 font-semibold text-gray-600 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(activeTab === 'upcoming' ? upcomingAppointments : historyAppointments).map((appt) => (
                    <tr key={appt.appointmentId} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-4 flex items-center space-x-3">
                        <img src={appt.doctor.profileImageUrl} alt={appt.doctorName} className="w-10 h-10 rounded-full" />
                        <span className="font-semibold text-gray-800">{appt.doctorName}</span>
                      </td>
                      <td className="p-4 text-gray-600">{appt.doctor.doctorProfile.specialization}</td>
                      <td className="p-4 text-gray-600">
                        <div>{formatAppointmentDate(appt.scheduledStartTime)}</div>
                        <div className="text-sm text-gray-500">{formatAppointmentTime(appt.scheduledStartTime)}</div>
                      </td>
                      <td className="p-4 text-gray-600">{appt.reasonNote}</td>
                      <td className="p-4 text-center">
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(appt.status)}`}>
                              {appt.status.replace('_', ' ')}
                          </span>
                      </td>
                      <td className="p-4">
                          <div className="flex justify-center items-center space-x-2">
                              {activeTab === 'upcoming' && (
                                <button className="px-3 py-1.5 text-xs font-semibold text-teal-600 bg-teal-100 rounded-full hover:bg-teal-200 transition">Re-Schedule</button>
                              )}
                              <button className="px-3 py-1.5 text-xs font-semibold text-teal-600 border border-teal-400 rounded-full hover:bg-teal-50 transition">View Profile</button>
                          </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* --- Mobile Card View --- */}
            <div className="lg:hidden space-y-6">
              {Object.entries(activeTab === 'upcoming' ? groupedUpcoming : groupedHistory).map(([date, appointments]) => (
                <div key={date}>
                  <h3 className="font-bold text-gray-700 mb-3">{date}, 2025</h3>
                  <div className="space-y-4">
                    {appointments.map((appt) => (
                      <div key={appt.appointmentId} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                          <div className="flex items-start justify-between">
                              <div className="flex items-center space-x-3">
                                  <img src={appt.doctor.profileImageUrl} alt={appt.doctorName} className="w-12 h-12 rounded-full"/>
                                  <div>
                                      <p className="font-bold text-gray-800">{appt.doctorName}</p>
                                      <p className="text-sm text-gray-500">{appt.doctor.doctorProfile.specialization}</p>
                                  </div>
                              </div>
                               <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(appt.status)}`}>
                                  {appt.status.replace('_', ' ')}
                              </span>
                          </div>
                          <div className="border-t my-3"></div>
                          <div className="flex justify-between items-center text-sm mb-4">
                              <div className="flex items-center space-x-2">
                                  <CalendarIcon/>
                                  <span className="text-gray-600">{formatAppointmentDate(appt.scheduledStartTime)}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                  <ClockIcon/>
                                  <span className="text-gray-600">{formatAppointmentTime(appt.scheduledStartTime)}</span>
                              </div>
                          </div>
                          <div className="flex items-center space-x-2">
                              {activeTab === 'upcoming' && (
                                  <button className="w-full px-4 py-2 text-sm font-semibold text-teal-600 bg-teal-100 rounded-full hover:bg-teal-200 transition">Re-Schedule</button>
                              )}
                              <button className="w-full px-4 py-2 text-sm font-semibold text-teal-600 border border-teal-400 rounded-full hover:bg-teal-50 transition">View Profile</button>
                          </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <FilterModal 
        isOpen={isFilterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        onApply={handleFilterApply}
        onReset={handleFilterReset}
      />
    </div>
  );
}