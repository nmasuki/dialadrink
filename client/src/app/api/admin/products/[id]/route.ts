import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Product } from "@/models";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const product = await Product.findById(id)
      .populate("category", "name key")
      .populate("subCategory", "name key")
      .populate("brand", "name href")
      .populate("priceOptions")
      .lean();
    if (!product) {
      return NextResponse.json({ response: "error", message: "Product not found" }, { status: 404 });
    }
    return NextResponse.json({ response: "success", data: JSON.parse(JSON.stringify(product)) });
  } catch (error) {
    console.error("Admin product GET error:", error);
    return NextResponse.json({ response: "error", message: "Failed to fetch product" }, { status: 500 });
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
    body.modifiedDate = new Date();
    const product = await Product.findByIdAndUpdate(id, body, { new: true })
      .populate("category", "name key")
      .populate("brand", "name href")
      .populate("priceOptions")
      .lean();
    if (!product) {
      return NextResponse.json({ response: "error", message: "Product not found" }, { status: 404 });
    }
    return NextResponse.json({ response: "success", data: JSON.parse(JSON.stringify(product)) });
  } catch (error) {
    console.error("Admin product PUT error:", error);
    return NextResponse.json({ response: "error", message: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    await Product.findByIdAndDelete(id);
    return NextResponse.json({ response: "success" });
  } catch (error) {
    console.error("Admin product DELETE error:", error);
    return NextResponse.json({ response: "error", message: "Failed to delete product" }, { status: 500 });
  }
}
