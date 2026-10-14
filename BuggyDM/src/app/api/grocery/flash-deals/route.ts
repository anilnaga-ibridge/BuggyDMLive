import { NextResponse } from "next/server";
import { FlashDealsRepository } from "@/repositories/database/flash-deals.repository";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function GET() {
  try {
    const config = await FlashDealsRepository.getConfig();
    return NextResponse.json(
      {
        success: true,
        data: config,
      },
      { headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error("GET /api/grocery/flash-deals error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to load flash deals configuration",
      },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const updated = await FlashDealsRepository.saveConfig(body);
    return NextResponse.json(
      {
        success: true,
        data: updated,
        message: "Flash deals configuration saved successfully",
      },
      { headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error("POST /api/grocery/flash-deals error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to save flash deals configuration",
      },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
