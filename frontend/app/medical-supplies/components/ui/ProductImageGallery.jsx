"use client";
import Image from "next/image";
import { useState, useRef } from "react";
import { Syringe, Pill, Upload, Trash, Plus, X } from "lucide-react";



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
export const EditableImageGallery = ({ 
  images = [], 
  type, 
  isEditing = false, 
  onUpload, 
  onRemove,
  removedImages = []
}) => {
  const [selectedImage, setSelectedImage] = useState(images[0] || null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  
  // Determine which icon to use based on product type
  const isEquipment = type === "EQUIPMENT";
  const ProductIcon = isEquipment ? Syringe : Pill;

  // Function to handle file selection
  const handleFileSelect = async (e) => {
    const files = e.target.files;
    if (!files.length) return;
    
    setUploading(true);
    
    try {
      // In a real application, you would upload these files to your server or cloud storage
      // This is a mock implementation that simulates an upload
      // Replace this with your actual image upload API call
      
      const uploadedUrls = await Promise.all(
        Array.from(files).map(async (file) => {
          // Simulate API call with a delay
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Create a temporary URL for the file
          // In a real app, this would be the URL returned by your upload service
          return URL.createObjectURL(file);
          
          // Example of how a real upload might look:
          // const formData = new FormData();
          // formData.append('file', file);
          // const response = await fetch('/api/upload', {
          //   method: 'POST',
          //   body: formData,
          // });
          // const data = await response.json();
          // return data.url;
        })
      );
      
      // Call the parent component's upload handler with the new URLs
      onUpload(uploadedUrls);
      
      // Select the first uploaded image
      if (uploadedUrls.length > 0 && !selectedImage) {
        setSelectedImage(uploadedUrls[0]);
      }
      
    } catch (error) {
      console.error("Error uploading images:", error);
      alert("Failed to upload images. Please try again.");
    } finally {
      setUploading(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Handle removing an image
  const handleRemoveImage = (image) => {
    onRemove(image);
    
    // If we're removing the currently selected image, select another one
    if (selectedImage === image) {
      const remainingImages = images.filter(img => 
        img !== image && !removedImages.includes(img)
      );
      setSelectedImage(remainingImages[0] || null);
    }
  };

  // Get the effective list of images (accounting for removals)
  const effectiveImages = images.filter(img => !removedImages.includes(img));

  return (
    <div className="rounded-md p-4 flex flex-col items-center">
      {/* Main product image */}
      {selectedImage ? (
        <div className="relative w-full h-48 mb-4">
          <Image
            src={selectedImage}
            alt={`${type} image`}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 400px"
          />
          {isEditing && (
            <button
              className="absolute top-2 right-2 bg-red-500 rounded-full p-1 text-white hover:bg-red-600"
              onClick={() => handleRemoveImage(selectedImage)}
            >
              <Trash size={16} />
            </button>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center w-full h-48 mb-4 bg-gray-50">
          <ProductIcon size={80} className="text-gray-400" />
        </div>
      )}

      {/* Thumbnails */}
      <div className="flex flex-wrap gap-2 mt-2">
        {effectiveImages.length > 0
          ? effectiveImages.map((image, index) => (
              <div
                key={index}
                className={`relative border rounded p-2 cursor-pointer ${
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
                {isEditing && (
                  <button
                    className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 text-white hover:bg-red-600"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent clicking the parent
                      handleRemoveImage(image);
                    }}
                  >
                    <X size={10} />
                  </button>
                )}
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
            
        {/* Upload button */}
        {isEditing && (
          <>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              ref={fileInputRef}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className={`border ${
                uploading ? "border-gray-300 bg-gray-100" : "border-teal-500 hover:bg-teal-50"
              } rounded p-2 flex items-center justify-center h-[40px] min-w-[40px]`}
            >
              {uploading ? (
                <span className="text-xs text-gray-500">Uploading...</span>
              ) : (
                <Plus size={20} className="text-teal-500" />
              )}
            </button>
          </>
        )}
      </div>
      
      {/* Upload area (visible in edit mode) */}
      {isEditing && (
        <div 
          className={`mt-4 border-2 border-dashed ${
            uploading ? "border-gray-300 bg-gray-50" : "border-teal-300 hover:border-teal-500"
          } rounded-lg p-4 w-full text-center cursor-pointer`}
          onClick={() => !uploading && fileInputRef.current?.click()}
        >
          <Upload className="mx-auto h-8 w-8 text-teal-500 mb-2" />
          <p className="text-sm text-gray-500">
            {uploading ? "Uploading..." : "Click or drag images here to upload"}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Supported formats: JPG, PNG, GIF
          </p>
        </div>
      )}
    </div>
  );
};