import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { ProductSubCategory } from "@/models";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const subcategory = await ProductSubCategory.findById(id).populate("category", "name key").lean();
    if (!subcategory) {
      return NextResponse.json({ response: "error", message: "Subcategory not found" }, { status: 404 });
    }
    return NextResponse.json({ response: "success", data: JSON.parse(JSON.stringify(subcategory)) });
  } catch (error) {
    console.error("Admin subcategory GET error:", error);
    return NextResponse.json({ response: "error", message: "Failed to fetch subcategory" }, { status: 500 });
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
    const subcategory = await ProductSubCategory.findByIdAndUpdate(id, body, { new: true }).lean();
    if (!subcategory) {
      return NextResponse.json({ response: "error", message: "Subcategory not found" }, { status: 404 });
    }
    return NextResponse.json({ response: "success", data: JSON.parse(JSON.stringify(subcategory)) });
  } catch (error) {
    console.error("Admin subcategory PUT error:", error);
    return NextResponse.json({ response: "error", message: "Failed to update subcategory" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    await ProductSubCategory.findByIdAndDelete(id);
    return NextResponse.json({ response: "success" });
  } catch (error) {
    console.error("Admin subcategory DELETE error:", error);
    return NextResponse.json({ response: "error", message: "Failed to delete subcategory" }, { status: 500 });
  }
}
