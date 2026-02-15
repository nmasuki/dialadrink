import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { AppUser } from "@/models";
import bcrypt from "bcryptjs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const user = await AppUser.findById(id).select("-password").lean();
    if (!user) {
      return NextResponse.json({ response: "error", message: "User not found" }, { status: 404 });
    }
    return NextResponse.json({ response: "success", data: JSON.parse(JSON.stringify(user)) });
  } catch (error) {
    console.error("Admin user GET error:", error);
    return NextResponse.json({ response: "error", message: "Failed to fetch user" }, { status: 500 });
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

    // Hash password if provided, otherwise remove it from update
    if (body.password && body.password.trim()) {
      const salt = await bcrypt.genSalt(10);
      body.password = await bcrypt.hash(body.password, salt);
    } else {
      delete body.password;
    }

    const user = await AppUser.findByIdAndUpdate(id, body, { new: true })
      .select("-password")
      .lean();
    if (!user) {
      return NextResponse.json({ response: "error", message: "User not found" }, { status: 404 });
    }
    return NextResponse.json({ response: "success", data: JSON.parse(JSON.stringify(user)) });
  } catch (error) {
    console.error("Admin user PUT error:", error);
    return NextResponse.json({ response: "error", message: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    await AppUser.findByIdAndDelete(id);
    return NextResponse.json({ response: "success" });
  } catch (error) {
    console.error("Admin user DELETE error:", error);
    return NextResponse.json({ response: "error", message: "Failed to delete user" }, { status: 500 });
  }
}
