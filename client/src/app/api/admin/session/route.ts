import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE_NAME = "admin_session";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true, token });
}
