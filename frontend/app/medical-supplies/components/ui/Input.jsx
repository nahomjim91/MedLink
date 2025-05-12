"use client";
import { useState, useEffect } from "react";
import { Eye, EyeOff, Check, ChevronDown , Search , Send, Plus } from "lucide-react";
import { FaMapMarkerAlt } from "react-icons/fa";
import { IconButton } from "./Button";

export function TextInput({
  type = "text",
  label,
  placeholder,
  value,
  onChange,
  error = false,
  errorMessage = "",
  fullWidth = false,
  required = false,
  className = "",
  ...props
}) {
  return (
    <div className={`mb-4 ${fullWidth ? "w-full" : ""} ${className}`}>
      {label && (
        <label className="block text-secondary mb-1  text-xs md:text-sm">
          {label} {required && <span className="text-error">*</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`
            w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2  text-xs md:text-sm
            ${
              error
                ? "border-error focus:border-error focus:ring-error/30"
                : "border-gray-200 focus:border-primary focus:ring-primary/20"
            }
          `}
        required={required}
        {...props}
      />
      {error && errorMessage && (
        <p className="text-error text-xs mt-1">{errorMessage}</p>
      )}
    </div>
  );
}



/**
 * Number Input Component
 */
export function NumberInput({
  label,
  placeholder,
  value,
  onChange,
  error = false,
  errorMessage = "",
  min,
  max,
  step = 1,
  fullWidth = false,
  required = false,
  className = "",
  ...props
}) {
  // Custom onChange to ensure only numbers are entered
  const handleChange = (e) => {
    const value = e.target.value;
    if (value === "" || /^[0-9]*$/.test(value)) {
      onChange(e);
    }
  };

  return (
    <div className={`mb-4 ${fullWidth ? "w-full" : ""} ${className}`}>
      {label && (
        <label className="block text-secondary mb-1 text-xs md:text-sm">
          {label} {required && <span className="text-error">*</span>}
        </label>
      )}
      <input
        type="number"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        className={`
            w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 text-xs md:text-sm
            ${
              error
                ? "border-error focus:border-error focus:ring-error/30"
                : "border-gray-200 focus:border-primary focus:ring-primary/20"
            }
          `}
        required={required}
        {...props}
      />
      {error && errorMessage && (
        <p className="text-error text-xs mt-1">{errorMessage}</p>
      )}
    </div>
  );
}

/**
 * Password Input Component with toggle visibility
 */
export function PasswordInput({
  label,
  placeholder,
  value,
  onChange,
  error = false,
  errorMessage = "",
  helperText,
  fullWidth = false,
  required = false,
  className = "",
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className={`mb-4 ${fullWidth ? "w-full" : ""} ${className}`}>
      {label && (
        <label className="block text-secondary mb-1 text-xs md:text-sm">
          {label} {required && <span className="text-error">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`
              w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 pr-10 text-xs md:text-sm
              ${
                error
                  ? "border-error focus:border-error focus:ring-error/30"
                  : "border-gray-200 focus:border-primary focus:ring-primary/20"
              }
            `}
          required={required}
          {...props}
        />
        <button
          type="button"
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>
      {error && errorMessage ? (
        <p className="text-error text-xs mt-1">{errorMessage}</p>
      ) : helperText ? (
        <p className="text-gray-500 text-xs mt-1">{helperText}</p>
      ) : null}
    </div>
  );
}

export function SelectInput({
  label,
  name,
  value,
  onChange,
  options = [],
  error = false,
  errorMessage = "",
  placeholder = "Select an option",
  fullWidth = false,
  required = false,
  className = "",
  defaultToFirstOption = true,
  ...props
}) {
  // Set default value to first option if defaultToFirstOption is true and options exist
  const effectiveValue =
    !value && defaultToFirstOption && options.length > 0
      ? options[0].value
      : value;

  // Handle change with proper event structure
  const handleChange = (e) => {
    const selectedValue = e.target.value;

    // Call the parent's onChange handler with properly structured event
    onChange({
      ...e,
      target: {
        ...e.target,
        name: name || e.target.name,
        value: selectedValue,
      },
    });
  };

  return (
    <div className={`mb-4 ${fullWidth ? "w-full" : ""} ${className}`}>
      {label && (
        <label className="block text-secondary mb-1 text-xs md:text-sm">
          {label} {required && <span className="text-error">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          name={name}
          value={effectiveValue || ""}
          onChange={handleChange}
          className={`
              w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 text-xs md:text-sm
              appearance-none bg-white pr-10
              ${!effectiveValue ? "text-gray-500" : "text-gray-900"}
              ${
                error
                  ? "border-error focus:border-error focus:ring-error/30"
                  : "border-gray-200 focus:border-primary focus:ring-primary/20"
              }
            `}
          required={required}
          {...props}
        >
          {placeholder && (
            <option value="" disabled className="text-gray-500">
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              className="text-gray-900"
            >
              {option.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
          <ChevronDown size={18} />
        </div>
      </div>
      {error && errorMessage && (
        <p className="text-error text-xs mt-1">{errorMessage}</p>
      )}
    </div>
  );
}
/**
 * Email Input Component
 */
export function EmailInput({
  label,
  placeholder = "Enter your email address",
  value,
  onChange,
  error = false,
  errorMessage = "",
  fullWidth = false,
  required = false,
  className = "",
  ...props
}) {
  return (
    <div className={`mb-4 ${fullWidth ? "w-full" : ""} ${className}`}>
      {label && (
        <label className="block text-secondary mb-1 text-xs md:text-sm">
          {label} {required && <span className="text-error">*</span>}
        </label>
      )}
      <input
        type="email"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`
            w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 text-xs md:text-sm
            ${
              error
                ? "border-error focus:border-error focus:ring-error/30"
                : "border-gray-200 focus:border-primary focus:ring-primary/20"
            }
          `}
        required={required}
        {...props}
      />
      {error && errorMessage && (
        <p className="text-error text-xs mt-1">{errorMessage}</p>
      )}
    </div>
  );
}

/**
 * Date Input Component with min and max date validation
 */
export function DateInput({
  label,
  name,
  value,
  onChange,
  error = false,
  errorMessage = "",
  min, // Minimum date in YYYY-MM-DD format
  max, // Maximum date in YYYY-MM-DD format
  fullWidth = false,
  required = false,
  className = "",
  ...props
}) {
  // Handle date change with validation
  const handleChange = (e) => {
    const selectedDate = e.target.value;

    // Call the parent's onChange handler with the event
    // This allows the form to update its state
    onChange({
      ...e,
      target: {
        ...e.target,
        name: name || e.target.name,
        value: selectedDate,
      },
    });
  };

  return (
    <div className={`mb-4 ${fullWidth ? "w-full" : ""} ${className}`}>
      {label && (
        <label className="block text-secondary mb-1 text-xs md:text-sm">
          {label} {required && <span className="text-error">*</span>}
        </label>
      )}
      <input
        type="date"
        name={name}
        value={value || ""}
        onChange={handleChange}
        min={min}
        max={max}
        className={`
            w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 text-xs md:text-sm
            ${
              error
                ? "border-error focus:border-error focus:ring-error/30"
                : "border-gray-200 focus:border-primary focus:ring-primary/20"
            }
          `}
        required={required}
        {...props}
      />
      {error && errorMessage && (
        <p className="text-error text-xs mt-1">{errorMessage}</p>
      )}
    </div>
  );
}

export function AddressInput({
  name,
  label,
  placeholder = "Enter address",
  value = "",
  onChange,
  onGeoLocationChange,
  error = false,
  errorMessage = "",
  fullWidth = false,
  required = false,
  className = "",
  ...props
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);

  // Create a useEffect to update display when value changes externally
  useEffect(() => {
    // If the value changed but not from selecting a suggestion,
    // we should try to parse it for coordinates display
    if (selectedLocation === null && value) {
      // This is a placeholder for more sophisticated parsing if needed
      console.log("External value update:", value);
    }
  }, [value, selectedLocation]);

  // Ethiopian cities with actual coordinates
  const ethiopianCities = [
    {
      id: 1,
      address: "Meskel Square",
      city: "Addis Ababa",
      state: "AA",
      country: "Ethiopia",
      coordinates: { latitude: 9.010772, longitude: 38.761889 },
    },
    {
      id: 2,
      address: "Ras Hotel",
      city: "Dire Dawa",
      state: "DD",
      country: "Ethiopia",
      coordinates: { latitude: 9.590424, longitude: 41.866878 },
    },
    {
      id: 3,
      address: "Lake Tana View Point",
      city: "Bahir Dar",
      state: "AM",
      country: "Ethiopia",
      coordinates: { latitude: 11.596057, longitude: 37.390745 },
    },
    {
      id: 4,
      address: "Entoto Park",
      city: "Addis Ababa",
      state: "AA",
      country: "Ethiopia",
      coordinates: { latitude: 9.08427, longitude: 38.763523 },
    },
    {
      id: 5,
      address: "Hawassa Lake",
      city: "Hawassa",
      state: "SN",
      country: "Ethiopia",
      coordinates: { latitude: 7.05212, longitude: 38.476105 },
    },
    {
      id: 6,
      address: "Lalibela Churches",
      city: "Lalibela",
      state: "AM",
      country: "Ethiopia",
      coordinates: { latitude: 12.031741, longitude: 39.045807 },
    },
    {
      id: 7,
      address: "Axum Obelisk",
      city: "Axum",
      state: "TG",
      country: "Ethiopia",
      coordinates: { latitude: 14.130948, longitude: 38.717599 },
    },
    {
      id: 8,
      address: "Harar Jugol",
      city: "Harar",
      state: "HR",
      country: "Ethiopia",
      coordinates: { latitude: 9.31413, longitude: 42.132591 },
    },
    {
      id: 9,
      address: "Jimma University",
      city: "Jimma",
      state: "OR",
      country: "Ethiopia",
      coordinates: { latitude: 7.678569, longitude: 36.836487 },
    },
    {
      id: 10,
      address: "Bole International Airport",
      city: "Addis Ababa",
      state: "AA",
      country: "Ethiopia",
      coordinates: { latitude: 8.979589, longitude: 38.799319 },
    },
  ];

  // Geocode an address - mock implementation
  const geocodeAddress = async (address) => {
    // Check if the address matches any of our predefined cities
    const matchedCity = ethiopianCities.find(
      (city) => address.includes(city.city) || address.includes(city.address)
    );

    if (matchedCity) {
      return matchedCity.coordinates;
    }

    // Generate random coordinates within Ethiopia
    return new Promise((resolve) => {
      setTimeout(() => {
        // Generate coordinates within Ethiopia's approximate bounds
        const lat = 8.0 + Math.random() * 6; // ~8 to ~14 degrees
        const lng = 33.0 + Math.random() * 15; // ~33 to ~48 degrees

        resolve({
          latitude: parseFloat(lat.toFixed(6)),
          longitude: parseFloat(lng.toFixed(6)),
        });
      }, 300);
    });
  };

  // Generate suggestions based on query
  const fetchAddressSuggestions = (query) => {
    if (!query) {
      setSuggestions([]);
      return;
    }

    // Filter cities that match the query
    const queryLower = query.toLowerCase();
    const filteredCities = ethiopianCities.filter(
      (city) =>
        city.address.toLowerCase().includes(queryLower) ||
        city.city.toLowerCase().includes(queryLower) ||
        city.state.toLowerCase().includes(queryLower)
    );

    // If we have matches, use them, otherwise create generic suggestions
    const suggestionsToShow =
      filteredCities.length > 0
        ? filteredCities
        : [
            {
              id: 100,
              address: `${query}`,
              city: "Addis Ababa",
              state: "AA",
              country: "Ethiopia",
              coordinates: {
                latitude: 9.0 + Math.random() * 2,
                longitude: 38.0 + Math.random() * 4,
              },
            },
            {
              id: 101,
              address: `${query}`,
              city: "Dire Dawa",
              state: "DD",
              country: "Ethiopia",
              coordinates: {
                latitude: 9.5 + Math.random() * 0.5,
                longitude: 41.8 + Math.random() * 0.5,
              },
            },
          ];

    setSuggestions(suggestionsToShow);
  };

  // Handle input changes
  const handleInputChange = (e) => {
    onChange(e); // Pass the event up
    fetchAddressSuggestions(e.target.value);

    // Reset selected location when user types
    setSelectedLocation(null);
  };

  // Handle selecting a suggestion
  const handleSelectSuggestion = async (suggestion) => {
    const fullAddress = `${suggestion.address}, ${suggestion.city}, ${suggestion.state}, ${suggestion.country}`;

    // Create a synthetic event object
    const syntheticEvent = {
      target: {
        name,
        value: fullAddress,
      },
    };

    // Store the selected suggestion coordinates
    setSelectedLocation(suggestion.coordinates);

    // Update the input text
    onChange(syntheticEvent);

    // Close suggestions dropdown
    setSuggestions([]);

    // Use provided coordinates if available, otherwise geocode
    const geoLocation =
      suggestion.coordinates || (await geocodeAddress(fullAddress));

    if (onGeoLocationChange && geoLocation) {
      onGeoLocationChange(geoLocation);
    }
  };

  // Handle using current location
  const handleUseCurrentLocation = () => {
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          // Create a readable address for display
          const mockAddress = "Your Current Location";

          // Create synthetic event
          const syntheticEvent = {
            target: {
              name,
              value: mockAddress,
            },
          };

          // Update input text
          onChange(syntheticEvent);

          // Store the selected coordinates
          setSelectedLocation({
            latitude,
            longitude,
          });

          // Update geolocation coordinates
          if (onGeoLocationChange) {
            onGeoLocationChange({
              latitude,
              longitude,
            });
          }

          setIsLocating(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          setIsLocating(false);

          // Show error to user
          alert(
            "Unable to access your location. Please check your browser settings."
          );
        },
        { enableHighAccuracy: true }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
      setIsLocating(false);
    }
  };

  return (
    <div className={`mb-4 ${fullWidth ? "w-full" : ""} ${className}`}>
      {label && (
        <label className="block text-secondary mb-1 text-xs md:text-sm">
          {label} {required && <span className="text-error">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          type="text"
          name={name}
          value={value || ""}
          onChange={handleInputChange}
          placeholder={placeholder}
          className={`
            w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 text-xs md:text-sm
            ${
              error
                ? "border-error focus:border-error focus:ring-error/30"
                : "border-gray-200 focus:border-primary focus:ring-primary/20"
            }
          `}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          required={required}
          {...props}
        />
        <button
          type="button"
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-primary hover:text-primary-dark"
          onClick={handleUseCurrentLocation}
          disabled={isLocating}
        >
          {isLocating ? (
            <span className="text-sm">Locating...</span>
          ) : (
            <FaMapMarkerAlt size={18} />
          )}
        </button>

        {isFocused && suggestions.length > 0 && (
          <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-y-auto">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-xs md:text-sm"
                onClick={() => handleSelectSuggestion(suggestion)}
              >
                <div className="font-medium">{suggestion.address}</div>
                <div className="text-gray-500">
                  {suggestion.city}, {suggestion.state}, {suggestion.country}
                </div>
                {suggestion.coordinates && (
                  <div className="text-gray-400 text-xs">
                    {suggestion.coordinates.latitude.toFixed(6)},{" "}
                    {suggestion.coordinates.longitude.toFixed(6)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Display selected coordinates below the input if available
      {selectedLocation && (
        <div className="mt-1 text-xs text-gray-500">
          Coordinates: {selectedLocation.latitude.toFixed(6)},{" "}
          {selectedLocation.longitude.toFixed(6)}
        </div>
      )} */}

      {error && errorMessage && (
        <p className="text-error text-xs mt-1">{errorMessage}</p>
      )}
    </div>
  );
}

/**
 * Divider with Text (like the "OR" divider)
 */
export function TextDivider({ text = "OR", className = "" }) {
  return (
    <div className={`flex items-center my-4 ${className}`}>
      <div className="flex-grow border-t border-gray-300"></div>
      <span className="mx-4 text-secondary text-sm">{text}</span>
      <div className="flex-grow border-t border-gray-300"></div>
    </div>
  );
}

export const SearchBar = () => {
  return (
    <div className="relative w-full">
      <input
        type="text"
        placeholder="Search Anything..."
        className="w-full py-3 pl-4 pr-12 rounded-full border bg-white border-white focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
      <div className="absolute right-1 top-1/2 -translate-y-1/2">
        <IconButton icon={<Search />} isActive={true} />
      </div>
    </div>
  );
};


export function ChatInput({
  placeholder = "Your message",
  value,
  onChange,
  onSend,
  fullWidth = true,
  className = "",
  ...props
}) {
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (value.trim()) {
      onSend();
    }
  };

  return (
    <div className={`${fullWidth ? "w-full" : ""} ${className}`}>
      <form
        onSubmit={handleSubmit}
        className={`
          flex items-center px-4 py-1 rounded-xl border-2 transition-all
          ${isFocused 
            ? "border-primary ring-2 ring-primary/20" 
            : "border-secondary/40"
          }
        `}
      >
        <button 
          type="button"
          className="p-1 bg-primary text-white rounded-full hover:bg-emerald-600"
        >
          <Plus size={28} />
        </button>
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="flex-1 p-2 mx-2 bg-transparent focus:outline-none text-gray-600 text-xs md:text-sm"
          {...props}
        />
        <button 
          type="submit"
          className="p-2 bg-primary text-white rounded-full hover:bg-emerald-600 transition-colors"
        >
          <Send size={24} />
        </button>
      </form>
    </div>
  );
}