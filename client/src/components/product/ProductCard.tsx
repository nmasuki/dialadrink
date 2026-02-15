"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FiShoppingCart, FiCheck, FiEye } from "react-icons/fi";
import { IProduct, IPriceOption } from "@/types";
import { useCartStore } from "@/store";
import toast from "react-hot-toast";

interface ProductCardProps {
  product: IProduct;
}

function getOptionPrice(opt: IPriceOption, fallback: number) {
  const price = opt?.price || fallback;
  const offerPrice = opt?.offerPrice || 0;
  return offerPrice > 0 && price > offerPrice ? offerPrice : price;
}

export default function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [showOptions, setShowOptions] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const imageUrl = product.image?.secure_url || product.image?.url ||
    "https://res.cloudinary.com/nmasuki/image/upload/c_fill,w_300,h_300/placeholder.png";

  // Deduplicate options by optionText
  const priceOptions = (product.priceOptions || []).filter(
    (opt, idx, arr) => arr.findIndex((o) => o.optionText === opt.optionText) === idx
  );
  const hasMultipleOptions = priceOptions.length > 1;

  const currentOption = priceOptions[selectedIdx] || priceOptions[0];
  const regularPrice = currentOption?.price || product.price || 0;
  const offerPrice = currentOption?.offerPrice || 0;
  const displayPrice = (offerPrice > 0 && regularPrice > offerPrice) ? offerPrice : regularPrice;
  const originalPrice = (offerPrice > 0 && regularPrice > offerPrice) ? regularPrice : null;
  const optionText = currentOption?.optionText || "";

  const discountPercent = originalPrice && originalPrice > displayPrice
    ? Math.round(((originalPrice - displayPrice) / originalPrice) * 100)
    : null;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (hasMultipleOptions && !showOptions) {
      setShowOptions(true);
      return;
    }

    addItem(product, optionText, 1);
    toast.success(`${product.name} added to cart`);
    setJustAdded(true);
    setShowOptions(false);
    setTimeout(() => setJustAdded(false), 1500);
  };

  const handleOptionSelect = (idx: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedIdx(idx);
    const opt = priceOptions[idx];
    addItem(product, opt?.optionText || "", 1);
    toast.success(`${product.name} (${opt?.optionText}) added to cart`);
    setJustAdded(true);
    setShowOptions(false);
    setTimeout(() => setJustAdded(false), 1500);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-KE", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Link
      href={`/products/${product.href}`}
      className="group card overflow-hidden relative"
    >
      {/* Image */}
      <div className="relative aspect-square bg-gray-100">
        <Image
          src={imageUrl}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {discountPercent && discountPercent > 0 && (
            <span className="bg-primary text-white text-xs font-bold px-2 py-1 rounded">
              -{discountPercent}%
            </span>
          )}
          {product.isPopular && (
            <span className="bg-teal text-white text-xs font-bold px-2 py-1 rounded">
              Popular
            </span>
          )}
        </div>

        {/* Out of stock overlay */}
        {!product.inStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-gray-800 text-white px-3 py-1 rounded text-sm font-semibold">
              Out of Stock
            </span>
          </div>
        )}

        {/* Hover Actions */}
        {product.inStock && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
            <button
              onClick={handleAddToCart}
              className={`p-3 rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 ${
                justAdded
                  ? "bg-green-500 text-white"
                  : "bg-success text-white hover:bg-success/90"
              }`}
              aria-label="Add to cart"
            >
              {justAdded ? <FiCheck className="w-5 h-5" /> : <FiShoppingCart className="w-5 h-5" />}
            </button>
            <span
              className="bg-white text-gray-800 p-3 rounded-full shadow-lg hover:bg-gray-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 delay-75 cursor-pointer"
              aria-label="View product"
            >
              <FiEye className="w-5 h-5" />
            </span>
          </div>
        )}
      </div>

      {/* Options dropdown */}
      {showOptions && hasMultipleOptions && (
        <div className="absolute left-0 right-0 bottom-[calc(100%-aspect-square)] z-20 bg-white border-t shadow-lg rounded-b-lg p-2 space-y-1">
          <p className="text-xs font-medium text-gray-500 px-1">Choose option:</p>
          {priceOptions.map((opt, idx) => {
            const price = getOptionPrice(opt, product.price || 0);
            return (
              <button
                key={idx}
                onClick={(e) => handleOptionSelect(idx, e)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm hover:bg-teal/10 transition-colors text-left"
              >
                <span className="text-gray-700">{opt.optionText}</span>
                <span className="font-semibold text-gray-900">KES {formatPrice(price)}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {/* Category */}
        {product.category && typeof product.category !== "string" && (
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            {product.category.name}
          </p>
        )}

        {/* Name */}
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {product.name}
        </h3>

        {/* Alcohol content & origin */}
        {(product.alcoholContent || product.countryOfOrigin) && (
          <p className="text-xs text-gray-500 mb-2">
            {product.alcoholContent && `${product.alcoholContent}% ABV`}
            {product.alcoholContent && product.countryOfOrigin && " | "}
            {product.countryOfOrigin}
          </p>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold text-primary">
            KES {formatPrice(displayPrice)}
          </span>
          {originalPrice && (
            <span className="text-sm text-gray-400 line-through">
              KES {formatPrice(originalPrice)}
            </span>
          )}
        </div>

        {/* Option text / multiple options indicator */}
        {hasMultipleOptions ? (
          <p className="text-xs text-teal font-medium mt-1">
            {priceOptions.length} options available
          </p>
        ) : optionText ? (
          <p className="text-xs text-gray-500 mt-1">{optionText}</p>
        ) : null}
      </div>
    </Link>
  );
}
