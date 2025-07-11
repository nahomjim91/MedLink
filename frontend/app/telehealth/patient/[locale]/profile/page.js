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
  Eye,
} from "lucide-react";
import { Button } from "../../../components/ui/Button";
import ProfileImage from "../../../components/ui/ProfileImage";
import { useAuth } from "../../../hooks/useAuth";
import EditProfileModal from "./EditProfileModal";
import { usePrescriptionsByPatientId } from "../../../hooks/usePrescription";
import { PrescriptionViewModal } from "../../../components/ui/modal/PrescriptionModal";

export default function PatientProfile() {
  const { user, refetchUser } = useAuth();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showManageSharing, setShowManageSharing] = useState(false);
  const [showPrescriptionModalView, setShowPrescriptionModalView] =
    useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);

  const [permissions, setPermissions] = useState({
    duringMeeting: "Allow",
    afterMeeting: "Allow",
  });
  const birthDate = user.dob ? new Date(user.dob) : null;
  const age = birthDate
    ? new Date().getFullYear() - birthDate.getFullYear()
    : "";

  const formatDate = (timestamp) => {
    // console.log("Timestamp:", timestamp);
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short", // or "long" if you prefer full month name
      year: "numeric",
    });
  };

  const onClose = () => {
    setShowEditModal(false);
    refetchUser();
  };

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

  const handleProfileUpdateSuccess = (updatedData) => {
    console.log("Profile updated successfully:", updatedData);
    setShowEditModal(false);

    alert("Profile updated successfully!");
  };
  console.log("user: ", user);

  const capitalize = (str) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : "";
  const ProfileInfo = () => (
    <div className="bg-none md:h-[86vh] md:bg-white rounded-lg md:shadow-sm p-3 ">
      <div className="flex flex-col items-center mb-6">
        <ProfileImage
          profileImageUrl={user.profileImageUrl}
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
        <div className="h-[48vh] overflow-y-auto scrollbar-hide">
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

  const onClickPrescription = (prescriptionId) => {
    setSelectedPrescription(prescriptionId);
    setShowPrescriptionModalView(true);
  };

  const handleClosePrescriptionModal = () => {
    setShowPrescriptionModalView(false);
    setSelectedPrescription(null);
  };

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
        <ResponsivePrescriptionsSection
          userId={user.id}
          onClickPrescription={onClickPrescription}
        />{" "}
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
            <ResponsivePrescriptionsSection
              userId={user.id}
              onClickPrescription={onClickPrescription}
            />
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
        onClose={onClose}
        user={user}
        onSuccess={handleProfileUpdateSuccess}
      />

      {showPrescriptionModalView && (
        <PrescriptionViewModal
          isOpen={showPrescriptionModalView}
          onClose={handleClosePrescriptionModal}
          prescriptionId={selectedPrescription}
          isPatient={user.role === "patient"}
        />
      )}
    </div>
  );
}

export const ResponsivePrescriptionsSection = ({
  userId,
  onClickPrescription,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const prescriptionsPerPage = 6;

  // Fetch prescriptions using the hook
  const {
    prescriptions = [],
    loading,
    error,
    fetchPrescriptions,
  } = usePrescriptionsByPatientId(userId);

  // Fetch prescriptions on component mount
  React.useEffect(() => {
    if (userId) {
      fetchPrescriptions(userId);
    }
  }, [userId, fetchPrescriptions]);

  // Calculate pagination
  const totalPages = Math.ceil(prescriptions.length / prescriptionsPerPage);
  const startIndex = (currentPage - 1) * prescriptionsPerPage;
  const endIndex = startIndex + prescriptionsPerPage;
  const currentPrescriptions = prescriptions.slice(startIndex, endIndex);

  const handleViewPrescription = (prescriptionId) => {
    onClickPrescription(prescriptionId);
  };

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getMedicationSummary = (medications) => {
    if (!medications || medications.length === 0) return "No medications";
    if (medications.length === 1) return medications[0].drugName;
    return `${medications[0].drugName} +${medications.length - 1} more`;
  };

  if (loading) {
    return (
      <div className="bg-none md:bg-white rounded-lg md:shadow-sm p-3 md:py-4">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
          <span className="ml-2 text-gray-600">Loading prescriptions...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-none md:bg-white rounded-lg md:shadow-sm p-3 md:py-4">
        <div className="flex items-center justify-center h-32">
          <div className="text-red-500 text-center">
            <p className="font-medium">Error loading prescriptions</p>
            <p className="text-sm mt-1">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  if (prescriptions.length === 0) {
    return (
      <div className="bg-none md:bg-white rounded-lg md:shadow-sm p-3 md:py-4">
        <div className="flex items-center justify-center h-32">
          <div className="text-gray-500 text-center">
            <FileText size={48} className="mx-auto mb-2 text-gray-400" />
            <p className="font-medium">No prescriptions found</p>
            <p className="text-sm mt-1">Your prescriptions will appear here</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-none md:bg-white rounded-lg md:shadow-sm p-3 md:py-4">
      {/* Desktop Table View - Hidden on mobile */}
      <div className="hidden lg:block overflow-x-auto py-2">
        <table className="w-full">
          <thead>
            <tr className="bg-teal-50">
              <th className="text-left py-3 px-4 font-medium text-gray-700">
                Doctor
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">
                Medications
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">
                Date
              </th>
              <th className="text-center py-3 px-4 font-medium text-gray-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {currentPrescriptions.map((prescription) => (
              <tr
                key={prescription.id}
                className="border-b border-gray-100 hover:bg-gray-50"
              >
                <td className="py-3 px-4">
                  <div className="flex items-center">
                    {prescription.doctorDetails.profileImage ? (
                      <img
                        src={
                          prescription.doctorDetails.profileImage.startsWith(
                            "http"
                          )
                            ? prescription.doctorDetails.profileImage
                            : prescription.doctorDetails.profileImage
                        }
                        alt={prescription.doctorDetails.name}
                        className="w-8 h-8 rounded-full mr-3"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center mr-3">
                        <span className="text-teal-600 font-medium text-sm">
                          {prescription.doctorDetails.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <span className="text-gray-700 font-medium">
                      {prescription.doctorDetails.name}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className="text-gray-600 text-sm">
                    {getMedicationSummary(prescription.medications)}
                  </span>
                </td>
                <td className="py-3 px-4 text-gray-600 text-sm">
                  {formatDate(prescription.createdAt)}
                </td>

                <td className="py-3 px-4">
                  <div className="flex justify-center">
                    <button
                      onClick={() => handleViewPrescription(prescription.id)}
                      className="bg-teal-500 text-white px-4 py-1 rounded-xl text-sm hover:bg-teal-600 transition-colors flex items-center gap-1"
                    >
                      <Eye size={14} />
                      View
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile/Tablet Card View - Shown on smaller screens */}
      <div className="h-[50vh] overflow-y-auto lg:hidden scrollbar-hide">
        <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-4">
          {prescriptions.map((prescription) => (
            <div
              key={prescription.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              {/* Doctor Info */}
              <div className="flex items-center mb-3">
                {prescription.doctorDetails.profileImage ? (
                  <img
                    src={
                      prescription.doctorDetails.profileImage.startsWith("http")
                        ? prescription.doctorDetails.profileImage
                        : process.env.NEXT_PUBLIC_TELEHEALTH_API_URL +
                          prescription.doctorDetails.profileImage
                    }
                    alt={prescription.doctorDetails.name}
                    className="w-10 h-10 rounded-full mr-3"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center mr-3">
                    <span className="text-teal-600 font-medium">
                      {prescription.doctorDetails.name.charAt(0)}
                    </span>
                  </div>
                )}
                <div>
                  <h4 className="font-medium text-gray-900 text-sm">
                    {prescription.doctorDetails.name}
                  </h4>
                  <p className="text-xs text-gray-500">
                    {formatDate(prescription.createdAt)}
                  </p>
                </div>
              </div>

              {/* Medications */}
              <div className="mb-3">
                <p className="text-xs text-gray-500 mb-1">Medications:</p>
                <p className="text-sm text-gray-700">
                  {getMedicationSummary(prescription.medications)}
                </p>
              </div>

              {/* Status */}
              <div className="mb-3">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    prescription.status === "active"
                      ? "bg-green-100 text-green-800"
                      : prescription.status === "completed"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {prescription.status || "Active"}
                </span>
              </div>

              {/* Action Button */}
              <div className="flex justify-center">
                <button
                  onClick={() => handleViewPrescription(prescription.id)}
                  className="bg-teal-500 text-white px-4 py-2 rounded-xl text-sm hover:bg-teal-600 transition-colors flex items-center gap-2 w-full justify-center"
                >
                  <Eye size={16} />
                  View Prescription
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination - only shown on desktop when needed */}
      {totalPages > 1 && (
        <div className="hidden lg:flex justify-between items-center mt-4">
          <button
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            className="bg-teal-500 text-white px-4 py-2 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-teal-600 transition-colors"
          >
            Previous
          </button>
          <span className="text-gray-600">
            Page {currentPage} of {totalPages} ({prescriptions.length} total
            prescriptions)
          </span>
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="bg-teal-500 text-white px-4 py-2 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-teal-600 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};
