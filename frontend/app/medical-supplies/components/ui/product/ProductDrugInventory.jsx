"use client";
import { useState, useEffect } from "react";
import { StepButtons } from "../Button";
import { TextInput, NumberInput, DateInput, FileInput, SelectInput } from "../Input";

export default function ProductDrugInventory({
  productData,
  onUpdate,
  onNext,
  onPrevious,
  isLoading,
}) {
  // Initialize local state from the parent's productData.batch
  const [batchData, setBatchData] = useState({
    batchNumber: productData.batch?.batchNumber || "",
    expiryDate: productData.batch?.expiryDate || "",
    quantity: productData.batch?.quantity || 0,
    costPrice: productData.batch?.costPrice || 0,
    sellingPrice: productData.batch?.sellingPrice || 0,
    sizePerPackage: productData.batch?.sizePerPackage || 0,
    manufacturer: productData.batch?.manufacturer || "",
    manufacturerCountry: productData.batch?.manufacturerCountry || "",
    fdaCertificate: productData.batch?.fdaCertificate || null,
    license: productData.batch?.license || null,
  });

  // Update local state when productData prop changes
  useEffect(() => {
    if (productData.batch) {
      setBatchData({
        batchNumber: productData.batch.batchNumber || "",
        expiryDate: productData.batch.expiryDate || "",
        quantity: productData.batch.quantity || 0,
        costPrice: productData.batch.costPrice || 0,
        sellingPrice: productData.batch.sellingPrice || 0,
        sizePerPackage: productData.batch.sizePerPackage || 0,
        manufacturer: productData.batch.manufacturer || "",
        manufacturerCountry: productData.batch.manufacturerCountry || "",
        fdaCertificate: productData.batch.fdaCertificate || null,
        license: productData.batch.license || null,
      });
    }
  }, [productData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // For number inputs, convert the value to a number
    if (name === "quantity" || name === "costPrice" || name === "sellingPrice" || name === "sizePerPackage") {
      setBatchData((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setBatchData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (name, file) => {
    setBatchData((prev) => ({ ...prev, [name]: file }));
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    // Pass the complete batch data to the parent component
    onUpdate(batchData);
    onNext();
  };

  const isFormValid =true
    // batchData.batchNumber &&
    // batchData.expiryDate &&
    // batchData.quantity > 0 &&
    // batchData.costPrice > 0 &&
    // batchData.sellingPrice > 0 &&
    // batchData.sizePerPackage > 0 &&
    // batchData.manufacturer &&
    // batchData.manufacturerCountry;

  return (
    <div className="px-6">
      <h2 className="text-xl font-semibold text-secondary/80 mb-6">
        Inventory
      </h2>

      <form onSubmit={handleSubmit}>
        <div className="grid md:grid-cols-2 md:gap-4">
          <div>
            <TextInput
              name="batchNumber"
              label="Batch number"
              placeholder="#1234567"
              value={batchData.batchNumber}
              onChange={handleChange}
              required={true}
              className="w-full"
            />
          </div>

          <div>
            <DateInput
              name="expiryDate"
              label="Expiration date (visual warning for short dates)"
              placeholder="mm/dd/yyyy"
              value={batchData.expiryDate}
              onChange={handleChange}
              required={true}
              className="w-full"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-3 md:gap-4">
          <div>
            <NumberInput
              name="quantity"
              label="Quantity"
              value={batchData.quantity}
              onChange={handleChange}
              required={true}
              className="w-full"
              min={0}
            />
          </div>

          <div>
            <NumberInput
              name="costPrice"
              label="Cost price (Birr)"
              value={batchData.costPrice}
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
              label="Selling price (Birr)"
              value={batchData.sellingPrice}
              onChange={handleChange}
              required={true}
              className="w-full"
              min={0}
              prefix="$"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 md:gap-4">
          <div>
            <NumberInput
              name="sizePerPackage"
              label="Size per package"
              placeholder="100 tablets per bottle"
              value={batchData.sizePerPackage}
              onChange={handleChange}
              required={true}
              className="w-full"
              min={0}
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 md:gap-4">
          <div>
            <TextInput
              name="manufacturer"
              label="Manufacturer"
              placeholder="Item Name"
              value={batchData.manufacturer}
              onChange={handleChange}
              required={true}
              className="w-full"
            />
          </div>

          <div>
            <SelectInput
              name="manufacturerCountry"
              label="Manufacturer country"
              placeholder="Select country"
              value={batchData.manufacturerCountry}
              onChange={handleChange}
              required={true}
              options={[
                { label: "Country 1", value: "country1" },
                { label: "Country 2", value: "country2" },
                { label: "Country 3", value: "country3" },
              ]}
            />
          </div>
        </div>

        <div className="pt-4">
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