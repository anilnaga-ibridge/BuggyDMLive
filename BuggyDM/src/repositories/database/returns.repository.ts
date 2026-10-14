import { prisma } from "@/lib/prisma";

export class ReturnsRepository {
  // Create a returns record and perform restock if chosen
  static async createReturn(data: {
    orderId: bigint;
    packageId?: bigint | null;
    reason: string;
    images?: string[];
    action: "restock" | "damage" | "waste";
    operatorId: bigint;
  }) {
    return await prisma.$transaction(async (tx) => {
      const [order, pkg, existingReturn] = await Promise.all([
        tx.orders.findUnique({ where: { id: data.orderId }, select: { id: true } }),
        data.packageId
          ? tx.panel_packages.findUnique({
              where: { id: data.packageId },
              select: { order_id: true },
            })
          : Promise.resolve(null),
        tx.panel_returns.findFirst({
          where: data.packageId
            ? { package_id: data.packageId }
            : { order_id: data.orderId, package_id: null },
          select: { id: true },
        }),
      ]);

      if (!order) throw new Error("Order not found");
      if (data.packageId && (!pkg || pkg.order_id !== data.orderId)) {
        throw new Error("Package does not belong to this order");
      }
      if (existingReturn) throw new Error("This return has already been reconciled");

      // 1. Create return entry
      const ret = await tx.panel_returns.create({
        data: {
          order_id: data.orderId,
          package_id: data.packageId,
          reason: data.reason,
          images: data.images ? data.images.join(",") : null,
          action: data.action,
          processed_by: data.operatorId,
          processed_at: new Date()
        }
      });

      // 2. Perform inventory adjustments
      if (data.action === "restock") {
        // If packageId is present, restock package items. Else, restock all order items.
        if (data.packageId) {
          const pkgItems = await tx.panel_package_items.findMany({
            where: { package_id: data.packageId }
          });
          
          for (const item of pkgItems) {
            await tx.items.update({
              where: { id: item.item_id },
              data: {
                stock: { increment: item.quantity }
              }
            });
          }
        } else {
          const orderItems = await tx.order_details.findMany({
            where: { order_id: data.orderId }
          });

          for (const item of orderItems) {
            if (item.item_id) {
              await tx.items.update({
                where: { id: item.item_id },
                data: {
                  stock: { increment: item.quantity || 1 }
                }
              });
            }
          }
        }
      }

      // Log exception if marked as damaged or waste
      if (data.action === "damage" || data.action === "waste") {
        await tx.panel_exception_logs.create({
          data: {
            order_id: data.orderId,
            package_id: data.packageId,
            exception_type: data.action === "damage" ? "damaged_return" : "waste_return",
            details: `Return exception logged for Order ${data.orderId}: ${data.reason}`,
            reported_by: data.operatorId,
            reported_at: new Date()
          }
        });
      }

      // Update main order status to returned (or canceled) if not already
      await tx.orders.update({
        where: { id: data.orderId },
        data: {
          order_status: "canceled",
          canceled: new Date(),
          updated_at: new Date()
        }
      });

      return ret;
    });
  }

  // Get return logs
  static async findReturnsHistory() {
    return await prisma.panel_returns.findMany({
      include: {
        order: true,
        processor: {
          select: {
            f_name: true,
            l_name: true
          }
        }
      },
      orderBy: {
        processed_at: "desc"
      },
      take: 50
    });
  }
}
