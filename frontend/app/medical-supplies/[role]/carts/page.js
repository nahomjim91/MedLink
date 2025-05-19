"use client";
import { useMSAuth } from "../../hooks/useMSAuth";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "../../components/ui/Button";
import { Pill, Syringe, Trash2Icon } from "lucide-react";

export default function Carts() {
  const {
    user,
    cart,
    loading,
    updateCartBatchItem,
    removeBatchFromCart,
    clearCart,
  } = useMSAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Only handle redirect logic in useEffect
    if (loading) return;

    if (!user) {
      // Not authenticated, redirect to login
      router.push("/medical-supplies/auth/login");
      return;
    }

    // Set loading to false once we've checked auth status
    setIsLoading(false);
  }, [user, loading, router]);

  // Handle item removal
  const handleRemoveItem = async (productId, batchId) => {
    try {
      await removeBatchFromCart(productId, batchId);
    } catch (error) {
      console.error("Failed to remove item:", error);
    }
  };

  // Handle cart clearing
  const handleClearCart = async () => {
    try {
      await clearCart();
    } catch (error) {
      console.error("Failed to clear cart:", error);
    }
  };

  // Loading state
  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // No cart or empty cart
  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center space-y-4 py-10">
          <Image
            src={`/Image/Empty-pana.svg`} // Assuming you have a 'No data-cuate.svg' for rejected
            alt={`Empty cart`}
            width={400}
            height={200}
            className="mx-auto"
          />
          <p className="text-xl text-secondary">Your cart is empty</p>
          <Button
            onClick={() =>
              router.push(`/medical-supplies/${user.role}/marketplace`)
            }
          >
            Shop Now
          </Button>
        </div>
      </div>
    );
  }

  console.log("Cart:", cart);

  const cartItemCard = (key, item) => {
    return (
      <div
        key={key}
        className="bg-background/20 w-full flex justify-between items-start p-2 shadow-lg rounded-2xl"
      >
        {/* Remove button (top right) */}
        <div className="flex px-3 py-1 items-center gap-4 w-[95%]">
          {item.productImage ? (
            <div className="w-20 h-20 flex-shrink-0">
              <Image
                src={item.productImage}
                alt={item.productName}
                width={80}
                height={80}
                className="object-contain"
              />
            </div>
          ) : (
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
              {item.productType !== "Drug" ? (
                <Pill size={40} className="text-primary" />
              ) : (
                <Syringe size={40} className="text-primary" />
              )}
            </div>
          )}
          <div className="flex flex-col w-full">
            {/* Product Image and Basic Info */}
            <div className="flex flex-col ">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-secondary text-lg">
                  {item.productName}
                </h3>
                <p className="text-secondary/60">
                  {item.productCategory || item.productType}
                </p>
              </div>
              <div className="flex items-baseline justify-between">
                <div className="font-medium">{item.totalQuantity} Units</div>

                <p className="font-bold mt-1">
                  Total: ${item.totalPrice.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Batch Items */}
            <div className="overflow-x-auto flex gap-2 py-2 px-1">
              {item.batchItems &&
                item.batchItems.map((batch) => (
                  <div
                    key={`${item.productId}-${batch.batchId}`}
                    className="min-w-[13rem] bg-white rounded-xl shadow-sm px-3 py-2 text-xs flex gap-1 border"
                  >
                    <div className="font-medium text-gray-800">
                      {batch.quantity} units
                    </div>
                    <div className="text-gray-500">
                      ${batch.unitPrice.toFixed(2)} / unit
                    </div>
                    {batch.expiryDate && item.productType !== "Equipment" && (
                      <div className="text-gray-400">
                        exp.{" "}
                        {new Date(batch.expiryDate).toLocaleDateString(
                          undefined,
                          {
                            month: "numeric",
                            day: "numeric",
                            year: "2-digit",
                          }
                        )}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>
        <button
          className=" text-red-500 hover:text-red-700 bg-white rounded-full p-2"
          onClick={() => handleRemoveItem(item.productId)}
        >
          <Trash2Icon className="w-6 h-6" />
        </button>
      </div>
    );
  };
  // Render cart with items
  return (
    <div className="w-full h-[88vh] bg-white rounded-2xl p-8 ">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold mb-6">items</h1>
        <Button
          onClick={() =>
            router.push(`/medical-supplies/${user.role}/marketplace`)
          }
          className="p-0 "
        >
          Continue Shopping
        </Button>
      </div>
      <div className="flex justify-between">
        {/* Cart Items */}
        <div className="w-2/3 h-[75vh] flex flex-col gap-2 overflow-y-auto">
          {cart.items.map((item) => cartItemCard(item.productId, item))}
        </div>

        {/* Cart Summary */}
        <div className="p-6 w-1/3 flex flex-col justify-end ">
          <div className=" shadow-xl p-4 rounded-xl flex flex-col justify-between">
            <div className="flex justify-between font-medium">
              <div>Total Items:</div>
              <div>{cart.totalItems}</div>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <div>Total Price:</div>
              <div>${cart.totalPrice.toFixed(2)}</div>
            </div>

            <div className="flex justify-between pt-4">
              <Button color="error" onClick={handleClearCart}>
                Clear Cart
              </Button>

              <Button
                className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
                onClick={() => router.push("/medical-supplies/buyer/checkout")}
              >
                Checkout
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
