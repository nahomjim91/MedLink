"use client";
import {
  MetricCard,
  MinOrderCard,
  MinTransactionCard,
} from "../components/ui/Cards";
import { useState } from "react";
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
import { Calendar, ChevronDown } from "lucide-react";

// Sample data for the weekly sales chart
const weeklyData = [
  { day: "Mon", sales: 3000 },
  { day: "Tue", sales: 3200 },
  { day: "Wed", sales: 3150 },
  { day: "Thu", sales: 3900 },
  { day: "Fri", sales: 3180 },
  { day: "Sat", sales: 3220 },
  { day: "Sun", sales: 3150 },
];

// Sample data for the cost breakdown chart
const costData = [
  { name: "Drugs", value: 3500, color: "var(--color-primary)" },
  { name: "Equipments", value: 1250, color: "#A4B0EE" },
];

// Custom tooltip for the bar chart
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-secondary/80 text-white p-2 rounded shadow-lg text-xs">
        <p>${payload[0].value}</p>
        <p className="text-gray-300">{payload[0].payload.day}</p>
      </div>
    );
  }
  return null;
};

// Weekly Sales Bar Chart Component
const WeeklySalesChart = () => {
  const [periodType, setPeriodType] = useState("Weekday");
  const [selectedDay, setSelectedDay] = useState("Thu");

  return (
    <div className="relative bg-white rounded-lg px-6 py-1.5 shadow-sm h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-secondary/80">
          Report Sales
        </h2>

        {/* Period selector */}
        <div className="relative">
          <button className="flex items-center gap-2 py-2 px-4 bg-gray-100 rounded-lg text-sm">
            <Calendar className="w-4 h-4" />
            <span>{periodType}</span>
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bar Chart */}
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
              domain={[0, 4000]}
              ticks={[0, 2000, 3000, 4000]}
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

      {/* Selected day info
      {selectedDay && (
        <div className="absolute top-24 left-72 bg-gray-800 text-white p-2 rounded shadow-lg text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-white"></div>
            <p>London</p>
          </div>
          <p className="text-gray-300 mt-1">Thu, Jul</p>
        </div>
      )} */}
    </div>
  );
};

// Cost Breakdown Donut Chart Component
const CostBreakdownChart = () => {
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

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-semibold">
              ${totalCost.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Legend - horizontal layout matching your image */}
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
function DashboardCharts() {
  return (
    <div className="flex flex-row gap-5">
      <div className="w-3/5">
        <WeeklySalesChart />
      </div>
      <div className="w-2/5">
        <CostBreakdownChart />
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-4">
        <MetricCard
          title="Total Property"
          subtitle="Properties"
          value="1,500"
          previousValue="1,050"
          percentageChange={20}
          icon="property"
        />

        <MetricCard
          title="Number of Sales"
          subtitle="Transactions"
          value="320"
          previousValue="950"
          percentageChange={-20}
          icon="sales"
        />

        <MetricCard
          title="Total Sales"
          subtitle="Revenue"
          value="150k"
          previousValue="1,500"
          percentageChange={20}
          icon="money"
          currency={true}
        />
      </div>
      <DashboardCharts />
      <div className="w-full flex  gap-5">
        <div className="w-full">
          <MinTransactionCard />
        </div>
        <div className="w-10/12">
          <MinOrderCard />
        </div>
      </div>
    </div>
  );
}
