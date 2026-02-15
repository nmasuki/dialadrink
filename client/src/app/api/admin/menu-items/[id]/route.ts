import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { MenuItem } from "@/models";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const menuItem = await MenuItem.findById(id).lean();
    if (!menuItem) {
      return NextResponse.json({ response: "error", message: "Menu item not found" }, { status: 404 });
    }
    return NextResponse.json({ response: "success", data: JSON.parse(JSON.stringify(menuItem)) });
  } catch (error) {
    console.error("Admin menu-item GET error:", error);
    return NextResponse.json({ response: "error", message: "Failed to fetch menu item" }, { status: 500 });
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
    const menuItem = await MenuItem.findByIdAndUpdate(id, body, { new: true }).lean();
    if (!menuItem) {
      return NextResponse.json({ response: "error", message: "Menu item not found" }, { status: 404 });
    }
    return NextResponse.json({ response: "success", data: JSON.parse(JSON.stringify(menuItem)) });
  } catch (error) {
    console.error("Admin menu-item PUT error:", error);
    return NextResponse.json({ response: "error", message: "Failed to update menu item" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    await MenuItem.findByIdAndDelete(id);
    return NextResponse.json({ response: "success" });
  } catch (error) {
    console.error("Admin menu-item DELETE error:", error);
    return NextResponse.json({ response: "error", message: "Failed to delete menu item" }, { status: 500 });
  }
}
