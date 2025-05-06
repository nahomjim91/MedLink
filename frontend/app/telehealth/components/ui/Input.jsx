import { useState } from "react";
import { Eye, EyeOff, Check , ChevronDown } from "lucide-react";
import { FaMapMarkerAlt } from "react-icons/fa";


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
  const effectiveValue = (!value && defaultToFirstOption && options.length > 0) 
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
        value: selectedValue
      }
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
            <option key={option.value} value={option.value} className="text-gray-900">
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
        value: selectedDate
      }
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
        { id: 2, address: `${query} Broadway`, city: "Los Angeles", state: "CA" },
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
        value: fullAddress
      }
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
              value: mockAddress
            }
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
                <div className="text-gray-500">{suggestion.city}, {suggestion.state}</div>
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
