import { connectDB } from "@/lib/db";
import { Order } from "@/models";
import { notFound } from "next/navigation";
import OrderDetail from "./OrderDetail";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await connectDB();
  const order = await Order.findById(id).lean();
  if (!order) notFound();

  return <OrderDetail order={JSON.parse(JSON.stringify(order))} />;
}
