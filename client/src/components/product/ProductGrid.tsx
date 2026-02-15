"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FiShoppingCart, FiEye, FiCheck } from "react-icons/fi";
import { IProduct, IPriceOption } from "@/types";
import { useCartStore } from "@/store";
import toast from "react-hot-toast";

interface ProductGridProps {
  products: IProduct[];
  columns?: 2 | 3 | 4 | 5;
}

export default function ProductGrid({ products, columns = 4 }: ProductGridProps) {
  const gridCols = {
    2: "grid-cols-2",
    3: "grid-cols-2 md:grid-cols-3",
    4: "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
    5: "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-4 md:gap-6`}>
      {products.map((product) => (
        <ProductCard key={product._id} product={product} />
      ))}
    </div>
  );
}

function getOptionPrice(opt: IPriceOption, fallback: number) {
  const price = opt?.price || fallback;
  const offerPrice = opt?.offerPrice || 0;
  return offerPrice > 0 && price > offerPrice ? offerPrice : price;
}

function ProductCard({ product }: { product: IProduct }) {
  const addItem = useCartStore((state) => state.addItem);
  const [showOptions, setShowOptions] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const imageUrl = product.image?.secure_url || product.image?.url ||
    "https://res.cloudinary.com/nmasuki/image/upload/c_fill,w_300,h_300/placeholder.png";

  // Deduplicate options by optionText
  const priceOptions = (product.priceOptions || []).filter(
    (opt, idx, arr) => arr.findIndex((o) => o.optionText === opt.optionText) === idx
  );
  const hasMultipleOptions = priceOptions.length > 1;

  const currentOption = priceOptions[0];
  const regularPrice = currentOption?.price || product.price || 0;
  const offerPrice = currentOption?.offerPrice || 0;
  const hasOffer = offerPrice > 0 && regularPrice > offerPrice;
  const displayPrice = hasOffer ? offerPrice : regularPrice;
  const currency = currentOption?.currency || product.currency || "KES";
  const optionText = currentOption?.optionText || "";

  const discountPercent = hasOffer
    ? Math.round(((regularPrice - offerPrice) / regularPrice) * 100)
    : null;

  const doAdd = (optText: string) => {
    addItem(product, optText, 1);
    toast.success(
      <div className="flex items-center gap-2">
        <Image src={imageUrl} alt="" width={40} height={40} className="rounded" />
        <div>
          <p className="font-medium">{product.name}</p>
          <p className="text-sm text-gray-500">{optText ? `${optText} — Added` : "Added to cart"}</p>
        </div>
      </div>,
      { duration: 2000 }
    );
    setJustAdded(true);
    setShowOptions(false);
    setTimeout(() => setJustAdded(false), 1500);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (hasMultipleOptions && !showOptions) {
      setShowOptions(true);
      return;
    }

    doAdd(optionText);
  };

  const handleOptionSelect = (idx: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    doAdd(priceOptions[idx]?.optionText || "");
  };

  const handleCloseOptions = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowOptions(false);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-KE", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden relative">
      {/* Image Container */}
      <Link href={`/products/${product.href}`} className="block relative">
        <div className="relative aspect-square bg-gray-50 overflow-hidden">
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover group-hover:scale-110 transition-transform duration-500"
          />

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
            {discountPercent && discountPercent > 0 && (
              <span className="bg-primary text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm">
                -{discountPercent}%
              </span>
            )}
            {product.isPopular && (
              <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm">
                Hot
              </span>
            )}
          </div>

          {/* Out of stock overlay */}
          {!product.inStock && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
              <span className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-semibold">
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
      </Link>

      {/* Options dropdown overlay */}
      {showOptions && hasMultipleOptions && (
        <div
          className="absolute inset-0 z-20 bg-black/40 flex items-end"
          onClick={handleCloseOptions}
        >
          <div
            className="w-full bg-white rounded-t-xl p-3 space-y-1 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
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
                  <span className="font-semibold text-gray-900">{currency} {formatPrice(price)}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {/* Category */}
        {product.category && typeof product.category !== "string" && (
          <p className="text-xs text-teal font-medium uppercase tracking-wide mb-1">
            {product.category.name}
          </p>
        )}

        {/* Name */}
        <Link href={`/products/${product.href}`}>
          <h3 className="font-semibold text-gray-800 mb-1 line-clamp-2 group-hover:text-teal transition-colors min-h-[2.5rem]">
            {product.name}
          </h3>
        </Link>

        {/* ABV & Origin */}
        {(product.alcoholContent || product.countryOfOrigin) && (
          <p className="text-xs text-gray-400 mb-2">
            {product.alcoholContent ? `${product.alcoholContent}% ABV` : ""}
            {product.alcoholContent && product.countryOfOrigin ? " • " : ""}
            {product.countryOfOrigin || ""}
          </p>
        )}

        {/* Price */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-primary">
                {currency} {formatPrice(displayPrice)}
              </span>
            </div>
            {hasOffer && (
              <span className="text-sm text-gray-400 line-through">
                {currency} {formatPrice(regularPrice)}
              </span>
            )}
          </div>

          {/* Quick Add Button (mobile) */}
          {product.inStock && (
            <button
              onClick={handleAddToCart}
              className={`lg:hidden p-2 rounded-full transition-colors ${
                justAdded
                  ? "bg-green-500 text-white"
                  : "bg-success text-white hover:bg-success/90"
              }`}
              aria-label="Add to cart"
            >
              {justAdded ? <FiCheck className="w-4 h-4" /> : <FiShoppingCart className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Multiple options indicator */}
        {hasMultipleOptions ? (
          <p className="text-xs text-teal font-medium mt-1">
            {priceOptions.length} options available
          </p>
        ) : optionText ? (
          <p className="text-xs text-gray-500 mt-1">{optionText}</p>
        ) : null}
      </div>
    </div>
  );
}
