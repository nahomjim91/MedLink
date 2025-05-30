"use client";
import { useState } from "react";
import { StepButtons } from "../Button";
import FileViewer from "../FormField";
import { Info, Printer } from "lucide-react";

export default function ProductSummaryDrug({
  productData,
  onSubmit,
  onPrevious,
  isLoading,
}) {
  // Create state for print mode
  const [isPrintMode, setIsPrintMode] = useState(false);
  
  // Form data from props
  const formData = {
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
      manufactureredDate: productData.batch?.manufactureredDate || "",
    },
  };

  // Calculate days until expiry if expiryDate exists
  const getDaysUntilExpiry = () => {
    if (!formData.batch.expiryDate) return null;
    
    const today = new Date();
    const expiryDate = new Date(formData.batch.expiryDate);
    const diffTime = expiryDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };
  
  const daysUntilExpiry = getDaysUntilExpiry();
  
  // Function to determine expiry status styling
  const getExpiryStatusStyle = () => {
    if (!daysUntilExpiry) return {};
    
    if (daysUntilExpiry <= 30) {
      return { className: "text-red-600 font-semibold", text: "Expiring soon!" };
    } else if (daysUntilExpiry <= 90) {
      return { className: "text-yellow-600 font-semibold", text: "Approaching expiry" };
    } else {
      return { className: "text-green-600", text: "Valid" };
    }
  };
  
  const expiryStatus = getExpiryStatusStyle();
  
  // Calculate profit margin
  const calculateProfitMargin = () => {
    const cost = parseFloat(formData.batch.costPrice);
    const selling = parseFloat(formData.batch.sellingPrice);
    
    if (!cost || cost === 0) return 0;
    
    const margin = ((selling - cost) / selling) * 100;
    return margin.toFixed(2);
  };
  
  const profitMargin = calculateProfitMargin();
  
  // Handler for print mode
  const handlePrintView = () => {
    setIsPrintMode(true);
    setTimeout(() => {
      window.print();
      setIsPrintMode(false);
    }, 300);
  };

  return (
    <div className={`px-6 ${isPrintMode ? 'print-mode' : ''}`}>
      {/* Header with print button */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-secondary/80">
          Product Summary
        </h2>
        <button
          type="button"
          onClick={handlePrintView}
          className="flex items-center text-secondary hover:text-primary text-sm print:hidden"
        >
          <span className="material-icons text-lg mr-1"><Printer /></span>
          Print Summary
        </button>
      </div>
      
      {/* Product Status Banner */}
      <div className="bg-blue-50 border-l-4 border-primary/30 p-4 mb-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <span className="material-icons text-primary"><Info /></span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-primary">Product Summary - Review Before Submission</h3>
            <div className="mt-2 text-sm text-primary">
              <p>Please carefully review all information before finalizing your submission.</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Product Details Section */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-secondary/80 mb-4 border-b border-gray-200 pb-2">
          Product Details
        </h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
              <div className="text-base border border-gray-300 rounded-md p-2 bg-gray-50">
                {formData.name}
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <div className="text-base border border-gray-300 rounded-md p-2 bg-gray-50">
                {formData.category}
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Package Type</label>
              <div className="text-base border border-gray-300 rounded-md p-2 bg-gray-50">
                {formData.packageType}
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Concentration</label>
              <div className="text-base border border-gray-300 rounded-md p-2 bg-gray-50">
                {formData.concentration}
              </div>
            </div>
          </div>
          
          <div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <div className="text-base border border-gray-300 rounded-md p-2 bg-gray-50 min-h-24">
                {formData.description}
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Requires Prescription</label>
              <div className="text-base border border-gray-300 rounded-md p-2 bg-gray-50">
                <span className={formData.requiresPrescription ? "text-amber-600 font-medium" : "text-green-600"}>
                  {formData.requiresPrescription ? "Yes" : "No"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Product Images Section */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-secondary/80 mb-4 border-b border-gray-200 pb-2">
          Product Images
        </h3>
        
        {formData.imageList.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {formData.imageList.map((image, index) => (
              <div key={index} className="relative border border-gray-200 rounded-lg overflow-hidden ">
                <FileViewer fileUrl={image} className="" />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic">No product images available</p>
        )}
      </div>
      
      {/* Inventory Details Section */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-secondary/80 mb-4 border-b border-gray-200 pb-2">
          Inventory Details
        </h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Batch Number</label>
              <div className="text-base border border-gray-300 rounded-md p-2 bg-gray-50">
                {formData.batch.batchNumber}
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <div className="text-base border border-gray-300 rounded-md p-2 bg-gray-50">
                {formData.batch.quantity} units
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Size Per Package</label>
              <div className="text-base border border-gray-300 rounded-md p-2 bg-gray-50">
                {formData.batch.sizePerPackage} units
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer</label>
              <div className="text-base border border-gray-300 rounded-md p-2 bg-gray-50">
                {formData.batch.manufacturer}
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer Country</label>
              <div className="text-base border border-gray-300 rounded-md p-2 bg-gray-50">
                {formData.batch.manufacturerCountry}
              </div>
            </div>
             <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer Date</label>
              <div className="text-base border border-gray-300 rounded-md p-2 bg-gray-50">
                {formData.batch.manufactureredDate}
              </div>
            </div>
          </div>
          
          <div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
              <div className="text-base border border-gray-300 rounded-md p-2 bg-gray-50 flex justify-between items-center">
                <span>{formData.batch.expiryDate}</span>
                {daysUntilExpiry !== null && (
                  <span className={expiryStatus.className}>
                    {expiryStatus.text} ({daysUntilExpiry} days)
                  </span>
                )}
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price</label>
              <div className="text-base border border-gray-300 rounded-md p-2 bg-gray-50">
                ${parseFloat(formData.batch.costPrice).toFixed(2)}
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price</label>
              <div className="text-base border border-gray-300 rounded-md p-2 bg-gray-50">
                ${parseFloat(formData.batch.sellingPrice).toFixed(2)}
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Profit Margin</label>
              <div className="text-base border border-gray-300 rounded-md p-2 bg-gray-50">
                <span className={parseFloat(profitMargin) > 20 ? "text-green-600 font-medium" : "text-amber-600 font-medium"}>
                  {profitMargin}%
                </span>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Inventory Value</label>
              <div className="text-base border border-gray-300 rounded-md p-2 bg-gray-50 font-medium">
                ${(formData.batch.quantity * formData.batch.costPrice).toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Action Buttons - hidden in print mode */}
      <div className="print:hidden">
        <StepButtons
          onNext={onSubmit}
          onPrevious={onPrevious}
          isLoading={isLoading}
          nextLabel="Submit Product"
          previousLabel="Back to Edit"
        />
      </div>
      
      {/* Print-only footer */}
      <div className="hidden print:block mt-8 pt-4 border-t border-gray-300 text-sm text-gray-500">
        <p>Generated on: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
        <p>This is a summary of product details prior to inventory submission.</p>
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