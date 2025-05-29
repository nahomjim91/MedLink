import React, { useState } from 'react';
import { X, Star, Pill, Syringe, Package, Calendar, MapPin, Building2 } from 'lucide-react';

// Mock Image component - replace with your actual Image import
const Image = ({ src, alt, fill, className }) => (
  <img
    src={src}
    alt={alt}
    className={`${fill ? "w-full h-full object-cover" : ""} ${className}`}
  />
);

const MiniProductDetail = ({ isOpen, onClose, productData }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!isOpen || !productData) return null;

  const isDrugProduct = productData.productType === "DRUG";
  const ProductIcon = isDrugProduct ? Pill : Syringe;

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  const InfoRow = ({ icon: Icon, label, value }) => (
    <div className="flex items-center gap-2 py-2">
      <Icon size={16} className="text-gray-500 flex-shrink-0" />
      <span className="text-sm font-medium text-gray-700 min-w-0 flex-shrink-0">{label}:</span>
      <span className="text-sm text-gray-600 truncate">{value || "N/A"}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <ProductIcon size={20} className="text-blue-500" />
            <h2 className="text-xl font-bold text-gray-900">Product Details</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col lg:flex-row h-full max-h-[calc(90vh-80px)]">
          {/* Left side - Images */}
          <div className="w-full lg:w-1/2 p-4 border-r border-gray-200">
            {/* Main image */}
            <div className="aspect-square w-full bg-gray-100 rounded-lg mb-4 overflow-hidden">
              {productData.imageList && productData.imageList.length > 0 ? (
                <Image
                  src={productData.imageList[currentImageIndex]}
                  alt={productData.name}
                  fill
                  className="w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ProductIcon size={64} className="text-gray-400" />
                </div>
              )}
            </div>

            {/* Image thumbnails */}
            {productData.imageList && productData.imageList.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {productData.imageList.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                      currentImageIndex === index ? 'border-blue-500' : 'border-gray-200'
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`${productData.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right side - Details */}
          <div className="w-full lg:w-1/2 overflow-y-auto">
            <div className="p-4">
              {/* Product title and rating */}
              <div className="mb-4">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {productData.name} {isDrugProduct && productData.concentration}
                </h1>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-600 ml-1">4.5</span>
                  </div>
                  <span className="text-sm text-gray-500">• 1238 Sold</span>
                </div>
                <div className="text-lg font-bold text-gray-900">
                  ${productData.lowestPrice?.toFixed(2) || "0.00"}
                  {productData.batches.length > 1 && (
                    <span className="text-sm text-gray-500 font-normal ml-1">
                      - ${Math.max(...productData.batches.map(b => b.sellingPrice || 0)).toFixed(2)}
                    </span>
                  )}
                </div>
              </div>

              {/* Basic info */}
              <div className="space-y-1 mb-4 pb-4 border-b border-gray-200">
                <InfoRow icon={Package} label="Category" value={productData.category} />
                
                {isDrugProduct ? (
                  <>
                    <InfoRow icon={Package} label="Package Type" value={productData.packageType} />
                    <InfoRow icon={Building2} label="Manufacturer" value={productData.batches?.[0]?.manufacturer} />
                    <InfoRow icon={MapPin} label="Country" value={productData.batches?.[0]?.manufacturerCountry} />
                  </>
                ) : (
                  <>
                    <InfoRow icon={Package} label="Warranty" value={productData.warrantyInfo} />
                    <InfoRow icon={Package} label="Spare Parts" value={productData.sparePartInfo?.join(", ")} />
                  </>
                )}
                
                <div className="flex items-center gap-2 py-2">
                  <Package size={16} className="text-gray-500 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-700">Total Stock:</span>
                  <span className={`text-sm font-medium ${
                    productData.totalAvailableStock > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {productData.totalAvailableStock} units
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="mb-4 pb-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {productData.description || "No description available."}
                </p>
              </div>

              {/* Available Batches */}
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Available Batches ({productData.batches.length})
                </h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {productData.batches.map((batch, index) => (
                    <div
                      key={batch.batchId || index}
                      className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                    >
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {isDrugProduct && (
                          <div className="flex items-center gap-1">
                            <Calendar size={14} className="text-gray-500" />
                            <span className="text-gray-600">
                              Exp: {formatDate(batch.expiryDate)}
                            </span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-1">
                          <Package size={14} className="text-gray-500" />
                          <span className="text-gray-600">
                            {isDrugProduct 
                              ? `${batch.sizePerPackage || 24}/pack`
                              : `${batch.serialNumbers?.length || 0} units`
                            }
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <span className="text-gray-700 font-medium">
                            Stock: {batch.quantity || 0}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <span className="text-gray-700 font-medium">
                            ${batch.sellingPrice?.toFixed(2) || "0.00"}
                          </span>
                        </div>
                        
                        {batch.manufacturer && (
                          <div className="col-span-2 flex items-center gap-1">
                            <Building2 size={14} className="text-gray-500" />
                            <span className="text-gray-600 text-xs">
                              {batch.manufacturer}, {batch.manufacturerCountry}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Seller info */}
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-1">Seller Information</h4>
                <p className="text-sm text-blue-700">
                  {productData.ownerName || "Unknown Seller"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MiniProductDetail;