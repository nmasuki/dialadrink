import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Location } from "@/models";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const location = await Location.findById(id).lean();
    if (!location) return NextResponse.json({ response: "error", message: "Location not found" }, { status: 404 });
    return NextResponse.json({ response: "success", data: JSON.parse(JSON.stringify(location)) });
  } catch (error) {
    console.error("Admin location GET error:", error);
    return NextResponse.json({ response: "error", message: "Failed to fetch location" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const location = await Location.findByIdAndUpdate(id, body, { new: true }).lean();
    if (!location) return NextResponse.json({ response: "error", message: "Location not found" }, { status: 404 });
    return NextResponse.json({ response: "success", data: JSON.parse(JSON.stringify(location)) });
  } catch (error) {
    console.error("Admin location PUT error:", error);
    return NextResponse.json({ response: "error", message: "Failed to update location" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    await Location.findByIdAndDelete(id);
    return NextResponse.json({ response: "success" });
  } catch (error) {
    console.error("Admin location DELETE error:", error);
    return NextResponse.json({ response: "error", message: "Failed to delete location" }, { status: 500 });
  }
}
