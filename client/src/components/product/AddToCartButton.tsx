"use client";

import { useState } from "react";
import { FiShoppingCart, FiMinus, FiPlus, FiCheck } from "react-icons/fi";
import { useCartStore } from "@/store/cartStore";
import { IProduct } from "@/types";
import toast from "react-hot-toast";
import Image from "next/image";

interface AddToCartButtonProps {
  product: IProduct;
}

export default function AddToCartButton({ product }: AddToCartButtonProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedOption, setSelectedOption] = useState(0);
  const [isAdded, setIsAdded] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

  const priceOptions = product.priceOptions || [];
  const currentOption = priceOptions[selectedOption];
  const optionText = currentOption?.optionText || "";

  const handleAddToCart = () => {
    addItem(product, optionText, quantity);
    setIsAdded(true);

    const imageUrl = product.image?.secure_url || product.image?.url || "";

    toast.success(
      <div className="flex items-center gap-3">
        {imageUrl && (
          <Image src={imageUrl} alt="" width={50} height={50} className="rounded" />
        )}
        <div>
          <p className="font-medium">{product.name}</p>
          <p className="text-sm text-gray-500">
            {quantity} x {optionText || "item"} added to cart
          </p>
        </div>
      </div>,
      { duration: 3000 }
    );

    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Option Selector */}
      {priceOptions.length > 1 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Option
          </label>
          <select
            value={selectedOption}
            onChange={(e) => setSelectedOption(Number(e.target.value))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal focus:border-transparent"
          >
            {priceOptions.map((opt, idx) => {
              const optPrice = opt.offerPrice && opt.price > opt.offerPrice ? opt.offerPrice : opt.price;
              return (
                <option key={opt._id || idx} value={idx}>
                  {opt.optionText} - {opt.currency || "KES"} {optPrice.toLocaleString()}
                </option>
              );
            })}
          </select>
        </div>
      )}

      {/* Quantity Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Quantity
        </label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="w-12 h-12 flex items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors"
          >
            <FiMinus className="w-5 h-5" />
          </button>
          <span className="w-16 text-center text-xl font-bold">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity(quantity + 1)}
            className="w-12 h-12 flex items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors"
          >
            <FiPlus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Add to Cart Button */}
      <button
        onClick={handleAddToCart}
        disabled={isAdded}
        className={`w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-3 transition-all ${
          isAdded
            ? "bg-green-500 text-white"
            : "bg-success text-white hover:bg-success/90"
        }`}
      >
        {isAdded ? (
          <>
            <FiCheck className="w-6 h-6" />
            Added to Cart!
          </>
        ) : (
          <>
            <FiShoppingCart className="w-6 h-6" />
            Add to Cart
          </>
        )}
      </button>
    </div>
  );
}
