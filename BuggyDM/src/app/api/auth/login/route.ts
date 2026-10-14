import { NextResponse } from "next/server";
import { Permissions } from "@/lib/security/authorization";
import { signInAdmin } from "@/lib/security/authentication";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const clientAddress =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
  const result = await signInAdmin(body, clientAddress, Permissions.cxpRead);

  if (result.ok) {
    return NextResponse.json(
      { success: true },
      { headers: { "Cache-Control": "no-store, private" } },
    );
  }

  const status =
    result.code === "RATE_LIMITED"
      ? 429
      : result.code === "FORBIDDEN"
        ? 403
        : result.code === "UNAVAILABLE"
          ? 503
          : 401;
  const response = NextResponse.json(
    { success: false, error: { code: result.code } },
    { status, headers: { "Cache-Control": "no-store" } },
  );
  if (result.retryAfterSeconds) {
    response.headers.set("Retry-After", String(result.retryAfterSeconds));
  }
  return response;
}
