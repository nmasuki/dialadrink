"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiShoppingCart } from "react-icons/fi";
import { useCartStore } from "@/store/cartStore";

export default function StickyCartBar() {
  const { items } = useCartStore();
  const pathname = usePathname();

  const totalItems = items.reduce((sum, item) => sum + (item.pieces || 1), 0);

  // Hide on cart and checkout pages
  const hiddenPaths = ["/cart", "/checkout"];
  const shouldHide = hiddenPaths.some(path => pathname.startsWith(path));

  if (items.length === 0 || shouldHide) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-0 right-0 z-50 pointer-events-none">
      <div className="max-w-md mx-auto px-4">
        <div className="flex items-center justify-center gap-2 pointer-events-auto">
          {/* View Cart Button */}
          <Link
            href="/cart"
            className="flex items-center gap-2 px-4 py-3 bg-white border-2 border-gray-300 hover:border-gray-400 rounded-lg shadow-lg transition-colors"
          >
            <div className="relative">
              <FiShoppingCart className="w-5 h-5 text-gray-700" />
              <span className="absolute -top-2 -right-2 bg-primary text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {totalItems > 99 ? "99+" : totalItems}
              </span>
            </div>
            <span className="text-sm font-semibold text-gray-800 uppercase">View Cart</span>
          </Link>

          {/* Instant Checkout Button */}
          <Link
            href="/checkout"
            className="px-6 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-lg shadow-lg transition-colors text-center uppercase tracking-wide"
          >
            Instant Checkout
          </Link>
        </div>
      </div>
    </div>
  );
}
