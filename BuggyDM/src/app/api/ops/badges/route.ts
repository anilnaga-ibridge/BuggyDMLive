import { NextResponse } from "next/server";
import { BadgeProviderService } from "@/services/badge-provider.service";
import { authorizeApi, Permissions } from "@/lib/security/authorization";

export async function GET(request: Request) {
  const authorization = await authorizeApi(Permissions.operationsRead);
  if (!authorization.ok) return authorization.response;

  try {
    const { searchParams } = new URL(request.url);
    const providersParam = searchParams.get("providers");
    
    const providers = providersParam 
      ? providersParam.split(",").map((p) => p.trim())
      : [
          "orders_waiting",
          "packing_queue",
          "dispatch_ready",
          "critical_orders",
          "returns_pending",
          "inventory_alert",
          "pending_qc",
        ];

    const badges = await BadgeProviderService.batchResolveBadges(providers);

    return NextResponse.json({
      success: true,
      data: badges,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Error fetching navigation badges:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch badge metrics" },
      { status: 500 }
    );
  }
}
