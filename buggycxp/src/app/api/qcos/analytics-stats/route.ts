import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { serializeBigInts } from "@/lib/prisma-extension";

// GET /api/qcos/analytics-stats - Aggregate widgets interaction stats (views/clicks count)
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Aggregate widget event counts
    const groupedStats = await prisma.qcos_analytics_events.groupBy({
      by: ["widget_instance_id", "event_name"],
      _count: {
        id: true,
      },
    });

    // Also fetch widget names to display nice labels in the dashboard table
    const widgetInstances = await prisma.qcos_widget_instances.findMany({
      include: {
        widget: true,
        section: true
      }
    });

    // Map stats list with descriptive widget identifiers
    const resolvedStats = groupedStats.map((stat) => {
      const instance = widgetInstances.find((item) => item.id === stat.widget_instance_id);
      return {
        widgetInstanceId: stat.widget_instance_id,
        widgetName: instance ? `${instance.section.name} -> ${instance.widget.name}` : `Instance #${stat.widget_instance_id}`,
        eventName: stat.event_name,
        count: stat._count.id
      };
    });

    // Also query the total events logged in the last 24h
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const total24h = await prisma.qcos_analytics_events.count({
      where: {
        created_at: { gte: dayAgo }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        metrics: serializeBigInts(resolvedStats),
        total24h
      }
    });
  } catch (error: unknown) {
    console.error("GET /api/qcos/analytics-stats error:", error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Failed to load telemetry stats" }, { status: 500 });
  }
}
