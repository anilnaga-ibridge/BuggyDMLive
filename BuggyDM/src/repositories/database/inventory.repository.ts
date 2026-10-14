import { prisma } from "@/lib/prisma";

export class InventoryRepository {
  // Get stock status summaries
  static async getInventorySummary() {
    const totalItems = await prisma.items.count();
    const lowStockItems = await prisma.items.findMany({
      where: {
        stock: {
          gt: 0,
          lte: 10,
        },
      },
      select: {
        id: true,
        name: true,
        stock: true,
        price: true,
      },
      take: 20,
    });

    const outOfStockItems = await prisma.items.findMany({
      where: {
        stock: {
          lte: 0,
        },
      },
      select: {
        id: true,
        name: true,
        price: true,
      },
      take: 20,
    });

    return {
      totalItems,
      lowStock: lowStockItems.map(i => ({ id: String(i.id), name: i.name || "Unnamed Item", stock: i.stock || 0, price: Number(i.price) })),
      outOfStock: outOfStockItems.map(i => ({ id: String(i.id), name: i.name || "Unnamed Item", price: Number(i.price) })),
    };
  }

  // Generate procurement planning table
  static async getProcurementPlanner() {
    // We look at sales run rate (past 30 days) and divide stock by that to see days left.
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const salesStats = await prisma.order_details.groupBy({
      by: ["item_id"],
      where: {
        created_at: {
          gte: startDate,
        },
      },
      _sum: {
        quantity: true,
      },
    });

    const itemIds = salesStats
      .filter((s) => s.item_id !== null)
      .map((s) => s.item_id as bigint);

    const items = await prisma.items.findMany({
      where: {
        id: { in: itemIds },
      },
      select: {
        id: true,
        name: true,
        stock: true,
      },
    });

    return items.map((item) => {
      const sales30Days = salesStats.find((s) => s.item_id === item.id)?._sum.quantity || 0;
      const dailyRate = sales30Days / 30;
      const currentStock = item.stock || 0;
      const daysLeft = dailyRate > 0 ? Number((currentStock / dailyRate).toFixed(1)) : 999;
      
      // Suggest purchase if days left is below 7
      const suggestedPurchase = daysLeft < 7 ? Math.ceil(dailyRate * 14) : 0; // order 2 weeks supply

      return {
        productId: String(item.id),
        name: item.name || "Unknown Item",
        currentStock,
        avgDailySales: Number(dailyRate.toFixed(2)),
        daysLeft,
        suggestedPurchase,
      };
    }).filter((planner) => planner.daysLeft < 15); // Show items running low in the next 15 days
  }
}
