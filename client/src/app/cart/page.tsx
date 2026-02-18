"use client";

import { useState } from "react";
import { useCartStore } from "@/store/cartStore";
import Image from "next/image";
import Link from "next/link";
import { FiMinus, FiPlus, FiTrash2, FiShoppingBag, FiTag, FiX } from "react-icons/fi";
import SuggestedProducts from "@/components/cart/SuggestedProducts";
import TodaysOrders from "@/components/cart/TodaysOrders";
import axios from "axios";
import toast from "react-hot-toast";

export default function CartPage() {
  const {
    items, updateQuantity, removeItem, getSubtotal, getDeliveryFee, getDiscount, getTotal, clearCart,
    promo, applyPromo, removePromo,
  } = useCartStore();

  const [promoCode, setPromoCode] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState("");

  const formatPrice = (price: number | undefined | null) => {
    const safePrice = typeof price === "number" && !isNaN(price) ? price : 0;
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(safePrice);
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    setPromoError("");
    try {
      const res = await axios.post("/api/promos", { code: promoCode.trim() });
      if (res.data.response === "success") {
        applyPromo(res.data.data);
        setPromoCode("");
        toast.success(`Promo "${res.data.data.name}" applied!`);
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Invalid promo code";
      setPromoError(message);
    } finally {
      setPromoLoading(false);
    }
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
      return category && typeof category === "object" ? category._id : category;
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

  const discount = getDiscount();

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-6xl mx-auto px-3 sm:px-4">
        <h1 className="text-2xl sm:text-3xl font-heading font-bold text-gray-800 mb-4 sm:mb-8">Shopping Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md">
              {items.map((item) => {
                const product = typeof item.product === "object" ? item.product : null;
                const imageUrl = product?.image?.secure_url || "https://res.cloudinary.com/nmasuki/image/upload/c_fill,w_100,h_100/placeholder.png";
                const itemPrice = typeof item.price === "number" && !isNaN(item.price) ? item.price : 0;
                const itemPieces = typeof item.pieces === "number" && !isNaN(item.pieces) ? item.pieces : 0;

                return (
                  <div
                    key={item._id}
                    className="p-4 border-b last:border-b-0"
                  >
                    {/* Top: Image + Info + Remove */}
                    <div className="flex items-start gap-3">
                      <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0">
                        <Image
                          src={imageUrl}
                          alt={product?.name || "Product"}
                          fill
                          className="object-contain rounded"
                        />
                      </div>

                      <div className="flex-grow min-w-0">
                        <h3 className="font-semibold text-gray-800 text-sm sm:text-base leading-tight">
                          {product?.name || "Product"}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-500">{item.quantity}</p>
                        <p className="text-primary font-bold text-sm sm:text-base">
                          {formatPrice(itemPrice)}
                        </p>
                      </div>

                      <button
                        onClick={() => removeItem(item._id)}
                        className="text-gray-400 hover:text-red-500 p-1 flex-shrink-0"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Bottom: Quantity + Total */}
                    <div className="flex items-center justify-between mt-3 ml-[76px] sm:ml-[92px]">
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
                      <p className="font-bold text-gray-800">
                        {formatPrice(itemPrice * itemPieces)}
                      </p>
                    </div>
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
                Cart Summary
              </h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatPrice(getSubtotal())}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Fee</span>
                  <span>{formatPrice(getDeliveryFee())}</span>
                </div>

                {/* Promo Code */}
                {promo ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2 text-green-700">
                      <FiTag className="w-4 h-4" />
                      <span className="text-sm font-medium">{promo.code}</span>
                      <span className="text-xs text-green-600">
                        ({promo.discountType === "percent" || promo.discountType === "percentage"
                          ? `${promo.discount}% off`
                          : `KES ${promo.discount} off`})
                      </span>
                    </div>
                    <button
                      onClick={removePromo}
                      className="text-green-600 hover:text-red-500 p-1"
                      title="Remove promo"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => {
                          setPromoCode(e.target.value.toUpperCase());
                          setPromoError("");
                        }}
                        onKeyDown={(e) => e.key === "Enter" && handleApplyPromo()}
                        placeholder="Promo code"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal focus:border-teal outline-none"
                      />
                      <button
                        onClick={handleApplyPromo}
                        disabled={promoLoading || !promoCode.trim()}
                        className="px-4 py-2 bg-teal text-white text-sm rounded-lg hover:bg-teal/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {promoLoading ? "..." : "Apply"}
                      </button>
                    </div>
                    {promoError && (
                      <p className="text-xs text-red-500 mt-1">{promoError}</p>
                    )}
                  </div>
                )}

                {/* Discount line */}
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
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
