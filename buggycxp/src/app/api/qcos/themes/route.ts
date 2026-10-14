import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { serializeBigInts } from "@/lib/prisma-extension";
import { themeSchema } from "@/lib/qcos/validation";
import { LayoutCacheManager } from "@/lib/qcos/cache";

// GET /api/qcos/themes - List all themes with design tokens
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const themes = await prisma.qcos_themes.findMany({
      include: {
        tokens: true,
      },
      orderBy: {
        created_at: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: serializeBigInts(themes),
    });
  } catch (error: unknown) {
    console.error("GET /api/qcos/themes error:", error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Failed to load themes" }, { status: 500 });
  }
}

// POST /api/qcos/themes - Create a new theme with design tokens
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = themeSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ success: false, error: "Validation failed", details: result.error.format() }, { status: 400 });
    }

    const { name, description, is_active, tokens } = result.data;

    // Create theme and tokens in a transaction
    const theme = await prisma.$transaction(async (tx) => {
      // If is_active is true, deactivate other active themes first
      if (is_active) {
        await tx.qcos_themes.updateMany({
          where: { is_active: true },
          data: { is_active: false },
        });
      }

      const newTheme = await tx.qcos_themes.create({
        data: {
          name,
          description,
          is_active,
          tokens: tokens && tokens.length > 0 ? {
            create: tokens.map((t) => ({
              token_key: t.token_key,
              token_value: t.token_value,
              category: t.category,
            })),
          } : undefined,
        },
        include: {
          tokens: true,
        },
      });

      if (is_active) {
        await tx.qcos_layouts.updateMany({
          data: { theme_id: newTheme.id },
        });
      }

      // Write Audit Log
      await tx.qcos_audit_logs.create({
        data: {
          user_id: session.userId,
          action: "CREATE",
          target_table: "qcos_themes",
          record_id: newTheme.id,
          new_value: JSON.stringify(newTheme),
          ip_address: "127.0.0.1",
          user_agent: request.headers.get("user-agent") || "unknown",
        },
      });

      return newTheme;
    });

    // Invalidate experience layouts cache
    await LayoutCacheManager.invalidateAllLayoutCaches();

    return NextResponse.json({
      success: true,
      data: serializeBigInts(theme),
    });
  } catch (error: unknown) {
    console.error("POST /api/qcos/themes error:", error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Failed to create theme" }, { status: 500 });
  }
}
