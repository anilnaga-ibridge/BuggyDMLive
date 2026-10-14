import { prisma } from "@/lib/prisma";

export class LocationRepository {
  // Get revenue and order count by zone
  static async getZonePerformance() {
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

    const zoneIds = zonesData
      .filter((z) => z.zone_id !== null)
      .map((z) => z.zone_id as bigint);

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
      const zone = zones.find((zone) => zone.id === z.zone_id);
      return {
        zoneId: z.zone_id ? String(z.zone_id) : "Unknown",
        zoneName: zone?.name || `Zone #${z.zone_id}`,
        revenue: Number(z._sum.order_amount || 0),
        ordersCount: z._count.id,
      };
    });
  }

  // Get top selling products per zone
  static async getTopProductsByZone() {
    // Group order details by zone (joining orders & order_details)
    // Since Prisma relation mapping is not fully set up, we'll fetch last 1000 order details
    // and group them in memory, or run a prisma join
    const completedOrders = await prisma.orders.findMany({
      where: {
        order_status: "delivered",
      },
      select: {
        id: true,
        zone_id: true,
      },
      orderBy: {
        created_at: "desc",
      },
      take: 2000,
    });

    const orderIds = completedOrders.map((o) => o.id);
    const orderDetails = await prisma.order_details.findMany({
      where: {
        order_id: { in: orderIds },
      },
      select: {
        order_id: true,
        item_id: true,
        quantity: true,
        price: true,
      },
    });

    const itemIds = Array.from(new Set(orderDetails.filter((d) => d.item_id !== null).map((d) => d.item_id as bigint)));
    const items = await prisma.items.findMany({
      where: {
        id: { in: itemIds },
      },
      select: {
        id: true,
        name: true,
      },
    });

    const zoneProductMap = new Map<string, Map<string, { name: string; quantity: number }>>();

    orderDetails.forEach((detail) => {
      const order = completedOrders.find((o) => o.id === detail.order_id);
      if (!order || !order.zone_id) return;
      const zoneIdStr = String(order.zone_id);
      const itemIdStr = String(detail.item_id);

      if (!zoneProductMap.has(zoneIdStr)) {
        zoneProductMap.set(zoneIdStr, new Map());
      }

      const pMap = zoneProductMap.get(zoneIdStr)!;
      const current = pMap.get(itemIdStr) || { name: items.find((i) => String(i.id) === itemIdStr)?.name || "Unknown Item", quantity: 0 };
      current.quantity += detail.quantity;
      pMap.set(itemIdStr, current);
    });

    const result: { zoneId: string; topProducts: { name: string; quantity: number }[] }[] = [];
    zoneProductMap.forEach((pMap, zoneId) => {
      const topProducts = Array.from(pMap.values())
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);
      result.push({ zoneId, topProducts });
    });

    return result;
  }
}
