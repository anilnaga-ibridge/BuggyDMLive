import { prisma } from "@/lib/prisma";

export class CustomerRepository {
  // Get customer counts & growth stats
  static async getCustomerGrowth() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);

    const newCustomersToday = await prisma.users.count({
      where: {
        created_at: { gte: today },
      },
    });

    const newCustomersThisWeek = await prisma.users.count({
      where: {
        created_at: { gte: weekAgo },
      },
    });

    const newCustomersThisMonth = await prisma.users.count({
      where: {
        created_at: { gte: monthAgo },
      },
    });

    const totalCustomers = await prisma.users.count();

    return {
      newCustomersToday,
      newCustomersThisWeek,
      newCustomersThisMonth,
      totalCustomers,
    };
  }

  // Get high value customers (spend >= 25,000)
  static async getHighValueCustomers(minSpend: number = 25000) {
    const highValueOrders = await prisma.orders.groupBy({
      by: ["user_id"],
      where: {
        order_status: "delivered",
      },
      _sum: {
        order_amount: true,
      },
      _count: {
        id: true,
      },
      having: {
        order_amount: {
          _sum: {
            gte: minSpend,
          },
        },
      },
      orderBy: {
        _sum: {
          order_amount: "desc",
        },
      },
      take: 20,
    });

    const userIds = highValueOrders
      .filter((o) => o.user_id !== null)
      .map((o) => o.user_id as bigint);

    const users = await prisma.users.findMany({
      where: {
        id: { in: userIds },
      },
      select: {
        id: true,
        f_name: true,
        l_name: true,
        email: true,
        phone: true,
      },
    });

    return highValueOrders.map((o) => {
      const user = users.find((u) => u.id === o.user_id);
      return {
        userId: o.user_id ? String(o.user_id) : "Guest",
        name: user ? `${user.f_name || ""} ${user.l_name || ""}`.trim() : "Unknown Customer",
        email: user?.email || "N/A",
        phone: user?.phone || "N/A",
        totalSpent: Number(o._sum.order_amount || 0),
        ordersCount: o._count.id,
      };
    });
  }

  // Identify customers who haven't ordered in 45 days
  static async getInactiveCustomers(daysLimit: number = 45) {
    const limitDate = new Date();
    limitDate.setDate(limitDate.getDate() - daysLimit);

    // Get users whose last order was before limitDate
    // Or users who registered more than 45 days ago but have 0 orders
    const latestOrders = await prisma.orders.groupBy({
      by: ["user_id"],
      where: {
        order_status: "delivered",
      },
      _max: {
        created_at: true,
      },
    });

    const inactiveUserIds = latestOrders
      .filter((o) => o.user_id !== null && o._max.created_at && o._max.created_at < limitDate)
      .map((o) => o.user_id as bigint);

    const inactiveUsers = await prisma.users.findMany({
      where: {
        id: { in: inactiveUserIds },
      },
      select: {
        id: true,
        f_name: true,
        l_name: true,
        phone: true,
        email: true,
      },
      take: 50,
    });

    return inactiveUsers.map((u) => {
      const lastOrderDate = latestOrders.find((o) => o.user_id === u.id)?._max.created_at;
      return {
        userId: String(u.id),
        name: `${u.f_name || ""} ${u.l_name || ""}`.trim(),
        email: u.email || "N/A",
        phone: u.phone || "N/A",
        lastOrderDate: lastOrderDate ? lastOrderDate.toISOString() : "Never",
      };
    });
  }
}
