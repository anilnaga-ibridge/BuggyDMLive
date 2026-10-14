import { NextResponse } from "next/server";
import { NavigationRepository } from "@/repositories/database/navigation.repository";
import { authorizeApi, Permissions } from "@/lib/security/authorization";
import { serializeBigInts } from "@/lib/prisma-extension";
import { z } from "zod";

const NavigationSchema = z.object({
  title: z.string().trim().min(1).max(100),
  slug: z.string().trim().min(1).max(100).regex(/^[a-z0-9-]+$/),
  route: z.string().trim().min(1).max(255).startsWith("/"),
  icon: z.string().max(100).nullable().optional(),
  description: z.string().max(255).nullable().optional(),
  category: z.string().max(100).optional(),
  display_order: z.number().int().min(0).optional(),
  badge_provider: z.string().max(100).nullable().optional(),
  badge_refresh_interval: z.number().int().min(5).max(3_600).optional(),
  feature_flag: z.string().max(100).nullable().optional(),
  minimum_role: z.number().int().min(0).optional(),
  permissions: z.string().max(2_000).nullable().optional(),
  supports_offline: z.boolean().optional(),
  tenant_id: z.number().int().positive().nullable().optional(),
  warehouse_id: z.number().int().positive().nullable().optional(),
  platform: z.enum(["all", "web", "mobile", "tablet"]).optional(),
  is_enabled: z.boolean().optional(),
  is_visible: z.boolean().optional(),
  parent_id: z.number().int().positive().nullable().optional(),
}).strict();

// GET all items (including disabled & invisible) for Admin Management Console
export async function GET() {
  const authorization = await authorizeApi(Permissions.navigationManage);
  if (!authorization.ok) return authorization.response;

  try {
    const items = await NavigationRepository.findAll({ isEnabledOnly: false });
    return NextResponse.json({ success: true, data: serializeBigInts(items) });
  } catch (err) {
    console.error("GET /BuggyDm/api/admin/navigation error:", err);
    return NextResponse.json({ success: false, error: "Failed to load navigation" }, { status: 500 });
  }
}

// POST create new navigation item
export async function POST(request: Request) {
  const authorization = await authorizeApi(Permissions.navigationManage);
  if (!authorization.ok) return authorization.response;

  try {
    const result = NavigationSchema.safeParse(await request.json());
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: "Title, slug, and route are required." },
        { status: 400 }
      );
    }

    const created = await NavigationRepository.create(result.data);
    return NextResponse.json({
      success: true,
      data: {
        ...created,
        id: Number(created.id),
        parent_id: created.parent_id ? Number(created.parent_id) : null,
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to create navigation item" }, { status: 500 });
  }
}

// PUT update existing navigation item
export async function PUT(request: Request) {
  const authorization = await authorizeApi(Permissions.navigationManage);
  if (!authorization.ok) return authorization.response;

  try {
    const result = NavigationSchema.partial().extend({
      id: z.number().int().positive(),
    }).safeParse(await request.json());
    if (!result.success) {
      return NextResponse.json({ success: false, error: "ID is required" }, { status: 400 });
    }

    const { id, ...update } = result.data;
    const updated = await NavigationRepository.update(id, update);
    return NextResponse.json({
      success: true,
      data: {
        ...updated,
        id: Number(updated.id),
        parent_id: updated.parent_id ? Number(updated.parent_id) : null,
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to update navigation item" }, { status: 500 });
  }
}

// DELETE navigation item
export async function DELETE(request: Request) {
  const authorization = await authorizeApi(Permissions.navigationManage);
  if (!authorization.ok) return authorization.response;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "ID is required" }, { status: 400 });
    }

    await NavigationRepository.delete(Number(id));
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to delete navigation item" }, { status: 500 });
  }
}
