import { prisma } from "@/lib/prisma";

export class CostRepository {
  // Get wastage statistics (returned / refunded / canceled orders)
  static async getWastageSummary() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);

    const stats = await prisma.orders.groupBy({
      by: ["order_status"],
      where: {
        created_at: {
          gte: monthAgo,
        },
      },
      _count: {
        id: true,
      },
      _sum: {
        order_amount: true,
      },
    });

    const canceledStats = stats.find(s => s.order_status === "canceled") || { _count: { id: 0 }, _sum: { order_amount: 0 } };
    const refundedStats = stats.find(s => s.order_status === "refunded") || { _count: { id: 0 }, _sum: { order_amount: 0 } };

    return {
      canceledCount: canceledStats._count.id,
      canceledValue: Number(canceledStats._sum.order_amount || 0),
      refundedCount: refundedStats._count.id,
      refundedValue: Number(refundedStats._sum.order_amount || 0),
      periodDays: 30,
    };
  }

  // Get stores with high cancellation rates
  static async getLossyStores() {
    const storeOrders = await prisma.orders.groupBy({
      by: ["store_id", "order_status"],
      _count: {
        id: true,
      },
    });

    const storeIds = Array.from(new Set(storeOrders.filter(s => s.store_id !== null).map(s => s.store_id as bigint)));
    const stores = await prisma.stores.findMany({
      where: {
        id: { in: storeIds },
      },
      select: {
        id: true,
        name: true,
      },
    });

    const storeStats = new Map<string, { storeName: string; total: number; canceled: number }>();

    storeOrders.forEach((o) => {
      if (!o.store_id) return;
      const storeIdStr = String(o.store_id);
      const storeName = stores.find(s => String(s.id) === storeIdStr)?.name || `Store #${storeIdStr}`;

      const current = storeStats.get(storeIdStr) || { storeName, total: 0, canceled: 0 };
      current.total += o._count.id;
      if (o.order_status === "canceled") {
        current.canceled += o._count.id;
      }
      storeStats.set(storeIdStr, current);
    });

    return Array.from(storeStats.entries()).map(([storeId, s]) => {
      const cancellationRate = s.total > 0 ? (s.canceled / s.total) * 100 : 0;
      return {
        storeId,
        storeName: s.storeName,
        totalOrders: s.total,
        canceledOrders: s.canceled,
        cancellationRate: Number(cancellationRate.toFixed(1)),
      };
    }).filter(s => s.cancellationRate > 15) // Show stores with cancellation rate > 15%
      .sort((a, b) => b.cancellationRate - a.cancellationRate);
  }
}
