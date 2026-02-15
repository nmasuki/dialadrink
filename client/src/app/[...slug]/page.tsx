import { notFound, redirect } from "next/navigation";
import ProductCard from "@/components/product/ProductCard";
import { connectDB } from "@/lib/db";
import { Product, Category, Brand } from "@/models";
import { IProduct, ICategory } from "@/types";
import Link from "next/link";

interface CategoryPageProps {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// Map URL slugs to category keys
const categoryMap: Record<string, string> = {
  "whisky": "whisky",
  "whiskey": "whisky",
  "wine": "wine",
  "beers": "beers",
  "beer": "beers",
  "vodka": "vodka",
  "gin": "gin",
  "rum": "rum",
  "tequila": "tequila",
  "brandy": "brandy",
  "cognac": "cognac",
  "champagne": "champagne",
  "liqueurs": "liqueurs",
  "vapes": "vapes",
  "smokes": "smokes",
  "soft-drinks": "soft-drinks",
};

// Map direct subcategory URLs to parent category + filter
const directSubcategoryMap: Record<string, { category: string; tag: string; label: string }> = {
  // Whisky subcategories
  "single-malt-whiskies": { category: "whisky", tag: "single malt", label: "Single Malt Whiskies" },
  "single-malt": { category: "whisky", tag: "single malt", label: "Single Malt Whiskies" },
  "blended-scotch-whiskies": { category: "whisky", tag: "blended scotch", label: "Blended Scotch" },
  "blended-scotch": { category: "whisky", tag: "blended scotch", label: "Blended Scotch" },
  "bourbon-whiskies": { category: "whisky", tag: "bourbon", label: "Bourbon Whiskies" },
  "bourbon": { category: "whisky", tag: "bourbon", label: "Bourbon" },
  "irish-whiskies": { category: "whisky", tag: "irish", label: "Irish Whiskies" },
  "tennessee-whiskies": { category: "whisky", tag: "tennessee", label: "Tennessee Whiskies" },
  // Wine subcategories
  "red-wine": { category: "wine", tag: "red", label: "Red Wine" },
  "white-wine": { category: "wine", tag: "white", label: "White Wine" },
  "rose-wine": { category: "wine", tag: "rose", label: "Rose Wine" },
  "sparkling-wine": { category: "wine", tag: "sparkling", label: "Sparkling Wine" },
  // Beer subcategories
  "lager-beer": { category: "beers", tag: "lager", label: "Lager Beer" },
  "lager": { category: "beers", tag: "lager", label: "Lager" },
  "malt-beer": { category: "beers", tag: "malt", label: "Malt Beer" },
  "cider-beer": { category: "beers", tag: "cider", label: "Cider" },
  "cider": { category: "beers", tag: "cider", label: "Cider" },
  "draught-beer": { category: "beers", tag: "draught", label: "Draught Beer" },
  "draught": { category: "beers", tag: "draught", label: "Draught" },
};

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const search = await searchParams;

  if (!slug || slug.length === 0) {
    notFound();
  }

  const mainSlug = slug[0].toLowerCase();
  const subSlug = slug[1]?.toLowerCase();

  await connectDB();

  // Check for /offers shortcut
  if (mainSlug === "offers") {
    redirect("/products?onOffer=true");
  }

  // FIRST: Check if this is a product URL (single slug that matches a product href)
  if (slug.length === 1 && !categoryMap[mainSlug] && !directSubcategoryMap[mainSlug]) {
    const product = await Product.findOne({
      href: mainSlug,
      state: "published",
    }).lean();

    if (product) {
      // Redirect to canonical product URL
      redirect(`/products/${mainSlug}`);
    }

    // Check if it's a brand URL
    const brand = await Brand.findOne({
      href: { $regex: new RegExp(`^${mainSlug}$`, 'i') },
    }).lean();

    if (brand) {
      redirect(`/products?brand=${brand.href || mainSlug}`);
    }
  }

  let category: ICategory | null = null;
  let filterTag: string | null = null;
  let pageTitle: string = "";
  let breadcrumbCategory: string = mainSlug;

  // First check if it's a direct category
  const categoryKey = categoryMap[mainSlug];

  if (categoryKey) {
    // It's a main category
    category = await Category.findOne({
      key: { $regex: new RegExp(`^${categoryKey}$`, 'i') }
    }).lean() as ICategory | null;

    if (!category) {
      notFound();
    }

    pageTitle = category.name;

    // Check for nested subcategory
    if (subSlug && directSubcategoryMap[subSlug]) {
      filterTag = directSubcategoryMap[subSlug].tag;
      pageTitle = directSubcategoryMap[subSlug].label;
    }
  } else {
    // Check if it's a direct subcategory URL
    const subcatInfo = directSubcategoryMap[mainSlug];
    if (!subcatInfo) {
      notFound();
    }

    // Find parent category
    category = await Category.findOne({
      key: { $regex: new RegExp(`^${subcatInfo.category}$`, 'i') }
    }).lean() as ICategory | null;

    if (!category) {
      notFound();
    }

    filterTag = subcatInfo.tag;
    pageTitle = subcatInfo.label;
    breadcrumbCategory = subcatInfo.category;
  }

  // Build query
  const query: Record<string, unknown> = {
    state: "published",
    inStock: true,
    category: category._id,
  };

  // Add tag filter if present
  if (filterTag) {
    query.$or = [
      { tags: { $regex: new RegExp(filterTag, 'i') } },
      { name: { $regex: new RegExp(filterTag, 'i') } },
    ];
  }

  // Pagination
  const page = parseInt((search.page as string) || "1");
  const pageSize = 20;
  const skip = (page - 1) * pageSize;

  // Sort
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
  const products = JSON.parse(JSON.stringify(rawProducts)) as IProduct[];

  const totalPages = Math.ceil(total / pageSize);
  const currentUrl = subSlug ? `/${mainSlug}/${subSlug}` : `/${mainSlug}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm">
          <ol className="flex items-center gap-2 text-gray-500">
            <li><Link href="/" className="hover:text-primary">Home</Link></li>
            <li>/</li>
            {filterTag && categoryMap[mainSlug] ? (
              <>
                <li><Link href={`/${breadcrumbCategory}`} className="hover:text-primary capitalize">{category.name}</Link></li>
                <li>/</li>
                <li className="text-gray-800">{pageTitle}</li>
              </>
            ) : filterTag ? (
              <>
                <li><Link href={`/${breadcrumbCategory}`} className="hover:text-primary capitalize">{category.name}</Link></li>
                <li>/</li>
                <li className="text-gray-800">{pageTitle}</li>
              </>
            ) : (
              <li className="text-gray-800">{pageTitle}</li>
            )}
          </ol>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-gray-800">{pageTitle}</h1>
          <p className="text-gray-600 mt-2">{total} products found</p>
        </div>

        {/* Sort Options */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-2">
            <Link href={currentUrl} className={`px-3 py-1 rounded text-sm ${!search.sort || search.sort === "popularity" ? "bg-teal text-white" : "bg-gray-200"}`}>
              Popular
            </Link>
            <Link href={`${currentUrl}?sort=price_asc`} className={`px-3 py-1 rounded text-sm ${search.sort === "price_asc" ? "bg-teal text-white" : "bg-gray-200"}`}>
              Price: Low
            </Link>
            <Link href={`${currentUrl}?sort=price_desc`} className={`px-3 py-1 rounded text-sm ${search.sort === "price_desc" ? "bg-teal text-white" : "bg-gray-200"}`}>
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
            <p className="text-gray-500 text-lg">No products found in this category.</p>
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
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: CategoryPageProps) {
  const { slug } = await params;
  const mainSlug = slug?.[0]?.toLowerCase() || "";

  if (mainSlug === "offers") {
    return {
      title: "Special Offers | Dial A Drink Kenya",
      description: "Amazing deals on your favorite drinks. Order online with fast delivery across Nairobi.",
    };
  }

  // Check if it's a product or brand
  if (slug?.length === 1 && !categoryMap[mainSlug] && !directSubcategoryMap[mainSlug]) {
    await connectDB();
    const product = await Product.findOne({ href: mainSlug, state: "published" }).lean() as IProduct | null;
    if (product) {
      return {
        title: `${product.name} | Dial A Drink Kenya`,
        description: product.description || `Order ${product.name} online with fast delivery.`,
      };
    }

    const brand = await Brand.findOne({ href: { $regex: new RegExp(`^${mainSlug}$`, 'i') } }).lean();
    if (brand) {
      return {
        title: `${brand.name} Delivery Nairobi | Dial A Drink Kenya`,
        description: `Order ${brand.name} online with fast delivery across Nairobi. Best prices on ${brand.name} products.`,
      };
    }
  }

  const categoryKey = categoryMap[mainSlug];
  const subcatInfo = directSubcategoryMap[mainSlug];

  let title = "Products - Dial A Drink Kenya";

  if (categoryKey) {
    await connectDB();
    const category = await Category.findOne({
      key: { $regex: new RegExp(`^${categoryKey}$`, 'i') }
    }).lean() as ICategory | null;
    title = `${category?.name || categoryKey} Delivery Nairobi - Dial A Drink Kenya`;
  } else if (subcatInfo) {
    title = `${subcatInfo.label} - Dial A Drink Kenya`;
  }

  return {
    title,
    description: `Order online with fast delivery across Nairobi. Best prices and wide selection.`,
  };
}
