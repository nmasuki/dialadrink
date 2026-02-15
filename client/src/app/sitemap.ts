import { MetadataRoute } from "next";
import { connectDB } from "@/lib/db";
import { Product, ProductCategory } from "@/models";

const BASE_URL = "https://www.dialadrinkkenya.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connectDB();

  // Static pages
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
      url: `${BASE_URL}/cart`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/checkout`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/faq`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/delivery`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
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

  // Get all published products
  const products = await Product.find({ state: "published" })
    .select("href modifiedDate")
    .lean();

  const productPages: MetadataRoute.Sitemap = products.map((product: any) => ({
    url: `${BASE_URL}/products/${product.href}`,
    lastModified: product.modifiedDate || new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Get all categories
  const categories = await ProductCategory.find({})
    .select("key modifiedDate")
    .lean();

  const categoryPages: MetadataRoute.Sitemap = categories.map((category: any) => ({
    url: `${BASE_URL}/products?category=${category.key}`,
    lastModified: category.modifiedDate || new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...categoryPages, ...productPages];
}
