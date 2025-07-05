"use client";
import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import {
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  Edit,
  Trash2,
  Filter,
  Search,
  Download,
  RefreshCw,
} from "lucide-react";

// Import GraphQL queries and mutations
import {
  DASHBOARD_OVERVIEW_QUERY,
  ORDERS_QUERY,
  USERS_QUERY,
  PRODUCTS_QUERY,
  TRANSACTIONS_QUERY,
} from "../api/graphql/admin/queries";

import {
  APPROVE_USER_MUTATION,
  REJECT_USER_MUTATION,
  UPDATE_ORDER_STATUS_MUTATION,
  UPDATE_TRANSACTION_STATUS_MUTATION,
} from "../api/graphql/admin/mutations";

// Import components
import {
  StatusBadge,
  StatsCard,
  LoadingSpinner,
  ErrorAlert,
} from "../components/ui/admin/adminSmallComponents";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [userRole, setUserRole] = useState("importer");

  // Dashboard Overview Query
  const {
    data: dashboardData,
    loading: dashboardLoading,
    error: dashboardError,
    refetch: refetchDashboard,
  } = useQuery(DASHBOARD_OVERVIEW_QUERY, {
    fetchPolicy: "cache-and-network",
  });

  // Orders Query
  const {
    data: ordersData,
    loading: ordersLoading,
    error: ordersError,
    refetch: refetchOrders,
  } = useQuery(ORDERS_QUERY, {
    skip: activeTab !== "orders",
    fetchPolicy: "cache-and-network",
  });

  // Users Query
  const {
    data: usersData,
    loading: usersLoading,
    error: usersError,
    refetch: refetchUsers,
  } = useQuery(USERS_QUERY, {
    variables: { role: userRole },
    skip: activeTab !== "users",
    fetchPolicy: "cache-and-network",
  });

  // Products Query
  const {
    data: productsData,
    loading: productsLoading,
    error: productsError,
    refetch: refetchProducts,
  } = useQuery(PRODUCTS_QUERY, {
    variables: { limit: 50 },
    skip: activeTab !== "products",
    fetchPolicy: "cache-and-network",
  });

  // Transactions Query
  const {
    data: transactionsData,
    loading: transactionsLoading,
    error: transactionsError,
    refetch: refetchTransactions,
  } = useQuery(TRANSACTIONS_QUERY, {
    skip: activeTab !== "transactions",
    fetchPolicy: "cache-and-network",
  });

  // Mutations
  const [approveUser] = useMutation(APPROVE_USER_MUTATION, {
    refetchQueries: [{ query: DASHBOARD_OVERVIEW_QUERY }],
    onCompleted: () => {
      console.log("User approved successfully");
    },
    onError: (error) => {
      console.error("Error approving user:", error);
    },
  });

  const [rejectUser] = useMutation(REJECT_USER_MUTATION, {
    refetchQueries: [{ query: DASHBOARD_OVERVIEW_QUERY }],
    onCompleted: () => {
      console.log("User rejected successfully");
    },
    onError: (error) => {
      console.error("Error rejecting user:", error);
    },
  });

  const [updateOrderStatus] = useMutation(UPDATE_ORDER_STATUS_MUTATION, {
    refetchQueries: [{ query: ORDERS_QUERY }],
    onCompleted: () => {
      console.log("Order status updated successfully");
    },
    onError: (error) => {
      console.error("Error updating order status:", error);
    },
  });

  const [updateTransactionStatus] = useMutation(
    UPDATE_TRANSACTION_STATUS_MUTATION,
    {
      refetchQueries: [{ query: TRANSACTIONS_QUERY }],
      onCompleted: () => {
        console.log("Transaction status updated successfully");
      },
      onError: (error) => {
        console.error("Error updating transaction status:", error);
      },
    }
  );

  // Handle user approval
  const handleApproveUser = async (userId) => {
    try {
      await approveUser({ variables: { userId } });
    } catch (error) {
      console.error("Error approving user:", error);
    }
  };

  // Handle user rejection
  const handleRejectUser = async (userId, reason) => {
    try {
      await rejectUser({ variables: { userId, reason } });
    } catch (error) {
      console.error("Error rejecting user:", error);
    }
  };

  // Handle order status update
  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      await updateOrderStatus({ variables: { orderId, status } });
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  };

  // Handle transaction status update
  const handleUpdateTransactionStatus = async (transactionId, status) => {
    try {
      await updateTransactionStatus({ variables: { transactionId, status } });
    } catch (error) {
      console.error("Error updating transaction status:", error);
    }
  };

  // Calculate dashboard stats
  const dashboardStats = {
    totalOrders: dashboardData?.orderSummaries?.length || 0,
    totalRevenue:
      dashboardData?.orderSummaries?.reduce(
        (sum, order) => sum + (order.totalCost || 0),
        0
      ) || 0,
    totalProducts: dashboardData?.products?.length || 0,
    pendingApprovals: dashboardData?.pendingApprovalUsers?.length || 0,
    activeTransactions:
      dashboardData?.transactionSummaries?.filter(
        (t) => t.status === "PROCESSING" || t.status === "PENDING"
      )?.length || 0,
  };

  // Get current tab data
  const getCurrentTabData = () => {
    switch (activeTab) {
      case "overview":
        return {
          loading: dashboardLoading,
          error: dashboardError,
          data: dashboardData,
        };
      case "orders":
        return {
          loading: ordersLoading,
          error: ordersError,
          data: ordersData?.ordersByStatus || [],
        };
      case "users":
        return {
          loading: usersLoading,
          error: usersError,
          data: usersData?.msUsersByRole || [],
        };
      case "products":
        return {
          loading: productsLoading,
          error: productsError,
          data: productsData?.products || [],
        };
      case "transactions":
        return {
          loading: transactionsLoading,
          error: transactionsError,
          data: transactionsData?.transactionsByStatus || [],
        };
      default:
        return { loading: false, error: null, data: [] };
    }
  };

  const { loading, error, data } = getCurrentTabData();

  // Chart data processing
  const orderStatusData =
    dashboardData?.orderSummaries?.reduce((acc, order) => {
      const status = order.status || "UNKNOWN";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {}) || {};

  const chartData = Object.entries(orderStatusData).map(([status, count]) => ({
    name: status.replace(/_/g, " "),
    value: count,
  }));

  const COLORS = ["#10b981", "#3b82f6", "#fbbf24", "#ef4444", "#8b5cf6"];

  // Refresh function
  const handleRefresh = () => {
    refetchDashboard();
    if (activeTab === "orders") refetchOrders();
    if (activeTab === "users") refetchUsers();
    if (activeTab === "products") refetchProducts();
    if (activeTab === "transactions") refetchTransactions();
  };

  if (dashboardLoading && activeTab === "overview") {
    return (
      <div className="bg-gray-50 h-[90vh] rounded-2xl shadow-xl flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="  scrollbar-hide">
      {/* Navigation Tabs */}
      <div className=" flex justify-between items-center  ">
        <div className=" ">
          <div className="flex space-x-8">
            {[
              { id: "overview", label: "Overview", icon: TrendingUp },
              { id: "orders", label: "Orders", icon: ShoppingCart },
              { id: "users", label: "Users", icon: Users },
              { id: "products", label: "Products", icon: Package },
              { id: "transactions", label: "Transactions", icon: DollarSign },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-4 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-secondary/60 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <tab.icon className="w-5 h-5 mr-2" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={handleRefresh}
            className="flex items-center px-4 py-2 border border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
          <button className="flex items-center px-4 py-2 border border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition-colors">
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <ErrorAlert error={error.message} onRetry={handleRefresh} />
        </div>
      )}

      {/* Main Content */}
      <div className=" py-8 h-[80vh] overflow-y-auto scrollbar-hide">
        {activeTab === "overview" && (
          <div className="space-y-4">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard
                title="Total Orders"
                value={dashboardStats.totalOrders.toLocaleString()}
                icon={ShoppingCart}
                color="bg-blue-500"
                change={12}
              />
              <StatsCard
                title="Total Revenue"
                value={`$${dashboardStats.totalRevenue.toLocaleString()}`}
                icon={DollarSign}
                color="bg-primary"
                change={8}
              />
              <StatsCard
                title="Total Products"
                value={dashboardStats.totalProducts.toLocaleString()}
                icon={Package}
                color="bg-purple-500"
                change={5}
              />
              <StatsCard
                title="Pending Approvals"
                value={dashboardStats.pendingApprovals.toLocaleString()}
                icon={Clock}
                color="bg-yellow-500"
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Order Status Chart */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-secondary mb-4">
                  Order Status Distribution
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#25c8b1"
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
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

              {/* Recent Orders */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-secondary mb-4">
                  Recent Orders
                </h3>
                <div className="space-y-4">
                  {dashboardData?.orderSummaries?.slice(0, 5).map((order) => (
                    <div
                      key={order.orderId}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-secondary">
                          Order #{order.orderNumber}
                        </p>
                        <p className="text-sm text-gray-600">
                          {order.buyerName} → {order.sellerName}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-secondary">
                          ${order.totalCost?.toLocaleString()}
                        </p>
                        <StatusBadge status={order.status} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Pending Approvals */}
            {dashboardData?.pendingApprovalUsers?.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-secondary mb-4">
                  Pending User Approvals
                </h3>
                <div className="space-y-4">
                  {dashboardData.pendingApprovalUsers.map((user) => (
                    <div
                      key={user.userId}
                      className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200"
                    >
                      <div>
                        <p className="font-medium text-secondary">
                          {user.companyName || user.contactName}
                        </p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleApproveUser(user.userId)}
                          className="px-3 py-1 bg-primary/60 text-white rounded-md hover:bg-primary text-sm"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() =>
                            handleRejectUser(
                              user.userId,
                              "Incomplete documentation"
                            )
                          }
                          className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <div className="space-y-6">
            {/* <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-secondary">
                Orders Management
              </h2>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search orders..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:outline-primary focus:border-none "
                  />
                </div>
                <button className="flex items-center px-4 py-2 border border-primary text-primary rounded-lg hover:bg-primary hover:text-white">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </button>
              </div>
            </div> */}

            {loading ? (
              <div className="bg-gray-50 h-[90vh] rounded-2xl shadow-xl flex items-center justify-center">
                <div className="text-center">
                  <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-gray-600">Loading orders...</p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-primary text-white text-sm font-medium  uppercase tracking-wider ">
                      <tr>
                        <th className="px-6 py-3 text-left ">Order</th>
                        <th className="px-6 py-3 text-left ">Buyer</th>
                        <th className="px-6 py-3 text-left ">Seller</th>
                        <th className="px-6 py-3 text-left ">Amount</th>
                        <th className="px-6 py-3 text-left ">Status</th>
                        <th className="px-6 py-3 text-left ">Date</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {data.map((order) => (
                        <tr key={order.orderId} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <p className="text-sm font-medium text-secondary">
                                #{order.orderNumber}
                              </p>
                              <p className="text-sm text-secondary/60">
                                {order.orderId}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <p className="text-sm font-medium text-secondary">
                                {order.buyerName}
                              </p>
                              <p className="text-sm text-secondary/60">
                                {order.buyerCompanyName}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <p className="text-sm font-medium text-secondary">
                                {order.sellerName}
                              </p>
                              <p className="text-sm text-secondary/60">
                                {order.sellerCompanyName}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <p className="text-sm font-medium text-secondary">
                              ${order.totalCost?.toLocaleString()}
                            </p>
                            <p className="text-sm text-secondary/60">
                              {order.totalItems} items
                            </p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge status={order.status} type="order" />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary/60">
                            {new Date(order.orderDate).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-secondary">
                Users Management
              </h2>
              <div className="flex space-x-3">
                {[
                  { id: "admin", label: "admin" },
                  { id: "importer", label: "importer" },
                  { id: "supplier", label: "supplier" },
                  { id: "healthcare-facility", label: "healthcare-facility" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setUserRole(tab.id)}
                    className={`flex items-center p-2 border-b-2 font-medium text-sm uppercase ${
                      userRole === tab.id
                        ? "border-primary text-primary"
                        : "border-transparent text-secondary/60 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="bg-gray-50 h-[90vh] rounded-2xl shadow-xl flex items-center justify-center">
                <div className="text-center">
                  <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-gray-600">Loading users...</p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-primary text-white text-sm font-medium  uppercase tracking-wider ">
                      <tr>
                        <th className="px-6 py-3 text-left ">User</th>
                        <th className="px-6 py-3 text-left ">Company</th>
                        <th className="px-6 py-3 text-left ">Role</th>
                        <th className="px-6 py-3 text-left ">Status</th>
                        <th className="px-6 py-3 text-left ">Created</th>
                        {/* <th className="px-6 py-3 text-left ">Actions</th> */}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {data.map((user) => (
                        <tr key={user.userId} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <img
                                  className="h-10 w-10 rounded-full"
                                  src={
                                    process.env
                                      .NEXT_PUBLIC_MEDICAL_SUPPLIES_API_URL +
                                      user.profileImageUrl ||
                                    `https://ui-avatars.com/api/?name=${user.contactName}&background=random`
                                  }
                                  alt=""
                                />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-secondary">
                                  {user.contactName}
                                </div>
                                <div className="text-sm text-secondary/60">
                                  {user.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-secondary">
                              {user.companyName}
                            </div>
                            <div className="text-sm text-secondary/60">
                              {user.phoneNumber}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {user.isApproved ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-primary">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Approved
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                <Clock className="w-3 h-3 mr-1" />
                                Pending
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary/60">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                          {/* <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button className="text-blue-600 hover:text-blue-900">
                                <Eye className="w-4 h-4" />
                              </button>
                              {!user.isApproved && (
                                <>
                                  <button
                                    onClick={() =>
                                      handleApproveUser(user.userId)
                                    }
                                    className="text-primary/60 hover:text-primary"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleRejectUser(
                                        user.userId,
                                        "Admin rejection"
                                      )
                                    }
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td> */}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Products Tab */}
        {activeTab === "products" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-secondary">
                Products Management
              </h2>
            </div>

            {loading ? (
              <div className="bg-gray-50 h-[90vh] rounded-2xl shadow-xl flex items-center justify-center">
                <div className="text-center">
                  <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-gray-600">Loading Products...</p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-primary text-white text-sm font-medium  uppercase tracking-wider ">
                      <tr>
                        <th className="px-6 py-3 text-left ">Product</th>
                        <th className="px-6 py-3 text-left ">Type</th>
                        <th className="px-6 py-3 text-left ">Owner</th>
                        <th className="px-6 py-3 text-left ">Category</th>
                        <th className="px-6 py-3 text-left ">Status</th>
                        <th className="px-6 py-3 text-left ">Batches</th>
                        {/* <th className="px-6 py-3 text-left ">
                          Actions
                        </th> */}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {data.map((product) => (
                        <tr
                          key={product.productId}
                          className="hover:bg-gray-50"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <img
                                  className="h-10 w-10 rounded-lg object-cover"
                                  src={
                                    process.env
                                      .NEXT_PUBLIC_MEDICAL_SUPPLIES_API_URL +
                                      product.imageList?.[0] ||
                                    "https://via.placeholder.com/40x40?text=No+Image"
                                  }
                                  alt=""
                                />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-secondary">
                                  {product.name}
                                </div>
                                <div className="text-sm text-secondary/60">
                                  {product.productId}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${product.productType === "EQUIPMENT" ? "bg-purple-100 text-purple-800" : "bg-orange-100 text-orange-800"} `}>
                              {product.productType}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-secondary">
                              {product.ownerName}
                            </div>
                            <div className="text-sm text-secondary/60">
                              ID: {product.ownerId}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary/60">
                            {product.category}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {product.isActive ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                <XCircle className="w-3 h-3 mr-1" />
                                Inactive
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary/60">
                            {product.batches?.length || 0} batches
                          </td>
                          {/* <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button className="text-blue-600 hover:text-blue-900">
                                <Eye className="w-4 h-4" />
                              </button>
                              <button className="text-green-600 hover:text-green-900">
                                <Edit className="w-4 h-4" />
                              </button>
                              <button className="text-red-600 hover:text-red-900">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td> */}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === "transactions" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-secondary">
                Transactions Management
              </h2>
            </div>

             {loading ? (
              <div className="bg-gray-50 h-[90vh] rounded-2xl shadow-xl flex items-center justify-center">
                <div className="text-center">
                  <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-gray-600">Loading Transactions...</p>
                </div>
              </div>
            )  : (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-primary text-white text-sm font-medium  uppercase tracking-wider ">
                      <tr>
                        <th className="px-6 py-3 text-left ">Transaction</th>
                        <th className="px-6 py-3 text-left ">Order ID</th>
                        <th className="px-6 py-3 text-left ">Amount</th>
                        <th className="px-6 py-3 text-left ">Status</th>
                        <th className="px-6 py-3 text-left ">Chapa Status</th>
                        <th className="px-6 py-3 text-left ">Created</th>
                        {/* <th className="px-6 py-3 text-left ">
                          Actions
                        </th> */}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {data.map((transaction) => (
                        <tr
                          key={transaction.transactionId}
                          className="hover:bg-gray-50"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <p className="text-sm font-medium text-secondary">
                                {transaction.transactionId}
                              </p>
                              <p className="text-sm text-secondary/60">
                                {transaction.chapaRef}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary">
                            {transaction.orderId}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <p className="text-sm font-medium text-secondary">
                              {transaction.amount} {transaction.currency}
                            </p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge
                              status={transaction.status}
                              type="transaction"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {transaction.chapaStatus}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary/60">
                            {new Date(
                              transaction.createdAt
                            ).toLocaleDateString()}
                          </td>
                          {/* <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button className="text-blue-600 hover:text-blue-900">
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() =>
                                  handleUpdateTransactionStatus(
                                    transaction.transactionId,
                                    "RELEASED_TO_SELLER"
                                  )
                                }
                                className="text-green-600 hover:text-green-900"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() =>
                                  handleUpdateTransactionStatus(
                                    transaction.transactionId,
                                    "REFUNDED"
                                  )
                                }
                                className="text-red-600 hover:text-red-900"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </div>
                          </td> */}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
