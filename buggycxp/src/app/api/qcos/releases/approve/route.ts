import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AuditLogger } from "@/lib/qcos/audit-logger";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const pageVersionId = Number(body.pageVersionId);
  if (!Number.isInteger(pageVersionId) || pageVersionId < 1) return NextResponse.json({ success: false, error: "Valid pageVersionId is required" }, { status: 400 });
  const version = await prisma.qcos_page_versions.findUnique({ where: { id: pageVersionId } });
  if (!version) return NextResponse.json({ success: false, error: "Page version not found" }, { status: 404 });
  if (version.created_by === session.userId) return NextResponse.json({ success: false, error: "An author cannot approve their own version" }, { status: 409 });
  const updated = await prisma.qcos_page_versions.update({ where: { id: pageVersionId }, data: { status: "approved", approved_by: session.userId } });
  await AuditLogger.log(session.userId, "APPROVE", "qcos_page_versions", pageVersionId, { status: version.status }, { status: "approved" });
  return NextResponse.json({ success: true, data: updated });
}
