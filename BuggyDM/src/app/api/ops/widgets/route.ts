import { NextResponse } from "next/server";
import { authorizeApi, Permissions } from "@/lib/security/authorization";

export async function GET() {
  const authorization = await authorizeApi(Permissions.operationsRead);
  if (!authorization.ok) return authorization.response;

  // Returns registered header widget plugin metadata
  const widgets = [
    { id: "shift_timer", name: "Shift Timer", enabled: true, order: 1 },
    { id: "device_info", name: "Device Identifier", enabled: true, order: 2 },
    { id: "network_status", name: "Network Connection", enabled: true, order: 3 },
    { id: "sync_queue", name: "Offline Sync Queue", enabled: true, order: 4 },
    { id: "picking_sla", name: "Picking SLA", enabled: true, order: 5 },
    { id: "warehouse_temp", name: "Warehouse Climate", enabled: false, order: 6 },
  ];

  return NextResponse.json({
    success: true,
    data: widgets,
  });
}
