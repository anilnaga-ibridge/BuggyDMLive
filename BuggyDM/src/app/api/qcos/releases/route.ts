import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeBigInts } from "@/lib/prisma-extension";
import { AuditLogger } from "@/lib/qcos/audit-logger";
import { LayoutCacheManager } from "@/lib/qcos/cache";
import { authorizeApi, Permissions } from "@/lib/security/authorization";
import { z } from "zod";

const PromoteReleaseSchema = z.object({
  pageVersionId: z.number().int().positive(),
  channelCode: z.string().trim().min(1).max(50).regex(/^[a-z0-9_-]+$/i),
}).strict();

// GET /api/qcos/releases - Get all release channels and draft/published page versions
export async function GET() {
  const authorization = await authorizeApi(Permissions.cxpRead);
  if (!authorization.ok) return authorization.response;

  try {
    const channels = await prisma.qcos_release_channels.findMany();

    // Fetch currently active publishes for each channel
    const activeReleases = await Promise.all(
      channels.map(async (channel) => {
        const activePublish = await prisma.qcos_publish_history.findFirst({
          where: {
            channel_id: channel.id,
            rolled_back_at: null
          },
          orderBy: {
            published_at: "desc"
          },
          include: {
            page_version: {
              include: {
                template: true
              }
            }
          }
        });
        return {
          channelId: channel.id,
          channelName: channel.name,
          channelCode: channel.code,
          activePublish: activePublish ? serializeBigInts(activePublish) : null
        };
      })
    );

    // Fetch page versions
    const pageVersions = await prisma.qcos_page_versions.findMany({
      include: {
        template: true
      },
      orderBy: {
        version_number: "desc"
      }
    });

    return NextResponse.json({
      success: true,
      channels: activeReleases,
      versions: serializeBigInts(pageVersions)
    });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to load releases" }, { status: 500 });
  }
}

// POST /api/qcos/releases/promote - Promote page version to release channel environment
export async function POST(req: Request) {
  const authorization = await authorizeApi(Permissions.cxpPublish);
  if (!authorization.ok) return authorization.response;

  try {
    const session = authorization.session;

    const parsed = PromoteReleaseSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "pageVersionId and channelCode are required" }, { status: 400 });
    }

    const { pageVersionId, channelCode } = parsed.data;

    // Check if channel exists
    const channel = await prisma.qcos_release_channels.findUnique({
      where: { code: channelCode }
    });
    if (!channel) {
      return NextResponse.json({ success: false, error: "Release channel not found" }, { status: 404 });
    }

    // Check if page version exists
    const version = await prisma.qcos_page_versions.findUnique({
      where: { id: pageVersionId },
      include: { template: true }
    });
    if (!version) {
      return NextResponse.json({ success: false, error: "Page version not found" }, { status: 404 });
    }

    // Execute in transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Invalidate or mark rolled back previous publishes for this channel
      await tx.qcos_publish_history.updateMany({
        where: {
          channel_id: channel.id,
          rolled_back_at: null
        },
        data: {
          rolled_back_at: new Date()
        }
      });

      // 2. Create new publish log
      const publishLog = await tx.qcos_publish_history.create({
        data: {
          page_version_id: version.id,
          channel_id: channel.id,
          published_by: session.userId
        }
      });

      // 3. Update page version status to published
      await tx.qcos_page_versions.update({
        where: { id: version.id },
        data: {
          status: "published",
          published_at: new Date()
        }
      });

      return publishLog;
    });

    // Invalidate caches
    await LayoutCacheManager.invalidateAllLayoutCaches();

    // Log to mutations audit trail
    await AuditLogger.log(
      session.userId,
      "PUBLISH",
      "qcos_page_versions",
      version.id,
      { status: version.status },
      { status: "published", channel: channelCode }
    );

    return NextResponse.json({
      success: true,
      data: serializeBigInts(result)
    });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to promote release" }, { status: 500 });
  }
}
