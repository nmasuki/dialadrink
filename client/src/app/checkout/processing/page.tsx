"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { FiPhone, FiCheckCircle, FiXCircle, FiLoader } from "react-icons/fi";
import Link from "next/link";

function ProcessingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderKey = searchParams.get("order");
  const method = searchParams.get("method");

  const [status, setStatus] = useState<"processing" | "success" | "failed">("processing");
  const [message, setMessage] = useState("Processing your payment...");
  const [countdown, setCountdown] = useState(120); // 2 minutes timeout

  useEffect(() => {
    if (!orderKey) {
      router.push("/cart");
      return;
    }

    // Simulate M-Pesa STK push
    // In production, this would:
    // 1. Call the M-Pesa API to initiate STK push
    // 2. Poll for payment status
    // 3. Redirect based on result

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // After timeout, assume payment will be confirmed later
          setStatus("success");
          setMessage("Order placed! You can complete payment on delivery if needed.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Simulate checking payment status
    const checkPayment = setTimeout(() => {
      // In production, poll the payment status API
      // For now, simulate success after 5 seconds
      setStatus("success");
      setMessage("Payment request sent to your phone!");
    }, 5000);

    return () => {
      clearInterval(timer);
      clearTimeout(checkPayment);
    };
  }, [orderKey, router]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-md mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className={`px-8 py-10 text-center text-white ${
            status === "processing" ? "bg-gradient-to-r from-green-500 to-green-600" :
            status === "success" ? "bg-gradient-to-r from-green-500 to-green-600" :
            "bg-gradient-to-r from-red-500 to-red-600"
          }`}>
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              {status === "processing" ? (
                <FiLoader className="w-10 h-10 text-green-500 animate-spin" />
              ) : status === "success" ? (
                <FiCheckCircle className="w-10 h-10 text-green-500" />
              ) : (
                <FiXCircle className="w-10 h-10 text-red-500" />
              )}
            </div>

            <h1 className="text-2xl font-bold mb-2">
              {status === "processing" ? "Processing Payment" :
               status === "success" ? "Payment Request Sent!" :
               "Payment Failed"}
            </h1>
            <p className="text-white/80">{message}</p>
          </div>

          {/* Content */}
          <div className="px-8 py-8">
            {orderKey && (
              <div className="bg-gray-50 rounded-xl p-4 mb-6 text-center">
                <p className="text-sm text-gray-500">Order Number</p>
                <p className="text-2xl font-bold text-teal">{orderKey}</p>
              </div>
            )}

            {status === "processing" && (
              <>
                <div className="flex items-center justify-center gap-3 mb-6 p-4 bg-green-50 rounded-xl">
                  <FiPhone className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-800">Check your phone</p>
                    <p className="text-sm text-green-600">Enter your M-Pesa PIN to complete payment</p>
                  </div>
                </div>

                <div className="text-center mb-6">
                  <p className="text-sm text-gray-500 mb-2">Time remaining</p>
                  <p className="text-3xl font-mono font-bold text-gray-800">{formatTime(countdown)}</p>
                </div>

                <div className="space-y-3 text-sm text-gray-600">
                  <p className="flex items-start gap-2">
                    <span className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                    Check your phone for M-Pesa prompt
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                    Enter your M-Pesa PIN
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                    Wait for confirmation
                  </p>
                </div>
              </>
            )}

            {status === "success" && (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <p className="text-green-800 text-sm">
                    Your order has been placed successfully! If the M-Pesa payment is not completed,
                    you can pay on delivery.
                  </p>
                </div>

                <Link
                  href={`/checkout/success?order=${orderKey}`}
                  className="block w-full bg-success text-white text-center py-3 rounded-xl font-semibold hover:bg-success/90 transition-colors"
                >
                  View Order Details
                </Link>
              </div>
            )}

            {status === "failed" && (
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-red-800 text-sm">
                    The payment could not be processed. Your order has been saved and you can pay on delivery.
                  </p>
                </div>

                <Link
                  href={`/checkout/success?order=${orderKey}`}
                  className="block w-full bg-primary text-white text-center py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
                >
                  Continue (Pay on Delivery)
                </Link>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-8 py-4 border-t text-center">
            <p className="text-sm text-gray-500">
              Need help? Call <a href="tel:+254723688108" className="text-teal font-medium">+254 723 688 108</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProcessingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    }>
      <ProcessingContent />
    </Suspense>
  );
}
