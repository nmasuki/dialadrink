"use client";

import DataTable, { Column } from "@/components/admin/DataTable";
import StatusBadge from "@/components/admin/StatusBadge";

interface OrderRow {
  _id: string;
  orderNumber: number;
  delivery: { firstName: string; lastName: string; phoneNumber: string };
  total: number;
  paymentMethod: string;
  state: string;
  payment: { state: string };
  orderDate: string;
}

const formatPrice = (n: number) =>
  new Intl.NumberFormat("en-KE", { minimumFractionDigits: 0 }).format(n);

const formatDate = (d: string) => {
  const date = new Date(d);
  return date.toLocaleDateString("en-KE", { month: "short", day: "numeric" }) +
    " " + date.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" });
};

const columns: Column<OrderRow>[] = [
  {
    key: "orderNumber",
    label: "Order #",
    sortable: true,
    render: (o) => <span className="font-medium">#{o.orderNumber}</span>,
  },
  {
    key: "customer",
    label: "Customer",
    render: (o) => (
      <div>
        <p className="font-medium">{o.delivery?.firstName} {o.delivery?.lastName}</p>
        <p className="text-xs text-gray-500">{o.delivery?.phoneNumber}</p>
      </div>
    ),
  },
  {
    key: "total",
    label: "Total",
    sortable: true,
    render: (o) => <span className="font-medium">KES {formatPrice(o.total || 0)}</span>,
  },
  {
    key: "paymentMethod",
    label: "Payment",
    render: (o) => (
      <div>
        <p className="text-sm capitalize">{o.paymentMethod || "—"}</p>
        <p className="text-xs text-gray-500">{o.payment?.state || "Pending"}</p>
      </div>
    ),
  },
  {
    key: "state",
    label: "Status",
    sortable: true,
    render: (o) => <StatusBadge status={o.state} />,
  },
  {
    key: "orderDate",
    label: "Date",
    sortable: true,
    render: (o) => <span className="text-gray-500 text-sm">{formatDate(o.orderDate)}</span>,
  },
];

export default function OrdersList({
  orders,
  totalCount,
  page,
  pageSize,
}: {
  orders: OrderRow[];
  totalCount: number;
  page: number;
  pageSize: number;
}) {
  return (
    <DataTable
      columns={columns}
      data={orders}
      totalCount={totalCount}
      page={page}
      pageSize={pageSize}
      basePath="/admin/orders"
      searchPlaceholder="Search by order #, name, or phone..."
    />
  );
}
