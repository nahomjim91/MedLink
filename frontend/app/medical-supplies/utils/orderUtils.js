// utils/orderUtils.js

export const mapOrderStatus = (status) => {
  const statusMap = {
    'PENDING_CONFIRMATION': 'Pending',
    'CONFIRMED': 'Confirmed',
    'REJECTED_BY_SELLER': 'Rejected',
    'PREPARING': 'Preparing',
    'READY_FOR_PICKUP': 'Ready',
    'PICKUP_SCHEDULED': 'Scheduled',
    'PICKUP_CONFIRMED': 'Out For Delivery',
    'COMPLETED': 'Delivered',
    'CANCELLED': 'Cancel',
    'DISPUTED': 'Disputed'
  };
  return statusMap[status] || status;
};

export const mapPaymentStatus = (paymentStatus) => {
  const statusMap = {
    'PENDING': 'Pending Payment',
    'PROCESSING': 'Processing',
    'PAID_HELD_BY_SYSTEM': 'Paid (Held)',
    'RELEASED_TO_SELLER': 'Paid',
    'REFUNDED': 'Refunded',
    'FAILED': 'Payment Failed'
  };
  return statusMap[paymentStatus] || paymentStatus;
};

export const getOrderStats = (orders) => {
  const totalOrders = orders.length;
  const totalReceived = orders.filter(order => 
    ['COMPLETED', 'PICKUP_CONFIRMED'].includes(order.status)
  ).length;
  const totalCancelled = orders.filter(order => 
    order.status === 'CANCELLED'
  ).length;
  const ongoingOrders = orders.filter(order => 
    !['COMPLETED', 'CANCELLED', 'REJECTED_BY_SELLER'].includes(order.status)
  ).length;

  const totalRevenue = orders
    .filter(order => ['COMPLETED', 'PICKUP_CONFIRMED'].includes(order.status))
    .reduce((sum, order) => sum + (order.totalCost || 0), 0);

  const cancelledCosts = orders
    .filter(order => order.status === 'CANCELLED')
    .reduce((sum, order) => sum + (order.totalCost || 0), 0);

  const ongoingCosts = orders
    .filter(order => !['COMPLETED', 'CANCELLED', 'REJECTED_BY_SELLER'].includes(order.status))
    .reduce((sum, order) => sum + (order.totalCost || 0), 0);

  return {
    totalOrders,
    totalReceived,
    totalRevenue: totalRevenue.toFixed(2),
    totalCancelled,
    cancelledCosts: cancelledCosts.toFixed(2),
    ongoingOrders,
    ongoingCosts: ongoingCosts.toFixed(2)
  };
};

// Get role-based tabs configuration
export const getRoleBasedTabs = (userRole, orders = [], ordersToFulfill = []) => {
  const role = userRole?.toLowerCase();
  
  switch (role) {
    case 'supplier':
      return [
        { id: 'all', label: 'All Orders', count: orders.length + ordersToFulfill.length },
        { id: 'my_orders', label: 'My Orders', count: orders.length },
        { id: 'order_requests', label: 'Order Requests', count: ordersToFulfill.length },
        { id: 'pending', label: 'Pending' },
        { id: 'completed', label: 'Completed' }
      ];
    
    case 'importer':
      return [
        { id: 'all', label: 'All Orders', count: ordersToFulfill.length },
        { id: 'pending', label: 'Pending' },
        { id: 'ready', label: 'Ready for Pickup' },
        { id: 'completed', label: 'Completed' }
      ];
    
    case 'health_facility':
      return [
        { id: 'all', label: 'All Orders', count: orders.length },
        { id: 'pending', label: 'Pending' },
        { id: 'in_transit', label: 'In Transit' },
        { id: 'delivered', label: 'Delivered' }
      ];
    
    default:
      return [
        { id: 'all', label: 'All Orders' }
      ];
  }
};

// Check if user can update order status based on their role and current status
export const canUpdateStatus = (currentStatus, userPerspective) => {
  const status = currentStatus?.toUpperCase();
  
  if (userPerspective === 'seller') {
    // Sellers can update these statuses
    const updatableStatuses = [
      'PENDING_CONFIRMATION',
      'CONFIRMED', 
      'PREPARING',
      'READY_FOR_PICKUP',
      'PICKUP_SCHEDULED'
    ];
    return updatableStatuses.includes(status);
  } else if (userPerspective === 'buyer') {
    // Buyers can mainly confirm completion
    const updatableStatuses = [
      'PICKUP_CONFIRMED', // Can confirm delivery received
      'COMPLETED' // Can dispute if needed
    ];
    return updatableStatuses.includes(status);
  }
  
  return false;
};

// Get available status transitions based on current status and user role
export const getAvailableStatusTransitions = (currentStatus, userRole, userPerspective) => {
  const status = currentStatus?.toUpperCase();
  const role = userRole?.toLowerCase();
  
  const transitions = [];
  
  if (userPerspective === 'seller') {
    switch (status) {
      case 'PENDING_CONFIRMATION':
        transitions.push(
          { value: 'CONFIRMED', label: 'Confirm Order' },
          { value: 'REJECTED_BY_SELLER', label: 'Reject Order' }
        );
        break;
      case 'CONFIRMED':
        transitions.push(
          { value: 'PREPARING', label: 'Start Preparing' },
          { value: 'CANCELLED', label: 'Cancel Order' }
        );
        break;
      case 'PREPARING':
        transitions.push(
          { value: 'READY_FOR_PICKUP', label: 'Ready for Pickup' }
        );
        break;
      case 'READY_FOR_PICKUP':
        transitions.push(
          { value: 'PICKUP_SCHEDULED', label: 'Schedule Pickup' }
        );
        break;
      case 'PICKUP_SCHEDULED':
        transitions.push(
          { value: 'PICKUP_CONFIRMED', label: 'Confirm Pickup' }
        );
        break;
    }
  } else if (userPerspective === 'buyer') {
    switch (status) {
      case 'PICKUP_CONFIRMED':
        transitions.push(
          { value: 'COMPLETED', label: 'Confirm Received' },
          { value: 'DISPUTED', label: 'Report Issue' }
        );
        break;
      case 'PENDING_CONFIRMATION':
      case 'CONFIRMED':
        transitions.push(
          { value: 'CANCELLED', label: 'Cancel Order' }
        );
        break;
    }
  }
  
  return transitions;
};

// Get status color for display
export const getStatusColor = (status) => {
  const statusLower = status?.toLowerCase();
  
  if (statusLower?.includes('delivered') || statusLower?.includes('completed')) {
    return 'text-green-600 bg-green-50';
  } else if (statusLower?.includes('cancel') || statusLower?.includes('reject')) {
    return 'text-red-600 bg-red-50';
  } else if (statusLower?.includes('pending') || statusLower?.includes('confirm')) {
    return 'text-yellow-600 bg-yellow-50';
  } else if (statusLower?.includes('ready') || statusLower?.includes('schedule')) {
    return 'text-blue-600 bg-blue-50';
  } else if (statusLower?.includes('preparing') || statusLower?.includes('ongoing')) {
    return 'text-purple-600 bg-purple-50';
  }
  
  return 'text-gray-600 bg-gray-50';
};

// Format order data for export
export const formatOrdersForExport = (orders) => {
  return orders.map(order => ({
    'Order Number': `#${order.orderNumber}`,
    'Order Date': new Date(order.orderDate).toLocaleDateString(),
    'Buyer': order.buyerName,
    'Seller': order.sellerName,
    'Total Items': order.totalItems,
    'Total Cost': `$${order.totalCost?.toFixed(2)}`,
    'Status': mapOrderStatus(order.status),
    'Payment Status': mapPaymentStatus(order.paymentStatus),
    'Scheduled Pickup': order.pickupScheduledDate ? 
      new Date(order.pickupScheduledDate).toLocaleDateString() : 'Not Scheduled'
  }));
};

// Validate order status transition
export const isValidStatusTransition = (fromStatus, toStatus, userRole) => {
  const transitions = getAvailableStatusTransitions(fromStatus, userRole);
  return transitions.some(transition => transition.value === toStatus);
};
