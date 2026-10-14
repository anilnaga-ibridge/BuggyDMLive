import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE_NAME =
  process.env.NODE_ENV === "production"
    ? "__Host-buggydm_session"
    : "buggydm_session";

function hasOptimisticSession(request: NextRequest): boolean {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  return typeof token === "string" && /^[A-Za-z0-9_-]{43}$/.test(token);
}

export function proxy(request: NextRequest) {
  const rawPath = request.nextUrl.pathname;
  const path = rawPath.startsWith("/BuggyDm")
    ? rawPath.replace(/^\/BuggyDm/, "") || "/"
    : rawPath;
  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "*",
      },
    });
  }

  const isLoginApi = path === "/api/auth/login";
  const isPublicApi =
    isLoginApi ||
    path.startsWith("/api/grocery/") ||
    path.startsWith("/api/admin/products/search");
  const isApi = path === "/api" || path.startsWith("/api/");
  const isLogin = path === "/login";
  const isRoot = path === "/" || rawPath === "/BuggyDm";
  const hasSession = hasOptimisticSession(request);

  if (isApi && !isPublicApi && !hasSession) {
    return NextResponse.json(
      { error: { code: "UNAUTHENTICATED" } },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (isLogin && hasSession) {
    return NextResponse.redirect(new URL("/BuggyDm/orders", request.url));
  }

  if (!isApi && !isLogin && !isRoot && !hasSession) {
    return NextResponse.redirect(new URL("/BuggyDm/login", request.url));
  }

  if (isRoot) {
    return NextResponse.redirect(
      new URL(hasSession ? "/BuggyDm/orders" : "/BuggyDm/login", request.url),
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
