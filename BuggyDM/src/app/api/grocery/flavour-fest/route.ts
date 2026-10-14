import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_FLAVOUR_FEST_CONFIG } from "@/types/flavour-fest";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

const SETTINGS_KEY = "grocery_flavour_fest_config";

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function GET() {
  try {
    const setting = await prisma.business_settings.findFirst({
      where: { key: SETTINGS_KEY },
    });

    if (setting && setting.value) {
      let parsed: any = setting.value;
      while (typeof parsed === "string") {
        try {
          parsed = JSON.parse(parsed);
        } catch {
          break;
        }
      }
      if (parsed && typeof parsed === "object") {
        const merged = {
          ...DEFAULT_FLAVOUR_FEST_CONFIG,
          ...parsed,
          theme: {
            ...DEFAULT_FLAVOUR_FEST_CONFIG.theme,
            ...(parsed.theme || {}),
          },
          leftMascot: {
            ...DEFAULT_FLAVOUR_FEST_CONFIG.leftMascot,
            ...(parsed.leftMascot || {}),
          },
          rightMascot: {
            ...DEFAULT_FLAVOUR_FEST_CONFIG.rightMascot,
            ...(parsed.rightMascot || {}),
          },
          cards: Array.isArray(parsed.cards) && parsed.cards.length > 0
            ? parsed.cards
            : DEFAULT_FLAVOUR_FEST_CONFIG.cards,
          filterTabs: Array.isArray(parsed.filterTabs) && parsed.filterTabs.length > 0
            ? parsed.filterTabs
            : DEFAULT_FLAVOUR_FEST_CONFIG.filterTabs,
          showcaseItems: Array.isArray(parsed.showcaseItems) && parsed.showcaseItems.length > 0
            ? parsed.showcaseItems
            : DEFAULT_FLAVOUR_FEST_CONFIG.showcaseItems,
        };
        return NextResponse.json({ success: true, data: merged }, { headers: CORS_HEADERS });
      }
    }

    return NextResponse.json(
      { success: true, data: DEFAULT_FLAVOUR_FEST_CONFIG },
      { headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error("GET /api/grocery/flavour-fest error:", error);
    return NextResponse.json(
      { success: true, data: DEFAULT_FLAVOUR_FEST_CONFIG, fallback: true },
      { headers: CORS_HEADERS }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const existing = await prisma.business_settings.findFirst({
      where: { key: SETTINGS_KEY },
    });

    let existingDb: any = {};
    if (existing && existing.value) {
      let parsed = existing.value;
      while (typeof parsed === "string") {
        try {
          parsed = JSON.parse(parsed);
        } catch {
          break;
        }
      }
      if (parsed && typeof parsed === "object") {
        existingDb = parsed;
      }
    }

    const payload = {
      ...DEFAULT_FLAVOUR_FEST_CONFIG,
      ...existingDb,
      ...body,
      theme: {
        ...DEFAULT_FLAVOUR_FEST_CONFIG.theme,
        ...(existingDb.theme || {}),
        ...(body.theme || {}),
      },
      updatedAt: new Date().toISOString(),
    };

    const serialized = JSON.stringify(payload);

    if (existing) {
      await prisma.business_settings.update({
        where: { id: existing.id },
        data: {
          value: serialized,
          updated_at: new Date(),
        },
      });
    } else {
      await prisma.business_settings.create({
        data: {
          key: SETTINGS_KEY,
          value: serialized,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
    }

    return NextResponse.json(
      { success: true, data: body, message: "FlavourFest configuration updated successfully" },
      { headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error("POST /api/grocery/flavour-fest error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save FlavourFest configuration" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function PUT(request: Request) {
  return POST(request);
}
