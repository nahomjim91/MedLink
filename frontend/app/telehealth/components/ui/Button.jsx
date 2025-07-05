import Image from "next/image";

export function Button({
  variant = "fill",
  color = "primary",
  onClick,
  fullWidth = false,
  size = "md",
  children,
  disabled = false,
  className = "",
  ...props
}) {
  // Determine color classes based on variant and color
  let colorClasses = "";

  if (variant === "fill") {
    if (color === "primary") {
      colorClasses =
        "bg-primary text-white hover:bg-primary/90 focus:ring-primary/30";
    } else if (color === "secondary") {
      colorClasses =
        "bg-secondary text-white hover:bg-secondary/90 focus:ring-secondary/30";
    } else if (color === "error") {
      colorClasses =
        "bg-error text-white hover:bg-error/90 focus:ring-error/30";
    } else {
      // Custom color (expecting hex or tailwind class)
      colorClasses = `bg-[${color}] text-white hover:opacity-90 focus:ring-[${color}]/30`;
    }
  } else if (variant === "outline") {
    if (color === "primary") {
      colorClasses =
        "border-primary border-2 text-primary hover:bg-primary/5 focus:ring-primary/30";
    } else if (color === "secondary") {
      colorClasses =
        "border-secondary border-2 text-secondary hover:bg-secondary/5 focus:ring-secondary/30";
    } else if (color === "error") {
      colorClasses =
        "border-error border-2 text-error hover:bg-error/5 focus:ring-error/30";
    } else {
      // Custom color
      colorClasses = `border-[${color}] border-2 text-[${color}] hover:bg-[${color}]/5 focus:ring-[${color}]/30`;
    }
  }

  // Size classes
  let sizeClasses = "";
  switch (size) {
    case "sm":
      sizeClasses = "px-3 py-1.5 text-sm";
      break;
    case "lg":
      sizeClasses = "px-6 py-3.5 text-lg";
      break;
    case "md":
    default:
      sizeClasses = "px-4 py-2.5 text-base";
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
          rounded-full font-medium transition-colors focus:outline-none focus:ring-4
          ${colorClasses}
          ${sizeClasses}
          ${fullWidth ? "w-full" : ""}
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
          ${className}
        `}
      {...props}
    >
      {children}
    </button>
  );
}

export function OAuthButton({
  provider,
  onClick,
  fullWidth = false,
  className = "",
  ...props
}) {
  const providers = {
    google: {
      logo: (
        <svg
          viewBox="0 0 24 24"
          width="24"
          height="24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
            <path
              fill="#4285F4"
              d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"
            />
            <path
              fill="#34A853"
              d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"
            />
            <path
              fill="#FBBC05"
              d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"
            />
            <path
              fill="#EA4335"
              d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"
            />
          </g>
        </svg>
      ),
      text: "Continue with Google",
    },
    // Add more providers if needed
  };

  const selectedProvider = providers[provider] || {
    logo: null,
    text: `Continue with ${provider}`,
  };

  return (
    <button
      onClick={onClick}
      className={`
          flex items-center justify-center gap-3 px-4 py-3 rounded-full border-2 border-primary text-sm md:text-base
           text-secondary hover:bg-primary/5 focus:ring-primary/30
          ${fullWidth ? "w-full" : ""}
          ${className}
        `}
      {...props}
    >
      {selectedProvider.logo}
      <span>{selectedProvider.text}</span>
    </button>
  );
}

export function StepButtons({
  onPrevious,
  onNext,
  previousLabel = "Previous Step",
  nextLabel = "Next Step",
  showPrevious = true,
  showNext = true,
  className = "",
}) {
  return (
    <div className={`flex justify-between gap-4 mt-6   ${className}`}>
      <div>
        {showPrevious && (
          <Button
            variant="outline"
            color="primary"
            onClick={onPrevious}
            className={`  flex-1 sm:flex-initial text-sm md:text-base`}
          >
            {previousLabel}
          </Button>
        )}
      </div>

      <div>
        {showNext && (
          <Button
            variant="fill"
            color="primary"
            onClick={onNext}
            className={`flex-1 sm:flex-initial text-sm md:text-base ${
              !showPrevious ? "ml-auto" : ""
            }`}
          >
            {nextLabel}
          </Button>
        )}
      </div>
    </div>
  );
}

export const IconButton = ({ icon, badge, isActive, onClick  }) => {
  return (
    <button
      onClick={onClick}
      className={`relative p-2 md:p-3  rounded-full transition-all ${
        isActive
          ? "bg-primary text-white"
          : "bg-white text-gray-700 "
      }`}
    >
      {icon}
      {badge && badge > 0 ? (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
          {badge}
        </span>
      ) : (
        ""
      )}
    </button>
  );
};

export const ImageIconButton = ({
  imageUrl,
  onClick,
  alt = "Icon",
  isActive = false,
}) => {
  return (
    <button
      onClick={onClick}
      className={`relative w-10 h-10 rounded-3xl overflow-hidden cursor-pointer ${
        isActive ? "ring-2 ring-primary" : ""
      }`}
    >
      <Image
        src={ imageUrl.startsWith("http") || imageUrl.startsWith("blob:")
      ? imageUrl
      : process.env.NEXT_PUBLIC_MEDICAL_SUPPLIES_API_URL + imageUrl
  }
        alt={alt}
        fill
        sizes="2.25rem"
        style={{ objectFit: "cover" }}
        className="rounded-3xl shadow-lg"
        priority
      />
    </button>
  );
};
