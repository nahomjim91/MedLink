"use client";
import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

// Define available languages
const languages = [
  { code: 'en-US', label: 'English (United States)', shortCode: 'ENG' },
  { code: 'amh', label: 'Amharic', shortCode: 'AMH' },
  { code: 'fr', label: 'Français', shortCode: 'FR' },
  { code: 'de', label: 'Deutsch', shortCode: 'DE' },
  { code: 'ar', label: 'العربية', shortCode: 'AR' },
  { code: 'zh-CN', label: '中文 (简体)', shortCode: 'ZH' },
];

export default function LanguageSelector({ className = '', onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(languages[0]);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLanguageChange = (language) => {
    setSelectedLanguage(language);
    setIsOpen(false);
    if (onChange) {
      onChange(language.code);
    }
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        type="button"
        className="flex items-center justify-between px-3 py-2 text-sm text-gray-500 bg-gray-100 border-0 rounded-md hover:bg-gray-200 focus:outline-none md:w-52 w-20"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        {/* Show only shortCode on small screens, full label on larger screens */}
        <span className="hidden md:inline">{selectedLanguage.label}</span>
        <span className="md:hidden">{selectedLanguage.shortCode}</span>
        <ChevronDown size={16} className="ml-2" />
      </button>

      {isOpen && (
        <ul
          className="absolute z-10 w-full mt-1 overflow-auto bg-white rounded-md shadow-lg max-h-60 focus:outline-none md:w-52 min-w-max"
          role="listbox"
        >
          {languages.map((language) => (
            <li
              key={language.code}
              className={`cursor-pointer select-none relative py-2 px-3 ${
                selectedLanguage.code === language.code
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-secondary hover:bg-gray-100'
              }`}
              role="option"
              aria-selected={selectedLanguage.code === language.code}
              onClick={() => handleLanguageChange(language)}
            >
              {/* Always show full label in dropdown */}
              <span className="md:inline">{language.label}</span>
              <span className="md:hidden inline-block ml-2 text-xs text-gray-500">({language.shortCode})</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}