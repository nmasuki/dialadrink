import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Product } from "@/models";

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get a product by ID or slug
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product details
 *       404:
 *         description: Product not found
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    // Try to find by ID first, then by href (slug)
    let product = null;
    
    // Check if it looks like a MongoDB ObjectId
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(id)
        .populate("category", "name key description")
        .populate("brand", "name href description")
        .populate("priceOptions")
        .populate("size", "name")
        .populate("taste", "name")
        .populate("grape", "name")
        .lean();
    }
    
    // If not found by ID, try href (slug)
    if (!product) {
      product = await Product.findOne({ href: id, state: "published" })
        .populate("category", "name key description")
        .populate("brand", "name href description")
        .populate("priceOptions")
        .populate("size", "name")
        .populate("taste", "name")
        .populate("grape", "name")
        .lean();
    }

    if (!product) {
      return NextResponse.json(
        { response: "error", message: "Product not found" },
        { status: 404 }
      );
    }

    // Get related products
    const relatedProducts = await Product.find({
      _id: { $ne: product._id },
      state: "published",
      inStock: true,
      $or: [
        { category: product.category },
        { brand: product.brand },
      ],
    })
      .populate("category", "name key")
      .populate("brand", "name href")
      .populate("priceOptions")
      .limit(6)
      .lean();

    return NextResponse.json({
      response: "success",
      data: {
        ...product,
        relatedProducts,
      },
    });
  } catch (error) {
    console.error("Product Detail API Error:", error);
    return NextResponse.json(
      { response: "error", message: "Failed to fetch product" },
      { status: 500 }
    );
  }
}
