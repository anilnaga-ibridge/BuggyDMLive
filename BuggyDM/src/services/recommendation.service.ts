import { prisma } from "@/lib/prisma";
import { InventoryRepository } from "@/repositories/database/inventory.repository";
import { CostRepository } from "@/repositories/database/cost.repository";

export class RecommendationService {
  // Run rule engine to generate recommendations
  static async generateRecommendations() {
    console.log("[RecommendationService] Generating operational suggestions...");

    try {
      // Rule 1: Procurement recommendations
      const lowStockList = await InventoryRepository.getProcurementPlanner();
      for (const item of lowStockList) {
        if (item.suggestedPurchase > 0) {
          await this.createOrUpdateRecommendation({
            type: "inventory",
            title: `Procurement needed for ${item.name}`,
            description: `Current stock is ${item.currentStock} units with an average daily sales rate of ${item.avgDailySales} units. Stock is expected to last only ${item.daysLeft} days.`,
            suggestion: `Procure at least ${item.suggestedPurchase} units of ${item.name} to prevent stockout.`,
            metadata: JSON.stringify({ item_id: item.productId, suggested_qty: item.suggestedPurchase }),
          });
        }
      }

      // Rule 2: Canceled orders store warnings
      const lossyStores = await CostRepository.getLossyStores();
      for (const store of lossyStores) {
        await this.createOrUpdateRecommendation({
          type: "operations",
          title: `High cancellation rate at ${store.storeName}`,
          description: `${store.storeName} has a cancellation rate of ${store.cancellationRate}% over the last 30 days (totaling ${store.canceledOrders} canceled orders).`,
          suggestion: `Conduct a store operational audit to identify packing delays, inventory mismatches, or system issues.`,
          metadata: JSON.stringify({ store_id: store.storeId }),
        });
      }

      // Rule 3: Slow moving products suggestion
      const inactiveProductsLimitDate = new Date();
      inactiveProductsLimitDate.setDate(inactiveProductsLimitDate.getDate() - 45);

      // Find items created > 45 days ago with 0 order count or very low sales
      const slowProducts = await prisma.items.findMany({
        where: {
          created_at: {
            lte: inactiveProductsLimitDate,
          },
          order_count: {
            lte: 3,
          },
          stock: {
            gt: 20,
          },
        },
        select: {
          id: true,
          name: true,
          stock: true,
          price: true,
        },
        take: 10,
      });

      for (const item of slowProducts) {
        await this.createOrUpdateRecommendation({
          type: "pricing",
          title: `Slow moving stock: ${item.name}`,
          description: `${item.name} has only been sold 3 times or less, but we currently hold ${item.stock} units in inventory.`,
          suggestion: `Offer a 15% discount or bundle it with a popular item to clear out idle inventory and recover cash flow.`,
          metadata: JSON.stringify({ item_id: String(item.id) }),
        });
      }

      return true;
    } catch (error) {
      console.error("[RecommendationService] Failed to run rule engine:", error);
      return false;
    }
  }

  // Create helper
  private static async createOrUpdateRecommendation(data: {
    type: string;
    title: string;
    description: string;
    suggestion: string;
    metadata: string;
  }) {
    const existing = await prisma.panel_ai_recommendations.findFirst({
      where: {
        title: data.title,
        status: "pending",
      },
    });

    if (existing) {
      return await prisma.panel_ai_recommendations.update({
        where: { id: existing.id },
        data: {
          description: data.description,
          suggestion: data.suggestion,
          metadata: data.metadata,
        },
      });
    }

    return await prisma.panel_ai_recommendations.create({
      data: {
        type: data.type,
        title: data.title,
        description: data.description,
        suggestion: data.suggestion,
        status: "pending",
        metadata: data.metadata,
      },
    });
  }

  // Fetch pending recommendations
  static async getPending() {
    return await prisma.panel_ai_recommendations.findMany({
      where: { status: "pending" },
      orderBy: { created_at: "desc" },
    });
  }
}
