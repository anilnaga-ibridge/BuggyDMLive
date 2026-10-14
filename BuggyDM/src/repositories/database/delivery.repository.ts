import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export class DeliveryRepository {
  // Get packing and delivery durations
  static async getDeliveryPerformance() {
    const completedOrders = await prisma.orders.findMany({
      where: {
        order_status: "delivered",
        delivered: { not: null },
        processing: { not: null },
      },
      select: {
        id: true,
        processing: true,
        handover: true,
        picked_up: true,
        delivered: true,
        distance: true,
      },
      take: 500, // sample size
    });

    let totalPackingTimeMs = 0;
    let totalDeliveryTimeMs = 0;
    let validPackingCount = 0;
    let validDeliveryCount = 0;

    completedOrders.forEach((o) => {
      if (o.processing && o.handover) {
        totalPackingTimeMs += new Date(o.handover).getTime() - new Date(o.processing).getTime();
        validPackingCount++;
      }
      if (o.picked_up && o.delivered) {
        totalDeliveryTimeMs += new Date(o.delivered).getTime() - new Date(o.picked_up).getTime();
        validDeliveryCount++;
      }
    });

    const averagePackingTimeMins = validPackingCount > 0 ? (totalPackingTimeMs / validPackingCount) / 60000 : 0;
    const averageDeliveryTimeMins = validDeliveryCount > 0 ? (totalDeliveryTimeMs / validDeliveryCount) / 60000 : 0;

    return {
      averagePackingTimeMins: Number(averagePackingTimeMins.toFixed(1)),
      averageDeliveryTimeMins: Number(averageDeliveryTimeMins.toFixed(1)),
      sampleSize: completedOrders.length,
    };
  }

  // Get rider productivity leaderboards
  static async getRiderLeaderboard() {
    const ridersData = await prisma.orders.groupBy({
      by: ["delivery_man_id"],
      where: {
        order_status: "delivered",
        delivery_man_id: { not: null },
      },
      _count: {
        id: true,
      },
      _avg: {
        distance: true,
      },
    });

    const riderIds = ridersData
      .filter((r) => r.delivery_man_id !== null)
      .map((r) => r.delivery_man_id as bigint);

    const riders = await prisma.delivery_men.findMany({
      where: {
        id: { in: riderIds },
      },
      select: {
        id: true,
        f_name: true,
        l_name: true,
        phone: true,
      },
    });

    return ridersData.map((r) => {
      const rider = riders.find((rider) => rider.id === r.delivery_man_id);
      return {
        riderId: r.delivery_man_id ? String(r.delivery_man_id) : "Unknown",
        name: rider ? `${rider.f_name || ""} ${rider.l_name || ""}`.trim() : "Unknown Rider",
        phone: rider?.phone || "N/A",
        ordersCount: r._count.id,
        averageDistanceKm: Number((r._avg.distance || 0).toFixed(2)),
      };
    });
  }

  // Paginated search for active delivery boys
  static async findPaginated(params: {
    search?: string;
    statusFilter?: string;
    page: number;
    limit: number;
  }) {
    const where: Prisma.delivery_menWhereInput = {};

    if (params.statusFilter === "online") {
      where.active = true;
    } else if (params.statusFilter === "offline") {
      where.active = false;
    }

    if (params.search) {
      where.OR = [
        { f_name: { contains: params.search } },
        { l_name: { contains: params.search } },
        { phone: { contains: params.search } },
      ];
    }

    const [deliveryMen, total] = await Promise.all([
      prisma.delivery_men.findMany({
        where,
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: { created_at: "desc" },
      }),
      prisma.delivery_men.count({ where }),
    ]);

    return { deliveryMen, total };
  }

  // Get administrative delivery boy metrics
  static async getMetrics() {
    const total = await prisma.delivery_men.count();
    const online = await prisma.delivery_men.count({ where: { active: true } });
    const offline = await prisma.delivery_men.count({ where: { active: false } });
    const delivering = await prisma.delivery_men.count({ where: { current_orders: { gt: 0 } } });

    return { total, online, offline, delivering };
  }

  // Update online/active status
  static async updateActiveStatus(id: number, active: boolean) {
    return await prisma.delivery_men.update({
      where: { id: BigInt(id) },
      data: { active },
    });
  }
}
