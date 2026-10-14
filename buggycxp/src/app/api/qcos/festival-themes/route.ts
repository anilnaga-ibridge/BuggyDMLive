import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { FestivalThemeService } from "@/lib/qcos/festival-theme/festival-service";
import { festivalThemeSchema } from "@/lib/qcos/festival-theme/schema";
import { createEmptyFestivalTheme } from "@/lib/qcos/festival-theme/types";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (id) {
    const item = await FestivalThemeService.getFestivalTheme(id);
    if (!item) {
      return NextResponse.json({ success: false, error: "Festival theme not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: item });
  }

  const list = await FestivalThemeService.listFestivalThemes();
  return NextResponse.json({ success: true, data: list });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validated = festivalThemeSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: validated.error.issues,
        },
        { status: 400 }
      );
    }

    const res = await FestivalThemeService.saveFestivalTheme(validated.data);
    if (!res.success) {
      return NextResponse.json({ success: false, error: res.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: validated.data });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || "Failed to process request" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ success: false, error: "Missing festival ID" }, { status: 400 });
  }

  const res = await FestivalThemeService.deleteFestivalTheme(id);
  return NextResponse.json({ success: res.success });
}
