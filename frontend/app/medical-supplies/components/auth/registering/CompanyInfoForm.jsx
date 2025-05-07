"use client";
import { useState } from "react";
import { Button, StepButtons } from "../../ui/Button";
import { AddressInput, TextInput } from "../../ui/Input";
import { FileUploader } from "../../ui/FileUploader";

export default function CompanyInfoForm({
  userData,
  onUpdate,
  onNext,
  onPrevious,
  onEFDAUpload,
  onLicenseUpload,
}) {
  const [formData, setFormData] = useState({
    companyName: userData.companyName || "",
    contactName: userData.contactName || "",
    companyPhoneNumber: userData.companyPhoneNumber || "",
    address: userData.address || null,
    EFDA: userData.EFDA || null,
    license: userData.license || null,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(formData);
    onNext();
  };

  const isFormValid =
    formData.companyName && formData.contactName && formData.companyPhoneNumber;

  return (
    <div className="px-6 ">
      <div className="mb-2">
        <h2 className="text-xl font-semibold text-secondary/80 mb-2">
          Company Information
        </h2>
        <p className="text-sm text-secondary/60">
          Tell us more about your company
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid md:grid-cols-2 md:gap-4">
          <TextInput
            name="companyName"
            label="Company Name"
            className={"mb-1"}
            placeholder={"Enter your company name"}
            value={formData.companyName}
            onChange={handleChange}
            required={true}
          />
          <TextInput
            name="contactName"
            label="Contact Name"
            className={"mb-1"}
            placeholder={"Enter your contact name"}
            value={formData.contactName}
            onChange={handleChange}
            required={true}
          />
        </div>
        <div className="grid md:grid-cols-2 md:gap-4">
          <TextInput
            name="phoneNumber"
            type="tel"
            label="Phone Number"
            className={"mb-4"}
            placeholder={"Enter your phone number"}
            value={formData.phoneNumber}
            onChange={handleChange}
            required={true}
          />
          <AddressInput
            name="address"
            label="Address"
            className={"mb-4"}
            placeholder={"Enter your address"}
            value={formData.address}
            onChange={handleChange}
            required={true}
          />
        </div>
        <div className="grid md:grid-cols-2 md:gap-4">
          <FileUploader
            label="EFDA Registration"
            multiple={false}
            accept="image/png,image/jpeg ,application/pdf"
            onFileUpload={onEFDAUpload}
            // showPreview={false}
            required={true}
            previewType="document"
          />
          <FileUploader
            label="Business License"
            multiple={false}
            accept="image/png,image/jpeg ,application/pdf"
            onFileUpload={onLicenseUpload}
            // showPreview={false}
            required={true}
            previewType="document"
          />
        </div>

        <StepButtons onNext={onNext} onPrevious={onPrevious} />
      </form>
    </div>
  );
}
