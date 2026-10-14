import { prisma } from "@/lib/prisma";

export class MarketingRepository {
  // Get coupon performance metrics
  static async getCouponUsage() {
    const couponOrders = await prisma.orders.groupBy({
      by: ["coupon_code"],
      where: {
        coupon_code: { not: null },
        order_status: "delivered",
      },
      _sum: {
        coupon_discount_amount: true,
        order_amount: true,
      },
      _count: {
        id: true,
      },
    });

    return couponOrders.map((c) => ({
      couponCode: c.coupon_code || "Unknown",
      totalDiscountGiven: Number(c._sum.coupon_discount_amount || 0),
      totalSalesRevenue: Number(c._sum.order_amount || 0),
      ordersCount: c._count.id,
    }));
  }

  // Get most wishlisted products
  static async getWishlistTrends() {
    const wishes = await prisma.wishlists.groupBy({
      by: ["item_id"],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
      take: 20,
    });

    const itemIds = wishes
      .filter((w) => w.item_id !== null)
      .map((w) => w.item_id as bigint);

    const items = await prisma.items.findMany({
      where: {
        id: { in: itemIds },
      },
      select: {
        id: true,
        name: true,
        price: true,
      },
    });

    return wishes.map((w) => {
      const item = items.find((i) => i.id === w.item_id);
      return {
        productId: w.item_id ? String(w.item_id) : "Unknown",
        name: item?.name || "Unknown Item",
        price: Number(item?.price || 0),
        wishCount: w._count.id,
      };
    });
  }

  // Get top search trends
  static async getSearchTrends() {
    return await prisma.panel_search_trends.findMany({
      orderBy: {
        count: "desc",
      },
      take: 20,
    });
  }
}
