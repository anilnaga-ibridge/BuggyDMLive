import { NextResponse } from "next/server";
import {
  authorizeApi,
  Permissions,
} from "@/lib/security/authorization";

export const dynamic = "force-dynamic";

export async function GET() {
  const authorization = await authorizeApi(Permissions.cxpRead);
  if (!authorization.ok) return authorization.response;

  const { session } = authorization;
  return NextResponse.json(
    {
      session: {
        userId: session.userId,
        roleId: session.roleId,
        name: session.name,
        email: session.email,
        expiresAt: session.expiresAt,
      },
    },
    {
      headers: {
        "Cache-Control": "no-store, private",
      },
    },
  );
}
