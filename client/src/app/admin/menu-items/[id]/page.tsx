import { connectDB } from "@/lib/db";
import { MenuItem } from "@/models";
import { notFound } from "next/navigation";
import MenuItemForm from "../MenuItemForm";

export const dynamic = "force-dynamic";

export default async function EditMenuItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await connectDB();
  const menuItem = await MenuItem.findById(id).lean();
  if (!menuItem) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Edit Menu Item</h1>
      <MenuItemForm menuItem={JSON.parse(JSON.stringify(menuItem))} />
    </div>
  );
}
