import React, { useState, useEffect } from "react";
import {
  Search,
  X,
  Plus,
  Trash2,
  Edit3,
  Check,
  AlertCircle,
  Loader2,
  FileText,
  User,
  Calendar,
  Shield,
  Sparkles,
  Clock,
  Pill,
  Download, Printer,
} from "lucide-react";


import { useQuery } from "@apollo/client";
import Image from "next/image";
import {
  useCreatePrescription,
  usePrescriptionById,
  usePrescriptionForm,
} from "../../../hooks/usePrescription";
import { GET_Patient_BY_ID } from "../../../api/graphql/queries";
import { useAuth } from "../../../hooks/useAuth";

export const PrescriptionModal = ({
  isOpen,
  onClose,
  patientId,
  appointmentId,
  onSubmittPrescrption,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSigned, setIsSigned] = useState(false);
  const [signatureData, setSignatureData] = useState("");
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Get doctor data from auth context
  const { user } = useAuth();
  console.log("patientId:", patientId);

  // Fetch patient data using the provided query
  const {
    data: patientData,
    loading: patientLoading,
    error: patientError,
  } = useQuery(GET_Patient_BY_ID, {
    variables: { id: patientId },
    skip: !patientId || !isOpen,
    errorPolicy: "all",
  });

  // Extract patient profile from query result
  const patient = patientData?.thUserById;

  // Initialize form with proper data structure
  const initialFormData = {
    appointmentId: appointmentId || "",
    patientDetails: {
      patientId: patient?.patientProfile?.patientId || patientId || "",
      name: patient ? `${patient.firstName} ${patient.lastName}` : "",
      profileImage: patient?.profileImageUrl || "",
    },
    doctorDetails: {
      doctorId: user?.doctorProfile?.doctorId || user?.id || "",
      name: user ? `${user.firstName} ${user.lastName}` : "",
      profileImage: user?.profileImageUrl || "",
    },
    medications: [],
    recommendations: "",
  };

  // Use the prescription hooks
  const {
    createPrescription,
    loading: createLoading,
    error: createError,
    submitSuccess,
    submitError,
  } = useCreatePrescription();

  const {
    formData,
    errors,
    updateFormData,
    updateMedication,
    addMedication: addMedicationToForm,
    removeMedication: removeMedicationFromForm,
    validateForm,
    resetForm,
  } = usePrescriptionForm(initialFormData);

  // Update form data when patient data is loaded or user changes
  useEffect(() => {
    if (patient && user && appointmentId) {
      updateFormData("appointmentId", appointmentId);
      updateFormData("patientDetails", {
        patientId: patient.patientProfile?.patientId || patientId,
        name: `${patient.firstName} ${patient.lastName}`,
        profileImage: patient.profileImageUrl || "",
      });
      updateFormData("doctorDetails", {
        doctorId: user.doctorProfile?.doctorId || user.id,
        name: `${user.firstName} ${user.lastName}`,
        profileImage: user.profileImageUrl || "",
      });
    }
  }, [patient, user, appointmentId, patientId, updateFormData]);

  // Search medications using OpenFDA API
  const searchMedications = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://api.fda.gov/drug/label.json?search=openfda.brand_name:"${query}"&limit=10`
      );
      const data = await response.json();

      if (data.results) {
        const medications = data.results.map((drug, index) => ({
          id: index,
          name:
            drug.openfda?.brand_name?.[0] ||
            drug.openfda?.generic_name?.[0] ||
            "Unknown",
          generic: drug.openfda?.generic_name?.[0] || "",
          manufacturer: drug.openfda?.manufacturer_name?.[0] || "",
          dosage_forms: drug.dosage_form || ["Tablet"],
        }));
        setSearchResults(medications);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Error searching medications:", error);
      // Fallback to mock data if API fails
      const mockResults = [
        {
          id: 1,
          name: "Amoxicillin",
          generic: "Amoxicillin",
          manufacturer: "Generic Pharma",
          dosage_forms: ["Capsule", "Tablet"],
        },
        {
          id: 2,
          name: "Paracetamol",
          generic: "Acetaminophen",
          manufacturer: "Pain Relief Co",
          dosage_forms: ["Tablet"],
        },
        {
          id: 3,
          name: "Ibuprofen",
          generic: "Ibuprofen",
          manufacturer: "Anti-Inflammatory Inc",
          dosage_forms: ["Tablet", "Capsule"],
        },
      ].filter((med) => med.name.toLowerCase().includes(query.toLowerCase()));
      setSearchResults(mockResults);
    }
    setIsSearching(false);
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm) {
        searchMedications(searchTerm);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const addMedication = (medication) => {
    const newMedication = {
      drugName: medication.name,
      dosage: "500mg",
      route: "Oral",
      frequency: "Once daily",
      duration: "7 days",
      instructions: "Take with food. Complete the full course as prescribed.",
    };

    addMedicationToForm();
    const newIndex = formData.medications.length;

    // Update each field of the newly added medication
    Object.keys(newMedication).forEach((key) => {
      updateMedication(newIndex, key, newMedication[key]);
    });

    setSearchTerm("");
    setSearchResults([]);
  };

  const handleSign = () => {
    if (!validateForm()) {
      return;
    }
    setShowSignatureModal(true);
  };

  const confirmSignature = () => {
    if (signatureData.trim()) {
      setIsSigned(true);
      setShowSignatureModal(false);
    }
  };

  const handleSubmit = async () => {
    if (!isSigned || !validateForm()) {
      return;
    }

    try {
      const prescriptionData = {
        ...formData,
        signature: signatureData,
        status: "active",
      };

      const result = await createPrescription(prescriptionData);

      // Only set submitted state if the operation was successful
      if (result && !createError) {
        onSubmittPrescrption(
          `New Prescription Submitted (ID: ${result.id})`,
          appointmentId
        );
        setIsSubmitted(true);
      }
    } catch (error) {
      console.error("Error submitting prescription:", error);
    }
  };

  const handleClose = () => {
    resetForm();
    setIsSigned(false);
    setSignatureData("");
    setSearchTerm("");
    setSearchResults([]);
    setIsSubmitted(false);
    setShowSignatureModal(false); // Reset signature modal state
    onClose();
  };

  const handleSignatureModalClose = () => {
    setShowSignatureModal(false);
    setSignatureData("");
  };

  const SignatureModal = () => (
    <div className="fixed inset-0 bg-black/50 bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-sm sm:max-w-md w-full p-4 sm:p-6 shadow-2xl border border-gray-100">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="text-white" size={32} />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            Digital Signature
          </h3>
          <p className="text-gray-600 text-sm">
            Please enter your full name to sign this prescription
          </p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Enter your signature:
          </label>
          <input
            type="text"
            value={signatureData}
            onChange={(e) => setSignatureData(e.target.value)}
            placeholder="Type your full name (e.g., Dr. John Smith)"
            className="w-full p-3 sm:p-4 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 text-center font-medium text-sm sm:text-base"
            autoFocus
          />
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 sm:p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle
              className="text-amber-600 mt-0.5 flex-shrink-0"
              size={18}
            />
            <div className="text-sm text-amber-800">
              <p className="font-medium mb-1">Legal Notice</p>
              <p>
                By signing, you confirm the accuracy of this prescription and
                authorize its dispensing according to medical regulations.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleSignatureModalClose}
            className="flex-1 px-4 sm:px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={confirmSignature}
            disabled={!signatureData.trim()}
            className="flex-1 px-4 sm:px-6 py-3 bg-gradient-to-r from-primary to-primary/90 text-white rounded-lg hover:from-primary/90 hover:to-primary/80 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg"
          >
            Sign Prescription
          </button>
        </div>
      </div>
    </div>
  );

  // Success Modal
  const SuccessModal = () => (
    <div className="fixed inset-0 bg-black/50 bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-sm sm:max-w-md w-full p-6 sm:p-8 shadow-2xl border border-gray-100 text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="text-white" size={40} />
        </div>

        <div className="mb-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-3">
            Prescription Sent!
          </h3>
          <p className="text-gray-600">
            Your prescription has been successfully created and sent to the
            patient.
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center gap-2 text-green-700">
            <Sparkles size={18} />
            <span className="font-medium">Treatment plan is now active</span>
          </div>
        </div>

        <button
          onClick={handleClose}
          className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 font-medium shadow-lg"
        >
          Close
        </button>
      </div>
    </div>
  );

  if (!isOpen) return null;

  // Show success modal if submitted
  // With this:
  if (isSubmitted) {
    return <SuccessModal />;
  }

  // Show loading state while fetching patient data
  if (patientLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-40 p-4">
        <div className="bg-white rounded-2xl p-6 sm:p-8 text-center shadow-2xl max-w-xs sm:max-w-sm w-full">
          <Loader2
            size={48}
            className="animate-spin mx-auto mb-4 text-primary"
          />
          <p className="text-gray-600 font-medium">
            Loading patient information...
          </p>
        </div>
      </div>
    );
  }

  // Show error state if patient data fetch fails
  if (patientError) {
    return (
      <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-40 p-4">
        <div className="bg-white rounded-2xl p-6 sm:p-8 text-center max-w-xs sm:max-w-md w-full shadow-2xl">
          <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            Error Loading Patient
          </h3>
          <p className="text-gray-600 mb-6">
            Failed to load patient information. Please try again.
          </p>
          <button
            onClick={handleClose}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all duration-200 font-medium"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // Don't render if required data is missing
  if (!patient || !user) {
    return null;
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-40 p-2 sm:p-4">
        <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden shadow-2xl border border-gray-100 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-primary/10 to-primary/5 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center">
                <FileText className="text-white" size={20} />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-800">
                  Write Prescription
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">
                  Create a new prescription for your patient
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white hover:bg-opacity-70 rounded-lg transition-all duration-200"
            >
              <X size={20} className="text-gray-600" />
            </button>
          </div>

          {/* Patient Info */}
          <div className="p-4 sm:p-6 border-b border-gray-200 bg-gray-50 flex-shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-primary to-primary/80 relative overflow-hidden border-2 border-white shadow-lg flex-shrink-0">
                  {patient.profileImageUrl ? (
                    <Image
                      src={
                        process.env.NEXT_PUBLIC_TELEHEALTH_API_URL +
                        patient.profileImageUrl
                      }
                      alt="Patient"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white font-bold text-sm sm:text-lg">
                      {patient.firstName?.charAt(0)}
                      {patient.lastName?.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-base sm:text-lg text-gray-800 truncate">{`${patient.firstName} ${patient.lastName}`}</h3>
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">
                    ID: {patient.patientProfile?.patientId || patient.id}
                  </p>
                  <div className="flex flex-wrap gap-2 sm:gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <User size={12} />
                      {patient.gender}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(patient.dob).toLocaleDateString()}
                    </span>
                    {patient.patientProfile?.bloodType && (
                      <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                        {patient.patientProfile.bloodType}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="sm:text-right">
                <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                  <p className="text-xs text-gray-500 font-medium">
                    Appointment ID
                  </p>
                  <p className="font-bold text-gray-800 text-sm">
                    {appointmentId}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Dr. {user.firstName} {user.lastName}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 sm:p-6">
              {/* Error Display */}
              {(createError || submitError) && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-3 text-red-700">
                    <AlertCircle size={20} />
                    <div>
                      <p className="font-semibold">Error occurred</p>
                      <p className="text-sm">{createError || submitError}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Search Section */}
              <div className="mb-6 sm:mb-8">
                <div className="relative">
                  <Search
                    className="absolute left-3 sm:left-4 top-3 sm:top-4 text-gray-400"
                    size={20}
                  />
                  <input
                    type="text"
                    placeholder="Search medications..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 text-gray-700 placeholder-gray-500 text-sm sm:text-base"
                  />
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="mt-3 bg-white border-2 border-gray-200 rounded-lg shadow-lg max-h-48 sm:max-h-64 overflow-y-auto">
                    {searchResults.map((medication) => (
                      <div
                        key={medication.id}
                        onClick={() => addMedication(medication)}
                        className="p-3 sm:p-4 hover:bg-primary/5 cursor-pointer border-b border-gray-100 last:border-b-0 transition-all duration-200"
                      >
                        <div className="font-semibold text-gray-800 text-sm sm:text-base">
                          {medication.name}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600 mt-1">
                          {medication.generic &&
                            `Generic: ${medication.generic}`}
                          {medication.manufacturer &&
                            ` | Manufacturer: ${medication.manufacturer}`}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {isSearching && (
                  <div className="mt-3 p-4 text-center text-gray-500 bg-gray-50 rounded-lg">
                    <Loader2 size={20} className="animate-spin mx-auto mb-2" />
                    <p className="text-sm">Searching medications...</p>
                  </div>
                )}
              </div>

              {/* Selected Medications */}
              <div className="space-y-4 sm:space-y-6">
                {formData.medications.map((medication, index) => (
                  <div
                    key={index}
                    className="border-2 border-gray-200 rounded-lg p-4 sm:p-6 bg-white shadow-sm"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <h4 className="font-bold text-base sm:text-lg text-gray-800 flex items-center gap-2 flex-1 pr-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-primary to-primary/80 rounded text-white text-xs flex items-center justify-center flex-shrink-0">
                          {index + 1}
                        </div>
                        <span className="truncate">{medication.drugName}</span>
                      </h4>
                      <button
                        onClick={() => removeMedicationFromForm(index)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all duration-200 flex-shrink-0"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Dosage *
                        </label>
                        <input
                          type="text"
                          value={medication.dosage}
                          onChange={(e) =>
                            updateMedication(index, "dosage", e.target.value)
                          }
                          className={`w-full p-3 border-2 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 text-sm sm:text-base ${
                            errors[`medications.${index}.dosage`]
                              ? "border-red-300 bg-red-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          placeholder="e.g., 500mg, 2 tablets"
                        />
                        {errors[`medications.${index}.dosage`] && (
                          <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                            <AlertCircle size={14} />
                            {errors[`medications.${index}.dosage`]}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Route *
                        </label>
                        <select
                          value={medication.route}
                          onChange={(e) =>
                            updateMedication(index, "route", e.target.value)
                          }
                          className={`w-full p-3 border-2 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 text-sm sm:text-base ${
                            errors[`medications.${index}.route`]
                              ? "border-red-300 bg-red-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <option value="">Select Route</option>
                          <option value="Oral">Oral</option>
                          <option value="Topical">Topical</option>
                          <option value="Injection">Injection</option>
                          <option value="Inhalation">Inhalation</option>
                        </select>
                        {errors[`medications.${index}.route`] && (
                          <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                            <AlertCircle size={14} />
                            {errors[`medications.${index}.route`]}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Frequency *
                        </label>
                        <select
                          value={medication.frequency}
                          onChange={(e) =>
                            updateMedication(index, "frequency", e.target.value)
                          }
                          className={`w-full p-3 border-2 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 text-sm sm:text-base ${
                            errors[`medications.${index}.frequency`]
                              ? "border-red-300 bg-red-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <option value="">Select Frequency</option>
                          <option value="Once daily">Once daily</option>
                          <option value="Twice daily">Twice daily</option>
                          <option value="3 times daily">3 times daily</option>
                          <option value="4 times daily">4 times daily</option>
                          <option value="As needed">As needed</option>
                        </select>
                        {errors[`medications.${index}.frequency`] && (
                          <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                            <AlertCircle size={14} />
                            {errors[`medications.${index}.frequency`]}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Duration *
                        </label>
                        <input
                          type="text"
                          value={medication.duration}
                          onChange={(e) =>
                            updateMedication(index, "duration", e.target.value)
                          }
                          placeholder="e.g., 7 days, 2 weeks"
                          className={`w-full p-3 border-2 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 text-sm sm:text-base ${
                            errors[`medications.${index}.duration`]
                              ? "border-red-300 bg-red-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        />
                        {errors[`medications.${index}.duration`] && (
                          <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                            <AlertCircle size={14} />
                            {errors[`medications.${index}.duration`]}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Instructions *
                      </label>
                      <textarea
                        value={medication.instructions}
                        onChange={(e) =>
                          updateMedication(
                            index,
                            "instructions",
                            e.target.value
                          )
                        }
                        rows={3}
                        className={`w-full p-3 border-2 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 resize-none text-sm sm:text-base ${
                          errors[`medications.${index}.instructions`]
                            ? "border-red-300 bg-red-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        placeholder="Special instructions for the patient..."
                      />
                      {errors[`medications.${index}.instructions`] && (
                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                          <AlertCircle size={14} />
                          {errors[`medications.${index}.instructions`]}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {formData.medications.length === 0 && (
                <div className="text-center py-8 sm:py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle
                      size={24}
                      className="text-gray-400 sm:w-8 sm:h-8"
                    />
                  </div>
                  <p className="text-gray-500 font-medium text-sm sm:text-base">
                    No medications selected
                  </p>
                  <p className="text-gray-400 text-xs sm:text-sm mt-1 max-w-md mx-auto">
                    Search and add medications above to create your prescription
                  </p>
                </div>
              )}

              {/* Recommendations */}
              <div className="mt-6 sm:mt-8">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Additional Recommendations
                </label>
                <textarea
                  value={formData.recommendations}
                  onChange={(e) =>
                    updateFormData("recommendations", e.target.value)
                  }
                  rows={4}
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 resize-none hover:border-gray-300 text-sm sm:text-base"
                  placeholder="Additional recommendations, lifestyle changes, follow-up instructions..."
                />
              </div>

              {/* Signature Status */}
              {isSigned && (
                <div className="mt-6 sm:mt-8 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-3 text-green-700">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <Check size={16} className="text-white" />
                    </div>
                    <div>
                      <p className="font-semibold">Digitally Signed</p>
                      <p className="text-sm text-green-600">
                        Dr. {user.firstName} {user.lastName}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6 sm:mt-8 pt-6 border-t-2 border-gray-200">
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 sm:px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 font-semibold transition-all duration-200 text-sm sm:text-base"
                  disabled={createLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSign}
                  disabled={
                    formData.medications.length === 0 ||
                    isSigned ||
                    createLoading
                  }
                  className="flex-1 px-4 sm:px-6 py-3 border-2 border-primary text-primary rounded-lg hover:bg-primary/5 hover:border-primary font-semibold disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-300 disabled:cursor-not-allowed transition-all duration-200 text-sm sm:text-base"
                >
                  {isSigned ? "✓ Signed" : "Sign Prescription"}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={
                    !isSigned ||
                    formData.medications.length === 0 ||
                    createLoading
                  }
                  className="flex-1 px-4 sm:px-6 py-3 bg-gradient-to-r from-primary to-primary/90 text-white rounded-lg hover:from-primary/90 hover:to-primary/80 font-semibold disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all duration-200 shadow-lg text-sm sm:text-base"
                >
                  {createLoading && (
                    <Loader2 size={18} className="animate-spin" />
                  )}
                  {createLoading ? "Submitting..." : "Submit Prescription"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showSignatureModal && <SignatureModal />}
    </>
  );
};

export const PrescriptionViewModal = ({ 
  isOpen, 
  onClose, 
  prescriptionId, // Changed from prescriptionData to prescriptionId
  isPatient = false
}) => {
  // Use the hook to fetch prescription data
  const { prescription, loading, error, refetch } = usePrescriptionById(prescriptionId);

  if (!isOpen) return null;

  // Show loading state
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-40 p-4">
        <div className="bg-white rounded-2xl p-6 sm:p-8 text-center shadow-2xl max-w-xs sm:max-w-sm w-full">
          <Loader2 size={48} className="animate-spin mx-auto mb-4 text-[#25c8b1]" />
          <p className="text-gray-600 font-medium">Loading prescription...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-40 p-4">
        <div className="bg-white rounded-2xl p-6 sm:p-8 text-center max-w-xs sm:max-w-md w-full shadow-2xl">
          <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
          <h3 className="text-xl font-bold text-gray-800 mb-2">Error Loading Prescription</h3>
          <p className="text-gray-600 mb-6">{error.message || 'Failed to load prescription'}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => refetch()}
              className="px-6 py-3 bg-[#25c8b1] text-white rounded-lg hover:bg-[#25c8b1]/90 transition-all duration-200 font-medium"
            >
              Retry
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all duration-200 font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Don't render if no prescription data
  if (!prescription) {
    return (
      <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-40 p-4">
        <div className="bg-white rounded-2xl p-6 sm:p-8 text-center max-w-xs sm:max-w-md w-full shadow-2xl">
          <AlertCircle size={48} className="mx-auto mb-4 text-yellow-500" />
          <h3 className="text-xl font-bold text-gray-800 mb-2">No Prescription Found</h3>
          <p className="text-gray-600 mb-6">The requested prescription could not be found.</p>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-[#25c8b1] text-white rounded-lg hover:bg-[#25c8b1]/90 transition-all duration-200 font-medium"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handlePrint = () => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    const printContent = generatePrintContent();
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const handleDownload = () => {
    const printContent = generatePrintContent();
    const blob = new Blob([printContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prescription-${prescription.id}-${prescription.patientDetails.name.replace(/\s+/g, '-')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generatePrintContent = () => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Prescription - ${prescription.patientDetails.name}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: white; }
            .container { max-width: 800px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; border-bottom: 3px solid #25c8b1; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { color: #25c8b1; font-size: 28px; margin-bottom: 10px; }
            .header p { color: #666; font-size: 14px; }
            .section { margin-bottom: 25px; }
            .section-title { font-size: 18px; font-weight: bold; color: #28161c; margin-bottom: 15px; border-bottom: 2px solid #25c8b1; padding-bottom: 5px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
            .info-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; background: #f9fafb; }
            .info-card h3 { color: #28161c; font-size: 16px; margin-bottom: 10px; }
            .info-card p { margin-bottom: 5px; font-size: 14px; }
            .medication { border: 2px solid #25c8b1; border-radius: 8px; padding: 20px; margin-bottom: 15px; background: #f0fdf4; }
            .medication h4 { color: #28161c; font-size: 18px; margin-bottom: 15px; }
            .med-details { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 15px; }
            .med-detail { background: white; padding: 10px; border-radius: 6px; border: 1px solid #d1d5db; }
            .med-detail-label { font-weight: bold; color: #666; font-size: 12px; margin-bottom: 5px; }
            .med-detail-value { color: #28161c; font-size: 14px; }
            .instructions { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 15px; }
            .instructions-label { font-weight: bold; color: #92400e; font-size: 12px; margin-bottom: 5px; }
            .instructions-text { color: #92400e; font-size: 14px; }
            .recommendations { background: #dbeafe; border: 1px solid #3b82f6; border-radius: 8px; padding: 15px; }
            .signature { background: #dcfce7; border: 1px solid #16a34a; border-radius: 8px; padding: 15px; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #666; }
            .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
            .status-active { background: #dcfce7; color: #166534; }
            .status-completed { background: #dbeafe; color: #1e40af; }
            .status-cancelled { background: #fee2e2; color: #dc2626; }
            .status-pending { background: #fef3c7; color: #a16207; }
            @media print {
              .container { padding: 0; }
              .section { page-break-inside: avoid; }
              .medication { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Medical Prescription</h1>
              <p>Prescription ID: ${prescription.id}</p>
              <p>Generated on: ${formatDate(prescription.createdAt)}</p>
            </div>

            <div class="section">
              <div class="section-title">Prescription Information</div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <div>
                  <p><strong>Appointment ID:</strong> ${prescription.appointmentId}</p>
                  <p><strong>Created:</strong> ${formatDate(prescription.createdAt)}</p>
                  <p><strong>Last Updated:</strong> ${formatDate(prescription.updatedAt)}</p>
                </div>
                <div>
                  <span class="status-badge status-${prescription.status?.toLowerCase() || 'unknown'}">${prescription.status?.toUpperCase() || 'UNKNOWN'}</span>
                </div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Patient & Doctor Information</div>
              <div class="info-grid">
                <div class="info-card">
                  <h3>Patient Details</h3>
                  <p><strong>Name:</strong> ${prescription.patientDetails.name}</p>
                  <p><strong>Patient ID:</strong> ${prescription.patientDetails.patientId}</p>
                </div>
                <div class="info-card">
                  <h3>Doctor Details</h3>
                  <p><strong>Name:</strong> ${prescription.doctorDetails.name}</p>
                  <p><strong>Doctor ID:</strong> ${prescription.doctorDetails.doctorId}</p>
                </div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Prescribed Medications (${prescription.medications?.length || 0})</div>
              ${prescription.medications?.map((med, index) => `
                <div class="medication">
                  <h4>${index + 1}. ${med.drugName}</h4>
                  <div class="med-details">
                    <div class="med-detail">
                      <div class="med-detail-label">DOSAGE</div>
                      <div class="med-detail-value">${med.dosage}</div>
                    </div>
                    <div class="med-detail">
                      <div class="med-detail-label">ROUTE</div>
                      <div class="med-detail-value">${med.route}</div>
                    </div>
                    <div class="med-detail">
                      <div class="med-detail-label">FREQUENCY</div>
                      <div class="med-detail-value">${med.frequency}</div>
                    </div>
                    <div class="med-detail">
                      <div class="med-detail-label">DURATION</div>
                      <div class="med-detail-value">${med.duration}</div>
                    </div>
                  </div>
                  <div class="instructions">
                    <div class="instructions-label">INSTRUCTIONS</div>
                    <div class="instructions-text">${med.instructions}</div>
                  </div>
                </div>
              `).join('') || '<p>No medications prescribed</p>'}
            </div>

            ${prescription.recommendations ? `
              <div class="section">
                <div class="section-title">Additional Recommendations</div>
                <div class="recommendations">
                  <p>${prescription.recommendations}</p>
                </div>
              </div>
            ` : ''}

            ${prescription.signature ? `
              <div class="section">
                <div class="section-title">Digital Signature</div>
                <div class="signature">
                  <p><strong>Digitally Signed by:</strong> ${prescription.signature}</p>
                  <p><strong>Signed on:</strong> ${formatDate(prescription.createdAt)}</p>
                </div>
              </div>
            ` : ''}

            <div class="footer">
              <p>This prescription is valid and legally binding. Present this prescription to your pharmacist to obtain your medications.</p>
              <p>Follow all instructions carefully and consult your doctor if you have any questions.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  return (
    <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-40 p-2 sm:p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden shadow-2xl border border-gray-100 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-[#25c8b1]/10 to-[#25c8b1]/5 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#25c8b1] to-[#25c8b1]/80 rounded-lg flex items-center justify-center">
              <FileText className="text-white" size={20} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#28161c]">
                {isPatient ? 'My Prescription' : 'Prescription Details'}
              </h2>
              <p className="text-xs sm:text-sm text-gray-600">
                Prescription ID: {prescription.id}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 bg-[#25c8b1] text-white rounded-lg hover:bg-[#25c8b1]/90 transition-all duration-200 flex items-center gap-2"
              title="Print Prescription"
            >
              <Printer size={16} />
              <span className="hidden sm:inline">Print</span>
            </button>
            <button
              onClick={handleDownload}
              className="p-2 bg-[#28161c] text-white rounded-lg hover:bg-[#28161c]/90 transition-all duration-200 flex items-center gap-2"
              title="Download Prescription"
            >
              <Download size={16} />
              <span className="hidden sm:inline">Download</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-70 rounded-lg transition-all duration-200"
            >
              <X size={20} className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6">
            {/* Prescription Info */}
            <div className="mb-6 p-4 sm:p-6 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-lg font-bold text-[#28161c] mb-2">Prescription Information</h3>
                  <div className="flex flex-wrap gap-2 sm:gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      Created: {formatDate(prescription.createdAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      Updated: {formatDate(prescription.updatedAt)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(prescription.status)}`}>
                    {prescription.status?.toUpperCase() || 'UNKNOWN'}
                  </span>
                </div>
              </div>
              
              <div className="text-sm text-gray-600">
                <p><strong>Appointment ID:</strong> {prescription.appointmentId}</p>
              </div>
            </div>

            {/* Patient & Doctor Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
              {/* Patient Details */}
              <div className="p-4 sm:p-6 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <User size={20} className="text-blue-600" />
                  Patient Information
                </h3>
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-primary/50 to-primary/60 relative overflow-hidden border-2 border-white shadow-lg flex-shrink-0">
                    {prescription.patientDetails.profileImage ? (
                      <img
                        src={process.env.NEXT_PUBLIC_TELEHEALTH_API_URL + prescription.patientDetails.profileImage}
                        alt="Patient" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm sm:text-lg">
                        {prescription.patientDetails.name.split(' ').map(n => n.charAt(0)).join('')}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-base sm:text-lg text-gray-800 truncate">
                      {prescription.patientDetails.name}
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-600">
                      Patient ID: {prescription.patientDetails.patientId}
                    </p>
                  </div>
                </div>
              </div>

              {/* Doctor Details */}
              <div className="p-4 sm:p-6 bg-green-50 rounded-lg border border-green-200">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Shield size={20} className="text-green-600" />
                  Doctor Information
                </h3>
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-green-500 to-green-600 relative overflow-hidden border-2 border-white shadow-lg flex-shrink-0">
                    {prescription.doctorDetails.profileImage ? (
                      <img
                        src={process.env.NEXT_PUBLIC_TELEHEALTH_API_URL+prescription.doctorDetails.profileImage}
                        alt="Doctor" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-bold text-sm sm:text-lg">
                        {prescription.doctorDetails.name.split(' ').map(n => n.charAt(0)).join('')}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-base sm:text-lg text-gray-800 truncate">
                      {prescription.doctorDetails.name}
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-600">
                      Doctor ID: {prescription.doctorDetails.doctorId}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Medications */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-[#28161c] mb-4 flex items-center gap-2">
                <Pill size={20} className="text-[#25c8b1]" />
                Prescribed Medications ({prescription.medications?.length || 0})
              </h3>
              <div className="space-y-4">
                {prescription.medications?.map((medication, index) => (
                  <div key={index} className="border-2 border-gray-200 rounded-lg p-4 sm:p-6 bg-white shadow-sm">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-8 h-8 bg-gradient-to-br from-[#25c8b1] to-[#25c8b1]/80 rounded-full text-white text-sm flex items-center justify-center flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-base sm:text-lg text-[#28161c] mb-2">
                          {medication.drugName}
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs font-semibold text-gray-500 mb-1">DOSAGE</p>
                            <p className="text-sm font-medium text-gray-800">{medication.dosage}</p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs font-semibold text-gray-500 mb-1">ROUTE</p>
                            <p className="text-sm font-medium text-gray-800">{medication.route}</p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs font-semibold text-gray-500 mb-1">FREQUENCY</p>
                            <p className="text-sm font-medium text-gray-800">{medication.frequency}</p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs font-semibold text-gray-500 mb-1">DURATION</p>
                            <p className="text-sm font-medium text-gray-800">{medication.duration}</p>
                          </div>
                        </div>
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                          <p className="text-xs font-semibold text-amber-700 mb-1">INSTRUCTIONS</p>
                          <p className="text-sm text-amber-800">{medication.instructions}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )) || (
                  <div className="text-center py-8 text-gray-500">
                    <Pill size={48} className="mx-auto mb-4 text-gray-300" />
                    <p>No medications prescribed</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recommendations */}
            {prescription.recommendations && (
              <div className="mb-6">
                <h3 className="text-lg font-bold text-[#28161c] mb-4">Additional Recommendations</h3>
                <div className="p-4 sm:p-6 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-gray-700 whitespace-pre-wrap">{prescription.recommendations}</p>
                </div>
              </div>
            )}

            {/* Signature */}
            {prescription.signature && (
              <div className="mb-6">
                <h3 className="text-lg font-bold text-[#28161c] mb-4">Digital Signature</h3>
                <div className="p-4 sm:p-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-3 text-green-700">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                      <Shield size={20} className="text-white" />
                    </div>
                    <div>
                      <p className="font-semibold">Digitally Signed by:</p>
                      <p className="text-lg font-bold">{prescription.signature}</p>
                      <p className="text-sm text-green-600">
                        Signed on {formatDate(prescription.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Legal Notice */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 sm:p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-gray-500 mt-1 flex-shrink-0" size={20} />
                <div className="text-sm text-gray-600">
                  <p className="font-semibold mb-2">Important Notice</p>
                  <p>
                    This prescription is valid and legally binding. {isPatient ? 'Present this prescription to your pharmacist to obtain your medications. Follow all instructions carefully and consult your doctor if you have any questions.' : 'This prescription was issued by a licensed healthcare provider and should be dispensed according to medical regulations.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-[#25c8b1] text-white rounded-lg hover:bg-[#25c8b1]/90 transition-all duration-200 font-medium shadow-lg flex items-center gap-2"
              >
                <Printer size={16} />
                Print Prescription
              </button>
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-[#28161c] text-white rounded-lg hover:bg-[#28161c]/90 transition-all duration-200 font-medium shadow-lg flex items-center gap-2"
              >
                <Download size={16} />
                Download
              </button>
            </div>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all duration-200 font-semibold shadow-lg"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
