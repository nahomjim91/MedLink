import { useState, useEffect } from "react";
import { X, Filter, Calendar, DollarSign, CreditCard, User } from "lucide-react";
import { Button } from "../ui/Button";

export function TransactionFilterModal({
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
    minAmount: "",
    maxAmount: "",
    chapaRef: "",
    orderId: "",
    ...currentFilters,
  });

  useEffect(() => {
    setFilters((prev) => ({ ...prev, ...currentFilters }));
  }, [currentFilters]);

  const statusOptions = [
    { value: "", label: "All Statuses" },
    { value: "PENDING", label: "Pending" },
    { value: "PROCESSING", label: "Processing" },
    { value: "PAID_HELD_BY_SYSTEM", label: "Paid (Held)" },
    { value: "RELEASED_TO_SELLER", label: "Released to Seller" },
    { value: "FAILED", label: "Failed" },
    { value: "CANCELLED", label: "Cancelled" },
    { value: "REFUNDED", label: "Refunded" },
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
      minAmount: "",
      maxAmount: "",
      chapaRef: "",
      orderId: "",
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
            <h2 className="text-lg font-semibold">Filter Transactions</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-error/60 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <div className="flex items-center gap-1">
                <CreditCard size={16} />
                Status
              </div>
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
                <div className="flex items-center gap-1">
                  <Calendar size={16} />
                  From Date
                </div>
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
                <div className="flex items-center gap-1">
                  <Calendar size={16} />
                  To Date
                </div>
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleInputChange("dateTo", e.target.value)}
                className="w-full p-2 rounded-xl border-2 focus:outline-none focus:ring-2 text-xs md:text-sm appearance-none bg-white border-gray-200 focus:border-primary focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Amount Range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <div className="flex items-center gap-1">
                  <DollarSign size={16} />
                  Min Amount (ETB)
                </div>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={filters.minAmount}
                onChange={(e) => handleInputChange("minAmount", e.target.value)}
                className="w-full p-2 rounded-xl border-2 focus:outline-none focus:ring-2 text-xs md:text-sm appearance-none bg-white border-gray-200 focus:border-primary focus:ring-primary/20"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <div className="flex items-center gap-1">
                  <DollarSign size={16} />
                  Max Amount (ETB)
                </div>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={filters.maxAmount}
                onChange={(e) => handleInputChange("maxAmount", e.target.value)}
                className="w-full p-2 rounded-xl border-2 focus:outline-none focus:ring-2 text-xs md:text-sm appearance-none bg-white border-gray-200 focus:border-primary focus:ring-primary/20"
                placeholder="999999.99"
              />
            </div>
          </div>

          {/* Order ID Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <div className="flex items-center gap-1">
                <User size={16} />
                Order ID
              </div>
            </label>
            <input
              type="text"
              value={filters.orderId}
              onChange={(e) => handleInputChange("orderId", e.target.value)}
              className="w-full p-2 rounded-xl border-2 focus:outline-none focus:ring-2 text-xs md:text-sm appearance-none bg-white border-gray-200 focus:border-primary focus:ring-primary/20"
              placeholder="Search by order ID..."
            />
          </div>

          {/* Chapa Reference Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <div className="flex items-center gap-1">
                <CreditCard size={16} />
                Chapa Reference
              </div>
            </label>
            <input
              type="text"
              value={filters.chapaRef}
              onChange={(e) => handleInputChange("chapaRef", e.target.value)}
              className="w-full p-2 rounded-xl border-2 focus:outline-none focus:ring-2 text-xs md:text-sm appearance-none bg-white border-gray-200 focus:border-primary focus:ring-primary/20"
              placeholder="Search by Chapa reference..."
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