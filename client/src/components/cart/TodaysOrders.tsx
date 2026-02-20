"use client";

import { useEffect, useState } from "react";
import { FiPackage, FiClock, FiCheckCircle, FiTruck, FiXCircle } from "react-icons/fi";
import axios from "axios";

interface OrderItem {
  name: string;
  quantity: string;
  pieces: number;
  price: number;
  currency: string;
}

interface Order {
  _id: string;
  key: string;
  orderNumber: number;
  delivery: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    address: string;
  };
  items: OrderItem[];
  state: string;
  total: number;
  paymentMethod: string;
  payment: { state: string };
  orderDate: string;
}

const stateConfig: Record<string, { label: string; color: string; icon: typeof FiClock }> = {
  placed: { label: "Placed", color: "bg-blue-100 text-blue-700", icon: FiClock },
  paid: { label: "Paid", color: "bg-green-100 text-green-700", icon: FiCheckCircle },
  confirmed: { label: "Confirmed", color: "bg-teal/10 text-teal", icon: FiCheckCircle },
  preparing: { label: "Preparing", color: "bg-yellow-100 text-yellow-700", icon: FiPackage },
  dispatched: { label: "Dispatched", color: "bg-purple-100 text-purple-700", icon: FiTruck },
  delivered: { label: "Delivered", color: "bg-green-100 text-green-700", icon: FiCheckCircle },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700", icon: FiXCircle },
};

export default function TodaysOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const phone = localStorage.getItem("diala-customer-phone");
    if (!phone) {
      setLoading(false);
      return;
    }

    axios
      .get(`/api/orders?today=true&phone=${encodeURIComponent(phone)}`)
      .then((res) => {
        if (res.data.response === "success") {
          setOrders(res.data.data);
        }
      })
      .catch((err) => console.error("Error fetching today's orders:", err))
      .finally(() => setLoading(false));
  }, []);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(price);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" });
  };

  if (loading) {
    return (
      <div className="mt-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Today&apos;s Orders</h2>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
              <div className="bg-gray-200 h-5 w-1/3 rounded mb-3"></div>
              <div className="bg-gray-200 h-4 w-2/3 rounded mb-2"></div>
              <div className="bg-gray-200 h-4 w-1/2 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (orders.length === 0) return null;

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Today&apos;s Orders</h2>
      <div className="space-y-3">
        {orders.map((order) => {
          const config = stateConfig[order.state] || stateConfig.placed;
          const StateIcon = config.icon;

          return (
            <div key={order._id} className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-800">#{order.orderNumber}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${config.color}`}>
                    <StateIcon className="w-3 h-3" />
                    {config.label}
                  </span>
                </div>
                <span className="text-sm text-gray-500">{formatTime(order.orderDate)}</span>
              </div>

              <div className="text-sm text-gray-600 mb-2">
                {order.items.map((item, idx) => (
                  <span key={idx}>
                    {item.pieces}x {item.name}
                    {idx < order.items.length - 1 ? ", " : ""}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">
                  {order.delivery.firstName} {order.delivery.lastName} &middot; {order.delivery.address}
                </span>
                <span className="font-bold text-primary">{formatPrice(order.total)}</span>
              </div>

              {order.payment.state !== "Paid" && order.state !== "cancelled" && (
                <p className="text-xs text-gray-400 mt-1">
                  Payment: {order.payment.state} &middot; {order.paymentMethod}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
