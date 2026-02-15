import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Order } from "@/models";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = 20;
    const q = searchParams.get("q") || "";
    const state = searchParams.get("state") || "";
    const sort = searchParams.get("sort") || "orderDate";
    const order = searchParams.get("order") === "asc" ? 1 : -1;

    const query: Record<string, unknown> = {};
    if (q) {
      const numQ = parseInt(q);
      if (!isNaN(numQ)) {
        query.$or = [
          { orderNumber: numQ },
          { "delivery.phoneNumber": { $regex: q, $options: "i" } },
          { "delivery.firstName": { $regex: q, $options: "i" } },
          { "delivery.lastName": { $regex: q, $options: "i" } },
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

    const [data, count] = await Promise.all([
      Order.find(query)
        .sort({ [sort]: order })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      Order.countDocuments(query),
    ]);

    return NextResponse.json({
      response: "success",
      data: JSON.parse(JSON.stringify(data)),
      count,
      page,
      totalPages: Math.ceil(count / pageSize),
    });
  } catch (error) {
    console.error("Admin orders GET error:", error);
    return NextResponse.json({ response: "error", message: "Failed to fetch orders" }, { status: 500 });
  }
}
