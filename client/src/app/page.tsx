import Link from "next/link";
import { FiTruck, FiAward, FiShield, FiArrowRight } from "react-icons/fi";
import ProductCard from "@/components/product/ProductCard";
import { connectDB } from "@/lib/db";
import { Product } from "@/models";
import { IProduct } from "@/types";
import { getPageData } from "@/lib/getPageData";
import PageContent from "@/components/PageContent";
import HeroBanner from "@/components/HeroBanner";
import { Metadata } from "next";

// Revalidate every 5 minutes for fresh data while still allowing caching
export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const pageData = await getPageData("/");
  const title = pageData?.title
    ? pageData.title.length > 60 ? pageData.title.slice(0, 57) + "..." : pageData.title
    : "Alcohol Delivery Nairobi | Dial A Drink Kenya";
  return {
    title,
    description: pageData?.meta || "Order alcohol online in Nairobi. Whisky, beer, wine and spirits delivered fast. Call 0723688108. Dial A Drink Kenya.",
  };
}

async function getFeaturedProducts(): Promise<IProduct[]> {
  try {
    await connectDB();
    const products = await Product.find({
      state: "published",
      inStock: true,
      isPopular: true,
    })
      .populate("category", "name key")
      .populate("brand", "name href")
      .populate("priceOptions")
      .sort({ popularity: -1 })
      .limit(8)
      .lean();

    return JSON.parse(JSON.stringify(products));
  } catch (error) {
    console.error("Error fetching featured products:", error);
    return [];
  }
}

async function getBrandFocusProducts(): Promise<IProduct[]> {
  try {
    await connectDB();
    const products = await Product.find({
      state: "published",
      inStock: true,
      isBrandFocus: true,
      onOffer: { $ne: true },
    })
      .populate("category", "name key")
      .populate("brand", "name href")
      .populate("priceOptions")
      .sort({ popularity: -1 })
      .limit(4)
      .lean();

    return JSON.parse(JSON.stringify(products));
  } catch (error) {
    console.error("Error fetching brand focus products:", error);
    return [];
  }
}

async function getOfferProducts(): Promise<IProduct[]> {
  try {
    await connectDB();
    const products = await Product.find({
      state: "published",
      inStock: true,
      onOffer: true,
    })
      .populate("category", "name key")
      .populate("brand", "name href")
      .populate("priceOptions")
      .sort({ popularityRatio: -1 })
      .limit(4)
      .lean();
    
    return JSON.parse(JSON.stringify(products));
  } catch (error) {
    console.error("Error fetching offer products:", error);
    return [];
  }
}

export default async function HomePage() {
  const [featuredProducts, offerProducts, brandFocusProducts, pageData] = await Promise.all([
    getFeaturedProducts(),
    getOfferProducts(),
    getBrandFocusProducts(),
    getPageData("/"),
  ]);

  return (
    <div>
      {/* Hero Section */}
      {(pageData?.bannerImages?.[0]?.secure_url || pageData?.mobileBannerImages?.[0]?.secure_url) ? (
        <section className="relative">
          <HeroBanner
            desktopImages={pageData?.bannerImages || []}
            mobileImages={pageData?.mobileBannerImages || []}
            alt={pageData.h1 || "Dial A Drink Kenya"}
          />
          {/* Overlay with CTA */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex items-end pb-8 md:pb-12">
            <div className="container">
              <div className="max-w-3xl text-white">
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 drop-shadow-lg">
                  {pageData.h1 || "Alcohol Delivery in Nairobi — Order Drinks Online"}
                </h1>
                <p className="text-base md:text-xl text-white/90 mb-6 md:mb-8 drop-shadow">
                  Order your favorite drinks online and get them delivered fast across Nairobi.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link
                    href="/products"
                    className="btn bg-white text-teal hover:bg-gray-100 px-6 py-3 text-lg"
                  >
                    Shop Now
                    <FiArrowRight className="ml-2" />
                  </Link>
                  <Link
                    href="/offers"
                    className="btn border-2 border-white text-white hover:bg-white hover:text-teal px-6 py-3 text-lg"
                  >
                    View Offers
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="bg-gradient-to-r from-teal to-teal-700 text-white py-16 md:py-24">
          <div className="container">
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                Alcohol Delivery in Nairobi &mdash; Order Drinks Online
              </h1>
              <p className="text-lg md:text-xl text-teal-100 mb-8">
                Order your favorite drinks online and get them delivered fast across Nairobi.
                Quality spirits, wine, beer & more at your doorstep.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/products"
                  className="btn bg-white text-teal hover:bg-gray-100 px-6 py-3 text-lg"
                >
                  Shop Now
                  <FiArrowRight className="ml-2" />
                </Link>
                <Link
                  href="/offers"
                  className="btn border-2 border-white text-white hover:bg-white hover:text-teal px-6 py-3 text-lg"
                >
                  View Offers
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      <section className="py-12 bg-gray-50">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <FiTruck className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-lg mb-1">Fast Delivery</p>
                <p className="text-gray-600 text-sm">
                  Quick delivery across Nairobi. Reliable same-day delivery to your doorstep.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-teal/10 p-3 rounded-full">
                <FiAward className="w-6 h-6 text-teal" />
              </div>
              <div>
                <p className="font-semibold text-lg mb-1">Premium Quality</p>
                <p className="text-gray-600 text-sm">
                  100% authentic products from trusted brands and suppliers.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-success/10 p-3 rounded-full">
                <FiShield className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="font-semibold text-lg mb-1">Secure Payments</p>
                <p className="text-gray-600 text-sm">
                  Multiple payment options including M-Pesa, card, and cash on delivery.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Special Offers */}
      {offerProducts.length > 0 && (
        <section className="py-12">
          <div className="container">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl md:text-3xl font-bold">Today&apos;s Deals</h2>
              <Link
                href="/offers"
                className="text-primary hover:underline flex items-center gap-1"
              >
                View All Deals <FiArrowRight />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {offerProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="py-12 bg-gray-50">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold">Popular Products</h2>
            <Link
              href="/products"
              className="text-primary hover:underline flex items-center gap-1"
            >
              View All Products <FiArrowRight />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Brand Focus */}
      {brandFocusProducts.length > 0 && (
        <section className="py-12">
          <div className="container">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl md:text-3xl font-bold">Brand Focus</h2>
              <Link
                href="/products"
                className="text-primary hover:underline flex items-center gap-1"
              >
                View All Brands <FiArrowRight />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {brandFocusProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Categories */}
      <section className="py-12 bg-gray-50">
        <div className="container">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">
            Shop by Category
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { name: "Whisky", key: "whisky", color: "bg-amber-100" },
              { name: "Wine", key: "wine", color: "bg-red-100" },
              { name: "Beer", key: "beer", color: "bg-yellow-100" },
              { name: "Vodka", key: "vodka", color: "bg-blue-100" },
              { name: "Gin", key: "gin", color: "bg-green-100" },
              { name: "Rum", key: "rum", color: "bg-orange-100" },
            ].map((category) => (
              <Link
                key={category.key}
                href={`/${category.key}`}
                className={`${category.color} rounded-lg p-6 text-center hover:shadow-lg transition-shadow`}
              >
                <p className="font-semibold text-lg">{category.name}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* SEO Content from pages collection */}
      {pageData && (
        <section className="py-12">
          <div className="container">
            <PageContent page={pageData} />
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-16 bg-dark text-white">
        <div className="container text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Order?
          </h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Browse our extensive collection of premium drinks and get them delivered to your doorstep.
          </p>
          <Link
            href="/products"
            className="btn btn-primary px-8 py-3 text-lg"
          >
            Start Shopping
          </Link>
        </div>
      </section>
    </div>
  );
}
