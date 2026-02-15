import { connectDB } from "@/lib/db";
import { Product, ProductCategory, ProductBrand } from "@/models";
import Link from "next/link";
import { FiPlus } from "react-icons/fi";
import ProductsList from "./ProductsList";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{
    page?: string;
    q?: string;
    sort?: string;
    order?: string;
    state?: string;
    category?: string;
    brand?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: Props) {
  const params = await searchParams;
  await connectDB();

  const page = parseInt(params.page || "1");
  const pageSize = 20;
  const q = params.q || "";
  const sort = params.sort || "name";
  const sortOrder = params.order === "desc" ? -1 : 1;

  const query: Record<string, unknown> = {};
  if (q) {
    query.$or = [
      { name: { $regex: q, $options: "i" } },
      { tags: { $regex: q, $options: "i" } },
    ];
  }
  if (params.state) query.state = params.state;
  if (params.category) query.category = params.category;
  if (params.brand) query.brand = params.brand;

  const [products, count, categories, brands] = await Promise.all([
    Product.find(query)
      .populate("category", "name")
      .populate("brand", "name")
      .populate("priceOptions")
      .sort({ [sort]: sortOrder })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    Product.countDocuments(query),
    ProductCategory.find().sort({ name: 1 }).lean(),
    ProductBrand.find().sort({ name: 1 }).lean(),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Products</h1>
        <Link
          href="/admin/products/new"
          className="flex items-center gap-2 bg-teal text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal/90 transition-colors"
        >
          <FiPlus className="w-4 h-4" />
          Add Product
        </Link>
      </div>

      <ProductsList
        products={JSON.parse(JSON.stringify(products))}
        totalCount={count}
        page={page}
        pageSize={pageSize}
        categories={JSON.parse(JSON.stringify(categories))}
        brands={JSON.parse(JSON.stringify(brands))}
      />
    </div>
  );
}
