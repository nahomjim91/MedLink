// Helper function to get days from timeRange (needed for daily average calculation)
"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Calendar,
  Clock,
  Users,
  TrendingUp,
  DollarSign,
  Activity,
  Target,
  Star,
  Filter,
  Download,
  BarChart3,
  PieChart,
  TrendingDown,
  ArrowUp,
  ArrowDown,
  Wallet,
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Cell,
  Legend,
  Pie,
} from "recharts";
import { useQuery } from "@apollo/client";
import { GET_MY_AVAILABILITY_SLOTS } from "../../api/graphql/doctor/availabilitySlotQueries";
import { GET_MY_TRANSACTIONS } from "../../api/graphql/transaction/transactionQueries";
import { GET_MY_APPOINTMENTS } from "../../api/graphql/appointment/appointmentQueries";

const getDaysFromTimeRange = (range) => {
  switch (range) {
    case "7d":
      return 7;
    case "30d":
      return 30;
    case "90d":
      return 90;
    case "1y":
      return 365;
    default:
      return 7;
  }
};
export default function DoctorAnalyticsPage() {
  const [timeRange, setTimeRange] = useState("7d");
  const [selectedMetric, setSelectedMetric] = useState("appointments");

  // GraphQL queries
  const { data: slotsData, loading: slotsLoading } = useQuery(
    GET_MY_AVAILABILITY_SLOTS
  );
  const { data: transactionsData, loading: transactionsLoading } = useQuery(
    GET_MY_TRANSACTIONS,
    {
      variables: { limit: 100, offset: 0 },
    }
  );
  const { data: appointmentsData, loading: appointmentsLoading } = useQuery(
    GET_MY_APPOINTMENTS,
    {
      variables: { limit: 100, offset: 0 },
    }
  );

  // Export functionality
  const exportData = () => {
    if (!analyticsData) return;

    const csvData = [
      ["Metric", "Value"],
      ["Total Patients", analyticsData.overview.totalPatients],
      ["Total Appointments", analyticsData.overview.totalAppointments],
      ["Completed Appointments", analyticsData.overview.completedAppointments],
      ["Total Revenue (Birr)", analyticsData.overview.monthlyRevenue],
      ["Completion Rate (%)", analyticsData.overview.completionRate],
      ["Available Slots", analyticsData.overview.availableSlots],
      ["Booked Slots", analyticsData.overview.bookedSlots],
      [""],
      ["Daily Appointments Data:"],
      ["Date", "Total", "Completed", "Cancelled"],
      ...analyticsData.chartData.appointments.map((day) => [
        day.date,
        day.value,
        day.completed,
        day.cancelled,
      ]),
      [""],
      ["Monthly Revenue Data:"],
      ["Month", "Revenue (Birr)"],
      ...analyticsData.chartData.revenue.map((month) => [
        month.month,
        month.value,
      ]),
    ];

    const csvContent = csvData.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `doctor-analytics-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  // Process data for analytics with dynamic time filtering
  const analyticsData = useMemo(() => {
    if (
      !appointmentsData?.myAppointments ||
      !transactionsData?.myTransactions ||
      !slotsData?.myAvailabilitySlots
    ) {
      return null;
    }

    const appointments = appointmentsData.myAppointments;
    const transactions = transactionsData.myTransactions;
    const slots = slotsData.myAvailabilitySlots;
    // console.log("slots", slots);

    // Get date range based on timeRange selection
    const now = new Date();
    const getDaysFromTimeRange = (range) => {
      switch (range) {
        case "7d":
          return 7;
        case "30d":
          return 30;
        case "90d":
          return 90;
        case "1y":
          return 365;
        default:
          return 7;
      }
    };

    const days = getDaysFromTimeRange(timeRange);
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);

    // Filter data based on selected time range
    const filteredAppointments = appointments.filter((apt) => {
      const aptDate = new Date(apt.scheduledStartTime);
      return aptDate >= startDate && aptDate <= now;
    });

    const filteredTransactions = transactions.filter((t) => {
      const tDate = new Date(t.createdAt);
      return tDate >= startDate && tDate <= now;
    });

    // Calculate overview stats from filtered data
    const totalPatients = new Set(
      filteredAppointments.map((apt) => apt.patientId)
    ).size;
    const totalAppointments = filteredAppointments.length;
    const completedAppointments = filteredAppointments.filter(
      (apt) => apt.status === "COMPLETED"
    ).length;
    const totalRevenue = filteredTransactions
      .filter((t) => t.type === "EARNING" && t.status === "COMPLETED")
      .reduce((sum, t) => sum + t.amount, 0);
    const completionRate =
      totalAppointments > 0
        ? (completedAppointments / totalAppointments) * 100
        : 0;

    // Calculate time-based data for charts
    const getDateRange = (days) => {
      const dates = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        dates.push(date);
      }
      return dates;
    };

    // Adjust chart granularity based on time range
    let chartDays =
      timeRange === "7d"
        ? 7
        : timeRange === "30d"
        ? 30
        : timeRange === "90d"
        ? 12
        : 12;
    let chartData;

    if (timeRange === "7d" || timeRange === "30d") {
      // Daily data for 7d and 30d
      const dateRange = getDateRange(chartDays);
      chartData = dateRange.map((date) => {
        const dateStr = date.toISOString().split("T")[0];
        const dayAppointments = filteredAppointments.filter((apt) => {
          const aptDate = new Date(apt.scheduledStartTime)
            .toISOString()
            .split("T")[0];
          return aptDate === dateStr;
        });

        return {
          date: date.toLocaleDateString("en-US", {
            weekday: timeRange === "7d" ? "short" : undefined,
            month: timeRange === "30d" ? "short" : undefined,
            day: "numeric",
          }),
          value: dayAppointments.length,
          completed: dayAppointments.filter((apt) => apt.status === "COMPLETED")
            .length,
          cancelled: dayAppointments.filter((apt) =>
            ["CANCELLED_PATIENT", "CANCELLED_DOCTOR", "NO_SHOW"].includes(
              apt.status
            )
          ).length,
        };
      });
    } else {
      // Weekly/Monthly data for 90d and 1y
      const periods = [];
      const isYearly = timeRange === "1y";

      for (let i = chartDays - 1; i >= 0; i--) {
        const date = new Date(now);
        if (isYearly) {
          date.setMonth(date.getMonth() - i);
        } else {
          date.setDate(date.getDate() - i * 7); // Weekly for 90d
        }
        periods.push(date);
      }

      chartData = periods.map((date) => {
        let periodStart, periodEnd, label;

        if (isYearly) {
          periodStart = new Date(date.getFullYear(), date.getMonth(), 1);
          periodEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
          label = date.toLocaleDateString("en-US", { month: "short" });
        } else {
          periodStart = new Date(date);
          periodEnd = new Date(date);
          periodEnd.setDate(periodEnd.getDate() + 6);
          label = `${date.getDate()}/${date.getMonth() + 1}`;
        }

        const periodAppointments = filteredAppointments.filter((apt) => {
          const aptDate = new Date(apt.scheduledStartTime);
          return aptDate >= periodStart && aptDate <= periodEnd;
        });

        return {
          date: label,
          value: periodAppointments.length,
          completed: periodAppointments.filter(
            (apt) => apt.status === "COMPLETED"
          ).length,
          cancelled: periodAppointments.filter((apt) =>
            ["CANCELLED_PATIENT", "CANCELLED_DOCTOR", "NO_SHOW"].includes(
              apt.status
            )
          ).length,
        };
      });
    }

    // Revenue by period (adjust based on time range)
    let revenuePeriods;
    if (timeRange === "1y") {
      // Monthly data for yearly view
      revenuePeriods = [];
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - i);
        revenuePeriods.push(date);
      }
    } else {
      // Weekly data for shorter periods
      revenuePeriods = [];
      const weeks = timeRange === "90d" ? 12 : 6;
      for (let i = weeks - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i * 7);
        revenuePeriods.push(date);
      }
    }

    const revenueByPeriod = revenuePeriods.map((date) => {
      let periodStart, periodEnd, label;

      if (timeRange === "1y") {
        periodStart = new Date(date.getFullYear(), date.getMonth(), 1);
        periodEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        label = date.toLocaleDateString("en-US", { month: "short" });
      } else {
        periodStart = new Date(date);
        periodEnd = new Date(date);
        periodEnd.setDate(periodEnd.getDate() + 6);
        label = `${date.getDate()}/${date.getMonth() + 1}`;
      }

      const periodTransactions = filteredTransactions.filter((t) => {
        const tDate = new Date(t.createdAt);
        return (
          tDate >= periodStart &&
          tDate <= periodEnd &&
          t.type === "EARNING" &&
          t.status === "COMPLETED"
        );
      });

      return {
        month: label,
        value: periodTransactions.reduce((sum, t) => sum + t.amount, 0),
      };
    });

    // Appointment types distribution (from filtered data)
    const appointmentTypes = {};
    filteredAppointments.forEach((apt) => {
      const reason = apt.reasonNote || "General Consultation";
      const type = reason.toLowerCase().includes("follow")
        ? "Follow-up"
        : reason.toLowerCase().includes("emergency")
        ? "Emergency"
        : reason.toLowerCase().includes("new")
        ? "New Patient"
        : "Consultation";
      appointmentTypes[type] = (appointmentTypes[type] || 0) + 1;
    });

    const patientTypes = Object.entries(appointmentTypes).map(
      ([name, value], index) => ({
        name,
        value,
        color: ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"][index % 4],
      })
    );

    // Time slots analysis (from filtered data)
    const timeSlotBookings = {};
    filteredAppointments.forEach((apt) => {
      const hour = new Date(apt.scheduledStartTime).getHours();
      let timeSlot;

      // Format time slots properly
      if (hour === 0) {
        timeSlot = "12:00 AM - 1:00 AM";
      } else if (hour < 12) {
        timeSlot = `${hour}:00 AM - ${hour + 1}:00 AM`;
      } else if (hour === 12) {
        timeSlot = "12:00 PM - 1:00 PM";
      } else {
        const displayHour = hour - 12;
        timeSlot = `${displayHour}:00 PM - ${displayHour + 1}:00 PM`;
      }

      timeSlotBookings[timeSlot] = (timeSlotBookings[timeSlot] || 0) + 1;
    });

    // Create time slots array with proper sorting
    const timeSlots = Object.entries(timeSlotBookings)
      .map(([time, bookings]) => ({
        time,
        bookings,
        sortKey:
          parseInt(time.split(":")[0]) +
          (time.includes("PM") && !time.includes("12:00 PM") ? 12 : 0),
      }))
      .sort((a, b) => a.sortKey - b.sortKey)
      .map(({ time, bookings }) => ({ time, bookings }));

    // If no appointments exist, create dummy data for demonstration
    if (timeSlots.length === 0) {
      timeSlots.push(
        { time: "9:00 AM - 10:00 AM", bookings: 0 },
        { time: "10:00 AM - 11:00 AM", bookings: 0 },
        { time: "11:00 AM - 12:00 PM", bookings: 0 },
        { time: "2:00 PM - 3:00 PM", bookings: 0 },
        { time: "3:00 PM - 4:00 PM", bookings: 0 }
      );
    }

    // Calculate trends (comparing current period with previous period)
    const periodDays = getDaysFromTimeRange(timeRange);
    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - periodDays);

    const currentPeriodAppointments = filteredAppointments.length;
    const previousPeriodAppointments = appointments.filter((apt) => {
      const aptDate = new Date(apt.scheduledStartTime);
      return aptDate >= previousStartDate && aptDate < startDate;
    }).length;

    const appointmentTrend =
      previousPeriodAppointments > 0
        ? ((currentPeriodAppointments - previousPeriodAppointments) /
            previousPeriodAppointments) *
          100
        : currentPeriodAppointments > 0
        ? 100
        : 0;

    return {
      overview: {
        totalPatients,
        totalAppointments,
        completedAppointments,
        monthlyRevenue: totalRevenue,
        completionRate: Math.round(completionRate),
        totalSlots: slots.length,
        bookedSlots: slots.filter((slot) => slot.isBooked).length,
        availableSlots: slots.filter(
          (slot) => !slot.isBooked && slot.endTime > Date.now()
        ).length,
      },
      trends: {
        appointments: Math.round(appointmentTrend * 10) / 10,
        revenue: 15.7, // Calculate based on your needs
        patients: 12.5, // Calculate based on your needs
      },
      chartData: {
        appointments: chartData,
        revenue: revenueByPeriod,
        patientTypes,
        timeSlots,
      },
    };
  }, [appointmentsData, transactionsData, slotsData, timeRange]);
  console.log("analyticsData", analyticsData);
  const StatCard = ({
    title,
    value,
    icon: Icon,
    trend,
    color,
    suffix = "",
    loading = false,
  }) => (
    <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-3 ${color} rounded-full`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend !== undefined && !loading && (
          <div
            className={`flex items-center gap-1 text-sm font-medium ${
              trend > 0
                ? "text-green-600"
                : trend < 0
                ? "text-red-600"
                : "text-gray-600"
            }`}
          >
            {trend > 0 ? (
              <ArrowUp className="w-4 h-4" />
            ) : trend < 0 ? (
              <ArrowDown className="w-4 h-4" />
            ) : null}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div>
        <p className="text-sm text-gray-500 mb-1">{title}</p>
        {loading ? (
          <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        ) : (
          <p className="text-2xl font-bold text-gray-800">
            {typeof value === "number" && suffix === " Birr"
              ? value.toFixed(2)
              : value}
            {suffix}
          </p>
        )}
      </div>
    </div>
  );

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-800">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.dataKey}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const isLoading = slotsLoading || transactionsLoading || appointmentsLoading;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 w-full p-4 bg-gray-50 min-h-screen">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-96"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white p-6 rounded-2xl shadow-lg animate-pulse"
            >
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="flex flex-col gap-6 w-full p-4 bg-gray-50 min-h-screen">
        <div className="text-center py-8">
          <p className="text-gray-500">No data available for analytics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 w-full ">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex  justify-end w-full flex-row gap-3 py-1 ">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 3 months</option>
            <option value="1y">Last year</option>
          </select>

          <button
            onClick={exportData}
            className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Overview Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Total Patients"
          value={analyticsData.overview.totalPatients}
          icon={Users}
          trend={analyticsData.trends.patients}
          color="bg-teal-500"
        />

        <StatCard
          title="Total Appointments"
          value={analyticsData.overview.totalAppointments}
          icon={Calendar}
          trend={analyticsData.trends.appointments}
          color="bg-blue-500"
        />

        <StatCard
          title="Total Revenue"
          value={analyticsData.overview.monthlyRevenue}
          icon={DollarSign}
          trend={analyticsData.trends.revenue}
          color="bg-purple-500"
          suffix=" Birr"
        />

        <StatCard
          title="Completion Rate"
          value={analyticsData.overview.completionRate}
          icon={Target}
          color="bg-green-500"
          suffix="%"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard
          title="Available Slots"
          value={analyticsData.overview.availableSlots}
          icon={Clock}
          color="bg-orange-500"
        />

        <StatCard
          title="Booked Slots"
          value={analyticsData.overview.bookedSlots}
          icon={Activity}
          color="bg-indigo-500"
        />

        <StatCard
          title="Completed Sessions"
          value={analyticsData.overview.completedAppointments}
          icon={Star}
          color="bg-pink-500"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        {/* Appointments Trend */}
        <div className="bg-white p-6 rounded-2xl shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-800">
              Appointments Trend
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedMetric("appointments")}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  selectedMetric === "appointments"
                    ? "bg-teal-100 text-teal-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Appointments
              </button>
              <button
                onClick={() => setSelectedMetric("revenue")}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  selectedMetric === "revenue"
                    ? "bg-teal-100 text-teal-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Revenue
              </button>
            </div>
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              {selectedMetric === "appointments" ? (
                <AreaChart data={analyticsData.chartData.appointments}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" stroke="#666" fontSize={12} />
                  <YAxis stroke="#666" fontSize={12} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stackId="1"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.3}
                  />
                  <Area
                    type="monotone"
                    dataKey="completed"
                    stackId="2"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              ) : (
                <LineChart data={analyticsData.chartData.revenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#666" fontSize={12} />
                  <YAxis stroke="#666" fontSize={12} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    dot={{ fill: "#8b5cf6", strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Time Slots Analysis */}
        <div className="bg-white p-6 rounded-2xl shadow-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">
            Popular Time Slots ({timeRange})
          </h3>
          {analyticsData.chartData.timeSlots.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={analyticsData.chartData.timeSlots}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="time"
                    stroke="#666"
                    fontSize={11}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis stroke="#666" fontSize={12} />
                  <Tooltip
                    formatter={(value) => [value, "Bookings"]}
                    labelFormatter={(label) => `Time: ${label}`}
                  />
                  <Bar
                    dataKey="bookings"
                    fill="#14b8a6"
                    radius={[4, 4, 0, 0]}
                    minPointSize={2}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Clock className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No appointment data available</p>
                <p className="text-sm">for the selected time period</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity Summary */}
      <div className="bg-white p-6 rounded-2xl shadow-lg mb-3">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Performance Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-gradient-to-r from-teal-50 to-teal-100 rounded-xl">
            <h4 className="text-sm font-medium text-teal-600 mb-2">
              This Week
            </h4>
            <p className="text-2xl font-bold text-teal-700">
              {analyticsData.chartData.appointments.reduce(
                (sum, day) => sum + day.value,
                0
              )}
            </p>
            <p className="text-sm text-teal-600">Appointments</p>
          </div>

          <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl">
            <h4 className="text-sm font-medium text-blue-600 mb-2">
              Success Rate
            </h4>
            <p className="text-2xl font-bold text-blue-700">
              {analyticsData.overview.completionRate}%
            </p>
            <p className="text-sm text-blue-600">Completion</p>
          </div>

          <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl">
            <h4 className="text-sm font-medium text-purple-600 mb-2">
              Avg per Day
            </h4>
            <p className="text-2xl font-bold text-purple-700">
              {Math.round(analyticsData.overview.totalAppointments / 7)}
            </p>
            <p className="text-sm text-purple-600">Appointments</p>
          </div>
        </div>
      </div>
    </div>
  );
}
