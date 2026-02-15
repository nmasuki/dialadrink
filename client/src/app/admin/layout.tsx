import { connectDB } from "@/lib/db";
import { Product, ProductBrand, ProductCategory, ProductSubCategory, Order, AppUser, Location, MenuItem, Promo } from "@/models";
import { getSession } from "@/lib/admin/auth";
import AdminShell from "./AdminShell";

async function getCounts() {
  await connectDB();
  const [products, brands, categories, subcategories, orders, users, locations, menuItems, promos] = await Promise.all([
    Product.countDocuments(),
    ProductBrand.countDocuments(),
    ProductCategory.countDocuments(),
    ProductSubCategory.countDocuments(),
    Order.countDocuments(),
    AppUser.countDocuments(),
    Location.countDocuments(),
    MenuItem.countDocuments(),
    Promo.countDocuments(),
  ]);
  return { products, brands, categories, subcategories, orders, users, locations, menuItems, promos };
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  // No session = login page (middleware already handles redirects)
  if (!session) {
    return <>{children}</>;
  }

  const counts = await getCounts();

  return (
    <AdminShell counts={counts} userName={session.name || session.email}>
      {children}
    </AdminShell>
  );
}
