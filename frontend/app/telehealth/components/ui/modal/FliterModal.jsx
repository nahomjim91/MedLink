import React, { useState, useEffect } from "react";
import { X, Filter, Calendar, DollarSign, Clock, FileText } from "lucide-react";

export const FilterAppointmentModal = ({ isOpen, onClose, onApply, onReset }) => {
  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      onClick={handleOverlayClick}
      className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4 transition-opacity duration-300"
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md transform transition-all duration-300 animate-modal-enter">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-xl font-bold text-secondary/70">
            Advanced Filters
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-secondary" />
          </button>
        </div>
        <div className="p-6">
          <div className="space-y-6">
            <div>
              <label className="text-sm font-semibold text-secondary/80 mb-3 block">
                Date Range
              </label>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all"
                  placeholder="From"
                />
                <input
                  type="date"
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all"
                  placeholder="To"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-secondary/80 mb-3 block">
                Specialists
              </label>
              <select className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all">
                <option>All Specialists</option>
                <option>Dentist</option>
                <option>Cardiologist</option>
                <option>Dermatologist</option>
                <option>Orthopedic</option>
                <option>Ophthalmologist</option>
                <option>General Practitioner</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-secondary/80 mb-3 block">
                Status
              </label>
              <select className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all">
                <option>All Status</option>
                <option>Upcoming</option>
                <option>Completed</option>
                <option>Cancelled</option>
              </select>
            </div>
          </div>
          <div className="mt-8 flex justify-end space-x-3">
            <button
              onClick={onReset}
              className="px-6 py-3 rounded-xl text-secondary/80 bg-gray-100 hover:bg-gray-200 transition-colors font-semibold"
            >
              Reset All
            </button>
            <button
              onClick={onApply}
              className="px-6 py-3 rounded-xl text-white bg-gradient-to-r from-teal-500 to-primary hover:from-primary hover:to-teal-700 transition-all font-semibold shadow-lg"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


export const TransactionFilterModal = ({ 
  isOpen, 
  onClose, 
  onApply, 
  onReset, 
  filterType = "transaction" // "transaction" or "refund"
}) => {
  const [filters, setFilters] = useState({
    type: [],
    status: [],
    startDate: "",
    endDate: "",
    minAmount: "",
    maxAmount: "",
    orderBy: "createdAt",
    orderDirection: "desc"
  });

  const transactionTypes = [
    { value: "DEPOSIT", label: "Deposit" },
    { value: "PAYMENT", label: "Payment" },
    { value: "REFUND", label: "Refund" }
  ];

  const transactionStatuses = [
    { value: "PENDING", label: "Pending" },
    { value: "SUCCESS", label: "Success" },
    { value: "FAILED", label: "Failed" }
  ];

  const refundStatuses = [
    { value: "REQUESTED", label: "Requested" },
    { value: "APPROVED", label: "Approved" },
    { value: "PROCESSED", label: "Processed" },
    { value: "REJECTED", label: "Rejected" }
  ];

  const orderByOptions = filterType === "transaction" 
    ? [
        { value: "createdAt", label: "Date Created" },
        { value: "amount", label: "Amount" }
      ]
    : [
        { value: "requestedAt", label: "Date Requested" },
        { value: "processedAt", label: "Date Processed" },
        { value: "amount", label: "Amount" }
      ];

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleArrayFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter(item => item !== value)
        : [...prev[key], value]
    }));
  };

  const handleApply = () => {
    // Clean up empty filters
    const cleanFilters = Object.entries(filters).reduce((acc, [key, value]) => {
      if (Array.isArray(value) && value.length > 0) {
        acc[key] = value;
      } else if (!Array.isArray(value) && value !== "") {
        acc[key] = value;
      }
      return acc;
    }, {});

    onApply(cleanFilters);
    onClose();
  };

  const handleReset = () => {
    setFilters({
      type: [],
      status: [],
      startDate: "",
      endDate: "",
      minAmount: "",
      maxAmount: "",
      orderBy: filterType === "transaction" ? "createdAt" : "requestedAt",
      orderDirection: "desc"
    });
    onReset();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-modal-enter">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Filter className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-secondary/70">
              Filter {filterType === "transaction" ? "Transactions" : "Refunds"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Transaction Type Filter (only for transactions) */}
          {filterType === "transaction" && (
            <div>
              <label className="flex items-center space-x-2 text-sm font-semibold text-secondary/70 mb-3">
                <FileText className="w-4 h-4" />
                <span>Transaction Type</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {transactionTypes.map(type => (
                  <label
                    key={type.value}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={filters.type.includes(type.value)}
                      onChange={() => handleArrayFilterChange("type", type.value)}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-secondary/60">{type.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Status Filter */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-semibold text-secondary/70 mb-3">
              <Clock className="w-4 h-4" />
              <span>Status</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(filterType === "transaction" ? transactionStatuses : refundStatuses).map(status => (
                <label
                  key={status.value}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={filters.status.includes(status.value)}
                    onChange={() => handleArrayFilterChange("status", status.value)}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-secondary/60">{status.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Date Range Filter */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-semibold text-secondary/70 mb-3">
              <Calendar className="w-4 h-4" />
              <span>Date Range</span>
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-secondary/50 mb-1">From</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange("startDate", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs text-secondary/50 mb-1">To</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange("endDate", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* Amount Range Filter */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-semibold text-secondary/70 mb-3">
              <DollarSign className="w-4 h-4" />
              <span>Amount Range</span>
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-secondary/50 mb-1">Min Amount</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={filters.minAmount}
                  onChange={(e) => handleFilterChange("minAmount", e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs text-secondary/50 mb-1">Max Amount</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={filters.maxAmount}
                  onChange={(e) => handleFilterChange("maxAmount", e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* Sort Options */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-semibold text-secondary/70 mb-3">
              <span>Sort By</span>
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-secondary/50 mb-1">Order By</label>
                <select
                  value={filters.orderBy}
                  onChange={(e) => handleFilterChange("orderBy", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  {orderByOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-secondary/50 mb-1">Direction</label>
                <select
                  value={filters.orderDirection}
                  onChange={(e) => handleFilterChange("orderDirection", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  <option value="desc">Newest First</option>
                  <option value="asc">Oldest First</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          <button
            onClick={handleReset}
            className="px-6 py-2 text-sm font-semibold text-secondary/60 hover:text-secondary/80 transition-colors"
          >
            Reset All
          </button>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-2 text-sm font-semibold text-secondary/60 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="px-6 py-2 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};