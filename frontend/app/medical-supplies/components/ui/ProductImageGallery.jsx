import Image from "next/image";
import { useState } from "react";
import { Syringe, Pill } from "lucide-react";

export const ProductImageGallery = ({ images = [], type }) => {
  const [selectedImage, setSelectedImage] = useState(images[0] || null);
  
  // Determine which icon to use based on product type
  const isEquipment = type === "EQUIPMENT";
  const ProductIcon = isEquipment ? Syringe : Pill;
  return (
    <div className="w-1/2 pl-4">
      <div className="rounded-md p-4 flex flex-col items-center">
        {/* Main product image */}
        {selectedImage ? (
          <div className="relative w-full h-48 mb-4">
            <Image
              src={selectedImage}
              alt={ `${type} image`}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 400px"
            />
          </div>
        ) : (
          <div className="flex items-center justify-center w-full h-48 mb-4 bg-gray-50">
            <ProductIcon size={80} className="text-gray-400" />
          </div>
        )}

        {/* Thumbnails */}
        <div className="flex gap-2 mt-2">
          {images.length > 0
            ? images.map((image, index) => (
                <div
                  key={index}
                  className={`border rounded p-2 cursor-pointer ${
                    selectedImage === image
                      ? "border-teal-500"
                      : "border-gray-200"
                  }`}
                  onClick={() => setSelectedImage(image)}
                >
                  <div className="relative w-16 h-8">
                    <Image
                      src={image}
                      alt={`${type} thumbnail ${index + 1}`}
                      fill
                      className="object-contain"
                      sizes="64px"
                    />
                  </div>
                </div>
              ))
            : // Placeholder thumbnails with icons if no images
              [1, 2, 3].map((i) => (
                <div key={i} className="border border-gray-200 rounded p-2 flex items-center justify-center">
                  <div className="w-16 h-8 flex items-center justify-center">
                    <ProductIcon size={20} className="text-gray-400" />
                  </div>
                </div>
              ))}
        </div>
      </div>
    </div>
  );
};