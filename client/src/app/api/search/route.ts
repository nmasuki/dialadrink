import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Product, Brand } from "@/models";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim();

    if (!query || query.length < 2) {
      return NextResponse.json({
        response: "success",
        data: { products: [], brands: [] },
      });
    }

    await connectDB();

    const searchRegex = new RegExp(query, "i");

    // Search products - limit to 6
    const products = await Product.find({
      state: "published",
      inStock: true,
      $or: [
        { name: searchRegex },
        { description: searchRegex },
      ],
    })
      .select("_id name href image priceOptions")
      .populate("priceOptions", "price offerPrice")
      .sort({ popularity: -1 })
      .limit(6)
      .lean();

    // Search brands - limit to 3
    const brands = await Brand.find({
      name: searchRegex,
    })
      .select("_id name href image")
      .limit(3)
      .lean();

    // Format products with price
    const formattedProducts = products.map((p: any) => {
      const priceOption = p.priceOptions?.[0];
      const price = priceOption?.offerPrice || priceOption?.price || 0;
      return {
        _id: p._id,
        name: p.name,
        href: p.href,
        image: p.image?.secure_url,
        price,
      };
    });

    // Format brands
    const formattedBrands = brands.map((b: any) => ({
      _id: b._id,
      name: b.name,
      href: b.href,
      image: b.image?.secure_url,
    }));

    return NextResponse.json({
      response: "success",
      data: {
        products: formattedProducts,
        brands: formattedBrands,
      },
    });
  } catch (error) {
    console.error("Search API Error:", error);
    return NextResponse.json(
      { response: "error", message: "Search failed" },
      { status: 500 }
    );
  }
}
