import React, { useState } from 'react';
import { X, Pill, Syringe } from "lucide-react";
import MiniProductDetail from '../../modal/MiniProductDetail';
import useProductContext from '../../../hooks/useProduct';
import Image from 'next/image';

export const ProductContextCard = ({
  productData,
  onRemove,
  isPreview = false,
  imageSize = "h-16 w-16",
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Get full product data for the modal
  const { fullProductData, loading } = useProductContext(productData?.productId);

  if (!productData) return null;

  const isEquipment = productData.productType === "EQUIPMENT";
  const ProductIcon = isEquipment ? Syringe : Pill;

  const handleCardClick = (e) => {
    // Prevent modal from opening if remove button was clicked
    if (e.target.closest('[data-remove-button]')) {
      return;
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <div
        className={` ${isPreview ? "p-2" : "p-4"} border border-gray-200 bg-white/20 flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition-colors ${
          isPreview ? "border-b" : "rounded-lg mb-1"
        }`}
        onClick={!isPreview && handleCardClick}
      >
        {/* Product Image/Icon */}
        {productData.imageUrl ? (
          <div className={`relative ${isPreview ? "h-14 w-14" : imageSize } flex-shrink-0`}>
            <Image
              src={process.env.NEXT_PUBLIC_MEDICAL_SUPPLIES_API_URL+productData.imageUrl}
              alt={`${productData.productType} image`}
              fill
              className="object-contain rounded"
            />
          </div>
        ) : (
          <div
            className={`flex items-center justify-center ${isPreview ? "h-10 w-10" : imageSize }  flex-shrink-0 bg-primary/5 rounded-lg border border-primary/10`}
          >
            <ProductIcon size={24} className="text-primary" />
          </div>
        )}

        {/* Product Info */}
        <div className={`flex-1 min-w-0 ${isPreview ? "flex gap-2 items-center " : ""}`}>
          <h3 className={`font-semibold text-gray-900 text-base ${!isPreview ?"mb-1" : ""} truncate`}>
            {productData.title}
          </h3>
          <p className="font-bold text-lg text-gray-900">
            ${productData.price?.toFixed(2) || "0.00"}
          </p>
          {productData.category && (
            <p className={`text-sm text-gray-500 ${!isPreview ?"mt-1" : ""}`}>{productData.category}</p>
          )}
        </div>

        {/* Stock Status */}
        <div className="flex-shrink-0 text-right">
          <p
            className={`text-sm font-medium ${
              productData.stock > 0 ? "text-teal-500" : "text-red-500"
            }`}
          >
            {productData.stock > 0
              ? `${productData.stock} In Stock`
              : "Out of Stock"}
          </p>
        </div>

        {/* Remove Button */}
        {onRemove && (
          <button
            data-remove-button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="p-1 hover:bg-gray-100 rounded-full flex-shrink-0 ml-2"
          >
            <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {/* Mini Product Detail Modal */}
      <MiniProductDetail
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        productData={fullProductData}
      />
    </>
  );
};

