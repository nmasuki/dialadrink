const statusColors: Record<string, string> = {
  published: "bg-green-100 text-green-700",
  draft: "bg-yellow-100 text-yellow-700",
  archived: "bg-gray-100 text-gray-600",
  placed: "bg-blue-100 text-blue-700",
  paid: "bg-green-100 text-green-700",
  confirmed: "bg-teal/10 text-teal",
  preparing: "bg-yellow-100 text-yellow-700",
  dispatched: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  created: "bg-gray-100 text-gray-600",
  pending: "bg-yellow-100 text-yellow-700",
  active: "bg-green-100 text-green-700",
  Active: "bg-green-100 text-green-700",
  Pending: "bg-yellow-100 text-yellow-700",
  Paid: "bg-green-100 text-green-700",
  Cancelled: "bg-red-100 text-red-700",
};

export default function StatusBadge({ status }: { status: string }) {
  const color = statusColors[status] || "bg-gray-100 text-gray-600";
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${color}`}>
      {status}
    </span>
  );
}
