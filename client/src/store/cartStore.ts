import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { ICartItem, IProduct, IPromo } from "@/types";

interface CartState {
  items: ICartItem[];
  promo: IPromo | null;
  isLoading: boolean;
  error: string | null;
}

interface CartActions {
  addItem: (product: IProduct, optionText: string, pieces?: number) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, pieces: number) => void;
  clearCart: () => void;
  applyPromo: (promo: IPromo) => void;
  removePromo: () => void;
  getSubtotal: () => number;
  getDeliveryFee: () => number;
  getDiscount: () => number;
  getTotal: () => number;
  getItemCount: () => number;
}

type CartStore = CartState & CartActions;

const DEFAULT_DELIVERY_FEE = 200;
const FREE_DELIVERY_THRESHOLD = 3000;

const safeNumber = (val: unknown, fallback = 0): number => {
  const num = Number(val);
  return isNaN(num) ? fallback : num;
};

// Get price from priceOption - use offerPrice only if it's less than price (discount)
const getPriceFromOption = (priceOption: { price?: number; offerPrice?: number } | undefined, fallbackPrice: number): number => {
  if (!priceOption) return safeNumber(fallbackPrice, 0);

  const price = safeNumber(priceOption.price, 0);
  const offerPrice = safeNumber(priceOption.offerPrice, 0);

  // Use offerPrice only if it exists and is less than regular price (it's a discount)
  if (offerPrice > 0 && price > offerPrice) {
    return offerPrice;
  }

  return price > 0 ? price : safeNumber(fallbackPrice, 0);
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      promo: null,
      isLoading: false,
      error: null,

      addItem: (product, optionText, pieces = 1) => {
        set((state) => {
          const existingItemIndex = state.items.findIndex(
            (item) =>
              (typeof item.product === "string"
                ? item.product
                : item.product._id) === product._id &&
              item.quantity === optionText
          );

          if (existingItemIndex > -1) {
            const newItems = [...state.items];
            newItems[existingItemIndex].pieces += pieces;
            return { items: newItems };
          }

          // Find price for this option from priceOptions
          // Try to match by optionText, _id, or get the first option
          let priceOption = product.priceOptions?.find(
            (opt) => opt.optionText === optionText || opt._id === optionText
          );

          // If no match and we have priceOptions, get the first one
          if (!priceOption && product.priceOptions && product.priceOptions.length > 0) {
            priceOption = product.priceOptions[0];
          }

          // Get price using the correct logic (offerPrice only if less than price)
          const price = getPriceFromOption(priceOption, product.price || 0);
          const currency = priceOption?.currency || product.currency || "KES";
          const displayText = priceOption?.optionText || optionText || "";

          // Add new item
          const newItem: ICartItem = {
            _id: product._id + "-" + optionText + "-" + Date.now(),
            product,
            quantity: displayText,
            pieces: safeNumber(pieces, 1),
            price,
            currency,
          };

          console.log("Adding to cart:", { productName: product.name, optionText, price, priceOption });

          return { items: [...state.items, newItem] };
        });
      },

      removeItem: (itemId) => {
        set((state) => ({
          items: state.items.filter((item) => item._id !== itemId),
        }));
      },

      updateQuantity: (itemId, pieces) => {
        const safePieces = safeNumber(pieces, 0);
        if (safePieces <= 0) {
          get().removeItem(itemId);
          return;
        }

        set((state) => ({
          items: state.items.map((item) =>
            item._id === itemId ? { ...item, pieces: safePieces } : item
          ),
        }));
      },

      clearCart: () => {
        set({ items: [], promo: null });
      },

      applyPromo: (promo) => {
        set({ promo });
      },

      removePromo: () => {
        set({ promo: null });
      },

      getSubtotal: () => {
        const items = get().items;
        return items.reduce((total, item) => {
          const price = safeNumber(item.price, 0);
          const pieces = safeNumber(item.pieces, 0);
          return total + (price * pieces);
        }, 0);
      },

      getDeliveryFee: () => {
        const subtotal = get().getSubtotal();
        return subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DEFAULT_DELIVERY_FEE;
      },

      getDiscount: () => {
        const { promo } = get();
        if (!promo) return 0;

        const subtotal = get().getSubtotal();
        if (promo.discountType === "percentage") {
          return Math.round((subtotal * safeNumber(promo.discount, 0)) / 100);
        }
        return safeNumber(promo.discount, 0);
      },

      getTotal: () => {
        const subtotal = get().getSubtotal();
        const deliveryFee = get().getDeliveryFee();
        const discount = get().getDiscount();
        return subtotal + deliveryFee - discount;
      },

      getItemCount: () => {
        return get().items.reduce((count, item) => {
          return count + safeNumber(item.pieces, 0);
        }, 0);
      },
    }),
    {
      name: "diala-cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
        promo: state.promo,
      }),
    }
  )
);
