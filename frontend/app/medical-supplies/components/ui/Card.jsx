"use client";
import React from "react";

export default function IconCard({
  icon,
  label,
  onClick,
  isSelected,
  isLarge = false,
}) {
  // Clone the icon element with modified props for dynamic color
  const iconWithDynamicColor = React.cloneElement(icon, {
    color: isSelected ? "#20c997" : "#6B7280",
  });

  return (
    <div
      className={`flex flex-col items-center cursor-pointer transition-all ${
        isSelected ? "scale-105" : "hover:scale-105"
      }`}
      onClick={onClick}
    >
      <div
        className={`${
          isLarge ? "w-56 h-60" : " w-28 h-28 md:w-48 md:h-32"
        } bg-white rounded-xl shadow-md flex items-center justify-center mb-2 ${
          isSelected
            ? "border-2 border-primary bg-primary/5"
            : "border border-gray-200"
        }`}
      >
        {iconWithDynamicColor}
      </div>
      <span className="text-gray-800 font-medium text-lg">{label}</span>
    </div>
  );
}
