// components/modal/RatingModal.js
"use client";
import { useState, useEffect, useMemo } from "react";
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
  } = useRatings({ orderId: order.orderId, autoFetch: false });

  const { user } = useMSAuth();

  const [currentStep, setCurrentStep] = useState("loading");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [skippedItems, setSkippedItems] = useState(new Set());

  const userPerspective = user.userId === order.sellerId ? "seller" : "buyer";
  const isLoading = createUserRatingLoading || createProductRatingLoading;

  useEffect(() => {
    if (order?.orderId) {
      getOrderRatings({ variables: { orderId: order.orderId } });
    }
  }, [order?.orderId, getOrderRatings]);

  const ratingProgress = useMemo(() => {
    if (lazyOrderRatingsLoading || !lazyOrderRatings) return null;

    const expectedRatingType = `${userPerspective}_rating`;
    const currentUserHasRatedUser = lazyOrderRatings.some(
      (r) => r.ratingType === expectedRatingType
    );

    const ratedProducts = new Set();
    lazyOrderRatings.forEach((r) => {
      if (r.type === "product") {
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
        if (ratedProducts.has(productId) || skippedItems.has(productId)) {
          completedItems++;
        }
      });
    }

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
    onClose();
  };

  const handleSkip = () => {
    if (currentStep.startsWith("product_")) {
      const productIndex = parseInt(currentStep.split("_")[1]);
      const productItem = order.items[productIndex];
      const productId = extractProductId(productItem.orderItemId);

      setSkippedItems((prev) => new Set([...prev, productId]));
      resetForm();

      // Find next unrated product or go to done
      const nextUnratedIndex = order.items.findIndex((item, index) => {
        if (index <= productIndex) return false;
        const id = extractProductId(item.orderItemId);
        return !ratingProgress.ratedProducts.has(id) && !skippedItems.has(id);
      });

      if (nextUnratedIndex !== -1) {
        setCurrentStep(`product_${nextUnratedIndex}`);
      } else {
        setCurrentStep("done");
      }
    } else if (currentStep === "user") {
      // Skip user rating
      setSkippedItems((prev) => new Set([...prev, "user_rating"]));
      resetForm();

      // Move to next step based on user perspective
      if (userPerspective === "seller") {
        setCurrentStep("done");
      } else {
        // For buyer, check if there are products to rate
        const firstUnratedProductIndex = order.items.findIndex((item) => {
          const productId = extractProductId(item.orderItemId);
          return (
            !ratingProgress.ratedProducts.has(productId) &&
            !skippedItems.has(productId)
          );
        });

        if (firstUnratedProductIndex !== -1) {
          setCurrentStep(`product_${firstUnratedProductIndex}`);
        } else {
          setCurrentStep("done");
        }
      }
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

      await getOrderRatings({ variables: { orderId: order.orderId } });
      resetForm();
    } catch (error) {
      console.error("Failed to submit rating:", error);
      toast.error(error.message || "Failed to submit rating.");
    }
  };

  const getModalContent = () => {
    if (currentStep === "loading" || lazyOrderRatingsLoading) {
      return (
        <div className="p-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <Clock className="h-8 w-8 text-primary animate-spin" />
          </div>
          <p className="text-secondary">Loading rating information...</p>
        </div>
      );
    }

    if (currentStep === "done") {
      const hasCompletedRatings =
        ratingProgress && ratingProgress.completed > 0;
      const hasSkippedItems = skippedItems.size > 0;

      return (
        <div className="p-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <CheckCircle className="h-12 w-12 text-primary" />
          </div>
          <h3 className="text-xl font-semibold text-secondary/80 mb-2">
            {hasCompletedRatings ? "Thank You!" : "Already Completed"}
          </h3>
          <p className="text-secondary/60 mb-4">
            {hasCompletedRatings
              ? "Your ratings for this order have been submitted successfully."
              : "You have already completed all ratings for this order."}
          </p>

          {hasSkippedItems && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-yellow-800">
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
          )}

          {ratingProgress && (
            <div className="bg-secondary/5 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between text-sm text-secondary/60">
                <span>Rating Progress</span>
                <span>
                  {ratingProgress.completed}/{ratingProgress.total} completed
                </span>
              </div>
              <div className="w-full bg-secondary/20 rounded-full h-2 mt-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${
                      (ratingProgress.completed / ratingProgress.total) * 100
                    }%`,
                  }}
                />
              </div>
            </div>
          )}

          <Button onClick={handleClose} className="text-primary">
            Close
          </Button>
        </div>
      );
    }

    let title = "";
    let subTitle = "";
    let icon = null;

    if (currentStep === "user") {
      title =
        userPerspective === "buyer" ? "Rate the Seller" : "Rate the Buyer";
      subTitle =
        userPerspective === "buyer"
          ? order.sellerCompanyName || order.sellerName
          : order.buyerCompanyName || order.buyerName;
      icon = <User className="h-6 w-6 text-blue-600" />;
    } else if (currentStep.startsWith("product_")) {
      const productIndex = parseInt(currentStep.split("_")[1]);
      const productItem = order.items[productIndex];
      title = "Rate the Product";
      subTitle = productItem.productName;
      icon = <Package className="h-6 w-6 text-green-600" />;
    }

    const canSkip = true; // Both user and product ratings can be skipped

    return (
      <div className="p-6">
        {/* Progress Bar */}
        {ratingProgress && (
          <div className="mb-6 bg-secondary/5 rounded-lg p-4">
            <div className="flex items-center justify-between text-sm text-secondary/60 mb-2">
              <span>Progress</span>
              <span>
                {ratingProgress.completed}/{ratingProgress.total} completed
              </span>
            </div>
            <div className="w-full bg-secondary/20 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${
                    (ratingProgress.completed / ratingProgress.total) * 100
                  }%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          {icon}
          <div>
            <h3 className="text-xl font-semibold text-secondary/80">{title}</h3>
            <p className="text-sm text-secondary/50">{subTitle}</p>
          </div>
        </div>

        {/* Star Rating */}
        <div className="bg-secondary/5 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-center mb-4">
            <Star className="h-5 w-5 text-yellow-400 mr-2" />
            <span className="text-sm font-medium text-secondary/70">
              How would you rate this?
            </span>
          </div>
          <div className="flex justify-center mb-4">
            <StarRating value={rating} onChange={setRating} />
          </div>
          {rating > 0 && (
            <p className="text-center text-sm text-secondary/60">
              {rating === 1 && "Poor"}
              {rating === 2 && "Fair"}
              {rating === 3 && "Good"}
              {rating === 4 && "Very Good"}
              {rating === 5 && "Excellent"}
            </p>
          )}
        </div>

        {/* Comment */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-secondary/70 mb-2">
            Comment (optional)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience..."
            className="w-full p-3 border border-secondary/30 rounded-lg h-20 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex flex-col md:flex-row w-full gap-3 justify-between items-center">
          <div className="flex w-full gap-3 bg-amber-300">
            <Button variant="fill" onClick={handleClose} disabled={isLoading} className="w-full">
              Cancel
            </Button>
            {canSkip && (
              <Button variant="outline" color= "error" onClick={handleSkip} disabled={isLoading}>
                Skip
              </Button>
            )}
          </div>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || rating === 0}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-secondary/40"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 animate-spin" />
                Submitting...
              </div>
            ) : (
              "Submit Rating"
            )}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Rate Your Experience">
      {getModalContent()}
    </Modal>
  );
};
