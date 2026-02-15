"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FiArrowLeft, FiSave } from "react-icons/fi";
import StatusBadge from "@/components/admin/StatusBadge";
import axios from "axios";
import toast from "react-hot-toast";

interface OrderItem {
  name: string;
  quantity: string;
  pieces: number;
  price: number;
  currency: string;
}

interface OrderData {
  _id: string;
  key: string;
  orderNumber: number;
  delivery: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    email?: string;
    address: string;
    building?: string;
    houseNumber?: string;
    location?: string;
  };
  items: OrderItem[];
  state: string;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  paymentMethod: string;
  payment: { state: string; transactionId?: string; referenceId?: string; method?: string };
  notes?: string;
  orderDate: string;
}

const states = ["placed", "paid", "confirmed", "preparing", "dispatched", "delivered", "cancelled"];

const formatPrice = (n: number) =>
  new Intl.NumberFormat("en-KE", { minimumFractionDigits: 0 }).format(n);

export default function OrderDetail({ order }: { order: OrderData }) {
  const router = useRouter();
  const [state, setState] = useState(order.state);
  const [saving, setSaving] = useState(false);

  const handleUpdateState = async () => {
    setSaving(true);
    try {
      await axios.put(`/api/admin/orders/${order._id}`, { state });
      toast.success("Order status updated");
      router.refresh();
    } catch {
      toast.error("Failed to update order");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/orders" className="text-sm text-gray-500 hover:text-teal flex items-center gap-1">
          <FiArrowLeft className="w-4 h-4" /> Back to Orders
        </Link>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Order #{order.orderNumber}</h1>
        <StatusBadge status={order.state} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Items</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2 font-medium">Item</th>
                  <th className="pb-2 font-medium">Qty</th>
                  <th className="pb-2 font-medium text-right">Price</th>
                  <th className="pb-2 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {order.items.map((item, i) => (
                  <tr key={i}>
                    <td className="py-2">
                      <p className="font-medium">{item.name}</p>
                      {item.quantity && <p className="text-xs text-gray-500">{item.quantity}</p>}
                    </td>
                    <td className="py-2">{item.pieces}</td>
                    <td className="py-2 text-right">KES {formatPrice(item.price)}</td>
                    <td className="py-2 text-right font-medium">KES {formatPrice(item.price * item.pieces)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="border-t mt-4 pt-4 space-y-1 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>KES {formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery Fee</span>
                <span>KES {formatPrice(order.deliveryFee)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-KES {formatPrice(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total</span>
                <span className="text-primary">KES {formatPrice(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h2 className="text-lg font-bold text-gray-800 mb-2">Notes</h2>
              <p className="text-sm text-gray-600">{order.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status update */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Update Status</h2>
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-3"
            >
              {states.map((s) => (
                <option key={s} value={s} className="capitalize">
                  {s}
                </option>
              ))}
            </select>
            {state !== order.state && (
              <button
                onClick={handleUpdateState}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 bg-teal text-white py-2 rounded-lg text-sm font-medium hover:bg-teal/90 disabled:opacity-50"
              >
                <FiSave className="w-4 h-4" />
                {saving ? "Saving..." : "Update Status"}
              </button>
            )}
          </div>

          {/* Customer info */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h2 className="text-lg font-bold text-gray-800 mb-3">Customer</h2>
            <div className="space-y-2 text-sm">
              <p className="font-medium">{order.delivery.firstName} {order.delivery.lastName}</p>
              <p className="text-gray-600">{order.delivery.phoneNumber}</p>
              {order.delivery.email && <p className="text-gray-600">{order.delivery.email}</p>}
              <p className="text-gray-600">{order.delivery.address}</p>
              {order.delivery.building && <p className="text-gray-500">{order.delivery.building}</p>}
              {order.delivery.location && <p className="text-gray-500">{order.delivery.location}</p>}
            </div>
          </div>

          {/* Payment info */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h2 className="text-lg font-bold text-gray-800 mb-3">Payment</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Method</span>
                <span className="capitalize font-medium">{order.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <StatusBadge status={order.payment?.state || "Pending"} />
              </div>
              {order.payment?.transactionId && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Transaction ID</span>
                  <span className="font-mono text-xs">{order.payment.transactionId}</span>
                </div>
              )}
            </div>
          </div>

          {/* Meta */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Order Key</span>
                <span className="font-mono text-xs">{order.key}</span>
              </div>
              <div className="flex justify-between">
                <span>Date</span>
                <span>{new Date(order.orderDate).toLocaleString("en-KE")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
