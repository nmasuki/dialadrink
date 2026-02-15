import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Order } from "@/models";
import mongoose from "mongoose";
import { notifyOrderPlaced } from "@/lib/notifications";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { delivery, items, subtotal, deliveryFee, discount, total, paymentMethod, notes } = body;

    // Validate required fields
    if (!delivery?.firstName || !delivery?.lastName || !delivery?.phoneNumber || !delivery?.address) {
      return NextResponse.json(
        { response: "error", message: "Missing required delivery information" },
        { status: 400 }
      );
    }

    if (!items || items.length === 0) {
      return NextResponse.json(
        { response: "error", message: "Cart is empty" },
        { status: 400 }
      );
    }

    // Generate order number
    const lastOrder = await Order.findOne().sort({ orderNumber: -1 });
    const orderNumber = lastOrder ? lastOrder.orderNumber + 1 : 100001;
    const random = Math.floor(Math.random() * 900) + 100;
    const key = `${orderNumber}-${random}`;

    // Process items - handle both ObjectId and string product references
    const processedItems = items.map((item: {
      product: { _id?: string; name?: string } | string;
      quantity: string;
      pieces: number;
      price: number;
      currency: string
    }) => {
      const productId = typeof item.product === 'object' ? item.product._id : item.product;
      const productName = typeof item.product === 'object' ? item.product.name : 'Product';

      // Only include product field if it's a valid ObjectId
      const isValidObjectId = productId && mongoose.Types.ObjectId.isValid(productId);

      return {
        ...(isValidObjectId ? { product: productId } : {}),
        name: productName || 'Product',
        quantity: item.quantity || '',
        pieces: item.pieces || 1,
        price: item.price || 0,
        currency: item.currency || 'KES',
      };
    });

    // Create order
    const order = new Order({
      key,
      orderNumber,
      delivery: {
        firstName: delivery.firstName,
        lastName: delivery.lastName,
        phoneNumber: delivery.phoneNumber,
        email: delivery.email || '',
        address: delivery.address,
        building: delivery.building || '',
        houseNumber: delivery.houseNumber || '',
        location: delivery.location || '',
      },
      items: processedItems,
      subtotal: subtotal || 0,
      deliveryFee: deliveryFee || 0,
      discount: discount || 0,
      total: total || 0,
      paymentMethod: paymentMethod || 'cash',
      notes: notes || '',
      state: 'placed',
      payment: { state: 'Pending' },
      orderDate: new Date(),
    });

    await order.save();

    console.log('Order created successfully:', { key, orderNumber, total });

    // Send notifications (fire-and-forget — don't block the response)
    notifyOrderPlaced({
      orderNumber,
      key,
      total: total || 0,
      subtotal: subtotal || 0,
      deliveryFee: deliveryFee || 0,
      paymentMethod: paymentMethod || 'cash',
      delivery: {
        firstName: delivery.firstName,
        lastName: delivery.lastName,
        phoneNumber: delivery.phoneNumber,
        email: delivery.email || '',
        address: delivery.address,
        location: delivery.location || '',
      },
      items: processedItems,
    }).catch((err) => console.error("Notification error:", err));

    return NextResponse.json({
      response: "success",
      message: "Order placed successfully",
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        key: order.key,
        total: order.total,
      },
    });
  } catch (error) {
    console.error("Create Order Error:", error);
    return NextResponse.json(
      { response: "error", message: "Failed to create order. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const orderKey = searchParams.get("key");
    const phone = searchParams.get("phone");

    if (orderKey) {
      // Get single order by key
      const order = await Order.findOne({ key: orderKey }).lean();
      if (!order) {
        return NextResponse.json(
          { response: "error", message: "Order not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ response: "success", data: order });
    }

    if (phone) {
      // Get orders by phone number
      const orders = await Order.find({ "delivery.phoneNumber": phone })
        .sort({ orderDate: -1 })
        .limit(10)
        .lean();
      return NextResponse.json({ response: "success", data: orders, count: orders.length });
    }

    const today = searchParams.get("today");
    if (today === "true") {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const orders = await Order.find({ orderDate: { $gte: startOfDay } })
        .sort({ orderDate: -1 })
        .lean();
      return NextResponse.json({ response: "success", data: JSON.parse(JSON.stringify(orders)), count: orders.length });
    }

    return NextResponse.json(
      { response: "error", message: "Please provide order key or phone number" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Get Orders Error:", error);
    return NextResponse.json(
      { response: "error", message: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
