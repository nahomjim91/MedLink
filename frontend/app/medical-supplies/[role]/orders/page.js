"use client";
import { useState, useMemo } from "react";
import { OrderStatCard, OrderTableCard } from "../../components/ui/Cards";
import { useOrders } from "../../hooks/useOrders";
import {
  mapOrderStatus,
  getOrderStats,
  getRoleBasedTabs,
  canUpdateStatus,
} from "../../utils/orderUtils";
import { useMSAuth } from "../../hooks/useMSAuth";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { OrderFilterModal } from "../../components/modal/OrderFilterModal";
import { OrderHistoryModal } from "../../components/modal/OrderHistoryModal";

const ordersColumns = [
  { key: "orderBy", label: "Order By" },
  { key: "orderValue", label: "Order Value" },
  { key: "items", label: "Items" },
  { key: "orderId", label: "Order ID." },
  { key: "expectedDelivery", label: "Expected Delivery" },
  { key: "status", label: "Status" },
];

const getUserPerspective = (order, user) => {
  // Determine if current user is buyer or seller for this order
  if (user?.role?.toLowerCase() === "health_facility") {
    return "buyer"; // Health facilities are always buyers
  } else if (user?.role?.toLowerCase() === "importer") {
    return "seller"; // Importers are always sellers
  } else if (user?.role?.toLowerCase() === "supplier") {
    // Suppliers can be both - check the specific order
    return order.buyerId === user?.id ? "buyer" : "seller";
  }
  return "buyer"; // Default fallback
};

export default function OrdersPage() {
  const [ordersPage, setOrdersPage] = useState(1);
  const [activeTab, setActiveTab] = useState("all");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [activeFilters, setActiveFilters] = useState({});
  const [itemsPerPage, setItemsPerPage] = useState(9);

  const [statusFilter, setStatusFilter] = useState(null);
  const router = useRouter();
  const { user } = useMSAuth();

  const {
    orders,
    ordersToFulfill,
    loading,
    error,
    refetch,
    updateOrderStatus,
    schedulePickup,
    cancelOrder,
  } = useOrders(user?.role, statusFilter); // Pass null for limit and offset

  // Transform order data for table display
  const transformOrder = (order, perspective) => {
    return {
      id: order.orderId,
      orderBy:
        perspective === "buyer"
          ? order.sellerCompanyName || order.sellerName
          : order.buyerCompanyName || order.buyerName,
      orderValue: `$${order.totalCost?.toFixed(2) || "0.00"}`,
      items: `${order.totalItems} ${order.totalItems === 1 ? "Item" : "Items"}`,
      orderId: `#${order.orderId}`,
      expectedDelivery: order.pickupScheduledDate
        ? new Date(order.pickupScheduledDate).toLocaleDateString()
        : "TBD",
      status: mapOrderStatus(order.status),
    };
  };

  // Get role-based tabs
  const tabs = useMemo(
    () => getRoleBasedTabs(user?.role, orders, ordersToFulfill),
    [user?.role, orders, ordersToFulfill]
  );

  // Prepare tab data based on user role
  const tabData = useMemo(() => {
    const userRole = user?.role?.toLowerCase();
    let tabDataMap = {};

    if (userRole === "supplier") {
      // Suppliers can buy and sell
      const myOrders = orders.map((order) => ({
        ...transformOrder(order, "buyer"),
        rawOrder: order,
        canUpdate: canUpdateStatus(order.status, "buyer"),
      }));

      const orderRequests = ordersToFulfill.map((order) => ({
        ...transformOrder(order, "seller"),
        rawOrder: order,
        canUpdate: canUpdateStatus(order.status, "seller"),
      }));

      tabDataMap = {
        all: [...myOrders, ...orderRequests],
        my_orders: myOrders,
        order_requests: orderRequests,
        pending: [...myOrders, ...orderRequests].filter((order) =>
          ["Pending", "Confirmed", "Preparing"].includes(order.status)
        ),
        completed: [...myOrders, ...orderRequests].filter(
          (order) => order.status === "Delivered"
        ),
      };
    } else if (userRole === "importer") {
      // Importers only fulfill orders (sell)
      const orderRequests = ordersToFulfill.map((order) => ({
        ...transformOrder(order, "seller"),
        rawOrder: order,
        canUpdate: canUpdateStatus(order.status, "seller"),
      }));

      tabDataMap = {
        all: orderRequests,
        pending: orderRequests.filter((order) =>
          ["Pending", "Confirmed", "Preparing"].includes(order.status)
        ),
        ready: orderRequests.filter((order) =>
          ["Ready", "Scheduled"].includes(order.status)
        ),
        completed: orderRequests.filter(
          (order) => order.status === "Delivered"
        ),
      };
    } else if (userRole === "health_facility") {
      // Health facilities only make orders (buy)
      const myOrders = orders.map((order) => ({
        ...transformOrder(order, "buyer"),
        rawOrder: order,
        canUpdate: canUpdateStatus(order.status, "buyer"),
      }));

      tabDataMap = {
        all: myOrders,
        pending: myOrders.filter((order) =>
          ["Pending", "Confirmed", "Preparing"].includes(order.status)
        ),
        in_transit: myOrders.filter((order) =>
          ["Ready", "Scheduled", "Out For Delivery"].includes(order.status)
        ),
        delivered: myOrders.filter((order) => order.status === "Delivered"),
      };
    }

    return tabDataMap;
  }, [orders, ordersToFulfill, user?.role]);

  // Apply frontend filters
  const applyFrontendFilters = (data, filters) => {
    if (!filters || Object.keys(filters).length === 0) return data;

    return data.filter((item) => {
      const order = item.rawOrder;

      // Status filter
      if (filters.status && order.status !== filters.status) {
        return false;
      }

      // Date range filter
      if (filters.dateFrom) {
        const orderDate = new Date(order.createdAt || order.orderDate);
        const fromDate = new Date(filters.dateFrom);
        if (orderDate < fromDate) return false;
      }

      if (filters.dateTo) {
        const orderDate = new Date(order.createdAt || order.orderDate);
        const toDate = new Date(filters.dateTo);
        if (orderDate > toDate) return false;
      }

      // Value range filter
      if (
        filters.minValue &&
        (order.totalCost || 0) < parseFloat(filters.minValue)
      ) {
        return false;
      }

      if (
        filters.maxValue &&
        (order.totalCost || 0) > parseFloat(filters.maxValue)
      ) {
        return false;
      }

      // Company name filter
      if (filters.orderBy) {
        const perspective = getUserPerspective(order, user);
        const companyName =
          perspective === "buyer"
            ? order.sellerCompanyName || order.sellerName || ""
            : order.buyerCompanyName || order.buyerName || "";

        if (
          !companyName.toLowerCase().includes(filters.orderBy.toLowerCase())
        ) {
          return false;
        }
      }

      return true;
    });
  };

  // Get filtered data for current tab
  const filteredTabData = useMemo(() => {
    const currentData = tabData[activeTab] || [];
    return applyFrontendFilters(currentData, activeFilters);
  }, [tabData, activeTab, activeFilters]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredTabData.length / itemsPerPage);
  const startIndex = (ordersPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredTabData.slice(startIndex, endIndex);

  // Calculate statistics based on filtered data
  const stats = useMemo(() => {
    const rawOrders = filteredTabData.map((item) => item.rawOrder);
    return getOrderStats(rawOrders);
  }, [filteredTabData]);

  // Handle tab change
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setOrdersPage(1); // Reset to first page when changing tabs
  };

  // Handle page change
  const handlePageChange = (page) => {
    setOrdersPage(page);
  };

  // Handle items per page change
  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setOrdersPage(1); // Reset to first page when changing items per page
  };

  // Handle status update
  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await updateOrderStatus({
        variables: { orderId, status: newStatus },
      });
      toast.success("Order status updated successfully");
      refetch();
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error("Failed to update order status");
    }
  };

  // Handle pickup scheduling
  const handleSchedulePickup = async (orderId, pickupDate) => {
    try {
      await schedulePickup({
        variables: { orderId, pickupDate },
      });
      toast.success("Pickup scheduled successfully");
      refetch();
    } catch (error) {
      console.error("Error scheduling pickup:", error);
      toast.error("Failed to schedule pickup");
    }
  };

  // Handle order cancellation
  const handleCancelOrder = async (orderId, reason) => {
    try {
      await cancelOrder({
        variables: { orderId, reason },
      });
      toast.success("Order cancelled successfully");
      refetch();
    } catch (error) {
      console.error("Error cancelling order:", error);
      toast.error("Failed to cancel order");
    }
  };

  // Handle row click for expandable rows
  const handleRowClick = (item) => {
    console.log("Row clicked:", item);
  };

  // Handle actions
  const handleAction = (action) => {
    switch (action) {
      case "Add Order":
        console.log("Add Order clicked");
        break;
      case "Filter Orders":
        setShowFilterModal(true);
        break;
      case "Order History":
        setShowHistoryModal(true);
        break;
      default:
        console.log(`Unknown action: ${action}`);
    }
  };

  // Apply filters
  const applyFilters = (filters) => {
    setActiveFilters(filters);
    setStatusFilter(filters.status || null);
    setOrdersPage(1);
  };

  if (loading && !orders.length && !ordersToFulfill.length) {
    return (
      <div className="flex flex-col gap-2">
        <div className="w-full flex gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex-1 h-24 bg-gray-200 animate-pulse rounded-lg"
            ></div>
          ))}
        </div>
        <div className="w-full h-96 bg-gray-200 animate-pulse rounded-lg"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-2">
        <div className="w-full p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">Error loading orders: {error.message}</p>
          <button
            onClick={() => refetch()}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Statistics Cards */}
      <div className="w-full flex gap-4">
        <OrderStatCard
          title="Total Orders"
          metrics={[{ value: stats.totalOrders.toString() }]}
        />
        <OrderStatCard
          title="Total Received"
          metrics={[
            { value: stats.totalReceived.toString() },
            { value: `$${stats.totalRevenue}` },
          ]}
          subtitle="Revenue"
        />
        <OrderStatCard
          title="Total Cancelled"
          metrics={[
            { value: stats.totalCancelled.toString() },
            { value: `$${stats.cancelledCosts}` },
          ]}
          subtitle="Costs"
        />
        <OrderStatCard
          title="Ongoing Orders"
          metrics={[
            { value: stats.ongoingOrders.toString() },
            { value: `$${stats.ongoingCosts}` },
          ]}
          subtitle="Value"
        />
      </div>

      {/* Orders Table with Tabs */}
      <div className="w-full">
        <OrderTableCard
          title="Orders"
          data={paginatedData} // This should be the sliced data (9 items max)
          columns={ordersColumns}
          page={ordersPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          totalItems={filteredTabData.length} // Total count of filtered items
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
          onAddItem={() => handleAction("Add Order")}
          onFilter={() => handleAction("Filter Orders")}
          onDownload={() => handleAction("Order History")}
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          tabData={tabData} // This is used only for tab counts, not for display
          isLoading={loading}
          isClickable={true}
          onClickRow={handleRowClick}
          isAddButton={user?.role?.toLowerCase() === "health_facility"}
          isOrderButton={true}
          // Order functionality props
          user={user}
          userRole={user?.role}
          getUserPerspective={(order) => getUserPerspective(order, user)}
          onStatusUpdate={handleStatusUpdate}
          onSchedulePickup={handleSchedulePickup}
          onCancelOrder={handleCancelOrder}
          onViewDetails={(order) => {
            router.push(
              `/medical-supplies/${user?.role?.toLowerCase()}/orders/${
                order.orderId
              }`
            );
          }}
        />
      </div>

      {/* Filter Modal */}
      <OrderFilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApplyFilters={applyFilters}
        currentFilters={activeFilters}
        userRole={user?.role?.toLowerCase()}
      />

      {/* Order History Modal */}
      <OrderHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        orders={[...orders, ...ordersToFulfill]}
        userRole={user?.role?.toLowerCase()}
        getUserPerspective={(order) => getUserPerspective(order, user)}
      />
    </div>
  );
}
