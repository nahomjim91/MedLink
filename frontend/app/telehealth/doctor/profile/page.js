// frontend/app/telehealth/doctor/profile/page.js
"use client";
import React, { useState, useEffect, useMemo } from "react";
import {
  Star,
  ThumbsUp,
  ThumbsDown,
  FileText,
  User,
  Save,
  PenIcon,
  XCircleIcon,
  CheckCircle,
  AlertCircle,
  Loader2,
  Plus,
  X,
} from "lucide-react";
import ProfileImage from "../../components/ui/ProfileImage";
import { Rating } from "../../components/ui/Input";
import { useAuth } from "../../hooks/useAuth";
import { useProfileUpdate } from "../../hooks/useProfileUpdate";

// Success/Error notification component
const NotificationBanner = ({ type, message, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (type === "success" && message) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onClose(), 300);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [type, message, onClose]);

  if (!message || !isVisible) return null;

  const isSuccess = type === "success";

  return (
    <div
      className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-md transition-opacity duration-300 ${
        isVisible ? "opacity-100" : "opacity-0"
      } ${
        isSuccess
          ? "bg-green-50 border border-green-200"
          : "bg-red-50 border border-red-200"
      }`}
    >
      <div className="flex items-center gap-3">
        {isSuccess ? (
          <CheckCircle className="w-5 h-5 text-green-600" />
        ) : (
          <AlertCircle className="w-5 h-5 text-red-600" />
        )}
        <p
          className={`text-sm font-medium ${
            isSuccess ? "text-green-800" : "text-red-800"
          }`}
        >
          {message}
        </p>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(() => onClose(), 300);
          }}
          className={`ml-auto ${
            isSuccess
              ? "text-green-600 hover:text-green-800"
              : "text-red-600 hover:text-red-800"
          }`}
        >
          <XCircleIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Specialized component for handling specialization array
const SpecializationEditor = ({ value = [], onChange, isEditing, className = "" }) => {
  const [inputValue, setInputValue] = useState("");
  
  const specializations = Array.isArray(value) ? value : [];

  const addSpecialization = () => {
    if (inputValue.trim() && !specializations.includes(inputValue.trim())) {
      const newSpecs = [...specializations, inputValue.trim()];
      onChange(newSpecs);
      setInputValue("");
    }
  };

  const removeSpecialization = (index) => {
    const newSpecs = specializations.filter((_, i) => i !== index);
    onChange(newSpecs);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSpecialization();
    }
  };

  if (!isEditing) {
    return (
      <span className={className}>
        {specializations.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {specializations.map((spec, index) => (
              <span
                key={index}
                className="inline-block bg-primary/10 text-primary px-2 py-1 rounded-md text-xs"
              >
                {spec}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-gray-400 italic">Not specified</span>
        )}
      </span>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Display current specializations */}
      {specializations.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {specializations.map((spec, index) => (
            <div
              key={index}
              className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md text-sm"
            >
              <span>{spec}</span>
              <button
                type="button"
                onClick={() => removeSpecialization(index)}
                className="text-primary hover:text-primary/70"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      
      {/* Input for new specialization */}
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Add specialization (e.g., Cardiology)"
          className="flex-1 p-2 border border-secondary/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-none text-sm"
        />
        <button
          type="button"
          onClick={addSpecialization}
          disabled={!inputValue.trim()}
          className="px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Enhanced EditableField component
const EditableField = ({
  value,
  field,
  multiline = false,
  className = "",
  isEditable = false,
  isEditing,
  onInputChange,
  placeholder = "",
  inputType = "text",
  isSpecialization = false,
}) => {
  if (isEditing && isEditable) {
    if (isSpecialization) {
      return (
        <SpecializationEditor
          value={value}
          onChange={(newValue) => onInputChange(field, newValue)}
          isEditing={isEditing}
          className={className}
        />
      );
    }
    
    if (multiline) {
      return (
        <textarea
          value={value || ""}
          onChange={(e) => onInputChange(field, e.target.value)}
          className={`w-full p-2 border border-secondary/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-none min-h-[100px] resize-none ${className}`}
          rows={4}
          placeholder={placeholder}
        />
      );
    }
    
    return (
      <input
        type={inputType}
        value={value || ""}
        onChange={(e) => {
          let newValue = e.target.value;
          // Handle number inputs
          if (inputType === "number") {
            newValue = newValue === "" ? "" : parseFloat(newValue) || 0;
          }
          onInputChange(field, newValue);
        }}
        className={`w-full p-2 border border-secondary/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-none ${className}`}
        placeholder={placeholder}
        step={inputType === "number" ? "0.01" : undefined}
        min={inputType === "number" ? "0" : undefined}
      />
    );
  }

  // Display mode
  if (isSpecialization) {
    return (
      <SpecializationEditor
        value={value}
        onChange={() => {}}
        isEditing={false}
        className={className}
      />
    );
  }

  return (
    <span className={className}>
      {value || value === 0 ? (
        inputType === "number" && field === "pricePerSession" ? 
          `$${parseFloat(value).toFixed(2)}` : 
          value
      ) : (
        <span className="text-gray-400 italic">Not specified</span>
      )}
    </span>
  );
};

const InformationRow = ({
  label,
  value,
  field,
  isEditable = false,
  isEditing,
  onInputChange,
  className = "",
  inputType = "text",
  isSpecialization = false,
}) => (
  <div
    className={`flex ${
      isEditing && isEditable
        ? "flex-col gap-1"
        : "justify-between items-center"
    } ${className}`}
  >
    <div className="text-secondary/80 text-sm font-medium">{label}</div>
    <EditableField
      inputType={inputType}
      isEditable={isEditable}
      value={value}
      field={field}
      isEditing={isEditing}
      onInputChange={onInputChange}
      className="text-secondary text-sm"
      isSpecialization={isSpecialization}
    />
  </div>
);

const ProfileHeader = ({
  doctorData,
  isEditing,
  onEditClick,
  onSave,
  onCancel,
  averageRating,
  isUpdating,
  hasChanges,
  isMobile = false,
}) => (
  <div className="flex flex-col justify-center items-center gap-4">
    <ProfileImage
      imageUrl={doctorData.profileImageUrl || doctorData.photoURL}
      altText="Profile"
      isEditing={isEditing}
      userName={doctorData.firstName}
    />

    <div className="text-center">
      <h1 className="text-2xl lg:text-3xl font-bold text-secondary mb-2">
        {doctorData.firstName} {doctorData.lastName}
      </h1>

      <div className="flex justify-center">
        {isEditing ? (
          <div className="flex gap-4">
            <button
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                hasChanges && !isUpdating
                  ? "text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/20"
                  : "text-gray-400 bg-gray-100 cursor-not-allowed"
              }`}
              onClick={onSave}
              disabled={!hasChanges || isUpdating}
            >
              {isUpdating ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              {isUpdating ? "Saving..." : "Save Changes"}
            </button>
            <button
              className="flex items-center gap-2 text-red-600 hover:text-red-700 transition-colors px-4 py-2 rounded-lg bg-red-50 disabled:opacity-50"
              onClick={onCancel}
              disabled={isUpdating}
            >
              <XCircleIcon size={18} /> Cancel
            </button>
          </div>
        ) : (
          <button
            className="flex items-center gap-2 text-secondary hover:text-primary transition-colors px-4 py-2 rounded-lg bg-gray-50 hover:bg-primary/10"
            onClick={onEditClick}
          >
            <PenIcon size={18} /> Edit Profile
          </button>
        )}
      </div>
    </div>

    {/* Stats Pills */}
    <div className="flex flex-wrap justify-center gap-2 mt-4">
      {doctorData.age && (
        <div className="flex items-center gap-2 py-2 px-4 bg-white rounded-full shadow-sm">
          <span className="text-sm font-medium">{doctorData.age} years</span>
        </div>
      )}
      {doctorData.gender && (
        <div className="flex items-center gap-2 py-2 px-4 bg-white rounded-full shadow-sm">
          <User className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">
            {doctorData.gender?.toLowerCase() === "m" ? "Male" : "Female"}
          </span>
        </div>
      )}
      <div className="flex items-center gap-2 py-2 px-4 bg-white rounded-full shadow-sm">
        <Star className="w-4 h-4 text-primary fill-current" />
        <span className="text-sm font-medium">{averageRating || "0.0"}</span>
      </div>
      {doctorData.experienceYears && (
        <div className="flex items-center gap-2 py-2 px-4 bg-white rounded-full shadow-sm">
          <span className="text-sm font-medium">
            {doctorData.experienceYears}+ years
          </span>
        </div>
      )}
      {doctorData.pricePerSession > 0 && (
        <div className="flex items-center gap-2 py-2 px-4 bg-white rounded-full shadow-sm">
          <span className="text-sm font-medium">
            ${parseFloat(doctorData.pricePerSession).toFixed(2)}/session
          </span>
        </div>
      )}
    </div>
  </div>
);

const InfoCard = ({
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

const ReviewCard = ({ review }) => (
  <div className="border border-gray-100 rounded-xl p-4 hover:shadow-sm transition-shadow">
    <div className="flex items-center gap-2 mb-3">
      <Rating value={review.rating} />
    </div>
    <p className="text-gray-900 font-medium mb-2 leading-relaxed">
      {review.comment}
    </p>
    <p className="text-sm text-gray-500 mb-4">{review.date}</p>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
          <img
            src={review.avatar}
            alt={review.name}
            className="w-full h-full object-cover"
          />
        </div>
        <span className="text-sm font-medium text-gray-900">{review.name}</span>
      </div>
      <div className="flex items-center gap-3">
        <button className="flex items-center gap-1 text-primary/60 hover:text-primary transition-colors">
          <ThumbsUp className="w-4 h-4" />
          <span className="text-sm">{review.likes}</span>
        </button>
        <button className="text-gray-400 hover:text-gray-600 transition-colors">
          <ThumbsDown className="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
);

const CertificatesList = ({ certificates }) => (
  <div className="space-y-3">
    {certificates && certificates.length > 0 ? (
      certificates.map((cert, index) => (
        <div key={index} className="group">
          <p className="text-sm text-secondary/80 mb-2">
            Certificate {index + 1}
          </p>
          <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg group-hover:border-primary/30 transition-colors">
            <FileText className="w-5 h-5 text-primary flex-shrink-0" />
            <span className="text-sm text-secondary">
              {cert.name || `Certificate ${index + 1}`}
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

export default function ProfilePage() {
  const { user } = useAuth();
  const [notification, setNotification] = useState({ type: "", message: "" });
  const [saveResult, setSaveResult] = useState(null);

  // Memoize initial data to prevent unnecessary re-renders
  const initialData = useMemo(() => {
    if (!user) return {};

    const birthDate = user.dob ? new Date(user.dob) : null;
    const age = birthDate
      ? new Date().getFullYear() - birthDate.getFullYear()
      : "";
    
    return {
      // User fields
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      phoneNumber: user.phoneNumber || "",
      gender: user.gender || "",
      dob: user.dob || "",
      profileImageUrl: user.profileImageUrl || user.photoURL || "",

      // Doctor profile fields - FIXED: Ensure pricePerSession is properly handled
      displayName:
        user.doctorProfile?.displayName || `${user.firstName} ${user.lastName}`,
      specialization: Array.isArray(user.doctorProfile?.specialization) 
        ? user.doctorProfile.specialization 
        : user.doctorProfile?.specialization 
          ? [user.doctorProfile.specialization]
          : [],
      experienceYears: user.doctorProfile?.experienceYears || "",
      aboutMe: user.doctorProfile?.aboutMe || "",
      certificates: user.doctorProfile?.certificates || [],
      pricePerSession: user.doctorProfile?.pricePerSession || 0,

      // Computed fields for display
      age: age,
      isApproved: user.doctorProfile?.isApproved || false,
      averageRating: user.doctorProfile?.averageRating || 0,
    };
  }, [user]);

//   console.log("initialData: ", initialData);

  // Initialize the hook
  const {
    isEditing,
    formData,
    hasChanges,
    loading,
    error,
    handleInputChange,
    handleArrayFieldChange,
    handleSave,
    handleCancel,
    handleEdit,
    updateFormData,
  } = useProfileUpdate(user?.role.toUpperCase() || "DOCTOR", initialData);

  // Update form data when user changes
  useEffect(() => {
    if (user && Object.keys(initialData).length > 0) {
      updateFormData(initialData);
    }
  }, [user?.id, initialData, updateFormData]);

  // Handle save with notifications
  const handleSaveWithNotification = async () => {
    try {
      const result = await handleSave();
      setSaveResult(result);

      if (result.success) {
        setNotification({
          type: "success",
          message: "Profile updated successfully!",
        });
      } else {
        setNotification({
          type: "error",
          message: result.error || "Failed to update profile",
        });
      }
    } catch (err) {
      setNotification({
        type: "error",
        message: "An unexpected error occurred",
      });
    }
  };

  // Handle GraphQL errors
  useEffect(() => {
    if (error) {
      setNotification({
        type: "error",
        message: error.message || "Failed to update profile",
      });
    }
  }, [error]);

  // Placeholder reviews data
  const [reviews] = useState([
    {
      id: 1,
      name: "Darrell Steward",
      rating: 5,
      comment:
        "This is amazing product I have ever used. Highly recommended for everyone.",
      date: "July 2, 2020 03:29 PM",
      likes: 128,
      avatar: "/api/placeholder/40/40",
    },
    {
      id: 2,
      name: "John Smith",
      rating: 4,
      comment:
        "Great doctor, very professional and caring. The consultation was thorough.",
      date: "June 15, 2025 02:15 PM",
      likes: 95,
      avatar: "/api/placeholder/40/40",
    },
    {
      id: 3,
      name: "Sarah Johnson",
      rating: 5,
      comment:
        "Highly recommend! Very knowledgeable and patient with all my questions.",
      date: "June 10, 2025 11:30 AM",
      likes: 156,
      avatar: "/api/placeholder/40/40",
    },
  ]);

  // Calculate average rating
  const averageRating =
    reviews.length > 0
      ? (
          reviews.reduce((sum, review) => sum + review.rating, 0) /
          reviews.length
        ).toFixed(1)
      : formData.averageRating || 0;

  // Clear notifications
  const clearNotification = () => {
    setNotification({ type: "", message: "" });
  };

  // Show loading state if user data is not available
  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-pulse">
          <div className="text-lg text-secondary/60">Loading profile...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Notification Banners */}
      <NotificationBanner
        type={notification.type}
        message={notification.message}
        onClose={clearNotification}
      />

      <div className="max-w-7xl mx-auto">
        {/* Profile Header - Always visible */}
        <div className="mb-3">
          <InfoCard title="" className="text-center" isProfile={true}>
            <ProfileHeader
              doctorData={formData}
              isEditing={isEditing}
              onEditClick={handleEdit}
              onSave={handleSaveWithNotification}
              onCancel={handleCancel}
              averageRating={averageRating}
              isUpdating={loading}
              hasChanges={hasChanges}
            />
          </InfoCard>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Left Column - Contact Info & General Info */}
          <div className="space-y-6">
            {/* Contact Information */}
            <InfoCard title="Contact Information">
              <div className="space-y-4">
                {isEditing ? (
                  <div className="space-y-4">
                    <InformationRow
                      label="First Name"
                      value={formData.firstName}
                      field="firstName"
                      isEditable={true}
                      isEditing={isEditing}
                      onInputChange={handleInputChange}
                    />
                    <InformationRow
                      label="Last Name"
                      value={formData.lastName}
                      field="lastName"
                      isEditable={true}
                      isEditing={isEditing}
                      onInputChange={handleInputChange}
                    />
                  </div>
                ) : (
                  <InformationRow
                    label="Full Name"
                    value={`${formData.firstName} ${formData.lastName}`}
                    field="displayName"
                    isEditable={false}
                    isEditing={isEditing}
                    onInputChange={handleInputChange}
                  />
                )}
                <InformationRow
                  label="Phone Number"
                  value={formData.phoneNumber}
                  field="phoneNumber"
                  isEditable={true}
                  isEditing={isEditing}
                  onInputChange={handleInputChange}
                />
                <InformationRow
                  label="Email Address"
                  value={user.email}
                  field="email"
                  isEditable={false}
                  isEditing={isEditing}
                  onInputChange={handleInputChange}
                />
              </div>
            </InfoCard>

            {/* Professional Details */}
            <InfoCard title="Professional Details">
              <div className="space-y-4">
                <InformationRow
                  label="Experience (Years)"
                  value={formData.experienceYears}
                  field="experienceYears"
                  isEditable={true}
                  isEditing={isEditing}
                  onInputChange={handleInputChange}
                  inputType="number"
                />
                <InformationRow
                  label="Specialization"
                  value={formData.specialization}
                  field="specialization"
                  isEditable={true}
                  isEditing={isEditing}
                  onInputChange={handleInputChange}
                  isSpecialization={true}
                />
                <div className="flex justify-between items-center">
                  <span className="text-secondary/80 text-sm font-medium">
                    Status
                  </span>
                  <span
                    className={`text-sm px-3 py-1 rounded-full font-medium ${
                      formData.isApproved
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {formData.isApproved ? "Approved" : "Pending"}
                  </span>
                </div>
                <InformationRow
                  label="Gender"
                  value={
                    formData.gender?.toLowerCase() === "m" ? "Male" : 
                    formData.gender?.toLowerCase() === "f" ? "Female" : 
                    formData.gender
                  }
                  field="gender"
                  isEditable={false}
                  isEditing={isEditing}
                  onInputChange={handleInputChange}
                />
                <InformationRow
                  label="Price Per Session"
                  value={formData.pricePerSession}
                  field="pricePerSession"
                  isEditable={true}
                  isEditing={isEditing}
                  onInputChange={handleInputChange}
                  inputType="number"
                />
              </div>
            </InfoCard>
          </div>

          {/* Middle Column - About Me */}
          <div className="space-y-6">
            <InfoCard title="About Me">
              <div className="text-secondary/80 text-sm leading-relaxed">
                <EditableField
                  value={formData.aboutMe}
                  field="aboutMe"
                  multiline={true}
                  isEditable={true}
                  isEditing={isEditing}
                  onInputChange={handleInputChange}
                  className="text-secondary/80 text-sm leading-relaxed"
                  placeholder="Tell patients about yourself, your experience, and what makes you unique as a healthcare provider..."
                />
                {!isEditing &&
                  formData.aboutMe &&
                  formData.aboutMe.length > 200 && (
                    <button className="text-primary hover:text-primary/80 mt-3 text-sm font-medium transition-colors">
                      Read More...
                    </button>
                  )}
                {!formData.aboutMe && !isEditing && (
                  <div className="text-center py-8">
                    <div className="text-secondary/40 italic">
                      No description available. Click &quot;Edit Profile&quot;
                      to add information about yourself.
                    </div>
                  </div>
                )}
              </div>
            </InfoCard>

            {/* Certificates */}
            <InfoCard title="Certificates & Qualifications">
              <CertificatesList certificates={formData.certificates} />
            </InfoCard>
          </div>

          {/* Right Column - Reviews */}
          <div className="space-y-6">
            <InfoCard
              title="Patient Reviews"
              headerAction={
                <div className="flex items-center gap-2">
                  <Rating value={averageRating} />
                  <span className="text-sm text-secondary/60">
                    ({reviews.length})
                  </span>
                </div>
              }
            >
              <div className="space-y-4 max-h-96 lg:max-h-[500px] overflow-y-auto">
                {reviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>
            </InfoCard>
          </div>
        </div>
      </div>
    </div>
  );
}