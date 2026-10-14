import { prisma } from "@/lib/prisma";

export class BadgeProviderService {
  /**
   * Resolve live numerical metric for a badge provider
   */
  static async resolveBadge(providerName: string | null): Promise<number | null> {
    if (!providerName) return null;

    try {
      switch (providerName) {
        case "orders_waiting": {
          return await prisma.orders.count({
            where: {
              order_status: { in: ["pending", "accepted", "confirmed"] },
            },
          });
        }

        case "packing_queue": {
          return await prisma.orders.count({
            where: {
              order_status: { in: ["processing", "picked"] },
            },
          });
        }

        case "pending_qc": {
          return await prisma.orders.count({
            where: {
              order_status: "processing",
            },
          });
        }

        case "dispatch_ready": {
          return await prisma.orders.count({
            where: {
              order_status: "handover",
            },
          });
        }

        case "critical_orders": {
          return await prisma.orders.count({
            where: {
              order_status: { in: ["pending", "accepted", "confirmed", "processing"] },
            },
          });
        }

        case "returns_pending": {
          return 0; // Dynamic returns queue
        }

        case "inventory_alert": {
          return await prisma.items.count({
            where: {
              status: true,
              stock: { lte: 5 },
            },
          });
        }

        case "offline_queue": {
          return 0; // Evaluated on client side via IndexedDB
        }

        case "failed_sync": {
          return 0;
        }

        default:
          return null;
      }
    } catch (err) {
      console.error(`Error resolving badge provider ${providerName}:`, err);
      return null;
    }
  }

  /**
   * Batch resolve badges for an array of provider names
   */
  static async batchResolveBadges(providerNames: string[]): Promise<Record<string, number | null>> {
    const results: Record<string, number | null> = {};
    const uniqueProviders = Array.from(new Set(providerNames.filter(Boolean)));
    if (uniqueProviders.length === 0) return results;

    const orderProviders = new Set([
      "orders_waiting",
      "packing_queue",
      "pending_qc",
      "dispatch_ready",
      "critical_orders",
    ]);

    const needsOrders = uniqueProviders.some((p) => orderProviders.has(p));
    const needsInventory = uniqueProviders.includes("inventory_alert");

    try {
      const [statusCounts, inventoryAlertCount] = await Promise.all([
        needsOrders
          ? prisma.orders.groupBy({
              by: ["order_status"],
              _count: { id: true },
              where: {
                order_status: {
                  in: ["pending", "accepted", "confirmed", "processing", "picked", "handover"],
                },
              },
            }).catch((err) => {
              console.error("Error in orders groupBy for badges:", err);
              return [];
            })
          : Promise.resolve([]),
        needsInventory
          ? prisma.items.count({
              where: {
                status: true,
                stock: { lte: 5 },
              },
            }).catch((err) => {
              console.error("Error in items count for inventory_alert:", err);
              return null;
            })
          : Promise.resolve(null),
      ]);

      const countByStatus: Record<string, number> = {};
      for (const row of statusCounts) {
        countByStatus[row.order_status] = row._count.id;
      }

      const getCount = (statuses: string[]) =>
        statuses.reduce((sum, s) => sum + (countByStatus[s] || 0), 0);

      for (const name of uniqueProviders) {
        switch (name) {
          case "orders_waiting":
            results[name] = getCount(["pending", "accepted", "confirmed"]);
            break;
          case "packing_queue":
            results[name] = getCount(["processing", "picked"]);
            break;
          case "pending_qc":
            results[name] = getCount(["processing"]);
            break;
          case "dispatch_ready":
            results[name] = getCount(["handover"]);
            break;
          case "critical_orders":
            results[name] = getCount(["pending", "accepted", "confirmed", "processing"]);
            break;
          case "inventory_alert":
            results[name] = inventoryAlertCount;
            break;
          case "returns_pending":
          case "offline_queue":
          case "failed_sync":
            results[name] = 0;
            break;
          default:
            results[name] = null;
        }
      }
    } catch (err) {
      console.error("Error in batchResolveBadges:", err);
      // Fallback: resolve sequentially if batch fails
      await Promise.all(
        uniqueProviders.map(async (name) => {
          results[name] = await this.resolveBadge(name);
        })
      );
    }

    return results;
  }
}
