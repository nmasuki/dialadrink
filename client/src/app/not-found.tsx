import Link from "next/link";
import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata({
  title: "Page Not Found",
  description: "The page you are looking for does not exist. Browse our selection of drinks at Dial A Drink Kenya.",
  url: "/404",
  noindex: true,
});

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Page Not Found</h2>
        <p className="text-gray-500 mb-8">
          Sorry, we couldn&apos;t find the page you&apos;re looking for. It may have been moved or
          no longer exists.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-block bg-teal text-white px-6 py-3 rounded-lg font-semibold hover:bg-teal/90 transition-colors"
          >
            Go Home
          </Link>
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
