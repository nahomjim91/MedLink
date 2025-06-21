"use client";
import React, { useState } from "react";
import {
  ChevronDown,
  Edit,
  FileText,
  Star,
  User,
  X,
  DownloadX,
  Download,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import ProfileImage from "../../components/ui/ProfileImage";
import { useAuth } from "../../hooks/useAuth";
import EditProfileModal from "./EditProfileModal";

export default function PatientProfile() {
  const { user } = useAuth();
  const [showEditModal, setShowEditModal] = useState(false); 
  const [showManageSharing, setShowManageSharing] = useState(false);
  const [permissions, setPermissions] = useState({
    duringMeeting: "Allow",
    afterMeeting: "Allow",
  });
  const birthDate = user.dob ? new Date(user.dob) : null;
  const age = birthDate
    ? new Date().getFullYear() - birthDate.getFullYear()
    : "";

  const formatDate = (timestamp) => {
    console.log("Timestamp:", timestamp);
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short", // or "long" if you prefer full month name
      year: "numeric",
    });
  };

  const files = Array(7)
    .fill(null)
    .map((_, index) => ({
      id: index + 1,
      name: "123123.png",
      appointmentNo: "#123456",
    }));

  const accessList = Array(4)
    .fill(null)
    .map((_, index) => ({
      id: index + 1,
      name: "Dr. Vinny Vang",
      rating: 5.0,
      specialty: "Dentist",
    }));

  const handleRemoveFile = (fileId) => {
    console.log("Remove file:", fileId);
  };

  const handleRemoveAccess = (accessId) => {
    console.log("Remove access:", accessId);
  };

  const handleViewFile = (fileId) => {
    console.log("View file:", fileId);
  };

   const handleProfileUpdateSuccess = (updatedData) => {
    console.log("Profile updated successfully:", updatedData);
    setShowEditModal(false);
    
    alert("Profile updated successfully!");
  };

  const capitalize = (str) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : "";
  const ProfileInfo = () => (
    <div className="bg-none md:h-[86vh] md:bg-white rounded-lg md:shadow-sm p-3 ">
      <div className="flex flex-col items-center mb-6">
        <ProfileImage
          profileImageUrl=""
          altText="Patient"
          userName={user.firstName.toUpperCase()}
        />
        <h2 className="text-xl font-semibold text-secondary mb-2">
          {user.gender.toLowerCase() === "m" ? "Mr. " : "Mrs. "}
          {capitalize(user.firstName) + " " + capitalize(user.lastName)}
        </h2>
        <button
          className="flex items-center text-teal-600 hover:text-teal-700 transition-colors"
         onClick={() => setShowEditModal(true)}

        >
          <span className="mr-2">Edit</span>
          <Edit size={16} />
        </button>
      </div>

      <div className="flex justify-center gap-4 mb-6">
        <div className="bg-gray-100 px-4 py-2 rounded-full text-sm text-gray-600">
          {age} Years
        </div>
        <div className="bg-teal-100 px-4 py-2 rounded-full text-sm text-teal-700 flex items-center">
          <User size={16} className="mr-2" />
          {user.gender.toLowerCase() === "m" ? "Male" : "Female"}
        </div>
        <div className="bg-teal-100 px-4 py-2 rounded-full text-sm text-teal-700 flex items-center">
          <div className="w-3 h-3 mr-2">💧</div>
          {user.patientProfile.bloodType}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-secondary mb-4">Information</h3>

        <div className="grid grid-cols-1 gap-4">
          <div className="flex justify-between">
            <span className="text-gray-600">Name</span>
            <span className="text-secondary bg-gray-50 px-3 py-1 rounded">
              {user.firstName} {user.lastName}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Phone No.</span>
            <span className="text-secondary bg-gray-50 px-3 py-1 rounded">
              {user.phoneNumber}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600">Registered Date</span>
            <span className="text-secondary bg-gray-50 px-3 py-1 rounded">
              {formatDate(user.createdAt)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Appointment</span>
            <span className="text-secondary bg-gray-50 px-3 py-1 rounded">
              32
            </span>
          </div>
          <div className="md:hidden">
            <GeneralInfo />
          </div>
        </div>
      </div>
    </div>
  );

  const GeneralInfo = () => (
    <div className="bg-none md:bg-white rounded-lg md:shadow-sm md:p-3 mb-3">
      <h3 className="font-semibold text-secondary mb-4">General Info</h3>
      <div className="space-y-4">
        <div className="flex justify-between">
          <span className="text-gray-600">Blood Type</span>
          <span className="text-gray-500">{user.patientProfile.bloodType}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Wight</span>
          <span className="text-gray-500">
            {user.patientProfile.weight} (kg)
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Height</span>
          <span className="text-gray-500">
            {user.patientProfile.height} (cm)
          </span>
        </div>
      </div>
    </div>
  );

  const ResponsiveFilesSection = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const filesPerPage = 6; // Show 5 files per page on desktop

    // Sample files data - increased to 15 for better pagination demo
    const files = Array.from({ length: 15 }, (_, i) => ({
      id: i + 1,
      name: `document${i + 1}.png`,
      appointmentNo: `#${123456 + i}`,
    }));

    // Calculate pagination
    const totalPages = Math.ceil(files.length / filesPerPage);
    const startIndex = (currentPage - 1) * filesPerPage;
    const endIndex = startIndex + filesPerPage;
    const currentFiles = files.slice(startIndex, endIndex);

    const handleViewFile = (id) => {
      console.log("View file:", id);
    };

    const handleRemoveFile = (id) => {
      console.log("Remove file:", id);
    };

    const handleDownloadFile = (id) => {
      console.log("Download file:", id);
    };

    const handlePreviousPage = () => {
      setCurrentPage((prev) => Math.max(1, prev - 1));
    };

    const handleNextPage = () => {
      setCurrentPage((prev) => Math.min(totalPages, prev + 1));
    };

    return (
      <div className="bg-none md:bg-white rounded-lg md:shadow-sm p-3 md:py-4 ">
        {/* Desktop Table View - Hidden on mobile */}
        <div className="hidden lg:block overflow-x-auto py-2">
          <table className="w-full">
            <thead>
              <tr className="bg-teal-50">
                <th className="text-left py-3  font-medium text-gray-700">
                  File Name
                </th>
                <th className="text-left py-3  font-medium text-gray-700">
                  Appointment No
                </th>
                <th className="text-center py-3  font-medium text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {currentFiles.map((file) => (
                <tr key={file.id} className="border-b border-gray-100">
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      <FileText size={16} className="text-teal-600 mr-2" />
                      <span className="text-gray-700">{file.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {file.appointmentNo}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => handleViewFile(file.id)}
                        className="bg-teal-500 text-white px-4 py-1 rounded-xl text-sm hover:bg-teal-600 transition-colors"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleRemoveFile(file.id)}
                        className="bg-red-500 text-white px-4 py-1 rounded-xl text-sm hover:bg-red-600 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile/Tablet Card View - Shown on smaller screens */}
        <div className="h-[50vh] overflow-y-auto lg:hidden">
          <div className="lg:hidden grid grid-cols-2 md:grid-cols-3 gap-4">
            {files.map((file) => (
              <div
                key={file.id}
                className="bg-gray-50 rounded-lg p-2 relative border border-gray-200 hover:shadow-md transition-shadow"
              >
                {/* Delete button - positioned at top right */}
                <button
                  onClick={() => handleRemoveFile(file.id)}
                  className="absolute top-2 right-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full p-1 transition-colors"
                  aria-label="Delete file"
                >
                  <X size={16} />
                </button>

                {/* File icon and content */}
                <div className="flex flex-col items-center text-center">
                  <div className="bg-teal-100 rounded-lg p-2 mb-3">
                    <FileText size={32} className="text-teal-600" />
                  </div>

                  <h4 className="text-sm font-medium text-secondary mb-1 truncate w-full">
                    {file.name}
                  </h4>

                  <p className="text-xs text-gray-500 mb-3">
                    {file.appointmentNo}
                  </p>

                  {/* Download button */}
                  <button
                    onClick={() => handleDownloadFile(file.id)}
                    className="bg-teal-500 text-white p-2 rounded-full hover:bg-teal-600 transition-colors"
                    aria-label="Download file"
                  >
                    <Download size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pagination - only shown on desktop */}
        <div className="hidden lg:flex justify-between items-center mt-4">
          <button
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            className="bg-teal-500 text-white px-4 py-2 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-teal-600 transition-colors"
          >
            Previous
          </button>
          <span className="text-gray-600">
            Page {currentPage} of {totalPages} ({files.length} total files)
          </span>
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="bg-teal-500 text-white px-4 py-2 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-teal-600 transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  const ManageSharingSettings = () => (
    <div className=" bg-none md:bg-white rounded-lg md:shadow-sm p-3">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-secondary">
          Manage Sharing Settings
        </h3>
        <button
          onClick={() => setShowManageSharing(false)}
          className="lg:hidden text-gray-500 hover:text-gray-700"
        >
          <X size={20} />
        </button>
      </div>

      <div className="mb-6">
        <h4 className="font-medium text-secondary/80 mb-4">Permission</h4>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">
              Allow file access during meeting
            </span>
            <div className="relative">
              <select
                value={permissions.duringMeeting}
                onChange={(e) =>
                  setPermissions({
                    ...permissions,
                    duringMeeting: e.target.value,
                  })
                }
                className="appearance-none text-primary border border-primary/40 px-4 py-2 pr-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="Allow">Allow</option>
                <option value="Deny">Deny</option>
              </select>
              <ChevronDown
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white"
                size={16}
              />
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-600">
              Allow file access after meeting
            </span>
            <div className="relative">
              <select
                value={permissions.afterMeeting}
                onChange={(e) =>
                  setPermissions({
                    ...permissions,
                    afterMeeting: e.target.value,
                  })
                }
                className="appearance-none text-primary border border-primary/40 px-4 py-2 pr-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="Allow">Allow</option>
                <option value="Deny">Deny</option>
              </select>
              <ChevronDown
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white"
                size={16}
              />
            </div>
          </div>
        </div>
      </div>

      <div>
        <h4 className="font-medium text-gray-700 mb-4">
          Currently Who have access
        </h4>
        <div className="h-[48vh] overflow-y-auto">
          <div className="space-y-2">
            {accessList.map((person) => (
              <div
                key={person.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/50 to-primary flex items-center justify-center mr-3 overflow-hidden">
                    <img
                      src="/api/placeholder/40/40"
                      alt="Doctor"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-medium text-secondary">{person.name}</p>
                    <div className="flex items-center">
                      <Star className="text-teal-500 fill-current" size={14} />
                      <span className="text-sm text-teal-600 ml-1">
                        {person.rating}
                      </span>
                      <span className="text-sm text-gray-500 ml-2">
                        {person.specialty}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveAccess(person.id)}
                  className="bg-red-500 text-white px-4 py-1 rounded-xl text-sm hover:bg-red-600 transition-colors"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Mobile view
  if (showManageSharing && window.innerWidth < 1024) {
    return (
      <div className=" p-4">
        <ManageSharingSettings />
      </div>
    );
  }

  return (
    <div className="">
      {/* Mobile View */}
      <div className="lg:hidden p-4">
        <ProfileInfo />

        <div className="flex justify-between items-center ">
          <h2 className="text-lg font-semibold px-2">Your File</h2>
          <Button
            onClick={() => setShowManageSharing(true)}
            className="bg-teal-500 text-white py-2  hover:bg-teal-600 transition-colors"
          >
            Manage Sharing
          </Button>
        </div>
        <ResponsiveFilesSection />
      </div>

      {/* Desktop View */}
      <div className="hidden lg:block p-3">
        <div className="grid grid-cols-12 gap-3">
          {/* Left Column - Profile Info */}
          <div className="col-span-4">
            <ProfileInfo />
          </div>

          {/* Middle Column - General Info & Files */}
          <div className="col-span-5">
            <GeneralInfo />
            <ResponsiveFilesSection />
          </div>

          {/* Right Column - Manage Sharing */}
          <div className="col-span-3">
            <ManageSharingSettings />
          </div>
        </div>
      </div>
        {/* Edit Profile Modal */}
        <EditProfileModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          user={user}
          onSuccess={handleProfileUpdateSuccess}
        />
    </div>
  );
}
