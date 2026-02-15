import { connectDB } from "@/lib/db";
import { ProductBrand } from "@/models";
import { notFound } from "next/navigation";
import BrandForm from "../BrandForm";

export const dynamic = "force-dynamic";

export default async function EditBrandPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await connectDB();
  const brand = await ProductBrand.findById(id).lean();
  if (!brand) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Edit Brand</h1>
      <BrandForm brand={JSON.parse(JSON.stringify(brand))} />
    </div>
  );
}
