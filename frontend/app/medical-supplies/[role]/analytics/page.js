"use client";
import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Calendar } from "lucide-react";
import { MinTableCard } from "../../components/ui/Cards";

// Sample data mimicking the chart in the image
const monthlyData = [
  { month: "Sep", revenue: 22000, profit: 38000 },
  { month: "Oct", revenue: 35000, profit: 32000 },
  { month: "Nov", revenue: 26000, profit: 40000 },
  { month: "Dec", revenue: 54000, profit: 58000 },
  { month: "Jan", revenue: 52000, profit: 61000 },
  { month: "Feb", revenue: 63000, profit: 50000 },
  { month: "Mar", revenue: 40000, profit: 44000 },
];

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    // Find the highlighted data point (November in the image)
    const isHighlighted = label === "Nov";

    return (
      <div className="bg-white p-3 rounded-lg shadow-md border border-gray-100">
        <p className="text-xs text-secondary/40 mb-1">This Month</p>
        <p className="text-lg font-bold text-primary">
          {isHighlighted ? "220,342,123" : payload[0].value.toLocaleString()}
        </p>
        <p className="text-xs text-secondary/40">{label}</p>
      </div>
    );
  }
  return null;
};

function ProfitRevenueChart() {
  const [periodType, setPeriodType] = useState("Weekly");

  return (
    <div className="bg-white rounded-lg shadow-sm px-6 py-2 h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-secondary/70">
          Profit & Revenue
        </h2>

        {/* Period selector button */}
        <button className="flex items-center gap-2 py-1 px-3 rounded-lg text-sm border border-primary">
          <Calendar className="w-4 h-4" />
          <span>{periodType}</span>
        </button>
      </div>

      {/* Chart container */}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={monthlyData}
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
              domain={[0, 80000]}
              ticks={[0, 20000, 40000, 60000, 80000]}
              tickFormatter={(value) =>
                value.toLocaleString(undefined, { maximumFractionDigits: 0 })
              }
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Add a vertical reference line for November */}
            <CartesianGrid
              vertical={true}
              horizontal={false}
              verticalPoints={[
                monthlyData.findIndex((d) => d.month === "Nov") + 0.5,
              ]}
              stroke="#ddd"
              strokeDasharray="5 5"
              opacity={0.5}
            />

            {/* Revenue line */}
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

            {/* Profit line */}
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

      {/* Legend */}
      <div className="flex items-center justify-center gap-8 ">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary"></div>
          <span className="text-sm text-secondary/60">Revenue</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-200"></div>
          <span className="text-sm text-secondary/60">Profit</span>
        </div>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const stats1 = [
    { "Total Profit": 100.0 },
    { "Total Sales": 200.0 },
    { Revenue: 300.0 },
  ];
  const stats2 = [
    { "Net Purchases": 100.0 },
    { "Net Sales": 200.0 },
    { "MOM Profit": 300.0 },
    { "YOY Profit": 300.0 },
  ];
  const productsColumns = [
    { key: "name", label: "Products" },
    { key: "id", label: "Product Id" },
    { key: "category", label: "Category" },
    { key: "stockLevel", label: "Stock Level" },
    { key: "closestExpiry", label: "Closest Expiry" },
    { key: "increase", label: "Increase By" },
  ];

  const productsData = [
    {
      id: 1,
      name: "Paracetamol",
      category: "Pain Killer",
      stockLevel: "12 Packets",
      increase: "5",
      closestExpiry: "11/12/22",
    },
    {
      id: 2,
      name: "Ibuprofen",
      category: "Pain Killer",
      stockLevel: "10 Packets",
      increase: "3",
      closestExpiry: "11/12/22",
    },
    {
      id: 3,
      name: "Amoxicillin",
      category: "Antibiotic",
      stockLevel: "8 Packets",
      increase: "2",
      closestExpiry: "11/12/22",
    },
    {
      id: 4,
      name: "Aspirin",
      category: "Pain Killer",
      stockLevel: "15 Packets",
      increase: "7",
      closestExpiry: "11/12/22",
    },
   
  ];
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <div className="w-full flex flex-row bg-white rounded-lg p-4 shadow-md justify-around">
          {stats1.map((stat, index) => (
            <div key={index} className="flex flex-col items-center">
              <span className="text-xl font-medium text-secondary">
                ${Object.values(stat)}
              </span>
              <span className="text-base font-semibold text-secondary/50">
                {Object.keys(stat)}
              </span>
            </div>
          ))}
        </div>
        <div className="w-full flex flex-row bg-white rounded-lg p-4 shadow-md justify-around">
          {stats2.map((stat, index) => (
            <div key={index} className="flex flex-col items-center">
              <span className="text-xl font-medium text-secondary">
                ${Object.values(stat)}
              </span>
              <span className="text-base font-semibold text-secondary/50">
                {Object.keys(stat)}
              </span>
            </div>
          ))}
        </div>
      </div>
      <ProfitRevenueChart />
      <MinTableCard title="Best Selling Products" data={productsData} columns={productsColumns} />
     
    </div>
  );
}
