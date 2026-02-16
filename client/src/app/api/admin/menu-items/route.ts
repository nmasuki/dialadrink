import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { MenuItem } from "@/models";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = 20;
    const q = searchParams.get("q") || "";
    const sort = searchParams.get("sort") || "index";
    const order = searchParams.get("order") === "desc" ? -1 : 1;

    const query: Record<string, unknown> = {};
    if (q) {
      query.label = { $regex: q, $options: "i" };
    }

    const [data, count] = await Promise.all([
      MenuItem.find(query)
        .sort({ [sort]: order })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      MenuItem.countDocuments(query),
    ]);

    return NextResponse.json({
      response: "success",
      data: JSON.parse(JSON.stringify(data)),
      count,
      page,
      totalPages: Math.ceil(count / pageSize),
    });
  } catch (error) {
    console.error("Admin menu-items GET error:", error);
    return NextResponse.json({ response: "error", message: "Failed to fetch menu items" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await connectDB();
    const { items } = await request.json();
    if (!Array.isArray(items)) {
      return NextResponse.json({ response: "error", message: "items array required" }, { status: 400 });
    }
    const ops = items.map((item: { _id: string; index: number }) =>
      MenuItem.findByIdAndUpdate(item._id, { index: item.index })
    );
    await Promise.all(ops);
    return NextResponse.json({ response: "success" });
  } catch (error) {
    console.error("Admin menu-items PATCH error:", error);
    return NextResponse.json({ response: "error", message: "Failed to reorder menu items" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const menuItem = new MenuItem(body);
    await menuItem.save();
    return NextResponse.json({ response: "success", data: JSON.parse(JSON.stringify(menuItem)) });
  } catch (error) {
    console.error("Admin menu-items POST error:", error);
    return NextResponse.json({ response: "error", message: "Failed to create menu item" }, { status: 500 });
  }
}
