// app/orders/[orderId]/page.js
"use client";

import { useQuery } from "@apollo/client";
import { useMSAuth } from "../../../hooks/useMSAuth";
import { GET_ORDER_DETAILS_BY_ID } from "../../../api/graphql/order/orderQuery";
import { GET_MS_USER_BY_ID } from "../../../api/graphql/queries";
import { use, useState, useMemo } from "react";
import Image from "next/image";
import { MessageCircleIcon, UserRound, Download } from "lucide-react";
import { Button, TablePageButtons } from "../../../components/ui/Button";
import { downloadOrderReceipt } from "../../../components/ui/downloadReceipt/downloadOrderReceipt";
import { useRouter } from "next/navigation";

const StatusBadge = ({ status }) => {
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "confirmed":
      case "received":
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "delivered":
        return "bg-blue-100 text-blue-800";
      case "paid":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-sectext-secondary/10 text-secondary/80";
    }
  };

  return (
    <span
      className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${getStatusColor(
        status
      )}`}
    >
      {status}
    </span>
  );
};

const StarRating = ({ rating }) => {
  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-4 h-4 ${
            star <= rating ? "text-yellow-400" : "text-secondary/30"
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.173c.969 0 1.371 1.24.588 1.81l-3.372 2.45a1 1 0 00-.364 1.118l1.286 3.967c.3.921-.755 1.688-1.539 1.118l-3.372-2.45a1 1 0 00-1.176 0l-3.372 2.45c-.784.57-1.838-.197-1.539-1.118l1.286-3.967a1 1 0 00-.364-1.118L2.049 9.394c-.783-.57-.38-1.81.588-1.81h4.173a1 1 0 00.95-.69l1.286-3.967z" />
        </svg>
      ))}
      <span className="ml-1 text-sm text-secondary/60">{rating}</span>
    </div>
  );
};

export default function OrderDetailsPage({ params }) {
  const resolvedParams = use(params);
  const { user } = useMSAuth();
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const { data, loading, error } = useQuery(GET_ORDER_DETAILS_BY_ID, {
    variables: { orderId: resolvedParams.orderId },
    skip: !user || !user.userId,
    fetchPolicy: "network-only",
  });

  const { data: otherUserData, loading: otherUserLoading } = useQuery(
    GET_MS_USER_BY_ID,
    {
      variables: {
        userId:
          data?.order.buyerId === user.userId
            ? data?.order.sellerId
            : data?.order?.buyerId,
      },
      skip: !data?.order || !user || !user.userId,
      fetchPolicy: "network-only",
    }
  );

  // Flatten all batch items for the table
  const allBatchItems = useMemo(() => {
    if (!data?.order?.items) return [];
    return data.order.items.flatMap((item) =>
      item.batchItems.map((batch) => ({
        ...batch,
        productName: item.productName,
        productImage: item.productImage,
      }))
    );
  }, [data?.order?.items]);

  // Pagination logic
  const totalPages = Math.ceil(allBatchItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = allBatchItems.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-secondary/60">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !data?.order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-secondary/90 mb-2">
            Order Not Found
          </h1>
          <p className="text-secondary/60">
            The order you&apos;re looking for doesn&apos;t exist.
          </p>
        </div>
      </div>
    );
  }

  const order = data.order;
  const otherUser = otherUserData?.msUserById;
  const isCurrentUserBuyer = order.buyerId === user.userId;

  return (
    <div className=" px-4 sm:px-6 ">
      {/* Two Cards Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Order Information Card */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-secondary/90 mb-4">
            Order #{order.orderId}
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-secondary/80">Information</span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-secondary/70">Status</span>
                <div className="mt-1 ">
                  <StatusBadge status={order.status} />
                </div>
              </div>
              <div>
                <span className="text-secondary/70">Payment</span>
                <div className="mt-1">
                  <StatusBadge status={order.paymentStatus} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-secondary/70">Cost</span>
                <p className="font-semibold text-lg">
                  ${order.totalCost.toFixed(2)}
                </p>
              </div>
              <div>
                <span className="text-secondary/70">Transaction No.</span>
                <p className="font-mono text-xs">
                  {order.transactionId || "#12345678"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-secondary/70">Order Date</span>
                <p>{new Date(order.orderDate).toLocaleDateString()}</p>
              </div>
              <div>
                <span className="text-secondary/70">Received Date</span>
                <p>
                  {order.pickupConfirmedDate
                    ? new Date(order.pickupConfirmedDate).toLocaleDateString()
                    : "Pending"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Supplier Information Card */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-bold text-secondary/90">
              {isCurrentUserBuyer
                ? "Supplier Information"
                : "Buyer Information"}
            </h2>
            <Button
              className="flex gap-1.5 items-center"
              onClick={() => {
                const params = new URLSearchParams({
                  orderId: order.orderId || "",
                  userId:  user.userId === order?.sellerId ? order.buyerId : order.sellerId || "",
                });

                router.push(
                  `/medical-supplies/${user.role}/chats?${params.toString()}`
                );
              }}
            >
              <MessageCircleIcon className="h-5 w-5" /> Message{" "}
            </Button>
          </div>

          {otherUserLoading ? (
            <div className="animate-pulse">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-sectext-secondary/30 rounded-full"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-sectext-secondary/30 rounded w-24"></div>
                  <div className="h-3 bg-sectext-secondary/30 rounded w-32"></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  {otherUser?.profileImageUrl ? (
                    <Image
                      src={process.env.NEXT_PUBLIC_MEDICAL_SUPPLIES_API_URL+otherUser.profileImageUrl}
                      alt="Profile"
                      width={64}
                      height={64}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <UserRound className="w-16 h-16 text-primary" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-secondary/70">Name</span>
                      <p className="font-medium">
                        {isCurrentUserBuyer
                          ? order.sellerName
                          : order.buyerName}
                      </p>
                    </div>
                    <div>
                      <span className="text-secondary/70">Company</span>
                      <p className="text-secondary/70">
                        {otherUser?.companyName ||
                          (isCurrentUserBuyer
                            ? order.sellerCompanyName
                            : order.buyerCompanyName) ||
                          "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-secondary/70">Rating</span>
                  <div className="mt-1">
                    <StarRating rating={4.5} className="text-primary" />
                  </div>
                </div>
                <div>
                  <span className="text-secondary/70">FDA Certificate</span>
                  <div className="mt-1">
                    {otherUser?.efdaLicenseUrl ? (
                      <span className="text-green-600 text-xs">✓ Verified</span>
                    ) : (
                      <span className="text-secondary/40 text-xs">
                        Not available
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-sm">
                <span className="text-secondary/70">License</span>
                <div className="mt-1">
                  {otherUser?.businessLicenseUrl ? (
                    <span className="text-green-600 text-xs">
                      ✓ Business License Verified
                    </span>
                  ) : (
                    <span className="text-secondary/40 text-xs">
                      License not available
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="px-6 py-3 bg-sectext-secondary/70 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold text-secondary/90">Items</h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-secondary/70">Show:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1); // Reset to first page when changing items per page
                }}
                className="border border-secondary/20 rounded px-2 py-1 text-sm"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={20}>20</option>
              </select>
              <span className="text-sm text-secondary/70">per page</span>
            </div>
          </div>
          <Button
            onClick={downloadOrderReceipt(order, otherUser, user)}
            className="flex gap-1.5 items-center"
          >
            <Download className="h-4 w-4" />
            Download Receipt
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-teal-50 border-b border-secondary/20">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-secondary/70 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-secondary/70 uppercase tracking-wider">
                  Batch No.
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-secondary/70 uppercase tracking-wider">
                  Expire
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-secondary/70 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-secondary/70 uppercase tracking-wider">
                  Unit Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-secondary/70 uppercase tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {currentItems.map((batch, index) => (
                <tr
                  key={batch.orderBatchItemId}
                  className="hover:bg-sectext-secondary/7 border-b border-secondary/20"
                >
                  <td className="px-6 py-2 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-secondary/90">
                        {batch.productName}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-secondary/90">
                    #{batch.batchId}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-secondary/90">
                    {batch.expiryDate
                      ? new Date(batch.expiryDate).toLocaleDateString()
                      : "N/A"}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-secondary/90">
                    {batch.quantity}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-secondary/90">
                    ${batch.unitPrice.toFixed(2)}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-secondary/90">
                    ${batch.subtotal.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {allBatchItems.length > 0 && (
          <TablePageButtons
            page={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            onPrevious={handlePrevious}
            onNext={handleNext}
            previousLabel="Previous"
            nextLabel="Next"
            className="px-4 py-2"
          />
        )}
      </div>
    </div>
  );
}
