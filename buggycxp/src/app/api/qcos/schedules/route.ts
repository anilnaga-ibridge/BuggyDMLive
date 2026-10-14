import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authorize } from "@/lib/qcos/authz";
import { AuditLogger } from "@/lib/qcos/audit-logger";
import { releaseRequiresIndependentApproval } from "@/lib/qcos/contracts";

const scheduleSchema = z.object({
  pageVersionId: z.number().int().positive(), channelCode: z.string().min(1).max(20),
  scheduledFor: z.string().datetime(), rolloutPct: z.literal(100).default(100), reason: z.string().min(10).max(500),
  confirmation: z.string().optional(),
});

export async function GET(request: Request) {
  const auth = await authorize(request, "cxp.view"); if (auth.response) return auth.response;
  const data = await prisma.qcos_scheduled_publications.findMany({ include: { page_version: { include: { template: true } }, channel: true }, orderBy: { scheduled_for: "asc" }, take: 250 });
  return NextResponse.json({ success: true, data });
}

export async function POST(request: Request) {
  const auth = await authorize(request, "cxp.publish"); if (auth.response || !auth.session) return auth.response;
  const parsed = scheduleSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, error: "Invalid schedule", issues: parsed.error.issues }, { status: 422 });
  const input = parsed.data;
  const [version, channel] = await Promise.all([
    prisma.qcos_page_versions.findUnique({ where: { id: input.pageVersionId } }),
    prisma.qcos_release_channels.findUnique({ where: { code: input.channelCode } }),
  ]);
  if (!version || !channel) return NextResponse.json({ success: false, error: "Version or release channel not found" }, { status: 404 });
  if (releaseRequiresIndependentApproval(channel.code) && !version.approved_by) return NextResponse.json({ success: false, error: "An independent reviewer is required for staging and production" }, { status: 409 });
  if (channel.code === "prod" && input.confirmation !== "SCHEDULE") return NextResponse.json({ success: false, error: "Type SCHEDULE to confirm a future customer release" }, { status: 409 });
  if (new Date(input.scheduledFor).getTime() < Date.now() + 60_000) return NextResponse.json({ success: false, error: "Schedule must be at least one minute in the future" }, { status: 422 });
  const duplicate = await prisma.qcos_scheduled_publications.findFirst({ where: { page_version_id: version.id, channel_id: channel.id, status: "scheduled" } });
  if (duplicate) return NextResponse.json({ success: false, error: "This version is already scheduled for that environment" }, { status: 409 });
  const schedule = await prisma.qcos_scheduled_publications.create({ data: { page_version_id: version.id, channel_id: channel.id, scheduled_for: new Date(input.scheduledFor), rollout_pct: input.rolloutPct, reason: input.reason, created_by: auth.session.userId } });
  await AuditLogger.log(auth.session.userId, "CREATE", "qcos_scheduled_publications", schedule.id, null, { channel: channel.code, scheduledFor: input.scheduledFor, rolloutPct: input.rolloutPct });
  return NextResponse.json({ success: true, data: schedule }, { status: 201 });
}

export async function DELETE(request: Request) {
  const auth = await authorize(request, "cxp.publish"); if (auth.response || !auth.session) return auth.response;
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!Number.isInteger(id)) return NextResponse.json({ success: false, error: "Valid schedule id required" }, { status: 400 });
  const current = await prisma.qcos_scheduled_publications.findUnique({ where: { id } });
  if (!current || current.status !== "scheduled") return NextResponse.json({ success: false, error: "Active schedule not found" }, { status: 404 });
  await prisma.qcos_scheduled_publications.update({ where: { id }, data: { status: "cancelled", cancelled_at: new Date() } });
  await AuditLogger.log(auth.session.userId, "DELETE", "qcos_scheduled_publications", id, { status: "scheduled" }, { status: "cancelled" });
  return NextResponse.json({ success: true });
}
