import { prisma } from "@/lib/prisma";

export class SalesRepository {
  // Get sales trends aggregated by period (e.g. daily, weekly, monthly)
  static async getSalesTrend(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const completedOrders = await prisma.orders.findMany({
      where: {
        order_status: "delivered",
        created_at: {
          gte: startDate,
        },
      },
      select: {
        created_at: true,
        order_amount: true,
      },
      orderBy: {
        created_at: "asc",
      },
    });

    // Group by date
    const trendMap = new Map<string, { date: string; revenue: number; ordersCount: number }>();
    
    // Initialize dates
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      trendMap.set(dateStr, { date: dateStr, revenue: 0, ordersCount: 0 });
    }

    completedOrders.forEach((order) => {
      if (!order.created_at) return;
      const dateStr = order.created_at.toISOString().split("T")[0];
      const current = trendMap.get(dateStr);
      if (current) {
        current.revenue += Number(order.order_amount);
        current.ordersCount += 1;
      }
    });

    return Array.from(trendMap.values()).reverse();
  }

  // Get revenue breakdown by payment methods
  static async getPaymentBreakdown() {
    const payments = await prisma.orders.groupBy({
      by: ["payment_method"],
      where: {
        order_status: "delivered",
      },
      _sum: {
        order_amount: true,
      },
      _count: {
        id: true,
      },
    });

    return payments.map((p) => ({
      paymentMethod: p.payment_method || "Unknown",
      revenue: Number(p._sum.order_amount || 0),
      ordersCount: p._count.id,
    }));
  }

  // Get sales performance by location (zone)
  static async getSalesByZone() {
    const zonesData = await prisma.orders.groupBy({
      by: ["zone_id"],
      where: {
        order_status: "delivered",
      },
      _sum: {
        order_amount: true,
      },
      _count: {
        id: true,
      },
    });

    // Resolve zone names from zone table
    const zoneIds = zonesData
      .filter((z) => z.zone_id !== null)
      .map((z) => z.zone_id as bigint);

    // Let's assume zones are stored in a table called 'zones'
    // Let's check model zones in schema: model zones has id and name
    const zones = await prisma.zones.findMany({
      where: {
        id: { in: zoneIds },
      },
      select: {
        id: true,
        name: true,
      },
    });

    return zonesData.map((z) => {
      const zoneName = zones.find((zone) => zone.id === z.zone_id)?.name || `Zone #${z.zone_id}`;
      return {
        zoneId: z.zone_id ? String(z.zone_id) : "Unknown",
        zoneName,
        revenue: Number(z._sum.order_amount || 0),
        ordersCount: z._count.id,
      };
    });
  }
}
