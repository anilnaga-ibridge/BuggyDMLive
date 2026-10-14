import { NextResponse } from "next/server";
import { deleteSession } from "@/lib/session";
import {
  authorizeApi,
  Permissions,
} from "@/lib/security/authorization";

export async function POST() {
  const authorization = await authorizeApi(Permissions.cxpRead);
  if (!authorization.ok) return authorization.response;

  await deleteSession();
  return new NextResponse(null, {
    status: 204,
    headers: { "Cache-Control": "no-store" },
  });
}
