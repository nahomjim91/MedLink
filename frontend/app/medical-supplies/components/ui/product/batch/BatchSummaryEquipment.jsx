"use client";
import { useState } from "react";
import { StepButtons } from "../../Button";
import FileViewer from "../../FormField";
import { Info, Printer } from "lucide-react";

export default function BatchSummaryEquipment({
  batch,
  onSubmit,
  onPrevious,
  isLoading,
}) {
  // Create state for print mode
  const [isPrintMode, setIsPrintMode] = useState(false);

  // Create object for form data from productData props
  const formData = {
    quantity: batch?.quantity || 0,
    costPrice: batch?.costPrice || 0,
    sellingPrice: batch?.sellingPrice || 0,
    warrantyInfo: batch?.warrantyInfo || "",
    serviceSchedule: batch?.serviceSchedule || "",
    certification: batch?.certification || null,
    technicalSpecifications: batch?.technicalSpecifications || "",
    userManuals: batch?.userManuals || null,
    license: batch?.license || null,
    serialNumbers: batch?.serialNumbers || [],
    manufacturerCountry: batch?.manufacturerCountry || "",
    manufacturer: batch?.manufacturer || "",
    manufacturedDate: batch?.manufactureredDate || "",
  };

  // Calculate profit margin
  const calculateProfitMargin = () => {
    const cost = parseFloat(formData.costPrice);
    const selling = parseFloat(formData.sellingPrice);

    if (!cost || cost === 0) return 0;

    const margin = ((selling - cost) / selling) * 100;
    return margin.toFixed(2);
  };

  const profitMargin = calculateProfitMargin();

  // Calculate total inventory value
  const calculateInventoryValue = () => {
    return (
      parseFloat(formData.costPrice) * parseFloat(formData.quantity)
    ).toFixed(2);
  };

  // Handler for print mode
  const handlePrintView = () => {
    setIsPrintMode(true);
    setTimeout(() => {
      window.print();
      setIsPrintMode(false);
    }, 300);
  };

  return (
    <div className={`px-6 ${isPrintMode ? "print-mode" : ""}`}>
      {/* Header with print button */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-secondary/80">
          Equipment Batch Summary
        </h2>
        <button
          type="button"
          onClick={handlePrintView}
          className="flex items-center text-secondary hover:text-primary text-sm print:hidden"
        >
          <span className="material-icons text-lg mr-1">
            <Printer />
          </span>
          Print Summary
        </button>
      </div>

      {/* Review Banner */}
      <div className="bg-blue-50 border-l-4 border-primary/50 p-4 mb-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <span className="material-icons text-primary">
              <Info />
            </span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-primary">
              Equipment Batch Summary - Review Before Submission
            </h3>
            <div className="mt-2 text-sm text-primary">
              <p>
                Please carefully review all equipment information before
                finalizing your submission.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Details Section */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-secondary/80 mb-4 border-b border-gray-200 pb-2">
          Batch Details
        </h3>

        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white p-4 border rounded-lg shadow-sm">
            <h4 className="text-sm font-medium text-gray-500 mb-1">Quantity</h4>
            <p className="text-2xl font-bold text-gray-800">
              {formData.quantity}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Total units in inventory
            </p>
          </div>

          <div className="bg-white p-4 border rounded-lg shadow-sm">
            <h4 className="text-sm font-medium text-gray-500 mb-1">
              Cost Price
            </h4>
            <p className="text-2xl font-bold text-gray-800">
              ${parseFloat(formData.costPrice).toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Per unit</p>
          </div>

          <div className="bg-white p-4 border rounded-lg shadow-sm">
            <h4 className="text-sm font-medium text-gray-500 mb-1">
              Selling Price
            </h4>
            <p className="text-2xl font-bold text-gray-800">
              ${parseFloat(formData.sellingPrice).toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Per unit</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white p-4 border rounded-lg shadow-sm">
            <h4 className="text-sm font-medium text-gray-500 mb-1">
              Profit Margin
            </h4>
            <p className="text-2xl font-bold text-gray-800">
              <span
                className={
                  parseFloat(profitMargin) > 20
                    ? "text-green-600"
                    : "text-amber-600"
                }
              >
                {profitMargin}%
              </span>
            </p>
            <p className="text-xs text-gray-500 mt-1">Per unit</p>
          </div>

          <div className="bg-white p-4 border rounded-lg shadow-sm">
            <h4 className="text-sm font-medium text-gray-500 mb-1">
              Total Inventory Value
            </h4>
            <p className="text-2xl font-bold text-gray-800">
              ${calculateInventoryValue()}
            </p>
            <p className="text-xs text-gray-500 mt-1">Based on cost price</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Warranty Information
              </label>
              <div className="text-base border border-gray-300 rounded-md p-2 bg-gray-50 min-h-20">
                {formData.warrantyInfo || "No warranty information provided"}
              </div>
            </div>
          </div>

          <div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Service Schedule/Maintenance
              </label>
              <div className="text-base border border-gray-300 rounded-md p-2 bg-gray-50 min-h-20">
                {formData.serviceSchedule || "No service schedule provided"}
              </div>
            </div>
          </div>
        </div>

        {formData.serialNumbers.length > 0 && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Serial Numbers
            </label>
            <div className="text-base border border-gray-300 rounded-md p-2 bg-gray-50">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {formData.serialNumbers.map((serial, index) => (
                  <div key={index} className="text-sm bg-gray-100 p-1 rounded">
                    {serial}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* manufacturere details */}
      <div className="grid md:grid-cols-3 gap-6">
        <div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Manufacturered By
            </label>
            <div className="text-base border border-gray-300 rounded-md p-2 bg-gray-50 min-h-20">
              {formData.manufacturer ||
                "No manufacturered information provided"}
            </div>
          </div>
        </div>

        <div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Manufactured Date
            </label>
            <div className="text-base border border-gray-300 rounded-md p-2 bg-gray-50 min-h-20">
              {formData.manufacturedDate || "No manufactured date provided"}
            </div>
          </div>
        </div>
        <div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Manufactured Country
            </label>
            <div className="text-base border border-gray-300 rounded-md p-2 bg-gray-50 min-h-20">
              {formData.manufacturerCountry || "No manufactured date provided"}
            </div>
          </div>
        </div>
      </div>

      {/* Documentation Section */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-secondary/80 mb-4 border-b border-gray-200 pb-2">
          Documentation
        </h3>

        <div className="grid md:grid-cols-3 gap-6">
          {formData.certification && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Certification
              </label>
              <div className="border border-gray-300 rounded-md p-2 bg-gray-50">
                <FileViewer fileUrl={formData.certification} />
              </div>
            </div>
          )}

          {formData.userManuals && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                User Manuals
              </label>
              <div className="border border-gray-300 rounded-md p-2 bg-gray-50">
                <FileViewer fileUrl={formData.userManuals} />
              </div>
            </div>
          )}

          {formData.license && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                License
              </label>
              <div className="border border-gray-300 rounded-md p-2 bg-gray-50">
                <FileViewer fileUrl={formData.license} />
              </div>
            </div>
          )}
        </div>

        {formData.technicalSpecifications && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Technical Specifications
            </label>
            <div className="text-base border border-gray-300 rounded-md p-2 bg-gray-50">
              {formData.technicalSpecifications}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons - hidden in print mode */}
      <div className="print:hidden">
        <StepButtons
          onNext={onSubmit}
          onPrevious={onPrevious}
          isLoading={isLoading}
          nextLabel="Submit Equipment"
          previousLabel="Back to Edit"
        />
      </div>

      {/* Print-only footer */}
      <div className="hidden print:block mt-8 pt-4 border-t border-gray-300 text-sm text-gray-500">
        <p>
          Generated on: {new Date().toLocaleDateString()} at{" "}
          {new Date().toLocaleTimeString()}
        </p>
        <p>
          This is a summary of equipment details prior to inventory submission.
        </p>
      </div>

      {/* Add print styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: visible;
          }
          .print-mode {
            visibility: visible;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
