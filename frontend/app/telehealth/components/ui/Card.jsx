'use client';
import React , { useState } from "react";
import { Calendar, Clock, FileText } from 'lucide-react';
import { Button } from "./Button";
import { CancelModal } from "./modal/AppointmentModal ";


export default function IconCard({ icon, label, onClick, isSelected }) {
  // Clone the icon element with modified props for dynamic color
  const iconWithDynamicColor = React.cloneElement(icon, {
    color: isSelected ? "#20c997" : "#6B7280"
  });

  return (
    <div 
      className={`flex flex-col items-center cursor-pointer transition-all ${
        isSelected ? "scale-105" : "hover:scale-105"
      }`}
      onClick={onClick}
    >
      <div className={`w-28 h-28 md:w-48 md:h-32 bg-white rounded-xl shadow-md flex items-center justify-center mb-2 ${
        isSelected ? "border-2 border-primary bg-primary/5" : "border border-gray-200"
      }`}>
        {iconWithDynamicColor}
      </div>
      <span className="text-gray-800 font-medium text-lg">{label}</span>
    </div>
  );
}


export  function AboutMeCard({ doctor }) {
  const [showModal, setShowModal] = useState(false);
  const aboutText = doctor.aboutMe || "No description available.";
  const maxLength = 200;
  const isLong = aboutText.length > maxLength;

  return (
    <div className="px-6 mb-6 md:ml-6 md:flex-2/3">
      <h2 className="text-lg md:text-lg font-bold text-secondary/70 mb-3">
        About Me
      </h2>

      <p className="text-secondary/60 text-sm md:text-base leading-relaxed">
        {isLong ? aboutText.slice(0, maxLength) + "..." : aboutText}
      </p>

      {isLong && (
        <button
          onClick={() => setShowModal(true)}
          className="text-teal-500 text-sm font-medium mt-2 hover:text-teal-600"
        >
          Read More ...
        </button>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white max-w-md w-[90%] rounded-xl p-6 shadow-lg relative">
            <h3 className="text-lg font-bold text-secondary mb-3">About Me</h3>
            <p className="text-gray-700 text-sm leading-relaxed">{aboutText}</p>
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-4 text-gray-400 hover:text-gray-600 text-xl"
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}



export function UpcomingAppointmentCard({ 
  upcomingAppointment, 
  onCancelAppointment,
  onViewProfile,
  loading = false 
}) {
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Check if appointment can be cancelled based on status
  const canCancel = ["REQUESTED", "PENDING", "CONFIRMED", "SCHEDULED" ].includes(
    upcomingAppointment.status
  );

  const handleCancelConfirm = async (appointmentId, reason) => {
    try {
      await onCancelAppointment(appointmentId, reason);
      setShowCancelModal(false);
    } catch (error) {
      console.error("Cancel failed:", error);
      // Error handling can be done by parent component
    }
  };



  const handleViewProfile = () => {
    if (onViewProfile) {
      onViewProfile(upcomingAppointment.id);
    }
  };
  console.log("Upcoming Appointment:", upcomingAppointment);

  return (
    <>
      <div className="w-full">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              Upcoming Appointment
            </h2>
            <button className="text-teal-500 text-sm font-medium hover:text-teal-600 transition-colors">
              See More
            </button>
          </div>
          
          {/* Doctor Profile */}
          <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="w-12 h-12 md:w-16 md:h-16 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
              <img 
                src={upcomingAppointment.avatar} 
                alt={upcomingAppointment.doctorName} 
                className="w-full h-full object-cover" 
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-base sm:text-lg truncate">
                {upcomingAppointment.doctorName}
              </h3>
              <p className="text-sm text-gray-500">{upcomingAppointment.specialty}</p>
              {upcomingAppointment.status && (
                <div
                  className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                    upcomingAppointment.status === "CONFIRMED"
                      ? "bg-green-100 text-green-700"
                      : upcomingAppointment.status === "PENDING"
                      ? "bg-yellow-100 text-yellow-700"
                      : upcomingAppointment.status === "REQUESTED"
                      ? "bg-blue-100 text-blue-700"
                      : upcomingAppointment.status === "SCHEDULED"
                      ? "bg-teal-100 text-teal-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {upcomingAppointment.status}
                </div>
              )}
            </div>
          </div>

          {/* Date and Time - Mobile: Stacked, Desktop: Side by side */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 mb-4 sm:mb-6">
            <div className="flex items-center gap-2 text-gray-700">
              <Calendar className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Date</p>
                <p className="text-sm font-medium text-gray-900">{upcomingAppointment.date}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-gray-700">
              <Clock className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Time</p>
                <p className="text-sm font-medium text-gray-900">{upcomingAppointment.time}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                       
            {canCancel && (
              <Button 
                variant="outline"
                className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                onClick={() => setShowCancelModal(true)}
                disabled={loading}
              >
                Cancel
              </Button>
            )}
            
            <Button 
              className="flex-1"
              onClick={handleViewProfile}
              disabled={loading}
            >
              View Profile
            </Button>
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <CancelModal
          appointment={upcomingAppointment}
          onClose={() => setShowCancelModal(false)}
          onConfirm={handleCancelConfirm}
          loading={loading}
        />
      )}
    </>
  );
}


export const InfoCard = ({
  title,
  children,
  className = "",
  headerAction = null,
  isProfile = false,
}) => (
  <div
    className={` ${
      !isProfile
        ? "bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
        : ""
    } ${className}`}
  >
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold text-secondary">{title}</h3>
      {headerAction}
    </div>
    {children}
  </div>
);

export  const CertificatesList = ({ certificates }) => {
    // Function to extract filename from the full path
    const extractFilename = (fullPath) => {
      if (!fullPath) return "";

      // Split by '/' and get the last part
      const parts = fullPath.split("/");
      const filename = parts[parts.length - 1];

      // Remove the timestamp prefix (everything before the first '-')
      const dashIndex = filename.indexOf("-");
      if (dashIndex !== -1) {
        return filename.substring(dashIndex + 1);
      }

      return filename;
    };

    // Function to handle certificate click
    const handleCertificateClick = (cert) => {
      const url = cert.url || cert.name;
      if (url) {
        window.open(url, "_blank");
      }
    };

    return (
      <div className="space-y-3">
        {certificates && certificates.length > 0 ? (
          certificates.map((cert, index) => (
            <div key={index} className="group">
              <p className="text-sm text-secondary/80 mb-2">
                Certificate {index + 1}
              </p>
              <div
                className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg group-hover:border-primary/30 transition-colors cursor-pointer hover:bg-gray-50"
                onClick={() => handleCertificateClick(cert)}
              >
                <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-sm text-secondary">
                  {extractFilename(cert.name) || `Certificate ${index + 1}`}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-secondary/60">
              No certificates uploaded yet
            </p>
          </div>
        )}
      </div>
    );
  };
