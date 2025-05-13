"use client";
import { useState, useEffect } from "react";
import { StepButtons } from "../Button";
import { TextInput, NumberInput, TextAreaInput, FileInput, SelectInput } from "../Input";

export default function ProductEquipmentInventory({
  productType,
  batchData,
  onUpdate,
  onNext,
  onPrevious,
  isLoading,
}) {
  // Initialize local state from the parent's batchData
  const [localBatchData, setLocalBatchData] = useState({
    quantity: batchData?.quantity || 0,
    costPrice: batchData?.costPrice || 0,
    sellingPrice: batchData?.sellingPrice || 0,
    warrantyInfo: batchData?.warrantyInfo || "",
    serviceSchedule: batchData?.serviceSchedule || "",
    certification: batchData?.certification || null,
    technicalSpecifications: batchData?.technicalSpecifications || "",
    userManuals: batchData?.userManuals || null,
    license: batchData?.license || null,
    serialNumbers: batchData?.serialNumbers || [],
  });

  // Update local state when batchData prop changes
  useEffect(() => {
    if (batchData) {
      setLocalBatchData({
        quantity: batchData.quantity || 0,
        costPrice: batchData.costPrice || 0,
        sellingPrice: batchData.sellingPrice || 0,
        warrantyInfo: batchData.warrantyInfo || "",
        serviceSchedule: batchData.serviceSchedule || "",
        certification: batchData.certification || null,
        technicalSpecifications: batchData.technicalSpecifications || "",
        userManuals: batchData.userManuals || null,
        license: batchData.license || null,
        serialNumbers: batchData.serialNumbers || [],
      });
    }
  }, [batchData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // For number inputs, convert the value to a number
    if (name === "quantity" || name === "costPrice" || name === "sellingPrice") {
      setLocalBatchData((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setLocalBatchData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (name, file) => {
    setLocalBatchData((prev) => ({ ...prev, [name]: file }));
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    // Pass the batch data directly to the parent component
    onUpdate(localBatchData);
    onNext();
  };

  const isFormValid = 
    localBatchData.quantity > 0 &&
    localBatchData.costPrice > 0 &&
    localBatchData.sellingPrice > 0;

  return (
    <div className="px-6">
      <h2 className="text-xl font-semibold text-secondary/80 mb-6">
        Inventory
      </h2>

      <form onSubmit={handleSubmit}>
        {/* Inventory Section */}
        <div className="grid md:grid-cols-3 md:gap-4 mb-6">
          <div>
            <NumberInput
              name="quantity"
              label="Quantity"
              value={localBatchData.quantity}
              onChange={handleChange}
              required={true}
              className="w-full"
              min={0}
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
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 md:gap-4 mb-">
          <div>
            <TextAreaInput
              name="warrantyInfo"
              label="Warranty information"
              value={localBatchData.warrantyInfo}
              onChange={handleChange}
              className="w-full"
              rows={4}
            />
          </div>

          <div>
            <TextAreaInput
              name="serviceSchedule"
              label="Service schedule/maintenance"
              value={localBatchData.serviceSchedule}
              onChange={handleChange}
              className="w-full"
              rows={4}
            />
          </div>
        </div>

        {/* Documentation Section */}
        <h2 className="text-xl font-semibold text-secondary/80 mb-6 border-t border-secondary/20 pt-4">
          Documentation
        </h2>

        <div className="grid md:grid-cols-2 md:gap-4 mb-">
          <div className="flex flex-col">
            <FileInput
              name="certification"
              label="Certification"
              onChange={(file) => handleFileChange("certification", file)}
              acceptTypes="png, jpg, pdf"
              placeholder="png, jpg, pdf"
              className="w-full"
            />
            <div>
            <FileInput
              name="userManuals"
              label="User manuals"
              onChange={(file) => handleFileChange("userManuals", file)}
              acceptTypes="png, jpg, pdf"
              placeholder="png, jpg, pdf"
              className="w-full"
            />
          </div>

          <div>
            <FileInput
              name="license"
              label="License"
              onChange={(file) => handleFileChange("license", file)}
              acceptTypes="png, jpg, pdf"
              placeholder="png, jpg, pdf"
              className="w-full"
            />
          </div>
          </div>

          <div>
            <TextAreaInput
              name="technicalSpecifications"
              label="Technical Specifications"
              value={localBatchData.technicalSpecifications}
              onChange={handleChange}
              className="w-full"
              rows={4}
            />
          </div>
        </div>

          

        <div className="pt-2">
          <StepButtons
            onNext={handleSubmit}
            onPrevious={onPrevious}
            nextDisabled={!isFormValid}
            isLoading={isLoading}
          />
        </div>
      </form>
    </div>
  );
}