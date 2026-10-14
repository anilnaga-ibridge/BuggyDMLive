import crypto from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { LayoutCacheManager } from "@/lib/qcos/cache";

function authorized(request: Request) {
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  const expected = process.env.CXP_SCHEDULER_KEY || "";
  if (!expected) return false;
  const a = crypto.createHash("sha256").update(supplied).digest();
  const b = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const due = await prisma.qcos_scheduled_publications.findMany({ where: { status: "scheduled", scheduled_for: { lte: new Date() } }, include: { page_version: true, channel: true }, orderBy: { scheduled_for: "asc" }, take: 50 });
  const executed: number[] = [];
  for (const schedule of due) {
    await prisma.$transaction(async (tx) => {
      const claimed = await tx.qcos_scheduled_publications.updateMany({ where: { id: schedule.id, status: "scheduled" }, data: { status: "executing" } });
      if (claimed.count !== 1) return;
      await tx.qcos_publish_history.updateMany({ where: { channel_id: schedule.channel_id, rolled_back_at: null, page_version: { template_id: schedule.page_version.template_id } }, data: { rolled_back_at: new Date() } });
      await tx.qcos_publish_history.create({ data: { page_version_id: schedule.page_version_id, channel_id: schedule.channel_id, published_by: schedule.created_by, rollout_pct: schedule.rollout_pct, publish_reason: schedule.reason } });
      await tx.qcos_page_versions.update({ where: { id: schedule.page_version_id }, data: { status: "published", published_at: new Date() } });
      await tx.qcos_scheduled_publications.update({ where: { id: schedule.id }, data: { status: "executed", executed_at: new Date() } });
      executed.push(schedule.id);
    });
  }
  if (executed.length) await LayoutCacheManager.invalidateAllLayoutCaches();
  return NextResponse.json({ success: true, examined: due.length, executed });
}
