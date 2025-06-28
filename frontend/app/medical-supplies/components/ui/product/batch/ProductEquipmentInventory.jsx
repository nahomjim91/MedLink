"use client";
import { useState, useEffect, useCallback } from "react";
import { StepButtons } from "../../Button";
import {
  TextInput,
  NumberInput,
  TextAreaInput,
  SelectInput,
  DateInput,
  EditableFileField,
} from "../../Input";
import { FileUploader } from "../../FileUploader";
import useFileUpload from "../../../../hooks/useFileUpoload";

import { getData } from "country-list";

export default function ProductEquipmentInventory({
  productType,
  batchData,
  onUpdate,
  onNext,
  onPrevious,
  isLoading,
}) {
  // Initialize local state from the parent's batchData with memoized initial state
  const [localBatchData, setLocalBatchData] = useState({
    quantity: batchData?.quantity || 0,
    costPrice: batchData?.costPrice || 0,
    sellingPrice: batchData?.sellingPrice || 0,
    warrantyInfo: batchData?.warrantyInfo || "",
    serviceSchedule: batchData?.serviceSchedule || "",
    serialNumbers: batchData?.serialNumbers || [],
    manufacturer: batchData?.manufacturer || "",
    manufacturerCountry: batchData?.manufacturerCountry || "country1",
    manufactureredDate: batchData?.manufactureredDate || "",
    // Documentation files
    certification: batchData?.certification || null,
    technicalSpecifications: batchData?.technicalSpecifications || "",
    userManuals: batchData?.userManuals || null,
  });

  // Track validation errors
  const [errors, setErrors] = useState({});
  const { deleteFile, uploadSingle, uploading } = useFileUpload();
  const [uploadError, setUploadError] = useState(null);

  // Update local state when batchData prop changes - memoized to prevent unnecessary re-renders
  useEffect(() => {
    if (batchData) {
      setLocalBatchData({
        quantity: batchData.quantity || 0,
        costPrice: batchData.costPrice || 0,
        sellingPrice: batchData.sellingPrice || 0,
        warrantyInfo: batchData.warrantyInfo || "",
        serviceSchedule: batchData.serviceSchedule || "",
        serialNumbers: batchData.serialNumbers || [],
        manufacturer: batchData.manufacturer || "",
        manufacturerCountry: batchData.manufacturerCountry || "country1",
        manufactureredDate: batchData.manufactureredDate || "",
        // Documentation files
        certification: batchData.certification || null,
        technicalSpecifications: batchData.technicalSpecifications || "",
        userManuals: batchData.userManuals || null,
      });
    }
  }, [batchData]);

  // Country options - could be fetched from an API
  const countryOptions = getData().map((country) => ({
    label: country.name,
    value: country.code.toLowerCase(),
  }));

  const validateField = (value) =>
    value !== undefined && value !== "" && value !== null;

  // Add validation state to your useState hooks
  const [validationState, setValidationState] = useState({
    quantity: false,
    costPrice: false,
    sellingPrice: false,
    manufacturer: false,
    manufacturerCountry: false,
    manufactureredDate: false,
    serialNumbers: false,
  });

  // Add validation effect after your existing useEffect
  useEffect(() => {
    setValidationState({
      quantity: localBatchData.quantity > 0,
      costPrice: localBatchData.costPrice > 0,
      sellingPrice:
        localBatchData.sellingPrice > 0 &&
        localBatchData.sellingPrice >= localBatchData.costPrice,
      manufacturer: validateField(localBatchData.manufacturer),
      manufacturerCountry: validateField(localBatchData.manufacturerCountry),
      manufactureredDate: validateField(localBatchData.manufactureredDate),
      serialNumbers:
        localBatchData.serialNumbers && localBatchData.serialNumbers.length > 0,
    });
  }, [localBatchData]);

  // Update your validateForm function to use the validation state
  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!validationState.quantity) {
      newErrors.quantity = "Quantity must be greater than zero";
    }

    if (!validationState.costPrice) {
      newErrors.costPrice = "Cost price must be greater than zero";
    }

    if (!validationState.sellingPrice) {
      if (localBatchData.sellingPrice <= 0) {
        newErrors.sellingPrice = "Selling price must be greater than zero";
      } else if (localBatchData.sellingPrice < localBatchData.costPrice) {
        newErrors.sellingPrice =
          "Selling price should be greater than or equal to cost price";
      }
    }

    if (!validationState.manufacturer) {
      newErrors.manufacturer = "Manufacturer is required";
    }

    if (!validationState.manufacturerCountry) {
      newErrors.manufacturerCountry = "Manufacturer country is required";
    }

    if (!validationState.manufactureredDate) {
      newErrors.manufactureredDate = "Manufacturing date is required";
    }

    if (!validationState.serialNumbers) {
      newErrors.serialNumbers = "At least one serial number is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [localBatchData, validationState]);

  // Check if form is valid for button state
  const isFormValid = Object.values(validationState).every(Boolean);

  // Handle input field changes - memoized to prevent unnecessary re-renders
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    // Clear the error for this field when the user is typing
    setErrors((prev) => ({ ...prev, [name]: null }));

    // For number inputs, convert the value to a number
    if (
      name === "quantity" ||
      name === "costPrice" ||
      name === "sellingPrice"
    ) {
      setLocalBatchData((prev) => ({
        ...prev,
        [name]: parseFloat(value) || 0,
      }));
    } else {
      setLocalBatchData((prev) => ({ ...prev, [name]: value }));
    }
  }, []);

  // Handle file uploads - memoized to prevent unnecessary re-renders
const handleFileUpload = useCallback(
  async (name, files) => {
    if (!files || (Array.isArray(files) && files.length === 0)) {
      // Handle file removal
      setLocalBatchData((prev) => ({
        ...prev,
        [name]: null,
      }));
      return;
    }

    setUploadError(null);
    setErrors((prev) => ({ ...prev, [name]: null }));

    try {
      const file = Array.isArray(files) ? files[0] : files;
      
      // Get current file from state and delete if exists
      setLocalBatchData((prev) => {
        // Delete existing file if present
        if (prev[name]) {
          console.log('Deleting existing file:', prev[name]);
          deleteFile(prev[name]).catch(console.error); // Handle deletion async
        }
        return prev; // Return unchanged state for now
      });

      // Upload new file
      const uploadResponse = await uploadSingle(file);

      if (uploadResponse) {
        // Store the server response (file URL/name) in local state
        setLocalBatchData((prev) => ({
          ...prev,
          [name]: uploadResponse.fileUrl
        }));
      }
    } catch (error) {
      console.error("Upload failed:", error);
      setUploadError(error.message || "Upload failed");

      // Clear the file on error
      setLocalBatchData((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  },
  [uploadSingle, deleteFile] // Add deleteFile to dependencies
);

  const handleFileRemove = useCallback(
    async (name, fileName) => {
      if (!fileName) return;

      try {
        setUploadError(null);

        // Try to delete from server
        await deleteFile(fileName);

        // Clear from local state
        setLocalBatchData((prev) => ({
          ...prev,
          [name]: null,
        }));
      } catch (error) {
        console.error("Delete failed:", error);
        setUploadError(error.message || "Failed to delete file");

        // Still clear from local state even if server delete failed
        setLocalBatchData((prev) => ({
          ...prev,
          [name]: null,
        }));
      }
    },
    [deleteFile]
  );

  // Handle serial numbers input - memoized to prevent unnecessary re-renders
  const handleSerialNumbersChange = useCallback((e) => {
    const value = e.target.value;

    // Split by commas or new lines
    const serialList = value
      .split(/[,\n]/)
      .map((serial) => serial.trim())
      .filter((serial) => serial !== "");

    setLocalBatchData((prev) => ({
      ...prev,
      serialNumbers: serialList,
    }));

    setErrors((prev) => ({ ...prev, serialNumbers: null }));
  }, []);

  // Submit form handler - memoized to prevent unnecessary re-renders
  const handleSubmit = useCallback(
    (e) => {
      if (e) e.preventDefault();

      if (validateForm()) {
        // Pass the batch data directly to the parent component
        onUpdate(localBatchData);
        onNext();
      }
    },
    [localBatchData, onUpdate, onNext, validateForm]
  );

  // Calculate profit margin to display to the user
  const profitMargin =
    localBatchData.costPrice > 0
      ? (
          ((localBatchData.sellingPrice - localBatchData.costPrice) /
            localBatchData.sellingPrice) *
          100
        ).toFixed(2)
      : 0;

  // Prepare file upload initial state properly
  const getInitialFiles = useCallback((file) => {
    if (!file) return [];
    // If file is a string (uploaded file URL/name), don't show in preview
    // FileUploader preview is only for local files before upload
    if (typeof file === "string") return [];
    return [file]; // FileUploader expects an array for local files
  }, []);

  return (
    <div className="px-6">
      <h2 className="text-xl font-semibold text-secondary/80 mb-4">
        Equipment Inventory Details
      </h2>

      <p className="text-gray-600 mb-6">
        Enter inventory information and documentation for your equipment
        product.
      </p>

      <form onSubmit={handleSubmit}>
        {/* Inventory Section */}
        <div className="mb-8">
          <h3 className="text-lg font-medium text-secondary/70 mb-4">
            Inventory Information
          </h3>

          <div className="grid md:grid-cols-3 md:gap-4 mb-6">
            <div>
              <NumberInput
                name="quantity"
                label="Quantity"
                value={localBatchData.quantity}
                onChange={handleChange}
                required={true}
                className="w-full"
                min={1}
                error={errors.quantity}
              />
            </div>

            <div>
              <NumberInput
                name="costPrice"
                label="Cost price"
                value={localBatchData.costPrice}
                onChange={handleChange}
                required={true}
                className="w-full"
                min={0}
                prefix="$"
                error={errors.costPrice}
              />
            </div>

            <div>
              <NumberInput
                name="sellingPrice"
                label="Selling price"
                value={localBatchData.sellingPrice}
                onChange={handleChange}
                required={true}
                className="w-full"
                min={0}
                prefix="$"
                error={errors.sellingPrice}
                // helpText={`Profit margin: ${profitMargin}%`}
              />
            </div>
          </div>

          {/* Manufacturer Information */}
          <div className="grid md:grid-cols-2 md:gap-4">
            <TextInput
              name="manufacturer"
              label="Manufacturer"
              placeholder="Manufacturer name"
              value={localBatchData.manufacturer}
              onChange={handleChange}
              validation="name"
              required={true}
              className="w-full"
            />

            <SelectInput
              name="manufacturerCountry"
              label="Manufacturer Country"
              placeholder="Select country"
              value={localBatchData.manufacturerCountry}
              onChange={handleChange}
              required={true}
              options={countryOptions}
            />
          </div>
          <div className="grid md:grid-cols-2 md:gap-4">
            <DateInput
              name="manufactureredDate"
              label="Manufactured Date"
              placeholder="mm/dd/yyyy"
              value={localBatchData.manufactureredDate}
              onChange={handleChange}
              required={true}
              className="w-full"
              max={new Date().toISOString().split("T")[0]}
              // helpText="Short expiry products will be visually flagged"
            />
          </div>

          <div className="mb-6">
            <TextAreaInput
              name="serialNumbers"
              label="Serial Numbers"
              placeholder="Enter serial numbers separated by commas or new lines"
              value={localBatchData.serialNumbers.join("\n")}
              onChange={handleSerialNumbersChange}
              className="w-full"
              rows={3}
              // helpText={`${localBatchData.serialNumbers.length} serial numbers entered`}
              error={errors.serialNumbers}
            />
          </div>

          <div className="grid md:grid-cols-2 md:gap-4 mb-6">
            <div>
              <TextAreaInput
                name="warrantyInfo"
                label="Warranty Information"
                value={localBatchData.warrantyInfo}
                onChange={handleChange}
                className="w-full"
                rows={3}
                placeholder="e.g., 2 years manufacturer warranty"
              />
            </div>

            <div>
              <TextAreaInput
                name="serviceSchedule"
                label="Service Schedule/Maintenance"
                value={localBatchData.serviceSchedule}
                onChange={handleChange}
                className="w-full"
                rows={3}
                placeholder="e.g., Annual calibration required"
              />
            </div>
          </div>
        </div>

        {/* Documentation Section */}
        <div className="mb-8 border-t border-secondary/20 pt-6">
          <h3 className="text-lg font-medium text-secondary/70 mb-4">
            Technical Documentation
          </h3>

          {/* Show upload error if any */}
          {uploadError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {uploadError}
            </div>
          )}

          {/* Show uploading status */}
          {uploading && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded mb-4">
              Uploading file... Please wait.
            </div>
          )}

          <div className="mb-6">
            <TextAreaInput
              name="technicalSpecifications"
              label="Technical Specifications"
              value={localBatchData.technicalSpecifications}
              onChange={handleChange}
              className="w-full"
              rows={4}
              placeholder="Enter detailed technical specifications for this equipment"
            />
          </div>

          <div className="grid md:grid-cols-2 md:gap-4 mb-6">
            <div>
              <FileUploader
                label="Certification"
                accept=".pdf,.png,.jpg,.jpeg"
                multiple={false}
                onFileUpload={(files) =>
                  handleFileUpload("certification", files)
                }
                initialFiles={getInitialFiles(localBatchData.certification)}
                previewType="document"
                className="w-full"
                disabled={uploading}
              />

              {/* Show uploaded file info */}
              {localBatchData.certification &&
                typeof localBatchData.certification === "string" && (
                  <div className="mt-2 p-2 bg-gray-50 rounded flex items-center justify-between">
                    <span className="text-sm text-gray-700 truncate">
                      {localBatchData.certification.split("/").pop()}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleFileRemove(
                          "certification",
                          localBatchData.certification
                        )
                      }
                      disabled={uploading}
                      className="text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      {uploading ? "Processing..." : "Remove"}
                    </button>
                  </div>
                )}
            </div>

            <div>
              <FileUploader
                label="User Manuals"
                accept=".pdf,.docx,.doc"
                multiple={false}
                onFileUpload={(files) => handleFileUpload("userManuals", files)}
                initialFiles={getInitialFiles(localBatchData.userManuals)}
                previewType="document"
                className="w-full"
                disabled={uploading}
              />

              {/* Show uploaded file info */}
              {localBatchData.userManuals &&
                typeof localBatchData.userManuals === "string" && (
                  <div className="mt-2 p-2 bg-gray-50 rounded flex items-center justify-between">
                    <span className="text-sm text-gray-700 truncate">
                      {localBatchData.userManuals.split("/").pop()}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleFileRemove(
                          "userManuals",
                          localBatchData.userManuals
                        )
                      }
                      disabled={uploading}
                      className="text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      {uploading ? "Processing..." : "Remove"}
                    </button>
                  </div>
                )}
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="pt-2">
          <StepButtons
            onNext={isFormValid && handleSubmit}
            onPrevious={onPrevious}
            nextDisabled={uploading || !isFormValid} // Disable next while uploading
            isLoading={isLoading || uploading} // Include upload loading state
          />
        </div>
      </form>
    </div>
  );
}
