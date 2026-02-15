"use client";

import { useCartStore } from "@/store/cartStore";
import Image from "next/image";
import Link from "next/link";
import { FiMinus, FiPlus, FiTrash2, FiShoppingBag } from "react-icons/fi";
import SuggestedProducts from "@/components/cart/SuggestedProducts";
import TodaysOrders from "@/components/cart/TodaysOrders";

export default function CartPage() {
  const { items, updateQuantity, removeItem, getSubtotal, getDeliveryFee, getTotal, clearCart } =
    useCartStore();

  const formatPrice = (price: number | undefined | null) => {
    const safePrice = typeof price === "number" && !isNaN(price) ? price : 0;
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(safePrice);
  };

  // Extract product IDs and category IDs from cart items for suggestions
  const cartProductIds = items
    .map((item) => {
      const product = typeof item.product === "object" ? item.product : null;
      return product?._id;
    })
    .filter(Boolean) as string[];

  const cartCategoryIds = items
    .map((item) => {
      const product = typeof item.product === "object" ? item.product : null;
      const category = product?.category;
      return typeof category === "object" ? category._id : category;
    })
    .filter(Boolean) as string[];

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <FiShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h1 className="text-2xl font-heading font-bold text-gray-800 mb-2">
              Your cart is empty
            </h1>
            <p className="text-gray-500 mb-6">
              Looks like you have not added any items to your cart yet.
            </p>
            <Link
              href="/products"
              className="inline-block bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-600 transition-colors"
            >
              Start Shopping
            </Link>
          </div>

          <TodaysOrders />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-heading font-bold text-gray-800 mb-8">Shopping Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md">
              {items.map((item) => {
                const product = typeof item.product === "object" ? item.product : null;
                const imageUrl =
                  product?.image?.secure_url ||
                  "https://res.cloudinary.com/nmasuki/image/upload/c_fill,w_100,h_100/placeholder.png";
                const itemPrice = typeof item.price === "number" && !isNaN(item.price) ? item.price : 0;
                const itemPieces = typeof item.pieces === "number" && !isNaN(item.pieces) ? item.pieces : 0;

                return (
                  <div
                    key={item._id}
                    className="flex items-center gap-4 p-4 border-b last:border-b-0"
                  >
                    {/* Product Image */}
                    <div className="relative w-20 h-20 flex-shrink-0">
                      <Image
                        src={imageUrl}
                        alt={product?.name || "Product"}
                        fill
                        className="object-contain rounded"
                      />
                    </div>

                    {/* Product Info */}
                    <div className="flex-grow">
                      <h3 className="font-semibold text-gray-800">
                        {product?.name || "Product"}
                      </h3>
                      <p className="text-sm text-gray-500">{item.quantity}</p>
                      <p className="text-primary font-bold">
                        {formatPrice(itemPrice)}
                      </p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item._id, itemPieces - 1)}
                        className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 hover:bg-gray-100"
                      >
                        <FiMinus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-semibold">{itemPieces}</span>
                      <button
                        onClick={() => updateQuantity(item._id, itemPieces + 1)}
                        className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 hover:bg-gray-100"
                      >
                        <FiPlus className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Item Total */}
                    <div className="text-right">
                      <p className="font-bold text-gray-800">
                        {formatPrice(itemPrice * itemPieces)}
                      </p>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => removeItem(item._id)}
                      className="text-red-500 hover:text-red-700 p-2"
                    >
                      <FiTrash2 className="w-5 h-5" />
                    </button>
                  </div>
                );
              })}
            </div>

            <button
              onClick={clearCart}
              className="mt-4 text-gray-500 hover:text-red-500 text-sm"
            >
              Clear Cart
            </button>

            {/* Usually Ordered With Section */}
            <SuggestedProducts
              cartProductIds={cartProductIds}
              cartCategoryIds={cartCategoryIds}
            />
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              <h2 className="text-xl font-heading font-bold text-gray-800 mb-4">
                Order Summary
              </h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatPrice(getSubtotal())}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Fee</span>
                  <span>
                    {getDeliveryFee() === 0 ? (
                      <span className="text-green-600">FREE</span>
                    ) : (
                      formatPrice(getDeliveryFee())
                    )}
                  </span>
                </div>
                {getSubtotal() < 3000 && (
                  <p className="text-sm text-gray-500">
                    Add {formatPrice(3000 - getSubtotal())} more for free delivery
                  </p>
                )}
                <hr />
                <div className="flex justify-between text-lg font-bold text-gray-800">
                  <span>Total</span>
                  <span className="text-primary">{formatPrice(getTotal())}</span>
                </div>
              </div>

              <Link
                href="/checkout"
                className="block w-full bg-success text-white text-center py-3 rounded-lg font-semibold hover:bg-success-600 transition-colors"
              >
                Proceed to Checkout
              </Link>

              <Link
                href="/products"
                className="block w-full text-center py-3 mt-3 text-teal hover:text-teal-700"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
