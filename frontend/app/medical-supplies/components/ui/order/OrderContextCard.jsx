import React, { useState } from 'react';
import { X, Receipt,AlertCircle } from 'lucide-react';
import MiniOrderDetail from '../../modal/MiniOrderDetail ';
import useOrderContext from '../../../hooks/useOrderById';

export const OrderContextCard = ({
  orderData,
  onRemove,
  isPreview = false,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Get full order data for the modal
  const { fullOrderData, loading } = useOrderContext(orderData?.orderId);

  if (!orderData) return null;

  const handleCardClick = (e) => {
    // Prevent modal from opening if remove button was clicked
    if (e.target.closest('[data-remove-button]')) {
      return;
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      <div
        className={`${isPreview ? "p-2" : "p-4"} border border-gray-200 bg-white/20 flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition-colors ${
          isPreview ? "border-b" : "rounded-lg mb-1"
        }`}
        onClick={!isPreview ? handleCardClick : undefined}
      >
        {/* Order Icon */}
        <div className={`flex items-center justify-center ${isPreview ? "h-10 w-10" : "h-16 w-16"} flex-shrink-0 bg-blue-50 rounded-lg border border-blue-200`}>
          <Receipt size={24} className="text-primary" />
        </div>

        {/* Order Info */}
        <div className={`flex-1 min-w-0 ${isPreview ? "flex gap-2 items-center" : ""}`}>
          <h3 className={`font-semibold text-gray-900 text-base ${!isPreview ? "mb-1" : ""} truncate`}>
            Order #{orderData.orderNumber || orderData.orderId}
          </h3>
          <p className="font-bold text-lg text-gray-900">
            ${orderData.totalCost?.toFixed(2) || "0.00"}
          </p>
          {orderData.totalItems && (
            <p className={`text-sm text-gray-500 ${!isPreview ? "mt-1" : ""}`}>
              {orderData.totalItems} items
            </p>
          )}
        </div>

        {/* Order Status */}
        <div className="flex-shrink-0 text-right">
          <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(orderData.status)}`}>
            {orderData.status}
          </span>
          {orderData.isCanceled && (
            <div className="mt-1">
              <AlertCircle size={14} className="text-red-500" />
            </div>
          )}
        </div>

        {/* Remove Button */}
        {onRemove && (
          <button
            data-remove-button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="p-1 hover:bg-gray-100 rounded-full flex-shrink-0 ml-2"
          >
            <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {/* Mini Order Detail Modal */}
      <MiniOrderDetail
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        orderData={fullOrderData}
        loading={loading}
      />
    </>
  );
};