import React, { useState, useEffect } from "react";
import { Star, X, User, Package } from "lucide-react";
import { useUserRatings, useProductRatings } from "../../hooks/useRatings";

const OrderRatingModal = ({
  isOpen,
  onClose,
  order,
  user,
  userPerspective,
  onSubmitRating,
  existingRatings = [],
}) => {
  const [ratings, setRatings] = useState({});
  const [comments, setComments] = useState({});
  const [loading, setLoading] = useState(false);
  const [currentRatingStep, setCurrentRatingStep] = useState(0);
  const [ratingSteps, setRatingSteps] = useState([]);
  const [completedRatings, setCompletedRatings] = useState(new Set());

  const { canRateUser, canRateUserLoading } = useUserRatings();
  const { canRateProduct, canRateProductLoading } = useProductRatings();

  // Helper function to extract productId from orderItemId
  const extractProductId = (orderItemId) => {
    if (!orderItemId) return null;
    // Extract productId from format: "item_1751708595497_PGJ30Ys8w4rKk7YERhZ9"
    const parts = orderItemId.split("_");
    if (parts.length >= 3) {
      return parts.slice(2).join("_"); // Join remaining parts in case productId contains underscores
    }
    return orderItemId; // Fallback to original if format is unexpected
  };

  // Check if a rating already exists
  const hasExistingRating = (type, id) => {
    if (!existingRatings || existingRatings.length === 0) return false;
    
    return existingRatings.some(rating => {
      if (type === 'user') {
        return rating.ratedUserId === id && rating.type === 'user_rating';
      } else if (type === 'product') {
        return rating.productId === id && rating.type === 'product_rating';
      }
      return false;
    });
  };

  useEffect(() => {
    if (isOpen && order) {
      const initializeRatingSteps = async () => {
        setLoading(true);
        const steps = [];
        const completed = new Set();

        try {
          // Check if user can rate the other party (seller/buyer)
          if (userPerspective === "buyer") {
            // Buyer can rate seller - check permission first
            const sellerId = order.sellerId;
            
            if (sellerId && sellerId !== user?.userId) {
              const alreadyRated = hasExistingRating('user', sellerId);
              const canRateSeller = alreadyRated ? false : await canRateUser(order.orderId, sellerId);

              if (canRateSeller) {
                steps.push({
                  type: "user",
                  id: `user_${sellerId}`,
                  title: "Rate Seller",
                  name: order.sellerCompanyName || order.sellerName || "Seller",
                  icon: "User",
                  color: "blue",
                  ratedUserId: sellerId,
                });
              } else {
                completed.add(`user_${sellerId}`);
              }
            }

            // Buyer can rate products (one by one) - check permission for each
            if (order.items?.length > 0) {
              for (const item of order.items) {
                const productId = extractProductId(item.orderItemId);
                
                if (productId) {
                  const alreadyRated = hasExistingRating('product', productId);
                  const canRateThisProduct = alreadyRated ? false : await canRateProduct(order.orderId, productId);

                  if (canRateThisProduct) {
                    steps.push({
                      type: "product",
                      id: `product_${productId}`,
                      title: "Rate Product",
                      name: item.productName || item.name || "Product",
                      productId: productId,
                      item: item,
                      icon: "Package",
                      color: "purple",
                    });
                  } else {
                    completed.add(`product_${productId}`);
                  }
                }
              }
            }
          } else if (userPerspective === "seller") {
            // Seller can rate buyer - check permission first
            const buyerId = order.buyerId;
            
            if (buyerId && buyerId !== user?.userId) {
              const alreadyRated = hasExistingRating('user', buyerId);
              const canRateBuyer = alreadyRated ? false : await canRateUser(order.orderId, buyerId);

              if (canRateBuyer) {
                steps.push({
                  type: "user",
                  id: `user_${buyerId}`,
                  title: "Rate Buyer",
                  name: order.buyerCompanyName || order.buyerName || "Buyer",
                  icon: "User",
                  color: "green",
                  ratedUserId: buyerId,
                });
              } else {
                completed.add(`user_${buyerId}`);
              }
            }
          }

          setRatingSteps(steps);
          setCompletedRatings(completed);
          
          // Reset to first step if there are steps
          if (steps.length > 0) {
            setCurrentRatingStep(0);
          }

          // Initialize ratings state only for incomplete ratings
          const initialRatings = {};
          const initialComments = {};

          steps.forEach((step) => {
            initialRatings[step.id] = 0;
            initialComments[step.id] = "";
          });

          setRatings(initialRatings);
          setComments(initialComments);
        } catch (error) {
          console.error("Error checking rating permissions:", error);
          // If there's an error checking permissions, don't show any rating steps
          setRatingSteps([]);
          setCompletedRatings(new Set());
          setCurrentRatingStep(0);
        } finally {
          setLoading(false);
        }
      };

      initializeRatingSteps();
    } else {
      // Reset state when modal is closed
      setRatingSteps([]);
      setCompletedRatings(new Set());
      setCurrentRatingStep(0);
      setRatings({});
      setComments({});
    }
  }, [isOpen, order, userPerspective, canRateUser, canRateProduct, user, existingRatings]);

  const handleRatingChange = (key, rating) => {
    setRatings((prev) => ({
      ...prev,
      [key]: rating,
    }));
  };

  const handleCommentChange = (key, comment) => {
    setComments((prev) => ({
      ...prev,
      [key]: comment,
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Validate the current step has a rating
      const currentStep = ratingSteps[currentRatingStep];
      const currentRating = ratings[currentStep.id];
      
      if (currentRating === 0) {
        alert("Please provide a rating before submitting");
        setLoading(false);
        return;
      }

      const ratingsToSubmit = [];

      // Only submit the current step's rating
      const comment = comments[currentStep.id] || "";

      if (currentStep.type === "user") {
        ratingsToSubmit.push({
          type: "user",
          ratedUserId: currentStep.ratedUserId,
          rating: currentRating,
          comment,
          orderId: order.orderId,
        });
      } else if (currentStep.type === "product") {
        ratingsToSubmit.push({
          type: "product",
          productId: currentStep.productId,
          rating: currentRating,
          comment,
          orderId: order.orderId,
        });
      }

      // Submit ratings
      await onSubmitRating(ratingsToSubmit, order.sellerId);

      // Mark the current step as completed
      setCompletedRatings(prev => {
        const newSet = new Set(prev);
        newSet.add(currentStep.id);
        return newSet;
      });

      // Move to next step or close modal
      if (currentRatingStep < ratingSteps.length - 1) {
        setCurrentRatingStep(currentRatingStep + 1);
      } else {
        // If this is the last step, close the modal after successful submission
        setTimeout(() => {
          onClose();
        }, 500);
      }
    } catch (error) {
      console.error("Error submitting rating:", error);
      alert("Failed to submit rating. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    const currentStep = ratingSteps[currentRatingStep];
    const currentRating = ratings[currentStep.id];

    if (currentRating === 0) {
      alert("Please provide a rating before proceeding");
      return;
    }

    if (currentRatingStep < ratingSteps.length - 1) {
      setCurrentRatingStep(currentRatingStep + 1);
    }
  };

  const handleBack = () => {
    if (currentRatingStep > 0) {
      setCurrentRatingStep(currentRatingStep - 1);
    }
  };

  const handleSkip = () => {
    if (currentRatingStep < ratingSteps.length - 1) {
      setCurrentRatingStep(currentRatingStep + 1);
    } else {
      onClose();
    }
  };

  const StarRating = ({ value, onChange, readOnly = false }) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`p-1 ${readOnly ? "cursor-default" : "cursor-pointer"}`}
            onClick={() => !readOnly && onChange(star)}
            disabled={readOnly}
            aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
          >
            <Star
              className={`w-5 h-5 ${
                star <= value
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300"
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const currentStep = ratingSteps[currentRatingStep];
  const hasSteps = ratingSteps.length > 0;
  const isLastStep = currentRatingStep === ratingSteps.length - 1;

  const isCheckingPermissions = canRateUserLoading || canRateProductLoading || loading;

  // Check if all ratings are completed
  const allRatingsCompleted =
    ratingSteps.length === 0 &&
    completedRatings.size > 0 &&
    !isCheckingPermissions;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Rate Order #{order?.orderId}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {isCheckingPermissions ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading rating options...</p>
            </div>
          ) : allRatingsCompleted ? (
            <div className="text-center py-8">
              <div className="mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                All Ratings Completed
              </h3>
              <p className="text-gray-600">
                You have already rated all items for this order.
              </p>
            </div>
          ) : !hasSteps ? (
            <div className="text-center py-8">
              <p className="text-gray-600">
                No ratings available for this order.
              </p>
            </div>
          ) : (
            <>
              {/* Progress indicator */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">
                    Step {currentRatingStep + 1} of {ratingSteps.length}
                  </span>
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${
                          ((currentRatingStep + 1) / ratingSteps.length) * 100
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Current rating step */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  {currentStep.icon === "User" && (
                    <User className={`w-6 h-6 text-${currentStep.color}-600`} />
                  )}
                  {currentStep.icon === "Package" && (
                    <Package
                      className={`w-6 h-6 text-${currentStep.color}-600`}
                    />
                  )}
                  <h3 className="text-lg font-medium">{currentStep.title}</h3>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                      <span className="font-medium">{currentStep.name}</span>
                      {currentStep.item && (
                        <p className="text-sm text-gray-500">
                          Quantity: {currentStep.item.totalQuantity} | Price: $
                          {currentStep.item.totalPrice?.toFixed(2) || "0.00"}
                        </p>
                      )}
                    </div>
                    <StarRating
                      value={ratings[currentStep.id] || 0}
                      onChange={(rating) =>
                        handleRatingChange(currentStep.id, rating)
                      }
                    />
                  </div>
                  <textarea
                    placeholder={`Add a comment about this ${
                      currentStep.type === "user" ? "person" : "product"
                    }...`}
                    className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                    rows="3"
                    value={comments[currentStep.id] || ""}
                    onChange={(e) =>
                      handleCommentChange(currentStep.id, e.target.value)
                    }
                    aria-label="Rating comment"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-between space-x-3 p-6 border-t">
          <div className="flex space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            {hasSteps && currentRatingStep > 0 && !loading && (
              <button
                onClick={handleBack}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Back
              </button>
            )}
          </div>

          {!allRatingsCompleted && hasSteps && !isCheckingPermissions && (
            <div className="flex space-x-2">
              {!isLastStep && (
                <button
                  onClick={handleSkip}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Skip
                </button>
              )}
              <button
                onClick={isLastStep ? handleSubmit : handleNext}
                disabled={loading || ratings[currentStep?.id] === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading
                  ? "Submitting..."
                  : isLastStep
                  ? "Submit Rating"
                  : "Next"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderRatingModal;