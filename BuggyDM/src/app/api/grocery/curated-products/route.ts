import { NextResponse } from "next/server";
import { CuratedProductsRepository } from "@/repositories/database/curated-products.repository";

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
    const config = await CuratedProductsRepository.getConfig();
    return NextResponse.json(
      { success: true, data: config },
      { headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error("GET /api/grocery/curated-products error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch curated products config" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const updated = await CuratedProductsRepository.saveConfig(body);
    return NextResponse.json(
      { success: true, data: updated },
      { headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error("POST /api/grocery/curated-products error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to save curated products config" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
