"use client";

import { useRouter } from "next/navigation";
import DataTable, { Column } from "@/components/admin/DataTable";
import axios from "axios";
import toast from "react-hot-toast";

interface Promo {
  _id: string;
  name: string;
  code: string;
  discount: number;
  discountType: string;
  startDate?: string;
  endDate?: string;
}

const formatDate = (d?: string) => {
  if (!d) return "\u2014";
  return new Date(d).toLocaleDateString();
};

const columns: Column<Promo>[] = [
  {
    key: "name",
    label: "Name",
    sortable: true,
    render: (p) => <span className="font-medium">{p.name}</span>,
  },
  {
    key: "code",
    label: "Code",
    render: (p) => <span className="text-gray-500 uppercase">{p.code}</span>,
  },
  {
    key: "discount",
    label: "Discount",
    render: (p) =>
      p.discountType === "percent" ? `${p.discount}%` : `KES ${p.discount}`,
  },
  {
    key: "startDate",
    label: "Start Date",
    render: (p) => formatDate(p.startDate),
  },
  {
    key: "endDate",
    label: "End Date",
    render: (p) => formatDate(p.endDate),
  },
];

export default function PromosList({
  promos,
  totalCount,
  page,
  pageSize,
}: {
  promos: Promo[];
  totalCount: number;
  page: number;
  pageSize: number;
}) {
  const router = useRouter();

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`/api/admin/promos/${id}`);
      toast.success("Promo deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete promo");
    }
  };

  return (
    <DataTable
      columns={columns}
      data={promos}
      totalCount={totalCount}
      page={page}
      pageSize={pageSize}
      basePath="/admin/promos"
      onDelete={handleDelete}
      searchPlaceholder="Search promos..."
    />
  );
}
