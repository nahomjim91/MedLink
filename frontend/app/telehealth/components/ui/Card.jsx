'use client';
import React , { useState } from "react";

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

