import { connectDB } from "@/lib/db";
import { Product, ProductCategory, ProductSubCategory, ProductBrand } from "@/models";
import { notFound } from "next/navigation";
import ProductForm from "../ProductForm";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await connectDB();

  const [product, categories, subCategories, brands] = await Promise.all([
    Product.findById(id)
      .populate("priceOptions")
      .lean(),
    ProductCategory.find().sort({ name: 1 }).lean(),
    ProductSubCategory.find().sort({ name: 1 }).lean(),
    ProductBrand.find().sort({ name: 1 }).lean(),
  ]);

  if (!product) notFound();

  return (
    <ProductForm
      product={JSON.parse(JSON.stringify(product))}
      categories={JSON.parse(JSON.stringify(categories))}
      subCategories={JSON.parse(JSON.stringify(subCategories))}
      brands={JSON.parse(JSON.stringify(brands))}
    />
  );
}
