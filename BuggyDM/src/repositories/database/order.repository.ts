import { prisma } from "@/lib/prisma";

export class OrderRepository {
  static async findActiveOrders() {
    return await prisma.orders.findMany({
      where: {
        order_status: {
          in: ["pending", "accepted", "confirmed", "processing", "handover", "picked_up"],
        },
      },
      select: {
        id: true,
        order_amount: true,
        payment_status: true,
        order_status: true,
        created_at: true,
        delivery_address: true,
        delivery_man_id: true,
      },
      orderBy: {
        created_at: "desc",
      },
    });
  }

  static async countItemsForOrders(orderIds: bigint[]) {
    return await prisma.order_details.groupBy({
      by: ["order_id"],
      where: {
        order_id: { in: orderIds },
      },
      _count: {
        id: true,
      },
    });
  }

  static async findRidersByIds(riderIds: bigint[]) {
    return await prisma.delivery_men.findMany({
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
  }

  static async findOrderStatus(id: bigint) {
    return prisma.orders.findUnique({
      where: { id },
      select: { order_status: true },
    });
  }

  static async transitionOrderStatus(
    id: bigint,
    currentStatus: string,
    newStatus: string,
  ) {
    const now = new Date();
    const timestamps: Record<string, Date> = {};
    if (
      [
        "accepted",
        "confirmed",
        "processing",
        "handover",
        "picked_up",
        "delivered",
        "canceled",
      ].includes(newStatus)
    ) {
      timestamps[newStatus] = now;
    }

    return prisma.orders.updateMany({
      where: { id, order_status: currentStatus },
      data: {
        order_status: newStatus,
        updated_at: now,
        ...timestamps,
      },
    });
  }
}
