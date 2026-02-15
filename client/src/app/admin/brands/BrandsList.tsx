"use client";

import { useRouter } from "next/navigation";
import DataTable, { Column } from "@/components/admin/DataTable";
import StatusBadge from "@/components/admin/StatusBadge";
import axios from "axios";
import toast from "react-hot-toast";

interface Brand {
  _id: string;
  name: string;
  href: string;
  state: string;
}

const columns: Column<Brand>[] = [
  { key: "name", label: "Name", sortable: true, render: (b) => <span className="font-medium">{b.name}</span> },
  { key: "href", label: "Slug", render: (b) => <span className="text-gray-500">{b.href || "—"}</span> },
  { key: "state", label: "State", render: (b) => <StatusBadge status={b.state || "published"} /> },
];

export default function BrandsList({
  brands,
  totalCount,
  page,
  pageSize,
}: {
  brands: Brand[];
  totalCount: number;
  page: number;
  pageSize: number;
}) {
  const router = useRouter();

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`/api/admin/brands/${id}`);
      toast.success("Brand deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete brand");
    }
  };

  return (
    <DataTable
      columns={columns}
      data={brands}
      totalCount={totalCount}
      page={page}
      pageSize={pageSize}
      basePath="/admin/brands"
      onDelete={handleDelete}
      searchPlaceholder="Search brands..."
    />
  );
}
