import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Location } from "@/models";

export async function GET() {
  try {
    await connectDB();

    const locations = await Location.find({ show: true })
      .select("name href city deliveryCharges")
      .sort({ name: 1 })
      .lean();

    return NextResponse.json({
      response: "success",
      data: locations,
      count: locations.length,
    });
  } catch (error) {
    console.error("Locations API Error:", error);
    return NextResponse.json(
      { response: "error", message: "Failed to fetch locations" },
      { status: 500 }
    );
  }
}
