"use client";
import { useMSAuth } from "../../../../../hooks/useMSAuth";
import { useMemo, useState, useEffect } from "react";
import { DateInput } from "../../../components/ui/Input";
import { Button, StepButtons } from "../../../components/ui/Button";
import Image from "next/image";
import { apiRequest } from "../../../utils/api";
import { useLazyQuery, useMutation, useQuery } from "@apollo/client";
import { CREATE_ORDER_DIRECTLY } from "../../../api/graphql/order/orderMutation";
import {
  UPDATE_DRUG_BATCH_QUANTITY,
  UPDATE_EQUIPMENT_BATCH_QUANTITY,
} from "../../../api/graphql/product/productMutations";
import { useRouter } from "next/navigation";
import { GET_BATCH_CURRENT_QUANTITY } from "../../../api/graphql/product/productQueries";
import { GET_MS_USER_BY_ID } from "../../../api/graphql/queries";
import client from "../../../api/graphql/client";
import { MapPin } from "lucide-react";
import { CREATE_TRANSACTION } from "../../../api/graphql/transaction/transactionMutation";

// Method 1: Popup Window Approach
function ChapaPopup({
  checkoutUrl,
  txRef,
  onClose,
  onSuccess,
  onError,
  orderInfo,
}) {
  const [popupWindow, setPopupWindow] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("waiting"); // 'waiting', 'processing', 'verifying', 'success'
  const [timeoutId, setTimeoutId] = useState(null);

  useEffect(() => {
    // Open popup window immediately
    openPaymentWindow();

    return () => {
      if (popupWindow && !popupWindow.closed) {
        popupWindow.close();
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  const openPaymentWindow = () => {
    // Calculate center position
    const width = 600;
    const height = 700;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    const popup = window.open(
      checkoutUrl,
      "chapaPayment",
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes,status=yes,toolbar=no,menubar=no,location=yes`
    );

    if (!popup) {
      onError({
        message:
          "Popup blocked. Please allow popups for this site and try again.",
      });
      return;
    }

    setPopupWindow(popup);

    // Monitor popup window
    const checkInterval = setInterval(() => {
      try {
        // Check if popup is closed
        if (popup.closed) {
          clearInterval(checkInterval);
          setIsProcessing(true);
          setProcessingStatus("processing");

          // Give some time for the payment to process
          setTimeout(() => {
            checkPaymentStatus();
          }, 2000);
        }
      } catch (error) {
        console.error("Error monitoring popup:", error);
      }
    }, 1000);

    // Set timeout (15 minutes)
    const timeout = setTimeout(() => {
      if (!popup.closed) {
        popup.close();
      }
      clearInterval(checkInterval);
      onError({ message: "Payment timeout. Please try again." });
    }, 15 * 60 * 1000);

    setTimeoutId(timeout);
  };

  const checkPaymentStatus = async () => {
    try {
      setIsVerifying(true);
      setProcessingStatus("verifying");

      // Poll backend to check payment status
      const response = await apiRequest(`/api/payments/status/${txRef}`, {
        method: "GET",
      });

      if (response.success && response.data.status === "success") {
        setProcessingStatus("success");

        // Show success message briefly before calling onSuccess
        setTimeout(() => {
          onSuccess(response.data);
        }, 1500);
      } else if (response.data.status === "failed") {
        onError({ message: "Payment failed or was cancelled." });
      } else {
        // Payment might still be processing, check again after delay
        setTimeout(() => {
          checkPaymentStatus();
        }, 3000);
      }
    } catch (error) {
      console.error("Error checking payment status:", error);
      onError({
        message: "Unable to verify payment status. Please contact support.",
      });
    } finally {
      setIsProcessing(false);
      setIsVerifying(false);
    }
  };

  const getStatusContent = () => {
    switch (processingStatus) {
      case "processing":
        return {
          icon: "⏳",
          title: "Processing Payment...",
          message: "Please wait while we process your payment.",
          showSpinner: true,
        };
      case "verifying":
        return {
          icon: "🔍",
          title: "Verifying Payment...",
          message:
            "We're verifying your payment with the bank. This may take a moment.",
          showSpinner: true,
        };
      case "success":
        return {
          icon: "✅",
          title: "Payment Successful!",
          message: "Your payment has been verified and processed successfully.",
          showSpinner: false,
        };
      default:
        return {
          icon: "💳",
          title: "Payment Window Opened",
          message:
            "Complete your payment in the popup window. This dialog will close automatically when payment is complete.",
          showSpinner: false,
        };
    }
  };

  const statusContent = getStatusContent();
  const isInProgress =
    isProcessing || isVerifying || processingStatus === "success";

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0,0,0,0.8)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          backgroundColor: "#fff",
          padding: "40px",
          borderRadius: "12px",
          textAlign: "center",
          maxWidth: "400px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        }}
      >
        {statusContent.showSpinner && (
          <div
            style={{
              width: "50px",
              height: "50px",
              border: "4px solid #f3f3f3",
              borderTop: "4px solid #14b8a6",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 20px",
            }}
          />
        )}

        {!statusContent.showSpinner && (
          <div
            style={{
              width: "60px",
              height: "60px",
              backgroundColor:
                processingStatus === "success" ? "#10b981" : "#14b8a6",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
              color: "white",
              fontSize: "24px",
            }}
          >
            {statusContent.icon}
          </div>
        )}

        <h3 style={{ margin: "0 0 15px 0", color: "#1f2937" }}>
          {statusContent.title}
        </h3>

        <p style={{ color: "#6b7280", margin: "0 0 20px 0" }}>
          {statusContent.message}
        </p>

        {processingStatus === "waiting" && (
          <div
            style={{
              backgroundColor: "#f9fafb",
              padding: "15px",
              borderRadius: "8px",
              marginBottom: "20px",
              fontSize: "14px",
            }}
          >
            <p style={{ margin: "0 0 5px 0" }}>
              <strong>Order:</strong> #{orderInfo?.orderNumber}
            </p>
            <p style={{ margin: "0 0 5px 0" }}>
              <strong>Seller:</strong> {orderInfo?.sellerName}
            </p>
            <p style={{ margin: "0" }}>
              <strong>Amount:</strong> {orderInfo?.totalCost?.toFixed(2)} ETB
            </p>
          </div>
        )}

        {processingStatus !== "success" && (
          <button
            onClick={onClose}
            style={{
              backgroundColor: "#6b7280",
              color: "white",
              border: "none",
              padding: "10px 20px",
              borderRadius: "6px",
              cursor: isInProgress ? "not-allowed" : "pointer",
              fontSize: "14px",
              opacity: isInProgress ? 0.6 : 1,
            }}
            disabled={isInProgress}
          >
            {isInProgress ? "Please Wait..." : "Cancel"}
          </button>
        )}
      </div>

      <style jsx>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

// Enhanced Step Progress Component
function StepProgress({ currentStep }) {
  const steps = [
    {
      number: 1,
      title: "Order Summary",
      icon: "📋",
      description: "Review your order details",
    },
    {
      number: 2,
      title: "Payment",
      icon: "💳",
      description: "Complete your payment",
    },
    {
      number: 3,
      title: "Confirmation",
      icon: "✅",
      description: "Order confirmed",
    },
  ];

  return (
    <div className="w-80 bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-xl p-6 shadow-lg">
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-2">Checkout Progress</h3>
        <div className="w-full bg-white/20 rounded-full h-2">
          <div
            className="bg-white rounded-full h-2 transition-all duration-500 ease-out"
            style={{ width: `${(currentStep / 3) * 100}%` }}
          ></div>
        </div>
      </div>

      <div className="space-y-6">
        {steps.map((step, index) => {
          const isActive = currentStep === step.number;
          const isCompleted = currentStep > step.number;
          const isUpcoming = currentStep < step.number;

          return (
            <div key={step.number} className="relative">
              {/* Step Item */}
              <div
                className={`flex items-start gap-4 transition-all duration-300 ${
                  isActive ? "transform scale-105" : ""
                } ${isUpcoming ? "opacity-60" : "opacity-100"}`}
              >
                {/* Step Circle */}
                <div
                  className={`
                  flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-semibold text-lg
                  transition-all duration-300 shadow-lg
                  ${
                    isActive
                      ? "bg-white text-teal-600 ring-4 ring-white/30"
                      : isCompleted
                      ? "bg-white text-teal-600"
                      : "bg-white/20 text-white border-2 border-white/40"
                  }
                `}
                >
                  {isCompleted ? (
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    <span>{step.number}</span>
                  )}
                </div>

                {/* Step Content */}
                <div className="flex-1 min-w-0">
                  <div
                    className={`font-semibold text-base mb-1 ${
                      isActive
                        ? "text-white"
                        : isCompleted
                        ? "text-white/90"
                        : "text-white/70"
                    }`}
                  >
                    {step.title}
                  </div>
                  <div
                    className={`text-sm leading-relaxed ${
                      isActive
                        ? "text-white/90"
                        : isCompleted
                        ? "text-white/70"
                        : "text-white/50"
                    }`}
                  >
                    {step.description}
                  </div>

                  {/* Active Step Indicator */}
                  {isActive && (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      <span className="text-xs text-white/80 font-medium">
                        In Progress
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={`
                  ml-6 w-px h-8 transition-all duration-500
                  ${isCompleted ? "bg-white/60" : "bg-white/20"}
                `}
                ></div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary Section */}
      <div className="mt-8 pt-6 border-t border-white/20">
        <div className="text-center">
          <div className="text-sm text-white/70 mb-1">Step</div>
          <div className="text-xl font-bold">
            {currentStep} of {steps.length}
          </div>
        </div>
      </div>
    </div>
  );
}

// Step 1: Order Summary Component
function OrderSummaryStep({
  orders,
  currentOrderIndex,
  setCurrentOrderIndex,
  pickupDates,
  setPickupDates,
  onNext,
}) {
  const { user, loading: userLoading } = useMSAuth();
  const [showMapModal, setShowMapModal] = useState(false);

  const currentOrder = orders[currentOrderIndex];

  const { data: sellerData, loading: otherUserLoading } = useQuery(
    GET_MS_USER_BY_ID,
    {
      variables: {
        userId: currentOrder?.sellerId,
      },
      skip: !currentOrder || !user || !user.userId,
      fetchPolicy: "network-only",
    }
  );

  const seller = sellerData?.msUserById;

  const handleDateChange = (e) => {
    const newDates = { ...pickupDates };
    newDates[currentOrder.orderId] = e.target.value;
    setPickupDates(newDates);
  };

  const handleNext = () => {
    // Check if there are more orders to process
    if (currentOrderIndex < orders.length - 1) {
      // Move to next order
      setCurrentOrderIndex(currentOrderIndex + 1);
    } else {
      // All orders processed, proceed to next step
      onNext();
    }
  };

  const handleShowMap = () => {
    setShowMapModal(true);
  };

  // Check if current order has pickup date selected
  const canProceed = pickupDates[currentOrder.orderId];

  // Check if all orders have pickup dates (for validation)
  const allOrdersHavePickupDates = orders.every(
    (order) => pickupDates[order.orderId]
  );

  // Map Modal Component
  const MapModal = () => {
    if (!showMapModal) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Pickup Location</h3>
            <button
              onClick={() => setShowMapModal(false)}
              className="text-gray-500 hover:text-gray-700 text-xl"
            >
              ×
            </button>
          </div>

          {/* Seller Info */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-800 mb-2">
              {currentOrder.sellerName}
            </h4>
            <div className="space-y-1 text-sm text-gray-600">
              <p>
                <span className="font-medium">Street:</span>{" "}
                {seller?.address?.street || "N/A"}
              </p>
              <p>
                <span className="font-medium">City:</span>{" "}
                {seller?.address?.city || "N/A"}
              </p>
              <p>
                <span className="font-medium">State:</span>{" "}
                {seller?.address?.state || "N/A"}
              </p>
              <p>
                <span className="font-medium">Country:</span>{" "}
                {seller?.address?.country || "N/A"}
              </p>
              <p>
                <span className="font-medium">Postal Code:</span>{" "}
                {seller?.address?.postalCode || "N/A"}
              </p>
              {seller?.address?.geoLocation && (
                <p>
                  <span className="font-medium">Coordinates:</span>{" "}
                  {seller.address.geoLocationText}
                </p>
              )}
            </div>
          </div>

          {/* Map Placeholder */}
          <div className="bg-gray-100 rounded-lg h-60 flex items-center justify-center mb-4">
            <div className="text-center text-gray-500">
              <div className="text-4xl mb-2">🗺️</div>
              <p className="text-sm">Google Maps will be displayed here</p>
              <p className="text-xs mt-1">Integration pending</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => {
                if (seller?.address?.geoLocation) {
                  const { latitude, longitude } = seller.address.geoLocation;
                  window.open(
                    `https://www.google.com/maps?q=${latitude},${longitude}`,
                    "_blank"
                  );
                }
              }}
              disabled={!seller?.address?.geoLocation}
              className="flex-1 bg-primary/70 text-white py-2 px-4 rounded-lg hover:bg-primary disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
            >
              Open in Google Maps
            </button>
            <button
              onClick={() => setShowMapModal(false)}
              className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-white hover:border-error hover:border hover:text-error text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="flex gap-6">
        {/* Left Panel - Order Details */}
        <div className="flex-1 bg-white rounded-lg p-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">
              Order #{currentOrder.orderNumber}
            </h2>
            {orders.length > 1 && (
              <div className="flex gap-2">
                {orders.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentOrderIndex(index)}
                    className={`w-8 h-8 rounded-full text-sm font-medium transition-all ${
                      index === currentOrderIndex
                        ? "bg-teal-500 text-white shadow-lg scale-110"
                        : pickupDates[orders[index].orderId]
                        ? "bg-green-500 text-white" // Completed orders
                        : "bg-primary/20 text-secondary/60 hover:bg-gray-300"
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="h-[35vh] overflow-y-auto">
            <div className="mb-6">
              <h3 className="font-medium text-secondary/80 mb-2">
                {currentOrder.sellerName}
              </h3>

              <div className="bg-white rounded-lg border border-primary/10 overflow-hidden">
                {/* Table Header */}
                <div className="bg-primary/10 border-b border-primary/10">
                  <div className="grid grid-cols-12 gap-4 px-4 py-3 text-sm font-medium text-secondary/60">
                    <span className="col-span-5">Item</span>
                    <span className="col-span-2 text-center">Quantity</span>
                    <span className="col-span-2 text-center">Unit Price</span>
                    <span className="col-span-3 text-right">Total</span>
                  </div>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-gray-100">
                  {currentOrder.items.map((item) => (
                    <div key={item.orderItemId}>
                      {item.batchItems.map((batchItem, index) => (
                        <div
                          key={batchItem.orderBatchItemId}
                          className="grid grid-cols-12 gap-4 px-4 py-3 text-sm hover:bg-gray-50 transition-colors"
                        >
                          <span className="col-span-5 text-secondary/90 font-medium">
                            {item.productName}
                          </span>
                          <span className="col-span-2 text-center text-secondary/60">
                            × {batchItem.quantity}
                          </span>
                          <span className="col-span-2 text-center text-secondary/60">
                            ${batchItem.unitPrice}
                          </span>
                          <span className="col-span-3 text-right text-gray-900 font-medium">
                            ${batchItem.subtotal.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                {/* Subtotal Footer */}
                <div className="bg-primary/10 border-t border-primary/10">
                  <div className="grid grid-cols-12 gap-4 px-4 py-3">
                    <div className="col-span-9"></div>
                    <div className="col-span-3">
                      <div className="flex justify-between text-base font-semibold text-gray-900">
                        <span>Subtotal</span>
                        <span>${currentOrder.totalCost.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pickup Section */}
          <div className="bg-primary/4 rounded-xl p-4 space-">
            <div className="flex gap-6 items-start">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-teal-500 rounded-full"></div>
                <span className="font-medium text-gray-800">Pick up</span>
              </div>
              <DateInput
                label="Select Pickup Date"
                name={`pickupDate_${currentOrder.orderId}`}
                value={pickupDates[currentOrder.orderId] || ""}
                onChange={handleDateChange}
                min={new Date().toISOString().split("T")[0]}
                required
                className="flex-1 max-w-xs"
              />
            </div>

            {/* Seller Location Details */}
            <div className="pl-6 ">
              <div className="flex justify-between items-start">
                <h4 className="text-sm font-medium text-gray-700">
                  Pickup Location
                </h4>
                <button
                  onClick={handleShowMap}
                  className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/30 transition-colors text-sm"
                >
                  <MapPin size={16} />
                  View Map
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 block">Street Address</span>
                  <p className="text-gray-800 font-medium">
                    {seller?.address?.street || "Not provided"}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 block">City</span>
                  <p className="text-gray-800 font-medium">
                    {seller?.address?.city || "Not provided"}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 block">State</span>
                  <p className="text-gray-800 font-medium">
                    {seller?.address?.state || "Not provided"}
                  </p>
                </div>

                {seller?.address?.geoLocation && (
                  <div>
                    <span className="text-gray-500 block">Coordinates</span>
                    <p className="text-gray-800 font-medium text-xs">
                      {seller.address.geoLocationText}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Show progress indicator for multiple orders */}
          {orders.length > 1 && (
            <div className="mt-4 text-center text-sm text-gray-600">
              Order {currentOrderIndex + 1} of {orders.length}
              {!allOrdersHavePickupDates && (
                <span className="block text-amber-600 mt-1">
                  Complete all orders before proceeding to next step
                </span>
              )}
            </div>
          )}

          <StepButtons
            onPrevious={() => {
              /* Back to cart */
            }}
            onNext={handleNext}
            previousLabel="Back to Cart"
            nextLabel={
              orders.length > 1 && currentOrderIndex < orders.length - 1
                ? "Next Order"
                : orders.length > 1 && !allOrdersHavePickupDates
                ? "Complete All Orders"
                : "Next Step"
            }
            showPrevious={true}
            showNext={canProceed}
          />
        </div>

        <StepProgress currentStep={1} />
      </div>

      {/* Map Modal */}
      <MapModal />
    </>
  );
}
// Step 2: Payment Component
function PaymentStep({
  orders,
  pickupDates,
  onPrevious,
  onNext,
  onPayOrder,
  paymentLoading,
  paymentError,
  paidOrders = [], // Track which orders are paid
  onDismissError,
}) {
  const allOrdersPaid = orders.every((order) =>
    paidOrders.includes(order.orderId)
  );

  return (
    <div className="flex gap-6 h-[85vh]">
      {/* Left Panel - Payment Details */}
      <div className="flex-1 bg-white rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-6">Payment</h2>

        {paymentError && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            <div className="flex justify-between items-start">
              <p className="text-sm">{paymentError}</p>
              <button
                onClick={onDismissError}
                className="text-red-700 hover:text-red-900 ml-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}

        <div className="space-y-6 h-[65vh] overflow-y-auto">
          {orders.map((order, index) => {
            const isPaid = paidOrders.includes(order.orderId);
            const isLoading = paymentLoading === order.orderId;

            return (
              <div
                key={order.orderId}
                className={`border-b border-secondary/30 pb-4 last:border-b-0 ${
                  isPaid ? "bg-green-50" : ""
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-medium">
                      Order #{order.orderNumber} Cost
                    </h3>
                    <p className="text-sm text-gray-600 mb-1">
                      Seller: {order.sellerName}
                    </p>
                    <p className="text-2xl font-bold text-teal-600">
                      ${order.totalCost.toFixed(2)}
                    </p>
                  </div>

                  {isPaid ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="font-medium">Paid</span>
                    </div>
                  ) : (
                    <Button
                      variant="fill"
                      color="primary"
                      onClick={() => onPayOrder(order)}
                      disabled={isLoading || !pickupDates[order.orderId]}
                      className={`bg-pr-500 hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed ${
                        isLoading ? "animate-pulse" : ""
                      }`}
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Processing...
                        </div>
                      ) : (
                        "Pay Now"
                      )}
                    </Button>
                  )}
                </div>

                <div className="space-y-2 text-sm text-secondary/60">
                  <div className="flex justify-between">
                    <span>Status</span>
                    <span
                      className={isPaid ? "text-green-500" : "text-orange-500"}
                    >
                      {isPaid ? "Paid" : "Pending Payment"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Order No.</span>
                    <span>#{order.orderId.slice(-8)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Transaction</span>
                    <span>#{order.transactionId || "Pending"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pickup Date</span>
                    <span>
                      {pickupDates[order.orderId]
                        ? new Date(
                            pickupDates[order.orderId]
                          ).toLocaleDateString()
                        : "Not set"}
                    </span>
                  </div>
                </div>

                {!pickupDates[order.orderId] && !isPaid && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-700">
                      Please set a pickup date in the previous step before
                      making payment.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <StepButtons
          onPrevious={onPrevious}
          onNext={allOrdersPaid ? onNext : undefined}
          previousLabel="Previous"
          nextLabel="Continue to Confirmation"
          showPrevious={true}
          showNext={allOrdersPaid}
        />
      </div>

      {/* Right Panel - Progress */}
      <StepProgress currentStep={2} />
    </div>
  );
}

// Step 3: Finished Component
function FinishedStep({ onNext }) {
  return (
    <div className="flex gap-6 h-[85vh] overflow-hidden">
      {/* Left Panel - Success Message */}
      <div className="flex-1 bg-white rounded-lg p-6 shadow-sm">
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold mb-8">Order Complete!</h2>
          <h3 className="text-xl mb-8 text-gray-600">
            Thank you for your order
          </h3>

          <div className="flex flex-col items-center justify-center space-y-4">
            <Image
              src={`/Image/certificate-success-filled.svg`} // Assuming you have a 'No data-cuate.svg' for rejected
              alt={`success`}
              width={300}
              height={200}
              className="mx-auto"
            />
          </div>

          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Your order has been successfully placed and is being processed. You
            will receive an email confirmation shortly.
          </p>

          <Button
            variant="fill"
            color="primary"
            onClick={onNext}
            className="bg-teal-500 hover:bg-teal-600"
          >
            View Orders
          </Button>
        </div>
      </div>

      {/* Right Panel - Progress */}
      <StepProgress currentStep={3} />
    </div>
  );
}

// Helper function to categorize cart items by seller
const categorizeCartBySeller = (cart, user, seller) => {
  if (!cart?.items || !user) return [];

  const sellerGroups = {};

  cart.items.forEach((item) => {
    item.batchItems.forEach((batchItem) => {
      const sellerId = batchItem.batchSellerId;
      const sellerName = batchItem.batchSellerName;

      if (!sellerGroups[sellerId]) {
        sellerGroups[sellerId] = {
          sellerId,
          sellerName,
          items: {},
          totalItems: 0,
          totalCost: 0,
        };
      }

      if (!sellerGroups[sellerId].items[item.productId]) {
        sellerGroups[sellerId].items[item.productId] = {
          productId: item.productId,
          productName: item.productName,
          productType: item.productType,
          productImage: item.productImage,
          batchItems: [],
          totalQuantity: 0,
          totalPrice: 0,
        };
      }

      const orderBatchItem = {
        batchId: batchItem.batchId,
        productId: batchItem.productId,
        quantity: batchItem.quantity,
        unitPrice: batchItem.unitPrice,
        subtotal: batchItem.quantity * batchItem.unitPrice,
        expiryDate: batchItem.expiryDate,
      };

      sellerGroups[sellerId].items[item.productId].batchItems.push(
        orderBatchItem
      );
      sellerGroups[sellerId].items[item.productId].totalQuantity +=
        batchItem.quantity;
      sellerGroups[sellerId].items[item.productId].totalPrice +=
        orderBatchItem.subtotal;

      sellerGroups[sellerId].totalItems += batchItem.quantity;
      sellerGroups[sellerId].totalCost += orderBatchItem.subtotal;
    });
  });

  return Object.values(sellerGroups).map((sellerGroup, index) => ({
    orderId: `order_${Date.now()}_${index}`,
    orderNumber: index + 1,
    buyerId: user.userId,
    buyerName: user.contactName,
    buyerCompanyName: user.companyName,
    buyerContactInfo: {
      email: user.email,
      phone: user.phoneNumber,
      address: user.address,
    },
    sellerId: sellerGroup.sellerId,
    sellerName: sellerGroup.sellerName,
    items: Object.values(sellerGroup.items).map((item) => ({
      orderItemId: `item_${Date.now()}_${item.productId}`,
      productId: item.productId,
      productName: item.productName,
      productType: item.productType,
      batchItems: item.batchItems.map((batchItem) => ({
        orderBatchItemId: `batch_${Date.now()}_${batchItem.batchId}`,
        ...batchItem,
        createdAt: new Date().toISOString(),
      })),
      totalQuantity: item.totalQuantity,
      totalPrice: item.totalPrice,
      createdAt: new Date().toISOString(),
    })),
    totalItems: sellerGroup.totalItems,
    totalCost: sellerGroup.totalCost,
    orderDate: new Date().toISOString(),
    status: "PENDING",
    paymentStatus: "PENDING",
    pickupScheduledDate: null,
    pickupConfirmedDate: null,
    transactionId: null,
    notes: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
};

export default function CheckoutPage() {
  const { user, cart, loading, removeProductFromCart } = useMSAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [currentOrderIndex, setCurrentOrderIndex] = useState(0);
  const [pickupDates, setPickupDates] = useState({});
  const [paymentLoading, setPaymentLoading] = useState(null);
  const [paymentError, setPaymentError] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [currentPayment, setCurrentPayment] = useState(null);
  const [paidOrders, setPaidOrders] = useState([]); // Track paid orders
  const [createdOrders, setCreatedOrders] = useState([]); // Track created orders
  const [inventoryErrors, setInventoryErrors] = useState({});
  const [createOrderMutation, { loading: orderCreationLoading }] = useMutation(
    CREATE_ORDER_DIRECTLY
  );
  const [updateDrugBatch] = useMutation(UPDATE_DRUG_BATCH_QUANTITY);
  const [updateEquipmentBatch] = useMutation(UPDATE_EQUIPMENT_BATCH_QUANTITY);
  const [createTransaction] = useMutation(CREATE_TRANSACTION);
  const [getBatchQuantity] = useLazyQuery(GET_BATCH_CURRENT_QUANTITY);

  // console.log("CheckoutPage - cart", cart);
  // Categorize cart items by seller
const isDataReady = !loading && user && cart;
  
  const ordersBySeller = useMemo(
    () => {
      if (!isDataReady) {
        return [];
      }
      return categorizeCartBySeller(cart, user);
    },
    [cart, user, isDataReady] // Add isDataReady to dependencies
  );

  // Show loading until everything is ready
  if (loading || !user || !cart) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p>Loading checkout...</p>
        </div>
      </div>
    );
  }

  const handleOrderSummaryNext = () => {
    setCurrentStep(2);
  };

  // Handle item removal from cart
  const handleRemoveItemsFromCart = async (order) => {
    try {
      console.log("Removing items from cart for order:", order.orderId);

      // Get unique product IDs from the order
      const productIds = order.items.map((item) => item.productId);
      const uniqueProductIds = [...new Set(productIds)];

      // Remove each product from cart
      for (const productId of uniqueProductIds) {
        try {
          await removeProductFromCart(productId);
          console.log(`Removed product ${productId} from cart`);
        } catch (error) {
          console.error(
            `Failed to remove product ${productId} from cart:`,
            error
          );
        }
      }

      console.log("Successfully removed all items from cart");
    } catch (error) {
      console.error("Failed to remove items from cart:", error);
      // Don't throw error here as payment was successful
      // Just log the error for debugging
    }
  };

  const formatOrderForGraphQL = (order, transactionId, pickupDate) => {
    return {
      orderId: order.orderId,
      orderNumber: order.orderNumber,
      buyerId: order.buyerId,
      buyerName: order.buyerName,
      buyerCompanyName: order.buyerCompanyName || "",
      buyerContactInfo: {
        email: order.buyerContactInfo.email,
        phone: order.buyerContactInfo.phone || "",
        address: order.buyerContactInfo.address
          ? {
              street: order.buyerContactInfo.address.street || "",
              city: order.buyerContactInfo.address.city || "",
              state: order.buyerContactInfo.address.state || "",
              country: order.buyerContactInfo.address.country || "",
            }
          : null,
      },
      sellerId: order.sellerId,
      sellerName: order.sellerName,
      sellerCompanyName: order.sellerCompanyName || "",
      sellerContactInfo: order.sellerContactInfo || null,
      items: order.items.map((item) => ({
        orderItemId: item.orderItemId,
        productId: item.productId,
        productName: item.productName,
        productType: item.productType,
        productCategory: item.productCategory || "",
        productImage: item.productImage || "",
        batchItems: item.batchItems.map((batchItem) => ({
          orderBatchItemId: batchItem.orderBatchItemId,
          batchId: batchItem.batchId,
          quantity: batchItem.quantity,
          unitPrice: batchItem.unitPrice,
          subtotal: batchItem.subtotal,
          expiryDate: batchItem.expiryDate || null,
          manufacturingDate: batchItem.manufacturingDate || null,
          lotNumber: batchItem.lotNumber || "",
          batchSellerId: batchItem.batchSellerId || order.sellerId,
          batchSellerName: batchItem.batchSellerName || order.sellerName,
          createdAt: batchItem.createdAt,
        })),
        totalQuantity: item.totalQuantity,
        totalPrice: item.totalPrice,
        createdAt: item.createdAt,
      })),
      totalItems: order.totalItems,
      totalCost: order.totalCost,
      orderDate: order.orderDate,
      // Use GraphQL enum values directly
      status: "PENDING_CONFIRMATION",
      paymentStatus: "PAID_HELD_BY_SYSTEM",
      pickupScheduledDate: pickupDate,
      pickupConfirmedDate: null,
      transactionId: transactionId,
      notes: order.notes || "",
    };
  };

  // Create order in GraphQL after successful payment
  const createOrderInDatabase = async (order, paymentData) => {
    try {
      console.log("Creating order in database:", order.orderId);

      const pickupDate = pickupDates[order.orderId];
      const formattedOrder = formatOrderForGraphQL(
        order,
        paymentData.transactionId || paymentData.tx_ref,
        pickupDate
      );

      console.log("Formatted order for GraphQL:", formattedOrder);

      const { data } = await createOrderMutation({
        variables: {
          input: formattedOrder,
        },
      });

      console.log("Order created successfully:", data.createOrderDirect);

      // Store the created order data
      setCreatedOrders((prev) => ({
        ...prev,
        [order.orderId]: data.createOrderDirect,
      }));

      return data.createOrderDirect;
    } catch (error) {
      console.error("Error creating order in database:", error);

      // Log the specific GraphQL errors if available
      if (error.graphQLErrors && error.graphQLErrors.length > 0) {
        error.graphQLErrors.forEach((gqlError) => {
          console.error("GraphQL Error:", gqlError.message);
          console.error("GraphQL Error Details:", gqlError);
        });
      }

      if (error.networkError) {
        console.error("Network Error:", error.networkError);
      }

      throw new Error(`Failed to create order: ${error.message}`);
    }
  };

  // Initialize payment with backend
  const initializePayment = async (order) => {
    try {
      console.log("Initializing payment for order:", order.orderId); 

      const response = await apiRequest("/api/payments/initialize", {
        method: "POST",
        body: JSON.stringify({
          orderId: order.orderId,
          amount: Number(order.totalCost).toFixed(2),
          currency: "ETB",
          customerInfo: {
            email: order.buyerContactInfo.email,
            firstName: order.buyerName.split(" ")[0] || order.buyerName,
            lastName:
              order.buyerName.split(" ").slice(1).join(" ") ||
              order.buyerCompanyName,
            phoneNumber: order.buyerContactInfo.phone || "",
          },
          orderDetails: {
            orderNumber: order.orderNumber,
            sellerId: order.sellerId,
            sellerName: order.sellerName,
            items: order.items,
            pickupDate: pickupDates[order.orderId],
          },
        }),
      });

      console.log("Payment initialization response:", response);

      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || "Payment initialization failed");
      }
    } catch (error) {
      console.error("Payment initialization error:", error);
      throw error;
    }
  };

  // Handle payment success
  const handlePaymentSuccess = async (paymentData) => {
    console.log("Payment success data received:", paymentData);
    let rollbackData = null;

    try {
      setPaymentLoading(currentPayment.order.orderId);

      // Step 1: Verify payment with backend
      const verificationResponse = await apiRequest("/api/payments/verify", {
        method: "POST",
        body: JSON.stringify({
          txRef: currentPayment.txRef,
          orderId: currentPayment.order.orderId,
          paymentData: paymentData,
        }),
      });

      if (!verificationResponse.success) {
        throw new Error(
          verificationResponse.message || "Payment verification failed"
        );
      }

      // Step 2: Update batch quantities (with rollback capability)
      rollbackData = await updateBatchQuantitiesOptimistic(
        currentPayment.order
      );
      console.log(" transaction Data", {
        buyerId: currentPayment.order.buyerId,
        sellerId: currentPayment.order.sellerId,
        transactionId: verificationResponse.data.txRef || currentPayment.txRef,
        orderId: currentPayment.order.orderId,
        chapaRef: verificationResponse.data.reference || currentPayment.txRef,
        chapaStatus: verificationResponse.data.status,
        amount:
          verificationResponse.data.amount || currentPayment.order.totalCost,
        currency: "ETB",
        status: "PAID_HELD_BY_SYSTEM",
      });
      //Step 3: create transaction in database
      await createTransaction({
        variables: {
          input: {
            buyerId: currentPayment.order.buyerId,
            sellerId: currentPayment.order.sellerId,
            transactionId:
              verificationResponse.data.txRef || currentPayment.txRef,
            orderId: currentPayment.order.orderId,
            chapaRef:
              verificationResponse.data.reference || currentPayment.txRef,
            chapaStatus: verificationResponse.data.status,
            amount:
              verificationResponse.data.amount ||
              currentPayment.order.totalCost,
            currency: "ETB",
            status: "PAID_HELD_BY_SYSTEM",
          },
        },
      });

      // Step 4: Create order in database
      const createdOrder = await createOrderInDatabase(currentPayment.order, {
        ...verificationResponse.data,
        transactionId:
          verificationResponse.data.transactionId || currentPayment.txRef,
      });

      // Step 5: Remove items from cart
      await handleRemoveItemsFromCart(currentPayment.order);

      // Step 6: Update UI state
      setPaidOrders((prev) => [...prev, currentPayment.order.orderId]);
      setShowPopup(false);
      setCurrentPayment(null);

      // Check if all orders are paid
      const allPaid = ordersBySeller.every(
        (order) =>
          paidOrders.includes(order.orderId) ||
          order.orderId === currentPayment.order.orderId
      );

      if (allPaid) {
        setTimeout(() => setCurrentStep(3), 1500);
      }
    } catch (error) {
      console.error("Payment success handling failed:", error);

      // Rollback batch quantities if we updated them
      if (rollbackData?.rollbackOperations) {
        console.log("Rolling back batch quantities due to error...");
        await rollbackBatchQuantities(rollbackData.rollbackOperations);
      }

      setPaymentError(`Payment processing failed: ${error.message}`);
    } finally {
      setPaymentLoading(null);
    }
  };

  // Handle payment error
  const handlePaymentError = (errorData) => {
    console.error("Payment error:", errorData);
    setPaymentError(
      `Payment failed: ${errorData?.message || "Unknown error occurred"}`
    );
    setShowPopup(false);
    setCurrentPayment(null);
  };

  // handler with proper validation flow
  const handlePayOrder = async (order) => {
    setPaymentError(null);
    setInventoryErrors({});
    setPaymentLoading(order.orderId);

    try {
      console.log("Starting payment process for order:", order.orderId);

      // Step 1: Real-time inventory validation
      const inventoryCheck = await validateInventoryRealTime(order);

      if (!inventoryCheck.isValid) {
        console.log("Inventory validation failed:", inventoryCheck.errors);

        setInventoryErrors({
          [order.orderId]: {
            errors: inventoryCheck.errors,
            unavailableItems: inventoryCheck.unavailableItems,
          },
        });

        // Ask user if they want to remove unavailable items
        const shouldRemove = window.confirm(
          `Some items are no longer available or have insufficient stock:\n\n${inventoryCheck.errors.join(
            "\n"
          )}\n\nWould you like to remove these items from your cart?`
        );

        if (shouldRemove && inventoryCheck.unavailableItems.length > 0) {
          await handleUnavailableItems(inventoryCheck.unavailableItems, order);
          return;
        }

        setPaymentError("Please resolve inventory issues before proceeding.");
        setPaymentLoading(null);
        return;
      }

      // Step 2: Initialize payment
      const paymentData = await initializePayment(order);

      setCurrentPayment({
        ...paymentData,
        order,
      });
      setShowPopup(true);
    } catch (error) {
      console.error("Payment initialization failed:", error);
      setPaymentError(
        error.message || "Payment initialization failed. Please try again."
      );
    } finally {
      setPaymentLoading(null);
    }
  };

  // Real-time inventory validation - fetch fresh data from database
  const validateInventoryRealTime = async (order) => {
    console.log("Validating inventory in real-time for order:", order.orderId);

    const errors = [];
    const unavailableItems = [];
    const validationPromises = [];

    try {
      // Create validation promises for each batch item
      for (const item of order.items) {
        for (const batchItem of item.batchItems) {
          const validationPromise = getBatchQuantity({
            variables: { batchId: batchItem.batchId },
          })
            .then(({ data }) => {
              const currentBatch = data?.batchById;

              if (!currentBatch) {
                errors.push(
                  `Product "${item.productName}" batch is no longer available`
                );
                unavailableItems.push({
                  productId: item.productId,
                  productName: item.productName,
                  batchId: batchItem.batchId,
                  reason: "batch_not_found",
                });
                return false;
              }

              // Check if requested quantity exceeds available quantity
              if (batchItem.quantity > currentBatch.quantity) {
                errors.push(
                  `Insufficient stock for "${item.productName}". Requested: ${batchItem.quantity}, Available: ${currentBatch.quantity}`
                );
                unavailableItems.push({
                  productId: item.productId,
                  productName: item.productName,
                  batchId: batchItem.batchId,
                  requested: batchItem.quantity,
                  available: currentBatch.quantity,
                  reason: "insufficient_stock",
                });
                return false;
              }

              return true;
            })
            .catch((error) => {
              console.error(
                `Error validating batch ${batchItem.batchId}:`,
                error
              );
              errors.push(
                `Failed to validate "${item.productName}" availability`
              );
              unavailableItems.push({
                productId: item.productId,
                productName: item.productName,
                batchId: batchItem.batchId,
                reason: "validation_error",
              });
              return false;
            });

          validationPromises.push(validationPromise);
        }
      }

      // Wait for all validation promises to resolve
      await Promise.all(validationPromises);

      if (errors.length > 0) {
        return {
          isValid: false,
          errors,
          unavailableItems,
        };
      }

      return { isValid: true };
    } catch (error) {
      console.error("Error in real-time inventory validation:", error);
      return {
        isValid: false,
        errors: ["Failed to validate inventory. Please try again."],
        unavailableItems: [],
      };
    }
  };

  // Optimistic batch quantity update with rollback capability
  const updateBatchQuantitiesOptimistic = async (order) => {
    console.log("Updating batch quantities for order:", order.orderId);
    const updateOperations = [];
    const rollbackOperations = [];
    try {
      // Prepare all update operations
      for (const item of order.items) {
        for (const batchItem of item.batchItems) {
          // Get current quantity first
          const { data } = await getBatchQuantity({
            variables: { batchId: batchItem.batchId },
          });
          const currentBatch = data?.batchById;
          if (!currentBatch) {
            throw new Error(
              `Batch ${batchItem.batchId} not found during update`
            );
          }
          const newQuantity = currentBatch.quantity - batchItem.quantity;
          if (newQuantity < 0) {
            throw new Error(
              `Insufficient stock for batch ${batchItem.batchId}`
            );
          }

          // Prepare update operation
          const productType = item.productType || "DRUG";
          let updateOperation;

          if (productType === "DRUG") {
            console.log("Update Operation:", {
              batchId: batchItem.batchId,
              input: { quantity: newQuantity },
            });
            updateOperation = {
              mutation: UPDATE_DRUG_BATCH_QUANTITY,
              variables: {
                batchId: batchItem.batchId,
                input: { quantity: newQuantity },
              },
            };
          } else if (productType === "EQUIPMENT") {
            console.log("Update Operation:", {
              batchId: batchItem.batchId,
              input: { quantity: newQuantity },
            });
            updateOperation = {
              mutation: UPDATE_EQUIPMENT_BATCH_QUANTITY,
              variables: {
                batchId: batchItem.batchId,
                input: { quantity: newQuantity },
              },
            };
          }

          if (updateOperation) {
            updateOperations.push(updateOperation);
            rollbackOperations.push({
              batchId: batchItem.batchId,
              originalQuantity: currentBatch.quantity,
              productType: productType,
            });
          }
        }
      }

      // Execute all updates using Apollo Client's mutate
      const updatePromises = updateOperations.map(
        (op) => client.mutate(op) // Use client.mutate instead of directly calling the mutation
      );
      await Promise.all(updatePromises);

      console.log("All batch quantities updated successfully");
      return { success: true, rollbackOperations };
    } catch (error) {
      console.error("Error updating batch quantities:", error);
      if (rollbackOperations.length > 0) {
        console.log("Attempting to rollback batch quantity updates...");
        await rollbackBatchQuantities(rollbackOperations);
      }
      throw error;
    }
  };

  // Rollback batch quantities if payment fails
  const rollbackBatchQuantities = async (rollbackOperations) => {
    const rollbackPromises = rollbackOperations.map(async (operation) => {
      try {
        if (operation.productType === "DRUG") {
          await updateDrugBatch({
            variables: {
              batchId: operation.batchId,
              input: { quantity: operation.originalQuantity },
            },
          });
        } else if (operation.productType === "EQUIPMENT") {
          await updateEquipmentBatch({
            variables: {
              batchId: operation.batchId,
              input: { quantity: operation.originalQuantity },
            },
          });
        }
        console.log(
          `Rolled back batch ${operation.batchId} to quantity ${operation.originalQuantity}`
        );
      } catch (error) {
        console.error(`Failed to rollback batch ${operation.batchId}:`, error);
      }
    });

    await Promise.all(rollbackPromises);
  };

  // Handle unavailable items by removing them from cart and refreshing
  const handleUnavailableItems = async (unavailableItems, order) => {
    console.log("Handling unavailable items:", unavailableItems);

    try {
      // Group unavailable items by product
      const productsToRemove = [
        ...new Set(unavailableItems.map((item) => item.productId)),
      ];

      // Remove products from cart
      for (const productId of productsToRemove) {
        try {
          await removeProductFromCart(productId);
          console.log(`Removed unavailable product ${productId} from cart`);
        } catch (error) {
          console.error(`Failed to remove product ${productId}:`, error);
        }
      }

      // Refresh cart to get updated data
      await refreshCart();

      // Show user-friendly message
      const itemNames = unavailableItems.map((item) => item.productName);
      const uniqueNames = [...new Set(itemNames)];

      alert(
        `The following items were removed from your cart due to insufficient stock:\n\n${uniqueNames.join(
          "\n"
        )}\n\nYour cart has been updated. Please review and try again.`
      );

      // Refresh the page to show updated cart
      window.location.reload();
    } catch (error) {
      console.error("Error handling unavailable items:", error);
      alert(
        "There was an error updating your cart. Please refresh the page and try again."
      );
    }
  };

  // Handle popup close
  const handleClosePopup = () => {
    setShowPopup(false);
    setCurrentPayment(null);
    setPaymentLoading(null);
  };

  // Handle error dismissal
  const handleDismissError = () => {
    setPaymentError(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }
  // console.log("Orders by seller:", ordersBySeller);

  return (
    <div className="container mx-auto bg-white rounded-lg shadow-sm">
      <div className="">
        {currentStep === 1 && ordersBySeller.length > 0 && (
          <OrderSummaryStep
            orders={ordersBySeller}
            currentOrderIndex={currentOrderIndex}
            setCurrentOrderIndex={setCurrentOrderIndex}
            pickupDates={pickupDates}
            setPickupDates={setPickupDates}
            onNext={handleOrderSummaryNext}
          />
        )}

        {currentStep === 2  && ordersBySeller.length > 0 && (
          <PaymentStep
            orders={ordersBySeller}
            pickupDates={pickupDates}
            onPrevious={() => setCurrentStep(1)}
            onNext={() => setCurrentStep(3)}
            onPayOrder={handlePayOrder}
            paymentLoading={paymentLoading}
            paymentError={paymentError}
            paidOrders={paidOrders}
            onDismissError={handleDismissError}
            inventoryErrors={inventoryErrors}
          />
        )}

        {currentStep === 3 && (
          <FinishedStep
            onNext={() => router.push(`/medical-supplies/${user.role}/orders`)}
          />
        )}

        {showPopup && currentPayment && (
          <ChapaPopup
            checkoutUrl={currentPayment.checkoutUrl}
            txRef={currentPayment.txRef}
            orderInfo={currentPayment.order}
            onClose={handleClosePopup}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
          />
        )}
      </div>
    </div>
  );
}
