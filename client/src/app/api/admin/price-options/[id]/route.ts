import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { ProductPriceOption, Product } from "@/models";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const option = await ProductPriceOption.findByIdAndUpdate(id, body, { new: true }).lean();
    if (!option) {
      return NextResponse.json({ response: "error", message: "Price option not found" }, { status: 404 });
    }
    return NextResponse.json({ response: "success", data: JSON.parse(JSON.stringify(option)) });
  } catch (error) {
    console.error("Price option PUT error:", error);
    return NextResponse.json({ response: "error", message: "Failed to update price option" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const option = await ProductPriceOption.findById(id);
    if (!option) {
      return NextResponse.json({ response: "error", message: "Price option not found" }, { status: 404 });
    }

    // Remove from product's priceOptions array
    if (option.product) {
      await Product.findByIdAndUpdate(option.product, {
        $pull: { priceOptions: option._id },
      });
    }

    await ProductPriceOption.findByIdAndDelete(id);
    return NextResponse.json({ response: "success" });
  } catch (error) {
    console.error("Price option DELETE error:", error);
    return NextResponse.json({ response: "error", message: "Failed to delete price option" }, { status: 500 });
  }
}
