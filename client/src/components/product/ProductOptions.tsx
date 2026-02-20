"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FiShoppingCart, FiMinus, FiPlus, FiCheck } from "react-icons/fi";
import { useCartStore } from "@/store/cartStore";
import { flyToCart } from "@/lib/flyToCart";
import { IProduct, IPriceOption } from "@/types";
import toast from "react-hot-toast";
import Image from "next/image";

interface ProductOptionsProps {
  product: IProduct;
  priceOptions: IPriceOption[];
  currency: string;
}

export default function ProductOptions({ product, priceOptions: rawPriceOptions, currency }: ProductOptionsProps) {
  const priceOptions = rawPriceOptions.filter(
    (opt, idx, arr) => opt && arr.findIndex((o) => o?.optionText === opt.optionText) === idx
  );
  const [selectedOption, setSelectedOption] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const addItem = useCartStore((state) => state.addItem);
  const router = useRouter();

  const currentOption = priceOptions[selectedOption];
  const optionText = currentOption?.optionText || "";

  const formatPrice = (p: number) => {
    return new Intl.NumberFormat("en-KE", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(p);
  };

  const getOptionPrice = (opt: IPriceOption | undefined) => {
    if (!opt) return 0;
    return opt.offerPrice && opt.price > opt.offerPrice ? opt.offerPrice : opt.price;
  };

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    addItem(product, optionText, quantity);
    setIsAdded(true);

    const imageUrl = product.image?.secure_url || product.image?.url || "";
    flyToCart(imageUrl, e.currentTarget);

    toast.success(
      <div className="flex items-center gap-3">
        {imageUrl && (
          <Image src={imageUrl} alt={product.name} width={50} height={50} className="rounded" />
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

  const displayPrice = getOptionPrice(currentOption || priceOptions[0]);
  const originalPrice = currentOption?.price || priceOptions[0]?.price || 0;
  const hasOffer = currentOption?.offerPrice && originalPrice > currentOption.offerPrice;

  return (
    <div className="space-y-6">
      {/* Price Display */}
      <div>
        <div className="flex items-baseline gap-3">
          <span className="text-4xl font-bold text-primary">
            {currency} {formatPrice(displayPrice)}
          </span>
          {hasOffer && (
            <span className="text-xl text-gray-400 line-through">
              {currency} {formatPrice(originalPrice)}
            </span>
          )}
        </div>
        {currentOption?.optionText && (
          <p className="text-gray-500 mt-1">{currentOption.optionText}</p>
        )}
      </div>

      {/* Clickable Options */}
      {priceOptions.length > 1 && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-3">Choose Option:</p>
          <div className="flex flex-wrap gap-3">
            {priceOptions.map((opt, idx) => {
              const optPrice = getOptionPrice(opt);
              const isSelected = selectedOption === idx;
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedOption(idx)}
                  className={`px-4 py-3 rounded-xl border-2 transition-all text-left min-w-[120px] ${
                    isSelected
                      ? "border-teal bg-teal/10 shadow-sm"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <p className={`text-sm font-medium ${isSelected ? "text-teal" : "text-gray-700"}`}>
                    {opt.optionText}
                  </p>
                  <p className={`font-bold ${isSelected ? "text-teal" : "text-gray-800"}`}>
                    {opt.currency || currency} {formatPrice(optPrice)}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quantity Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
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

      {/* Add to Cart & Instant Checkout */}
      <div className="flex rounded-xl overflow-hidden shadow-sm">
        <button
          onClick={handleAddToCart}
          disabled={isAdded}
          className={`flex-1 py-4 font-semibold text-lg flex items-center justify-center gap-2 transition-all ${
            isAdded ? "bg-green-500 text-white" : "bg-success text-white hover:bg-success/90"
          }`}
        >
          {isAdded ? (
            <>
              <FiCheck className="w-5 h-5" />
              Added!
            </>
          ) : (
            <>
              <FiShoppingCart className="w-5 h-5" />
              Add to Cart
            </>
          )}
        </button>
        <button
          onClick={() => {
            addItem(product, optionText, quantity);
            router.push("/checkout");
          }}
          className="flex-1 py-4 bg-primary text-white font-semibold text-lg hover:bg-primary/90 transition-all"
        >
          Instant Checkout
        </button>
      </div>
    </div>
  );
}
