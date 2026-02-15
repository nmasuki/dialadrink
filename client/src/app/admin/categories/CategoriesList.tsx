"use client";

import { useRouter } from "next/navigation";
import DataTable, { Column } from "@/components/admin/DataTable";
import StatusBadge from "@/components/admin/StatusBadge";
import axios from "axios";
import toast from "react-hot-toast";

interface Category {
  _id: string;
  name: string;
  key: string;
  state: string;
}

const columns: Column<Category>[] = [
  { key: "name", label: "Name", sortable: true, render: (c) => <span className="font-medium">{c.name}</span> },
  { key: "key", label: "Key", render: (c) => <span className="text-gray-500">{c.key || "\u2014"}</span> },
  { key: "state", label: "State", render: (c) => <StatusBadge status={c.state || "published"} /> },
];

export default function CategoriesList({
  categories,
  totalCount,
  page,
  pageSize,
}: {
  categories: Category[];
  totalCount: number;
  page: number;
  pageSize: number;
}) {
  const router = useRouter();

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`/api/admin/categories/${id}`);
      toast.success("Category deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete category");
    }
  };

  return (
    <DataTable
      columns={columns}
      data={categories}
      totalCount={totalCount}
      page={page}
      pageSize={pageSize}
      basePath="/admin/categories"
      onDelete={handleDelete}
      searchPlaceholder="Search categories..."
    />
  );
}
