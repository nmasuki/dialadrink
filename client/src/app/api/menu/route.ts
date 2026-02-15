import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import MenuItem from "@/models/MenuItem";

export async function GET() {
  try {
    await connectDB();

    // Get top-level menu items with populated submenus
    const menuItems = await MenuItem.find({ 
      type: "top", 
      show: true,
      level: 1
    })
      .populate({
        path: "submenus",
        match: { show: true },
        options: { sort: { index: 1 } }
      })
      .sort({ index: 1 })
      .lean();

    // Filter out duplicates by label (keep first occurrence)
    const seen = new Set<string>();
    const uniqueMenus = menuItems.filter(item => {
      const label = item.label?.toLowerCase();
      if (seen.has(label)) return false;
      seen.add(label);
      return true;
    });

    return NextResponse.json({
      response: "success",
      data: uniqueMenus,
    });
  } catch (error) {
    console.error("Menu API Error:", error);
    return NextResponse.json(
      { response: "error", message: "Failed to fetch menu" },
      { status: 500 }
    );
  }
}
