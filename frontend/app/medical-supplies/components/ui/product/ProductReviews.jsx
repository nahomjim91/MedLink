import { useState, useMemo } from "react";
import {
  Star,
  ThumbsUp,
  MessageCircle,
  Filter,
  Image,
  FileText,
  Clock,
  User,
} from "lucide-react";

const ProductReviews = ({
  productRatings = [],
  productRatingStats = {},
  loading = false,
}) => {
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("all");

  // Calculate rating distribution from actual data
  const ratingDistribution = useMemo(() => {
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    productRatings.forEach((rating) => {
      if (rating.rating >= 1 && rating.rating <= 5) {
        distribution[rating.rating]++;
      }
    });
    return distribution;
  }, [productRatings]);

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const StarRating = ({ rating, size = "sm", interactive = false }) => {
    const sizeClass =
      size === "lg" ? "w-6 h-6" : size === "xl" ? "w-8 h-8" : "w-4 h-4";
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClass} transition-all duration-200 ${
              star <= rating
                ? "fill-primary text-primary/60 drop-shadow-sm"
                : "text-secondary/30"
            } ${interactive ? "hover:scale-110" : ""}`}
          />
        ))}
      </div>
    );
  };

  const RatingBar = ({ rating, count, total }) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    return (
      <div className="flex items-center gap-4 group">
        <div className="flex items-center gap-2 min-w-[50px]">
          <span className="text-sm font-semibold text-secondary/70">{rating}</span>
          <Star className="w-4 h-4 fill-primary text-primary" />
        </div>
        <div className="flex-1 bg-secondary/10 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-primary/50 to-primary h-3 rounded-full transition-all duration-700 ease-out shadow-sm"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-sm font-medium text-secondary/60 min-w-[40px] text-right">
          {count}
        </span>
      </div>
    );
  };

  const filteredRatings = useMemo(() => {
    let filtered = productRatings;

    if (selectedFilter !== "all") {
      filtered = filtered.filter(
        (rating) => rating.rating === parseInt(selectedFilter)
      );
    }
    return filtered;
  }, [productRatings, selectedFilter, activeTab]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-primary/10 shadow-lg p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gradient-to-r from-primary/20 to-primary/30 rounded-lg w-1/3 mb-8"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="space-y-4">
              <div className="h-20 bg-gradient-to-r from-primary/20 to-primary/30 rounded-xl"></div>
              <div className="h-16 bg-gradient-to-r from-primary/20 to-primary/30 rounded-xl"></div>
            </div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-6 bg-gradient-to-r from-primary/20 to-primary/30 rounded-lg"
                ></div>
              ))}
            </div>
          </div>
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 bg-gradient-to-r from-primary/20 to-primary/30 rounded-xl"
              ></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl  overflow-hidden">
      {/* Header */}
      <div className="">
        <h2 className="text-xl font-bold text-secondary/80 flex items-center gap-3">
         
          Product Reviews
        </h2>
      </div>

      <div className="p-8">
        {/* Overall Rating Section */}
        <div className="flex flex-col md:flex-row justify-around gap-8 mb-10">
          <div className="flex-1/2 flex flex-col items-center justify-center ">
            <div className="relative ">
              <div className="w-24 h-24 rounded-full bg-gradient-to-r from-emerald-400 to-primary flex items-center justify-center shadow-xl">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
                  <span className="text-3xl font-bold text-secondary">
                    {productRatingStats.averageRating || "0"}
                  </span>
                </div>
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg">
                <Star className="w-4 h-4 text-white fill-current" />
              </div>
            </div>
            <div className="mt-4 text-center lg:text-left">
              <StarRating
                rating={Math.round(productRatingStats.averageRating || 0)}
                size="lg"
                interactive
              />
              <p className="text-sm text-secondary/60 mt-2 font-medium">
                Based on {productRatingStats.totalRatings || 0} reviews
              </p>
            </div>
          </div>

          <div className="felx-1 w-full bg-primary/5 rounded-xl p-6 ">
            <h3 className="text-lg font-semibold text-secondary/90 mb-4">
              Rating Distribution
            </h3>
            <div className="space-y-3">
              {[5, 4, 3, 2, 1].map((rating) => (
                <RatingBar
                  key={rating}
                  rating={rating}
                  count={ratingDistribution[rating] || 0}
                  total={productRatingStats.totalRatings || 0}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-3">
          <div className="lg:col-span-1">
            <div className="bg-primary/5 rounded-2xl p-6 ">
              <h3 className="font-semibold text-secondary/90 mb-4 flex items-center gap-2">
                <Filter className="w-5 h-5 text-primary" />
                Filter Reviews
              </h3>
              <div className="space-y-3">
                <label className="flex items-center cursor-pointer group">
                  <input
                    type="radio"
                    name="rating"
                    value="all"
                    checked={selectedFilter === "all"}
                    onChange={(e) => setSelectedFilter(e.target.value)}
                    className="w-4 h-4 text-primary/60 border-secondary/30 focus:ring-primary/50"
                  />
                  <span className="ml-3 text-sm font-medium text-secondary/70 group-hover:text-primary transition-colors">
                    All Reviews
                  </span>
                </label>
                {[5, 4, 3, 2, 1].map((rating) => (
                  <label
                    key={rating}
                    className="flex items-center cursor-pointer group"
                  >
                    <input
                      type="radio"
                      name="rating"
                      value={rating.toString()}
                      checked={selectedFilter === rating.toString()}
                      onChange={(e) => setSelectedFilter(e.target.value)}
                      className="w-4 h-4 text-primary border-secondary/30 focus:ring-primary/50"
                    />
                    <div className="ml-3 flex items-center gap-2">
                      <StarRating rating={rating} />
                      <span className="text-sm font-medium text-secondary/70 group-hover:text-primary transition-colors">
                        {rating} Star{rating !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">

            {/* Reviews List */}
            <div className="space-y-3 h-[50vh] overflow-y-auto scrollbar-hide">
              {filteredRatings.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="w-8 h-8 text-primary" />
                  </div>
                  <p className="text-secondary/50 text-lg">
                    No reviews found matching your criteria
                  </p>
                </div>
              ) : (
                filteredRatings.map((review, index) => (
                  <div
                    key={review.id}
                    className="bg-primary/5 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-4">
                        <StarRating rating={review.rating} size="lg" />
                        <div className="flex items-center gap-2 text-sm text-secondary/50">
                          <Clock className="w-4 h-4" />
                          {formatDate(review.createdAt)}
                        </div>
                      </div>
                    </div>

                    <div className="mb-3">
                      <p className="text-secondary/80 text-lg leading-relaxed">
                        {review.comment}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-r from-primary/40 to-primary p-0.5">
                            <div className="w-full h-full rounded-full overflow-hidden bg-white">
                              <img
                                src={
                                  process.env
                                    .NEXT_PUBLIC_MEDICAL_SUPPLIES_API_URL +
                                  review.userProfileImage
                                }
                                alt={review.userName}
                                className="w-full h-full object-cover"
                              />
                              <div
                                className="w-full h-full bg-secondary/10 rounded-full flex items-center justify-center"
                                style={{ display: "none" }}
                              >
                                <User className="w-6 h-6 text-secondary/40" />
                              </div>
                            </div>
                          </div>
                        </div>
                        <div>
                          <p className="font-semibold text-secondary/90">
                            {review.userName}
                          </p>
                          <p className="text-sm text-secondary/60">
                            {review.userCompanyName}
                          </p>
                        </div>
                      </div>

                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductReviews;
