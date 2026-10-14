import { NextResponse } from "next/server";
import { validateCoupon } from "@/lib/qcos/rules";
import { authorizeApi, Permissions } from "@/lib/security/authorization";

// POST /api/qcos/campaigns/validate - Validate coupon code for active cart/order context
export async function POST(request: Request) {
  const authorization = await authorizeApi(Permissions.cxpRead);
  if (!authorization.ok) return authorization.response;

  try {
    const body = await request.json().catch(() => ({}));
    const { code, userId, orderValue } = body;

    if (!code) {
      return NextResponse.json({ success: false, error: "Coupon code is required" }, { status: 400 });
    }
    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID is required for verification" }, { status: 400 });
    }
    if (orderValue === undefined || orderValue === null || isNaN(Number(orderValue))) {
      return NextResponse.json({ success: false, error: "Valid order value is required" }, { status: 400 });
    }

    let parsedUserId: bigint;
    try {
      parsedUserId = BigInt(userId);
    } catch {
      return NextResponse.json({ success: false, error: "Invalid user ID format" }, { status: 400 });
    }

    const validation = await validateCoupon(code, parsedUserId, Number(orderValue));

    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: validation.error,
      }, { status: 200 }); // Return 200 with success: false for invalid coupon reasons (e.g. expired, value limit)
    }

    return NextResponse.json({
      success: true,
      data: {
        discountType: validation.discountType,
        discountValue: validation.discountValue,
      }
    });
  } catch (error) {
    console.error("POST /api/qcos/campaigns/validate error:", error);
    return NextResponse.json({ success: false, error: "Failed to validate coupon" }, { status: 500 });
  }
}
