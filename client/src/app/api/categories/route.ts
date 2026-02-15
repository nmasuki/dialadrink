import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Category } from "@/models";

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Get all product categories
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: List of categories
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const categories = await Category.find({})
      .sort({ name: 1 })
      .lean();

    return NextResponse.json({
      response: "success",
      data: categories,
      count: categories.length,
    });
  } catch (error) {
    console.error("Categories API Error:", error);
    return NextResponse.json(
      { response: "error", message: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}
