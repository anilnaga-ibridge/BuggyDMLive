import { NextResponse } from "next/server";
import { MAX_PAYLOAD_BYTES, MAX_SECTIONS, MAX_WIDGETS_PER_SECTION, SDUI_SCHEMA_VERSION } from "@/lib/qcos/contracts";
import { widgetRegistry } from "@/lib/qcos/widget-registry";

export async function GET() {
  return NextResponse.json({
    schemaVersion: SDUI_SCHEMA_VERSION,
    limits: { maxPayloadBytes: MAX_PAYLOAD_BYTES, maxSections: MAX_SECTIONS, maxWidgetsPerSection: MAX_WIDGETS_PER_SECTION },
    widgets: widgetRegistry,
    actions: ["navigate", "open_search", "select_module", "add_to_cart", "open_external_url", "track_event"],
  }, { headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=3600" } });
}
