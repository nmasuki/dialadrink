import { MetadataRoute } from "next";
import { connectDB } from "@/lib/db";
import { Product, ProductCategory, ProductSubCategory, ProductBrand } from "@/models";

const BASE_URL = "https://www.dialadrinkkenya.com";

function sanitizeUrl(url: string): string {
  return url.replace(/&/g, "%26");
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connectDB();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/products`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/offers`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/faq`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/delivery`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  // Published products
  const products = await Product.find({ state: "published" })
    .select("href modifiedDate")
    .lean();

  const productPages: MetadataRoute.Sitemap = products.map((product: any) => ({
    url: sanitizeUrl(`${BASE_URL}/products/${product.href}`),
    lastModified: product.modifiedDate || new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Categories — clean URLs: /whisky, /wine, /beer
  const categories = await ProductCategory.find({})
    .select("key modifiedDate")
    .lean();

  const categoryPages: MetadataRoute.Sitemap = categories.map((category: any) => ({
    url: sanitizeUrl(`${BASE_URL}/${category.key}`),
    lastModified: category.modifiedDate || new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // Subcategories — clean URLs: /bourbon, /scotch
  const subcategories = await ProductSubCategory.find({})
    .select("key modifiedDate")
    .lean();

  const subcategoryPages: MetadataRoute.Sitemap = subcategories.map((sc: any) => ({
    url: sanitizeUrl(`${BASE_URL}/${sc.key}`),
    lastModified: sc.modifiedDate || new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  // Brands — clean URLs: /johnnie-walker, /absolut
  const brands = await ProductBrand.find({})
    .select("href modifiedDate")
    .lean();

  const brandPages: MetadataRoute.Sitemap = brands.map((brand: any) => ({
    url: sanitizeUrl(`${BASE_URL}/${brand.href}`),
    lastModified: brand.modifiedDate || new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [
    ...staticPages,
    ...categoryPages,
    ...subcategoryPages,
    ...brandPages,
    ...productPages,
  ];
}
