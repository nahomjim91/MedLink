import {
  BriefcaseMedical,
  DollarSign,
  Hash,
  Home,
  CircleUser,
  Pill,
  Syringe,
  ChevronDown,
  ChevronUp,
  Download,
  Filter,
  Plus,
} from "lucide-react";
import Image from "next/image";
import React, { useState } from "react";
import { Button, TablePageButtons } from "./Button";

// Define types for our props
export const MetricCard = ({
  title,
  subtitle,
  value,
  previousValue,
  percentageChange,
  icon = "property",
  currency = false,
}) => {
  // Helper function to determine percentage color
  const getPercentageColor = (change) => {
    if (change > 0) return "text-primary";
    if (change < 0) return "text-red-500";
    return "text-secondary/50";
  };

  // Helper function to add plus sign for positive numbers
  const formatPercentage = (percent) => {
    if (percent > 0) return `+${percent}%`;
    if (percent < 0) return `${percent}%`;
    return "0%";
  };

  // Helper function to format the icon
  const getIcon = () => {
    switch (icon) {
      case "property":
        return <Home className="w-5 h-5 text-primary/60" />;
      case "sales":
        return <Hash className="w-5 h-5 text-gray-600" />;
      case "money":
        return <DollarSign className="w-5 h-5 text-yellow-600" />;
      default:
        return <Home className="w-5 h-5 text-green-600" />;
    }
  };

  // Format value with currency symbol if needed
  const formattedValue = currency ? `$${value}` : value;

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm w-full">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          {/* Icon in circle */}
          <div
            className={`w-10 h-10 rounded-full ${
              icon === "property"
                ? "bg-green-100"
                : icon === "sales"
                ? "bg-gray-100"
                : "bg-yellow-100"
            } flex items-center justify-center`}
          >
            {getIcon()}
          </div>

          {/* Title and subtitle */}
          <div>
            <h3 className="font-medium text-secondary/80">{title}</h3>
            <p className="text-secondary/60 text-sm">{subtitle}</p>
          </div>
        </div>
      </div>

      {/* Value and change */}
      <div className="flex items-end gap-3">
        <span className="text-2xl font-bold text-secondary/90">
          {formattedValue}
        </span>

        <div className="flex items-center gap-2 mb-1">
          <span
            className={`text-sm font-medium ${getPercentageColor(
              percentageChange
            )}`}
          >
            {formatPercentage(percentageChange)}
          </span>

          <span className="text-sm text-secondary/50">
            Last month total {previousValue}
          </span>
        </div>
      </div>
    </div>
  );
};

export const MinOrderCard = ({ onSeeAll }) => {
  const [orders, setOrders] = useState([
    {
      id: "Order-#123",
      date: "2025-04-12",
      supplier: "ABC Supplier",
      status: "active",
      type: "drug",
    },
    {
      id: "Order-#123",
      date: "2025-04-12",
      supplier: "Albert Supplier",
      status: "active",
      type: "equipment",
    },
    {
      id: "Order-#123",
      date: "2025-04-12",
      supplier: "Robert Supplier",
      status: "pending",
      type: "both",
    },
  ]);

  const OrderItem = ({ order }) => (
    <div className="flex items-center justify-between py-4 border-b border-gray-200 last:border-b-0">
      <div className="flex items-center">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 bg-secondary/10`}
        >
          {order.type === "drug" ? (
            <Pill className="text-primary" />
          ) : order.type === "equipment" ? (
            <Syringe className="text-primary" />
          ) : (
            <BriefcaseMedical className="text-primary" />
          )}
        </div>
        <div>
          <p className="font-medium text-secondary/90">{order.id}</p>
          <p className="text-xs text-secondary/60">{order.date}</p>
        </div>
      </div>
      <div className="flex items-center">
        <div className="mr-3 text-right">
          <p className="font-medium text-secondary/80">{order.supplier}</p>
        </div>
        <div className="w-10 h-10 rounded-full overflow-hidden">
          <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary text-xl font-bold">
            {order.supplierProfileUrl ? (
              <Image
                src={order.supplierProfileUrl}
                alt={order.supplier}
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            ) : (
              order.supplier.charAt(0)
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl px-6 py-2 shadow-md w-full">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-semibold text-secondary/80">
          Ongoing Orders
        </h2>
        <button
          onClick={onSeeAll}
          className="text-sm text-secondary/50 hover:text-secondary/70"
        >
          See All
        </button>
      </div>
      <div>
        {orders.map((order, index) => (
          <OrderItem key={index} order={order} />
        ))}
      </div>
    </div>
  );
};
// Card Table Component
export const MinTransactionCard = ({ onSeeAll }) => {
  // Sample data - In a real app, this would come from props or API
  const [transactions, setTransactions] = useState([
    {
      id: "Order-#123",
      status: "Delivered",
      date: "12 Sep 2024, 9:29",
      amount: "$30K",
    },
    {
      id: "Order-#123",
      status: "Delivered",
      date: "12 Sep 2024, 9:29",
      amount: "$30K",
    },
    {
      id: "Order-#123",
      status: "Delivered",
      date: "12 Sep 2024, 9:29",
      amount: "$30K",
    },
  ]);

  // Transaction item component
  const TransactionItem = ({ transaction }) => (
    <div className="flex items-center justify-between py-4 border-b border-gray-100 last:border-b-0">
      <div className="flex items-center">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 bg-secondary/10`}
        >
          <DollarSign className="text-primary" />
        </div>
        <div>
          <p className="font-medium text-secondary/80">
            {transaction.id}{" "}
            <span className="text-secondary/50 font-normal">
              ({transaction.status})
            </span>
          </p>
          <p className="text-xs text-secondary/50">{transaction.date}</p>
        </div>
      </div>
      <div className="text-lg font-semibold text-primary">
        {transaction.amount}
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl px-6 py-2 shadow-md w-full">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-semibold text-secondary/80">
          Recent Transactions
        </h2>
        <button
          onClick={onSeeAll}
          className="text-sm text-secondary/50 hover:text-secondary/70"
        >
          See All
        </button>
      </div>
      <div>
        {transactions.map((transaction, index) => (
          <TransactionItem key={index} transaction={transaction} />
        ))}
      </div>
    </div>
  );
};

export const StatCard = ({
  title,
  metrics = [],
  subtitle = "",
  icon = null,
  className = "",
}) => {
  // Custom styling based on theme

  return (
    <div
      className={`bg-white rounded-xl px-4 py-2 ${className} w-full shadow-md `}
    >
      <div className="flex items-center mb-3">
        <div className={`bg-primary/10 p-2 rounded-full mr-3`}>{icon}</div>

        <h3 className="text-secondary/70 font-bold text-lg">{title}</h3>
      </div>

      <div className="grid grid-cols-2 gap-x-8 gap-y-2 mb-2 ">
        {metrics.map((metric, index) => (
          <div key={index} className="flex flex-col items-center  ">
            <span className="text-2xl font-medium text-secondary/80">
              {metric.value}
            </span>
            {metric.label && (
              <span className="text-sm text-secondary/50">{metric.label}</span>
            )}
          </div>
        ))}
      </div>

      {subtitle && (
        <div className="text-xs text-secondary/50 mt-1">{subtitle}</div>
      )}
    </div>
  );
};

export function TableCard({
  title,
  data,
  columns,
  page = 1,
  totalPages = 10,
  onPageChange,
  onAddItem,
  onFilter,
  onDownload,
  tabs = [], // Array of tab objects: [{id: 'all', label: 'All Products'}, {id: 'active', label: 'Active'}, etc.]
  onTabChange, // Callback when tab changes
  activeTab = 'all', // Default active tab
  tabData = {}, // Data for each tab: {all: [...], active: [...], etc.}
  isLoading = false,
  isClickable = false,
  onClickRow = () => {},
  isAddButton = true,
  isOrderButton = true
}) {
  const [expandedRows, setExpandedRows] = useState({});
  const [currentTab, setCurrentTab] = useState(activeTab);

  // Handle tab change
  const handleTabChange = (tabId) => {
    setCurrentTab(tabId);
    if (onTabChange) {
      onTabChange(tabId);
    }
  };

  // Determine which data to display based on active tab
  const displayData = tabData[currentTab] || data;

  const toggleRowExpand = (index) => {
    setExpandedRows((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase();
    if (
      statusLower?.includes("stock") ||
      statusLower?.includes("ongoing") ||
      statusLower?.includes("delivery")
    ) {
      return statusLower.includes("out") ? "text-red-500" : "text-green-500";
    } else if (statusLower?.includes("cancel")) {
      return "text-red-500";
    } else if (statusLower?.includes("delivered")) {
      return "text-blue-500";
    }
    return "";
  };

  const renderCell = (item, column) => {
    const value = item[column.key];

    if (column.key === "status" || column.key === "availability") {
      const statusClass = getStatusColor(value);
      const isExpandable =
        column.key === "status" &&
        (value?.toLowerCase()?.includes("ongoing") ||
          value?.toLowerCase()?.includes("delivery"));

      return (
        <div className="flex items-center">
          <span className={statusClass}>{value}</span>
          {isExpandable && (
            <button
              className="ml-1 text-gray-500"
              onClick={(e) => {
                e.stopPropagation();
                toggleRowExpand(item.id || item.orderNo);
              }}
            >
              {expandedRows[item.id || item.orderNo] ? (
                <ChevronUp size={16} />
              ) : (
                <ChevronDown size={16} />
              )}
            </button>
          )}
        </div>
      );
    }

    return value;
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-4 pt-2 flex justify-between items-center">
        <h2 className="text-xl font-medium">{title}</h2>
        <div className="flex gap-x-2">
          <Button color="primary" className={`${!isAddButton ? "hidden" : ""}`} onClick={onAddItem}>
            Add Product
          </Button>

          <Button
            variant="outline"
            color="primary"
            onClick={onFilter}
            className="flex gap-3 items-center px-5"
          >
            <Filter size={16} />
            Filter
          </Button>
          <Button
            variant="outline"
            color="primary"
            onClick={onDownload}
            className={`${!isOrderButton ? "hidden" : "flex"}  gap-3 items-center px-5`}
          >
            Order History
          </Button>
        </div>
      </div>

      {/* Tab navigation */}
      {tabs && tabs.length > 0 && (
        <div className="border-b border-gray-200">
          <nav className="flex px-4 -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`py-3 px-4 text-sm font-medium relative ${
                  currentTab === tab.id
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                    currentTab === tab.id
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      )}

      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="text-center py-10">Loading...</div>
        ) : displayData && displayData.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="bg-primary/30">
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className="text-left px-4 py-2 font-medium text-secondary/70 border-b border-gray-200"
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayData.map((item, index) => (
                <React.Fragment key={item.id || item.orderNo || `row-${index}`}>
                  <tr className={index % 2 === 0 ? "bg-white" : "bg-gray-50"} onClick={ isClickable ? () => onClickRow(item) : null}>
                    {columns.map((column) => (
                      <td
                        key={`${item.id || item.orderNo || index}-${column.key}`}
                        className="px-4 py-2 border-b border-gray-200 text-secondary"
                      >
                        {renderCell(item, column)}
                      </td>
                    ))}
                  </tr>
                  {expandedRows[item.id || item.orderNo] && (
                    <tr className="bg-gray-100">
                      <td colSpan={columns.length} className="">
                        <div className="px-2">
                          <p className="font-semibold">Order Details:</p>
                          <p>Order ID: {item.orderNo}</p>
                          <p>Customer: {item.orderBy}</p>
                          <p>Items: {item.items}</p>
                          <div className="mt-2 flex gap-2">
                            <Button color="primary">Update Status</Button>
                            <Button variant="outline" color="primary">
                              View Details{" "}
                            </Button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-10 text-gray-500">
            No data available for this tab
          </div>
        )}
      </div>

      {displayData && displayData.length > 0 && (
        <TablePageButtons
          page={page}
          totalPages={totalPages}
          onPageChange={onPageChange}
          className="px-4 py-2"
        />
      )}
    </div>
  );
}
export function MinTableCard({ title, data, columns, onSeeAll }) {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden ">
      <div className="flex justify-between items-center  px-4 py-2">
        <h2 className="text-lg font-bold text-secondary/80">{title}</h2>
        <button
          onClick={onSeeAll}
          className="text-secondary/50 text-sm hover:text-secondary"
        >
          See All
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="text-left px-4 py-2 font-medium text-secondary/80 bg-primary/40 "
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={item.id || index} className="border-b border-gray-100">
                {columns.map((column) => {
                  let cellContent = item[column.key];
                  let cellClasses = "px-4 py-2 text-gray-700 text-secondary/70";

                  // Special handling for "Increase By" column
                  if (column.key === "increase") {
                    return (
                      <td
                        key={`${item.id || index}-${column.key}`}
                        className={cellClasses}
                      >
                        <span className="text-primary">{cellContent}%</span>
                      </td>
                    );
                  }

                  return (
                    <td
                      key={`${item.id || index}-${column.key}`}
                      className={cellClasses}
                    >
                      {cellContent}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export const OrderStatCard = ({ title, metrics = [], subtitle = "" }) => {
  return (
    <div className={`bg-white rounded-xl px-4 py-2 w-full shadow-md `}>
      <div className="flex items-center mb-3">
        <h3 className="text-secondary/70 font-bold text-lg">{title}</h3>
      </div>

      <div className="flex gap-x-8 justify-around ">
        {metrics.map((metric, index) => (
          <span className="text-xl font-medium text-secondary/80">
            {metric.value}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-1 justify-around">
        <div className="text-sm text-secondary/50">Last 7 days</div>{" "}
        {subtitle && (
          <div className="text-sm text-secondary/50">{subtitle}</div>
        )}
      </div>
    </div>
  );
};
