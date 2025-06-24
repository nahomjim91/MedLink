"use client";
import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@apollo/client";
import { useMSAuth } from "../hooks/useMSAuth";
import {
  GET_MY_ORDERS,
  GET_ORDERS_TO_FULFILL,
} from "../api/graphql/order/orderQuery";
import { GET_MY_PRODUCTS_WITH_BATCHES } from "../api/graphql/product/productQueries";
import {
  MetricCard,
  DynamicMinOrderCard,
  DynamicMinTransactionCard,
} from "../components/ui/Cards";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import {
  Calendar,
  ChevronDown,
  DollarSign,
  Pill,
  Syringe,
  BriefcaseMedical,
} from "lucide-react";

// Helper function to get date ranges
const getDateRanges = () => {
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);
  const sixtyDaysAgo = new Date(today);
  sixtyDaysAgo.setDate(today.getDate() - 60);

  return {
    currentPeriodStart: thirtyDaysAgo,
    currentPeriodEnd: today,
    previousPeriodStart: sixtyDaysAgo,
    previousPeriodEnd: thirtyDaysAgo,
  };
};

// Helper function to get last 7 days
const getLast7Days = () => {
  const days = [];
  const today = new Date();
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    days.push({
      day: dayNames[date.getDay()],
      fullDate: date,
      dateString: date.toISOString().split("T")[0],
    });
  }
  return days;
};

// Helper function to check if date is in range
const isDateInRange = (date, startDate, endDate) => {
  const checkDate = new Date(date);
  return checkDate >= startDate && checkDate <= endDate;
};

// Helper function to calculate percentage change
const calculatePercentageChange = (current, previous) => {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return Math.round(((current - previous) / previous) * 100);
};

// Custom tooltip for the bar chart
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-secondary/80 text-white p-2 rounded shadow-lg text-xs">
        <p>${payload[0].value?.toLocaleString() || 0}</p>
        <p className="text-gray-300">{payload[0].payload.day}</p>
      </div>
    );
  }
  return null;
};

// Weekly Sales Bar Chart Component
const WeeklySalesChart = ({ weeklyData, userRole }) => {
  const [periodType, setPeriodType] = useState("Weekly");
  const [selectedDay, setSelectedDay] = useState("Thu");

  const getChartTitle = () => {
    switch (userRole) {
      case "importer":
      case "supplier":
        return "Weekly Sales";
      case "healthcare-facility":
        return "Weekly Purchases";
      default:
        return "Weekly Activity";
    }
  };

  return (
    <div className="relative bg-white rounded-lg px-6 py-1.5 shadow-sm h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-secondary/80">
          {getChartTitle()}
        </h2>
        <div className="relative">
          <button className="flex items-center gap-2 py-2 px-4 bg-gray-100 rounded-lg text-sm">
            <Calendar className="w-4 h-4" />
            <span>{periodType}</span>
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={weeklyData}
            margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
          >
            <CartesianGrid
              vertical={false}
              strokeDasharray="3 3"
              stroke="#f0f0f0"
            />
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="sales"
              radius={[5, 5, 5, 5]}
              barSize={30}
              fill="var(--color-primary)"
              animationDuration={700}
            >
              {weeklyData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    entry.day === selectedDay
                      ? "var(--color-primary)"
                      : "rgba(37, 200, 177, 0.3)"
                  }
                  cursor="pointer"
                  onClick={() => setSelectedDay(entry.day)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// Cost Breakdown Donut Chart Component
const CostBreakdownChart = ({ costData }) => {
  const totalCost = costData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-white rounded-lg px-6 py-3 shadow-sm h-full">
      <div className="flex justify-between items-center mb-1">
        <h2 className="text-lg font-semibold text-secondary/80">
          Cost Breakdown
        </h2>
      </div>
      <div className="flex items-center">
        <div className="relative w-40 h-40">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={costData}
                cx="50%"
                cy="50%"
                innerRadius={35}
                outerRadius={65}
                paddingAngle={3}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
              >
                {costData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-semibold">
              ${totalCost.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="ml-4 flex flex-col gap-4">
          {costData.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              ></div>
              <span className="text-sm text-gray-600">{item.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Main Dashboard Component
export default function DynamicDashboard() {
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

  // Calculate dashboard data with period comparisons
  const dashboardData = useMemo(() => {
    if (authLoading) return null;

    const products = productsData?.myProducts || [];
    const buyerOrders = buyerOrdersData?.myOrders || [];
    const sellerOrders = sellerOrdersData?.ordersToFulfill || [];
    
    const dateRanges = getDateRanges();

    // Helper function to filter orders by date range
    const filterOrdersByDateRange = (orders, startDate, endDate) => {
      return orders.filter(order => 
        order.orderDate && isDateInRange(order.orderDate, startDate, endDate)
      );
    };

    // Current period data (last 30 days)
    const currentBuyerOrders = filterOrdersByDateRange(
      buyerOrders, 
      dateRanges.currentPeriodStart, 
      dateRanges.currentPeriodEnd
    );
    const currentSellerOrders = filterOrdersByDateRange(
      sellerOrders, 
      dateRanges.currentPeriodStart, 
      dateRanges.currentPeriodEnd
    );

    // Previous period data (30-60 days ago)
    const previousBuyerOrders = filterOrdersByDateRange(
      buyerOrders, 
      dateRanges.previousPeriodStart, 
      dateRanges.previousPeriodEnd
    );
    const previousSellerOrders = filterOrdersByDateRange(
      sellerOrders, 
      dateRanges.previousPeriodStart, 
      dateRanges.previousPeriodEnd
    );

    // Calculate current metrics
    let currentRevenue = 0;
    let currentSales = 0;
    let currentPurchases = 0;
    let currentOngoingOrders = 0;
    let currentCompletedOrders = 0;

    // Calculate previous metrics for comparison
    let previousRevenue = 0;
    let previousSales = 0;
    let previousPurchases = 0;
    let previousOngoingOrders = 0;
    let previousCompletedOrders = 0;

    // Current period calculations
    currentBuyerOrders.forEach((order) => {
      if (order.totalCost && typeof order.totalCost === "number") {
        currentPurchases += order.totalCost;
      }
      if (!["COMPLETED", "PICKUP_CONFIRMED", "CANCELLED"].includes(order.status)) {
        currentOngoingOrders++;
      } else if (["COMPLETED", "PICKUP_CONFIRMED"].includes(order.status)) {
        currentCompletedOrders++;
      }
    });

    const currentCompletedSales = currentSellerOrders.filter((order) =>
      ["COMPLETED", "PICKUP_CONFIRMED"].includes(order.status)
    );

    currentCompletedSales.forEach((order) => {
      if (order.totalCost && typeof order.totalCost === "number") {
        currentRevenue += order.totalCost;
        currentSales++;
      }
    });

    // Previous period calculations
    previousBuyerOrders.forEach((order) => {
      if (order.totalCost && typeof order.totalCost === "number") {
        previousPurchases += order.totalCost;
      }
      if (!["COMPLETED", "PICKUP_CONFIRMED", "CANCELLED"].includes(order.status)) {
        previousOngoingOrders++;
      } else if (["COMPLETED", "PICKUP_CONFIRMED"].includes(order.status)) {
        previousCompletedOrders++;
      }
    });

    const previousCompletedSales = previousSellerOrders.filter((order) =>
      ["COMPLETED", "PICKUP_CONFIRMED"].includes(order.status)
    );

    previousCompletedSales.forEach((order) => {
      if (order.totalCost && typeof order.totalCost === "number") {
        previousRevenue += order.totalCost;
        previousSales++;
      }
    });

    // Count products created in previous period for comparison
    const previousProductsCount = products.filter(product => 
      product.createdAt && isDateInRange(
        product.createdAt, 
        dateRanges.previousPeriodStart, 
        dateRanges.previousPeriodEnd
      )
    ).length;

    // Generate weekly data for chart
    const generateWeeklyData = () => {
      const last7Days = getLast7Days();

      return last7Days.map((dayInfo) => {
        const ordersToCheck =
          userRole === "healthcare-facility" ? buyerOrders : sellerOrders;

        const dayOrders = ordersToCheck.filter((order) => {
          if (!order.orderDate) return false;
          const orderDate = new Date(order.orderDate);
          return orderDate.toDateString() === dayInfo.fullDate.toDateString();
        });

        const daySales = dayOrders.reduce(
          (sum, order) => sum + (order.totalCost || 0),
          0
        );

        return {
          day: dayInfo.day,
          sales: daySales,
        };
      });
    };

    // Generate cost breakdown data
    const generateCostBreakdown = () => {
      let drugCost = 0;
      let equipmentCost = 0;

      const ordersToAnalyze =
        userRole === "healthcare-facility" ? buyerOrders : sellerOrders;

      ordersToAnalyze.forEach((order) => {
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach((item) => {
            const isEquipment =
              item.productName?.toLowerCase().includes("equipment") ||
              item.productName?.toLowerCase().includes("device") ||
              item.productName?.toLowerCase().includes("machine");

            if (isEquipment) {
              equipmentCost += item.totalPrice || 0;
            } else {
              drugCost += item.totalPrice || 0;
            }
          });
        }
      });

      return [
        { name: "Drugs", value: drugCost, color: "var(--color-primary)" },
        { name: "Equipment", value: equipmentCost, color: "#A4B0EE" },
      ];
    };

    // Get ongoing orders (not completed)
    const ongoingOrders = [...buyerOrders, ...sellerOrders].filter(
      (order) =>
        !["COMPLETED", "PICKUP_CONFIRMED", "CANCELLED"].includes(order.status)
    );

    // Get recent completed transactions
    const recentTransactions = [...buyerOrders, ...sellerOrders]
      .filter((order) =>
        ["COMPLETED", "PICKUP_CONFIRMED"].includes(order.status)
      )
      .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));

    return {
      // Current metrics
      totalRevenue: userRole === "healthcare-facility" ? currentPurchases : currentRevenue,
      totalSales: currentSales,
      totalPurchases: currentPurchases,
      totalProducts: products.length,
      ongoingOrders: currentOngoingOrders,
      completedOrders: currentCompletedOrders,
      
      // Previous metrics for comparison
      previousRevenue: userRole === "healthcare-facility" ? previousPurchases : previousRevenue,
      previousSales,
      previousPurchases,
      previousProducts: previousProductsCount,
      previousOngoingOrders,
      previousCompletedOrders,
      
      // Chart data
      weeklyData: generateWeeklyData(),
      costBreakdown: generateCostBreakdown(),
      
      // Full lists for components
      ongoingOrdersList: ongoingOrders,
      recentTransactions,
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
        <div className="text-lg">Loading dashboard...</div>
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

  if (!dashboardData || !userRole) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">No data available</div>
      </div>
    );
  }

  // Get metrics based on user role with dynamic calculations
  const getMetricsForRole = () => {
    switch (userRole) {
      case "importer":
        return [
          {
            title: "Total Products",
            subtitle: "Products",
            value: dashboardData.totalProducts.toString(),
            previousValue: dashboardData.previousProducts.toString(),
            percentageChange: calculatePercentageChange(
              dashboardData.totalProducts, 
              dashboardData.previousProducts
            ),
            icon: "property",
          },
          {
            title: "Number of Sales",
            subtitle: "Transactions",
            value: dashboardData.totalSales.toString(),
            previousValue: dashboardData.previousSales.toString(),
            percentageChange: calculatePercentageChange(
              dashboardData.totalSales, 
              dashboardData.previousSales
            ),
            icon: "sales",
          },
          {
            title: "Total Sales",
            subtitle: "Revenue",
            value: `${(dashboardData.totalRevenue / 1000).toFixed(0)}k`,
            previousValue: `${(dashboardData.previousRevenue / 1000).toFixed(0)}k`,
            percentageChange: calculatePercentageChange(
              dashboardData.totalRevenue, 
              dashboardData.previousRevenue
            ),
            icon: "money",
            currency: true,
          },
        ];
      case "supplier":
        return [
          {
            title: "Total Products",
            subtitle: "Products",
            value: dashboardData.totalProducts.toString(),
            previousValue: dashboardData.previousProducts.toString(),
            percentageChange: calculatePercentageChange(
              dashboardData.totalProducts, 
              dashboardData.previousProducts
            ),
            icon: "property",
          },
          {
            title: "Total Sales",
            subtitle: "Revenue",
            value: `${(dashboardData.totalRevenue / 1000).toFixed(0)}k`,
            previousValue: `${(dashboardData.previousRevenue / 1000).toFixed(0)}k`,
            percentageChange: calculatePercentageChange(
              dashboardData.totalRevenue, 
              dashboardData.previousRevenue
            ),
            icon: "money",
            currency: true,
          },
          {
            title: "Total Purchases",
            subtitle: "Expenses",
            value: `${(dashboardData.totalPurchases / 1000).toFixed(0)}k`,
            previousValue: `${(dashboardData.previousPurchases / 1000).toFixed(0)}k`,
            percentageChange: calculatePercentageChange(
              dashboardData.totalPurchases, 
              dashboardData.previousPurchases
            ),
            icon: "sales",
          },
        ];
      case "healthcare-facility":
        return [
          {
            title: "Total Purchases",
            subtitle: "Expenses",
            value: `${(dashboardData.totalRevenue / 1000).toFixed(0)}k`,
            previousValue: `${(dashboardData.previousRevenue / 1000).toFixed(0)}k`,
            percentageChange: calculatePercentageChange(
              dashboardData.totalRevenue, 
              dashboardData.previousRevenue
            ),
            icon: "money",
            currency: true,
          },
          {
            title: "Ongoing Orders",
            subtitle: "Orders",
            value: dashboardData.ongoingOrders.toString(),
            previousValue: dashboardData.previousOngoingOrders.toString(),
            percentageChange: calculatePercentageChange(
              dashboardData.ongoingOrders, 
              dashboardData.previousOngoingOrders
            ),
            icon: "sales",
          },
          {
            title: "Completed Orders",
            subtitle: "Transactions",
            value: dashboardData.completedOrders.toString(),
            previousValue: dashboardData.previousCompletedOrders.toString(),
            percentageChange: calculatePercentageChange(
              dashboardData.completedOrders, 
              dashboardData.previousCompletedOrders
            ),
            icon: "property",
          },
        ];
      default:
        return [];
    }
  };

  const metrics = getMetricsForRole();

  return (
    <div className="flex flex-col gap-2">
      {/* Metric Cards */}
      <div className="flex gap-4">
        {metrics.map((metric, index) => (
          <MetricCard
            key={index}
            title={metric.title}
            subtitle={metric.subtitle}
            value={metric.value}
            previousValue={metric.previousValue}
            percentageChange={metric.percentageChange}
            icon={metric.icon}
            currency={metric.currency}
          />
        ))}
      </div>

      {/* Charts */}
      <div className="flex flex-row gap-5">
        <div className="w-3/5">
          <WeeklySalesChart
            weeklyData={dashboardData.weeklyData}
            userRole={userRole}
          />
        </div>
        <div className="w-2/5">
          <CostBreakdownChart costData={dashboardData.costBreakdown} />
        </div>
      </div>

      {/* Orders and Transactions */}
      <div className="w-full flex gap-5">
        <div className="w-full">
          <DynamicMinTransactionCard
            transactions={dashboardData.recentTransactions}
            onSeeAll={() => {
              window.location.href = `/medical-supplies/${userRole}/transaction`;
            }}
          />
        </div>
        <div className="w-10/12">
          <DynamicMinOrderCard
            orders={dashboardData.ongoingOrdersList}
            userRole={userRole}
          />
        </div>
      </div>
    </div>
  );
}