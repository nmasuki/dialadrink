import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { connectDB } from "@/lib/db";
import { Product, Category, Brand } from "@/models";
import { IProduct, ICategory, IBrand } from "@/types";
import ProductGrid from "@/components/product/ProductGrid";
import { FiGrid, FiList, FiFilter, FiChevronRight, FiTag, FiTruck, FiPercent } from "react-icons/fi";

interface SearchParams {
  page?: string;
  category?: string;
  search?: string;
  q?: string;
  sort?: string;
  onOffer?: string;
  brand?: string;
}

export const metadata: Metadata = {
  title: "Shop Drinks Online | Dial A Drink Kenya",
  description: "Browse our wide selection of premium wines, spirits, beers and more. Fast delivery across Nairobi.",
};

async function getProducts(searchParams: SearchParams) {
  try {
    await connectDB();

    const page = parseInt(searchParams.page || "1");
    const pageSize = 24;
    const skip = (page - 1) * pageSize;

    const query: Record<string, unknown> = {
      state: "published",
      inStock: true,
    };

    if (searchParams.category) {
      const category = await Category.findOne({
        $or: [
          { key: searchParams.category },
          { key: { $regex: new RegExp(`^${searchParams.category}$`, 'i') } }
        ]
      });
      if (category) {
        query.category = category._id;
      }
    }

    if (searchParams.onOffer === "true") {
      query.onOffer = true;
    }

    let currentBrand: IBrand | null = null;
    if (searchParams.brand) {
      const brand = await Brand.findOne({
        $or: [
          { href: searchParams.brand },
          { href: { $regex: new RegExp(`^${searchParams.brand}$`, 'i') } }
        ]
      }).lean();
      if (brand) {
        currentBrand = JSON.parse(JSON.stringify(brand)) as IBrand;
        query.brand = brand._id;
      }
    }

    const search = searchParams.search || searchParams.q;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } },
      ];
    }

    let sortQuery: Record<string, 1 | -1> = { popularity: -1 };
    switch (searchParams.sort) {
      case "price_asc":
        sortQuery = { price: 1 };
        break;
      case "price_desc":
        sortQuery = { price: -1 };
        break;
      case "newest":
        sortQuery = { publishedDate: -1 };
        break;
      case "name":
        sortQuery = { name: 1 };
        break;
    }

    const [products, total, popularProducts, offerProducts] = await Promise.all([
      Product.find(query)
        .populate("category", "name key")
        .populate("brand", "name href")
        .populate("priceOptions")
        .sort(sortQuery)
        .skip(skip)
        .limit(pageSize)
        .lean(),
      Product.countDocuments(query),
      // Get popular products for sidebar/featured
      !searchParams.category && !search && page === 1
        ? Product.find({ state: "published", inStock: true, isPopular: true })
            .populate("category", "name key")
            .populate("brand", "name href")
            .populate("priceOptions")
            .sort({ popularity: -1 })
            .limit(8)
            .lean()
        : Promise.resolve([]),
      // Get offers for banner
      !searchParams.onOffer && page === 1
        ? Product.find({ state: "published", inStock: true, onOffer: true })
            .populate("category", "name key")
            .populate("brand", "name href")
            .populate("priceOptions")
            .sort({ popularity: -1 })
            .limit(4)
            .lean()
        : Promise.resolve([]),
    ]);

    return {
      products: JSON.parse(JSON.stringify(products)) as IProduct[],
      popularProducts: JSON.parse(JSON.stringify(popularProducts)) as IProduct[],
      offerProducts: JSON.parse(JSON.stringify(offerProducts)) as IProduct[],
      currentBrand,
      total,
      page,
      totalPages: Math.ceil(total / pageSize),
    };
  } catch (error) {
    console.error("Error fetching products:", error);
    return { products: [], popularProducts: [], offerProducts: [], currentBrand: null, total: 0, page: 1, totalPages: 0 };
  }
}

async function getCategories() {
  try {
    await connectDB();
    const categories = await Category.find({}).sort({ name: 1 }).lean();
    return JSON.parse(JSON.stringify(categories)) as ICategory[];
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const [{ products, popularProducts, offerProducts, currentBrand, total, page, totalPages }, categories] = await Promise.all([
    getProducts(params),
    getCategories(),
  ]);

  const search = params.search || params.q;
  const currentCategory = categories.find(c => c.key === params.category);

  // Build page title
  let pageTitle = "All Products";
  if (currentBrand) {
    pageTitle = currentBrand.name;
  } else if (currentCategory) {
    pageTitle = currentCategory.name;
  } else if (params.onOffer === "true") {
    pageTitle = "Special Offers";
  } else if (search) {
    pageTitle = `Search: "${search}"`;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner for Offers */}
      {params.onOffer === "true" && (
        <div className="bg-gradient-to-r from-primary to-red-600 text-white py-8">
          <div className="container mx-auto px-4 text-center">
            <FiPercent className="w-12 h-12 mx-auto mb-3 animate-pulse" />
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Special Offers</h1>
            <p className="text-white/80">Amazing deals on your favorite drinks!</p>
          </div>
        </div>
      )}

      {/* Offers Banner - Show on main page */}
      {offerProducts.length > 0 && !params.category && !search && page === 1 && (
        <div className="bg-gradient-to-r from-orange-500 to-red-500 py-6">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white text-xl font-bold flex items-center gap-2">
                <FiTag className="w-5 h-5" />
                Hot Deals
              </h2>
              <Link href="/products?onOffer=true" className="text-white/80 hover:text-white text-sm flex items-center gap-1">
                View All <FiChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {offerProducts.map((product) => {
                const priceOption = product.priceOptions?.[0];
                const price = priceOption?.price || product.price || 0;
                const offerPrice = priceOption?.offerPrice || 0;
                const hasOffer = offerPrice > 0 && price > offerPrice;
                const discount = hasOffer ? Math.round(((price - offerPrice) / price) * 100) : 0;

                return (
                  <Link
                    key={product._id}
                    href={`/products/${product.href}`}
                    className="bg-white/10 backdrop-blur rounded-lg p-3 hover:bg-white/20 transition-colors group"
                  >
                    <div className="relative">
                      {discount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded-full">
                          -{discount}%
                        </span>
                      )}
                      <Image
                        src={product.image?.secure_url || "https://res.cloudinary.com/nmasuki/image/upload/c_fill,w_150,h_150/placeholder.png"}
                        alt={product.name}
                        width={150}
                        height={150}
                        className="w-full aspect-square object-cover rounded-lg"
                      />
                    </div>
                    <p className="text-white text-sm mt-2 line-clamp-1 group-hover:underline">{product.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-white font-bold">KES {(hasOffer ? offerPrice : price).toLocaleString()}</span>
                      {hasOffer && (
                        <span className="text-white/60 text-sm line-through">KES {price.toLocaleString()}</span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm">
          <ol className="flex items-center gap-2 text-gray-500">
            <li><Link href="/" className="hover:text-teal">Home</Link></li>
            <li>/</li>
            <li><Link href="/products" className="hover:text-teal">Products</Link></li>
            {currentCategory && (
              <>
                <li>/</li>
                <li className="text-gray-800">{currentCategory.name}</li>
              </>
            )}
            {currentBrand && (
              <>
                <li>/</li>
                <li className="text-gray-800">{currentBrand.name}</li>
              </>
            )}
          </ol>
        </nav>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm p-5 sticky top-24">
              {/* Free Delivery Banner */}
              <div className="bg-teal/10 rounded-lg p-3 mb-5 flex items-center gap-3">
                <FiTruck className="w-8 h-8 text-teal" />
                <div>
                  <p className="text-sm font-semibold text-teal">Free Delivery</p>
                  <p className="text-xs text-gray-500">Orders above KES 3,000</p>
                </div>
              </div>

              {/* Categories */}
              <div className="mb-6">
                <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <FiFilter className="w-4 h-4" />
                  Categories
                </h3>
                <ul className="space-y-1">
                  <li>
                    <Link
                      href="/products"
                      className={`block py-2 px-3 rounded-lg text-sm transition-colors ${
                        !params.category
                          ? "bg-teal text-white font-medium"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      All Products
                    </Link>
                  </li>
                  {categories.map((category) => (
                    <li key={category._id}>
                      <Link
                        href={`/products?category=${category.key}`}
                        className={`block py-2 px-3 rounded-lg text-sm transition-colors ${
                          params.category === category.key
                            ? "bg-teal text-white font-medium"
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {category.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Quick Links */}
              <div className="border-t pt-4">
                <h3 className="font-bold text-gray-800 mb-3">Quick Links</h3>
                <ul className="space-y-1">
                  <li>
                    <Link
                      href="/products?onOffer=true"
                      className={`block py-2 px-3 rounded-lg text-sm transition-colors ${
                        params.onOffer === "true"
                          ? "bg-primary text-white font-medium"
                          : "text-primary hover:bg-red-50"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <FiPercent className="w-4 h-4" />
                        Special Offers
                      </span>
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{pageTitle}</h1>
                <p className="text-gray-500 mt-1">{total.toLocaleString()} products found</p>
              </div>

              {/* Sort Options */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">Sort by:</span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: "", label: "Popular" },
                    { value: "price_asc", label: "Price: Low" },
                    { value: "price_desc", label: "Price: High" },
                    { value: "newest", label: "Newest" },
                  ].map((option) => (
                    <Link
                      key={option.value}
                      href={`/products?${new URLSearchParams({
                        ...(params.category ? { category: params.category } : {}),
                        ...(params.brand ? { brand: params.brand } : {}),
                        ...(params.onOffer ? { onOffer: params.onOffer } : {}),
                        ...(search ? { search } : {}),
                        ...(option.value ? { sort: option.value } : {}),
                      }).toString()}`}
                      className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                        (params.sort || "") === option.value
                          ? "bg-teal text-white"
                          : "bg-white text-gray-600 hover:bg-gray-100 border"
                      }`}
                    >
                      {option.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Popular Products Section (on main page) */}
            {popularProducts.length > 0 && !params.category && !search && page === 1 && (
              <div className="mb-10">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="w-1 h-6 bg-teal rounded-full"></span>
                  Popular Drinks
                </h2>
                <ProductGrid products={popularProducts} />
              </div>
            )}

            {/* Products Grid */}
            {products.length > 0 ? (
              <>
                {(params.category || search || page > 1) && popularProducts.length > 0 ? null : (
                  <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="w-1 h-6 bg-teal rounded-full"></span>
                    {params.category || search ? pageTitle : "All Products"}
                  </h2>
                )}
                <ProductGrid products={products} />

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-10">
                    {page > 1 && (
                      <Link
                        href={`/products?${new URLSearchParams({
                          ...(params.category ? { category: params.category } : {}),
                          ...(params.brand ? { brand: params.brand } : {}),
                          ...(params.onOffer ? { onOffer: params.onOffer } : {}),
                          ...(search ? { search } : {}),
                          ...(params.sort ? { sort: params.sort } : {}),
                          page: String(page - 1),
                        }).toString()}`}
                        className="px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Previous
                      </Link>
                    )}

                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (page <= 3) {
                          pageNum = i + 1;
                        } else if (page >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = page - 2 + i;
                        }

                        return (
                          <Link
                            key={pageNum}
                            href={`/products?${new URLSearchParams({
                              ...(params.category ? { category: params.category } : {}),
                              ...(params.brand ? { brand: params.brand } : {}),
                              ...(params.onOffer ? { onOffer: params.onOffer } : {}),
                              ...(search ? { search } : {}),
                              ...(params.sort ? { sort: params.sort } : {}),
                              page: String(pageNum),
                            }).toString()}`}
                            className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
                              page === pageNum
                                ? "bg-teal text-white font-bold"
                                : "bg-white border hover:bg-gray-50"
                            }`}
                          >
                            {pageNum}
                          </Link>
                        );
                      })}
                    </div>

                    {page < totalPages && (
                      <Link
                        href={`/products?${new URLSearchParams({
                          ...(params.category ? { category: params.category } : {}),
                          ...(params.brand ? { brand: params.brand } : {}),
                          ...(params.onOffer ? { onOffer: params.onOffer } : {}),
                          ...(search ? { search } : {}),
                          ...(params.sort ? { sort: params.sort } : {}),
                          page: String(page + 1),
                        }).toString()}`}
                        className="px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Next
                      </Link>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16 bg-white rounded-xl">
                <Image
                  src="https://res.cloudinary.com/nmasuki/image/upload/c_fill,w_200/no_results.png"
                  alt="No results"
                  width={200}
                  height={200}
                  className="mx-auto mb-6 opacity-50"
                />
                <h2 className="text-xl font-bold text-gray-800 mb-2">No products found</h2>
                <p className="text-gray-500 mb-6">
                  {search
                    ? `We couldn't find any products matching "${search}"`
                    : "No products available in this category"}
                </p>
                <Link
                  href="/products"
                  className="inline-block bg-teal text-white px-6 py-3 rounded-lg font-semibold hover:bg-teal/90 transition-colors"
                >
                  Browse All Products
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
