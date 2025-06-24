"use client";
import { useState, useEffect, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
} from "lucide-react";
import { MinTableCard } from "../../components/ui/Cards";
import { useQuery } from "@apollo/client";
import { useMSAuth } from "../../hooks/useMSAuth";
import { GET_MY_PRODUCTS_WITH_BATCHES } from "../../api/graphql/product/productQueries";
import {
  GET_MY_ORDERS,
  GET_ORDERS_TO_FULFILL,
} from "../../api/graphql/order/orderQuery";

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-lg shadow-md border border-gray-100">
        <p className="text-xs text-secondary/40 mb-1">{label}</p>
        {payload.map((entry, index) => (
          <div key={index}>
            <p className="text-lg font-bold" style={{ color: entry.color }}>
              ${entry.value?.toLocaleString() || 0}
            </p>
            <p className="text-xs text-secondary/40 capitalize">
              {entry.dataKey}
            </p>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Chart component
function ProfitRevenueChart({ chartData, userRole }) {
  const [periodType, setPeriodType] = useState("Monthly");

  const getChartTitle = () => {
    switch (userRole) {
      case "importer":
      case "supplier":
        return "Sales & Profit";
      case "healthcare-facility":
        return "Purchases & Expenses";
      default:
        return "Financial Overview";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm px-6 py-2 h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-secondary/70">
          {getChartTitle()}
        </h2>
        <button className="flex items-center gap-2 py-1 px-3 rounded-lg text-sm border border-primary">
          <Calendar className="w-4 h-4" />
          <span>{periodType}</span>
        </button>
      </div>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
          >
            <CartesianGrid vertical={false} stroke="#f5f5f5" />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#888" }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#888" }}
              tickFormatter={(value) =>
                value.toLocaleString(undefined, { maximumFractionDigits: 0 })
              }
            />
            <Tooltip content={<CustomTooltip />} />

            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#25C8B1"
              strokeWidth={2.5}
              dot={false}
              activeDot={{
                r: 6,
                fill: "#25C8B1",
                stroke: "white",
                strokeWidth: 2,
              }}
              isAnimationActive={true}
              animationDuration={1500}
            />

            <Line
              type="monotone"
              dataKey="profit"
              stroke="#F3D9A4"
              strokeWidth={2.5}
              dot={false}
              activeDot={{
                r: 4,
                fill: "#F3D9A4",
                stroke: "white",
                strokeWidth: 2,
              }}
              isAnimationActive={true}
              animationDuration={1500}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-center gap-8">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary"></div>
          <span className="text-sm text-secondary/60">
            {userRole === "healthcare-facility" ? "Purchases" : "Revenue"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-200"></div>
          <span className="text-sm text-secondary/60">
            {userRole === "healthcare-facility" ? "Savings" : "Profit"}
          </span>
        </div>
      </div>
    </div>
  );
}

// Helper function to get month name from date
const getMonthName = (date) => {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return months[date.getMonth()];
};

// Helper function to get last 12 months
const getLast12Months = () => {
  const months = [];
  const now = new Date();

  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      name: getMonthName(date),
      year: date.getFullYear(),
      month: date.getMonth(),
      fullDate: date,
    });
  }

  return months;
};

// Main Analytics Component
export default function AnalyticsPage() {
  const { user: userData, loading: authLoading } = useMSAuth();
  const userRole = userData?.role;

  // Determine which queries to run based on user role
  const shouldFetchBuyerData = ["supplier", "healthcare-facility"].includes(
    userRole
  );
  const shouldFetchSellerData = ["importer", "supplier"].includes(userRole);

  // GraphQL Queries
  const {
    data: productsData,
    loading: productsLoading,
    error: productsError,
  } = useQuery(GET_MY_PRODUCTS_WITH_BATCHES, {
    skip: !shouldFetchSellerData,
    errorPolicy: "ignore",
  });

  const {
    data: buyerOrdersData,
    loading: buyerOrdersLoading,
    error: buyerOrdersError,
  } = useQuery(GET_MY_ORDERS, {
    skip: !shouldFetchBuyerData,
    errorPolicy: "ignore",
  });

  const {
    data: sellerOrdersData,
    loading: sellerOrdersLoading,
    error: sellerOrdersError,
  } = useQuery(GET_ORDERS_TO_FULFILL, {
    skip: !shouldFetchSellerData,
    errorPolicy: "ignore",
  });

  // Calculate analytics data
  const analyticsData = useMemo(() => {
    if (authLoading) return null;

    const products = productsData?.myProducts || [];
    const buyerOrders = buyerOrdersData?.myOrders || [];
    const sellerOrders = sellerOrdersData?.ordersToFulfill || [];

    // Calculate totals based on role
    let totalRevenue = 0;
    let totalProfit = 0;
    let totalPurchases = 0;
    let totalProducts = products.length;
    let totalStock = 0;

    // Calculate stock from products
    products.forEach((product) => {
      if (product.batches && Array.isArray(product.batches)) {
        product.batches.forEach((batch) => {
          totalStock += batch.quantity || 0;
        });
      }
    });

    // Calculate purchases from buyer orders
    buyerOrders.forEach((order) => {
      if (order.totalCost && typeof order.totalCost === "number") {
        totalPurchases += order.totalCost;
      }
    });

    // Calculate sales and profit from seller orders
    const completedSales = sellerOrders.filter((order) =>
      ["COMPLETED", "PICKUP_CONFIRMED"].includes(order.status)
    );

    completedSales.forEach((order) => {
      if (order.totalCost && typeof order.totalCost === "number") {
        totalRevenue += order.totalCost;

        // Calculate actual profit based on order items and product cost prices
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach((item) => {
            // Find matching product and batch to get cost price
            const product = products.find((p) => p.name === item.productName);
            if (product && product.batches) {
              const batch = product.batches[0]; // Use first available batch
              if (batch && batch.costPrice && batch.sellingPrice) {
                const itemProfit =
                  (batch.sellingPrice - batch.costPrice) *
                  (item.totalQuantity || 0);
                totalProfit += itemProfit;
              }
            }
          });
        }
      }
    });

    // Generate monthly data for chart
    const generateMonthlyData = () => {
      const last12Months = getLast12Months();

      return last12Months.map((monthInfo) => {
        const monthOrders =
          userRole === "healthcare-facility"
            ? buyerOrders.filter((order) => {
                if (!order.orderDate) return false;
                const orderDate = new Date(order.orderDate);
                return (
                  orderDate.getMonth() === monthInfo.month &&
                  orderDate.getFullYear() === monthInfo.year
                );
              })
            : sellerOrders.filter((order) => {
                if (!order.orderDate) return false;
                const orderDate = new Date(order.orderDate);
                return (
                  orderDate.getMonth() === monthInfo.month &&
                  orderDate.getFullYear() === monthInfo.year &&
                  ["COMPLETED", "PICKUP_CONFIRMED"].includes(order.status)
                );
              });

        const monthRevenue = monthOrders.reduce(
          (sum, order) => sum + (order.totalCost || 0),
          0
        );

        // Calculate actual profit for the month
        let monthProfit = 0;
        if (userRole !== "healthcare-facility") {
          monthOrders.forEach((order) => {
            if (order.items && Array.isArray(order.items)) {
              order.items.forEach((item) => {
                const product = products.find(
                  (p) => p.name === item.productName
                );
                if (product && product.batches && product.batches.length > 0) {
                  const batch = product.batches[0];
                  if (batch && batch.costPrice && batch.sellingPrice) {
                    monthProfit +=
                      (batch.sellingPrice - batch.costPrice) *
                      (item.totalQuantity || 0);
                  }
                }
              });
            }
          });
        } else {
          // For health facilities, show savings (could be calculated differently)
          monthProfit = monthRevenue * 0.1; // Example: 10% savings
        }

        return {
          month: monthInfo.name,
          revenue: monthRevenue,
          profit: monthProfit,
        };
      });
    };

    // Get product statistics
    const getProductStats = () => {
      const productMap = new Map();
      const ordersToProcess =
        userRole === "healthcare-facility" ? buyerOrders : sellerOrders;

      ordersToProcess.forEach((order) => {
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach((item) => {
            const key = item.productName;
            if (productMap.has(key)) {
              const existing = productMap.get(key);
              existing.totalQuantity += item.totalQuantity || 0;
              existing.totalValue += item.totalPrice || 0;
              existing.orderCount += 1;
            } else {
              productMap.set(key, {
                name: item.productName,
                category: "General", // You might want to get this from the product
                totalQuantity: item.totalQuantity || 0,
                totalValue: item.totalPrice || 0,
                orderCount: 1,
              });
            }
          });
        }
      });

      // Convert to array and add stock levels from products
      const stats = Array.from(productMap.values()).map((stat) => {
        const product = products.find((p) => p.name === stat.name);
        const stockLevel =
          product?.batches?.reduce(
            (total, batch) => total + (batch.quantity || 0),
            0
          ) || 0;

        // Find closest expiry for drug products
        let closestExpiry = "N/A";
        if (product?.productType === "DRUG" && product.batches) {
          const expiryDates = product.batches
            .map((batch) => batch.expiryDate)
            .filter((date) => date)
            .sort((a, b) => new Date(a) - new Date(b));

          if (expiryDates.length > 0) {
            closestExpiry = new Date(expiryDates[0]).toLocaleDateString();
          }
        }

        return {
          id: product?.productId || Math.random().toString(36).substr(2, 9),
          name: stat.name,
          productType: product?.productType,
          category: stat.category,
          stockLevel: `${stockLevel} Units`,
          increase: stat.orderCount.toString(),
          closestExpiry: closestExpiry || "-",
          totalValue: stat.totalValue,
        };
      });

      return stats.sort((a, b) => b.totalValue - a.totalValue).slice(0, 10);
    };

    // Generate monthly chart data
    const monthlyData = generateMonthlyData();

    // Get best selling/purchased products
    const productStats = getProductStats();

    // Calculate order statistics
    const allOrders = [...buyerOrders, ...sellerOrders];
    const pendingOrders = allOrders.filter((order) =>
      ["PENDING_CONFIRMATION", "CONFIRMED", "PREPARING"].includes(order.status)
    ).length;

    const completedOrders = allOrders.filter((order) =>
      ["COMPLETED", "PICKUP_CONFIRMED"].includes(order.status)
    ).length;

    return {
      totalRevenue:
        userRole === "healthcare-facility" ? totalPurchases : totalRevenue,
      totalProfit,
      totalPurchases,
      totalProducts,
      totalStock,
      monthlyData,
      productStats,
      pendingOrders,
      completedOrders,
    };
  }, [productsData, buyerOrdersData, sellerOrdersData, userRole, authLoading]);

  // Loading state
  if (
    authLoading ||
    productsLoading ||
    buyerOrdersLoading ||
    sellerOrdersLoading
  ) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading analytics...</div>
      </div>
    );
  }

  // Error state
  if (productsError || buyerOrdersError || sellerOrdersError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-500">
          Error loading data. Please try again.
        </div>
      </div>
    );
  }

  // No access state
  if (!userRole) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-500">
          Access denied. Please log in.
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">No data available</div>
      </div>
    );
  }

  // Prepare stats based on user role
  const getStatsForRole = () => {
    switch (userRole) {
      case "importer":
        return [
          { "Total Sales": analyticsData.totalRevenue },
          { "Total Products": analyticsData.totalProducts },
          { "Total Stock": analyticsData.totalStock },
        ];
      case "supplier":
        return [
          { "Total Sales": analyticsData.totalRevenue },
          { "Total Purchases": analyticsData.totalPurchases },
          { "Net Profit": analyticsData.totalProfit },
        ];
      case "healthcare-facility":
        return [
          { "Total Purchases": analyticsData.totalRevenue },
          { "Pending Orders": analyticsData.pendingOrders },
          { "Completed Orders": analyticsData.completedOrders },
        ];
      default:
        return [];
    }
  };

  const getSecondaryStats = () => {
    if (userRole === "healthcare-facility") {
      const currentMonth =
        analyticsData.monthlyData[analyticsData.monthlyData.length - 1]
          ?.revenue || 0;
      const lastMonth =
        analyticsData.monthlyData[analyticsData.monthlyData.length - 2]
          ?.revenue || 0;
      const growth =
        lastMonth > 0
          ? (((currentMonth - lastMonth) / lastMonth) * 100).toFixed(1)
          : "0";

      return [
        { "This Month": currentMonth },
        { "Last Month": lastMonth },
        { Growth: `${growth}%` },
      ];
    }

    return [
      { "Active Products": analyticsData.totalProducts },
      { "Pending Orders": analyticsData.pendingOrders },
      { "Completed Orders": analyticsData.completedOrders },
    ];
  };

  const productsColumns = [
    {
      key: "name",
      label:
        userRole === "healthcare-facility"
          ? "Most Purchased"
          : "Best Selling Products",
    },
    { key: "id", label: "Product Id" },
    { key: "productType", label: "Product Type" },
    { key: "category", label: "Category" },
    {
      key: "stockLevel",
      label: userRole === "healthcare-facility" ? "Last Order" : "Stock Level",
    },
    { key: "closestExpiry", label: "Closest Expiry" },
    {
      key: "increase",
      label: userRole === "healthcare-facility" ? "Orders" : "Sales Count",
    },
  ];

  return (
    <div className="flex flex-col gap-2">
      {/* Stats Cards */}
      <div className="flex gap-2">
        <div className="w-full flex flex-row bg-white rounded-lg p-4 shadow-md justify-around">
          {getStatsForRole().map((stat, index) => (
            <div key={index} className="flex flex-col items-center">
              <span className="text-xl font-medium text-secondary">
                {typeof Object.values(stat)[0] === "number"
                  ? `$${Object.values(stat)[0].toLocaleString()}`
                  : Object.values(stat)[0]}
              </span>
              <span className="text-base font-semibold text-secondary/50">
                {Object.keys(stat)[0]}
              </span>
            </div>
          ))}
        </div>

        <div className="w-full flex flex-row bg-white rounded-lg p-4 shadow-md justify-around">
          {getSecondaryStats().map((stat, index) => (
            <div key={index} className="flex flex-col items-center">
              <span className="text-xl font-medium text-secondary">
                {typeof Object.values(stat)[0] === "number"
                  ? Object.values(stat)[0].toLocaleString()
                  : Object.values(stat)[0]}
              </span>
              <span className="text-base font-semibold text-secondary/50">
                {Object.keys(stat)[0]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Chart */}
      <ProfitRevenueChart
        chartData={analyticsData.monthlyData}
        userRole={userRole}
      />

      {/* Products Table */}
      <MinTableCard
        onSeeAll={() => {
          // Navigate to products page or show all products
          if (userRole !== "healthcare-facility") {
            window.location.href = `/medical-supplies/${userRole}/inventory`;
          }
        }}
        title={
          userRole === "healthcare-facility"
            ? "Most Purchased Products"
            : "Best Selling Products"
        }
        data={analyticsData.productStats}
        columns={productsColumns}
      />
    </div>
  );
}
