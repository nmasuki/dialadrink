"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cartStore";
import { FiCheck, FiTruck, FiCreditCard, FiDollarSign, FiSmartphone } from "react-icons/fi";
import axios from "axios";

interface Location {
  _id: string;
  name: string;
  deliveryCharges: number;
}

interface DeliveryForm {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  address: string;
  building: string;
  houseNumber: string;
  location: string;
}

type PaymentMethod = "cash" | "mpesa_delivery" | "swipe_delivery" | "pesapal";

interface PaymentOption {
  id: PaymentMethod;
  label: string;
  description: string;
  icon: React.ReactNode;
  fee?: string;
  isOnDelivery: boolean;
}

const paymentOptions: PaymentOption[] = [
  {
    id: "cash",
    label: "Cash on Delivery",
    description: "Pay with cash when your order arrives",
    icon: <FiDollarSign className="w-5 h-5" />,
    isOnDelivery: true,
  },
  {
    id: "mpesa_delivery",
    label: "M-PESA on Delivery",
    description: "Pay via M-Pesa when your order arrives",
    icon: <FiSmartphone className="w-5 h-5 text-green-600" />,
    isOnDelivery: true,
  },
  {
    id: "swipe_delivery",
    label: "Card Swipe on Delivery",
    description: "Pay by card when your order arrives",
    icon: <FiCreditCard className="w-5 h-5" />,
    fee: "+2.5%",
    isOnDelivery: true,
  },
  {
    id: "pesapal",
    label: "Pay Online (PesaPal)",
    description: "Pay with card, M-Pesa, or Airtel Money via PesaPal",
    icon: <FiCreditCard className="w-5 h-5 text-blue-600" />,
    fee: "+3%",
    isOnDelivery: false,
  },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getSubtotal, getDeliveryFee, getTotal, clearCart } = useCartStore();
  const isOrderCompleteRef = useRef(false);

  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [notes, setNotes] = useState("");

  const [form, setForm] = useState<DeliveryForm>({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    email: "",
    address: "",
    building: "",
    houseNumber: "",
    location: "",
  });

  useEffect(() => {
    // Don't redirect if order was just completed
    if (isOrderCompleteRef.current) {
      return;
    }
    if (items.length === 0) {
      router.push("/cart");
      return;
    }
    axios.get("/api/locations").then((res) => {
      if (res.data.response === "success") {
        setLocations(res.data.data);
      }
    });
  }, [items.length, router]);

  // Calculate processing fee
  const getProcessingFee = () => {
    const subtotal = getSubtotal();
    switch (paymentMethod) {
      case "swipe_delivery":
        return Math.round(subtotal * 0.025);
      case "pesapal":
        return Math.round(subtotal * 0.03);
      default:
        return 0;
    }
  };

  const getFinalTotal = () => {
    return getTotal() + getProcessingFee();
  };

  const formatPrice = (price: number | undefined | null) => {
    const safePrice = typeof price === "number" && !isNaN(price) ? price : 0;
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(safePrice);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!form.firstName.trim()) return "First name is required";
    if (!form.lastName.trim()) return "Last name is required";
    if (!form.phoneNumber.trim()) return "Phone number is required";
    if (!/^(07|01|\+254)\d{8,9}$/.test(form.phoneNumber.replace(/\s/g, ""))) {
      return "Please enter a valid Kenyan phone number";
    }
    if (!form.address.trim()) return "Delivery address is required";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const processingFee = getProcessingFee();
      const finalTotal = getFinalTotal();

      const response = await axios.post("/api/orders", {
        delivery: form,
        items: items.map((item) => ({
          product: typeof item.product === "object" ? item.product : { _id: item.product },
          quantity: item.quantity,
          pieces: item.pieces,
          price: item.price,
          currency: item.currency,
        })),
        subtotal: getSubtotal(),
        deliveryFee: getDeliveryFee(),
        processingFee,
        total: finalTotal,
        paymentMethod,
        notes,
      });

      if (response.data.response === "success") {
        const orderKey = response.data.data.key;

        // Mark order as complete before clearing cart
        isOrderCompleteRef.current = true;

        // Clear cart
        clearCart();

        // Route based on payment method
        if (paymentMethod === "pesapal") {
          router.push(`/checkout/payment?order=${orderKey}&method=pesapal`);
        } else {
          router.push(`/checkout/success?order=${orderKey}`);
        }
      } else {
        setError(response.data.message || "Failed to place order");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      setError("Failed to place order. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (items.length === 0 && !isOrderCompleteRef.current) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-heading font-bold text-gray-800 mb-8">Checkout</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Delivery Information */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-teal/10 rounded-full flex items-center justify-center">
                    <FiTruck className="w-5 h-5 text-teal" />
                  </div>
                  <h2 className="text-xl font-bold">Delivery Information</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                    <input type="text" name="firstName" value={form.firstName} onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal focus:border-transparent" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                    <input type="text" name="lastName" value={form.lastName} onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal focus:border-transparent" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                    <input type="tel" name="phoneNumber" value={form.phoneNumber} onChange={handleInputChange} placeholder="0712345678"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal focus:border-transparent" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email (Optional)</label>
                    <input type="email" name="email" value={form.email} onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal focus:border-transparent" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Location</label>
                    <select name="location" value={form.location} onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal focus:border-transparent">
                      <option value="">Select location</option>
                      {locations.map((loc) => (<option key={loc._id} value={loc.name}>{loc.name}</option>))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address *</label>
                    <input type="text" name="address" value={form.address} onChange={handleInputChange} placeholder="Street, area, landmark"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal focus:border-transparent" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Building Name</label>
                    <input type="text" name="building" value={form.building} onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">House/Apt Number</label>
                    <input type="text" name="houseNumber" value={form.houseNumber} onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal focus:border-transparent" />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-teal/10 rounded-full flex items-center justify-center">
                    <FiCreditCard className="w-5 h-5 text-teal" />
                  </div>
                  <h2 className="text-xl font-bold">Payment Method</h2>
                </div>

                <div className="space-y-3">
                  {paymentOptions.map((option) => (
                    <label
                      key={option.id}
                      className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        paymentMethod === option.id
                          ? "border-teal bg-teal/5"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={option.id}
                        checked={paymentMethod === option.id}
                        onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                        className="w-5 h-5 text-teal"
                      />
                      <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        {option.icon}
                      </div>
                      <div className="flex-grow">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-800">{option.label}</p>
                          {option.fee && (
                            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                              {option.fee}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{option.description}</p>
                      </div>
                      {paymentMethod === option.id && (
                        <FiCheck className="w-5 h-5 text-teal" />
                      )}
                    </label>
                  ))}
                </div>
              </div>

              {/* Order Notes */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-bold mb-4">Order Notes (Optional)</h2>
                <textarea
                  name="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special instructions for your order..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal focus:border-transparent"
                />
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Order Summary</h2>

                {/* Items */}
                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                  {items.map((item) => {
                    const product = typeof item.product === "object" ? item.product : null;
                    const itemPrice = typeof item.price === "number" && !isNaN(item.price) ? item.price : 0;
                    const itemPieces = typeof item.pieces === "number" && !isNaN(item.pieces) ? item.pieces : 0;
                    return (
                      <div key={item._id} className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          {product?.name || "Product"} x {itemPieces}
                        </span>
                        <span className="font-medium">{formatPrice(itemPrice * itemPieces)}</span>
                      </div>
                    );
                  })}
                </div>

                <hr className="my-4" />

                {/* Totals */}
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
                  {getProcessingFee() > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>Processing Fee</span>
                      <span>{formatPrice(getProcessingFee())}</span>
                    </div>
                  )}
                  <hr />
                  <div className="flex justify-between text-lg font-bold text-gray-800">
                    <span>Total</span>
                    <span className="text-primary">{formatPrice(getFinalTotal())}</span>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-success text-white py-4 rounded-xl font-semibold hover:bg-success/90 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                >
                  {isLoading ? (
                    <>
                      <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                      Processing...
                    </>
                  ) : (
                    <>
                      <FiCheck className="w-5 h-5" />
                      {paymentOptions.find(p => p.id === paymentMethod)?.isOnDelivery
                        ? "Place Order"
                        : "Continue to Payment"}
                    </>
                  )}
                </button>

                <p className="text-xs text-gray-500 mt-4 text-center">
                  By placing this order, you agree to our terms of service
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
