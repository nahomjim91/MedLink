// components/OrderRowActions.js
import React, { useState } from 'react';
import { Button } from '../../ui/Button';
import { getAvailableStatusTransitions, getStatusColor } from '../../../utils/orderUtils';

export const OrderRowActions = ({ 
  order, 
  userRole, 
  userPerspective,
  onStatusUpdate,
  onSchedulePickup,
  onCancelOrder,
  onViewDetails 
}) => {
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const availableTransitions = getAvailableStatusTransitions(
    order.status, 
    userRole, 
    userPerspective
  );

  const handleStatusUpdate = async () => {
    if (!selectedStatus) return;
    
    setIsLoading(true);
    try {
      await onStatusUpdate(order.orderId, selectedStatus);
      setIsUpdateDialogOpen(false);
      setSelectedStatus('');
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    const reason = prompt('Please provide a reason for cancellation:');
    if (!reason) return;
    
    setIsLoading(true);
    try {
      await onCancelOrder(order.orderId, reason);
    } catch (error) {
      console.error('Error cancelling order:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSchedulePickup = async () => {
    const dateInput = prompt('Enter pickup date (YYYY-MM-DD):');
    if (!dateInput) return;
    
    const pickupDate = new Date(dateInput);
    if (isNaN(pickupDate.getTime())) {
      alert('Please enter a valid date');
      return;
    }

    setIsLoading(true);
    try {
      await onSchedulePickup(order.orderId, pickupDate);
    } catch (error) {
      console.error('Error scheduling pickup:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="px-4 py-3 bg-gray-50 border-t">
      <div className="space-y-3">
        {/* Order Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium text-gray-700">Order Details:</p>
            <p className="text-gray-600">Order ID: {order.orderNumber}</p>
            <p className="text-gray-600">
              {userPerspective === 'buyer' ? 'Seller' : 'Customer'}: {
                userPerspective === 'buyer' ? 
                (order.sellerCompanyName || order.sellerName) :
                (order.buyerCompanyName || order.buyerName)
              }
            </p>
            <p className="text-gray-600">Items: {order.totalItems}</p>
            <p className="text-gray-600">Total: ${order.totalCost?.toFixed(2)}</p>
          </div>
          <div>
            <p className="font-medium text-gray-700">Status Information:</p>
            <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
              {order.status}
            </div>
            <p className="text-gray-600 mt-1">Payment: {order.paymentStatus}</p>
            {order.pickupScheduledDate && (
              <p className="text-gray-600">
                Pickup: {new Date(order.pickupScheduledDate).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 flex-wrap">
          {/* Status Update Button */}
          {availableTransitions.length > 0 && (
            <>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsUpdateDialogOpen(true)}
                disabled={isLoading}
              >
                Update Status
              </Button>
              
              {/* Status Update Dialog */}
              {isUpdateDialogOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                    <h3 className="text-lg font-medium mb-4">Update Order Status</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select New Status:
                        </label>
                        <select
                          value={selectedStatus}
                          onChange={(e) => setSelectedStatus(e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Choose status...</option>
                          {availableTransitions.map(transition => (
                            <option key={transition.value} value={transition.value}>
                              {transition.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setIsUpdateDialogOpen(false);
                            setSelectedStatus('');
                          }}
                          disabled={isLoading}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={handleStatusUpdate}
                          disabled={!selectedStatus || isLoading}
                        >
                          {isLoading ? 'Updating...' : 'Update'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Schedule Pickup Button */}
          {(order.status === 'READY_FOR_PICKUP' && userPerspective === 'seller') && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSchedulePickup}
              disabled={isLoading}
            >
              Schedule Pickup
            </Button>
          )}

          {/* Cancel Order Button */}
          {(['PENDING_CONFIRMATION', 'CONFIRMED'].includes(order.status)) && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancelOrder}
              disabled={isLoading}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              Cancel Order
            </Button>
          )}

          {/* View Details Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(order)}
            disabled={isLoading}
          >
            View Details
          </Button>

          {/* Download Invoice/Receipt */}
          {['COMPLETED', 'PICKUP_CONFIRMED'].includes(order.status) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => console.log('Download invoice for:', order.orderId)}
              disabled={isLoading}
            >
              Download Invoice
            </Button>
          )}
        </div>

        {/* Additional Information */}
        {order.notes && (
          <div className="mt-3 p-2 bg-blue-50 rounded">
            <p className="text-sm text-blue-800">
              <span className="font-medium">Notes:</span> {order.notes}
            </p>
          </div>
        )}

        {order.cancellationReason && (
          <div className="mt-3 p-2 bg-red-50 rounded">
            <p className="text-sm text-red-800">
              <span className="font-medium">Cancellation Reason:</span> {order.cancellationReason}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};