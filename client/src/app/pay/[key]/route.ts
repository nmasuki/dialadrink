import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;
  return NextResponse.redirect(
    new URL(`/checkout/payment?order=${key}`, _request.url)
  );
}
