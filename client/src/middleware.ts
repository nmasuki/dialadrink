import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE_NAME = "admin_session";

function getSecret() {
  return new TextEncoder().encode(process.env.ADMIN_JWT_SECRET || "fallback-dev-secret-change-me");
}

async function verifyAuth(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, getSecret());
    return true;
  } catch {
    return false;
  }
}

function withPathHeader(request: NextRequest, response?: NextResponse): NextResponse {
  const res = response || NextResponse.next();
  res.headers.set("x-next-url", request.nextUrl.pathname);
  return res;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow login page always
  if (pathname === "/admin/login") {
    const isAuth = await verifyAuth(request);
    if (isAuth) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return withPathHeader(request);
  }

  // Protect /admin/* pages
  if (pathname.startsWith("/admin")) {
    const isAuth = await verifyAuth(request);
    if (!isAuth) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return withPathHeader(request);
  }

  // Protect /api/admin/* routes
  if (pathname.startsWith("/api/admin")) {
    const isAuth = await verifyAuth(request);
    if (!isAuth) {
      return NextResponse.json({ response: "error", message: "Unauthorized" }, { status: 401 });
    }
    return withPathHeader(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
