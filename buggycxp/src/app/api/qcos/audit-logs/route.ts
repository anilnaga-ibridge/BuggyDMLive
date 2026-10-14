import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { serializeBigInts } from "@/lib/prisma-extension";

// GET /api/qcos/audit-logs - Fetch latest 50 experience platform mutation logs
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

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
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Failed to load audit logs" }, { status: 500 });
  }
}
