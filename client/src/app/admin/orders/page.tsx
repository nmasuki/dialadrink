import { connectDB } from "@/lib/db";
import { Order } from "@/models";
import OrdersList from "./OrdersList";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ page?: string; q?: string; sort?: string; order?: string; state?: string }>;
}

export default async function OrdersPage({ searchParams }: Props) {
  const params = await searchParams;
  await connectDB();

  const page = parseInt(params.page || "1");
  const pageSize = 20;
  const q = params.q || "";
  const sort = params.sort || "orderDate";
  const sortOrder = params.order === "asc" ? 1 : -1;
  const state = params.state || "";

  const query: Record<string, unknown> = {};
  if (q) {
    const numQ = parseInt(q);
    if (!isNaN(numQ)) {
      query.$or = [
        { orderNumber: numQ },
        { "delivery.phoneNumber": { $regex: q, $options: "i" } },
        { "delivery.firstName": { $regex: q, $options: "i" } },
      ];
    } else {
      query.$or = [
        { "delivery.phoneNumber": { $regex: q, $options: "i" } },
        { "delivery.firstName": { $regex: q, $options: "i" } },
        { "delivery.lastName": { $regex: q, $options: "i" } },
        { key: { $regex: q, $options: "i" } },
      ];
    }
  }
  if (state) query.state = state;

  const [orders, count] = await Promise.all([
    Order.find(query)
      .sort({ [sort]: sortOrder })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    Order.countDocuments(query),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Orders</h1>
      </div>

      <OrdersList
        orders={JSON.parse(JSON.stringify(orders))}
        totalCount={count}
        page={page}
        pageSize={pageSize}
      />
    </div>
  );
}
