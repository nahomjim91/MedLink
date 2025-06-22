"use client";
import React, { useState } from "react";
import { DollarSign, Plus, Wallet, CreditCard, X } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { NumberInput } from "./Input";
import { Button } from "./Button";
import { apiRequest } from "../../utils/api";

// Payment Popup Component for Telehealth
const TelehealthPaymentPopup = ({
  checkoutUrl,
  txRef,
  onClose,
  onSuccess,
  foundInfo,
}) => {
  const [processingStatus, setProcessingStatus] = useState("waiting");
  const [isProcessing, setIsProcessing] = useState(false);

  React.useEffect(() => {
    if (checkoutUrl) {
      setProcessingStatus("processing");
      setIsProcessing(true);

      // Open Chapa checkout in new window
      const paymentWindow = window.open(
        checkoutUrl,
        "payment",
        "width=600,height=800,scrollbars=yes,resizable=yes"
      );

      // Poll for payment completion
      const pollPayment = setInterval(async () => {
        try {
          // Check if payment window is closed
          if (paymentWindow.closed) {
            clearInterval(pollPayment);
            // Verify payment status
            await verifyPayment(txRef);
          }
        } catch (error) {
          console.error("Payment polling error:", error);
        }
      }, 2000);

      // Cleanup on unmount
      return () => {
        clearInterval(pollPayment);
        if (paymentWindow && !paymentWindow.closed) {
          paymentWindow.close();
        }
      };
    }
  }, [checkoutUrl, txRef]);

  const verifyPayment = async (txRef) => {
    try {
      const response = await apiRequest(
        "/api/payments/wallet/add-funds/verify",
        {
          method: "POST",
          body: JSON.stringify({
            txRef,
            userId: foundInfo.userId,
          }),
        }
      );

      const result = response;

      if (result.success) {
        setProcessingStatus("success");
        setTimeout(() => {
          onSuccess({
            txRef,
            amount: result.data.amount,
            status: "success",
            newWalletBalance: result.data.newWalletBalance,
          });
        }, 1500);
      } else {
        throw new Error(result.message || "Payment verification failed");
      }
    } catch (error) {
      console.error("Payment verification error:", error);
      setProcessingStatus("failed");
      setTimeout(() => {
        onClose();
        const errorMessage = error.message.includes("fetch")
          ? "Connection failed during verification. Please contact support."
          : `Payment verification failed: ${error.message}`;
        alert(errorMessage);
      }, 2000);
    }
  };

  const getStatusContent = () => {
    switch (processingStatus) {
      case "processing":
        return {
          icon: "⏳",
          title: "Processing Payment...",
          message: "Complete your payment in the popup window.",
          showSpinner: true,
        };
      case "success":
        return {
          icon: "✅",
          title: "Funds Added Successfully!",
          message: "Your telehealth wallet has been updated.",
          showSpinner: false,
        };
      case "failed":
        return {
          icon: "❌",
          title: "Payment Failed",
          message: "Your payment could not be processed.",
          showSpinner: false,
        };
      default:
        return {
          icon: "💳",
          title: "Add Funds to Telehealth Wallet",
          message: "Redirecting to payment gateway...",
          showSpinner: false,
        };
    }
  };

  const statusContent = getStatusContent();

  return (
    <div className="fixed inset-0 bg-black/70 bg-opacity-60 flex items-center justify-center z-[60] p-4">
      <div className="bg-white p-8 rounded-xl text-center max-w-md w-full shadow-2xl relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {statusContent.showSpinner && (
          <div className="w-16 h-16 border-4 border-gray-200 border-t-teal-500 rounded-full animate-spin mx-auto mb-6"></div>
        )}

        {!statusContent.showSpinner && (
          <div className="w-20 h-20 bg-teal-500 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-3xl">
            {statusContent.icon}
          </div>
        )}

        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          {statusContent.title}
        </h3>

        <p className="text-gray-600 mb-6">{statusContent.message}</p>

        {processingStatus === "waiting" && (
          <div className="bg-teal-50 p-4 rounded-lg mb-6 text-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium text-gray-700">Amount:</span>
              <span className="font-bold text-teal-600">
                {foundInfo?.amount?.toFixed(2)} Birr
              </span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium text-gray-700">Transaction ID:</span>
              <span className="text-xs text-gray-500">{txRef}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-700">Purpose:</span>
              <span className="text-sm text-gray-600">Telehealth Wallet</span>
            </div>
          </div>
        )}

        {(processingStatus === "waiting" || processingStatus === "failed") && (
          <button
            onClick={onClose}
            className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors"
          >
            {processingStatus === "failed" ? "Close" : "Cancel"}
          </button>
        )}
      </div>
    </div>
  );
};

// Main Telehealth Add Funds Component
export default function TelehealthAddFunds({ onClose }) {
  const { user, refetchUser, refetching } = useAuth();

  const [formData, setFormData] = useState({
    amount: "",
  });
  const [errors, setFormErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPaymentPopup, setShowPaymentPopup] = useState(false);
  const [paymentData, setPaymentData] = useState(null);

  const validateField = (name, value) => {
    switch (name) {
      case "amount":
        const amount = parseFloat(value);
        if (!value) return "Amount is required";
        if (isNaN(amount)) return "Please enter a valid number";
        if (amount < 1) return "Minimum amount is 1 Birr";
        if (amount > 5000) return "Maximum amount is 5,000 Birr";
        return null;
      default:
        return null;
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Validate field and update errors
    const error = validateField(name, value);
    setFormErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  };

  const initializePayment = async (amount) => {
    try {
      setIsLoading(true);

      const paymentPayload = {
        amount: parseFloat(amount),
        currency: "ETB",
        userId: user.id,
        userInfo: {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phoneNumber || user.phone,
        },
      };

      const response = await apiRequest(
        "/api/payments/wallet/add-funds/initialize",
        {
          method: "POST",
          body: JSON.stringify(paymentPayload),
        }
      );

      const result = response;

      if (result.success) {
        setPaymentData({
          ...result.data,
          foundInfo: {
            amount: parseFloat(amount),
            userId: user.id,
            orderNumber: `TELEHEALTH-FUND-${Date.now()}`,
            sellerName: "Telehealth Platform",
            purpose: "Wallet Funding",
          },
        });
        setShowPaymentPopup(true);
      } else {
        throw new Error(result.message || "Payment initialization failed");
      }
    } catch (error) {
      console.error("Payment initialization error:", error);
      const errorMessage = error.message.includes("fetch")
        ? "Connection failed. Please check your internet connection and try again."
        : error.message;
      alert(`Payment initialization failed: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    const amountError = validateField("amount", formData.amount);
    if (amountError) {
      setFormErrors((prev) => ({ ...prev, amount: amountError }));
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setFormErrors((prev) => ({
        ...prev,
        amount: "Please enter a valid amount",
      }));
      return;
    }

    await initializePayment(formData.amount);
  };

  const handlePaymentSuccess = async (paymentResult) => {
    try {
      setShowPaymentPopup(false);
      setPaymentData(null);
      setFormData({ amount: "" });

      console.log("Payment successful, refetching user data...");
      const updatedUser = await refetchUser();

      const newBalance = updatedUser?.patientProfile?.telehealthWalletBalance;

      const balanceText =
        newBalance !== undefined
          ? `${newBalance.toFixed(2)} Birr`
          : paymentResult.newWalletBalance !== undefined
          ? `${paymentResult.newWalletBalance.toFixed(2)} Birr`
          : "Updated";

      alert(`Funds added successfully! New balance: ${balanceText}`);
      
      // Close the modal after successful payment
      onClose();
    } catch (error) {
      console.error("Error refetching user data after payment:", error);

      const balanceText =
        paymentResult.newWalletBalance !== undefined
          ? `${paymentResult.newWalletBalance.toFixed(2)} Birr`
          : "Updated";

      alert(
        `Funds added successfully! New balance: ${balanceText}\n` +
          `Note: Please refresh the page if balance doesn't update automatically.`
      );
      
      // Close the modal even if refetch fails
      onClose();
    }
  };

  const handlePaymentError = (error) => {
    setShowPaymentPopup(false);
    setPaymentData(null);
    alert(`Payment failed: ${error.message}`);
  };

  const handlePaymentClose = () => {
    setShowPaymentPopup(false);
    setPaymentData(null);
  };

  // Handle backdrop click to close modal
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const quickAmounts = [20, 50, 100, 200, 500];
  const isRefreshingBalance = refetching;

  return (
    <>
      {/* Main Modal */}
      <div 
        className="fixed inset-0 bg-black/50 scrollbar-hide bg-opacity-50 flex items-center justify-center z-40 p-2"
        onClick={handleBackdropClick}
      >
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] scrollbar-hide overflow-y-auto">
          {/* Header with close button */}
          <div className="flex items-center justify-between p-6 pb-2">
            <div className="text-center flex-1">
              <h1 className="text-2xl font-bold text-gray-800">Add Funds</h1>
              <p className="text-gray-600 text-sm mt-1">
                Top up your telehealth wallet for consultations
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors ml-4"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="px-6 pb-2">
            {/* Wallet Balance Card */}
            <div className="bg-gradient-to-r from-teal-50 to-teal-100 rounded-xl p-3 mb-2">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-teal-700 mb-1">
                  <Wallet className="w-5 h-5" />
                  <span className="font-medium text-sm">Current Balance</span>
                  {isRefreshingBalance && (
                    <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                  )}
                </div>
                <p className="text-3xl font-bold text-teal-800 mb-1">
                  {user?.patientProfile?.telehealthWalletBalance?.toFixed(2) || "0.00"} Birr
                </p>
                <p className="text-xs text-teal-600">
                  Available for telehealth consultations
                </p>
                {isRefreshingBalance && (
                  <p className="text-xs text-teal-600 mt-1">Updating balance...</p>
                )}
              </div>
            </div>

            {/* Add Funds Form */}
            <div className="space-y-4">
              <NumberInput
                name="amount"
                label="Amount to Add (BIRR)"
                placeholder="Enter amount"
                value={formData.amount}
                onChange={handleChange}
                error={errors.amount}
                min="1"
                max="5000"
                step="0.01"
              />

              {/* Quick Amount Buttons */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Quick Add Amounts
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {quickAmounts.map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          amount: amount.toString(),
                        }));
                        setFormErrors((prev) => ({ ...prev, amount: null }));
                      }}
                      className="px-3 py-2 border-2 border-gray-200 rounded-lg text-sm text-gray-700 font-medium hover:border-teal-500 hover:bg-teal-50 transition-colors"
                    >
                      {amount} Birr
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="w-4 h-4 text-teal-600" />
                  <span className="font-medium text-gray-800 text-sm">
                    Payment Information
                  </span>
                </div>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• Secure payment processing via Chapa</li>
                  <li>• Funds available immediately after payment</li>
                  <li>• Use for telehealth consultations and services</li>
                  <li>• Maximum amount: 5,000 Birr per transaction</li>
                </ul>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={
                  isLoading ||
                  !formData.amount ||
                  errors.amount ||
                  isRefreshingBalance
                }
                className="w-full flex items-center justify-center gap-2 py-3 bg-teal-500 hover:bg-teal-600"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Plus className="w-5 h-5" />
                )}
                {isLoading ? "Processing..." : "Add Funds to Wallet"}
              </Button>
            </div>

            {/* Footer Note */}
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                Funds will be available in your wallet immediately after successful payment
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Popup */}
      {showPaymentPopup && paymentData && (
        <TelehealthPaymentPopup
          checkoutUrl={paymentData.checkoutUrl}
          txRef={paymentData.txRef}
          onClose={handlePaymentClose}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
          foundInfo={paymentData.foundInfo}
        />
      )}
    </>
  );
}