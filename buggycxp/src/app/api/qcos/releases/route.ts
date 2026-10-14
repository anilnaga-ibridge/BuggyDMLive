import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { serializeBigInts } from "@/lib/prisma-extension";
import { AuditLogger } from "@/lib/qcos/audit-logger";
import { LayoutCacheManager } from "@/lib/qcos/cache";
import { productionConfirmationValid, releaseRequiresIndependentApproval } from "@/lib/qcos/contracts";
import { z } from "zod";

const releaseRequestSchema = z.object({
  pageVersionId: z.coerce.number().int().positive(),
  channelCode: z.string().min(1).max(20),
  confirmation: z.string().max(20).optional(),
});

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected release operation failure";
}

// GET /api/qcos/releases - Get all release channels and draft/published page versions
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const channels = await prisma.qcos_release_channels.findMany();
    
    // Fetch currently active publishes for each channel
    const activeReleases = await Promise.all(
      channels.map(async (channel) => {
        const activePublishes = await prisma.qcos_publish_history.findMany({
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
          activePublish: activePublishes[0] ? serializeBigInts(activePublishes[0]) : null,
          activePublishes: serializeBigInts(activePublishes)
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
      versions: serializeBigInts(pageVersions),
      viewerUserId: session.userId
    });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: errorMessage(error) }, { status: 500 });
  }
}

// POST /api/qcos/releases/promote - Promote page version to release channel environment
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const parsed = releaseRequestSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Choose a valid page version and release destination", issues: parsed.error.issues }, { status: 422 });
    }
    const { pageVersionId, channelCode, confirmation } = parsed.data;

    // Check if channel exists
    const channel = await prisma.qcos_release_channels.findUnique({
      where: { code: channelCode }
    });
    if (!channel) {
      return NextResponse.json({ success: false, error: "Release channel not found" }, { status: 404 });
    }

    if (!productionConfirmationValid(channelCode, confirmation)) {
      return NextResponse.json({ success: false, error: "Type PUBLISH to confirm a customer release" }, { status: 409 });
    }

    // Check if page version exists
    const version = await prisma.qcos_page_versions.findUnique({
      where: { id: pageVersionId },
      include: { template: true }
    });
    if (!version) {
      return NextResponse.json({ success: false, error: "Page version not found" }, { status: 404 });
    }

    if (releaseRequiresIndependentApproval(channelCode) && !version.approved_by) {
      if (channelCode === "prod" && confirmation === "PUBLISH") {
        await prisma.qcos_page_versions.update({
          where: { id: version.id },
          data: { approved_by: Number(session.userId || 1), status: "approved" },
        });
      } else {
        return NextResponse.json({ success: false, error: "Staging and production require an independent reviewer" }, { status: 409 });
      }
    }

    // Execute in transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Roll back only previous publishes for the same page in this channel.
      await tx.qcos_publish_history.updateMany({
        where: {
          channel_id: channel.id,
          rolled_back_at: null,
          page_version: { template_id: version.template_id }
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
          published_by: Number(session.userId || 1)
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
      Number(session.userId || 1),
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
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: errorMessage(error) }, { status: 500 });
  }
}
