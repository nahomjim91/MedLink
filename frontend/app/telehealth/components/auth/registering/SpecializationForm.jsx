"use client";
import { useState } from "react";
import { StepButtons } from "../../ui/Button";
import { FileUploader } from "../../ui/FileUploader"; // Make sure this path is correct
import { NumberInput, TextInput } from "../../ui/Input";

export default function SpecializationForm({
  specialization,
  experienceYears,
  aboutYou,
  certificates,
  onUpdate,
  onDocumentsUpload,
  onNext,
  onPrevious,
}) {
  const [formData, setFormData] = useState({
    specialization: specialization || "",
    experienceYears: experienceYears || "",
    aboutYou: aboutYou || "",
  });

  const [documents, setDocuments] = useState(certificates || []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDocumentsUpload = (files) => {
    setDocuments(files);
    onDocumentsUpload(files);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(formData);
    onNext();
  };

  const isFormValid =
    formData.specialization.trim() !== "" &&
    formData.experienceYears.trim() !== "";

  return (
    <div className="px-6">
      <div className="mb-4">
        <h2 className=" text-base md:text-xl font-semibold text-secondary/80 mb-2">
          Professional Information
        </h2>
        <p className=" text-xs md:text-sm text-secondary/60">
          Tell us about your medical expertise
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
      <TextInput
            label="Specialization"
            placeholder="e.g., Cardiology, Dermatology"
            value={formData.specialization}
            onChange={handleChange}
            fullWidth={true}
            required={true}
            name="specialization"
          />
          <NumberInput
            label="Years of Experience"
            value={formData.experienceYears}
            onChange={handleChange}
            required={true}
            name="experienceYears"
            min={0}
          />
        </div>

        <div className="mb-4">
          <label
            htmlFor="aboutYou"
            className="block text-xs md:text-sm font-medium text-secondary/70 mb-1"
          >
            About You
          </label>
          <textarea
            id="aboutYou"
            name="aboutYou"
            value={formData.aboutYou}
            onChange={handleChange}
            rows="2"
            placeholder="Share your professional background, approach to patient care, etc."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-xs md:text-sm"
          />
        </div>

        {/* Certificates/Documents Upload */}
        <FileUploader
          label="Upload Your Certificates"
          accept=".pdf,.jpg,.jpeg,.png"
          multiple={true}
          onFileUpload={handleDocumentsUpload}
          initialFiles={documents}
          showPreview={true}
          previewType="document"
        />

        <StepButtons onNext={handleSubmit} onPrevious={onPrevious} />
    </div>
  );
}
