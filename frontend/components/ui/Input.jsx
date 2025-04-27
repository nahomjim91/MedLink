import { useState } from "react";
import { Eye, EyeOff, Check , ChevronDown } from "lucide-react";

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


/**
 * Select Dropdown Component with enhanced styling
 */
export function SelectInput({
  label,
  value,
  onChange,
  options = [],
  error = false,
  errorMessage = "",
  placeholder = "Select an option",
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
      <div className="relative">
        <select
          value={value}
          onChange={onChange}
          className={`
              w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 text-xs md:text-sm
              appearance-none bg-white pr-10
              ${!value ? "text-gray-500" : "text-gray-900"}
              ${
                error
                  ? "border-error focus:border-error focus:ring-error/30"
                  : "border-gray-200 focus:border-primary focus:ring-primary/20"
              }
            `}
          required={required}
          {...props}
        >
          <option value="" disabled className="text-gray-500">
            {placeholder}
          </option>
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
    
    // Validate against min/max if provided
    if (min && selectedDate < min) {
      // You can handle this validation error separately if needed
      onChange(e); // Still update the value to show the user's selection
      return;
    }
    
    if (max && selectedDate > max) {
      // You can handle this validation error separately if needed
      onChange(e); // Still update the value to show the user's selection
      return;
    }
    
    onChange(e);
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
        value={value}
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
