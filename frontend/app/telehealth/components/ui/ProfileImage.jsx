import Image from "next/image";
import { useState } from "react";
import { Pencil, Camera } from "lucide-react";

export default function ProfileImage({ 
  profileImageUrl, 
  altText, 
  userName,
  isEditing = false,
  onImageChange
}) {
  const [previewUrl, setPreviewUrl] = useState(null);
  
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const temporaryUrl = URL.createObjectURL(file);
      setPreviewUrl(temporaryUrl);
      
      if (onImageChange) {
        onImageChange(file);
      }
    }
  };

  const displayImageUrl = previewUrl || profileImageUrl;
  const firstLetter = userName?.charAt(0) || "?";

  return (
    <div className="relative w-32 h-32">
      <div className="w-32 h-32 rounded-full overflow-hidden bg-primary/20 flex items-center justify-center">
        {displayImageUrl ? (
          <Image
            src={displayImageUrl}
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