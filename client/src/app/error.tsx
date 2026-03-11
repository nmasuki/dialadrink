"use client";

import Link from "next/link";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-bold text-gray-300 mb-4">500</h1>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Something Went Wrong</h2>
        <p className="text-gray-500 mb-8">
          We encountered an unexpected error. Please try again or browse our products.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-block bg-teal text-white px-6 py-3 rounded-lg font-semibold hover:bg-teal/90 transition-colors"
          >
            Try Again
          </button>
          <Link
            href="/products"
            className="inline-block bg-white text-gray-700 px-6 py-3 rounded-lg font-semibold border hover:bg-gray-50 transition-colors"
          >
            Browse Products
          </Link>
        </div>
      </div>
    </div>
  );
}
