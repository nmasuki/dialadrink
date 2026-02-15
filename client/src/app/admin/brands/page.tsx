import { connectDB } from "@/lib/db";
import { ProductBrand } from "@/models";
import Link from "next/link";
import { FiPlus } from "react-icons/fi";
import BrandsList from "./BrandsList";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ page?: string; q?: string; sort?: string; order?: string }>;
}

export default async function BrandsPage({ searchParams }: Props) {
  const params = await searchParams;
  await connectDB();

  const page = parseInt(params.page || "1");
  const pageSize = 20;
  const q = params.q || "";
  const sort = params.sort || "name";
  const order = params.order === "desc" ? -1 : 1;

  const query: Record<string, unknown> = {};
  if (q) query.name = { $regex: q, $options: "i" };

  const [brands, count] = await Promise.all([
    ProductBrand.find(query)
      .sort({ [sort]: order })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    ProductBrand.countDocuments(query),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Brands</h1>
        <Link
          href="/admin/brands/new"
          className="flex items-center gap-2 bg-teal text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal/90 transition-colors"
        >
          <FiPlus className="w-4 h-4" />
          Add Brand
        </Link>
      </div>

      <BrandsList
        brands={JSON.parse(JSON.stringify(brands))}
        totalCount={count}
        page={page}
        pageSize={pageSize}
      />
    </div>
  );
}
