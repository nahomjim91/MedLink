"use client";
import { useState, useEffect } from "react";
import { StepButtons } from "../../ui/Button";
import { TextInput, AddressInput } from "../../ui/Input";
import { FileUploader } from "../../ui/FileUploader";
import useFileUpload from "../../../hooks/useFileUpoload";

export default function CompanyInfoForm({
  userData,
  onUpdate,
  onNext,
  onPrevious,
  onEFDAUpload,
  onLicenseUpload,
  isLoading,
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
      geoLocation: userData.address?.geoLocation || {
        latitude: null,
        longitude: null,
      },
      geoLocationText: formatGeoLocationText(userData.address?.geoLocation),
    },
    efdaLicense: userData.efdaLicenseUrl
      ? { url: userData.efdaLicenseUrl }
      : null,
    businessLicense: userData.businessLicenseUrl
      ? { url: userData.businessLicenseUrl }
      : null,
  });

  // Initialize the file upload hook
  const {
    uploading: imageUploading,
       uploadSingle,
       deleteFile
  } = useFileUpload();

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
        country: userData.address?.country || "Ethiopia",
        postalCode: userData.address?.postalCode || "",
        geoLocation: userData.address?.geoLocation || {
          latitude: null,
          longitude: null,
        },
        geoLocationText: formatGeoLocationText(userData.address?.geoLocation),
      },
      efdaLicense: userData.efdaLicenseUrl
        ? { url: userData.efdaLicenseUrl }
        : null,
      businessLicense: userData.businessLicenseUrl
        ? { url: userData.businessLicenseUrl }
        : null,
      companyImage: userData.companyImageUrl
        ? { url: userData.companyImageUrl }
        : null,
    });
  }, [userData]);

  function formatGeoLocationText(geoLocation) {
    if (
      !geoLocation ||
      geoLocation.latitude === null ||
      geoLocation.longitude === null
    ) {
      return "";
    }

    return `${geoLocation.latitude.toFixed(6)}, ${geoLocation.longitude.toFixed(
      6
    )}`;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log("Field changed:", name, "Value:", value);
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        [name]: value,
      },
    }));
  };

  const handleGeoLocationTextChange = (e) => {
    const { value } = e.target;

    setFormData((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        geoLocationText: value,
      },
    }));
  };

  const handleGeoLocationChange = (geoLocation) => {
    console.log("Received coordinates:", geoLocation);

    setFormData((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        geoLocation: {
          latitude: geoLocation.latitude,
          longitude: geoLocation.longitude,
        },
        geoLocationText: formatGeoLocationText(geoLocation),
      },
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted:", formData);

    if (
      !formData.companyName ||
      !formData.contactName ||
      !formData.phoneNumber ||
      !isValidEthiopianPhone(formData.phoneNumber) ||
      !formData.address.street ||
      !formData.address.city ||
      !formData.address.state ||
      !formData.address.country ||
      !formData.address.postalCode ||
      !formData.efdaLicense ||
      !formData.businessLicense
    ) {
      alert("Please fill in all required fields.");
      return;
    }

    // Update parent component with form data
    onUpdate({
      companyName: formData.companyName,
      contactName: formData.contactName,
      phoneNumber: formData.phoneNumber,
      address: formData.address,
      efdaLicenseUrl: formData.efdaLicense?.url,
      businessLicenseUrl: formData.businessLicense?.url,
    });

    onNext();
  };

  const handleEFDAUpload = async (file) => {
    console.log("EFDA uploaded:", file);
    let uploadResult = await uploadSingle(file);
    setFormData((prev) => ({ ...prev, efdaLicense: uploadResult.fileUrl }));
    onEFDAUpload(uploadResult.fileUrl);
  };

  const handleLicenseUpload = async (file) => {
    console.log("License uploaded:", file);
    let uploadResult = await uploadSingle(file);
    setFormData((prev) => ({ ...prev, businessLicense: uploadResult.fileUrl }));
    onLicenseUpload(uploadResult.fileUrl);
  };
  const handleEFDARemove = async (file) => {
    console.log("EFDA Removed:" , formData.efdaLicense );
    await deleteFile(formData.efdaLicense.url);
    setFormData((prev) => ({ ...prev, efdaLicense: null}));
    onEFDAUpload('');
  };

  const handleLicenseRemove = async (file) => {
    console.log("License Removed:");
    await deleteFile(formData.businessLicense.url);
    setFormData((prev) => ({ ...prev, businessLicense: null }));
    onLicenseUpload('');
  };


  const isValidEthiopianPhone = (phone) => {
    const digitsOnly = phone.replace(/\D/g, "");
    return (
      digitsOnly.length === 10 &&
      (digitsOnly.startsWith("09") || digitsOnly.startsWith("07"))
    );
  };

  const isFormValid =
    formData.companyName &&
    formData.contactName &&
    formData.phoneNumber &&
    isValidEthiopianPhone(formData.phoneNumber) &&
    formData.address.street &&
    formData.address.city &&
    formData.address.state &&
    formData.address.country &&
    formData.address.postalCode &&
    formData.address.geoLocationText;

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
            validation="name"
            placeholder="Enter your company name"
            value={formData.companyName}
            onChange={handleChange}
            required={true}
          />
          <TextInput
            name="contactName"
            label="Contact Person"
            validation="name"
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
            label="Phone Number (09/07...)"
            validation="phoneEthiopia"
            placeholder="0912345678"
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
              validation="name"
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
              validation="name"
              label="State/Province"
              className="mb-4"
              placeholder="Enter state/province"
              value={formData.address.state}
              onChange={handleAddressChange}
              required={true}
            />
            <TextInput
              name="country"
              label="Country (Ethiopia fixed)"
              className="mb-4"
              placeholder="Enter country"
              value={formData.address.country}
              onChange={handleAddressChange}
              isDesabled={true}
            />
            <TextInput
              name="postalCode"
              label="Postal Code"
              validation="numeric"
              className="mb-4"
              placeholder="Enter postal code"
              value={formData.address.postalCode}
              onChange={handleAddressChange}
              required={true}
            />
            <AddressInput
              label="Geolocation"
              className="mb-4"
              placeholder="Enter geolocation"
              name="geoLocationText"
              value={formData.address?.geoLocationText}
              onChange={handleGeoLocationTextChange}
              onGeoLocationChange={handleGeoLocationChange}
              required={true}
            />
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-md font-medium mb-2">
            Licenses & Certifications
          </h3>
          <div className="grid md:grid-cols-2 md:gap-4">
            <FileUploader
              label="EFDA Registration"
              multiple={false}
              accept="image/png,image/jpeg,application/pdf"
              onFileUpload={handleEFDAUpload}
              onRemoveFile={handleEFDARemove}
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
              onRemoveFile={handleLicenseRemove}
              initialFiles={formData.businessLicense}
              showPreview={true}
              required={true}
              previewType="document"
              className="mb-4"
            />
          </div>
        </div>

        <StepButtons
          onNext={isFormValid && handleSubmit}
          onPrevious={onPrevious}
          isLoading={isLoading || imageUploading}
          
        />
      </form>
    </div>
  );
}
