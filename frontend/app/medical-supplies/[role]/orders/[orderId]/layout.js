// app/orders/[orderId]/layout.js
"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@apollo/client";
import { useMSAuth } from "../../../hooks/useMSAuth";
import { GET_ORDER_BY_ID } from "../../../api/graphql/order/orderQuery";
import { CodeSquare } from "lucide-react";

export default function OrderLayout({ children, params }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { user, loading: authLoading } = useMSAuth(); // Assuming you have an auth hook
  const [accessGranted, setAccessGranted] = useState(false);
  const [checking, setChecking] = useState(true);

  const { data, loading, error } = useQuery(GET_ORDER_BY_ID, {
    variables: { orderId: resolvedParams.orderId },
    skip: authLoading || !user,
  });

  useEffect(() => {
    if (authLoading || loading) return;

    // If user is not authenticated, redirect to login
    if (!user) {
      router.push("/login");
      return;
    }

    // If there's an error fetching the order or order doesn't exist
    if (error || !data?.order) {
      setChecking(false);
      setAccessGranted(false);
      return;
    }

    const order = data.order;

    // Check access permissions
    const hasAccess =
      user.role === "admin" ||
      user.userId === order.buyerId ||
      user.userId === order.sellerId;

    if (!hasAccess) {
      // Unauthorized access - redirect to home after a brief delay
      setTimeout(() => {
        router.push("/");
      }, 1000000);
      setAccessGranted(false);
    } else {
      setAccessGranted(true);
    }

    setChecking(false);
  }, [user, data, error, loading, authLoading, router, resolvedParams.orderId]);

  // Show loading state
  if (authLoading || loading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  // Show access denied message
  if (!accessGranted) {
    console.log(
      "Access Denied: User does not have permission to view this order",
      data
    );
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <svg
              className="mx-auto h-16 w-16 text-red-500 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <h1 className="text-2xl font-bold text-secondary mb-2">
              Access Denied
            </h1>
            <p className="text-gray-600 mb-6">
              You don&apos;t have permission to view this order. You can only
              view orders where you are the buyer or seller.
              {/* { order.buyerId} , {order.sellerId} , {user.id} */}
            </p>
            <div className="space-y-2">
              <p className="text-sm text-gray-500">
                Redirecting to home page in 3 seconds...
              </p>
              <button
                onClick={() => router.push("/")}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Go to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render children if access is granted
  return <>{children}</>;
}
