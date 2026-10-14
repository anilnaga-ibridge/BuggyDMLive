import { NextResponse } from "next/server";
import { FeaturedOffersRepository } from "@/repositories/database/featured-offers.repository";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
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
    const config = await FeaturedOffersRepository.getConfig();
    return NextResponse.json(
      { success: true, data: config },
      { headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error("GET /api/grocery/featured-offers error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve Featured & Offers configuration" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const updated = await FeaturedOffersRepository.saveConfig(body);
    return NextResponse.json(
      {
        success: true,
        data: updated,
        message: "Featured & Offers configuration updated successfully",
      },
      { headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error("POST /api/grocery/featured-offers error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save Featured & Offers configuration" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function PUT(request: Request) {
  return POST(request);
}
