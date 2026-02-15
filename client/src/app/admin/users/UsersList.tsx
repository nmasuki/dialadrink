"use client";

import { useRouter } from "next/navigation";
import DataTable, { Column } from "@/components/admin/DataTable";
import StatusBadge from "@/components/admin/StatusBadge";
import axios from "axios";
import toast from "react-hot-toast";

interface User {
  _id: string;
  name: { first: string; last: string };
  email: string;
  phoneNumber?: string;
  accountStatus: string;
  accountType: string;
  receivesOrders: boolean;
}

const columns: Column<User>[] = [
  {
    key: "name",
    label: "Name",
    sortable: true,
    render: (u) => (
      <span className="font-medium">
        {u.name?.first} {u.name?.last}
      </span>
    ),
  },
  { key: "email", label: "Email", sortable: true, render: (u) => <span className="text-gray-600">{u.email}</span> },
  { key: "phoneNumber", label: "Phone", render: (u) => <span className="text-gray-500">{u.phoneNumber || "—"}</span> },
  { key: "accountType", label: "Type", render: (u) => <span className="text-gray-500">{u.accountType || "—"}</span> },
  { key: "accountStatus", label: "Status", render: (u) => <StatusBadge status={u.accountStatus || "Active"} /> },
  {
    key: "receivesOrders",
    label: "Receives Orders",
    render: (u) => (
      <span className={`text-xs font-medium ${u.receivesOrders ? "text-green-600" : "text-gray-400"}`}>
        {u.receivesOrders ? "Yes" : "No"}
      </span>
    ),
  },
];

export default function UsersList({
  users,
  totalCount,
  page,
  pageSize,
}: {
  users: User[];
  totalCount: number;
  page: number;
  pageSize: number;
}) {
  const router = useRouter();

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`/api/admin/users/${id}`);
      toast.success("User deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete user");
    }
  };

  return (
    <DataTable
      columns={columns}
      data={users}
      totalCount={totalCount}
      page={page}
      pageSize={pageSize}
      basePath="/admin/users"
      onDelete={handleDelete}
      searchPlaceholder="Search users..."
    />
  );
}
