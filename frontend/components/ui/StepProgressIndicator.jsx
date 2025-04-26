import { useState, useEffect } from "react";

export function StepProgressIndicator({
  currentStep = 1,
  totalSteps = 5,
  className = "",
}) {
  // Track screen size for responsive behavior
  const [isMobile, setIsMobile] = useState(false);

  // Ensure current step is within bounds
  const activeStep = Math.max(1, Math.min(currentStep, totalSteps));

  // Set up screen size listener
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768); // 768px is standard md breakpoint
    };

    // Initial check
    checkScreenSize();

    // Add listener
    window.addEventListener("resize", checkScreenSize);

    // Cleanup
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Mobile view - just lines with gaps
  if (isMobile) {
    return (
      <div
        className={`w-full flex items-center justify-between gap-2 px-1 ${className}`}
      >
        {Array.from({ length: totalSteps - 1 }).map((_, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber <= activeStep;

          return (
            <div
              key={stepNumber}
              className={`h-2 rounded-full flex-1`}
              style={{
                backgroundColor: isActive
                  ? "var(--color-primary, #25C8B1)"
                  : "#e5e7eb",
              }}
            ></div>
          );
        })}
      </div>
    );
  }

  // Desktop view - circles with numbers and connecting lines
  return (
    <div className={`w-full ${className}`}>
      <div className="w-full flex items-center">
        {Array.from({ length: totalSteps }).map((_, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber <= activeStep;
          const isLast = stepNumber === totalSteps;

          return (
            <div
              key={stepNumber}
              className="flex items-center flex-1 last:flex-initial"
            >
              {/* Circle with number */}
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium flex-shrink-0"
                style={{
                  backgroundColor: isActive
                    ? "var(--color-primary, #25C8B1)"
                    : "#e5e7eb",
                  color: isActive ? "white" : "#9ca3af",
                }}
              >
                {stepNumber}
              </div>

              {/* Connecting line (if not the last item) */}
              {!isLast && (
                <div
                  className="h-2 w-full ml-1 mr-1 rounded-full"
                  style={{
                    backgroundColor:
                      stepNumber < activeStep
                        ? "var(--color-primary, #25C8B1)"
                        : "#e5e7eb",
                  }}
                ></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
