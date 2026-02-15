"use client";

import { useRouter } from "next/navigation";
import DataTable, { Column } from "@/components/admin/DataTable";
import axios from "axios";
import toast from "react-hot-toast";

interface LocationItem {
  _id: string;
  name: string;
  city: string;
  deliveryCharges: number;
  show: boolean;
}

const columns: Column<LocationItem>[] = [
  { key: "name", label: "Name", sortable: true, render: (l) => <span className="font-medium">{l.name}</span> },
  { key: "city", label: "City", render: (l) => <span className="text-gray-500">{l.city || "—"}</span> },
  { key: "deliveryCharges", label: "Delivery Fee", sortable: true, render: (l) => <span>KES {l.deliveryCharges}</span> },
  { key: "show", label: "Visible", render: (l) => <span className={`text-xs px-2 py-0.5 rounded-full ${l.show ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{l.show ? "Yes" : "No"}</span> },
];

export default function LocationsList({ locations, totalCount, page, pageSize }: { locations: LocationItem[]; totalCount: number; page: number; pageSize: number }) {
  const router = useRouter();
  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`/api/admin/locations/${id}`);
      toast.success("Location deleted");
      router.refresh();
    } catch { toast.error("Failed to delete location"); }
  };
  return <DataTable columns={columns} data={locations} totalCount={totalCount} page={page} pageSize={pageSize} basePath="/admin/locations" onDelete={handleDelete} searchPlaceholder="Search locations..." />;
}
