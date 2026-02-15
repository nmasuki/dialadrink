import { connectDB } from "@/lib/db";
import { ProductSubCategory, ProductCategory } from "@/models";
import Link from "next/link";
import { FiPlus } from "react-icons/fi";
import SubCategoriesList from "./SubCategoriesList";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ page?: string; q?: string; sort?: string; order?: string; category?: string }>;
}

export default async function SubCategoriesPage({ searchParams }: Props) {
  const params = await searchParams;
  await connectDB();

  const page = parseInt(params.page || "1");
  const pageSize = 20;
  const q = params.q || "";
  const sort = params.sort || "name";
  const order = params.order === "desc" ? -1 : 1;

  const query: Record<string, unknown> = {};
  if (q) query.name = { $regex: q, $options: "i" };
  if (params.category) query.category = params.category;

  const [subcategories, count, categories] = await Promise.all([
    ProductSubCategory.find(query)
      .populate("category", "name key")
      .sort({ [sort]: order })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    ProductSubCategory.countDocuments(query),
    ProductCategory.find({}).select("name").sort({ name: 1 }).lean(),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Sub Categories</h1>
        <Link
          href="/admin/subcategories/new"
          className="flex items-center gap-2 bg-teal text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal/90 transition-colors"
        >
          <FiPlus className="w-4 h-4" />
          Add Sub Category
        </Link>
      </div>

      <SubCategoriesList
        subcategories={JSON.parse(JSON.stringify(subcategories))}
        totalCount={count}
        page={page}
        pageSize={pageSize}
        categories={JSON.parse(JSON.stringify(categories))}
      />
    </div>
  );
}
