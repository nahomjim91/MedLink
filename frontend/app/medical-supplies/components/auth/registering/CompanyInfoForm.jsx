"use client";
import { useState, useEffect } from "react";
import { StepButtons } from "../../ui/Button";
import { TextInput } from "../../ui/Input";
import { FileUploader } from "../../ui/FileUploader";

export default function CompanyInfoForm({
  userData,
  onUpdate,
  onNext,
  onPrevious,
  onEFDAUpload,
  onLicenseUpload,
  isLoading
}) {
  const [formData, setFormData] = useState({
    companyName: userData.companyName || "",
    contactName: userData.contactName || "",
    phoneNumber: userData.phoneNumber || "",
    address: {
      street: userData.address?.street || "",
      city: userData.address?.city || "",
      state: userData.address?.state || "",
      country: userData.address?.country || "",
      postalCode: userData.address?.postalCode || "",
    },
    efdaLicense: userData.efdaLicenseUrl ? { url: userData.efdaLicenseUrl } : null,
    businessLicense: userData.businessLicenseUrl ? { url: userData.businessLicenseUrl } : null,
  });

  // Update local form state when userData prop changes
  useEffect(() => {
    setFormData({
      companyName: userData.companyName || "",
      contactName: userData.contactName || "",
      phoneNumber: userData.phoneNumber || "",
      address: {
        street: userData.address?.street || "",
        city: userData.address?.city || "",
        state: userData.address?.state || "",
        country: userData.address?.country || "",
        postalCode: userData.address?.postalCode || "",
      },
      efdaLicense: userData.efdaLicenseUrl ? { url: userData.efdaLicenseUrl } : null,
      businessLicense: userData.businessLicenseUrl ? { url: userData.businessLicenseUrl } : null,
    });
  }, [userData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        [name]: value
      }
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Update parent component with form data
    onUpdate({
      companyName: formData.companyName,
      contactName: formData.contactName,
      phoneNumber: formData.phoneNumber,
      address: formData.address
    });
    
    onNext();
  };

  const handleEFDAUpload = (file) => {
    setFormData(prev => ({ ...prev, efdaLicense: file }));
    onEFDAUpload(file.url);
  };

  const handleLicenseUpload = (file) => {
    setFormData(prev => ({ ...prev, businessLicense: file }));
    onLicenseUpload(file.url);
  };

  const isFormValid = 
    formData.companyName &&
    formData.contactName &&
    formData.phoneNumber &&
    formData.address.street &&
    formData.address.city &&
    formData.address.state &&
    formData.address.country &&
    formData.address.postalCode;

  return (
    <div className="px-6">
      <div className="mb-4">
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
            className="mb-4"
            placeholder="Enter your company name"
            value={formData.companyName}
            onChange={handleChange}
            required={true}
          />
          <TextInput
            name="contactName"
            label="Contact Person"
            className="mb-4"
            placeholder="Enter contact person name"
            value={formData.contactName}
            onChange={handleChange}
            required={true}
          />
        </div>
        
        <div className="mb-4">
          <TextInput
            name="phoneNumber"
            type="tel"
            label="Phone Number"
            placeholder="Enter company phone number"
            value={formData.phoneNumber}
            onChange={handleChange}
            required={true}
          />
        </div>

        <div className="mb-6">
          <h3 className="text-md font-medium mb-2">Company Address</h3>
          <div className="grid md:grid-cols-2 md:gap-4">
            <TextInput
              name="street"
              label="Street Address"
              className="mb-4"
              placeholder="Enter street address"
              value={formData.address.street}
              onChange={handleAddressChange}
              required={true}
            />
            <TextInput
              name="city"
              label="City"
              className="mb-4"
              placeholder="Enter city"
              value={formData.address.city}
              onChange={handleAddressChange}
              required={true}
            />
          </div>
          <div className="grid md:grid-cols-3 md:gap-4">
            <TextInput
              name="state"
              label="State/Province"
              className="mb-4"
              placeholder="Enter state/province"
              value={formData.address.state}
              onChange={handleAddressChange}
              required={true}
            />
            <TextInput
              name="country"
              label="Country"
              className="mb-4"
              placeholder="Enter country"
              value={formData.address.country}
              onChange={handleAddressChange}
              required={true}
            />
            <TextInput
              name="postalCode"
              label="Postal Code"
              className="mb-4"
              placeholder="Enter postal code"
              value={formData.address.postalCode}
              onChange={handleAddressChange}
              required={true}
            />
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-md font-medium mb-2">Licenses & Certifications</h3>
          <div className="grid md:grid-cols-2 md:gap-4">
            <FileUploader
              label="EFDA Registration"
              multiple={false}
              accept="image/png,image/jpeg,application/pdf"
              onFileUpload={handleEFDAUpload}
              initialFiles={formData.efdaLicense}
              showPreview={true}
              required={true}
              previewType="document"
              className="mb-4"
            />
            <FileUploader
              label="Business License"
              multiple={false}
              accept="image/png,image/jpeg,application/pdf"
              onFileUpload={handleLicenseUpload}
              initialFiles={formData.businessLicense}
              showPreview={true}
              required={true}
              previewType="document"
              className="mb-4"
            />
          </div>
        </div>

        <StepButtons 
          onNext={handleSubmit} 
          onPrevious={onPrevious}
          nextDisabled={!isFormValid}
          isLoading={isLoading}
        />
      </form>
    </div>
  );
}