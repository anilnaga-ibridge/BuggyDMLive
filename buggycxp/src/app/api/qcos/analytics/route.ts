import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkTelemetryRateLimit } from "@/lib/qcos/rate-limit";
import { telemetryEventSchema } from "@/lib/qcos/contracts";

// POST /api/qcos/analytics - Record privacy-bounded client widget telemetry.
export async function POST(request: Request) {
  try {
    const rateLimit = await checkTelemetryRateLimit(request);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: "Rate limit exceeded" },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfter) } },
      );
    }
    const parsed = telemetryEventSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid telemetry event", issues: parsed.error.issues },
        { status: 422 },
      );
    }
    const widgetExists = await prisma.qcos_widget_instances.findUnique({
      where: { id: parsed.data.widgetInstanceId },
      select: { id: true },
    });
    if (!widgetExists) {
      return NextResponse.json({ success: false, error: "Unknown widget instance" }, { status: 404 });
    }
    const event = await prisma.qcos_analytics_events.create({
      data: {
        widget_instance_id: parsed.data.widgetInstanceId,
        event_name: parsed.data.eventName,
        metric_key: parsed.data.metricKey || null,
      },
    });
    return NextResponse.json({
      success: true,
      data: { id: event.id, eventName: event.event_name, timestamp: event.created_at },
    }, { status: 201 });
  } catch (error: unknown) {
    console.error("POST /api/qcos/analytics error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to log telemetry event" },
      { status: 500 },
    );
  }
}
