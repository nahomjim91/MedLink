import { X, Receipt, Package, Calendar, User, Building2, CreditCard, Truck, AlertCircle } from 'lucide-react';

// MiniOrderDetail Component
const MiniOrderDetail = ({ isOpen, onClose, orderData, loading }) => {
  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!orderData) return null;

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const InfoRow = ({ icon: Icon, label, value, className = "" }) => (
    <div className={`flex items-center gap-2 py-2 ${className}`}>
      <Icon size={16} className="text-gray-500 flex-shrink-0" />
      <span className="text-sm font-medium text-gray-700 min-w-0 flex-shrink-0">{label}:</span>
      <span className="text-sm text-gray-600 truncate">{value || "N/A"}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Receipt size={20} className="text-blue-500" />
            <h2 className="text-xl font-bold text-secondary">Order Details</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col lg:flex-row h-full max-h-[calc(90vh-80px)]">
          {/* Left side - Order Summary */}
          <div className="w-full lg:w-1/2 p-4 border-r border-gray-200 overflow-y-auto">
            {/* Order Header Info */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-2xl font-bold text-secondary">
                  Order #{orderData.orderNumber || orderData.orderId}
                </h1>
                <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(orderData.status)}`}>
                  {orderData.status}
                </div>
              </div>
              
              <div className="text-2xl font-bold text-secondary mb-2">
                ${orderData.totalCost?.toFixed(2) || "0.00"}
              </div>
              
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>{orderData.totalItems || 0} items</span>
                <span>•</span>
                <span>{orderData.totalQuantity || 0} total quantity</span>
              </div>
            </div>

            {/* Order Info */}
            <div className="space-y-1 mb-4 pb-4 border-b border-gray-200">
              <InfoRow icon={Calendar} label="Order Date" value={formatDate(orderData.orderDate)} />
              <div className="flex items-center gap-2 py-2">
                <CreditCard size={16} className="text-gray-500 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-700 min-w-0 flex-shrink-0">Payment Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs ${getPaymentStatusColor(orderData.paymentStatus)}`}>
                  {orderData.paymentStatus}
                </span>
              </div>
              <InfoRow icon={Receipt} label="Transaction ID" value={orderData.transactionId} />
              {orderData.pickupScheduledDate && (
                <InfoRow icon={Truck} label="Pickup Scheduled" value={formatDate(orderData.pickupScheduledDate)} />
              )}
              {orderData.pickupConfirmedDate && (
                <InfoRow icon={Truck} label="Pickup Confirmed" value={formatDate(orderData.pickupConfirmedDate)} />
              )}
            </div>

            {/* Buyer & Seller Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 pb-4 border-b border-gray-200">
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-1">
                  <User size={14} />
                  Buyer
                </h4>
                <p className="text-sm text-blue-700 font-medium">
                  {orderData.buyerCompanyName || orderData.buyerName}
                </p>
                {orderData.buyerContact && (
                  <div className="text-xs text-blue-600 mt-1">
                    {typeof orderData.buyerContact === 'string' ? (
                      orderData.buyerContact
                    ) : (
                      <div className="space-y-1">
                        {orderData.buyerContact.phone && <div>📞 {orderData.buyerContact.phone}</div>}
                        {orderData.buyerContact.email && <div>✉️ {orderData.buyerContact.email}</div>}
                        {orderData.buyerContact.address && (
                          <div>📍 {
                            typeof orderData.buyerContact.address === 'string' 
                              ? orderData.buyerContact.address
                              : [
                                  orderData.buyerContact.address.street,
                                  orderData.buyerContact.address.city,
                                  orderData.buyerContact.address.state,
                                  orderData.buyerContact.address.country,
                                  orderData.buyerContact.address.postalCode
                                ].filter(Boolean).join(', ')
                          }</div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                <h4 className="font-medium text-green-900 mb-2 flex items-center gap-1">
                  <Building2 size={14} />
                  Seller
                </h4>
                <p className="text-sm text-green-700 font-medium">
                  {orderData.sellerCompanyName || orderData.sellerName}
                </p>
                {orderData.sellerContact && (
                  <div className="text-xs text-green-600 mt-1">
                    {typeof orderData.sellerContact === 'string' ? (
                      orderData.sellerContact
                    ) : (
                      <div className="space-y-1">
                        {orderData.sellerContact.phone && <div>📞 {orderData.sellerContact.phone}</div>}
                        {orderData.sellerContact.email && <div>✉️ {orderData.sellerContact.email}</div>}
                        {orderData.sellerContact.address && (
                          <div>📍 {
                            typeof orderData.sellerContact.address === 'string' 
                              ? orderData.sellerContact.address
                              : [
                                  orderData.sellerContact.address.street,
                                  orderData.sellerContact.address.city,
                                  orderData.sellerContact.address.state,
                                  orderData.sellerContact.address.country,
                                  orderData.sellerContact.address.postalCode
                                ].filter(Boolean).join(', ')
                          }</div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            {orderData.notes && (
              <div className="mb-4 pb-4 border-b border-gray-200">
                <h3 className="font-semibold text-secondary mb-2">Notes</h3>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                  {orderData.notes}
                </p>
              </div>
            )}

            {/* Cancellation Info */}
            {orderData.isCanceled && (
              <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                <h4 className="font-medium text-red-900 mb-1 flex items-center gap-1">
                  <AlertCircle size={14} />
                  Cancellation Details
                </h4>
                <p className="text-sm text-red-700">
                  Cancelled by: {orderData.cancelledBy}
                </p>
                {orderData.cancelledAt && (
                  <p className="text-xs text-red-600">
                    {formatDate(orderData.cancelledAt)}
                  </p>
                )}
                {orderData.cancellationReason && (
                  <p className="text-sm text-red-700 mt-1">
                    Reason: {orderData.cancellationReason}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Right side - Order Items */}
          <div className="w-full lg:w-1/2 overflow-y-auto">
            <div className="p-4">
              <h3 className="font-semibold text-secondary mb-3 flex items-center gap-2">
                <Package size={18} />
                Order Items ({orderData.items?.length || 0})
              </h3>
              
              <div className="space-y-4">
                {orderData.items?.map((item, index) => (
                  <div key={item.orderItemId || index} className="border border-gray-200 rounded-lg p-4">
                    {/* Item Header */}
                    <div className="flex items-start gap-3 mb-3">
                      {item.productImage ? (
                        <img
                          src={process.env.NEXT_PUBLIC_MEDICAL_SUPPLIES_API_URL+item.productImage}
                          alt={item.productName}
                          className="w-12 h-12 object-contain rounded border"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded border flex items-center justify-center">
                          <Package size={16} className="text-gray-400" />
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-secondary truncate">
                          {item.productName}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {item.productCategory} • {item.productType}
                        </p>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-sm text-gray-600">
                            Qty: {item.totalQuantity}
                          </span>
                          <span className="font-medium text-secondary">
                            ${item.totalPrice?.toFixed(2) || "0.00"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Batch Items */}
                    {item.batchItems && item.batchItems.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium text-gray-700">
                          Batches ({item.batchItems.length})
                        </h5>
                        {item.batchItems.map((batch, batchIndex) => (
                          <div
                            key={batch.orderBatchItemId || batchIndex}
                            className="bg-gray-50 rounded p-3 text-sm"
                          >
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <span className="text-gray-600">Qty: </span>
                                <span className="font-medium">{batch.quantity}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Unit: </span>
                                <span className="font-medium">${batch.unitPrice?.toFixed(2) || "0.00"}</span>
                              </div>
                              {batch.lotNumber && (
                                <div className="col-span-2">
                                  <span className="text-gray-600">Lot: </span>
                                  <span className="font-medium">{batch.lotNumber}</span>
                                </div>
                              )}
                              {batch.expiryDate && (
                                <div className="col-span-2">
                                  <span className="text-gray-600">Exp: </span>
                                  <span className="font-medium">{formatDate(batch.expiryDate)}</span>
                                </div>
                              )}
                              {batch.batchSellerName && (
                                <div className="col-span-2">
                                  <span className="text-gray-600">Seller: </span>
                                  <span className="font-medium">{batch.batchSellerName}</span>
                                </div>
                              )}
                              <div className="col-span-2 text-right">
                                <span className="font-semibold text-secondary">
                                  Subtotal: ${batch.subtotal?.toFixed(2) || "0.00"}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MiniOrderDetail;