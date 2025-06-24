'use client';
import { ChevronLeft, ChevronRight } from "lucide-react";
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

// --- Pagination Component ---
export const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  return (
    <div className="flex items-center justify-between mt-6 px-2">
      <div className="text-sm text-secondary/60">
        Page {currentPage} of {totalPages}
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center space-x-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }

            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`w-8 h-8 text-sm rounded-lg transition-colors ${
                  currentPage === pageNum
                    ? "bg-teal-500 text-white"
                    : "hover:bg-gray-100 text-secondary/80"
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};