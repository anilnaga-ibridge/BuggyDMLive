import { prisma } from "@/lib/prisma";

export class AnalyticsRepository {
  // Get main Executive KPIs (Live calculation)
  static async getExecutiveKPIs() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // 1. Today's Sales & Orders
    const todayOrders = await prisma.orders.findMany({
      where: {
        created_at: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      select: {
        order_amount: true,
        order_status: true,
      },
    });

    const todayOrdersCount = todayOrders.length;
    const todayRevenue = todayOrders
      .filter((o) => o.order_status !== "canceled")
      .reduce((sum, o) => sum + Number(o.order_amount), 0);

    const todayCancelledCount = todayOrders.filter((o) => o.order_status === "canceled").length;

    // 2. Average Order Value (AOV)
    const allCompletedOrders = await prisma.orders.aggregate({
      where: {
        order_status: "delivered",
      },
      _avg: {
        order_amount: true,
      },
      _count: {
        id: true,
      },
    });

    const averageOrderValue = Number(allCompletedOrders._avg.order_amount || 0);

    // 3. Repeat Customer Count
    const repeatCustomerCount = await prisma.users.count({
      where: {
        order_count: {
          gt: 1,
        },
      },
    });

    // 4. Inventory stats
    const lowStockCount = await prisma.items.count({
      where: {
        stock: {
          gt: 0,
          lte: 10,
        },
      },
    });

    const outOfStockCount = await prisma.items.count({
      where: {
        stock: {
          lte: 0,
        },
      },
    });

    const itemsWithStock = await prisma.items.findMany({
      where: {
        stock: {
          gt: 0,
        },
      },
      select: {
        price: true,
        stock: true,
      },
    });

    const inventoryValue = itemsWithStock.reduce(
      (sum, item) => sum + Number(item.price) * (item.stock || 0),
      0
    );

    // 5. Active/Pending deliveries
    const pendingDeliveries = await prisma.orders.count({
      where: {
        order_status: {
          in: ["pending", "accepted", "confirmed", "processing", "handover", "picked_up"],
        },
      },
    });

    return {
      todayRevenue,
      todayOrdersCount,
      todayCancelledCount,
      averageOrderValue,
      repeatCustomerCount,
      lowStockCount,
      outOfStockCount,
      inventoryValue,
      pendingDeliveries,
    };
  }

  // Get Store Comparisons
  static async getStoreSalesComparison() {
    const storeRevenues = await prisma.orders.groupBy({
      by: ["store_id"],
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

    // Fetch store names
    const storeIds = storeRevenues
      .filter((s) => s.store_id !== null)
      .map((s) => s.store_id as bigint);

    const stores = await prisma.stores.findMany({
      where: {
        id: { in: storeIds },
      },
      select: {
        id: true,
        name: true,
      },
    });

    return storeRevenues.map((s) => {
      const storeName = stores.find((store) => store.id === s.store_id)?.name || `Store #${s.store_id}`;
      return {
        storeId: s.store_id ? String(s.store_id) : "Unknown",
        storeName,
        revenue: Number(s._sum.order_amount || 0),
        ordersCount: s._count.id,
      };
    });
  }

  // Get Category distributions
  static async getCategoryDistribution() {
    const orderDetails = await prisma.order_details.groupBy({
      by: ["category_id"],
      _sum: {
        price: true,
        quantity: true,
      },
    });

    const categoryIds = orderDetails
      .filter((c) => c.category_id !== null)
      .map((c) => c.category_id as bigint);

    const categories = await prisma.categories.findMany({
      where: {
        id: { in: categoryIds },
      },
      select: {
        id: true,
        name: true,
      },
    });

    return orderDetails.map((c) => {
      const categoryName = categories.find((cat) => cat.id === c.category_id)?.name || `Category #${c.category_id}`;
      return {
        categoryId: c.category_id ? String(c.category_id) : "Unknown",
        categoryName,
        revenue: Number(c._sum.price || 0) * (c._sum.quantity || 0),
        quantity: c._sum.quantity || 0,
      };
    });
  }
}
