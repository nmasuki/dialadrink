import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { connectDB } from "@/lib/db";
import { Product } from "@/models";
import { IProduct } from "@/types";
import ProductOptions from "@/components/product/ProductOptions";
import { FiTruck, FiShield, FiClock, FiChevronRight } from "react-icons/fi";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

async function getProduct(slug: string): Promise<IProduct | null> {
  try {
    await connectDB();
    const product = await Product.findOne({
      href: slug,
      state: "published",
    })
      .populate("category", "name key")
      .populate("brand", "name href")
      .populate("priceOptions")
      .lean();

    return product ? (JSON.parse(JSON.stringify(product)) as IProduct) : null;
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
  }
}

async function getRelatedProducts(product: IProduct): Promise<IProduct[]> {
  try {
    await connectDB();
    const categoryId = typeof product.category === "object" ? product.category._id : product.category;

    const related = await Product.find({
      _id: { $ne: product._id },
      category: categoryId,
      state: "published",
      inStock: true,
    })
      .populate("category", "name key")
      .populate("priceOptions")
      .limit(4)
      .lean();

    return JSON.parse(JSON.stringify(related)) as IProduct[];
  } catch (error) {
    console.error("Error fetching related products:", error);
    return [];
  }
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return { title: "Product Not Found" };
  }

  const brand = typeof product.brand === "object" ? product.brand : null;
  const plainDescription = (product.description || "")
    .replace(/<[^>]*>/g, "")
    .slice(0, 160);
  const description =
    plainDescription || `Order ${product.name} online with fast delivery across Nairobi.`;

  return {
    title: `${product.name} | Buy Online | Dial A Drink Kenya`,
    description,
    alternates: {
      canonical: `/products/${slug}`,
    },
    openGraph: {
      type: "website",
      title: `${product.name}${brand ? ` by ${brand.name}` : ""} | Buy Online`,
      description,
      images: product.image?.secure_url ? [product.image.secure_url] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description,
      images: product.image?.secure_url ? [product.image.secure_url] : [],
    },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    notFound();
  }

  const relatedProducts = await getRelatedProducts(product);

  const imageUrl = product.image?.secure_url || product.image?.url ||
    "https://res.cloudinary.com/nmasuki/image/upload/c_fill,w_500,h_500/placeholder.png";

  const category = typeof product.category === "object" ? product.category : null;
  const brand = typeof product.brand === "object" ? product.brand : null;

  const priceOptions = product.priceOptions || [];
  const defaultOption = priceOptions[0];
  const price = defaultOption?.price || product.price || 0;
  const offerPrice = defaultOption?.offerPrice || 0;
  const hasOffer = offerPrice > 0 && price > offerPrice;
  const currency = defaultOption?.currency || product.currency || "KES";

  const discountPercent = hasOffer
    ? Math.round(((price - offerPrice) / price) * 100)
    : 0;

  const formatPrice = (p: number) => {
    return new Intl.NumberFormat("en-KE", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(p);
  };

  const siteUrl = "https://www.dialadrinkkenya.com";

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: (product.description || "").replace(/<[^>]*>/g, "").slice(0, 500),
    image: imageUrl,
    ...(brand && { brand: { "@type": "Brand", name: brand.name } }),
    ...(category && { category: category.name }),
    ...(product.countryOfOrigin && { countryOfOrigin: product.countryOfOrigin }),
    offers: {
      "@type": "Offer",
      price: hasOffer ? offerPrice : price,
      priceCurrency: currency,
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: "Dial A Drink Kenya" },
      url: `${siteUrl}/products/${product.href}`,
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Products", item: `${siteUrl}/products` },
      ...(category
        ? [{ "@type": "ListItem", position: 3, name: category.name, item: `${siteUrl}/products?category=${category.key}` }]
        : []),
      { "@type": "ListItem", position: category ? 4 : 3, name: product.name },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className="max-w-7xl mx-auto px-4">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm">
          <ol className="flex items-center gap-2 text-gray-500">
            <li><Link href="/" className="hover:text-teal">Home</Link></li>
            <li><FiChevronRight className="w-3 h-3" /></li>
            <li><Link href="/products" className="hover:text-teal">Products</Link></li>
            {category && (
              <>
                <li><FiChevronRight className="w-3 h-3" /></li>
                <li>
                  <Link href={`/products?category=${category.key}`} className="hover:text-teal">
                    {category.name}
                  </Link>
                </li>
              </>
            )}
            <li><FiChevronRight className="w-3 h-3" /></li>
            <li className="text-gray-800 truncate max-w-[200px]">{product.name}</li>
          </ol>
        </nav>

        {/* Product Details */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 lg:p-10">
            {/* Image */}
            <div className="relative">
              {discountPercent > 0 && (
                <span className="absolute top-4 left-4 bg-primary text-white text-sm font-bold px-3 py-1 rounded-full z-10">
                  -{discountPercent}% OFF
                </span>
              )}
              {!product.inStock && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10 rounded-xl">
                  <span className="bg-gray-900 text-white px-6 py-3 rounded-lg font-bold text-lg">
                    Out of Stock
                  </span>
                </div>
              )}
              <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden">
                <Image
                  src={imageUrl}
                  alt={product.name}
                  width={600}
                  height={600}
                  className="w-full h-full object-contain"
                  priority
                />
              </div>
            </div>

            {/* Info */}
            <div className="flex flex-col">
              {/* Category & Brand */}
              <div className="flex items-center gap-3 mb-3">
                {category && (
                  <Link
                    href={`/products?category=${category.key}`}
                    className="text-sm text-teal font-medium uppercase tracking-wide hover:underline"
                  >
                    {category.name}
                  </Link>
                )}
                {brand && (
                  <span className="text-sm text-gray-400">by {brand.name}</span>
                )}
              </div>

              {/* Name */}
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-4">
                {product.name}
              </h1>

              {/* ABV & Origin */}
              {(product.alcoholContent || product.countryOfOrigin) && (
                <p className="text-gray-500 mb-6">
                  {product.alcoholContent ? `${product.alcoholContent}% ABV` : ""}
                  {product.alcoholContent && product.countryOfOrigin ? " | " : ""}
                  {product.countryOfOrigin || ""}
                </p>
              )}

              {/* Product Options */}
              {product.inStock && (
                <ProductOptions
                  product={product}
                  priceOptions={priceOptions}
                  currency={currency}
                />
              )}

              {/* Out of Stock Message */}
              {!product.inStock && (
                <div className="mb-6">
                  <p className="text-xl font-bold text-gray-400">Out of Stock</p>
                  <p className="text-gray-500 mt-2">This product is currently unavailable.</p>
                </div>
              )}

              {/* Features */}
              <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t">
                <div className="text-center">
                  <FiTruck className="w-6 h-6 mx-auto text-teal mb-2" />
                  <p className="text-xs text-gray-600">Fast Delivery</p>
                </div>
                <div className="text-center">
                  <FiClock className="w-6 h-6 mx-auto text-teal mb-2" />
                  <p className="text-xs text-gray-600">45 Min - 2 Hours</p>
                </div>
                <div className="text-center">
                  <FiShield className="w-6 h-6 mx-auto text-teal mb-2" />
                  <p className="text-xs text-gray-600">100% Genuine</p>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div className="p-6 lg:p-10 pt-0 lg:pt-0">
              <div className="border-t pt-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Product Description</h2>
                <div
                  className="prose prose-gray product-description max-w-none text-gray-600 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">You May Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.map((relProduct) => {
                const relPriceOption = relProduct.priceOptions?.[0];
                const relPrice = relPriceOption?.price || relProduct.price || 0;
                const relOfferPrice = relPriceOption?.offerPrice || 0;
                const relHasOffer = relOfferPrice > 0 && relPrice > relOfferPrice;
                const relDisplayPrice = relHasOffer ? relOfferPrice : relPrice;
                const relImageUrl = relProduct.image?.secure_url ||
                  "https://res.cloudinary.com/nmasuki/image/upload/c_fill,w_300,h_300/placeholder.png";

                return (
                  <Link
                    key={relProduct._id}
                    href={`/products/${relProduct.href}`}
                    className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow group"
                  >
                    <div className="aspect-square bg-gray-100 overflow-hidden">
                      <Image
                        src={relImageUrl}
                        alt={relProduct.name}
                        width={300}
                        height={300}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium text-gray-800 line-clamp-2 mb-2 group-hover:text-teal transition-colors">
                        {relProduct.name}
                      </h3>
                      <p className="font-bold text-primary">
                        KES {formatPrice(relDisplayPrice)}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
