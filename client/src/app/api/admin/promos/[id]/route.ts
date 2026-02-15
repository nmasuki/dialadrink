import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Promo } from "@/models";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const promo = await Promo.findById(id).lean();
    if (!promo) {
      return NextResponse.json({ response: "error", message: "Promo not found" }, { status: 404 });
    }
    return NextResponse.json({ response: "success", data: JSON.parse(JSON.stringify(promo)) });
  } catch (error) {
    console.error("Admin promo GET error:", error);
    return NextResponse.json({ response: "error", message: "Failed to fetch promo" }, { status: 500 });
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
    const promo = await Promo.findByIdAndUpdate(id, body, { new: true }).lean();
    if (!promo) {
      return NextResponse.json({ response: "error", message: "Promo not found" }, { status: 404 });
    }
    return NextResponse.json({ response: "success", data: JSON.parse(JSON.stringify(promo)) });
  } catch (error) {
    console.error("Admin promo PUT error:", error);
    return NextResponse.json({ response: "error", message: "Failed to update promo" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    await Promo.findByIdAndDelete(id);
    return NextResponse.json({ response: "success" });
  } catch (error) {
    console.error("Admin promo DELETE error:", error);
    return NextResponse.json({ response: "error", message: "Failed to delete promo" }, { status: 500 });
  }
}
