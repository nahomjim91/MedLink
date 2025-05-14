"use client";
import { useState, useEffect, useCallback } from "react";
import { StepButtons } from "../Button";
import { TextInput, NumberInput, TextAreaInput, SelectInput } from "../Input";
import { FileUploader } from "../FileUploader";

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
    // Documentation files
    certification: batchData?.certification || null,
    technicalSpecifications: batchData?.technicalSpecifications || "",
    userManuals: batchData?.userManuals || null,
    license: batchData?.license || null,
  });

  // Track validation errors
  const [errors, setErrors] = useState({});

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
        certification: batchData.certification || null,
        technicalSpecifications: batchData.technicalSpecifications || "",
        userManuals: batchData.userManuals || null,
        license: batchData.license || null,
      });
    }
  }, [batchData]);

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
  const handleFileUpload = useCallback((name, files) => {
    setErrors((prev) => ({ ...prev, [name]: null }));

    // Handle single file (our FileUploader always returns an array)
    if (Array.isArray(files) && files.length > 0) {
      setLocalBatchData((prev) => ({
        ...prev,
        [name]: files[0], // Store just the first file
      }));
    } else if (files === null) {
      setLocalBatchData((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  }, []);

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

  // Form validation - memoized to prevent unnecessary re-renders
  const validateForm = useCallback(() => {
    const newErrors = {};

    if (localBatchData.quantity <= 0) {
      newErrors.quantity = "Quantity must be greater than zero";
    }

    if (localBatchData.costPrice <= 0) {
      newErrors.costPrice = "Cost price must be greater than zero";
    }

    if (localBatchData.sellingPrice <= 0) {
      newErrors.sellingPrice = "Selling price must be greater than zero";
    }

    if (localBatchData.sellingPrice < localBatchData.costPrice) {
      newErrors.sellingPrice =
        "Selling price should be greater than or equal to cost price";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [localBatchData]);

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
    return [file]; // FileUploader expects an array
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

          <div className="grid md:grid-cols-3 md:gap-4 mb-6">
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
              />
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
              />
            </div>

            <div>
              <FileUploader
                label="License"
                accept=".pdf,.png,.jpg,.jpeg"
                multiple={false}
                onFileUpload={(files) => handleFileUpload("license", files)}
                initialFiles={getInitialFiles(localBatchData.license)}
                previewType="document"
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="pt-2">
          <StepButtons
            onNext={handleSubmit}
            onPrevious={onPrevious}
            nextDisabled={false} // We'll handle validation on submit
            isLoading={isLoading}
          />
        </div>
      </form>
    </div>
  );
}
