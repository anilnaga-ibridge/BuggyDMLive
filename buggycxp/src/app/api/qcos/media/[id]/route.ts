import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize } from "@/lib/qcos/authz";
import { AuditLogger } from "@/lib/qcos/audit-logger";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorize(request, "cxp.media.manage");
  if (auth.response || !auth.session) return auth.response;
  const id = Number((await params).id);
  if (!Number.isInteger(id)) return NextResponse.json({ success: false, error: "Invalid media id" }, { status: 400 });
  const current = await prisma.qcos_media_library.findUnique({ where: { id } });
  if (!current) return NextResponse.json({ success: false, error: "Media not found" }, { status: 404 });
  await prisma.qcos_media_library.update({ where: { id }, data: { status: "archived" } });
  await AuditLogger.log(auth.session.userId, "DELETE", "qcos_media_library", id, { status: current.status }, { status: "archived" });
  return NextResponse.json({ success: true });
}
