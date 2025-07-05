import { useState, useMemo } from "react";
import {
  X,
  Download,
  Package,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";

export function OrderHistoryModal({
  isOpen,
  onClose,
  orders = [],
  getUserPerspective,
}) {
  const [selectedTab, setSelectedTab] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");

  // Filter historical orders (delivered and cancelled)
  const historicalOrders = useMemo(() => {
    return orders.filter((order) =>
      ["DELIVERED", "CANCELLED", "COMPLETED"].includes(order.status)
    );
  }, [orders]);

  console.log("Historical Orders:", orders);

  // Categorize orders
  const categorizedOrders = useMemo(() => {
    const delivered = historicalOrders.filter(
      (order) => order.status === "DELIVERED" || order.status === "COMPLETED"
    );
    const cancelled = historicalOrders.filter(
      (order) => order.status === "CANCELLED"
    );

    return {
      all: historicalOrders,
      delivered,
      cancelled,
    };
  }, [historicalOrders]);

  // Sort orders
  const sortedOrders = useMemo(() => {
    const ordersToSort = categorizedOrders[selectedTab] || [];

    return [...ordersToSort].sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case "date":
          aValue = new Date(a.createdAt || a.orderDate);
          bValue = new Date(b.createdAt || b.orderDate);
          break;
        case "value":
          aValue = a.totalCost || 0;
          bValue = b.totalCost || 0;
          break;
        case "company":
          const aPerspective = getUserPerspective
            ? getUserPerspective(a)
            : "buyer";
          const bPerspective = getUserPerspective
            ? getUserPerspective(b)
            : "buyer";
          aValue =
            aPerspective === "buyer"
              ? a.sellerCompanyName || a.sellerName || ""
              : a.buyerCompanyName || a.buyerName || "";
          bValue =
            bPerspective === "buyer"
              ? b.sellerCompanyName || b.sellerName || ""
              : b.buyerCompanyName || b.buyerName || "";
          break;
        default:
          return 0;
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [categorizedOrders, selectedTab, sortBy, sortOrder, getUserPerspective]);

  const exportToCSV = () => {
    const csvContent = [
      [
        "Order ID",
        "Date",
        "Company",
        "Value",
        "Items",
        "Status",
        "Completion Date",
      ].join(","),
      ...sortedOrders.map((order) => {
        const perspective = getUserPerspective
          ? getUserPerspective(order)
          : "buyer";
        const company =
          perspective === "buyer"
            ? order.sellerCompanyName || order.sellerName || "N/A"
            : order.buyerCompanyName || order.buyerName || "N/A";

        return [
          order.orderId,
          new Date(order.createdAt || order.orderDate).toLocaleDateString(),
          company,
          `$${(order.totalCost || 0).toFixed(2)}`,
          order.totalItems || 0,
          order.status,
          order.completedAt
            ? new Date(order.completedAt).toLocaleDateString()
            : "N/A",
        ].join(",");
      }),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `order-history-${selectedTab}-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "DELIVERED":
      case "COMPLETED":
        return <CheckCircle size={16} className="text-primary" />;
      case "CANCELLED":
        return <XCircle size={16} className="text-red-600" />;
      default:
        return <Clock size={16} className="text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "DELIVERED":
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const tabs = [
    { id: "all", label: "All History", count: categorizedOrders.all.length },
    {
      id: "delivered",
      label: "Delivered",
      count: categorizedOrders.delivered.length,
    },
    {
      id: "cancelled",
      label: "Cancelled",
      count: categorizedOrders.cancelled.length,
    },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/50 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-secondary/20">
          <div className="flex items-center gap-2">
            <Clock size={20} className="text-primary" />
            <h2 className="text-lg font-semibold">Order History</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-3 py-1 border text-primary rounded-md hover:bg-primary hover:text-white text-sm"
            >
              <Download size={16} />
              Export CSV
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-error/50 hover:text-white rounded-full"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-secondary/20">
          <nav className="flex px-4 -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`py-3 px-4 text-sm font-medium relative ${
                  selectedTab === tab.id
                    ? "text-primary border-b-2 border-primary"
                    : "text-secondary/50 hover:text-secondary"
                }`}
              >
                {tab.label}
                <span
                  className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                    selectedTab === tab.id
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-secondary/20">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">
                Sort by:
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-sm border border-secondary/20 rounded px-2 py-1"
              >
                <option value="date">Date</option>
                <option value="value">Order Value</option>
                <option value="company">Company</option>
              </select>
            </div>
            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="text-sm text-primary/80 hover:text-primary"
            >
              {sortOrder === "asc" ? "↑ Ascending" : "↓ Descending"}
            </button>
          </div>
          <div className="text-sm text-primary">
            {sortedOrders.length} orders found
          </div>
        </div>

        {/* Orders List */}
        <div className="flex-1 overflow-y-auto p-4">
          {sortedOrders.length === 0 ? (
            <div className="text-center py-8">
              <Package size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">
                No {selectedTab === "all" ? "historical" : selectedTab} orders
                found
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedOrders.map((order) => {
                const perspective = getUserPerspective
                  ? getUserPerspective(order)
                  : "buyer";
                const company =
                  perspective === "buyer"
                    ? order.sellerCompanyName || order.sellerName || "Unknown"
                    : order.buyerCompanyName || order.buyerName || "Unknown";

                return (
                  <div
                    key={order.orderId}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(order.status)}
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              order.status
                            )}`}
                          >
                            {order.status === "DELIVERED" || order.status === "COMPLETED"
                              ? "Delivered"
                              : "Cancelled"}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-secondary">
                            #{order.orderId}
                          </p>
                          <p className="text-sm text-gray-600">{company}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-secondary">
                          ${(order.totalCost || 0).toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {order.totalItems || 0} item
                          {(order.totalItems || 0) !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-sm text-gray-600">
                      <span>
                        Ordered:{" "}
                        {new Date(
                          order.createdAt || order.orderDate
                        ).toLocaleDateString()}
                      </span>
                      {order.completedAt && (
                        <span>
                          Completed:{" "}
                          {new Date(order.completedAt).toLocaleDateString()}
                        </span>
                      )}
                      {order.status === "CANCELLED" &&
                        order.cancellationReason && (
                          <span className="text-red-600">
                            Reason: {order.cancellationReason}
                          </span>
                        )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
