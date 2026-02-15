import { connectDB } from "@/lib/db";
import { Product, Order } from "@/models";
import Link from "next/link";
import { FiPackage, FiShoppingBag, FiDollarSign, FiTrendingUp } from "react-icons/fi";

export const dynamic = "force-dynamic";

async function getDashboardData() {
  await connectDB();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [
    totalProducts,
    publishedProducts,
    draftProducts,
    todaysOrders,
    todaysRevenue,
    recentOrders,
  ] = await Promise.all([
    Product.countDocuments(),
    Product.countDocuments({ state: "published" }),
    Product.countDocuments({ state: "draft" }),
    Order.countDocuments({ orderDate: { $gte: startOfDay } }),
    Order.aggregate([
      { $match: { orderDate: { $gte: startOfDay }, state: { $ne: "cancelled" } } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]),
    Order.find()
      .sort({ orderDate: -1 })
      .limit(5)
      .lean(),
  ]);

  return {
    totalProducts,
    publishedProducts,
    draftProducts,
    todaysOrders,
    todaysRevenue: todaysRevenue[0]?.total || 0,
    recentOrders: JSON.parse(JSON.stringify(recentOrders)),
  };
}

export default async function AdminDashboard() {
  const data = await getDashboardData();

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-KE", { minimumFractionDigits: 0 }).format(price);

  const formatTime = (date: string) =>
    new Date(date).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" });

  const stats = [
    { label: "Total Products", value: data.totalProducts, icon: FiPackage, color: "bg-blue-500", href: "/admin/products" },
    { label: "Published", value: data.publishedProducts, icon: FiTrendingUp, color: "bg-green-500", href: "/admin/products?state=published" },
    { label: "Today's Orders", value: data.todaysOrders, icon: FiShoppingBag, color: "bg-purple-500", href: "/admin/orders" },
    { label: "Today's Revenue", value: `KES ${formatPrice(data.todaysRevenue)}`, icon: FiDollarSign, color: "bg-teal", href: "/admin/orders" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} href={stat.href} className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className={`${stat.color} p-3 rounded-lg text-white`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-xl font-bold text-gray-800">{stat.value}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">Recent Orders</h2>
          <Link href="/admin/orders" className="text-sm text-teal hover:underline">View All</Link>
        </div>

        {data.recentOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-3 font-medium">Order #</th>
                  <th className="pb-3 font-medium">Customer</th>
                  <th className="pb-3 font-medium">Total</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.recentOrders.map((order: Record<string, unknown>) => (
                  <tr key={String(order._id)} className="hover:bg-gray-50">
                    <td className="py-3 font-medium">#{String(order.orderNumber)}</td>
                    <td className="py-3">
                      {(order.delivery as Record<string, string>)?.firstName || ""}{" "}
                      {(order.delivery as Record<string, string>)?.lastName || ""}
                    </td>
                    <td className="py-3 font-medium">KES {formatPrice(Number(order.total) || 0)}</td>
                    <td className="py-3">
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                        {String(order.state)}
                      </span>
                    </td>
                    <td className="py-3 text-gray-500">{formatTime(String(order.orderDate))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No orders yet</p>
        )}
      </div>
    </div>
  );
}
