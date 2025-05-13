"use client";
import { useState, useEffect, useRef } from "react";
import { StepButtons } from "../Button";
import {
  TextInput,
  SelectInput,
  NumberWithUnitInput,
  TextAreaInput,
  RadioGroup,
} from "../Input";
import { TextField } from "../FormField";

export default function ProductSummaryDrug({
  productData,
  onSubmit,
  onPrevious,
  isLoading,
}) {
  // Create a ref to track if data has been submitted

  const [formData, setFormData] = useState({
    name: productData.name || "",
    category: productData.category || "",
    packageType: productData.packageType || "",
    concentration: productData.concentration || "",
    description: productData.description || "",
    requiresPrescription: productData.requiresPrescription === true,
    imageList: productData.imageList || [],
    batch: {
      batchNumber: productData.batch?.batchNumber || "",
      quantity: productData.batch?.quantity || 0,
      costPrice: productData.batch?.costPrice || 0,
      sellingPrice: productData.batch?.sellingPrice || 0,
      expiryDate: productData.batch?.expiryDate || "",
      sizePerPackage: productData.batch?.sizePerPackage || 0,
      manufacturer: productData.batch?.manufacturer || "",
      manufacturerCountry: productData.batch?.manufacturerCountry || "",
    },
  });

  return (
    <div className="px-6">
      <h2 className="text-xl font-semibold text-secondary/80 mb-2">
        Product Summary{" "}
      </h2>

      <div>
        <h3>T</h3>
        <TextField label="Name" value={productData.name} bigSize={false} />
      </div>

      <StepButtons
        onNext={onSubmit}
        onPrevious={onPrevious}
        isLoading={isLoading}
      />
    </div>
  );
}
