import { connectDB } from "@/lib/db";
import { ProductCategory } from "@/models";
import { notFound } from "next/navigation";
import CategoryForm from "../CategoryForm";

export const dynamic = "force-dynamic";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await connectDB();
  const category = await ProductCategory.findById(id).lean();
  if (!category) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Edit Category</h1>
      <CategoryForm category={JSON.parse(JSON.stringify(category))} />
    </div>
  );
}
