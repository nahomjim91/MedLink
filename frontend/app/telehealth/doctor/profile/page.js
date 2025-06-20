"use client";
import React, { useState, useEffect } from "react";
import {
  Star,
  ThumbsUp,
  ThumbsDown,
  FileText,
  User,
  Save,
  PenIcon,
  XCircleIcon,
} from "lucide-react";
import ProfileImage from "../../components/ui/ProfileImage";
import { Rating } from "../../components/ui/Input";
import { useAuth } from "../../../../hooks/useAuth";

// Reusable components
const EditableField = ({
  value,
  field,
  multiline = false,
  className = "",
  isEditable = false,
  isEditing,
  onInputChange,
  placeholder = "",
}) => {
  if (isEditing && isEditable) {
    return multiline ? (
      <textarea
        value={value}
        onChange={(e) => onInputChange(field, e.target.value)}
        className={`w-full p-2 border border-secondary/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-none min-h-[100px] resize-none ${className}`}
        rows={4}
        placeholder={placeholder}
      />
    ) : (
      <input
        type="text"
        value={value}
        onChange={(e) => onInputChange(field, e.target.value)}
        className={`w-full p-2 border border-secondary/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-none ${className}`}
        placeholder={placeholder}
      />
    );
  }
  return (
    <span className={className}>
      {value || <span className="text-gray-400 italic">Not specified</span>}
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
      isEditable={isEditable}
      value={value}
      field={field}
      isEditing={isEditing}
      onInputChange={onInputChange}
      className="text-secondary text-sm"
    />
  </div>
);

const ProfileHeader = ({
  doctorData,
  isEditing,
  onEditClick,
  onSave,
  averageRating,
  isMobile = false,
}) => (
  <div className="flex flex-col justify-center items-center gap-">
    <ProfileImage
      imageUrl={doctorData.photoURL}
      altText="Profile"
      isEditing={isEditing}
      userName={doctorData.name}
    />

    <div className="text-center">
      <h1 className="text-2xl lg:text-3xl font-bold text-secondary mb-2">
        {doctorData.name}
      </h1>

      <div className="flex justify-center">
        {isEditing ? (
          <div className="flex gap-4">
            <button
              className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors px-4 py-2 rounded-lg bg-primary/10"
              onClick={onSave}
            >
              <Save size={18} /> Save
            </button>
            <button
              className="flex items-center gap-2 text-red-600 hover:text-red-700 transition-colors px-4 py-2 rounded-lg bg-red-50"
              onClick={onEditClick}
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
        <div className="flex items-center gap-2 py-2 px-4 bg-white rounded-full shadow-sm ">
          <span className="text-sm font-medium">{doctorData.age} years</span>
        </div>
      )}
      {doctorData.gender && (
        <div className="flex items-center gap-2 py-2 px-4 bg-white rounded-full shadow-sm ">
          <User className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">{doctorData.gender}</span>
        </div>
      )}
      <div className="flex items-center gap-2 py-2 px-4 bg-white rounded-full shadow-sm ">
        <Star className="w-4 h-4 text-primary fill-current" />
        <span className="text-sm font-medium">{averageRating || "0.0"}</span>
      </div>
      {doctorData.experience && (
        <div className="flex items-center gap-2 py-2 px-4 bg-white rounded-full shadow-sm ">
          <span className="text-sm font-medium">{doctorData.experience}</span>
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
        ? "bg-white rounded-2xl p-4  shadow-sm border border-gray-100"
        : ""
    }  ${className}`}
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
    {certificates.length > 0 ? (
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
  const [isEditing, setIsEditing] = useState(false);
  const { user } = useAuth();

  const [doctorData, setDoctorData] = useState({
    name: "",
    age: "",
    gender: "",
    experience: "",
    patients: 0,
    perSession: "",
    phone: "",
    email: "",
    registeredDate: "",
    aboutMe: "",
    specialization: [],
    isApproved: false,
    photoURL: "",
    certificates: [],
  });

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

  // Update doctorData when user data is available
  useEffect(() => {
    if (user) {
      const birthDate = user.dob ? new Date(user.dob) : null;
      const age = birthDate
        ? new Date().getFullYear() - birthDate.getFullYear()
        : "";

      setDoctorData({
        name: user.displayName || `${user.firstName} ${user.lastName}`,
        age: age,
        gender:
          user.gender === "M"
            ? "Male"
            : user.gender === "F"
            ? "Female"
            : user.gender,
        experience: user.doctorProfile?.experienceYears
          ? `${user.doctorProfile.experienceYears}+ years`
          : "",
        patients: 0,
        perSession: "",
        phone: user.phoneNumber || "",
        email: user.email || "",
        registeredDate: "",
        aboutMe: user.doctorProfile?.aboutMe || "",
        specialization: user.doctorProfile?.specialization || [],
        isApproved: user.doctorProfile?.isApproved || false,
        photoURL: user.photoURL || "",
        certificates: user.doctorProfile?.certificates || [],
      });
    }
  }, [user]);

  const handleInputChange = (field, value) => {
    setDoctorData((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditClick = () => {
    setIsEditing(!isEditing);
  };

  const handleSave = () => {
    console.log("Saving data:", doctorData);
    setIsEditing(false);
    // TODO: Implement actual save functionality
  };

  // Calculate average rating
  const averageRating =
    reviews.length > 0
      ? (
          reviews.reduce((sum, review) => sum + review.rating, 0) /
          reviews.length
        ).toFixed(1)
      : 0;

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
      <div className="max-w-7xl mx-auto  ">
        {/* Profile Header - Always visible */}
        <div className="mb-3">
          <InfoCard title="" className="text-center" isProfile={true}>
            <ProfileHeader
              doctorData={doctorData}
              isEditing={isEditing}
              onEditClick={handleEditClick}
              onSave={handleSave}
              averageRating={averageRating}
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
                <InformationRow
                  label="Full Name"
                  value={doctorData.name}
                  field="name"
                  isEditable={true}
                  isEditing={isEditing}
                  onInputChange={handleInputChange}
                />
                <InformationRow
                  label="Phone Number"
                  value={doctorData.phone}
                  field="phone"
                  isEditable={true}
                  isEditing={isEditing}
                  onInputChange={handleInputChange}
                />
                <InformationRow
                  label="Email Address"
                  value={doctorData.email}
                  field="email"
                  isEditable={false}
                  isEditing={isEditing}
                  onInputChange={handleInputChange}
                />
              </div>
            </InfoCard>

            {/* General Information */}
            <InfoCard title="Professional Details">
              <div className="space-y-4">
                <InformationRow
                  label="Experience"
                  value={doctorData.experience}
                  field="experience"
                  isEditable={true}
                  isEditing={isEditing}
                  onInputChange={handleInputChange}
                />
                <InformationRow
                  label="Specialization"
                  value={doctorData.specialization.join(", ")}
                  field="specialization"
                  isEditable={true}
                  isEditing={isEditing}
                  onInputChange={handleInputChange}
                />
                <div className="flex justify-between items-center">
                  <span className="text-secondary/80 text-sm font-medium">
                    Status
                  </span>
                  <span
                    className={`text-sm px-3 py-1 rounded-full font-medium ${
                      doctorData.isApproved
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {doctorData.isApproved ? "Approved" : "Pending"}
                  </span>
                </div>
                <InformationRow
                  label="Rate per Session"
                  value={doctorData.perSession || "Not set"}
                  field="perSession"
                  isEditable={true}
                  isEditing={isEditing}
                  onInputChange={handleInputChange}
                />
              </div>
            </InfoCard>
          </div>

          {/* Middle Column - About Me */}
          <div className="space-y-6">
            <InfoCard title="About Me">
              <div className="text-secondary/80 text-sm leading-relaxed">
                <EditableField
                  value={doctorData.aboutMe}
                  field="aboutMe"
                  multiline={true}
                  isEditable={true}
                  isEditing={isEditing}
                  onInputChange={handleInputChange}
                  className="text-secondary/80 text-sm leading-relaxed"
                  placeholder="Tell patients about yourself, your experience, and what makes you unique as a healthcare provider..."
                />
                {!isEditing &&
                  doctorData.aboutMe &&
                  doctorData.aboutMe.length > 200 && (
                    <button className="text-primary hover:text-primary/80 mt-3 text-sm font-medium transition-colors">
                      Read More...
                    </button>
                  )}
                {!doctorData.aboutMe && !isEditing && (
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
              <CertificatesList certificates={doctorData.certificates} />
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
