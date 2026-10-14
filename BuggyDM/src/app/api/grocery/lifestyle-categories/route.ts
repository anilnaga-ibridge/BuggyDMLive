import { NextRequest, NextResponse } from "next/server";
import {
  LifestyleCategoriesRepository,
  DEFAULT_LIFESTYLE_CATEGORIES_CONFIG,
} from "@/repositories/database/lifestyle-categories.repository";

export async function GET() {
  try {
    const config = await LifestyleCategoriesRepository.getConfig();
    return NextResponse.json({
      success: true,
      data: config,
    });
  } catch (error: any) {
    console.error("Failed to load lifestyle categories config:", error);
    return NextResponse.json(
      {
        success: true,
        data: DEFAULT_LIFESTYLE_CATEGORIES_CONFIG,
        warning: "Loaded default config due to error",
      },
      { status: 200 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid configuration data provided" },
        { status: 400 }
      );
    }

    const saved = await LifestyleCategoriesRepository.saveConfig(body);
    return NextResponse.json({
      success: true,
      message: "Lifestyle & Specialty categories configuration updated successfully",
      data: saved,
    });
  } catch (error: any) {
    console.error("Failed to save lifestyle categories config:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Internal server error while saving configuration",
      },
      { status: 500 }
    );
  }
}
