"use client";
import Image from "next/image";
import { useState, useRef , useEffect } from "react";
import { Syringe, Pill, Upload, Trash, Plus, X } from "lucide-react";

export const ProductImageGallery = ({
  images = [],
  type,
  imageSize = "h-48",
}) => {
  const [selectedImage, setSelectedImage] = useState(images[0] || null);

  // Determine which icon to use based on product type
  const isEquipment = type === "EQUIPMENT";
  const ProductIcon = isEquipment ? Syringe : Pill;
  return (
    <div className="pl-4">
      <div className="rounded-md p-4 flex flex-col items-center">
        {/* Main product image */}
        {selectedImage ? (
          <div className={`relative w-full ${imageSize} mb-4`}>
            <Image
              // src={selectedImage}
              src={"/image/Untitled.jpeg"}
              alt={`${type} image`}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 400px"
            />
          </div>
        ) : (
          <div
            className={`flex items-center justify-center w-full ${imageSize} mb-4 bg-gray-50 rounded-2xl`}
          >
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
                      // src={image}
                      src={"/image/Untitled.jpeg"}
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
                <div
                  key={i}
                  className="border border-gray-200 rounded p-2 flex items-center justify-center"
                >
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
  removedImages = [],
  uploading = false,
  uploadError = null,
}) => {
  const [selectedImage, setSelectedImage] = useState(images[0] || null);
  const [previewImages, setPreviewImages] = useState([]); // Store preview URLs
  const fileInputRef = useRef(null);

  // Determine which icon to use based on product type
  const isEquipment = type === "EQUIPMENT";
  const ProductIcon = isEquipment ? Syringe : Pill;

  // Combine actual images with preview images
  const allImages = [...images, ...previewImages.map(p => p.url)];
  const effectiveImages = allImages.filter((img) => !removedImages.includes(img));

  // Update selected image when images change
  useEffect(() => {
    if (!selectedImage && effectiveImages.length > 0) {
      setSelectedImage(effectiveImages[0]);
    }
    // If selected image was removed, select another one
    if (selectedImage && removedImages.includes(selectedImage)) {
      const remainingImages = effectiveImages.filter(img => !removedImages.includes(img));
      setSelectedImage(remainingImages[0] || null);
    }
  }, [effectiveImages, selectedImage, removedImages]);

  // Clean up preview URLs when upload completes
  useEffect(() => {
    if (!uploading && previewImages.length > 0) {
      // Clean up old preview URLs
      previewImages.forEach(preview => {
        URL.revokeObjectURL(preview.url);
      });
      setPreviewImages([]);
    }
  }, [uploading, previewImages]);

  // Function to handle file selection
  const handleFileSelect = async (e) => {
    const files = e.target.files;
    if (!files.length) return;

    // Create preview URLs immediately
    const newPreviews = Array.from(files).map(file => ({
      url: URL.createObjectURL(file),
      file: file
    }));
    
    setPreviewImages(newPreviews);
    
    // Set the first preview as selected if no image is currently selected
    if (!selectedImage && newPreviews.length > 0) {
      setSelectedImage(newPreviews[0].url);
    }

    try {
      // Call the parent component's upload handler with the files
      await onUpload(files);
    } catch (error) {
      console.error("Error uploading images:", error);
      // Clean up preview URLs on error
      newPreviews.forEach(preview => {
        URL.revokeObjectURL(preview.url);
      });
      setPreviewImages([]);
    } finally {
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Handle removing an image
  const handleRemoveImage = (image) => {
    // Check if it's a preview image
    const previewIndex = previewImages.findIndex(p => p.url === image);
    if (previewIndex !== -1) {
      // Remove from preview images
      const updatedPreviews = [...previewImages];
      URL.revokeObjectURL(updatedPreviews[previewIndex].url);
      updatedPreviews.splice(previewIndex, 1);
      setPreviewImages(updatedPreviews);
    } else {
      // Handle regular image removal
      onRemove(image);
    }

    // If we're removing the currently selected image, select another one
    if (selectedImage === image) {
      const remainingImages = effectiveImages.filter(
        (img) => img !== image && !removedImages.includes(img)
      );
      setSelectedImage(remainingImages[0] || null);
    }
  };

  // Show upload error if any
  useEffect(() => {
    if (uploadError) {
      toast.error(uploadError);
    }
  }, [uploadError]);

  // Check if an image is a preview (being uploaded)
  const isPreviewImage = (imageUrl) => {
    return previewImages.some(p => p.url === imageUrl);
  };

  return (
    <div className="rounded-md p-4 flex flex-col items-center bg-background">
      {/* Main product image */}
      {selectedImage ? (
        <div className="relative w-full h-48 mb-4">
          <div className={`relative w-full h-full ${isPreviewImage(selectedImage) ? 'opacity-75' : ''}`}>
            <Image
              src={selectedImage}
              alt={`${type} image`}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 400px"
              onError={(e) => {
                // Fallback to placeholder if image fails to load
                e.target.src = "/image/Untitled.jpeg";
              }}
            />
            {isPreviewImage(selectedImage) && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20">
                <div className="bg-white px-2 py-1 rounded text-xs font-medium">
                  Uploading...
                </div>
              </div>
            )}
          </div>
          {isEditing && (
            <button
              className="absolute top-2 right-2 bg-red-500 rounded-full p-1 text-white hover:bg-red-600"
              onClick={() => handleRemoveImage(selectedImage)}
              disabled={uploading}
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
                className={`relative border rounded p-2 cursor-pointer bg-white ${
                  selectedImage === image
                    ? "border-teal-500"
                    : "border-gray-200"
                } ${isPreviewImage(image) ? 'opacity-75' : ''}`}
                onClick={() => setSelectedImage(image)}
              >
                <div className="relative w-16 h-8">
                  <Image
                    src={image}
                    alt={`${type} thumbnail ${index + 1}`}
                    fill
                    className="object-contain"
                    sizes="64px"
                    onError={(e) => {
                      e.target.src = "/image/Untitled.jpeg";
                    }}
                  />
                  {isPreviewImage(image) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    </div>
                  )}
                </div>
                {isEditing && (
                  <button
                    className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 text-white hover:bg-red-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveImage(image);
                    }}
                    disabled={uploading}
                  >
                    <X size={10} />
                  </button>
                )}
              </div>
            ))
          : [1, 2, 3].map((i) => (
              <div
                key={i}
                className="border border-gray-200 rounded p-2 flex items-center justify-center"
              >
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
              disabled={uploading}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className={`border ${
                uploading
                  ? "border-gray-300 bg-gray-100"
                  : "border-teal-500 hover:bg-teal-50"
              } rounded p-2 flex items-center justify-center h-[40px] min-w-[40px]`}
            >
              {uploading ? (
                <span className="text-xs text-gray-500">...</span>
              ) : (
                <Plus size={20} className="text-teal-500" />
              )}
            </button>
          </>
        )}
      </div>

      {/* Upload area */}
      {isEditing && (
        <div
          className={`mt-4 border-2 border-dashed ${
            uploading
              ? "border-gray-300 bg-gray-50"
              : "border-teal-300 hover:border-teal-500"
          } rounded-lg p-4 w-full text-center cursor-pointer`}
          onClick={() => !uploading && fileInputRef.current?.click()}
        >
          <Upload className={`mx-auto h-8 w-8 mb-2 ${uploading ? 'text-gray-400' : 'text-teal-500'}`} />
          <p className="text-sm text-gray-500">
            {uploading ? "Uploading..." : "Click or drag images here to upload"}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Supported formats: JPG, PNG, GIF
          </p>
          {uploadError && (
            <p className="text-xs text-red-500 mt-1">
              Error: {uploadError}
            </p>
          )}
        </div>
      )}
    </div>
  );
};