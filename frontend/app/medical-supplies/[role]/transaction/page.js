"use client";
import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@apollo/client";
import {
  GET_MY_TRANSACTIONS,
  GET_TRANSACTION_SUMMARIES,
} from "../../api/graphql/transaction/transactionQueries";
import { StatCard } from "../../components/ui/Cards";
import { TableCard } from "../../components/ui/Cards";
import { useRouter } from "next/navigation";
import { useMSAuth } from "../../../../hooks/useMSAuth";
import { TransactionFilterModal } from "../../components/modal/TransactionFilterModal";

const icons = {
  transactions: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M12 1L21 5V19L12 23L3 19V5L12 1Z"></path>
  <path d="M12 8V16"></path>
  <path d="M8 12H16"></path>
</svg>`,

  totalAmount: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M12 2V22M17 5H9.5A3.5 3.5 0 0 0 9.5 12H14.5A3.5 3.5 0 0 1 14.5 19H6"></path>
</svg>`,

  pending: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="10"></circle>
  <path d="M12 6V12L16 14"></path>
</svg>`,

  completed: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M22 11.08V12A10 10 0 1 1 5.93 7.25"></path>
  <path d="M22 4L12 14.01L9 11.01"></path>
</svg>`,
};

export default function TransactionPage() {
  const [transactionsPage, setTransactionsPage] = useState(1);
  const [activeTab, setActiveTab] = useState("all");
  const [activeFilters, setActiveFilters] = useState({});
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const router = useRouter();
  const { user } = useMSAuth();
  const role = user.role;

  // Fetch ALL transactions
  const { loading, error, data, refetch } = useQuery(GET_MY_TRANSACTIONS, {
    variables: {},
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: true,
  });

  // Helper functions
  const formatCurrency = (amount, currency = "ETB") => {
    return `${currency} ${parseFloat(amount).toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "PAID_HELD_BY_SYSTEM":
      case "RELEASED_TO_SELLER":
        return "bg-green-100 text-green-800";
      case "PENDING":
      case "PROCESSING":
        return "bg-yellow-100 text-yellow-800";
      case "FAILED":
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      case "REFUNDED":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatStatus = (status) => {
    return status
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Sort transactions from earliest to oldest
  const sortedTransactions = useMemo(() => {
    if (!data?.myTransactions) return [];
    return [...data.myTransactions].sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return dateA - dateB;
    });
  }, [data?.myTransactions]);

  // Transform transaction data for table display
  const transformTransaction = (transaction) => ({
    id: transaction.transactionId,
    transactionNo: `#${transaction.transactionId}`,
    orderId: transaction.orderId,
    amount: formatCurrency(transaction.amount, transaction.currency),
    status: transaction.status,
    chapaRef: transaction.chapaRef || "N/A",
    date: formatDate(transaction.createdAt),
    buyer: transaction.buyerId || "N/A",
    seller: transaction.sellerId || "N/A",
    rawAmount: transaction.amount,
    rawDate: transaction.createdAt,
    rawTransaction: transaction,
  });

  // Prepare tab data with memoization
  const tabData = useMemo(() => {
    if (!sortedTransactions.length) {
      return {
        all: [],
        pending: [],
        completed: [],
        failed: [],
        refunded: [],
        thisWeek: [],
        thisMonth: [],
      };
    }

    const formattedData = sortedTransactions.map(transformTransaction);

    // Filter functions
    const isPending = (t) => ["PENDING", "PROCESSING"].includes(t.status);
    const isCompleted = (t) => ["PAID_HELD_BY_SYSTEM", "RELEASED_TO_SELLER"].includes(t.status);
    const isFailed = (t) => ["FAILED", "CANCELLED"].includes(t.status);
    const isRefunded = (t) => t.status === "REFUNDED";

    // Date filters
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const isThisWeek = (t) => new Date(t.rawDate) >= weekAgo;
    const isThisMonth = (t) => new Date(t.rawDate) >= monthAgo;

    return {
      all: formattedData,
      pending: formattedData.filter(isPending),
      completed: formattedData.filter(isCompleted),
      failed: formattedData.filter(isFailed),
      refunded: formattedData.filter(isRefunded),
      thisWeek: formattedData.filter(isThisWeek),
      thisMonth: formattedData.filter(isThisMonth),
    };
  }, [sortedTransactions]);

  // Apply frontend filters (same as orders page)
  const applyFrontendFilters = (data, filters) => {
    if (!filters || Object.keys(filters).length === 0) return data;

    return data.filter((item) => {
      const transaction = item.rawTransaction;

      // Status filter
      if (filters.status && transaction.status !== filters.status) {
        return false;
      }

      // Date range filter
      if (filters.dateFrom) {
        const transactionDate = new Date(transaction.createdAt);
        const fromDate = new Date(filters.dateFrom);
        if (transactionDate < fromDate) return false;
      }

      if (filters.dateTo) {
        const transactionDate = new Date(transaction.createdAt);
        const toDate = new Date(filters.dateTo);
        if (transactionDate > toDate) return false;
      }

      // Amount range filter
      if (filters.minAmount && transaction.amount < parseFloat(filters.minAmount)) {
        return false;
      }

      if (filters.maxAmount && transaction.amount > parseFloat(filters.maxAmount)) {
        return false;
      }

      // Order ID filter
      if (filters.orderId) {
        const orderIdMatch = transaction.orderId
          ?.toLowerCase()
          .includes(filters.orderId.toLowerCase());
        if (!orderIdMatch) return false;
      }

      // Chapa Reference filter
      if (filters.chapaRef) {
        const chapaRefMatch = transaction.chapaRef
          ?.toLowerCase()
          .includes(filters.chapaRef.toLowerCase());
        if (!chapaRefMatch) return false;
      }

      return true;
    });
  };

  // Get filtered data for current tab
  const filteredTabData = useMemo(() => {
    const currentData = tabData[activeTab] || [];
    return applyFrontendFilters(currentData, activeFilters);
  }, [tabData, activeTab, activeFilters]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredTabData.length / itemsPerPage);
  const startIndex = (transactionsPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredTabData.slice(startIndex, endIndex);

  // Calculate statistics based on ALL transactions (not filtered)
  const stats = useMemo(() => {
    if (!sortedTransactions.length) {
      return {
        thisWeekCount: 0,
        thisWeekTotal: 0,
        thisMonthCount: 0,
        thisMonthTotal: 0,
        totalAmount: 0,
        totalCount: 0,
        pendingCount: 0,
        completedCount: 0,
        failedCount: 0,
        weekGrowth: 0,
        monthGrowth: 0,
      };
    }

    const transactions = sortedTransactions;
    
    // Calculate period stats
    const calculatePeriodStats = (days) => {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      const periodTransactions = transactions.filter(
        (t) => new Date(t.createdAt) >= cutoffDate
      );
      return {
        count: periodTransactions.length,
        total: periodTransactions.reduce((sum, t) => sum + t.amount, 0),
      };
    };

    const thisWeekStats = calculatePeriodStats(7);
    const thisMonthStats = calculatePeriodStats(30);

    // Calculate growth
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const previousWeekTransactions = transactions.filter((t) => {
      const date = new Date(t.createdAt);
      return date >= twoWeeksAgo && date < oneWeekAgo;
    });

    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const previousMonthTransactions = transactions.filter((t) => {
      const date = new Date(t.createdAt);
      return date >= twoMonthsAgo && date < oneMonthAgo;
    });

    const weekChange = previousWeekTransactions.length > 0
      ? ((thisWeekStats.count - previousWeekTransactions.length) / previousWeekTransactions.length) * 100
      : thisWeekStats.count > 0 ? 100 : 0;

    const monthChange = previousMonthTransactions.length > 0
      ? ((thisMonthStats.count - previousMonthTransactions.length) / previousMonthTransactions.length) * 100
      : thisMonthStats.count > 0 ? 100 : 0;

    return {
      thisWeekCount: thisWeekStats.count,
      thisWeekTotal: thisWeekStats.total,
      thisMonthCount: thisMonthStats.count,
      thisMonthTotal: thisMonthStats.total,
      totalAmount: transactions.reduce((sum, t) => sum + t.amount, 0),
      totalCount: transactions.length,
      pendingCount: transactions.filter((t) => ["PENDING", "PROCESSING"].includes(t.status)).length,
      completedCount: transactions.filter((t) => ["PAID_HELD_BY_SYSTEM", "RELEASED_TO_SELLER"].includes(t.status)).length,
      failedCount: transactions.filter((t) => ["FAILED", "CANCELLED"].includes(t.status)).length,
      weekGrowth: Math.round(weekChange),
      monthGrowth: Math.round(monthChange),
    };
  }, [sortedTransactions]);

  // Define table tabs
  const transactionTabs = [
    { id: "all", label: "All Transactions", count: tabData.all?.length || 0 },
    { id: "pending", label: "Pending", count: tabData.pending?.length || 0 },
    { id: "completed", label: "Completed", count: tabData.completed?.length || 0 },
    { id: "failed", label: "Failed", count: tabData.failed?.length || 0 },
    { id: "refunded", label: "Refunded", count: tabData.refunded?.length || 0 },
    { id: "thisWeek", label: "This Week", count: tabData.thisWeek?.length || 0 },
    { id: "thisMonth", label: "This Month", count: tabData.thisMonth?.length || 0 },
  ];

  const transactionsColumns = [
    { key: "transactionNo", label: "Transaction No." },
    { key: "orderId", label: "Order No." },
    { key: "amount", label: "Amount" },
    {
      key: "status",
      label: "Status",
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(value)}`}>
          {formatStatus(value)}
        </span>
      ),
    },
    { key: "date", label: "Date" },
    { key: "chapaRef", label: "Chapa Ref" },
  ];

  // Event handlers
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setTransactionsPage(1);
  };

  const handlePageChange = (page) => {
    setTransactionsPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setTransactionsPage(1);
  };

  const handleOpenFilterModal = () => {
    setIsFilterModalOpen(true);
  };

  const applyFilters = (filters) => {
    setActiveFilters(filters);
    setTransactionsPage(1);
  };

  const onClickRow = (transaction) => {
    console.log("Row clicked:", transaction);
    if (
      user.role === "admin" ||
      user.userId === transaction.seller ||
      user.userId === transaction.buyer
    ) {
      router.push(`/medical-supplies/${role}/orders/${transaction.orderId}`);
    }
  };

  // Effect to refetch data when component mounts
  useEffect(() => {
    refetch();
  }, [refetch]);

  if (loading && !sortedTransactions.length) {
    return (
      <div className="flex flex-col gap-2">
        <div className="w-full flex gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex-1 h-24 bg-gray-200 animate-pulse rounded-lg"></div>
          ))}
        </div>
        <div className="w-full h-96 bg-gray-200 animate-pulse rounded-lg"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-2">
        <div className="w-full p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">Error loading transactions: {error.message}</p>
          <button
            onClick={() => refetch()}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Stats Cards */}
      <div className="w-full flex gap-4">
        <StatCard
          title="This Week"
          metrics={[
            {
              value: stats.thisWeekCount.toString(),
              label: `${stats.weekGrowth >= 0 ? "+" : ""}${stats.weekGrowth}% from last week`,
            },
          ]}
          icon={
            <div
              dangerouslySetInnerHTML={{ __html: icons.transactions }}
              className="text-primary"
            />
          }
          subtitle="Recent Transactions"
        />

        <StatCard
          title="This Month"
          metrics={[
            {
              value: stats.thisMonthCount.toString(),
              label: `${stats.monthGrowth >= 0 ? "+" : ""}${stats.monthGrowth}% from last month`,
            },
          ]}
          icon={
            <div
              dangerouslySetInnerHTML={{ __html: icons.totalAmount }}
              className="text-primary"
            />
          }
          subtitle="Monthly Overview"
        />

        <StatCard
          title="Total Revenue"
          metrics={[
            {
              value: formatCurrency(stats.totalAmount),
              label: `From ${stats.totalCount} transactions`,
            },
          ]}
          icon={
            <div
              dangerouslySetInnerHTML={{ __html: icons.completed }}
              className="text-primary"
            />
          }
          subtitle="Since You Joined"
        />

        <StatCard
          title="Transaction Status"
          metrics={[
            { value: stats.pendingCount.toString(), label: "Pending" },
            { value: stats.completedCount.toString(), label: "Completed" },
            { value: stats.failedCount.toString(), label: "Failed" },
          ]}
          icon={
            <div
              dangerouslySetInnerHTML={{ __html: icons.pending }}
              className="text-primary"
            />
          }
          subtitle="Status Overview"
        />
      </div>

      {/* Transactions Table */}
      <div className="w-full">
        <TableCard
          title="Transactions"
          data={paginatedData}
          columns={transactionsColumns}
          page={transactionsPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          totalItems={filteredTabData.length}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
          onDownload={() => console.log("Exporting transactions...")}
          isLoading={loading}
          tabs={transactionTabs}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          tabData={tabData}
          isClickable={true}
          onClickRow={onClickRow}
          isFilterButton={true}
          onFilter={handleOpenFilterModal}
          isAddButton={false}
          isOrderButton={false}
        />
      </div>

      {/* Filter Modal */}
      <TransactionFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onApplyFilters={applyFilters}
        currentFilters={activeFilters}
        userRole={role}
      />
    </div>
  );
}