import Image from "next/image";
import { useState } from "react";
import { Pencil, Camera } from "lucide-react";
import useFileUpload from "../../hooks/useFileUpoload";

export default function ProfileImage({
  profileImageUrl,
  altText,
  companyName,
  isEditing = false,
  onImageChange,
}) {
  // Fix: Ensure previewUrl is null if profileImageUrl is empty string or falsy
  const [previewUrl, setPreviewUrl] = useState(
    profileImageUrl ? profileImageUrl : null
  );
  console.log("profileImageUrl", previewUrl);
  const { uploadSingle, uploading } = useFileUpload();
  console.log(
  "dfghjkl: " +
    (previewUrl?.startsWith("http")
      ? previewUrl
      : process.env.NEXT_PUBLIC_TELEHEALTH_API_URL + previewUrl)
);


  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Upload single file
      const uploadResult = await uploadSingle(file);

      // Fix: Ensure we're setting the correct URL and it's not empty
      const imageUrl = uploadResult?.fileUrl || uploadResult;
      if (imageUrl && imageUrl.trim() !== "") {
        setPreviewUrl(imageUrl);
        if (onImageChange) {
          onImageChange(imageUrl);
          console.log("uploadResult", imageUrl);
        }
      }
    }
  };

  const firstLetter = companyName?.charAt(0) || "?";

  return (
    <div className="relative w-32 h-32">
      <div className="w-32 h-32 rounded-full overflow-hidden bg-primary/20 flex items-center justify-center">
        {uploading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Camera className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : previewUrl && previewUrl.trim() !== "" ? (
          <Image
            src={
              previewUrl?.startsWith("http")
                ? previewUrl
                : process.env.NEXT_PUBLIC_MEDICAL_SUPPLIES_API_URL + previewUrl
            }
            alt={altText || "Profile"}
            className="w-full h-full object-cover"
            width={112}
            height={112}
          />
        ) : (
          <span className="text-7xl font-semibold text-primary">
            {firstLetter}
           
          </span>
        )}
      </div>
    
      {isEditing && (
        <label className="absolute bottom-0 right-0 cursor-pointer bg-white rounded-full p-2 shadow-md border border-gray-200 hover:bg-gray-100 transition-colors">
          <Pencil size={16} className="text-gray-700" />
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleImageChange}
          />
        </label>
      )}
    </div>
  );
}
