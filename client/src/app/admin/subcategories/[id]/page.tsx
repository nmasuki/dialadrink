import { connectDB } from "@/lib/db";
import { ProductSubCategory, ProductCategory } from "@/models";
import { notFound } from "next/navigation";
import SubCategoryForm from "../SubCategoryForm";

export const dynamic = "force-dynamic";

export default async function EditSubCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await connectDB();

  const [subcategory, categories] = await Promise.all([
    ProductSubCategory.findById(id).lean(),
    ProductCategory.find({}).select("name").sort({ name: 1 }).lean(),
  ]);

  if (!subcategory) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Edit Sub Category</h1>
      <SubCategoryForm
        subcategory={JSON.parse(JSON.stringify(subcategory))}
        categories={JSON.parse(JSON.stringify(categories))}
      />
    </div>
  );
}
