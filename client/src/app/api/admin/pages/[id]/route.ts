import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Page } from "@/models";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const page = await Page.findById(id).lean();
    if (!page) {
      return NextResponse.json({ response: "error", message: "Page not found" }, { status: 404 });
    }
    return NextResponse.json({ response: "success", data: JSON.parse(JSON.stringify(page)) });
  } catch (error) {
    console.error("Admin page GET error:", error);
    return NextResponse.json({ response: "error", message: "Failed to fetch page" }, { status: 500 });
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
    const page = await Page.findByIdAndUpdate(id, body, { new: true }).lean();
    if (!page) {
      return NextResponse.json({ response: "error", message: "Page not found" }, { status: 404 });
    }
    return NextResponse.json({ response: "success", data: JSON.parse(JSON.stringify(page)) });
  } catch (error) {
    console.error("Admin page PUT error:", error);
    return NextResponse.json({ response: "error", message: "Failed to update page" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    await Page.findByIdAndDelete(id);
    return NextResponse.json({ response: "success" });
  } catch (error) {
    console.error("Admin page DELETE error:", error);
    return NextResponse.json({ response: "error", message: "Failed to delete page" }, { status: 500 });
  }
}
