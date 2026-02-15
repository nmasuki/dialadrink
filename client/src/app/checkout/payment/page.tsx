"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { FiCreditCard, FiArrowLeft, FiLoader, FiShield } from "react-icons/fi";
import Link from "next/link";
import axios from "axios";

interface OrderData {
  key: string;
  total: number;
  delivery: {
    firstName: string;
    lastName: string;
    email?: string;
    phoneNumber: string;
  };
}

function PaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderKey = searchParams.get("order");
  const method = searchParams.get("method");

  const [order, setOrder] = useState<OrderData | null>(null);
  const [pesapalUrl, setPesapalUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!orderKey) {
      router.push("/cart");
      return;
    }

    // Fetch order details
    const fetchOrder = async () => {
      try {
        const res = await axios.get(`/api/orders?key=${orderKey}`);
        if (res.data.response === "success") {
          setOrder(res.data.data);

          // If PesaPal, initialize payment
          if (method === "pesapal") {
            initPesaPal(res.data.data);
          }
        } else {
          setError("Order not found");
        }
      } catch (err) {
        console.error("Error fetching order:", err);
        setError("Failed to load order details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [orderKey, method, router]);

  const initPesaPal = async (orderData: OrderData) => {
    try {
      // Call API to get PesaPal iframe URL
      const response = await axios.post("/api/payment/pesapal/init", {
        orderKey: orderData.key,
        amount: orderData.total,
        email: orderData.delivery.email || `${orderData.delivery.phoneNumber}@dialadrinkkenya.com`,
        phone: orderData.delivery.phoneNumber,
        firstName: orderData.delivery.firstName,
        lastName: orderData.delivery.lastName,
        description: `Order ${orderData.key}`,
      });

      if (response.data.response === "success" && response.data.iframeUrl) {
        setPesapalUrl(response.data.iframeUrl);
      } else {
        // If API not yet implemented, show placeholder
        setError("PesaPal integration pending. Please use another payment method.");
      }
    } catch (err) {
      console.error("PesaPal init error:", err);
      // Show fallback for now
      setError("PesaPal is temporarily unavailable. Please try M-Pesa or pay on delivery.");
    }
  };

  const handlePayOnDelivery = () => {
    router.push(`/checkout/success?order=${orderKey}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading payment options...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/checkout" className="text-gray-500 hover:text-gray-700">
            <FiArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Complete Payment</h1>
            {order && (
              <p className="text-gray-500">Order: {order.key}</p>
            )}
          </div>
        </div>

        {error ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiCreditCard className="w-8 h-8 text-orange-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Payment Gateway Unavailable</h2>
            <p className="text-gray-600 mb-6">{error}</p>

            <div className="space-y-3">
              <button
                onClick={handlePayOnDelivery}
                className="w-full bg-success text-white py-3 rounded-xl font-semibold hover:bg-success/90 transition-colors"
              >
                Pay on Delivery Instead
              </button>
              <Link
                href={`/checkout/processing?order=${orderKey}&method=mpesa`}
                className="block w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors text-center"
              >
                Pay with M-Pesa
              </Link>
              <Link
                href="/checkout"
                className="block w-full border border-gray-300 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors text-center"
              >
                Go Back
              </Link>
            </div>
          </div>
        ) : pesapalUrl ? (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {/* Security badge */}
            <div className="bg-gray-50 px-6 py-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FiShield className="w-4 h-4 text-green-600" />
                <span>Secure payment powered by PesaPal</span>
              </div>
              {order && (
                <span className="font-bold text-lg text-primary">
                  KES {order.total.toLocaleString()}
                </span>
              )}
            </div>

            {/* PesaPal iframe */}
            <div className="relative" style={{ height: "600px" }}>
              <iframe
                src={pesapalUrl}
                className="w-full h-full border-0"
                title="PesaPal Payment"
                allow="payment"
              />
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t text-center">
              <p className="text-sm text-gray-500">
                Having trouble? Call <a href="tel:+254723688108" className="text-teal font-medium">+254 723 688 108</a>
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <FiLoader className="w-12 h-12 text-teal animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Initializing payment gateway...</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    }>
      <PaymentContent />
    </Suspense>
  );
}
