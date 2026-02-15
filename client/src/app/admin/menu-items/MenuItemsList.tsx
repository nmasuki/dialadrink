"use client";

import { useRouter } from "next/navigation";
import DataTable, { Column } from "@/components/admin/DataTable";
import axios from "axios";
import toast from "react-hot-toast";

interface MenuItemData {
  _id: string;
  label: string;
  href: string;
  type: string;
  index: number;
  show: boolean;
}

const columns: Column<MenuItemData>[] = [
  { key: "label", label: "Label", sortable: true, render: (m) => <span className="font-medium">{m.label}</span> },
  { key: "href", label: "Href", render: (m) => <span className="text-gray-500">{m.href || "\u2014"}</span> },
  { key: "type", label: "Type", render: (m) => <span className="text-gray-500">{m.type || "\u2014"}</span> },
  { key: "index", label: "Index", render: (m) => <span>{m.index ?? 0}</span> },
  {
    key: "show",
    label: "Visible",
    render: (m) => (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
          m.show ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
        }`}
      >
        {m.show ? "Yes" : "No"}
      </span>
    ),
  },
];

export default function MenuItemsList({
  menuItems,
  totalCount,
  page,
  pageSize,
}: {
  menuItems: MenuItemData[];
  totalCount: number;
  page: number;
  pageSize: number;
}) {
  const router = useRouter();

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`/api/admin/menu-items/${id}`);
      toast.success("Menu item deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete menu item");
    }
  };

  return (
    <DataTable
      columns={columns}
      data={menuItems}
      totalCount={totalCount}
      page={page}
      pageSize={pageSize}
      basePath="/admin/menu-items"
      onDelete={handleDelete}
      searchPlaceholder="Search menu items..."
    />
  );
}
