import { connectDB } from "@/lib/db";
import { ProductCategory } from "@/models";
import SubCategoryForm from "../SubCategoryForm";

export const dynamic = "force-dynamic";

export default async function NewSubCategoryPage() {
  await connectDB();
  const categories = await ProductCategory.find({}).select("name").sort({ name: 1 }).lean();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">New Sub Category</h1>
      <SubCategoryForm categories={JSON.parse(JSON.stringify(categories))} />
    </div>
  );
}
