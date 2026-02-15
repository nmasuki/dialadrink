import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { ProductPriceOption, Product } from "@/models";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { productId, ...optionData } = body;

    const option = new ProductPriceOption({ ...optionData, product: productId });
    await option.save();

    // Add to product's priceOptions array
    if (productId) {
      await Product.findByIdAndUpdate(productId, {
        $addToSet: { priceOptions: option._id },
      });
    }

    return NextResponse.json({ response: "success", data: JSON.parse(JSON.stringify(option)) });
  } catch (error) {
    console.error("Price option POST error:", error);
    return NextResponse.json({ response: "error", message: "Failed to create price option" }, { status: 500 });
  }
}
