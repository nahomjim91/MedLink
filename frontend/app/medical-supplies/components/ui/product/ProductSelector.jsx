"use client";
import React, { useCallback } from "react";
import { StepButtons } from "../Button";
import IconCard from "../Card";
import { TextDivider } from "../Input";
import {  Pill,  Syringe } from "lucide-react";

export default function ProductSelector({ selectedType, onTypeSelect, onNext }) {
  const [error, setError] = React.useState(null);
   const handleNext = useCallback(() => {
    setError(null);
    
    if (!selectedType) {
      setError("Please select a product type to continue.");
      return;
    }
    
    onNext();
  }, [selectedType, onNext]);
  return (
    <div className="px-6">
      <div className="mb-10 md:mb-3">
        <h2 className="text-xl font-semibold text-secondary/80 mb-2">
          Product Type
        </h2>
       
      </div>
      {error && (
        <div className="text-red-500 text-sm mb-4">
          {error}
        </div>
      )}

      <div className="flex justify-around py-6 ">
        <IconCard
          icon={<Pill size={96} />}
          label="Drug"
          onClick={() => onTypeSelect("DRUG")}
          isSelected={selectedType === "DRUG"}
          isLarge={true}
        />
        <IconCard
          icon={<Syringe size={96} />}
          label="Equipment"
          onClick={() => onTypeSelect("EQUIPMENT")}
          isSelected={selectedType === "EQUIPMENT"}
          isLarge={true}
        />
        
      </div>

     
      <StepButtons showPrevious={false} onNext={handleNext} />
    </div>
  );
}