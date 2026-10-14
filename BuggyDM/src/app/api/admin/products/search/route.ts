import { NextResponse } from "next/server";
import { ProductRepository } from "@/repositories/database/product.repository";
import { getProductImageUrl } from "@/lib/images";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";

  try {
    const result = await ProductRepository.findPaginated({
      search: query,
      page: 1,
      limit: 15,
      includeInactive: false,
    });

    const products = (result.items || []).map((p) => {
      const price = Number(p.price || 0);
      const discount = Number(p.discount || 0);
      const discountType = p.discount_type || "percent";
      const discountedPrice =
        discountType === "percent"
          ? price - (price * discount) / 100
          : price - discount;

      return {
        id: Number(p.id),
        name: p.name || "",
        price: price,
        discount: discount,
        discountType: discountType,
        discountedPrice: Math.max(0, Math.round(discountedPrice)),
        image: getProductImageUrl(p.image),
      };
    });

    return NextResponse.json(
      { success: true, data: products },
      { headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error("GET /api/admin/products/search error:", error);
    return NextResponse.json(
      { success: false, data: [] },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
