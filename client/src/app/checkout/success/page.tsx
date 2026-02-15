"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { FiCheckCircle, FiPhone, FiMessageCircle, FiHome, FiClock, FiTruck, FiShoppingBag } from "react-icons/fi";
import { Suspense } from "react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderKey = searchParams.get("order");

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        {/* Success Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Green Header */}
          <div className="bg-gradient-to-r from-green-500 to-green-600 px-8 py-10 text-center text-white">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <FiCheckCircle className="w-14 h-14 text-green-500" />
            </div>
            <h1 className="text-3xl font-heading font-bold mb-2">
              Order Confirmed!
            </h1>
            <p className="text-green-100 text-lg">
              Thank you for choosing Dial A Drink Kenya
            </p>
          </div>

          {/* Order Details */}
          <div className="px-8 py-8">
            {orderKey && (
              <div className="bg-gray-50 rounded-xl p-6 mb-6 text-center border-2 border-dashed border-gray-200">
                <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">Your Order Number</p>
                <p className="text-3xl font-bold text-teal tracking-wider">{orderKey}</p>
                <p className="text-xs text-gray-400 mt-2">Save this number for reference</p>
              </div>
            )}

            {/* Timeline */}
            <div className="space-y-4 mb-8">
              <h3 className="font-semibold text-gray-800 text-lg mb-4">What happens next?</h3>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-teal/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <FiPhone className="w-5 h-5 text-teal" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">Confirmation Call</p>
                  <p className="text-sm text-gray-500">Our team will call you within 5 minutes to confirm your order</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-teal/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <FiShoppingBag className="w-5 h-5 text-teal" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">Order Preparation</p>
                  <p className="text-sm text-gray-500">We will prepare your drinks with care</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-teal/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <FiTruck className="w-5 h-5 text-teal" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">Fast Delivery</p>
                  <p className="text-sm text-gray-500">Your order will be delivered within 30-60 minutes</p>
                </div>
              </div>
            </div>

            {/* Delivery Estimate */}
            <div className="bg-teal/5 border border-teal/20 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3">
                <FiClock className="w-6 h-6 text-teal" />
                <div>
                  <p className="font-semibold text-teal">Estimated Delivery</p>
                  <p className="text-sm text-gray-600">30 - 60 minutes</p>
                </div>
              </div>
            </div>

            {/* Contact Options */}
            <div className="border-t pt-6">
              <h3 className="font-semibold text-gray-800 mb-4 text-center">Questions? Contact Us</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a
                  href="tel:+254723688108"
                  className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-lg font-medium transition-colors"
                >
                  <FiPhone className="w-5 h-5" />
                  Call Us
                </a>
                <a
                  href="https://wa.me/254723688108"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                >
                  <FiMessageCircle className="w-5 h-5" />
                  WhatsApp
                </a>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-8 py-6 border-t">
            <Link
              href="/"
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              <FiHome className="w-5 h-5" />
              Continue Shopping
            </Link>
          </div>
        </div>

        {/* Bottom Note */}
        <p className="text-center text-gray-400 text-sm mt-6">
          A confirmation SMS has been sent to your phone number
        </p>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Processing your order...</p>
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
