import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Order } from "@/models";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const order = await Order.findById(id).lean();
    if (!order) {
      return NextResponse.json({ response: "error", message: "Order not found" }, { status: 404 });
    }
    return NextResponse.json({ response: "success", data: JSON.parse(JSON.stringify(order)) });
  } catch (error) {
    console.error("Admin order GET error:", error);
    return NextResponse.json({ response: "error", message: "Failed to fetch order" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();

    // Only allow state changes
    const update: Record<string, unknown> = { modifiedDate: new Date() };
    if (body.state) update.state = body.state;
    if (body.payment) update.payment = body.payment;

    const order = await Order.findByIdAndUpdate(id, update, { new: true }).lean();
    if (!order) {
      return NextResponse.json({ response: "error", message: "Order not found" }, { status: 404 });
    }
    return NextResponse.json({ response: "success", data: JSON.parse(JSON.stringify(order)) });
  } catch (error) {
    console.error("Admin order PUT error:", error);
    return NextResponse.json({ response: "error", message: "Failed to update order" }, { status: 500 });
  }
}
