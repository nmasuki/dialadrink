import { connectDB } from "@/lib/db";
import { MenuItem } from "@/models";
import Link from "next/link";
import { FiPlus } from "react-icons/fi";
import MenuItemsList from "./MenuItemsList";

export const dynamic = "force-dynamic";

export default async function MenuItemsPage() {
  await connectDB();

  // Fetch top-level items (level 1 or no parent) with populated submenus
  const topLevel = await MenuItem.find({ $or: [{ level: 1 }, { level: { $exists: false } }, { parent: { $exists: false } }] })
    .populate({
      path: "submenus",
      options: { sort: { index: 1 } },
    })
    .sort({ type: 1, index: 1 })
    .lean();

  // Find orphan items (level > 1 but no parent points to them)
  const topLevelIds = topLevel.map((item) => item._id.toString());
  const childIds = topLevel.flatMap((item) =>
    (item.submenus || []).map((sub: { _id: { toString(): string } }) => sub._id.toString())
  );
  const knownIds = new Set([...topLevelIds, ...childIds]);

  const allItems = await MenuItem.find().lean();
  const orphans = allItems.filter((item) => !knownIds.has(item._id.toString()));

  const menuTree = JSON.parse(JSON.stringify([...topLevel, ...orphans]));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Menu Items</h1>
        <Link
          href="/admin/menu-items/new"
          className="flex items-center gap-2 bg-teal text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal/90 transition-colors"
        >
          <FiPlus className="w-4 h-4" />
          Add Menu Item
        </Link>
      </div>

      <MenuItemsList menuItems={menuTree} />
    </div>
  );
}
