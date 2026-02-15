import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { ProductCategory } from "@/models";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const category = await ProductCategory.findById(id).lean();
    if (!category) {
      return NextResponse.json({ response: "error", message: "Category not found" }, { status: 404 });
    }
    return NextResponse.json({ response: "success", data: JSON.parse(JSON.stringify(category)) });
  } catch (error) {
    console.error("Admin category GET error:", error);
    return NextResponse.json({ response: "error", message: "Failed to fetch category" }, { status: 500 });
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
    const category = await ProductCategory.findByIdAndUpdate(id, body, { new: true }).lean();
    if (!category) {
      return NextResponse.json({ response: "error", message: "Category not found" }, { status: 404 });
    }
    return NextResponse.json({ response: "success", data: JSON.parse(JSON.stringify(category)) });
  } catch (error) {
    console.error("Admin category PUT error:", error);
    return NextResponse.json({ response: "error", message: "Failed to update category" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    await ProductCategory.findByIdAndDelete(id);
    return NextResponse.json({ response: "success" });
  } catch (error) {
    console.error("Admin category DELETE error:", error);
    return NextResponse.json({ response: "error", message: "Failed to delete category" }, { status: 500 });
  }
}
