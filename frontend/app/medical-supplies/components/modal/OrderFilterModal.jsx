import { useState, useEffect } from "react";
import { X, Filter, Calendar, DollarSign, Package, User } from "lucide-react";
import { Button } from "../ui/Button";

export function OrderFilterModal({
  isOpen,
  onClose,
  onApplyFilters,
  currentFilters = {},
  userRole,
}) {
  const [filters, setFilters] = useState({
    status: "",
    dateFrom: "",
    dateTo: "",
    minValue: "",
    maxValue: "",
    orderBy: "",
    ...currentFilters,
  });

  useEffect(() => {
    setFilters((prev) => ({ ...prev, ...currentFilters }));
  }, [currentFilters]);

  const statusOptions = [
    { value: "", label: "All Statuses" },
    { value: "PENDING_CONFIRMATION", label: "Pending" },
    { value: "CONFIRMED", label: "Confirmed" },
    { value: "PREPARING", label: "Preparing" },
    { value: "READY_FOR_PICKUP", label: "Ready" },
    { value: "SCHEDULED_FOR_PICKUP", label: "Scheduled" },
    { value: "OUT_FOR_DELIVERY", label: "Out For Delivery" },
    { value: "DELIVERED", label: "Delivered" },
    { value: "CANCELLED", label: "Cancelled" },
  ];

  const handleInputChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleClear = () => {
    const clearedFilters = {
      status: "",
      dateFrom: "",
      dateTo: "",
      minValue: "",
      maxValue: "",
      orderBy: "",
    };
    setFilters(clearedFilters);
    onApplyFilters(clearedFilters);
  };

  const hasActiveFilters = Object.values(filters).some((value) => value !== "");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/20 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b border-secondary/20">
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-primary" />
            <h2 className="text-lg font-semibold">Filter Orders</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1  rounded-full hover:bg-error/60 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleInputChange("status", e.target.value)}
              className="w-full p-2 rounded-xl border-2 focus:outline-none focus:ring-2 text-xs md:text-sm appearance-none bg-white border-gray-200 focus:border-primary focus:ring-primary/20"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Filter */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From Date
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleInputChange("dateFrom", e.target.value)}
                className="w-full p-2 rounded-xl border-2 focus:outline-none focus:ring-2 text-xs md:text-sm appearance-none bg-white border-gray-200 focus:border-primary focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To Date
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleInputChange("dateTo", e.target.value)}
                className="w-full p-2 rounded-xl border-2 focus:outline-none focus:ring-2 text-xs md:text-sm appearance-none bg-white border-gray-200 focus:border-primary focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Order Value Range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Value ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={filters.minValue}
                onChange={(e) => handleInputChange("minValue", e.target.value)}
                className="w-full p-2 rounded-xl border-2 focus:outline-none focus:ring-2 text-xs md:text-sm appearance-none bg-white border-gray-200 focus:border-primary focus:ring-primary/20"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Value ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={filters.maxValue}
                onChange={(e) => handleInputChange("maxValue", e.target.value)}
                className="w-full p-2 rounded-xl border-2 focus:outline-none focus:ring-2 text-xs md:text-sm appearance-none bg-white border-gray-200 focus:border-primary focus:ring-primary/20"
                placeholder="999.99"
              />
            </div>
          </div>

          {/* Order By Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {userRole === "healthcare-facility" ? "Supplier" : "Customer"}
            </label>
            <input
              type="text"
              value={filters.orderBy}
              onChange={(e) => handleInputChange("orderBy", e.target.value)}
              className="w-full p-2 rounded-xl border-2 focus:outline-none focus:ring-2 text-xs md:text-sm appearance-none bg-white border-gray-200 focus:border-primary focus:ring-primary/20"
              placeholder={`Search by ${
                userRole === "healthcare-facility" ? "supplier" : "customer"
              } name...`}
            />
          </div>

          {/* Active Filters Indicator */}
          {hasActiveFilters && (
            <div className="bg-blue-50 p-3 rounded-md">
              <p className="text-sm text-primary font-medium">
                {Object.values(filters).filter((v) => v !== "").length}{" "}
                filter(s) active
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-between gap-3 p-4 border-t border-secondary/20 bg-gray-50">
          <button
            onClick={handleClear}
            className="px-4 py-2 text-gray-600 hover:text-error font-medium"
          >
            Clear All
          </button>
          <div className="flex gap-2">
            <Button onClick={onClose} variant="outline" color="error">
              Cancel
            </Button>
            <Button onClick={handleApply}>Apply Filters</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
