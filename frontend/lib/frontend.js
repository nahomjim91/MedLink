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
import { RatingModal } from "../../components/modal/RatingModal";

const ordersColumns = [
  { key: "orderBy", label: "Order By" },
  { key: "orderValue", label: "Order Value" },
  { key: "items", label: "Items" },
  { key: "orderId", label: "Order ID." },
  { key: "expectedDelivery", label: "Expected Delivery" },
  { key: "status", label: "Status" },
];

const getUserPerspective = (order, user) => {
  console.log("getUserPerspective called with order:", order);
  // Determine if current user is buyer or seller for this order
  if (user?.role?.toLowerCase() === "healthcare-facility") {
    return "buyer"; // Health facilities are always buyers
  } else if (user?.role?.toLowerCase() === "importer") {
    return "seller"; // Importers are always sellers
  } else if (user?.role?.toLowerCase() === "supplier") {
    // Suppliers can be both - check the specific order
    return order.sellerId !== user?.userId ? "buyer" : "seller";
  }
  return "buyer"; // Default fallback
};

export default function OrdersPage() {
  const [ordersPage, setOrdersPage] = useState(1);
  const [activeTab, setActiveTab] = useState("all");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedOrderForRating, setSelectedOrderForRating] = useState(null);
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
    } else if (userRole === "healthcare-facility") {
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

  // Get filtered data for current tab
  const filteredTabData = useMemo(() => {
    const currentData = tabData[activeTab] || [];
    return applyFrontendFilters(currentData, activeFilters);
  }, [tabData, activeTab, activeFilters]);

  const handleRateOrder = (order) => {
    setSelectedOrderForRating(order);
    setShowRatingModal(true);
  };

  const handleCloseRatingModal = () => {
    setShowRatingModal(false);
    setSelectedOrderForRating(null);
  };

  // Calculate pagination
  const totalPages = Math.ceil(filteredTabData.length / itemsPerPage);
  const startIndex = (ordersPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredTabData.slice(startIndex, endIndex);


  return (
    <div className="flex flex-col gap-2">
      {/* Statistics Cards */}
  
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
          isAddButton={user?.role?.toLowerCase() === "healthcare-facility"}
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
            onRateOrder={handleRateOrder} 
        />
      </div>

    
      {showRatingModal && selectedOrderForRating && (
        <RatingModal
          isOpen={showRatingModal}
          onClose={handleCloseRatingModal}
          order={selectedOrderForRating}
          user={user}
          userRole={user?.role}
          getUserPerspective={getUserPerspective}
        />
      )}
    </div>
  );
}
