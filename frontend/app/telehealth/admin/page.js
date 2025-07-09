// frontend.js - CORRECTED

"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@apollo/client";
import {
  Users,
  DollarSign,
  Calendar,
  RefreshCw,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Activity,
  FileText,
  UserCheck,
  CreditCard,
  Eye,
  Filter,
  Download,
  Search,
  ChevronRight,
  BarChart3,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Settings,
  Bell,
  Menu,
  X,
} from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
// Import your queries
import {
  ADMIN_DASHBOARD_OVERVIEW_QUERY,
  ADMIN_TRANSACTIONS_QUERY,
  ADMIN_REFUNDS_QUERY,
  ADMIN_APPOINTMENTS_QUERY,
  ADMIN_PATIENTS_QUERY,
  ADMIN_DOCTORS_QUERY,
  ADMIN_DOCTOR_APPROVALS_QUERY,
  ADMIN_PRESCRIPTIONS_QUERY,
  ADMIN_FINANCIAL_ANALYTICS_QUERY,
  getTransactionFilterForPeriod,
  getAppointmentFilterForStatus,
  getRefundFilterForStatus,
} from "../api/graphql/admin/queries";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // --- START OF REORDERED SECTION ---

  const overviewQueryVariables = useMemo(() => {
    return {
      // Set a default period for the overview stats, e.g., 'month'
      transactionFilter: getTransactionFilterForPeriod("month"),
      refundFilter: getRefundFilterForStatus("all"),
    };
  }, []); // Use an empty dependency array so it only runs once on mount

  const {
    data: overviewData,
    loading: overviewLoading,
    error: overviewError,
    refetch: refetchOverview,
  } = useQuery(ADMIN_DASHBOARD_OVERVIEW_QUERY, {
    variables: overviewQueryVariables, // Use memoized variables
    pollInterval: 30000,
    errorPolicy: "all",
  });

  const transactionQueryVariables = useMemo(() => {
    return {
      filter: getTransactionFilterForPeriod(selectedPeriod),
      limit: 50,
      offset: 0,
    };
  }, [selectedPeriod]);

  // Transactions Query
  const {
    data: transactionsData,
    loading: transactionsLoading,
    refetch: refetchTransactions,
  } = useQuery(ADMIN_TRANSACTIONS_QUERY, {
    variables: transactionQueryVariables, // Use the stable, memoized object
    skip: activeTab !== "transactions",
  });

  const refundQueryVariables = useMemo(() => {
    return {
      filter: getRefundFilterForStatus(statusFilter),
      limit: 50,
      offset: 0,
    };
  }, [statusFilter]); // Dependency array: only re-run when statusFilter changes

  // Refunds Query
  const {
    data: refundsData,
    loading: refundsLoading,
    refetch: refetchRefunds,
  } = useQuery(ADMIN_REFUNDS_QUERY, {
    variables: refundQueryVariables, // Use the stable, memoized object
    skip: activeTab !== "refunds",
  });

  // Appointments Query
  const appointmentQueryVariables = useMemo(() => {
    return {
      filter: getAppointmentFilterForStatus(statusFilter),
      limit: 50,
      offset: 0,
    };
  }, [statusFilter]); // Dependency is the statusFilter

  const {
    data: appointmentsData,
    loading: appointmentsLoading,
    refetch: refetchAppointments,
  } = useQuery(ADMIN_APPOINTMENTS_QUERY, {
    variables: appointmentQueryVariables, // Use memoized variables
    skip: activeTab !== "appointments",
  });

  // Patients Query
  const {
    data: patientsData,
    loading: patientsLoading,
    refetch: refetchPatients,
  } = useQuery(ADMIN_PATIENTS_QUERY, {
    variables: { limit: 50, offset: 0 },
    skip: activeTab !== "patients",
  });

  // Doctors Query
  const {
    data: doctorsData,
    loading: doctorsLoading,
    refetch: refetchDoctors,
  } = useQuery(ADMIN_DOCTORS_QUERY, {
    variables: { limit: 50, offset: 0 },
    skip: activeTab !== "doctors",
  });

  // Memoize analytics variables
  const analyticsQueryVariables = useMemo(() => {
    return {
      transactionFilter: getTransactionFilterForPeriod(selectedPeriod),
      refundFilter: getRefundFilterForStatus("all"),
    };
  }, [selectedPeriod]);

  // **DEFINE `analyticsData` HERE, BEFORE IT IS USED**
  const {
    data: analyticsData,
    loading: analyticsLoading,
    refetch: refetchAnalytics,
  } = useQuery(ADMIN_FINANCIAL_ANALYTICS_QUERY, {
    variables: analyticsQueryVariables,
    skip: activeTab !== "analytics",
  });

  // **NOW, YOU CAN SAFELY USE `analyticsData` IN THESE HOOKS**
  const revenueTrendData = useMemo(() => {
    if (!analyticsData?.searchTransactions?.transactions) return [];

    const dailyRevenue = analyticsData.searchTransactions.transactions
      .filter((t) => t.status === "SUCCESS")
      .reduce((acc, transaction) => {
        const date = new Date(transaction.createdAt).toLocaleDateString(
          "en-CA"
        );
        if (!acc[date]) acc[date] = 0;
        acc[date] += transaction.amount;
        return acc;
      }, {});

    return Object.entries(dailyRevenue)
      .map(([date, total]) => ({ name: date, Revenue: total }))
      .sort((a, b) => new Date(a.name) - new Date(b.name));
  }, [analyticsData]);

  const transactionTypeData = useMemo(() => {
    if (!analyticsData?.searchTransactions?.transactions) return [];

    const typeCounts = analyticsData.searchTransactions.transactions.reduce(
      (acc, t) => {
        acc[t.type] = (acc[t.type] || 0) + 1;
        return acc;
      },
      {}
    );

    return Object.entries(typeCounts).map(([name, value]) => ({ name, value }));
  }, [analyticsData]);

  const paymentStatusData = useMemo(() => {
    if (!analyticsData?.allTransactionStats) return [];
    const stats = analyticsData.allTransactionStats;
    return [
      { name: "Success", count: stats.success, fill: "#22c55e" },
      { name: "Pending", count: stats.pending, fill: "#f59e0b" },
      { name: "Failed", count: stats.failed, fill: "#ef4444" },
    ];
  }, [analyticsData]);

  const PIE_COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

  const appointmentStats = useMemo(() => {
    // Default stats object
    const initialStats = { completed: 0, upcoming: 0, cancelled: 0 };

    // If there's no data, return the default
    if (!appointmentsData?.searchAppointments?.appointments) {
      return initialStats;
    }

    // Use .reduce() to iterate through the list once and calculate all stats
    return appointmentsData.searchAppointments.appointments.reduce(
      (stats, appointment) => {
        const { status } = appointment;

        if (status === "COMPLETED") {
          stats.completed += 1;
        }
        // Group all upcoming-related statuses together
        else if (
          status === "UPCOMING" ||
          status === "CONFIRMED" ||
          status === "REQUESTED" ||
          status === "IN_PROGRESS"
        ) {
          stats.upcoming += 1;
        }
        // Group all cancellation types together
        else if (
          status === "CANCELLED_PATIENT" ||
          status === "CANCELLED_DOCTOR" ||
          status === "CANCELLED_ADMIN"
        ) {
          stats.cancelled += 1;
        }

        return stats;
      },
      initialStats
    ); // Start with the initial object
  }, [appointmentsData]);
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "ETB",
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "success":
      case "completed":
      case "approved":
      case "processed":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "pending":
      case "requested":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "failed":
      case "cancelled":
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const StatCard = ({
    title,
    value,
    icon: Icon,
    trend,
    trendDirection,
    color = "bg-white",
  }) => (
    <div
      className={`${color} rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-all duration-300 group`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-white">
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-600">{title}</p>
          </div>
        </div>
        {trendDirection && (
          <div
            className={`flex items-center space-x-1 ${
              trendDirection === "up" ? "text-emerald-600" : "text-red-600"
            }`}
          >
            {trendDirection === "up" ? (
              <ArrowUpRight className="h-4 w-4" />
            ) : (
              <ArrowDownRight className="h-4 w-4" />
            )}
          </div>
        )}
      </div>
      <div className="space-y-2">
        <p className="text-3xl font-bold text-[#28161c] group-hover:text-primary transition-colors duration-300">
          {value}
        </p>
        {trend && (
          <p className="text-sm text-slate-500 flex items-center space-x-1">
            <TrendingUp className="h-3 w-3 mr-1" />
            <span>{trend}</span>
          </p>
        )}
      </div>
    </div>
  );

  const TabButton = ({ id, label, icon: Icon, active, onClick, count }) => (
    <button
      onClick={onClick}
      className={`flex items-center space-x-3 px-6 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
        active
          ? "bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg"
          : "text-slate-600 hover:text-primary hover:bg-primary/10"
      }`}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
      {count && (
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );

  const Table = ({ headers, children, loading }) => (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
            <tr>
              {headers.map((header, index) => (
                <th
                  key={index}
                  className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={headers.length} className="px-6 py-8 text-center">
                  <div className="flex justify-center">
                    <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                  </div>
                </td>
              </tr>
            ) : (
              children
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const LoadingSpinner = () => (
    <div className="flex justify-center items-center p-12">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-slate-200 rounded-full animate-spin"></div>
        <div className="absolute top-0 left-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    </div>
  );

  const renderOverview = () => {
    if (overviewLoading) return <LoadingSpinner />;
    if (overviewError)
      return (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5" />
            <span>Error loading overview: {overviewError.message}</span>
          </div>
        </div>
      );

    const stats = overviewData?.allTransactionStats;
    const refundStats = overviewData?.allRefundStats;
    const appointmentStats = overviewData?.appointmentStats;

    return (
      <div className="space-y-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Revenue"
            value={formatCurrency(stats?.totalAmount || 0)}
            icon={DollarSign}
            trend={`${stats?.total || 0} transactions`}
            trendDirection="up"
          />
          <StatCard
            title="Success Rate"
            value={
              stats?.total
                ? `${Math.round((stats?.success / stats?.total) * 100)}%`
                : "0%"
            }
            icon={CheckCircle}
            trend={`${stats?.success || 0} successful`}
            trendDirection="up"
          />
          <StatCard
            title="Appointments"
            value={appointmentStats?.total || 0}
            icon={Calendar}
            trend={`${appointmentStats?.completed || 0} completed`}
            trendDirection="up"
          />
          <StatCard
            title="Pending Refunds"
            value={refundStats?.requested || 0}
            icon={AlertCircle}
            trend={formatCurrency(refundStats?.totalAmount || 0)}
            trendDirection="down"
          />
        </div>

        {/* Quick Actions */}
        {/* <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-6 text-white">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="bg-white/20 hover:bg-white/30 rounded-xl p-4 text-left transition-all duration-200">
              <Plus className="h-5 w-5 mb-2" />
              <div className="text-sm font-medium">Add New Doctor</div>
            </button>
            <button className="bg-white/20 hover:bg-white/30 rounded-xl p-4 text-left transition-all duration-200">
              <Settings className="h-5 w-5 mb-2" />
              <div className="text-sm font-medium">System Settings</div>
            </button>
            <button className="bg-white/20 hover:bg-white/30 rounded-xl p-4 text-left transition-all duration-200">
              <Download className="h-5 w-5 mb-2" />
              <div className="text-sm font-medium">Export Reports</div>
            </button>
          </div>
        </div> */}

        {/* Recent Transactions */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-[#28161c]">
                Recent Transactions
              </h3>
              <button
                onClick={() => setActiveTab("transactions")}
                className="text-primary hover:text-primary/80 text-sm font-medium flex items-center space-x-1"
              >
                <span>View All</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {overviewData?.searchTransactions?.transactions?.map(
                  (transaction) => (
                    <tr
                      key={transaction.transactionId}
                      className="hover:bg-slate-50 transition-colors duration-200"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-primary to-primary/80 rounded-full flex items-center justify-center text-white font-medium">
                            {transaction.patient?.firstName?.[0] || "U"}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-slate-900">
                              {transaction.patient?.firstName}{" "}
                              {transaction.patient?.lastName}
                            </div>
                            <div className="text-sm text-slate-500">
                              {transaction.patient?.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-slate-100 text-slate-800 px-2 py-1 rounded-lg text-sm font-medium">
                          {transaction.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                        {formatCurrency(transaction.amount)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(
                            transaction.status
                          )}`}
                        >
                          {transaction.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {formatDate(transaction.createdAt)}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Appointments */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-[#28161c]">
                Recent Appointments
              </h3>
              <button
                onClick={() => setActiveTab("appointments")}
                className="text-primary hover:text-primary/80 text-sm font-medium flex items-center space-x-1"
              >
                <span>View All</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                    Doctor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                    Scheduled
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {overviewData?.searchAppointments?.appointments?.map(
                  (appointment) => (
                    <tr
                      key={appointment.appointmentId}
                      className="hover:bg-slate-50 transition-colors duration-200"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-primary to-primary/80 rounded-full flex items-center justify-center text-white font-medium">
                            {appointment.patientName?.[0] || "P"}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-slate-900">
                              {appointment.patientName}
                            </div>
                            <div className="text-sm text-slate-500">
                              {appointment.patient?.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-900 font-medium">
                        {appointment.doctorName}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(
                            appointment.status
                          )}`}
                        >
                          {appointment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                        {formatCurrency(appointment.price)}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {formatDate(appointment.scheduledStartTime)}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderTransactions = () => {
    if (transactionsLoading) return <LoadingSpinner />;

    return (
      <div className="space-y-6">
        {/* Enhanced Filters */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
              </div>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="border border-slate-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </select>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-4 py-2 border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors duration-200"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </button>
            </div>
            <button
              onClick={refetchTransactions}
              className="flex items-center px-6 py-2 bg-gradient-to-r from-primary to-primary/80 text-white rounded-xl hover:shadow-lg transition-all duration-200"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Enhanced Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            title="Total Transactions"
            value={transactionsData?.searchTransactions?.totalCount || 0}
            icon={CreditCard}
            trend={formatCurrency(
              transactionsData?.allTransactionStats?.totalAmount || 0
            )}
          />
          <StatCard
            title="Successful"
            value={transactionsData?.allTransactionStats?.success || 0}
            icon={CheckCircle}
            trend={`${Math.round(
              ((transactionsData?.allTransactionStats?.success || 0) /
                Math.max(
                  transactionsData?.allTransactionStats?.total || 1,
                  1
                )) *
                100
            )}%`}
          />
          <StatCard
            title="Pending"
            value={transactionsData?.allTransactionStats?.pending || 0}
            icon={Clock}
            trend={formatCurrency(
              transactionsData?.allTransactionStats?.pendingAmount || 0
            )}
          />
          <StatCard
            title="Failed"
            value={transactionsData?.allTransactionStats?.failed || 0}
            icon={XCircle}
            trend="Needs attention"
          />
        </div>

        {/* Enhanced Transactions Table */}
        <Table
          headers={["Patient", "Type", "Amount", "Status", "Date", "Actions"]}
          loading={transactionsLoading}
        >
          {transactionsData?.searchTransactions?.transactions?.map(
            (transaction) => (
              <tr
                key={transaction.transactionId}
                className="hover:bg-slate-50 transition-colors duration-200"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-primary to-primary/80 rounded-full flex items-center justify-center text-white font-medium">
                      {transaction.patient?.firstName?.[0] || "U"}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-900">
                        {transaction.patient?.firstName}{" "}
                        {transaction.patient?.lastName}
                      </div>
                      <div className="text-sm text-slate-500">
                        {transaction.patient?.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="bg-slate-100 text-slate-800 px-3 py-1 rounded-lg text-sm font-medium">
                    {transaction.type}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                  {formatCurrency(transaction.amount)}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(
                      transaction.status
                    )}`}
                  >
                    {transaction.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">
                  {formatDate(transaction.createdAt)}
                </td>
                <td className="px-6 py-4">
                  <button className="text-primary hover:text-primary/80 p-2 hover:bg-primary/10 rounded-lg transition-all duration-200">
                    <Eye className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            )
          )}
        </Table>
      </div>
    );
  };

  const renderAppointments = () => {
    if (appointmentsLoading) return <LoadingSpinner />;

    return (
      <div className="space-y-6">
        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search appointments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-slate-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="upcoming">Upcoming</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <button
              onClick={refetchAppointments}
              className="flex items-center px-6 py-2 bg-gradient-to-r from-primary to-primary/80 text-white rounded-xl hover:shadow-lg transition-all duration-200"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Appointments Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            title="Total Appointments"
            value={appointmentsData?.searchAppointments?.totalCount || 0}
            icon={Calendar}
          />
          <StatCard
            title="Completed"
            value={appointmentStats.completed}
            icon={CheckCircle}
          />
          <StatCard
            title="Upcoming"
            value={appointmentStats.upcoming}
            icon={Clock}
          />
          <StatCard
            title="Cancelled"
            value={appointmentStats.cancelled}
            icon={XCircle}
          />
        </div>

        {/* Appointments Table */}
        <Table
          headers={[
            "Patient",
            "Doctor",
            "Status",
            "Price",
            "Scheduled Time",
            "Actions",
          ]}
          loading={appointmentsLoading}
        >
          {appointmentsData?.searchAppointments?.appointments?.map(
            (appointment) => (
              <tr
                key={appointment.appointmentId}
                className="hover:bg-slate-50 transition-colors duration-200"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-primary to-primary/80 rounded-full flex items-center justify-center text-white font-medium">
                      {appointment.patientName?.[0] || "P"}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-900">
                        {appointment.patientName}
                      </div>
                      <div className="text-sm text-slate-500">
                        {appointment.patient?.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-slate-900">
                    {appointment.doctorName}
                  </div>
                  <div className="text-sm text-slate-500">
                    {appointment.doctor?.doctorProfile?.specialization}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(
                      appointment.status
                    )}`}
                  >
                    {appointment.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                  {formatCurrency(appointment.price)}
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">
                  {formatDate(appointment.scheduledStartTime)}
                </td>
                <td className="px-6 py-4">
                  <button className="text-primary hover:text-primary/80 p-2 hover:bg-primary/10 rounded-lg transition-all duration-200">
                    <Eye className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            )
          )}
        </Table>
      </div>
    );
  };

  const renderDoctors = () => {
    if (doctorsLoading) return <LoadingSpinner />;

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center">
              <h3 className="text-lg font-semibold text-[#28161c]">
                Doctors Management
              </h3>
            </div>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search doctors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
              </div>
              <button
                onClick={refetchDoctors}
                className="flex items-center px-6 py-2 bg-gradient-to-r from-primary to-primary/80 text-white rounded-xl hover:shadow-lg transition-all duration-200"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Doctors Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Total Doctors"
            value={doctorsData?.allDoctors?.length || 0}
            icon={UserCheck}
          />
          <StatCard
            title="Approved Doctors"
            value={
              doctorsData?.allDoctors?.filter((d) => d.isApproved)?.length || 0
            }
            icon={CheckCircle}
          />
          <StatCard
            title="Pending Approvals"
            value={
              doctorsData?.allDoctors?.filter((d) => !d.isApproved)?.length || 0
            }
            icon={Clock}
          />
        </div>

        {/* Doctors Table */}
        <Table
          headers={[
            "Doctor",
            "Specialization",
            "Experience",
            "Rating",
            "Price/Session",
            "Status",
            "Actions",
          ]}
          loading={doctorsLoading}
        >
          {doctorsData?.allDoctors?.map((doctor) => (
            <tr
              key={doctor.doctorId}
              className="hover:bg-slate-50 transition-colors duration-200"
            >
              <td className="px-6 py-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-primary to-primary/80 rounded-full flex items-center justify-center text-white font-medium">
                    {doctor.user?.firstName?.[0] || "D"}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-900">
                      {doctor.user?.firstName} {doctor.user?.lastName}
                    </div>
                    <div className="text-sm text-slate-500">
                      {doctor.user?.email}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-slate-900">
                {doctor.specialization}
              </td>
              <td className="px-6 py-4 text-sm text-slate-900">
                {doctor.experienceYears} years
              </td>
              <td className="px-6 py-4 text-sm text-slate-900">
                {doctor.averageRating ? (
                  <div className="flex items-center">
                    <span className="font-semibold mr-1">
                      {doctor.averageRating}
                    </span>
                    <span className="text-amber-500">★</span>
                    <span className="text-slate-500 text-xs ml-1">
                      ({doctor.ratingCount})
                    </span>
                  </div>
                ) : (
                  "No ratings"
                )}
              </td>
              <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                {formatCurrency(doctor.pricePerSession)}
              </td>
              <td className="px-6 py-4">
                <span
                  className={`px-3 py-1 text-xs font-medium rounded-full border ${
                    doctor.isApproved
                      ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                      : "bg-amber-100 text-amber-800 border-amber-200"
                  }`}
                >
                  {doctor.isApproved ? "Approved" : "Pending"}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center space-x-2">
                  <button className="text-primary hover:text-primary/80 p-2 hover:bg-primary/10 rounded-lg transition-all duration-200">
                    <Eye className="h-4 w-4" />
                  </button>
                  {!doctor.isApproved && (
                    <button className="text-emerald-600 hover:text-emerald-700 p-2 hover:bg-emerald-50 rounded-lg transition-all duration-200">
                      <CheckCircle className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </div>
    );
  };

  const renderPatients = () => {
    if (patientsLoading) return <LoadingSpinner />;

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center">
              <h3 className="text-lg font-semibold text-[#28161c]">
                Patients Management
              </h3>
            </div>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search patients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
              </div>
              <button
                onClick={refetchPatients}
                className="flex items-center px-6 py-2 bg-gradient-to-r from-primary to-primary/80 text-white rounded-xl hover:shadow-lg transition-all duration-200"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Patient Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Total Patients"
            value={patientsData?.allPatients?.length || 0}
            icon={Users}
          />
          <StatCard
            title="Active Today"
            value={Math.floor(
              Math.random() * (patientsData?.allPatients?.length || 0)
            )} // Placeholder - replace with actual data
            icon={Activity}
          />
          <StatCard
            title="Total Wallet Balance"
            value={formatCurrency(
              patientsData?.allPatients?.reduce(
                (sum, p) => sum + (p.telehealthWalletBalance || 0),
                0
              ) || 0
            )}
            icon={DollarSign}
          />
        </div>

        {/* Patients Table */}
        <Table
          headers={[
            "Patient",
            "Contact",
            "Wallet Balance",
            "Blood Type",
            "Joined",
            "Actions",
          ]}
          loading={patientsLoading}
        >
          {patientsData?.allPatients?.map((patient) => (
            <tr
              key={patient.patientId}
              className="hover:bg-slate-50 transition-colors duration-200"
            >
              <td className="px-6 py-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-primary to-primary/80 rounded-full flex items-center justify-center text-white font-medium">
                    {patient.user?.firstName?.[0] || "P"}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-900">
                      {patient.user?.firstName} {patient.user?.lastName}
                    </div>
                    <div className="text-sm text-slate-500">
                      {patient.user?.email}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-slate-900">
                {patient.user?.phoneNumber || "N/A"}
              </td>
              <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                {formatCurrency(patient.telehealthWalletBalance)}
              </td>
              <td className="px-6 py-4">
                {patient.bloodType ? (
                  <span className="px-3 py-1 text-xs font-medium rounded-full bg-red-50 text-red-700 border border-red-100">
                    {patient.bloodType}
                  </span>
                ) : (
                  "N/A"
                )}
              </td>
              <td className="px-6 py-4 text-sm text-slate-500">
                {formatDate(patient.createdAt)}
              </td>
              <td className="px-6 py-4">
                <button className="text-primary hover:text-primary/80 p-2 hover:bg-primary/10 rounded-lg transition-all duration-200">
                  <Eye className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
        </Table>
      </div>
    );
  };

  const renderRefunds = () => {
    if (refundsLoading) return <LoadingSpinner />;

    return (
      <div className="space-y-6">
        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4 items-center">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-slate-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              >
                <option value="all">All Status</option>
                <option value="requested">Requested</option>
                <option value="approved">Approved</option>
                <option value="processed">Processed</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <button
              onClick={refetchRefunds}
              className="flex items-center px-6 py-2 bg-gradient-to-r from-primary to-primary/80 text-white rounded-xl hover:shadow-lg transition-all duration-200"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Refund Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            title="Total Refunds"
            value={refundsData?.allRefundStats?.total || 0}
            icon={DollarSign}
            trend={formatCurrency(
              refundsData?.allRefundStats?.totalAmount || 0
            )}
          />
          <StatCard
            title="Pending"
            value={refundsData?.allRefundStats?.requested || 0}
            icon={Clock}
            trend={formatCurrency(
              refundsData?.allRefundStats?.totalAmount || 0
            )}
          />
          <StatCard
            title="Processed"
            value={refundsData?.allRefundStats?.processed || 0}
            icon={CheckCircle}
            trend={formatCurrency(
              refundsData?.allRefundStats?.processedAmount || 0
            )}
          />
          <StatCard
            title="Rejected"
            value={refundsData?.allRefundStats?.rejected || 0}
            icon={XCircle}
          />
        </div>

        {/* Refunds Table */}
        <Table
          headers={[
            "Patient",
            "Amount",
            "Status",
            "Reason",
            "Requested",
            "Actions",
          ]}
          loading={refundsLoading}
        >
          {refundsData?.searchRefunds?.refunds?.map((refund) => (
            <tr
              key={refund.refundId}
              className="hover:bg-slate-50 transition-colors duration-200"
            >
              <td className="px-6 py-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-primary to-primary/80 rounded-full flex items-center justify-center text-white font-medium">
                    {refund.patient?.firstName?.[0] || "P"}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-900">
                      {refund.patient?.firstName} {refund.patient?.lastName}
                    </div>
                    <div className="text-sm text-slate-500">
                      {refund.patient?.email}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                {formatCurrency(refund.amount)}
              </td>
              <td className="px-6 py-4">
                <span
                  className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(
                    refund.status
                  )}`}
                >
                  {refund.status}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-slate-900">
                {refund.reason || "N/A"}
              </td>
              <td className="px-6 py-4 text-sm text-slate-500">
                {formatDate(refund.requestedAt)}
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center space-x-2">
                  <button className="text-primary hover:text-primary/80 p-2 hover:bg-primary/10 rounded-lg transition-all duration-200">
                    <Eye className="h-4 w-4" />
                  </button>
                  {refund.status === "REQUESTED" && (
                    <>
                      <button className="text-emerald-600 hover:text-emerald-700 p-2 hover:bg-emerald-50 rounded-lg transition-all duration-200">
                        <CheckCircle className="h-4 w-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-all duration-200">
                        <XCircle className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </div>
    );
  };

  const renderAnalytics = () => {
    if (analyticsLoading) return <LoadingSpinner />;

    return (
      <div className="space-y-6">
        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4 items-center">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="border border-slate-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </select>
              <button
                onClick={() => {}}
                className="flex items-center px-4 py-2 border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors duration-200"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
            </div>
            <button
              onClick={refetchAnalytics}
              className="flex items-center px-6 py-2 bg-gradient-to-r from-primary to-primary/80 text-white rounded-xl hover:shadow-lg transition-all duration-200"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Analytics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Revenue"
            value={formatCurrency(
              analyticsData?.allTransactionStats?.totalAmount || 0
            )}
            icon={DollarSign}
            trend={`${
              analyticsData?.allTransactionStats?.total || 0
            } transactions`}
            trendDirection="up"
          />
          <StatCard
            title="Refunds"
            value={formatCurrency(
              analyticsData?.allRefundStats?.totalAmount || 0
            )}
            icon={TrendingDown}
            trend={`${analyticsData?.allRefundStats?.total || 0} refunds`}
            trendDirection="down"
          />
          <StatCard
            title="Net Revenue"
            value={formatCurrency(
              (analyticsData?.allTransactionStats?.totalAmount || 0) -
                (analyticsData?.allRefundStats?.totalAmount || 0)
            )}
            icon={TrendingUp}
            trendDirection="up"
          />
          <StatCard
            title="Average Transaction"
            value={formatCurrency(
              analyticsData?.allTransactionStats?.totalAmount &&
                analyticsData?.allTransactionStats?.total
                ? analyticsData.allTransactionStats.totalAmount /
                    analyticsData.allTransactionStats.total
                : 0
            )}
            icon={Activity}
          />
        </div>

        {/* Analytics Chart Placeholder */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-[#28161c] mb-4">
            Revenue Trends
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="Revenue"
                  stroke="#8884d8"
                  strokeWidth={2}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Transaction Distribution Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Transaction Types Chart */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-[#28161c] mb-4">
              Transaction Types
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={transactionTypeData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    label
                  >
                    {transactionTypeData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [`${value} transactions`, name]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          {/* Payment Status Chart */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-[#28161c] mb-4">
              Payment Status
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={paymentStatusData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={60}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(241, 245, 249, 0.6)" }}
                    formatter={(value) => [value, "Count"]}
                  />
                  <Bar dataKey="count" barSize={30} radius={[0, 10, 10, 0]}>
                    {paymentStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return renderOverview();
      case "transactions":
        return renderTransactions();
      case "appointments":
        return renderAppointments();
      case "doctors":
        return renderDoctors();
      case "patients":
        return renderPatients();
      case "refunds":
        return renderRefunds();
      case "analytics":
        return renderAnalytics();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <Menu className="h-5 w-5" />
              </button>
              <h1 className="text-xl font-bold text-[#28161c]">
                TeleHealth Admin
              </h1>
            </div>
            <div className="flex items-center space-x-4">
             
              <button
                onClick={refetchOverview}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-primary to-primary/80 text-white rounded-xl hover:shadow-lg transition-all duration-200"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Data
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className=" px-4 sm:px-6 lg:px-8 py-3">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 bg-white rounded-2xl shadow-sm border p-2 mb-6">
          <TabButton
            id="overview"
            label="Overview"
            icon={BarChart3}
            active={activeTab === "overview"}
            onClick={() => setActiveTab("overview")}
          />
          <TabButton
            id="transactions"
            label="Transactions"
            icon={CreditCard}
            active={activeTab === "transactions"}
            onClick={() => setActiveTab("transactions")}
          />
          <TabButton
            id="appointments"
            label="Appointments"
            icon={Calendar}
            active={activeTab === "appointments"}
            onClick={() => setActiveTab("appointments")}
          />
          <TabButton
            id="doctors"
            label="Doctors"
            icon={UserCheck}
            active={activeTab === "doctors"}
            onClick={() => setActiveTab("doctors")}
          />
          <TabButton
            id="patients"
            label="Patients"
            icon={Users}
            active={activeTab === "patients"}
            onClick={() => setActiveTab("patients")}
          />
          <TabButton
            id="refunds"
            label="Refunds"
            icon={TrendingDown}
            active={activeTab === "refunds"}
            onClick={() => setActiveTab("refunds")}
            count={overviewData?.allRefundStats?.requested || null}
          />
          <TabButton
            id="analytics"
            label="Analytics"
            icon={Activity}
            active={activeTab === "analytics"}
            onClick={() => setActiveTab("analytics")}
          />
        </div>

        {/* Dynamic Content */}
        <div className="h-[63vh] scrollbar-hide overflow-y-auto">{renderContent()}</div>
      </div>
    </div>
  );
};
export default AdminDashboard;
