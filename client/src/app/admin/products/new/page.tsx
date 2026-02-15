import { connectDB } from "@/lib/db";
import { ProductCategory, ProductSubCategory, ProductBrand } from "@/models";
import ProductForm from "../ProductForm";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  await connectDB();

  const [categories, subCategories, brands] = await Promise.all([
    ProductCategory.find().sort({ name: 1 }).lean(),
    ProductSubCategory.find().sort({ name: 1 }).lean(),
    ProductBrand.find().sort({ name: 1 }).lean(),
  ]);

  return (
    <ProductForm
      categories={JSON.parse(JSON.stringify(categories))}
      subCategories={JSON.parse(JSON.stringify(subCategories))}
      brands={JSON.parse(JSON.stringify(brands))}
    />
  );
}
