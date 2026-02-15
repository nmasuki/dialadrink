import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { ProductBrand } from "@/models";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const brand = await ProductBrand.findById(id).lean();
    if (!brand) {
      return NextResponse.json({ response: "error", message: "Brand not found" }, { status: 404 });
    }
    return NextResponse.json({ response: "success", data: JSON.parse(JSON.stringify(brand)) });
  } catch (error) {
    console.error("Admin brand GET error:", error);
    return NextResponse.json({ response: "error", message: "Failed to fetch brand" }, { status: 500 });
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
    const brand = await ProductBrand.findByIdAndUpdate(id, body, { new: true }).lean();
    if (!brand) {
      return NextResponse.json({ response: "error", message: "Brand not found" }, { status: 404 });
    }
    return NextResponse.json({ response: "success", data: JSON.parse(JSON.stringify(brand)) });
  } catch (error) {
    console.error("Admin brand PUT error:", error);
    return NextResponse.json({ response: "error", message: "Failed to update brand" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    await ProductBrand.findByIdAndDelete(id);
    return NextResponse.json({ response: "success" });
  } catch (error) {
    console.error("Admin brand DELETE error:", error);
    return NextResponse.json({ response: "error", message: "Failed to delete brand" }, { status: 500 });
  }
}
