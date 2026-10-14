import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { LayoutCacheManager } from "@/lib/qcos/cache";
import { AuditLogger } from "@/lib/qcos/audit-logger";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const publishId = Number(body.publishId);
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  if (!Number.isInteger(publishId) || !reason) return NextResponse.json({ success: false, error: "publishId and rollback reason are required" }, { status: 400 });
  const publish = await prisma.qcos_publish_history.findUnique({ where: { id: publishId }, include: { page_version: true, channel: true } });
  if (!publish || publish.rolled_back_at) return NextResponse.json({ success: false, error: "Active publication not found" }, { status: 404 });
  await prisma.qcos_publish_history.update({ where: { id: publish.id }, data: { rolled_back_at: new Date() } });
  await LayoutCacheManager.invalidateAllLayoutCaches();
  await AuditLogger.log(session.userId, "ROLLBACK", "qcos_publish_history", publish.id, { channel: publish.channel.code }, { reason });
  return NextResponse.json({ success: true });
}
