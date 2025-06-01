"use client";
import { useState, useEffect } from "react";
import {
  X,
  Eye,
  EyeOff,
  Upload,
  ChevronDown,
  Search,
  Send,
  Plus,
  FileText,
} from "lucide-react";
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
  isDesabled = false,
  validation = "default",
  name,
  ...props
}) {
  // Validation patterns
  const validationPatterns = {
    name: /^[a-zA-Z\s]*$/, // Only letters and spaces
    phone: /^[0-9+\-\s()]*$/, // Numbers, +, -, spaces, parentheses
    phoneEthiopia: /^[0-9]*$/, // Ethiopian phone - only numbers
    batch: /^[a-zA-Z0-9#\-\s]*$/, // Letters, numbers, #, -, spaces
    email: /^[a-zA-Z0-9@._\-]*$/, // Email characters
    alphanumeric: /^[a-zA-Z0-9\s]*$/, // Letters, numbers, spaces
    numeric: /^[0-9]*$/, // Numbers only
    default: /.*/, // Allow everything (no restriction)
  };

  // Get validation pattern based on validation prop
  const getValidationPattern = (validationType) => {
    return validationPatterns[validationType] || validationPatterns.default;
  };

  // Ethiopian phone validation function
  const validateEthiopianPhone = (inputValue) => {
    // Only allow numbers
    if (!/^[0-9]*$/.test(inputValue)) return false;

    // Allow empty input (for when user is still typing)
    if (inputValue === "") return true;

    // Must be 10 digits total
    if (inputValue.length > 10) return false;

    // First digit must be 0
    if (inputValue.length >= 1 && inputValue[0] !== "0") return false;

    // Second digit must be 9 or 7
    if (
      inputValue.length >= 2 &&
      inputValue[1] !== "9" &&
      inputValue[1] !== "7"
    )
      return false;

    return true;
  };

  // Handle input change with validation
  const handleChange = (e) => {
    const inputValue = e.target.value;

    // Special handling for Ethiopian phone
    if (validation === "phoneEthiopia") {
      if (validateEthiopianPhone(inputValue)) {
        const newEvent = {
          target: {
            name: name,
            value: inputValue,
          },
        };
        onChange(newEvent);
      }
      return;
    }

    // Regular pattern validation for other types
    const pattern = getValidationPattern(validation);
    if (pattern.test(inputValue)) {
      const newEvent = {
        target: {
          name: name,
          value: inputValue,
        },
      };
      onChange(newEvent);
    }
  };

  // Generate error message for Ethiopian phone
  const getPhoneErrorMessage = () => {
    if (validation === "phoneEthiopia" && value) {
      if (value.length > 0 && value.length < 10) {
        return "Phone number must be 10 digits";
      }
      if (value.length >= 1 && value[0] !== "0") {
        return "Phone number must start with 0";
      }
      if (value.length >= 2 && value[1] !== "9" && value[1] !== "7") {
        return "Second digit must be 9 or 7 (09xxxxxxxx or 07xxxxxxxx)";
      }
    }
    return errorMessage;
  };

  return (
    <div className={`mb-4 ${fullWidth ? "w-full" : ""} ${className}`}>
      {label && (
        <label className="block text-secondary mb-1  text-xs md:text-sm">
          {label} {required && <span className="text-error">*</span>}
        </label>
      )}
      <input
        type={type}
        name={name}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={isDesabled}
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
      {error && (
        <p className="text-error text-xs mt-1">{getPhoneErrorMessage()}</p>
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
  // Auto-select first option when component mounts if no value is set
  useEffect(() => {
    if (!value && defaultToFirstOption && options.length > 0 && onChange) {
      // Trigger onChange with the first option's value
      const firstOptionValue = options[0].value;
      onChange({
        target: {
          name: name,
          value: firstOptionValue,
        },
      });
    }
  }, [value, defaultToFirstOption, options, onChange, name]);

  // Set effective value for display
  const effectiveValue =
    value ||
    (defaultToFirstOption && options.length > 0 ? options[0].value : "");

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
          {/* Only show placeholder if defaultToFirstOption is false */}
          {placeholder && !defaultToFirstOption && (
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

export function OrderSelectInput({
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
  // New props for table usage
  compact = false,
  inline = false,
  disabled = false,
  ...props
}) {
  const effectiveValue =
    !value && defaultToFirstOption && options.length > 0
      ? options[0].value
      : value;

  const handleChange = (e) => {
    const selectedValue = e.target.value;
    onChange({
      ...e,
      target: {
        ...e.target,
        name: name || e.target.name,
        value: selectedValue,
      },
    });
  };

  // Compact styles for table usage
  const selectClasses = compact
    ? `
        px-2 py-1 text-xs rounded-md border focus:outline-none focus:ring-1
        appearance-none bg-white pr-6 min-w-[100px]
        ${!effectiveValue ? "text-gray-500" : "text-gray-900"}
        ${
          error
            ? "border-red-300 focus:border-red-500 focus:ring-red-200"
            : "border-gray-300 focus:border-primary focus:ring-primary"
        }
        ${disabled ? "bg-gray-100 cursor-not-allowed" : ""}
      `
    : `
        w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 text-xs md:text-sm
        appearance-none bg-white pr-10
        ${!effectiveValue ? "text-gray-500" : "text-gray-900"}
        ${
          error
            ? "border-error focus:border-error focus:ring-error/30"
            : "border-gray-200 focus:border-primary focus:ring-primary/20"
        }
        ${disabled ? "bg-gray-100 cursor-not-allowed" : ""}
      `;

  if (inline) {
    return (
      <div className={`relative ${className}`}>
        <select
          name={name}
          value={effectiveValue || ""}
          onChange={handleChange}
          disabled={disabled}
          className={selectClasses}
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
        <div
          className={`pointer-events-none absolute inset-y-0 right-0 flex items-center text-gray-500 ${
            compact ? "px-1" : "px-3"
          }`}
        >
          <ChevronDown size={compact ? 14 : 18} />
        </div>
        {error && errorMessage && (
          <p className="text-red-500 text-xs mt-1">{errorMessage}</p>
        )}
      </div>
    );
  }

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
          disabled={disabled}
          className={selectClasses}
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
        <div
          className={`pointer-events-none absolute inset-y-0 right-0 flex items-center text-gray-500 ${
            compact ? "px-1" : "px-3"
          }`}
        >
          <ChevronDown size={compact ? 14 : 18} />
        </div>
      </div>
      {error && errorMessage && (
        <p className="text-error text-xs mt-1">{errorMessage}</p>
      )}
    </div>
  );
}

export function NumberWithUnitInput({
  label,
  name,
  value = "",
  onChange,
  unitOptions = [],
  error = false,
  errorMessage = "",
  placeholder = "Enter a value",
  fullWidth = false,
  required = false,
  className = "",
  ...props
}) {
  // Parse the value if it's a string with unit
  const parseValueAndUnit = () => {
    if (!value) return { numValue: "", unitValue: unitOptions[0]?.value || "" };

    // If value is already an object with numValue and unitValue
    if (typeof value === "object" && value.numValue !== undefined) {
      return value;
    }

    // Try to parse a string like "10mg" or "10 mg"
    const valueStr = String(value);
    for (const unitOption of unitOptions) {
      if (valueStr.endsWith(unitOption.value)) {
        const numPart = valueStr
          .substring(0, valueStr.length - unitOption.value.length)
          .trim();
        return { numValue: numPart, unitValue: unitOption.value };
      }
    }

    // If no unit found, assume it's just a number
    return { numValue: valueStr, unitValue: unitOptions[0]?.value || "" };
  };

  const { numValue, unitValue } = parseValueAndUnit();

  // Handle number input change
  const handleNumberChange = (e) => {
    const newNumValue = e.target.value;

    if (onChange) {
      // Format with up to 2 decimal places if it has decimals
      const formattedValue = newNumValue + unitValue;
      onChange({
        ...e,
        target: {
          ...e.target,
          name: name || e.target.name,
          value: formattedValue,
          numValue: newNumValue,
          unitValue: unitValue,
        },
      });
    }
  };

  // Handle unit select change
  const handleUnitChange = (e) => {
    const newUnitValue = e.target.value;

    if (onChange) {
      // Combine the current number value with the new unit
      const formattedValue = numValue + newUnitValue;
      onChange({
        ...e,
        target: {
          ...e.target,
          name: name || e.target.name,
          value: formattedValue,
          numValue: numValue,
          unitValue: newUnitValue,
        },
      });
    }
  };

  return (
    <div className={`mb-4 ${fullWidth ? "w-full" : ""} ${className}`}>
      {label && (
        <label className="block text-secondary mb-1 text-xs md:text-sm">
          {label} {required && <span className="text-error">*</span>}
        </label>
      )}

      <div className="flex rounded-xl overflow-hidden">
        {/* Number Input */}
        <input
          type="number"
          name={name}
          value={numValue}
          onChange={handleNumberChange}
          placeholder={placeholder}
          step="0.01" // Allow two decimal places
          className={`
            flex-grow px-4 py-3 border-2 focus:outline-none focus:ring-2 text-xs md:text-sm
            rounded-l-xl border-r-0
            ${
              error
                ? "border-error focus:border-error focus:ring-error/30"
                : "border-gray-200 focus:border-primary focus:ring-primary/20"
            }
          `}
          required={required}
          {...props}
        />

        {/* Unit Selector */}
        <div className="relative">
          <select
            name={`${name}-unit`}
            value={unitValue}
            onChange={handleUnitChange}
            className={`
              px-2 py-3 border-2 focus:outline-none focus:ring-2 text-xs md:text-sm
              appearance-none bg-white rounded-r-xl border-l-0 pr-8
              ${
                error
                  ? "border-error focus:border-error focus:ring-error/30"
                  : "border-gray-200 focus:border-primary focus:ring-primary/20"
              }
            `}
          >
            {unitOptions.map((option) => (
              <option
                key={option.value}
                value={option.value}
                className="text-gray-900"
              >
                {option.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
            <ChevronDown size={16} />
          </div>
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
        <label className="block text-secondary mb-1 text-xs md:text-sm w-full">
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
  disabled,
  error,
  loading,
  ...props
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [localError, setLocalError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (disabled || !value.trim() || loading) return;

    try {
      setLocalError(null);
      await onSend(value.trim()); // Pass the value to onSend
    } catch (error) {
      console.error("Send error:", error);
      setLocalError(error.message);
    }
  };

  return (
    <div className={`${fullWidth ? "w-full" : ""} ${className}`}>
      {(error || localError) && (
        <div className="text-red-500 text-sm mb-2">{error || localError}</div>
      )}
      <form
        onSubmit={handleSubmit}
        className={`
          flex items-center px-4 py-1 rounded-xl border-2 transition-all
          ${
            isFocused
              ? "border-primary ring-2 ring-primary/20"
              : "border-secondary/40"
          }
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          ${error || localError ? "border-red-500" : ""}
        `}
      >
        <button
          type="button"
          disabled={disabled || loading}
          className="p-1 bg-primary text-white rounded-full hover:bg-emerald-600 disabled:opacity-50"
        >
          <Plus size={28} />
        </button>
        <input
          type="text"
          placeholder={loading ? "Sending..." : placeholder}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={disabled || loading}
          className="flex-1 p-2 mx-2 bg-transparent focus:outline-none text-gray-600 text-xs md:text-sm disabled:opacity-50"
          {...props}
        />
        <button
          type="submit"
          disabled={disabled || loading || !value.trim()}
          className="p-2 bg-primary text-white rounded-full hover:bg-emerald-600 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <Send size={24} />
          )}
        </button>
      </form>
    </div>
  );
}

/**
 * TextAreaInput Component
 */
export function TextAreaInput({
  label,
  name,
  value,
  onChange,
  placeholder = "Enter description",
  error = false,
  errorMessage = "",
  required = false,
  rows = 5,
  className = "",
  ...props
}) {
  return (
    <div className={`mb-4 w-full ${className}`}>
      {label && (
        <label className="block text-secondary/90 text-sm font-medium mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className={`
          w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 text-sm
          ${
            error
              ? "border-red-500 focus:border-red-500 focus:ring-red-300/30"
              : "border-gray-200 focus:border-teal-500 focus:ring-teal-500/20"
          }
        `}
        required={required}
        {...props}
      />
      {error && errorMessage && (
        <p className="text-red-500 text-xs mt-1">{errorMessage}</p>
      )}
    </div>
  );
}

/**
 * RadioGroup Component
 */
export function RadioGroup({
  label,
  name,
  value,
  onChange,
  options = [],
  error = false,
  errorMessage = "",
  required = false,
  className = "",
  disabled = false,
  ...props
}) {
  // Handler to update the value when a radio option is clicked
  const handleRadioChange = (optionValue) => {
    // Create a synthetic event object to pass to the onChange handler

    const event = {
      target: {
        name,
        value: optionValue,
      },
    };
    onChange(event);
  };

  return (
    <div className={`mb-4 w-full ${className}`}>
      {label && (
        <label className="block text-gray-700 text-sm font-medium mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="flex items-center space-x-6">
        {options.map((option) => (
          <div key={option.value} className="flex items-center">
            <input
              type="radio"
              id={`${name}-${option.value}`}
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => handleRadioChange(option.value)}
              className="hidden"
              {...props}
            />
            <label
              htmlFor={`${name}-${option.value}`}
              className={`
                relative pl-8 cursor-pointer text-sm
                before:content-[''] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2
                before:w-5 before:h-5 before:rounded-full before:border-2 
                ${
                  value === option.value
                    ? "before:border-teal-500 after:content-[''] after:absolute after:w-3 after:h-3 after:rounded-full after:bg-teal-500 after:left-1 after:top-1/2 after:-translate-y-1/2"
                    : "before:border-gray-300"
                }
              `}
              onClick={() => handleRadioChange(option.value)}
            >
              {option.label}
            </label>
          </div>
        ))}
      </div>
      {error && errorMessage && (
        <p className="text-red-500 text-xs mt-1">{errorMessage}</p>
      )}
    </div>
  );
}

/**
 * DynamicList Component
 */
export function DynamicList({
  label,
  name,
  value = [], // Changed from values to value for consistency with other form components
  onChange,
  placeholder = "Enter item",
  error = false,
  errorMessage = "",
  required = false,
  className = "",
  ...props
}) {
  // Ensure value is always an array, even if null or undefined is passed
  const items = Array.isArray(value) ? value : [];

  // Correctly handle onChange to match your form's expected format
  const handleChange = (newValues) => {
    // Create a synthetic event object similar to native input events
    const event = {
      target: {
        name,
        value: newValues,
      },
    };
    onChange(event);
  };

  const handleAddItem = () => {
    // If there are no items or the list is empty, add the first item
    if (items.length === 0) {
      handleChange([""]);
      return;
    }

    // Otherwise, check if the last item is empty
    if (items[items.length - 1] === "" || items[items.length - 1] === null) {
      // Don't add a new item if previous is empty or null
      return;
    }
    handleChange([...items, ""]);
  };

  const handleRemoveItem = (index) => {
    const newValues = [...items];
    newValues.splice(index, 1);
    handleChange(newValues);
  };

  const handleChangeItem = (index, itemValue) => {
    const newValues = [...items];
    newValues[index] = itemValue;
    handleChange(newValues);
  };

  // Import X and Plus icons from wherever you're using them
  // For this example, I'll assume they're from lucide-react
  const X = (props) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={props.size || 24}
      height={props.size || 24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18"></path>
      <path d="m6 6 12 12"></path>
    </svg>
  );

  const Plus = (props) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={props.size || 24}
      height={props.size || 24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5v14"></path>
      <path d="M5 12h14"></path>
    </svg>
  );

  return (
    <div className={`mb-4 w-full ${className}`}>
      {label && (
        <label className="block text-secondary/90 text-sm font-medium mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex items-center space-x-2">
            <input
              type="text"
              value={item || ""}
              onChange={(e) => handleChangeItem(index, e.target.value)}
              placeholder={placeholder}
              className={`
                flex-grow px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 text-sm
                ${
                  error
                    ? "border-red-500 focus:border-red-500 focus:ring-red-300/30"
                    : "border-gray-200 focus:border-teal-500 focus:ring-teal-500/20"
                }
              `}
              {...props}
            />
            <button
              type="button"
              onClick={() => handleRemoveItem(index)}
              className="p-2 text-gray-500 hover:text-red-500"
              aria-label="Remove item"
            >
              <X size={20} />
            </button>
          </div>
        ))}

        <div className="relative">
          <input
            type="text"
            placeholder={`${placeholder}...`}
            className={`
              w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 text-sm
              ${
                error
                  ? "border-red-500 focus:border-red-500 focus:ring-red-300/30"
                  : "border-gray-200 focus:border-teal-500 focus:ring-teal-500/20"
              }
            `}
            readOnly
            onClick={handleAddItem}
          />
          <button
            type="button"
            onClick={handleAddItem}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 bg-teal-500 text-white rounded-full hover:bg-teal-600"
            aria-label="Add item"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      {error && errorMessage && (
        <p className="text-red-500 text-xs mt-1">{errorMessage}</p>
      )}
    </div>
  );
}

/**
 * FileInput Component
 */
export function FileInput({
  label,
  name,
  onChange,
  accept = "",
  error = false,
  errorMessage = "",
  required = false,
  className = "",
  ...props
}) {
  const [fileNames, setFileNames] = useState("");

  const handleChange = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      const namesList = Array.from(files)
        .map((file) => file.name)
        .join(", ");
      setFileNames(namesList);
    } else {
      setFileNames("");
    }

    if (onChange) {
      onChange(e);
    }
  };

  return (
    <div className={`mb-4 w-full ${className}`}>
      {label && (
        <label className="block text-secondary/90 text-sm font-medium mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          type="file"
          id={`${name}-file-input`}
          name={name}
          onChange={handleChange}
          accept={accept}
          className="hidden"
          required={required}
          {...props}
        />

        <label
          htmlFor={`${name}-file-input`}
          className={`
            w-full flex items-center px-4 py-3 rounded-xl border-2 focus:outline-none text-sm
            cursor-pointer
            ${
              error ? "border-red-500" : "border-gray-200 hover:border-teal-500"
            }
          `}
        >
          <span
            className={`flex-grow truncate ${
              fileNames ? "text-secondary" : "text-secondary/50"
            }`}
          >
            {fileNames || accept || "Select file..."}
          </span>
          <Upload className="text-teal-500" size={20} />
        </label>
      </div>

      {error && errorMessage && (
        <p className="text-red-500 text-xs mt-1">{errorMessage}</p>
      )}
    </div>
  );
}
export const EditableTextField = ({
  label,
  value,
  onChange,
  name,
  icon: Icon,
  iconColor = "text-primary",
  bigSize = true,
  error,
}) => {
  return (
    <FormField label={label} bigSize={bigSize}>
      <div className=" rounded-lg p-2 flex items-center">
        {Icon && <Icon className={`mr-2 ${iconColor}`} size={20} />}
        <input
          type="text"
          name={name}
          value={value}
          onChange={onChange}
          className={`
            w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2  text-xs md:text-sm
            ${
              error
                ? "border-error focus:border-error focus:ring-error/30"
                : "border-gray-200 focus:border-primary focus:ring-primary/20"
            }
          `}
        />
      </div>
    </FormField>
  );
};

export const EditableTextAreaField = ({
  label,
  value,
  onChange,
  name,
  icon: Icon,
  iconColor = "text-primary",
  bigSize = true,
  error,
}) => {
  return (
    <FormField label={label} bigSize={bigSize}>
      <div className=" rounded-lg p-2 flex items-center">
        {Icon && <Icon className={`mr-2 ${iconColor}`} size={20} />}
        <textarea
          type="text"
          name={name}
          value={value}
          onChange={onChange}
          className={`
            w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2  text-xs md:text-sm
            ${
              error
                ? "border-error focus:border-error focus:ring-error/30"
                : "border-gray-200 focus:border-primary focus:ring-primary/20"
            }
          `}
        />
      </div>
    </FormField>
  );
};

export const EditableFileField = ({ label, value, onChange, name }) => {
  const [fileName, setFileName] = useState(
    value ? value.split("/").pop() : "No file selected"
  );

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileName(file.name);
      onChange({ target: { name, value: file } });
    }
  };

  return (
    <FormField label={label}>
      <div className="bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-between">
        <FileText className="text-primary mr-2" size={20} />
        <span className="text-secondary flex-grow">{fileName}</span>
        <input
          type="file"
          onChange={handleFileChange}
          className="hidden"
          id={`file-upload-${name}`}
        />
        <label
          htmlFor={`file-upload-${name}`}
          className="bg-primary text-white text-xs px-2 py-1 rounded cursor-pointer"
        >
          Browse
        </label>
      </div>
    </FormField>
  );
};

// FormField component to maintain consistency
export const FormField = ({ label, children, className = "", bigSize }) => {
  return (
    <div
      className={`flex flex-col md:flex-row items-start md:items-center w-full  ${className}`}
    >
      <label
        className={`text-gray-800 font-medium text-base ${
          !bigSize ? "md:w-1/2" : "md:w-1/4"
        } mb-1 md:mb-0`}
      >
        {label}
      </label>
      <div className={`${!bigSize ? "md:w-1/2" : "md:w-3/4"} w-full`}>
        {children}
      </div>
    </div>
  );
};
