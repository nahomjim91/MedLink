"use client";
import React, { useState, useEffect } from "react";
import { useQuery } from "@apollo/client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ComposedChart,
  Legend,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  BarChart3,
  Activity,
  RefreshCw,
  Download,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Target,
} from "lucide-react";

// Import your GraphQL queries
import {
  DASHBOARD_OVERVIEW_QUERY,
  ORDERS_QUERY,
  USERS_QUERY,
  TRANSACTIONS_QUERY,
} from "../../api/graphql/admin/queries";

const AnalyticsDashboard = () => {
  const [timeRange, setTimeRange] = useState("weekly");
  const [selectedMetric, setSelectedMetric] = useState("revenue");
  const [chartType, setChartType] = useState("line");
  const [showExportDropdown, setShowExportDropdown] = useState(false);

  // Fetch data
  const {
    data: dashboardData,
    loading: dashboardLoading,
    error: dashboardError,
    refetch: refetchDashboard,
  } = useQuery(DASHBOARD_OVERVIEW_QUERY, {
    fetchPolicy: "cache-and-network",
  });

  const {
    data: ordersData,
    loading: ordersLoading,
    refetch: refetchOrders,
  } = useQuery(ORDERS_QUERY, {
    fetchPolicy: "cache-and-network",
  });

  const {
    data: transactionsData,
    loading: transactionsLoading,
    refetch: refetchTransactions,
  } = useQuery(TRANSACTIONS_QUERY, {
    fetchPolicy: "cache-and-network",
  });

  // Process data for analytics
  const processTimeSeriesData = (data, timeRange) => {
    if (!data) return [];

    const now = new Date();
    const days = timeRange === "weekly" ? 7 : 30;
    const dateArray = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      dateArray.push({
        date: date.toISOString().split("T")[0],
        displayDate:
          timeRange === "weekly"
            ? date.toLocaleDateString("en-US", { weekday: "short" })
            : date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              }),
        revenue: 0,
        orders: 0,
        users: 0,
        transactions: 0,
      });
    }

    // Process orders data
    if (dashboardData?.orderSummaries) {
      dashboardData.orderSummaries.forEach((order) => {
        const orderDate = new Date(order.orderDate).toISOString().split("T")[0];
        const dayData = dateArray.find((d) => d.date === orderDate);
        if (dayData) {
          dayData.revenue += order.totalCost || 0;
          dayData.orders += 1;
        }
      });
    }

    // Process transactions data
    if (dashboardData?.transactionSummaries) {
      dashboardData.transactionSummaries.forEach((transaction) => {
        const transactionDate = new Date(transaction.createdAt)
          .toISOString()
          .split("T")[0];
        const dayData = dateArray.find((d) => d.date === transactionDate);
        if (dayData) {
          dayData.transactions += 1;
        }
      });
    }

    return dateArray;
  };

  const timeSeriesData = processTimeSeriesData(dashboardData, timeRange);

  // Calculate statistics
  const calculateStats = () => {
    const currentPeriodData = timeSeriesData.slice(-7);
    const previousPeriodData = timeSeriesData.slice(-14, -7);

    const currentRevenue = currentPeriodData.reduce(
      (sum, d) => sum + d.revenue,
      0
    );
    const previousRevenue = previousPeriodData.reduce(
      (sum, d) => sum + d.revenue,
      0
    );
    const revenueGrowth = previousRevenue
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
      : 0;

    const currentOrders = currentPeriodData.reduce(
      (sum, d) => sum + d.orders,
      0
    );
    const previousOrders = previousPeriodData.reduce(
      (sum, d) => sum + d.orders,
      0
    );
    const ordersGrowth = previousOrders
      ? ((currentOrders - previousOrders) / previousOrders) * 100
      : 0;

    const currentTransactions = currentPeriodData.reduce(
      (sum, d) => sum + d.transactions,
      0
    );
    const previousTransactions = previousPeriodData.reduce(
      (sum, d) => sum + d.transactions,
      0
    );
    const transactionsGrowth = previousTransactions
      ? ((currentTransactions - previousTransactions) / previousTransactions) *
        100
      : 0;

    return {
      revenue: { value: currentRevenue, growth: revenueGrowth },
      orders: { value: currentOrders, growth: ordersGrowth },
      transactions: { value: currentTransactions, growth: transactionsGrowth },
      users: {
        value: dashboardData?.pendingApprovalUsers?.length || 0,
        growth: 0,
      },
    };
  };

  const stats = calculateStats();

  // Order status distribution
  const orderStatusData =
    dashboardData?.orderSummaries?.reduce((acc, order) => {
      const status = order.status || "UNKNOWN";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {}) || {};

  const pieChartData = Object.entries(orderStatusData).map(
    ([status, count]) => ({
      name: status.replace(/_/g, " "),
      value: count,
      percentage: (
        (count / (dashboardData?.orderSummaries?.length || 1)) *
        100
      ).toFixed(1),
    })
  );

  // Category performance
  const categoryData =
    dashboardData?.products?.reduce((acc, product) => {
      const category = product.category || "Other";
      if (!acc[category]) {
        acc[category] = { category, products: 0, revenue: 0 };
      }
      acc[category].products += 1;
      return acc;
    }, {}) || {};

  const categoryChartData = Object.values(categoryData).slice(0, 6);

  const COLORS = [
    "#25c8b1",
    "#3b82f6",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#06b6d4",
    "#84cc16",
    "#f97316",
    "#ec4899",
    "#6366f1",
  ];

  const handleRefresh = () => {
    refetchDashboard();
    refetchOrders();
    refetchTransactions();
  };

  // Helper function to convert data to CSV format
  const convertToCSV = (data, headers) => {
    const csvHeaders = headers.join(",");
    const csvRows = data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          // Handle values that might contain commas or quotes
          if (
            typeof value === "string" &&
            (value.includes(",") || value.includes('"'))
          ) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value || "";
        })
        .join(",")
    );
    return [csvHeaders, ...csvRows].join("\n");
  };

  // Helper function to download file
  const downloadFile = (content, filename, contentType) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export functions
  const exportTimeSeriesData = () => {
    const headers = [
      "Date",
      "Display Date",
      "Revenue",
      "Orders",
      "Users",
      "Transactions",
    ];
    const csvContent = convertToCSV(timeSeriesData, [
      "date",
      "displayDate",
      "revenue",
      "orders",
      "users",
      "transactions",
    ]);
    const filename = `analytics_time_series_${timeRange}_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    downloadFile(csvContent, filename, "text/csv;charset=utf-8;");
  };

  const exportOrderSummary = () => {
    if (!dashboardData?.orderSummaries) return;

    const ordersForExport = dashboardData.orderSummaries.map((order) => ({
      orderId: order.orderId,
      orderNumber: order.orderNumber,
      buyerName: order.buyerName,
      sellerName: order.sellerName,
      totalCost: order.totalCost,
      status: order.status,
      orderDate: new Date(order.orderDate).toLocaleDateString(),
      createdAt: new Date(order.createdAt).toLocaleDateString(),
    }));

    const headers = [
      "Order ID",
      "Order Number",
      "Buyer Name",
      "Seller Name",
      "Total Cost",
      "Status",
      "Order Date",
      "Created At",
    ];
    const csvContent = convertToCSV(ordersForExport, [
      "orderId",
      "orderNumber",
      "buyerName",
      "sellerName",
      "totalCost",
      "status",
      "orderDate",
      "createdAt",
    ]);
    const filename = `orders_summary_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    downloadFile(csvContent, filename, "text/csv;charset=utf-8;");
  };

  const exportOrderStatusData = () => {
    const headers = ["Status", "Count", "Percentage"];
    const csvContent = convertToCSV(pieChartData, [
      "name",
      "value",
      "percentage",
    ]);
    const filename = `order_status_distribution_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    downloadFile(csvContent, filename, "text/csv;charset=utf-8;");
  };

  const exportCategoryData = () => {
    const headers = ["Category", "Products", "Revenue"];
    const csvContent = convertToCSV(categoryChartData, [
      "category",
      "products",
      "revenue",
    ]);
    const filename = `category_performance_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    downloadFile(csvContent, filename, "text/csv;charset=utf-8;");
  };

  const exportKeyMetrics = () => {
    const metricsData = [
      {
        metric: "Total Revenue",
        value: stats.revenue.value,
        growth: `${stats.revenue.growth.toFixed(1)}%`,
        period: timeRange,
      },
      {
        metric: "Total Orders",
        value: stats.orders.value,
        growth: `${stats.orders.growth.toFixed(1)}%`,
        period: timeRange,
      },
      {
        metric: "Transactions",
        value: stats.transactions.value,
        growth: `${stats.transactions.growth.toFixed(1)}%`,
        period: timeRange,
      },
      {
        metric: "Pending Users",
        value: stats.users.value,
        growth: "0%",
        period: timeRange,
      },
    ];

    const headers = ["Metric", "Value", "Growth", "Period"];
    const csvContent = convertToCSV(metricsData, [
      "metric",
      "value",
      "growth",
      "period",
    ]);
    const filename = `key_metrics_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    downloadFile(csvContent, filename, "text/csv;charset=utf-8;");
  };

  const exportCompleteReport = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      timeRange: timeRange,
      keyMetrics: {
        revenue: stats.revenue,
        orders: stats.orders,
        transactions: stats.transactions,
        users: stats.users,
      },
      timeSeriesData: timeSeriesData,
      orderStatusDistribution: pieChartData,
      categoryPerformance: categoryChartData,
      recentOrders: dashboardData?.orderSummaries?.slice(0, 10) || [],
    };

    const jsonContent = JSON.stringify(reportData, null, 2);
    const filename = `complete_analytics_report_${
      new Date().toISOString().split("T")[0]
    }.json`;
    downloadFile(jsonContent, filename, "application/json;charset=utf-8;");
  };

  const StatCard = ({
    title,
    value,
    growth,
    icon: Icon,
    color,
    prefix = "",
  }) => (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`p-3 rounded-full ${color}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-secondary">
              {prefix}
              {typeof value === "number" ? value.toLocaleString() : value}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          {growth > 0 ? (
            <ArrowUpRight className="w-4 h-4 text-primary" />
          ) : (
            <ArrowDownRight className="w-4 h-4 text-red-500" />
          )}
          <span
            className={`text-sm font-medium ${
              growth > 0 ? "text-primary" : "text-red-600"
            }`}
          >
            {Math.abs(growth).toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );

  const renderChart = () => {
    const data = timeSeriesData;
    const dataKey = selectedMetric;

    switch (chartType) {
      case "area":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="displayDate" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
              />
              <Area
                type="monotone"
                dataKey={dataKey}
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        );
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="displayDate" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
              />
              <Bar dataKey={dataKey} fill="#25c8b1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      default:
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="displayDate" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
              />
              <Line
                type="monotone"
                dataKey={dataKey}
                stroke="#10b981"
                strokeWidth={3}
                dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: "#10b981" }}
              />
            </LineChart>
          </ResponsiveContainer>
        );
    }
  };

  if (dashboardLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-600">
            Loading Analytics...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen ">
      <div className="flex justify-end items-center space-x-3 py-2">
        <button
          onClick={handleRefresh}
          className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </button>

        {/* Export Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowExportDropdown(!showExportDropdown)}
            className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Report
            <svg
              className="w-4 h-4 ml-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {showExportDropdown && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
              <div className="py-2">
                <button
                  onClick={() => {
                    exportKeyMetrics();
                    setShowExportDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors flex items-center"
                >
                  <BarChart3 className="w-4 h-4 mr-3 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-900">Key Metrics</p>
                    <p className="text-sm text-gray-500">
                      Revenue, orders, transactions
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    exportTimeSeriesData();
                    setShowExportDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors flex items-center"
                >
                  <Activity className="w-4 h-4 mr-3 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-900">
                      Time Series Data
                    </p>
                    <p className="text-sm text-gray-500">
                      Performance trends over time
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    exportOrderSummary();
                    setShowExportDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors flex items-center"
                >
                  <ShoppingCart className="w-4 h-4 mr-3 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-900">Orders Summary</p>
                    <p className="text-sm text-gray-500">All order details</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    exportOrderStatusData();
                    setShowExportDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors flex items-center"
                >
                  <Target className="w-4 h-4 mr-3 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-900">Order Status</p>
                    <p className="text-sm text-gray-500">
                      Status distribution data
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    exportCategoryData();
                    setShowExportDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors flex items-center"
                >
                  <Package className="w-4 h-4 mr-3 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-900">
                      Category Performance
                    </p>
                    <p className="text-sm text-gray-500">
                      Products by category
                    </p>
                  </div>
                </button>

                <hr className="my-2" />

                <button
                  onClick={() => {
                    exportCompleteReport();
                    setShowExportDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors flex items-center"
                >
                  <Download className="w-4 h-4 mr-3 text-primary" />
                  <div>
                    <p className="font-medium text-primary">Complete Report</p>
                    <p className="text-sm text-gray-500">
                      All data in JSON format
                    </p>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <StatCard
            title="Total Revenue"
            value={stats.revenue.value}
            growth={stats.revenue.growth}
            icon={DollarSign}
            color="bg-primary"
            prefix="$"
          />
          <StatCard
            title="Total Orders"
            value={stats.orders.value}
            growth={stats.orders.growth}
            icon={ShoppingCart}
            color="bg-blue-500"
          />
          <StatCard
            title="Transactions"
            value={stats.transactions.value}
            growth={stats.transactions.growth}
            icon={Activity}
            color="bg-purple-500"
          />
          <StatCard
            title="Pending Users"
            value={stats.users.value}
            growth={0}
            icon={Users}
            color="bg-yellow-500"
          />
        </div>

        {/* Main Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-8">
          <div className="p-6 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
              <div>
                <h2 className="text-xl font-semibold text-secondary">
                  Performance Trends
                </h2>
                <p className="text-sm text-gray-600">
                  Track your key metrics over time
                </p>
              </div>
              <div className="flex flex-wrap items-center space-x-2 space-y-2 sm:space-y-0">
                {/* Time Range Selector */}
                <div className="flex bg-gray-100 rounded-lg p-1">
                  {[
                    { id: "weekly", label: "Weekly", icon: Calendar },
                    { id: "monthly", label: "Monthly", icon: Calendar },
                  ].map((range) => (
                    <button
                      key={range.id}
                      onClick={() => setTimeRange(range.id)}
                      className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        timeRange === range.id
                          ? "bg-primary text-white hover:bg-primary/90 shadow-sm"
                          : "text-secondary hover:text-primary"
                      }`}
                    >
                      <range.icon className="w-4 h-4 mr-1.5" />
                      {range.label}
                    </button>
                  ))}
                </div>

                {/* Metric Selector */}
                <select
                  value={selectedMetric}
                  onChange={(e) => setSelectedMetric(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline:none"
                >
                  <option value="revenue">Revenue</option>
                  <option value="orders">Orders</option>
                  <option value="transactions">Transactions</option>
                </select>

                {/* Chart Type Selector */}
                <div className="flex bg-gray-100 rounded-lg p-1">
                  {[
                    { id: "line", icon: Activity },
                    { id: "bar", icon: BarChart3 },
                    { id: "area", icon: TrendingUp },
                  ].map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setChartType(type.id)}
                      className={`p-2 rounded-md transition-colors ${
                        chartType === type.id
                          ? "bg-primary text-white shadow-sm"
                          : "text-secondary hover:text-primary"
                      }`}
                    >
                      <type.icon className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="p-6">{renderChart()}</div>
        </div>

        {/* Secondary Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Status Distribution */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-secondary">
                Order Status Distribution
              </h3>
              <p className="text-sm text-gray-600">
                Breakdown of order statuses
              </p>
            </div>
            <div className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name} (${percentage}%)`}
                    outerRadius={80}
                    fill="#25c8b1"
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Performance */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-secondary">
                Product Categories
              </h3>
              <p className="text-sm text-gray-600">
                Distribution by product categories
              </p>
            </div>
            <div className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryChartData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" stroke="#6b7280" />
                  <YAxis
                    type="category"
                    dataKey="category"
                    stroke="#6b7280"
                    width={100}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    }}
                  />
                  <Bar
                    dataKey="products"
                    fill="#10b981"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-secondary">
              Recent Activity
            </h3>
            <p className="text-sm text-gray-600">
              Latest orders and transactions
            </p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {dashboardData?.orderSummaries
                ?.slice(0, 5)
                .map((order, index) => (
                  <div
                    key={order.orderId}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <ShoppingCart className="w-5 h-5 text-primary" />
                        </div>
                      </div>
                      <div>
                        <p className="font-medium text-secondary">
                          Order #{order.orderNumber}
                        </p>
                        <p className="text-sm text-gray-600">
                          {order.buyerName} → {order.sellerName}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-secondary">
                        ${order.totalCost?.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(order.orderDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
        {showExportDropdown && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowExportDropdown(false)}
          />
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
