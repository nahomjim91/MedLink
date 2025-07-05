"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useQuery } from '@apollo/client';
import {
  DollarSign,
  Filter,
  X,
  Calendar,
  Clock,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  CreditCard,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
} from "lucide-react";

import { TransactionFilterModal } from "../modal/FliterModal";
import { Pagination } from "../StepProgressIndicator";
import { useAuth } from "../../../hooks/useAuth";
import {
  GET_MY_TRANSACTIONS,
  GET_MY_REFUNDS,
  GET_TRANSACTION_STATS,
  GET_REFUND_STATS,
} from "../../../api/graphql/transaction/transactionQueries";

export default function Transactions() {
  const [activeTab, setActiveTab] = useState("transactions");
  const [isFilterModalOpen, setFilterModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState({});

  const itemsPerPage = 5;
  const itemsPerPageForMobile = 2;

  // Get user context
  const { user } = useAuth();

  // GraphQL queries for transactions
  const {
    data: transactionsData,
    loading: transactionsLoading,
    refetch: refetchTransactions,
  } = useQuery(GET_MY_TRANSACTIONS, {
    variables: {
      limit: 100, // Get all for client-side pagination
      offset: 0,
    },
    fetchPolicy: 'cache-and-network',
  });

  // GraphQL queries for refunds
  const {
    data: refundsData,
    loading: refundsLoading,
    refetch: refetchRefunds,
  } = useQuery(GET_MY_REFUNDS, {
    variables: {
      limit: 100, // Get all for client-side pagination
      offset: 0,
    },
    fetchPolicy: 'cache-and-network',
    skip: user.role === "doctor",
  });

  // GraphQL queries for statistics
  const {
    data: transactionStatsData,
    loading: transactionStatsLoading,
    refetch: refetchTransactionStats,
  } = useQuery(GET_TRANSACTION_STATS, {
    fetchPolicy: 'cache-and-network',
  });

  const {
    data: refundStatsData,
    loading: refundStatsLoading,
    refetch: refetchRefundStats,
  } = useQuery(GET_REFUND_STATS, {
    fetchPolicy: 'cache-and-network',
  });

  // Extract data from queries
  const transactions = transactionsData?.myTransactions || [];
  const refunds = refundsData?.myRefunds || [];
  const transactionStats = transactionStatsData?.transactionStats || {};
  const refundStats = refundStatsData?.refundStats || {};

  // Loading states
  const loading = transactionsLoading || refundsLoading || transactionStatsLoading || refundStatsLoading;

  // Refresh data based on active tab
  const refreshData = useCallback(async () => {
    try {
      if (activeTab === "transactions") {
        await refetchTransactions();
        await refetchTransactionStats();
      } else {
        await refetchRefunds();
        await refetchRefundStats();
      }
    } catch (error) {
      console.error("Error refreshing data:", error);
    }
  }, [activeTab, refetchTransactions, refetchRefunds, refetchTransactionStats, refetchRefundStats]);

  // Auto-refresh when tab changes
  useEffect(() => {
    refreshData();
  }, [activeTab, refreshData]);

  // Filter data based on applied filters
  const filteredData = useMemo(() => {
    const currentData = activeTab === "transactions" ? transactions : refunds;
    
    if (!appliedFilters || Object.keys(appliedFilters).length === 0) {
      return currentData;
    }

    return currentData.filter(item => {
      // Type filter (only for transactions)
      if (appliedFilters.type && appliedFilters.type.length > 0 && activeTab === "transactions") {
        if (!appliedFilters.type.includes(item.type)) return false;
      }

      // Status filter
      if (appliedFilters.status && appliedFilters.status.length > 0) {
        if (!appliedFilters.status.includes(item.status)) return false;
      }

      // Date range filter
      const itemDate = new Date(activeTab === "transactions" ? item.createdAt : item.requestedAt);
      if (appliedFilters.startDate) {
        const startDate = new Date(appliedFilters.startDate);
        if (itemDate < startDate) return false;
      }
      if (appliedFilters.endDate) {
        const endDate = new Date(appliedFilters.endDate);
        endDate.setHours(23, 59, 59, 999); // End of day
        if (itemDate > endDate) return false;
      }

      // Amount range filter
      if (appliedFilters.minAmount && item.amount < parseFloat(appliedFilters.minAmount)) {
        return false;
      }
      if (appliedFilters.maxAmount && item.amount > parseFloat(appliedFilters.maxAmount)) {
        return false;
      }

      return true;
    });
  }, [activeTab, transactions, refunds, appliedFilters]);

  // Sort filtered data
  const sortedData = useMemo(() => {
    if (!appliedFilters.orderBy) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[appliedFilters.orderBy];
      const bValue = b[appliedFilters.orderBy];
      
      if (appliedFilters.orderDirection === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [filteredData, appliedFilters.orderBy, appliedFilters.orderDirection]);

  // Pagination logic
  const currentItemsPerPage = isMobile ? itemsPerPageForMobile : itemsPerPage;
  const totalPages = Math.ceil(sortedData.length / currentItemsPerPage);
  const startIndex = (currentPage - 1) * currentItemsPerPage;
  const paginatedData = sortedData.slice(startIndex, startIndex + currentItemsPerPage);

  // Reset to page 1 when tab changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  // Add this useEffect to detect mobile view
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'ETB',
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).toLowerCase();
  };

  const handleFilterApply = (filters) => {
    console.log("Applying filters:", filters);
    setAppliedFilters(filters);
    setCurrentPage(1);
  };

  const handleFilterReset = () => {
    console.log("Resetting filters...");
    setAppliedFilters({});
    setCurrentPage(1);
  };

  const handleViewDetails = (item) => {
    setSelectedTransaction(item);
    setDetailModalOpen(true);
  };

  const handleChangeTab = (tab) => {
    setActiveTab(tab);
    setAppliedFilters({});
    setCurrentPage(1);
    refreshData()
  };

  const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <div className="bg-white p-2 md:p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-secondary/60 text-sm md:text-base font-medium mb-1">
            {title}
          </p>
          <p className="text-2xl md:text-3xl font-bold text-secondary/70">
            {typeof value === 'number' && title.toLowerCase().includes('amount') 
              ? formatCurrency(value) 
              : value}
          </p>
          {subtitle && (
            <p className="text-xs text-secondary/50 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 md:p-4 rounded-2xl ${color}`}>
          <Icon className="w-6 h-6 md:w-8 md:h-8 text-white" />
        </div>
      </div>
    </div>
  );

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "SUCCESS":
      case "PROCESSED":
        return "bg-emerald-100 text-emerald-700 border border-emerald-200";
      case "PENDING":
      case "REQUESTED":
        return "bg-yellow-100 text-yellow-700 border border-yellow-200";
      case "APPROVED":
        return "bg-blue-100 text-blue-700 border border-blue-200";
      case "FAILED":
      case "REJECTED":
        return "bg-red-100 text-red-700 border border-red-200";
      default:
        return "bg-gray-100 text-secondary/80 border border-gray-200";
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "DEPOSIT":
        return <TrendingUp className="w-4 h-4" />;
      case "PAYMENT":
        return <TrendingDown className="w-4 h-4" />;
      case "REFUND":
        return <RefreshCw className="w-4 h-4" />;
      default:
        return <CreditCard className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "DEPOSIT":
        return "text-green-600";
      case "PAYMENT":
        return "text-red-600";
      case "REFUND":
        return "text-blue-600";
      default:
        return "text-gray-600";
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="">
      <div className="">
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-3">
          {activeTab === "transactions" ? (
            <>
              <StatCard
                title="Total Transactions"
                value={transactionStats.total || 0}
                icon={FileText}
                color="bg-gradient-to-br from-blue-500 to-blue-600"
              />
              <StatCard
                title="Success"
                value={transactionStats.success || 0}
                icon={CheckCircle}
                color="bg-gradient-to-br from-emerald-500 to-emerald-600"
              />
              <StatCard
                title="Pending"
                value={transactionStats.pending || 0}
                icon={AlertCircle}
                color="bg-gradient-to-br from-yellow-500 to-yellow-600"
              />
              <StatCard
                title="Total Amount"
                value={transactionStats.totalAmount || 0}
                icon={DollarSign}
                color="bg-gradient-to-br from-purple-500 to-purple-600"
              />
            </>
          ) : (
            <>
              <StatCard
                title="Total Refunds"
                value={refundStats.total || 0}
                icon={RefreshCw}
                color="bg-gradient-to-br from-blue-500 to-blue-600"
              />
              <StatCard
                title="Processed"
                value={refundStats.processed || 0}
                icon={CheckCircle}
                color="bg-gradient-to-br from-emerald-500 to-emerald-600"
              />
              <StatCard
                title="Requested"
                value={refundStats.requested || 0}
                icon={Clock}
                color="bg-gradient-to-br from-yellow-500 to-yellow-600"
              />
              <StatCard
                title="Total Amount"
                value={refundStats.totalAmount || 0}
                icon={DollarSign}
                color="bg-gradient-to-br from-purple-500 to-purple-600"
              />
            </>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
          {/* Header with tabs and filter */}
          <div className="p-2 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              {/* Tabs */}
              <div className="flex items-center space-x-1 bg-gray-100 rounded-2xl p-1">
                <button
                  onClick={() => handleChangeTab("transactions")}
                  className={`flex-1 sm:flex-none px-4 md:px-6 py-2 md:py-3 text-sm md:text-base font-semibold rounded-xl transition-all duration-200 ${
                    activeTab === "transactions"
                      ? "bg-white text-primary shadow-md"
                      : "text-secondary/60 hover:text-secondary/70"
                  }`}
                >
                  Transactions
                </button>
                 {user.role != "doctor" && (
                    
                <button
                  onClick={() => handleChangeTab("refunds")}
                  className={`flex-1 sm:flex-none px-4 md:px-6 py-2 md:py-3 text-sm md:text-base font-semibold rounded-xl transition-all duration-200 ${
                    activeTab === "refunds"
                      ? "bg-white text-primary shadow-md"
                      : "text-secondary/60 hover:text-secondary/70"
                  }`}
                >
                  Refunds
                </button>
                )}
              </div>

              {/* Filter and Refresh Buttons */}
              <div className="flex items-center space-x-2">
                 {user.role == "doctor" && (
                <button
                  onClick={refreshData}
                  className="flex items-center justify-center space-x-2 px-4 md:px-6 py-2 md:py-3 border-2 border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50 transition-all duration-200 font-semibold"
                >
                  <RefreshCw className="w-4 h-4 md:w-5 md:h-5" />
                  <span className="text-sm md:text-base">Refresh</span>
                </button>
                )}
                <button
                  onClick={() => setFilterModalOpen(true)}
                  className="flex items-center justify-center space-x-2 px-4 md:px-6 py-2 md:py-3 border-2 border-primary/50 rounded-xl text-primary hover:bg-primary hover:text-white transition-all duration-200 font-semibold"
                >
                  <Filter className="w-4 h-4 md:w-5 md:h-5" />
                  <span className="text-sm md:text-base">Filters</span>
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto h-[50vh] overflow-y-clip">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gradient-to-r from-teal-50 to-blue-50">
                    {activeTab === "transactions" ? (
                      <>
                        <th className="p-2 font-semibold text-secondary/80 rounded-l-xl">Type</th>
                        <th className="p-2 font-semibold text-secondary/80">Amount</th>
                        <th className="p-2 font-semibold text-secondary/80">Reason</th>
                        <th className="p-2 font-semibold text-secondary/80">Date & Time</th>
                        <th className="p-2 font-semibold text-secondary/80 text-center">Status</th>
                        <th className="p-2 font-semibold text-secondary/80 text-center rounded-r-xl">Actions</th>
                      </>
                    ) : (
                      <>
                        <th className="p-2 font-semibold text-secondary/80 rounded-l-xl">Amount</th>
                        <th className="p-2 font-semibold text-secondary/80">Reason</th>
                        <th className="p-2 font-semibold text-secondary/80">Requested Date</th>
                        <th className="p-2 font-semibold text-secondary/80">Processed Date</th>
                        <th className="p-2 font-semibold text-secondary/80 text-center">Status</th>
                        <th className="p-2 font-semibold text-secondary/80 text-center rounded-r-xl">Actions</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.length > 0 ? (
                    paginatedData.map((item, index) => (
                      <tr
                        key={activeTab === "transactions" ? item.transactionId : item.refundId}
                        className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                          index % 2 === 0 ? "bg-white" : "bg-secondary/50/50"
                        }`}
                      >
                        {activeTab === "transactions" ? (
                          <>
                            <td className="p-1">
                              <div className="flex items-center space-x-2">
                                <div className={`p-2 rounded-lg ${getTypeColor(item.type)} bg-gray-50`}>
                                  {getTypeIcon(item.type)}
                                </div>
                                <span className="font-semibold text-secondary/70">
                                  {item.type}
                                </span>
                              </div>
                            </td>
                            <td className="p-1 text-secondary/60 font-medium">
                              {formatCurrency(item.amount)}
                            </td>
                            <td className="p-1 text-secondary/60">
                              {item.reason || 'N/A'}
                            </td>
                            <td className="p-1 text-secondary/60">
                              <div className="space-y-1">
                                <div className="font-medium">
                                  {formatDate(item.createdAt)}
                                </div>
                                <div className="text-sm text-secondary">
                                  {formatTime(item.createdAt)}
                                </div>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="p-1 text-secondary/60 font-medium">
                              {formatCurrency(item.amount)}
                            </td>
                            <td className="p-1 text-secondary/60">
                              {item.reason || 'N/A'}
                            </td>
                            <td className="p-1 text-secondary/60">
                              <div className="space-y-1">
                                <div className="font-medium">
                                  {formatDate(item.requestedAt)}
                                </div>
                                <div className="text-sm text-secondary">
                                  {formatTime(item.requestedAt)}
                                </div>
                              </div>
                            </td>
                            <td className="p-1 text-secondary/60">
                              {item.processedAt ? (
                                <div className="space-y-1">
                                  <div className="font-medium">
                                    {formatDate(item.processedAt)}
                                  </div>
                                  <div className="text-sm text-secondary">
                                    {formatTime(item.processedAt)}
                                  </div>
                                </div>
                              ) : (
                                'N/A'
                              )}
                            </td>
                          </>
                        )}
                        <td className="p-1 text-center">
                          <span
                            className={`px-3 py-1.5 text-xs font-semibold rounded-full ${getStatusBadgeClass(
                              item.status
                            )}`}
                          >
                            {item.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="p-1">
                          <div className="flex justify-center items-center">
                            <button
                              onClick={() => handleViewDetails(item)}
                              className="px-4 py-2 text-xs font-semibold text-primary border border-primary/50 rounded-lg hover:bg-teal-50 transition-colors"
                            >
                              View Details
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-gray-500">
                        No {activeTab} found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4">
              {paginatedData.length > 0 ? (
                paginatedData.map((item) => (
                  <div
                    key={activeTab === "transactions" ? item.transactionId : item.refundId}
                    className="bg-white border border-gray-200 rounded-2xl p-2 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        {activeTab === "transactions" && (
                          <div className={`p-2 rounded-lg ${getTypeColor(item.type)} bg-gray-50`}>
                            {getTypeIcon(item.type)}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-secondary/70 text-sm">
                            {formatCurrency(item.amount)}
                          </p>
                          {activeTab === "transactions" && (
                            <p className="text-xs text-secondary">
                              {item.type}
                            </p>
                          )}
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(
                          item.status
                        )}`}
                      >
                        {item.status.replace("_", " ")}
                      </span>
                    </div>

                    <div className="border-t border-gray-100 pt-3 mb-4">
                      <div className="grid grid-cols-1 gap-3 text-sm">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-secondary/60">
                            {formatDate(activeTab === "transactions" ? item.createdAt : item.requestedAt)}
                          </span>
                          <Clock className="w-4 h-4 text-gray-400 ml-2" />
                          <span className="text-secondary/60">
                            {formatTime(activeTab === "transactions" ? item.createdAt : item.requestedAt)}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2">
                        <p className="text-sm text-secondary/60">
                          <span className="font-medium">Reason:</span>{" "}
                          {item.reason || 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col space-y-2">
                      <button
                        onClick={() => handleViewDetails(item)}
                        className="flex-1 px-4 py-2 text-sm font-semibold text-primary border border-primary/50 rounded-xl hover:bg-teal-50 transition-colors"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-gray-500">
                  No {activeTab} found
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </div>
        </div>
      </div>

      <TransactionFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        onApply={handleFilterApply}
        onReset={handleFilterReset}
        filterType={activeTab === "transactions" ? "transaction" : "refund"}
      />

      <style jsx>{`
        @keyframes modal-enter {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-modal-enter {
          animation: modal-enter 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
}