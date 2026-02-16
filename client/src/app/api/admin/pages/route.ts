import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Page } from "@/models";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = 20;
    const q = searchParams.get("q") || "";
    const sort = searchParams.get("sort") || "name";
    const order = searchParams.get("order") === "desc" ? -1 : 1;

    const query: Record<string, unknown> = {};
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: "i" } },
        { title: { $regex: q, $options: "i" } },
        { href: { $regex: q, $options: "i" } },
      ];
    }

    const [data, count] = await Promise.all([
      Page.find(query)
        .sort({ [sort]: order })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      Page.countDocuments(query),
    ]);

    return NextResponse.json({
      response: "success",
      data: JSON.parse(JSON.stringify(data)),
      count,
      page,
      totalPages: Math.ceil(count / pageSize),
    });
  } catch (error) {
    console.error("Admin pages GET error:", error);
    return NextResponse.json({ response: "error", message: "Failed to fetch pages" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const doc = new Page(body);
    await doc.save();
    return NextResponse.json({ response: "success", data: JSON.parse(JSON.stringify(doc)) });
  } catch (error) {
    console.error("Admin pages POST error:", error);
    return NextResponse.json({ response: "error", message: "Failed to create page" }, { status: 500 });
  }
}
