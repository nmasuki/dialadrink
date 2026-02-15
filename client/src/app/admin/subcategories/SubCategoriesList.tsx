"use client";

import { useRouter } from "next/navigation";
import DataTable, { Column } from "@/components/admin/DataTable";
import StatusBadge from "@/components/admin/StatusBadge";
import axios from "axios";
import toast from "react-hot-toast";

interface SubCategory {
  _id: string;
  name: string;
  key: string;
  category: { _id: string; name: string } | null;
  state: string;
}

const columns: Column<SubCategory>[] = [
  { key: "name", label: "Name", sortable: true, render: (s) => <span className="font-medium">{s.name}</span> },
  { key: "key", label: "Key", render: (s) => <span className="text-gray-500">{s.key || "\u2014"}</span> },
  {
    key: "category",
    label: "Category",
    render: (s) => <span className="text-gray-600">{s.category?.name || "\u2014"}</span>,
  },
  { key: "state", label: "State", render: (s) => <StatusBadge status={s.state || "published"} /> },
];

export default function SubCategoriesList({
  subcategories,
  totalCount,
  page,
  pageSize,
  categories: _categories,
}: {
  subcategories: SubCategory[];
  totalCount: number;
  page: number;
  pageSize: number;
  categories: { _id: string; name: string }[];
}) {
  const router = useRouter();

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`/api/admin/subcategories/${id}`);
      toast.success("Sub category deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete sub category");
    }
  };

  return (
    <DataTable
      columns={columns}
      data={subcategories}
      totalCount={totalCount}
      page={page}
      pageSize={pageSize}
      basePath="/admin/subcategories"
      onDelete={handleDelete}
      searchPlaceholder="Search sub categories..."
    />
  );
}
