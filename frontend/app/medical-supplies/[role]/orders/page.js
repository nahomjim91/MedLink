"use client";
import { useState, useMemo } from "react";
import { TableCard, StatCard, OrderStatCard, OrderTableCard } from "../../components/ui/Cards";
import { useOrders } from "../../hooks/useOrders";
import { OrderRowActions } from "../../components/ui/order/OrderRowActions";
import {
  mapOrderStatus,
  getOrderStats,
  getRoleBasedTabs,
  canUpdateStatus,
  getStatusColor,
} from "../../utils/orderUtils";
import { useMSAuth } from "../../hooks/useMSAuth";
import { toast } from "react-hot-toast"; // Assuming you have toast notifications

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
  const [statusFilter, setStatusFilter] = useState(null);
  const { user } = useMSAuth();

  const itemsPerPage = 10;
  const offset = (ordersPage - 1) * itemsPerPage;

  const {
    orders,
    ordersToFulfill,
    loading,
    error,
    refetch,
    updateOrderStatus,
    schedulePickup,
    cancelOrder,
  } = useOrders(user?.role, itemsPerPage, offset, statusFilter);

  // Transform order data for table display - MOVED BEFORE useMemo
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
  }, [orders, ordersToFulfill, user?.role, transformOrder]);

  // Calculate statistics based on active tab
  const stats = useMemo(() => {
    const currentData = tabData[activeTab] || [];
    const rawOrders = currentData.map((item) => item.rawOrder);
    return getOrderStats(rawOrders);
  }, [tabData, activeTab]);

  // Handle tab change
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setOrdersPage(1); // Reset to first page when changing tabs
    refetch({ status: statusFilter, limit: itemsPerPage, offset: 0 });
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
    // Handle expanding row details or navigation
    console.log("Row clicked:", item);
  };

  const handleAction = (action) => {
    switch (action) {
      case "Add Order":
        // Navigate to add order page
        console.log("Add Order clicked");
        break;
      case "Filter Orders":
        // Open filter modal
        console.log("Filter Orders clicked");
        break;
      case "Order History":
        // Export order history
        console.log("Order History clicked");
        break;
      default:
        console.log(`Unknown action: ${action}`);
    }
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

  const currentTabData = tabData[activeTab] || [];
  const totalPages = Math.ceil(currentTabData.length / itemsPerPage);
  const paginatedData = currentTabData.slice(
    (ordersPage - 1) * itemsPerPage,
    ordersPage * itemsPerPage
  );

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
          data={paginatedData}
          columns={ordersColumns}
          page={ordersPage}
          totalPages={totalPages}
          onPageChange={setOrdersPage}
          onAddItem={() => handleAction("Add Order")}
          onFilter={() => handleAction("Filter Orders")}
          onDownload={() => handleAction("Order History")}
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          tabData={tabData}
          isLoading={loading}
          isClickable={true}
          onClickRow={handleRowClick}
          isAddButton={user?.role?.toLowerCase() === "health_facility"}
          isOrderButton={true}
          // New props for order functionality
          user={user}
          userRole={user?.role}
          getUserPerspective={(order) => getUserPerspective(order, user)}
          onStatusUpdate={handleStatusUpdate}
          onSchedulePickup={handleSchedulePickup}
          onCancelOrder={handleCancelOrder}
          onViewDetails={(order) => {
            // Handle order details view
            console.log("Viewing order details:", order);
            // You can navigate to a details page or open a modal here
          }}
        />
      </div>
    </div>
  );
}
