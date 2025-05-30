'use client';

import { useQuery } from '@apollo/client';
import { GET_ORDER_DETAILS_BY_ID } from '../api/graphql/order/orderQuery';

const useOrderContext = (orderId) => {
  const { data, loading, error, refetch } = useQuery(GET_ORDER_DETAILS_BY_ID, {
    variables: { orderId },
    skip: !orderId,
    fetchPolicy: 'cache-first',
  });

  const order = data?.order || null;

  const formatOrderForDisplay = (order) => {
    if (!order) return null;

    return {
      orderId: order.orderId,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      buyerName: order.buyerName || order.buyerCompanyName,
      sellerName: order.sellerName || order.sellerCompanyName,
      totalCost: order.totalCost,
      totalItems: order.totalItems,
      orderDate: order.orderDate,
      pickupDate: order.pickupScheduledDate,
      isCanceled: !!order.cancellationReason,
    };
  };

  const formatFullOrderData = (order) => {
    if (!order) return null;

    const formattedItems = (order.items || []).map((item) => ({
      orderItemId: item.orderItemId,
      productId: item.productId,
      productName: item.productName,
      productType: item.productType,
      productCategory: item.productCategory,
      productImage: item.productImage,
      totalQuantity: item.totalQuantity,
      totalPrice: item.totalPrice,
      batchItems: (item.batchItems || []).map((batch) => ({
        orderBatchItemId: batch.orderBatchItemId,
        batchId: batch.batchId,
        quantity: batch.quantity,
        unitPrice: batch.unitPrice,
        subtotal: batch.subtotal,
        expiryDate: batch.expiryDate,
        manufacturingDate: batch.manufacturingDate,
        lotNumber: batch.lotNumber,
        batchSellerId: batch.batchSellerId,
        batchSellerName: batch.batchSellerName,
      })),
    }));

    return {
      orderId: order.orderId,
      orderNumber: order.orderNumber,
      buyerId: order.buyerId,
      buyerName: order.buyerName,
      buyerCompanyName: order.buyerCompanyName,
      buyerContact: order.buyerContactInfo,
      sellerId: order.sellerId,
      sellerName: order.sellerName,
      sellerCompanyName: order.sellerCompanyName,
      sellerContact: order.sellerContactInfo,
      items: formattedItems,
      totalItems: order.totalItems,
      totalCost: order.totalCost,
      status: order.status,
      paymentStatus: order.paymentStatus,
      orderDate: order.orderDate,
      pickupScheduledDate: order.pickupScheduledDate,
      pickupConfirmedDate: order.pickupConfirmedDate,
      transactionId: order.transactionId,
      notes: order.notes,
      cancellationReason: order.cancellationReason,
      cancelledBy: order.cancelledBy,
      cancelledAt: order.cancelledAt,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,

      // Computed fields
      isCanceled: !!order.cancellationReason,
      hasPickup: !!order.pickupScheduledDate,
      totalQuantity: formattedItems.reduce(
        (sum, item) => sum + (item.totalQuantity || 0), 0
      )
    };
  };

  return {
    orderData: formatOrderForDisplay(order),    // light view
    fullOrderData: formatFullOrderData(order),  // detailed view
    loading,
    error,
    refetch,
  };
};

export default useOrderContext;
