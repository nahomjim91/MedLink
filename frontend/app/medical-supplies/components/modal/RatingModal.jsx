// components/modal/RatingModal.js
"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useRatings } from "../../hooks/useRatings";
import { Modal } from "./Modal";
import { Button } from "../ui/Button";
import { StarRating } from "../ui/Input";
import { toast } from "react-hot-toast";
import { useMSAuth } from "../../hooks/useMSAuth";
import { CheckCircle, Star, User, Package, Clock } from "lucide-react";

export const RatingModal = ({ isOpen, onClose, order }) => {
  if (!isOpen || !order) {
    return null;
  }

  const {
    getOrderRatings,
    lazyOrderRatings,
    lazyOrderRatingsLoading,
    createUserRating,
    createProductRating,
    createUserRatingLoading,
    createProductRatingLoading,
    extractProductId,
    refetch, // Add this to force refetch all related data
  } = useRatings({ orderId: order.orderId, autoFetch: false });

  const { user } = useMSAuth();

  const [currentStep, setCurrentStep] = useState("loading");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [skippedItems, setSkippedItems] = useState(new Set());
  const [forceRefresh, setForceRefresh] = useState(0); // Add force refresh state

  const userPerspective = user.userId === order.sellerId ? "seller" : "buyer";
  const isLoading = createUserRatingLoading || createProductRatingLoading;

  // Load order ratings when modal opens
  useEffect(() => {
    if (order?.orderId && isOpen) {
      getOrderRatings({ variables: { orderId: order.orderId } });
    }
  }, [order?.orderId, getOrderRatings, isOpen]);

  // Force refresh helper
  const forceRefreshData = useCallback(async () => {
    if (order?.orderId) {
      try {
        await getOrderRatings({ variables: { orderId: order.orderId } });
        setForceRefresh((prev) => prev + 1);
      } catch (error) {
        console.error("Error refreshing order ratings:", error);
      }
    }
  }, [order?.orderId, getOrderRatings]);

  console.log("order ratings:", lazyOrderRatings);
  console.log("force refresh counter:", forceRefresh);

  const ratingProgress = useMemo(() => {
    if (lazyOrderRatingsLoading || !lazyOrderRatings) return null;

    const expectedRatingType = `${userPerspective}_rating`;
    const currentUserHasRatedUser = lazyOrderRatings.some(
  (r) =>
    r.type === "user_rating" &&
    r.ratingType === expectedRatingType
);

    const ratedProducts = new Set();
    lazyOrderRatings.forEach((r) => {
      if (r.type === "product_rating") {
        const ratedProductId = r.product?.id || r.productId;
        ratedProducts.add(ratedProductId);
      }
    });

    const totalItems =
      userPerspective === "seller" ? 1 : 1 + order.items.length;
    let completedItems = 0;

    // Count user rating as completed if rated or skipped
    if (currentUserHasRatedUser || skippedItems.has("user_rating")) {
      completedItems++;
    }

    // Count product ratings as completed if rated or skipped
    if (userPerspective === "buyer") {
      order.items.forEach((item) => {
        const productId = extractProductId(item.orderItemId);
        console.log("product id:", productId);

        if (ratedProducts.has(productId) || skippedItems.has(productId)) {
          completedItems++;
        }
      });
    }
    console.log("lazyOrderRatings", lazyOrderRatings);
    return {
      completed: completedItems,
      total: totalItems,
      userRated: currentUserHasRatedUser,
      userSkipped: skippedItems.has("user_rating"),
      ratedProducts,
    };
  }, [
    lazyOrderRatings,
    lazyOrderRatingsLoading,
    order,
    userPerspective,
    extractProductId,
    skippedItems,
    forceRefresh, // Add forceRefresh as dependency
  ]);

  const whatToRate = useMemo(() => {
    if (lazyOrderRatingsLoading || !lazyOrderRatings || !ratingProgress)
      return "loading";

    if (userPerspective === "seller") {
      return ratingProgress.userRated || ratingProgress.userSkipped
        ? "done"
        : "user";
    }

    if (userPerspective === "buyer") {
      if (!ratingProgress.userRated && !ratingProgress.userSkipped) {
        return "user";
      }

      const firstUnratedProductIndex = order.items.findIndex((item) => {
        const productId = extractProductId(item.orderItemId);
        return (
          !ratingProgress.ratedProducts.has(productId) &&
          !skippedItems.has(productId)
        );
      });

      if (firstUnratedProductIndex !== -1) {
        return `product_${firstUnratedProductIndex}`;
      }

      return "done";
    }

    return "done";
  }, [
    lazyOrderRatings,
    lazyOrderRatingsLoading,
    order,
    userPerspective,
    extractProductId,
    ratingProgress,
    skippedItems,
    forceRefresh, // Add forceRefresh as dependency
  ]);

  useEffect(() => {
    if (whatToRate) {
      setCurrentStep(whatToRate);
    }
  }, [whatToRate]);

  const resetForm = () => {
    setRating(0);
    setComment("");
  };

  const handleClose = () => {
    resetForm();
    setSkippedItems(new Set());
    setForceRefresh(0);
    onClose();
  };

  const handleSkip = () => {
    if (currentStep.startsWith("product_")) {
      const productIndex = parseInt(currentStep.split("_")[1]);
      const productItem = order.items[productIndex];
      const productId = extractProductId(productItem.orderItemId);

      setSkippedItems((prev) => new Set([...prev, productId]));
      resetForm();

      // Force refresh data and then find next step
      setTimeout(() => {
        setForceRefresh((prev) => prev + 1);
      }, 100);
    } else if (currentStep === "user") {
      // Skip user rating
      setSkippedItems((prev) => new Set([...prev, "user_rating"]));
      resetForm();

      // Force refresh data
      setTimeout(() => {
        setForceRefresh((prev) => prev + 1);
      }, 100);
    }
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Please select a rating (at least 1 star).");
      return;
    }

    try {
      if (currentStep === "user") {
        const ratedUserId =
          userPerspective === "buyer" ? order.sellerId : order.buyerId;
        await createUserRating({
          ratedUserId,
          orderId: order.orderId,
          rating,
          comment,
          ratingType: `${userPerspective}_rating`,
        });
        toast.success("User rated successfully!");
      } else if (currentStep.startsWith("product_")) {
        const productIndex = parseInt(currentStep.split("_")[1]);
        const productItem = order.items[productIndex];
        const productId = extractProductId(productItem.orderItemId);
        await createProductRating({
          productId,
          orderId: order.orderId,
          rating,
          comment,
        });
        toast.success(`${productItem.productName} rated successfully!`);
      }

      // Reset form immediately
      resetForm();

      // Force refresh data after a short delay to ensure backend has processed
      setTimeout(async () => {
        await forceRefreshData();
      }, 500);
    } catch (error) {
      console.error("Failed to submit rating:", error);
      toast.error(error.message || "Failed to submit rating.");
    }
  };

  // Helper function to get rating label with emoji
  const getRatingLabel = (rating) => {
    const labels = {
      1: { text: "Poor", color: "text-red-500", emoji: "😞" },
      2: { text: "Fair", color: "text-orange-500", emoji: "😐" },
      3: { text: "Good", color: "text-yellow-500", emoji: "🙂" },
      4: { text: "Very Good", color: "text-green-500", emoji: "😊" },
      5: { text: "Excellent", color: "text-green-600", emoji: "🤩" },
    };
    return labels[rating] || null;
  };

  const getModalContent = () => {
    if (currentStep === "loading" || lazyOrderRatingsLoading) {
      return (
        <div className="p-4 text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <Clock className="h-12 w-12 text-primary animate-spin" />
              <div className="absolute inset-0 h-12 w-12 rounded-full bg-blue-100 animate-ping opacity-25"></div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-2 bg-secondary/20 rounded-full overflow-hidden">
              <div className="h-full bg-primary animate-pulse"></div>
            </div>
            <p className="text-secondary/60 font-medium">
              Loading rating information...
            </p>
          </div>
        </div>
      );
    }

    if (currentStep === "done") {
      const hasCompletedRatings =
        ratingProgress && ratingProgress.completed > 0;
      const hasSkippedItems = skippedItems.size > 0;

      return (
        <div className="p-8 text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <CheckCircle className="h-16 w-16 text-primary" />
              <div className="absolute -top-2 -right-2 animate-bounce">
                <div className="h-6 w-6 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-xs">✨</span>
                </div>
              </div>
            </div>
          </div>

          <h3 className="text-2xl font-bold bg-gradient-to-r from-teal-400 to-primary bg-clip-text text-transparent mb-3">
            {hasCompletedRatings ? "Thank You! 🎉" : "Already Completed"}
          </h3>

          <p className="text-secondary/60 mb-6 text-lg">
            {hasCompletedRatings
              ? "Your ratings help build a better marketplace for everyone."
              : "You have already completed all ratings for this order."}
          </p>

          {hasSkippedItems && (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-primary rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">⚠️</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-yellow-800">
                    You skipped {skippedItems.size} rating
                    {skippedItems.size > 1 ? "s" : ""}
                    {skippedItems.has("user_rating") && skippedItems.size === 1
                      ? " (user rating)"
                      : ""}
                    {skippedItems.has("user_rating") && skippedItems.size > 1
                      ? " (including user rating)"
                      : ""}
                  </p>
                </div>
              </div>
            </div>
          )}

          {ratingProgress && (
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 mb-6 border border-blue-100">
              <div className="flex items-center justify-between text-sm font-semibold text-secondary/70 mb-3">
                <span className="flex items-center gap-2">
                  <span className="text-lg">📊</span>
                  Rating Progress
                </span>
                <span className="bg-white px-3 py-1 rounded-full text-xs shadow-sm">
                  {ratingProgress.completed}/{ratingProgress.total} completed
                </span>
              </div>
              <div className="w-full bg-secondary/20 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-700 ease-out relative overflow-hidden"
                  style={{
                    width: `${
                      (ratingProgress.completed / ratingProgress.total) * 100
                    }%`,
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse"></div>
                </div>
              </div>
            </div>
          )}

          <Button
            onClick={handleClose}
            className="bg-gradient-to-r from-primary/50 to-primary/60 hover:from-primary/60 hover:to-primary/70 text-white font-semibold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            <span className="flex items-center gap-2">
              <span>✅</span>
              Close
            </span>
          </Button>
        </div>
      );
    }

    let title = "";
    let subTitle = "";
    let icon = null;
    let iconBg = "";

    if (currentStep === "user") {
      title =
        userPerspective === "buyer" ? "Rate the Seller" : "Rate the Buyer";
      subTitle =
        userPerspective === "buyer"
          ? order.sellerCompanyName || order.sellerName
          : order.buyerCompanyName || order.buyerName;
      icon = <User className="h-6 w-6 text-primary" />;
      iconBg = "bg-primary/10";
    } else if (currentStep.startsWith("product_")) {
      const productIndex = parseInt(currentStep.split("_")[1]);
      const productItem = order.items[productIndex];
      title = "Rate the Product";
      subTitle = productItem.productName;
      icon = <Package className="h-6 w-6 text-primary" />;
      iconBg = "bg-primary/10";
    }

    const canSkip = true;
    const ratingLabel = getRatingLabel(rating);

    return (
      <div className="p-3">
        {/* Progress Bar */}
        {ratingProgress && (
          <div className="mb-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-2 border border-blue-100">
            <div className="flex items-center justify-between text-sm font-semibold text-secondary/70 mb-3">
              <span className="flex items-center gap-2">
                <span className="text-lg">🎯</span>
                Progress
              </span>
              <span className="bg-white px-3 py-1 rounded-full text-xs shadow-sm">
                {ratingProgress.completed}/{ratingProgress.total} completed
              </span>
            </div>
            <div className="w-full bg-secondary/20 rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-500 ease-out relative"
                style={{
                  width: `${
                    (ratingProgress.completed / ratingProgress.total) * 100
                  }%`,
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse"></div>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center gap-4 mb-4">
          <div className={`p-3 rounded-2xl ${iconBg} shadow-md`}>{icon}</div>
          <div>
            <h3 className="text-xl font-bold text-secondary/80">{title}</h3>
            <p className="text-secondary/60 font-medium">{subTitle}</p>
          </div>
        </div>

        {/* Star Rating */}
        <div className="bg-primary/10 rounded-2xl p-3 mb-6 border border-primary/20">
          <div className="flex items-center justify-center mb-4">
            <Star className="h-5 w-5 text-primary mr-2" />
            <span className="text-sm font-semibold text-secondary/70">
              How would you rate this experience?
            </span>
          </div>

          <div className="flex justify-center mb-4">
            <StarRating value={rating} onChange={setRating} />
          </div>

          {ratingLabel && (
            <div className="text-center bg-white rounded-xl p-3 shadow-sm">
              <p
                className={`text-lg font-bold ${ratingLabel.color} flex items-center justify-center gap-2`}
              >
                <span className="text-2xl">{ratingLabel.emoji}</span>
                {ratingLabel.text}
              </p>
            </div>
          )}
        </div>

        {/* Comment */}
        <div className="mb-3">
          <label className="text-sm font-semibold text-secondary/70 mb-3 flex items-center gap-2">
            <span>💬</span>
            Share your thoughts (optional)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell us about your experience..."
            className="w-full p-4 border-2 border-secondary/20 rounded-2xl h-24 focus:ring-2 focus:ring-primary focus:ring-opacity-50 focus:outline-none focus:border-primary/40 resize-none transition-all duration-200 bg-gradient-to-br from-secondary/5 to-white"
          />
        </div>

        {/* Actions */}
        <div className="flex flex-col md:flex-row w-full gap-3 justify-between items-center">
          <div className="flex w-full md:w-1/2 gap-3">
            <Button
              variant="fill"
              onClick={handleClose}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-secondary/50 to-secondary/60 hover:from-secondary/60 hover:to-secondary/70 text-white font-semibold py-3 px-6 md:px-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              Cancel
            </Button>
            {canSkip && (
              <Button
                variant="outline"
                onClick={handleSkip}
                disabled={isLoading}
                className="flex-1 border-2 border-red-500 text-red-500 hover:bg-red-50 hover:border-red-600 font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105"
              >
                Skip
              </Button>
            )}
          </div>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || rating === 0}
            className="w-full md:w-auto bg-gradient-to-r from-primary/50 to-primary/60 hover:from-primary/60 hover:to-primary/80 disabled:from-secondary/40 disabled:to-secondary/50 text-white font-semibold py-4 px-8 md:px-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:transform-none disabled:hover:scale-100"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 animate-spin" />
                Submitting...
              </div>
            ) : (
              <span className="flex items-center gap-2">
                <span>⭐</span>
                Submit Rating
              </span>
            )}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <span className="flex items-center gap-1">
          <span className="text-2xl">✨</span>
          Rate Your Experience
        </span>
      }
    >
      {getModalContent()}
    </Modal>
  );
};
