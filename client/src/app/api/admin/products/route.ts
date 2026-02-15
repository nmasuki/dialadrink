import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Product } from "@/models";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = 20;
    const q = searchParams.get("q") || "";
    const sort = searchParams.get("sort") || "name";
    const order = searchParams.get("order") === "desc" ? -1 : 1;
    const state = searchParams.get("state") || "";
    const category = searchParams.get("category") || "";
    const brand = searchParams.get("brand") || "";

    const query: Record<string, unknown> = {};
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: "i" } },
        { tags: { $regex: q, $options: "i" } },
      ];
    }
    if (state) query.state = state;
    if (category) query.category = category;
    if (brand) query.brand = brand;

    const [data, count] = await Promise.all([
      Product.find(query)
        .populate("category", "name key")
        .populate("brand", "name href")
        .populate("priceOptions")
        .sort({ [sort]: order })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      Product.countDocuments(query),
    ]);

    return NextResponse.json({
      response: "success",
      data: JSON.parse(JSON.stringify(data)),
      count,
      page,
      totalPages: Math.ceil(count / pageSize),
    });
  } catch (error) {
    console.error("Admin products GET error:", error);
    return NextResponse.json({ response: "error", message: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    body.modifiedDate = new Date();
    if (!body.publishedDate) body.publishedDate = new Date();
    const product = new Product(body);
    await product.save();
    return NextResponse.json({ response: "success", data: JSON.parse(JSON.stringify(product)) });
  } catch (error) {
    console.error("Admin products POST error:", error);
    return NextResponse.json({ response: "error", message: "Failed to create product" }, { status: 500 });
  }
}
