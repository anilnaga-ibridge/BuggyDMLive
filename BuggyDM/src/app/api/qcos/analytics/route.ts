import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeApi, Permissions } from "@/lib/security/authorization";

// POST /api/qcos/analytics - Record client-side telemetry events (views, clicks) on SDUI widgets
export async function POST(request: Request) {
  const authorization = await authorizeApi(Permissions.cxpRead);
  if (!authorization.ok) return authorization.response;

  try {
    const body = await request.json().catch(() => ({}));
    const { widgetInstanceId, eventName, metricKey } = body;

    if (!widgetInstanceId) {
      return NextResponse.json({ success: false, error: "widgetInstanceId is required" }, { status: 400 });
    }
    if (!eventName) {
      return NextResponse.json({ success: false, error: "eventName is required" }, { status: 400 });
    }

    const event = await prisma.qcos_analytics_events.create({
      data: {
        widget_instance_id: Number(widgetInstanceId),
        event_name: eventName,
        metric_key: metricKey || null
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: event.id,
        eventName: event.event_name,
        timestamp: event.created_at
      }
    });
  } catch (error) {
    console.error("POST /api/qcos/analytics error:", error);
    return NextResponse.json({ success: false, error: "Failed to log telemetry event" }, { status: 500 });
  }
}
