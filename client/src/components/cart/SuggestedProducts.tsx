"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FiPlus, FiCheck } from "react-icons/fi";
import { useCartStore } from "@/store/cartStore";
import { IProduct } from "@/types";
import axios from "axios";
import toast from "react-hot-toast";

interface SuggestedProductsProps {
  cartProductIds: string[];
  cartCategoryIds: string[];
}

export default function SuggestedProducts({ cartProductIds, cartCategoryIds }: SuggestedProductsProps) {
  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        // Fetch products from same categories, excluding cart items
        const categoryParam = cartCategoryIds.length > 0 ? cartCategoryIds.join(",") : "";
        const excludeParam = cartProductIds.join(",");

        const res = await axios.get(`/api/products?limit=8&inStock=true${categoryParam ? `&categories=${categoryParam}` : ""}&exclude=${excludeParam}`);

        if (res.data.response === "success") {
          // Filter out products already in cart and limit to 8
          const filtered = res.data.data
            .filter((p: IProduct) => !cartProductIds.includes(p._id))
            .slice(0, 8);
          setProducts(filtered);
        }
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      } finally {
        setLoading(false);
      }
    };

    if (cartProductIds.length > 0) {
      fetchSuggestions();
    } else {
      setLoading(false);
    }
  }, [cartProductIds, cartCategoryIds]);

  const handleQuickAdd = (product: IProduct) => {
    const priceOption = product.priceOptions?.[0];
    const optionText = priceOption?.optionText || "";

    addItem(product, optionText, 1);
    setAddedIds(prev => new Set(prev).add(product._id));
    toast.success(`${product.name} added to cart`);

    // Reset the added state after 2 seconds
    setTimeout(() => {
      setAddedIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(product._id);
        return newSet;
      });
    }, 2000);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-KE", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="mt-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Usually Ordered With</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 aspect-square rounded-lg mb-2"></div>
              <div className="bg-gray-200 h-4 rounded mb-1"></div>
              <div className="bg-gray-200 h-4 w-2/3 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Usually Ordered With</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.map((product) => {
          const priceOption = product.priceOptions?.[0];
          const price = priceOption?.offerPrice && priceOption.price > priceOption.offerPrice
            ? priceOption.offerPrice
            : priceOption?.price || product.price || 0;
          const imageUrl = product.image?.secure_url ||
            "https://res.cloudinary.com/nmasuki/image/upload/c_fill,w_200,h_200/placeholder.png";
          const isAdded = addedIds.has(product._id);

          return (
            <div
              key={product._id}
              className="bg-white rounded-xl shadow-sm overflow-hidden group"
            >
              <Link href={`/products/${product.href}`}>
                <div className="relative aspect-square bg-gray-100">
                  <Image
                    src={imageUrl}
                    alt={product.name}
                    fill
                    sizes="160px"
                    className="object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
              </Link>
              <div className="p-3">
                <Link href={`/products/${product.href}`}>
                  <h3 className="text-sm font-medium text-gray-800 line-clamp-2 mb-1 group-hover:text-teal transition-colors">
                    {product.name}
                  </h3>
                </Link>
                <p className="text-sm font-bold text-primary mb-2">
                  KES {formatPrice(price)}
                </p>
                <button
                  onClick={() => handleQuickAdd(product)}
                  disabled={isAdded}
                  className={`w-full py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-1 transition-all ${
                    isAdded
                      ? "bg-green-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-success hover:text-white"
                  }`}
                >
                  {isAdded ? (
                    <>
                      <FiCheck className="w-4 h-4" />
                      Added
                    </>
                  ) : (
                    <>
                      <FiPlus className="w-4 h-4" />
                      Add
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
