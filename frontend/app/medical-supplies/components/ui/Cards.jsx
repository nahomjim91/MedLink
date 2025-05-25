import {
  BriefcaseMedical,
  DollarSign,
  Hash,
  Home,
  Pill,
  Syringe,
  ChevronDown,
  ChevronUp,
  Filter,
} from "lucide-react";
import Image from "next/image";
import React, { useState } from "react";
import { Button, TablePageButtons } from "./Button";
import { OrderRowActions } from "./order/OrderRowActions";
import { OrderSelectInput } from "./Input";
import { getAvailableStatusTransitions, getStatusColor } from "../../utils/orderUtils";

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
  activeTab = "all", // Default active tab
  tabData = {}, // Data for each tab: {all: [...], active: [...], etc.}
  isLoading = false,
  isClickable = false,
  onClickRow = () => {},
  isAddButton = true,
  isOrderButton = true,
  isFilterButton = true,
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

  // Helper function to determine user perspective
  const getUserPerspective = (order, userId) => {
    return order.buyerId === userId ? "buyer" : "seller";
  };

  const renderCell = (item, column) => {
    const value = item[column.key];

    if (column.key === "status" || column.key === "availability") {
      const statusClass = getStatusColor(value);
      const isExpandable =
        item.rawOrder &&
        (item.rawOrder.status === "PICKUP_CONFIRMED" ||
          item.rawOrder.status === "PREPARING" ||
          item.rawOrder.status === "READY_FOR_PICKUP");

      return (
        <div className="flex items-center">
          <div
            className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${statusClass}`}
          >
            {value}
          </div>
          {isExpandable && (
            <button
              className="ml-2 text-gray-500 hover:text-gray-700"
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
          <Button
            color="primary"
            className={`${!isAddButton ? "hidden" : ""}`}
            onClick={onAddItem}
          >
            Add Product
          </Button>

          <Button
            variant="outline"
            color="primary"
            onClick={onFilter}
            className={` ${!isFilterButton ? "hidden" : "flex"} gap-3 items-center px-5`}
          >
            <Filter size={16} />
            Filter
          </Button>
          <Button
            variant="outline"
            color="primary"
            onClick={onDownload}
            className={`${
              !isOrderButton ? "hidden" : "flex"
            }  gap-3 items-center px-5`}
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
                    ? "text-primary border-b-2 border-primary"
                    : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span
                    className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                      currentTab === tab.id
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
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
                  <tr
                    className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    onClick={isClickable ? () => onClickRow(item) : null}
                  >
                    {columns.map((column) => (
                      <td
                        key={`${item.id || item.orderNo || index}-${
                          column.key
                        }`}
                        className="px-4 py-2 border-b border-gray-200 text-secondary"
                      >
                        {renderCell(item, column)}
                      </td>
                    ))}
                  </tr>
                  {expandedRows[item.id || item.orderNo] && item.rawOrder && (
                    <tr className="bg-gray-50">
                      <td colSpan={columns.length} className="p-0">
                        <OrderRowActions
                          order={item.rawOrder}
                          userRole={user?.role}
                          userPerspective={getUserPerspective(
                            item.rawOrder,
                            user?.id
                          )}
                          onStatusUpdate={handleStatusUpdate}
                          onSchedulePickup={handleSchedulePickup}
                          onCancelOrder={handleCancelOrder}
                          onViewDetails={(order) => {
                            // Navigate to order details page or open modal
                            console.log(
                              "View details for order:",
                              order.orderId
                            );
                          }}
                        />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-4 py-3 ">
            <Image
              src={`/Image/Empty-amico.svg`} // Assuming you have a 'No data-cuate.svg' for rejected
              alt={`Empty data`}
              width={350}
              height={200}
              className="mx-auto"
            />
            <p className="text-xl text-secondary">No data found</p>
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



export function OrderTableCard({
  title,
  data, // This should be the paginated data from parent
  columns,
  page = 1,
  totalPages = 10,
  itemsPerPage = 9,
  totalItems = 0,
  onPageChange,
  onItemsPerPageChange,
  onAddItem,
  onFilter,
  onDownload,
  tabs = [],
  onTabChange,
  activeTab = "all",
  tabData = {}, // This contains all data for tab counts
  isLoading = false,
  isClickable = false,
  onClickRow = () => {},
  isAddButton = true,
  isOrderButton = true,
  // Order functionality props
  userRole,
  user,
  getUserPerspective,
  onStatusUpdate,
  onSchedulePickup,
  onCancelOrder,
  onViewDetails,
}) {
  const [statusUpdating, setStatusUpdating] = useState({});

  const handleTabChange = (tabId) => {
    if (onTabChange) {
      onTabChange(tabId);
    }
  };

  // Use the paginated data passed from parent, not tabData
  const displayData = data;

  const handleStatusChange = async (order, newStatus) => {
    const orderId = order.orderId || order.id;
    
    if (!newStatus || newStatus === order.status) {
      return;
    }

    setStatusUpdating(prev => ({ ...prev, [orderId]: true }));

    try {
      await onStatusUpdate(orderId, newStatus);
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setStatusUpdating(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const getStatusOptions = (order) => {
    if (!order || !order.rawOrder) return [];

    const userPerspective = getUserPerspective 
      ? getUserPerspective(order.rawOrder)
      : order.rawOrder.buyerId === user?.id ? "buyer" : "seller";

    const transitions = getAvailableStatusTransitions(
      order.rawOrder.status,
      userRole,
      userPerspective
    );

    // Add current status as first option
    const currentStatusOption = {
      value: order.rawOrder.status,
      label: order.status || order.rawOrder.status
    };

    // Add available transitions
    const transitionOptions = transitions.map(transition => ({
      value: transition.value,
      label: transition.label
    }));

    return [currentStatusOption, ...transitionOptions];
  };

  const canUpdateStatus = (order) => {
    if (!order || !order.rawOrder) return false;
    
    const userPerspective = getUserPerspective 
      ? getUserPerspective(order.rawOrder)
      : order.rawOrder.buyerId === user?.id ? "buyer" : "seller";

    const transitions = getAvailableStatusTransitions(
      order.rawOrder.status,
      userRole,
      userPerspective
    );

    return transitions.length > 0;
  };

  const renderCell = (item, column) => {
    const value = item[column.key];

    // Handle status column with dropdown
    if (column.key === "status" && item.rawOrder && canUpdateStatus(item)) {
      const orderId = item.rawOrder.orderId || item.id;
      const statusOptions = getStatusOptions(item);
      const isUpdating = statusUpdating[orderId];

      return (
        <div className="flex items-center gap-2">
          <OrderSelectInput
            name={`status-${orderId}`}
            value={item.rawOrder.status}
            options={statusOptions}
            onChange={(e) => handleStatusChange(item.rawOrder, e.target.value)}
            placeholder="Update Status"
            compact={true}
            inline={true}
            disabled={isUpdating}
            className="min-w-[120px]"
          />
          {isUpdating && (
            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
          )}
        </div>
      );
    }

    // Handle regular status display
    if (column.key === "status" || column.key === "availability") {
      const statusColorClass = getStatusColor(value);
      return (
        <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${statusColorClass}`}>
          {value}
        </div>
      );
    }

    return value;
  };

  const renderRowActions = (item) => {
    if (!item.rawOrder) return null;

    const userPerspective = getUserPerspective 
      ? getUserPerspective(item.rawOrder)
      : item.rawOrder.buyerId === user?.id ? "buyer" : "seller";

    return (
      <div className="flex items-center gap-1">
        {/* Schedule Pickup Button */}
        {(item.rawOrder.status === 'READY_FOR_PICKUP' && userPerspective === 'seller') && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              const dateInput = prompt('Enter pickup date (YYYY-MM-DD):');
              if (dateInput) {
                const pickupDate = new Date(dateInput);
                if (!isNaN(pickupDate.getTime())) {
                  onSchedulePickup(item.rawOrder.orderId, pickupDate);
                }
              }
            }}
            className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          >
            Schedule
          </button>
        )}

        {/* Cancel Order Button */}
        {(['PENDING_CONFIRMATION', 'CONFIRMED'].includes(item.rawOrder.status)) && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              const reason = prompt('Please provide a reason for cancellation:');
              if (reason) {
                onCancelOrder(item.rawOrder.orderId, reason);
              }
            }}
            className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
          >
            Cancel
          </button>
        )}

        {/* View Details Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails(item.rawOrder);
          }}
          className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
        >
          Details
        </button>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-4 pt-2 flex justify-between items-center">
        <h2 className="text-xl font-medium">{title}</h2>
        <div className="flex gap-x-2">
          <Button
            color="primary"
            className={`${!isAddButton ? "hidden" : ""}`}
            onClick={onAddItem}
          >
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
            className={`${
              !isOrderButton ? "hidden" : "flex"
            }  gap-3 items-center px-5`}
          >
            Order History
          </Button>
        </div>
      </div>

      {/* Tab navigation */}
      {tabs && tabs.length > 0 && (
        <div className="border-b border-gray-200">
          <nav className="flex px-4 ">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`py-1 px-4 text-sm font-medium relative ${
                  activeTab === tab.id
                    ? "text-primary border-b-2 border-primary"
                    : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span
                    className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                      activeTab === tab.id
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
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
                    className="text-left px-4 py-1 font-medium text-secondary/70 border-b border-gray-200"
                  >
                    {column.label}
                  </th>
                ))}
                <th className="text-left px-4 py-1 font-medium text-secondary/70 border-b border-gray-200">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {displayData.map((item, index) => (
                <tr
                  key={item.id || item.orderNo || `row-${index}`}
                  className={`${
                    index % 2 === 0 ? "bg-white" : "bg-gray-50"
                  } ${isClickable ? "cursor-pointer hover:bg-gray-100" : ""}`}
                  onClick={isClickable ? () => onClickRow(item) : undefined}
                >
                  {columns.map((column) => (
                    <td
                      key={`${item.id || item.orderNo || index}-${column.key}`}
                      className="px-4 py-2 border-b border-gray-200 text-secondary"
                    >
                      {renderCell(item, column)}
                    </td>
                  ))}
                  <td className="px-4 py-2 border-b border-gray-200">
                    {renderRowActions(item)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-4 py-3">
            <img
              src="/Image/Empty-amico.svg"
              alt="Empty data"
              width={350}
              height={200}
              className="mx-auto"
            />
            <p className="text-xl text-secondary">No data found</p>
          </div>
        )}
      </div>

      {displayData && displayData.length > 0 && (
        <TablePageButtons
          page={page}
          totalPages={totalPages}
          onPageChange={onPageChange}
          onItemsPerPageChange={onItemsPerPageChange}
          itemsPerPage={itemsPerPage}
          totalItems={totalItems}
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
          <span className="text-xl font-medium text-secondary/80" key={index}>
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
