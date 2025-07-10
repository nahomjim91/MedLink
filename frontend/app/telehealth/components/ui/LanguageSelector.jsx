'use client';

import { useState, useRef, useEffect } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";

const languages = [
  { code: "en", label: "English", shortCode: "ENG" },
  { code: "am", label: "አማርኛ", shortCode: "AMH" },
  { code: "ti", label: "ትግርኛ", shortCode: "TIG" },
];

export default function LanguageSelector({ className = "" }) {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  
  const currentLocale = params.locale || 'en';
  const currentLanguage = languages.find(l => l.code === currentLocale) || languages[0];

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLanguageChange = (newLocale) => {
    // Check if we're in the telehealth patient section
    if (pathname.includes('/telehealth/patient/')) {
      // Replace current locale with new locale in pathname
      const newPath = pathname.replace(`/telehealth/patient/${currentLocale}`, `/telehealth/patient/${newLocale}`);
      router.push(newPath);
    } else {
      // For other sections, you can add different logic or redirect to patient home
      router.push(`/telehealth/patient/${newLocale}`);
    }
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        type="button"
        className="flex items-center justify-between px-3 py-2 text-sm text-gray-500 bg-gray-100 border-0 rounded-md hover:bg-gray-200 focus:outline-none md:w-52 w-20"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="hidden md:inline">{currentLanguage.label}</span>
        <span className="md:hidden">{currentLanguage.shortCode}</span>
        <ChevronDown size={16} className="ml-2" />
      </button>

      {isOpen && (
        <ul className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg max-h-60 focus:outline-none md:w-52 min-w-max">
          {languages.map((language) => (
            <li
              key={language.code}
              className={`cursor-pointer select-none relative py-2 px-3 ${
                currentLanguage.code === language.code
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => handleLanguageChange(language.code)}
            >
              <span className="md:inline">{language.label}</span>
              <span className="md:hidden inline-block ml-2 text-xs text-gray-500">
                ({language.shortCode})
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}