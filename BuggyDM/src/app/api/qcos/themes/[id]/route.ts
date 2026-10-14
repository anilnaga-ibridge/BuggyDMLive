import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeBigInts } from "@/lib/prisma-extension";
import { themeSchema } from "@/lib/qcos/validation";
import { LayoutCacheManager } from "@/lib/qcos/cache";
import { authorizeApi, Permissions } from "@/lib/security/authorization";

// GET /api/qcos/themes/[id] - Fetch specific theme by ID
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authorization = await authorizeApi(Permissions.cxpRead);
  if (!authorization.ok) return authorization.response;

  try {
    const { id } = await params;
    const themeId = parseInt(id, 10);
    if (isNaN(themeId)) {
      return NextResponse.json({ success: false, error: "Invalid theme ID" }, { status: 400 });
    }

    const theme = await prisma.qcos_themes.findUnique({
      where: { id: themeId },
      include: { tokens: true },
    });

    if (!theme) {
      return NextResponse.json({ success: false, error: "Theme not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: serializeBigInts(theme),
    });
  } catch (error) {
    console.error("GET theme detail error:", error);
    return NextResponse.json({ success: false, error: "Failed to load theme" }, { status: 500 });
  }
}

// PUT /api/qcos/themes/[id] - Update specific theme by ID
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authorization = await authorizeApi(Permissions.cxpPublish);
  if (!authorization.ok) return authorization.response;

  try {
    const session = authorization.session;

    const { id } = await params;
    const themeId = parseInt(id, 10);
    if (isNaN(themeId)) {
      return NextResponse.json({ success: false, error: "Invalid theme ID" }, { status: 400 });
    }

    const body = await request.json();
    // Validate request using partial theme schema
    const result = themeSchema.partial().safeParse(body);
    if (!result.success) {
      return NextResponse.json({ success: false, error: "Validation failed", details: result.error.format() }, { status: 400 });
    }

    const { name, description, is_active, tokens } = result.data;

    // Fetch existing theme state
    const oldTheme = await prisma.qcos_themes.findUnique({
      where: { id: themeId },
      include: { tokens: true },
    });

    if (!oldTheme) {
      return NextResponse.json({ success: false, error: "Theme not found" }, { status: 404 });
    }

    const updatedTheme = await prisma.$transaction(async (tx) => {
      // If we are activating this theme, deactivate others
      if (is_active === true) {
        await tx.qcos_themes.updateMany({
          where: { is_active: true, id: { not: themeId } },
          data: { is_active: false },
        });
      }

      // If tokens list is provided, update/recreate tokens
      if (tokens !== undefined) {
        await tx.qcos_design_tokens.deleteMany({
          where: { theme_id: themeId },
        });
      }

      const updated = await tx.qcos_themes.update({
        where: { id: themeId },
        data: {
          name: name !== undefined ? name : undefined,
          description: description !== undefined ? description : undefined,
          is_active: is_active !== undefined ? is_active : undefined,
          tokens: tokens && tokens.length > 0 ? {
            create: tokens.map((t) => ({
              token_key: t.token_key,
              token_value: t.token_value,
              category: t.category,
            })),
          } : undefined,
        },
        include: { tokens: true },
      });

      // Audit Log
      await tx.qcos_audit_logs.create({
        data: {
          user_id: session.userId,
          action: "UPDATE",
          target_table: "qcos_themes",
          record_id: themeId,
          old_value: JSON.stringify(oldTheme),
          new_value: JSON.stringify(updated),
          ip_address: "127.0.0.1",
          user_agent: request.headers.get("user-agent") || "unknown",
        },
      });

      return updated;
    });

    // Invalidate layouts cache
    await LayoutCacheManager.invalidateAllLayoutCaches();

    return NextResponse.json({
      success: true,
      data: serializeBigInts(updatedTheme),
    });
  } catch (error) {
    console.error("PUT theme detail error:", error);
    return NextResponse.json({ success: false, error: "Failed to update theme" }, { status: 500 });
  }
}

// DELETE /api/qcos/themes/[id] - Delete theme
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authorization = await authorizeApi(Permissions.cxpPublish);
  if (!authorization.ok) return authorization.response;

  try {
    const session = authorization.session;

    const { id } = await params;
    const themeId = parseInt(id, 10);
    if (isNaN(themeId)) {
      return NextResponse.json({ success: false, error: "Invalid theme ID" }, { status: 400 });
    }

    const oldTheme = await prisma.qcos_themes.findUnique({
      where: { id: themeId },
      include: { tokens: true },
    });

    if (!oldTheme) {
      return NextResponse.json({ success: false, error: "Theme not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.qcos_themes.delete({
        where: { id: themeId },
      });

      // Audit Log
      await tx.qcos_audit_logs.create({
        data: {
          user_id: session.userId,
          action: "DELETE",
          target_table: "qcos_themes",
          record_id: themeId,
          old_value: JSON.stringify(oldTheme),
          new_value: null,
          ip_address: "127.0.0.1",
          user_agent: request.headers.get("user-agent") || "unknown",
        },
      });
    });

    // Invalidate layouts cache
    await LayoutCacheManager.invalidateAllLayoutCaches();

    return NextResponse.json({
      success: true,
      message: "Theme deleted successfully",
    });
  } catch (error) {
    console.error("DELETE theme error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete theme" }, { status: 500 });
  }
}
