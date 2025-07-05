import { useState } from "react";
import { Eye, EyeOff, Check, ChevronDown, Star } from "lucide-react";
import { FaMapMarkerAlt } from "react-icons/fa";
import { Search } from "lucide-react";
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
              ${!effectiveValue ? "text-gray-500" : "text-secondary"}
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
              className="text-secondary"
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
  error = false,
  errorMessage = "",
  fullWidth = false,
  required = false,
  className = "",
  ...props
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [isFocused, setIsFocused] = useState(false);

  // This would typically connect to a location API
  const fetchAddressSuggestions = (query) => {
    if (!query) {
      setSuggestions([]);
      return;
    }

    // Mock implementation - replace with actual API call
    setTimeout(() => {
      setSuggestions([
        { id: 1, address: `${query} Main St`, city: "New York", state: "NY" },
        {
          id: 2,
          address: `${query} Broadway`,
          city: "Los Angeles",
          state: "CA",
        },
        { id: 3, address: `${query} 5th Ave`, city: "Chicago", state: "IL" },
      ]);
    }, 300);
  };

  // Standard input change handler that creates a synthetic event
  const handleInputChange = (e) => {
    onChange(e); // Pass the actual event object through
    fetchAddressSuggestions(e.target.value);
  };

  // For suggestion selection, create a synthetic event
  const handleSelectSuggestion = (suggestion) => {
    const fullAddress = `${suggestion.address}, ${suggestion.city}, ${suggestion.state}`;

    // Create a synthetic event object
    const syntheticEvent = {
      target: {
        name,
        value: fullAddress,
      },
    };

    onChange(syntheticEvent);
    setSuggestions([]);
  };

  // For current location, create a synthetic event
  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Mock address - would normally use reverse geocoding
          const mockAddress = "Current Location (123 Main St)";

          // Create a synthetic event object
          const syntheticEvent = {
            target: {
              name,
              value: mockAddress,
            },
          };

          onChange(syntheticEvent);
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
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
        >
          <FaMapMarkerAlt size={18} />
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
                  {suggestion.city}, {suggestion.state}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
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
      <IconButton icon={<Search/>} isActive={true} />
      </div>
    </div>
  );
};

export const Rating = ({ label, value, showValue = true, maxStars = 5 }) => {
  // Ensure value is between 0 and maxStars
  const ratingValue = Math.max(0, Math.min(maxStars, value));
  
  // Generate array of star indices
  const stars = Array.from({ length: maxStars }, (_, i) => i + 1);
  
  return (
      <div className="flex items-center bg-gray-50 rounded-lg p-3">
        <div className="flex items-center">
          {stars.map((star) => {
            // Full star
            if (star <= Math.floor(ratingValue)) {
              return (
                <Star 
                  key={star}
                  className="text-primary/60 fill-primary" 
                  size={18}
                />
              );
            }
            // Half star
            else if (star <= ratingValue + 0.5) {
              return (
                <div key={star} className="relative">
                  {/* Empty star as background */}
                  <Star className="text-primary/60" size={18} />
                  {/* Half-filled star (clipped) */}
                  <div className="absolute inset-0 overflow-hidden w-1/2">
                    <Star className="text-primary/60 fill-primary" size={18} />
                  </div>
                </div>
              );
            }
            // Empty star
            else {
              return <Star key={star} className="text-primary/60" size={18} />;
            }
          })}
        </div>
        
        {showValue && (
          <span className="ml-2 text-base font-bold">{ratingValue.toFixed(1)}</span>
        )}
      </div>
  );
};

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