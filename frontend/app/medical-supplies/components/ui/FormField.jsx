import React from 'react';
import { MapPin, FileText, Star } from 'lucide-react';

// Base form field component that other components will extend
const FormField = ({ label, children, className = '' , bigSize  }) => {
  return (
    <div className={`flex flex-col md:flex-row items-start md:items-center w-full mb-4 ${className}`}>
      <label className={`text-gray-800 font-medium text-base  ${!bigSize ? 'md:w-1/2' : 'md:w-1/4'} mb-1 md:mb-0`}>
        {label}
      </label>
      <div className={`${!bigSize ? 'md:w-1/2' : 'md:w-3/4'} w-full`}>
        {children}
      </div>
    </div>
  );
};

// Text field with optional icon
export const TextField = ({ label, value, icon: Icon, iconColor = "text-primary" , bigSize = true }) => {
  return (
    <FormField label={label} bigSize={bigSize}>
      <div className="bg-gray-50 rounded-lg p-3 flex items-center">
        {Icon && <Icon className={`mr-2 ${iconColor}`} size={20} />}
        <span className="text-gray-500">{value}</span>
      </div>
    </FormField>
  );
};

// File field with icon
export const FileField = ({ label, fileName, fileType }) => {
  return (
    <FormField label={label}>
      <div className="bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-between">
        <FileText className="text-green-500 mr-2" size={20} />
        <span className="text-gray-500 flex-grow">{fileName}</span>
      </div>
    </FormField>
  );
};

export const Rating = ({ label, value, showValue = true, maxStars = 5 }) => {
  // Ensure value is between 0 and maxStars
  const ratingValue = Math.max(0, Math.min(maxStars, value));
  
  // Generate array of star indices
  const stars = Array.from({ length: maxStars }, (_, i) => i + 1);
  
  return (
      <div className="flex items-center bg-gray-50 rounded-lg p-3">
        <div className="flex items-center">
          {stars.map((star) => {
            // Full star
            if (star <= Math.floor(ratingValue)) {
              return (
                <Star 
                  key={star}
                  className="text-primary/60 fill-primary" 
                  size={18}
                />
              );
            }
            // Half star
            else if (star <= ratingValue + 0.5) {
              return (
                <div key={star} className="relative">
                  {/* Empty star as background */}
                  <Star className="text-primary/60" size={18} />
                  {/* Half-filled star (clipped) */}
                  <div className="absolute inset-0 overflow-hidden w-1/2">
                    <Star className="text-primary/60 fill-primary" size={18} />
                  </div>
                </div>
              );
            }
            // Empty star
            else {
              return <Star key={star} className="text-primary/60" size={18} />;
            }
          })}
        </div>
        
        {showValue && (
          <span className="ml-2 text-base font-bold">{ratingValue.toFixed(1)}</span>
        )}
      </div>
  );
};
