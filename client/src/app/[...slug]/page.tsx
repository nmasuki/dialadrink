import { notFound, redirect } from "next/navigation";
import ProductCard from "@/components/product/ProductCard";
import { connectDB } from "@/lib/db";
import { Product, Category, Brand, ProductSubCategory } from "@/models";
import { IProduct, ICategory, IBrand } from "@/types";
import Link from "next/link";
import { FiPercent } from "react-icons/fi";
import { getPageData } from "@/lib/getPageData";
import PageContent from "@/components/PageContent";

interface SlugPageProps {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// Static aliases for common alternate spellings
const categoryAliases: Record<string, string> = {
  whiskey: "whisky",
  beer: "beers",
};

/**
 * Resolve a slug to its entity type by checking the DB in priority order:
 * 1. Special keywords (offers)
 * 2. Category (by key or href)
 * 3. Subcategory (by key, with parent category populated)
 * 4. Brand (by href)
 * 5. Product (by href) — redirects to /products/[slug]
 * 6. Page (by href or key)
 */
async function resolveSlug(mainSlug: string) {
  if (mainSlug === "offers") return { type: "offers" as const };

  const resolved = categoryAliases[mainSlug] || mainSlug;

  // Category
  const category = await Category.findOne({
    $or: [
      { key: resolved },
      { key: { $regex: new RegExp(`^${resolved}$`, "i") } },
      { href: resolved },
      { href: { $regex: new RegExp(`^${resolved}$`, "i") } },
    ],
  }).lean() as ICategory | null;
  if (category) return { type: "category" as const, category };

  // Subcategory
  const subcategory = await ProductSubCategory.findOne({
    $or: [
      { key: resolved },
      { key: { $regex: new RegExp(`^${resolved}$`, "i") } },
    ],
  })
    .populate("category")
    .lean();    
  if (subcategory && subcategory.category) {
    const parentCategory = JSON.parse(JSON.stringify(subcategory.category)) as ICategory;
    const filterTag = (subcategory.name || resolved).replace(/-/g, " ");
    return {
      type: "subcategory" as const,
      category: parentCategory,
      filterTag,
      filterLabel: subcategory.name || resolved,
    };
  }

  // Brand
  const brand = await Brand.findOne({
    $or: [
      { href: resolved },
      { href: { $regex: new RegExp(`^${resolved}$`, "i") } },
    ],
  }).lean();
  if (brand)
    return { type: "brand" as const, brand: JSON.parse(JSON.stringify(brand)) as IBrand };

  // Product → redirect to canonical URL
  const product = await Product.findOne({ href: resolved, state: "published" }).lean();
  if (product) return { type: "product" as const, href: resolved };

  // Page
  const pageData = await getPageData(resolved);
  if (pageData) return { type: "page" as const, page: pageData };

  return { type: "not_found" as const };
}

// ─── Shared product fetching ─────────────────────────────────────────────────

async function fetchProducts(
  query: Record<string, unknown>,
  search: Record<string, string | string[] | undefined>,
) {
  const page = parseInt((search.page as string) || "1");
  const pageSize = 20;
  const skip = (page - 1) * pageSize;
  const sort = (search.sort as string) || "popularity";

  let sortQuery: Record<string, 1 | -1> = { popularity: -1 };
  if (sort === "price_asc") sortQuery = { price: 1 };
  if (sort === "price_desc") sortQuery = { price: -1 };
  if (sort === "newest") sortQuery = { publishedDate: -1 };

  const [rawProducts, total] = await Promise.all([
    Product.find(query)
      .populate("category", "name key")
      .populate("brand", "name href")
      .populate("priceOptions")
      .sort(sortQuery)
      .skip(skip)
      .limit(pageSize)
      .lean()
      .exec(),
    Product.countDocuments(query).exec() as unknown as number,
  ]);

  return {
    products: JSON.parse(JSON.stringify(rawProducts)) as IProduct[],
    total,
    page,
    totalPages: Math.ceil(total / pageSize),
    sort,
  };
}

// ─── Shared listing renderer ─────────────────────────────────────────────────

interface ListingProps {
  products: IProduct[];
  total: number;
  page: number;
  totalPages: number;
  sort: string;
  currentUrl: string;
  pageTitle: string;
  displayTitle: string;
  breadcrumbs: Array<{ label: string; href?: string }>;
  pageData?: Awaited<ReturnType<typeof getPageData>>;
  heroContent?: React.ReactNode;
}

function ProductListing({
  products,
  total,
  page,
  totalPages,
  sort,
  currentUrl,
  displayTitle,
  breadcrumbs,
  pageData,
  heroContent,
}: ListingProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {heroContent}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm">
          <ol className="flex items-center gap-2 text-gray-500">
            <li>
              <Link href="/" className="hover:text-primary">
                Home
              </Link>
            </li>
            {breadcrumbs.map((crumb, i) => (
              <li key={i} className="flex items-center gap-2">
                <span>/</span>
                {crumb.href ? (
                  <Link href={crumb.href} className="hover:text-primary">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-gray-800">{crumb.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>

        {/* Header */}
        {!heroContent && (
          <div className="mb-8">
            <h1 className="text-3xl font-heading font-bold text-gray-800">{displayTitle}</h1>
            <p className="text-gray-600 mt-2">{total} products found</p>
          </div>
        )}

        {/* Sort Options */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-2">
            <Link
              href={currentUrl}
              className={`px-3 py-1 rounded text-sm ${!sort || sort === "popularity" ? "bg-teal text-white" : "bg-gray-200"}`}
            >
              Popular
            </Link>
            <Link
              href={`${currentUrl}?sort=price_asc`}
              className={`px-3 py-1 rounded text-sm ${sort === "price_asc" ? "bg-teal text-white" : "bg-gray-200"}`}
            >
              Price: Low
            </Link>
            <Link
              href={`${currentUrl}?sort=price_desc`}
              className={`px-3 py-1 rounded text-sm ${sort === "price_desc" ? "bg-teal text-white" : "bg-gray-200"}`}
            >
              Price: High
            </Link>
          </div>
        </div>

        {/* Products Grid */}
        {products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No products found.</p>
            <Link href="/products" className="text-primary hover:underline mt-2 inline-block">
              Browse all products
            </Link>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-10">
            {page > 1 && (
              <Link
                href={`${currentUrl}?${new URLSearchParams({
                  ...(sort !== "popularity" ? { sort } : {}),
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
                if (totalPages <= 5) pageNum = i + 1;
                else if (page <= 3) pageNum = i + 1;
                else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                else pageNum = page - 2 + i;
                return (
                  <Link
                    key={pageNum}
                    href={`${currentUrl}?${new URLSearchParams({
                      ...(sort !== "popularity" ? { sort } : {}),
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
                href={`${currentUrl}?${new URLSearchParams({
                  ...(sort !== "popularity" ? { sort } : {}),
                  page: String(page + 1),
                }).toString()}`}
                className="px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
              >
                Next
              </Link>
            )}
          </div>
        )}
        {pageData && <PageContent page={pageData} />}
      </div>
    </div>
  );
}

// ─── Main Page Component ─────────────────────────────────────────────────────

export default async function SlugPage({ params, searchParams }: SlugPageProps) {
  const { slug } = await params;
  const search = await searchParams;

  if (!slug || slug.length === 0) notFound();

  const mainSlug = slug[0].toLowerCase();
  const subSlug = slug[1]?.toLowerCase();

  await connectDB();
  const resolution = await resolveSlug(mainSlug);

  // ── Offers ──
  if (resolution.type === "offers") {
    const query = { state: "published", inStock: true, onOffer: true };
    const { products, total, page, totalPages, sort } = await fetchProducts(query, search);
    const seoPage = await getPageData("offers");

    return (
      <ProductListing
        products={products}
        total={total}
        page={page}
        totalPages={totalPages}
        sort={sort}
        currentUrl="/offers"
        pageTitle="Special Offers"
        displayTitle={seoPage?.h1 || "Special Offers"}
        breadcrumbs={[{ label: "Special Offers" }]}
        pageData={seoPage}
        heroContent={
          <div className="bg-gradient-to-r from-primary to-red-600 text-white py-8">
            <div className="max-w-7xl mx-auto px-4 text-center">
              <FiPercent className="w-12 h-12 mx-auto mb-3 animate-pulse" />
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Special Offers</h1>
              <p className="text-white/80">Amazing deals on your favorite drinks!</p>
              <p className="text-white/60 mt-2">{total} products on offer</p>
            </div>
          </div>
        }
      />
    );
  }

  // ── Product → redirect to canonical URL ──
  if (resolution.type === "product") {
    redirect(`/products/${resolution.href}`);
  }

  // ── Page (CMS) ──
  if (resolution.type === "page") {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <PageContent page={resolution.page} />
        </div>
      </div>
    );
  }

  // ── Not found ──
  if (resolution.type === "not_found") {
    notFound();
  }

  // ── Brand ──
  if (resolution.type === "brand") {
    const query = { state: "published", inStock: true, brand: resolution.brand._id };
    const { products, total, page, totalPages, sort } = await fetchProducts(query, search);
    const seoPage = await getPageData(mainSlug);

    return (
      <ProductListing
        products={products}
        total={total}
        page={page}
        totalPages={totalPages}
        sort={sort}
        currentUrl={`/${mainSlug}`}
        pageTitle={resolution.brand.name}
        displayTitle={seoPage?.h1 || resolution.brand.name}
        breadcrumbs={[{ label: resolution.brand.name }]}
        pageData={seoPage}
      />
    );
  }

  // ── Category or Subcategory ──
  const category = resolution.category;
  let filterTag: string | null = null;
  let pageTitle = category.name;
  let breadcrumbCategory = category.key || mainSlug;

  if (resolution.type === "subcategory") {
    filterTag = resolution.filterTag;
    pageTitle = resolution.filterLabel;
  }

  // Check for nested subcategory (e.g. /whisky/bourbon)
  if (resolution.type === "category" && subSlug) {
    const nestedSub = await ProductSubCategory.findOne({
      $or: [
        { key: subSlug },
        { key: { $regex: new RegExp(`^${subSlug}$`, "i") } },
      ],
      category: category._id,
    }).lean();
    if (nestedSub) {
      filterTag = (nestedSub.name || subSlug).replace(/-/g, " ");
      pageTitle = nestedSub.name || subSlug;
    }
  }

  const query: Record<string, unknown> = {
    state: "published",
    inStock: true,
    category: category._id,
  };

  if (filterTag) {
    query.$or = [
      { tags: { $regex: new RegExp(filterTag, "i") } },
      { name: { $regex: new RegExp(filterTag, "i") } },
    ];
  }

  const { products, total, page, totalPages, sort } = await fetchProducts(query, search);
  const currentUrl = subSlug ? `/${mainSlug}/${subSlug}` : `/${mainSlug}`;
  const categoryKey = category.key || mainSlug;
  const pageHref = `category/${categoryKey}`;
  const seoPage = await getPageData(pageHref);
  const displayTitle = seoPage?.h1 || pageTitle;

  const breadcrumbs = filterTag
    ? [
        { label: category.name, href: `/${breadcrumbCategory}` },
        { label: pageTitle },
      ]
    : [{ label: pageTitle }];

  return (
    <ProductListing
      products={products}
      total={total}
      page={page}
      totalPages={totalPages}
      sort={sort}
      currentUrl={currentUrl}
      pageTitle={pageTitle}
      displayTitle={displayTitle}
      breadcrumbs={breadcrumbs}
      pageData={seoPage}
    />
  );
}

// ─── Metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: SlugPageProps) {
  const { slug } = await params;
  const mainSlug = slug?.[0]?.toLowerCase() || "";

  await connectDB();
  const resolution = await resolveSlug(mainSlug);

  if (resolution.type === "offers") {
    return {
      title: "Special Offers | Dial A Drink Kenya",
      description:
        "Amazing deals on your favorite drinks. Order online with fast delivery across Nairobi.",
    };
  }

  if (resolution.type === "brand") {
    const brand = resolution.brand;
    return {
      title: `${brand.name} Delivery Nairobi | Dial A Drink Kenya`,
      description: `Order ${brand.name} online with fast delivery across Nairobi. Best prices on ${brand.name} products.`,
    };
  }

  if (resolution.type === "product") {
    const product = (await Product.findOne({
      href: mainSlug,
      state: "published",
    }).lean()) as IProduct | null;
    if (product) {
      return {
        title: `${product.name} | Dial A Drink Kenya`,
        description:
          (product.description || "").replace(/<[^>]*>/g, "").slice(0, 160) ||
          `Order ${product.name} online with fast delivery.`,
      };
    }
  }

  if (resolution.type === "category" || resolution.type === "subcategory") {
    const categoryKey = resolution.category.key || mainSlug;
    const pageHref =
      resolution.type === "category" ? `category/${categoryKey}` : mainSlug;
    const pageData = await getPageData(pageHref);

    if (pageData?.title) {
      const ogImage = pageData.bannerImages?.[0]?.secure_url;
      return {
        title: pageData.title,
        description: pageData.meta || `Order online with fast delivery across Nairobi.`,
        ...(ogImage && { openGraph: { images: [{ url: ogImage }] } }),
      };
    }

    const title =
      resolution.type === "subcategory"
        ? `${resolution.filterLabel} - Dial A Drink Kenya`
        : `${resolution.category.name} Delivery Nairobi - Dial A Drink Kenya`;

    return {
      title,
      description: `Order online with fast delivery across Nairobi. Best prices and wide selection.`,
    };
  }

  return {
    title: "Products - Dial A Drink Kenya",
    description: `Order online with fast delivery across Nairobi.`,
  };
}
