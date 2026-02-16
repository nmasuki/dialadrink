import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Promo } from "@/models";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const { code } = await request.json();

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { response: "error", message: "Promo code is required" },
        { status: 400 }
      );
    }

    const promo = await Promo.findOne({
      code: { $regex: `^${code.trim()}$`, $options: "i" },
    }).lean();

    if (!promo) {
      return NextResponse.json(
        { response: "error", message: "Invalid promo code" },
        { status: 404 }
      );
    }

    // Check date validity
    const now = new Date();
    if (promo.startDate && new Date(promo.startDate) > now) {
      return NextResponse.json(
        { response: "error", message: "This promo code is not yet active" },
        { status: 400 }
      );
    }
    if (promo.endDate && new Date(promo.endDate) < now) {
      return NextResponse.json(
        { response: "error", message: "This promo code has expired" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      response: "success",
      data: {
        _id: promo._id,
        name: promo.name,
        code: promo.code,
        discount: promo.discount,
        discountType: promo.discountType,
      },
    });
  } catch (error) {
    console.error("Promo validation error:", error);
    return NextResponse.json(
      { response: "error", message: "Failed to validate promo code" },
      { status: 500 }
    );
  }
}
