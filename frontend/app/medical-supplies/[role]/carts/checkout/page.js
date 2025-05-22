"use client";
import { useMSAuth } from "../../../hooks/useMSAuth";
import { useMemo, useState } from "react";
import { DateInput } from "../../../components/ui/Input";
import { Button, StepButtons } from "../../../components/ui/Button";
import Image from "next/image";

// Helper function to categorize cart items by seller
const categorizeCartBySeller = (cart, user) => {
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
    orderId: `Pending_${Date.now()}_${index}`,
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
  const currentOrder = orders[currentOrderIndex];

  const handleDateChange = (e) => {
    const newDates = { ...pickupDates };
    newDates[currentOrder.orderId] = e.target.value;
    setPickupDates(newDates);
  };

  const canProceed = pickupDates[currentOrder.orderId];

  return (
    <div className="flex gap-6 ">
      {/* Left Panel - Order Details */}
      <div className="flex-1 bg-white rounded-lg p-6 ">
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
                      : "bg-primary/20 text-secondary/60 hover:bg-gray-300"
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="h-[40vh] overflow-y-auto">
          <div className="mb-6">
            <h3 className="font-medium text-secondary/80 mb-4">
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
        <div className="bg-primary/4 rounded-xl p-4 space-y-4">
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

          <div className="pl-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500 block">Address</span>
              <p className="text-gray-800 font-medium">
                {currentOrder.buyerContactInfo.address?.street ||
                  "No. 93 Skyfield Apartments"}
              </p>
            </div>
            <div>
              <span className="text-gray-500 block">State</span>
              <p className="text-gray-800 font-medium">
                {currentOrder.buyerContactInfo.address?.state || "Addis Ababa"}
              </p>
            </div>
            <div>
              <span className="text-gray-500 block">City</span>
              <p className="text-gray-800 font-medium">
                {currentOrder.buyerContactInfo.address?.city || "Addis Ababa"}
              </p>
            </div>
          </div>
        </div>

        <StepButtons
          onPrevious={() => {
            /* Back to cart */
          }}
          onNext={onNext}
          previousLabel="Back to Cart"
          nextLabel={
            orders.length > 1 && currentOrderIndex < orders.length - 1
              ? "Next Order"
              : "Next Step"
          }
          showPrevious={true}
          showNext={canProceed}
        />
      </div>

      {/* Right Panel - Progress */}
      <StepProgress currentStep={1} />
    </div>
  );
}

// Step 2: Payment Component
function PaymentStep({ orders, pickupDates, onPrevious, onNext, onPayOrder }) {
  return (
    <div className="flex gap-6 h-[85vh]">
      {/* Left Panel - Payment Details */}
      <div className="flex-1 bg-white rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-6">Payment</h2>

        <div className="space-y-6 h-[65vh] overflow-y-auto">
          {orders.map((order, index) => (
            <div
              key={order.orderId}
              className="border-b border-secondary/30 pb-4 last:border-b-0"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-medium">
                    Order #{order.orderNumber} Cost
                  </h3>
                  <p className="text-2xl font-bold text-teal-600">
                    ${order.totalCost.toFixed(2)}
                  </p>
                </div>
                <Button
                  variant="fill"
                  color="primary"
                  onClick={() => onPayOrder(order.orderId)}
                  className="bg-teal-500 hover:bg-teal-600"
                >
                  Pay Now
                </Button>
              </div>

              <div className="space-y-2 text-sm text-secondary/60">
                <div className="flex justify-between">
                  <span>Status</span>
                  <span className="text-orange-500">Pending</span>
                </div>
                <div className="flex justify-between">
                  <span>Order No.</span>
                  <span>#{order.orderId.slice(0, 7)}</span>
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
            </div>
          ))}
        </div>

        <StepButtons
          onPrevious={onPrevious}
          onNext={onNext}
          previousLabel="Previous"
          nextLabel="Next Step"
          showPrevious={true}
          showNext={true}
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

export default function CheckoutPage() {
  const { user, cart, loading } = useMSAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [currentOrderIndex, setCurrentOrderIndex] = useState(0);
  const [pickupDates, setPickupDates] = useState({});

  // Categorize cart items by seller
  const ordersBySeller = useMemo(() => {
    return categorizeCartBySeller(cart, user);
  }, [cart, user]);

  const handleOrderSummaryNext = () => {
    if (
      ordersBySeller.length > 1 &&
      currentOrderIndex < ordersBySeller.length - 1
    ) {
      setCurrentOrderIndex(currentOrderIndex + 1);
    } else {
      setCurrentStep(2);
    }
  };

  const handlePayOrder = (orderId) => {
    console.log("Processing payment for order:", orderId);
    // Implement payment logic here
  };

  const handleFinishCheckout = () => {
    console.log("Checkout completed");
    // Redirect to orders page or dashboard
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

  if (!ordersBySeller.length) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Checkout</h1>
          <p className="text-secondary/60">No items in cart</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto  bg-white rounded-lg shadow-sm">
      <div className="">
        {currentStep === 1 && (
          <OrderSummaryStep
            orders={ordersBySeller}
            currentOrderIndex={currentOrderIndex}
            setCurrentOrderIndex={setCurrentOrderIndex}
            pickupDates={pickupDates}
            setPickupDates={setPickupDates}
            onNext={handleOrderSummaryNext}
          />
        )}

        {currentStep === 2 && (
          <PaymentStep
            orders={ordersBySeller}
            pickupDates={pickupDates}
            onPrevious={() => setCurrentStep(1)}
            onNext={() => setCurrentStep(3)}
            onPayOrder={handlePayOrder}
          />
        )}

        {currentStep === 3 && <FinishedStep onNext={handleFinishCheckout} />}
      </div>
    </div>
  );
}
