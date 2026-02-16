"use client";

import { useRouter } from "next/navigation";
import DataTable, { Column } from "@/components/admin/DataTable";
import StatusBadge from "@/components/admin/StatusBadge";
import axios from "axios";
import toast from "react-hot-toast";

interface PageItem {
  _id: string;
  name: string;
  href: string;
  title: string;
  state: string;
}

const columns: Column<PageItem>[] = [
  { key: "name", label: "Name", sortable: true, render: (p) => <span className="font-medium">{p.name || "—"}</span> },
  { key: "href", label: "Href", sortable: true, render: (p) => <span className="text-gray-500 text-sm">{p.href || "—"}</span> },
  { key: "title", label: "Title", render: (p) => <span className="text-sm">{p.title ? (p.title.length > 50 ? p.title.slice(0, 50) + "…" : p.title) : "—"}</span> },
  { key: "state", label: "State", render: (p) => <StatusBadge status={p.state || "published"} /> },
];

export default function PagesList({
  pages,
  totalCount,
  page,
  pageSize,
}: {
  pages: PageItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}) {
  const router = useRouter();

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`/api/admin/pages/${id}`);
      toast.success("Page deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete page");
    }
  };

  return (
    <DataTable
      columns={columns}
      data={pages}
      totalCount={totalCount}
      page={page}
      pageSize={pageSize}
      basePath="/admin/pages"
      onDelete={handleDelete}
      searchPlaceholder="Search pages..."
    />
  );
}
