import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeBigInts } from "@/lib/prisma-extension";
import { authorizeApi, Permissions } from "@/lib/security/authorization";

// GET /api/qcos/audit-logs - Fetch latest 50 experience platform mutation logs
export async function GET() {
  const authorization = await authorizeApi(Permissions.cxpRead);
  if (!authorization.ok) return authorization.response;

  try {
    const logs = await prisma.qcos_audit_logs.findMany({
      orderBy: {
        timestamp: "desc",
      },
      take: 50,
    });

    return NextResponse.json({
      success: true,
      data: serializeBigInts(logs),
    });
  } catch (error) {
    console.error("GET /api/qcos/audit-logs error:", error);
    return NextResponse.json({ success: false, error: "Failed to load audit logs" }, { status: 500 });
  }
}
