import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

interface CustomerProduct {
  id: number;
  name: string;
  image_full_url?: string;
  price: number;
  discount?: number;
  discount_type?: string;
  stock?: number;
  store_name?: string;
}

interface CustomerCategory {
  id: number;
  name: string;
  image_full_url?: string;
}

const customerApi = process.env.BUGGY_CUSTOMER_API_URL || "https://admin.buggydelivery.com";
const moduleId = process.env.BUGGY_PREVIEW_MODULE_ID || "2";
const zoneId = process.env.BUGGY_PREVIEW_ZONE_ID || "2";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const headers = {
    Accept: "application/json",
    "X-localization": "en",
    moduleId,
    zoneId: `[${zoneId}]`,
  };

  try {
    const [productsResponse, categoriesResponse] = await Promise.all([
      fetch(`${customerApi}/api/v1/items/popular?type=all&offset=1&limit=8`, { headers, cache: "no-store", signal: AbortSignal.timeout(6000) }),
      fetch(`${customerApi}/api/v1/categories`, { headers, cache: "no-store", signal: AbortSignal.timeout(6000) }),
    ]);
    if (!productsResponse.ok || !categoriesResponse.ok) throw new Error("Customer catalog returned an unavailable response");
    const productPayload = await productsResponse.json() as { products?: CustomerProduct[]; items?: CustomerProduct[] };
    const categoryPayload = await categoriesResponse.json() as CustomerCategory[];
    const products = (productPayload.products || productPayload.items || []).slice(0, 8).map((product) => ({
      id: product.id,
      name: product.name,
      image: product.image_full_url || "",
      price: product.price,
      discount: product.discount || 0,
      discountType: product.discount_type || "percent",
      stock: product.stock,
      storeName: product.store_name || "Quick store",
    }));
    const categories = categoryPayload.slice(0, 8).map((category) => ({ id: category.id, name: category.name, image: category.image_full_url || "" }));
    return NextResponse.json({ success: true, source: "Quick Customer API", moduleId, zoneId, products, categories, fetchedAt: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json({ success: false, source: "fallback", products: [], categories: [], error: error instanceof Error ? error.message : "Live catalog unavailable" });
  }
}
