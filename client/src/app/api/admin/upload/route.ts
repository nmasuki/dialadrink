import { NextRequest, NextResponse } from "next/server";
import { uploadImage, deleteImage } from "@/lib/admin/cloudinary";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "products";

    if (!file) {
      return NextResponse.json(
        { response: "error", message: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { response: "error", message: "File size exceeds 5MB limit" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const result = await uploadImage(buffer, folder);

    return NextResponse.json({ response: "success", data: result });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { response: "error", message: "Upload failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { publicId } = await request.json();
    if (!publicId) {
      return NextResponse.json(
        { response: "error", message: "No publicId provided" },
        { status: 400 }
      );
    }

    await deleteImage(publicId);
    return NextResponse.json({ response: "success" });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { response: "error", message: "Delete failed" },
      { status: 500 }
    );
  }
}
