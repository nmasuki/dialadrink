import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { AppUser } from "@/models";
import bcrypt from "bcryptjs";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = 20;
    const q = searchParams.get("q") || "";
    const sort = searchParams.get("sort") || "name.first";
    const order = searchParams.get("order") === "desc" ? -1 : 1;

    const query: Record<string, unknown> = {};
    if (q) {
      query.$or = [
        { "name.first": { $regex: q, $options: "i" } },
        { "name.last": { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
      ];
    }

    const [data, count] = await Promise.all([
      AppUser.find(query)
        .select("-password")
        .sort({ [sort]: order })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      AppUser.countDocuments(query),
    ]);

    return NextResponse.json({
      response: "success",
      data: JSON.parse(JSON.stringify(data)),
      count,
      page,
      totalPages: Math.ceil(count / pageSize),
    });
  } catch (error) {
    console.error("Admin users GET error:", error);
    return NextResponse.json({ response: "error", message: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();

    if (!body.password) {
      return NextResponse.json({ response: "error", message: "Password is required" }, { status: 400 });
    }

    const salt = await bcrypt.genSalt(10);
    body.password = await bcrypt.hash(body.password, salt);

    const user = new AppUser(body);
    await user.save();

    const { password: _, ...userObj } = user.toObject();

    return NextResponse.json({ response: "success", data: JSON.parse(JSON.stringify(userObj)) });
  } catch (error: unknown) {
    console.error("Admin users POST error:", error);
    const message = error instanceof Error && "code" in error && (error as { code: number }).code === 11000
      ? "A user with this email already exists"
      : "Failed to create user";
    return NextResponse.json({ response: "error", message }, { status: 500 });
  }
}
