"use server";

import { prisma } from "@/lib/prisma";
import { serializeBigInts } from "@/lib/prisma-extension";
import { Permissions, requirePermission } from "@/lib/security/authorization";

export async function getProcurementReportData() {
  await requirePermission(Permissions.analyticsRead);

  try {
    // Get low-stock items (< 20 units)
    const lowStockItems = await prisma.items.findMany({
      where: {
        stock: { lte: 20 },
      },
      select: {
        name: true,
        stock: true,
        price: true,
        order_count: true,
      },
      take: 50,
      orderBy: { stock: "asc" },
    });

    const report = lowStockItems.map((item) => {
      const avgDailySales = Math.max(1, Math.round(item.order_count / 10)); // estimate daily rate
      const stock = item.stock ?? 0;
      const daysLeft = Number((stock / avgDailySales).toFixed(1));
      const suggestedPurchase = Math.max(50, avgDailySales * 14 - stock);

      return {
        Product: item.name || "Unnamed Product",
        Stock: stock,
        Price: `₹${Number(item.price).toFixed(2)}`,
        AvgDailySales: avgDailySales,
        DaysLeft: daysLeft,
        SuggestedPurchase: suggestedPurchase,
      };
    });

    return serializeBigInts(report);
  } catch (err) {
    console.error("getProcurementReportData error:", err);
    return [];
  }
}

export async function getVipCustomersReportData() {
  await requirePermission(Permissions.analyticsRead);

  try {
    // Find customers with highest order spend
    const topOrders = await prisma.orders.groupBy({
      by: ["user_id"],
      _sum: {
        order_amount: true,
      },
      _count: {
        id: true,
      },
      where: {
        order_status: "delivered",
        user_id: { not: null },
      },
      orderBy: {
        _sum: {
          order_amount: "desc",
        },
      },
      take: 20,
    });

    // Fetch user details for these user_ids
    const report = [];
    for (const group of topOrders) {
      if (!group.user_id) continue;
      const user = await prisma.users.findUnique({
        where: { id: group.user_id },
        select: { f_name: true, l_name: true, phone: true, email: true },
      });

      report.push({
        Name: user ? `${user.f_name || ""} ${user.l_name || ""}`.trim() : `Customer #${group.user_id}`,
        Phone: user?.phone || "N/A",
        Email: user?.email || "N/A",
        LifetimeSpend: Number(group._sum.order_amount || 0),
        TotalOrders: group._count.id,
      });
    }

    return serializeBigInts(report);
  } catch (err) {
    console.error("getVipCustomersReportData error:", err);
    return [];
  }
}

export async function getWastageReportData() {
  await requirePermission(Permissions.analyticsRead);

  try {
    // Fetch counts and sums of canceled/refunded orders
    const stats = await prisma.orders.groupBy({
      by: ["order_status"],
      _count: {
        id: true,
      },
      _sum: {
        order_amount: true,
      },
      where: {
        order_status: { in: ["canceled", "refunded"] },
      },
    });

    const canceled = stats.find((s) => s.order_status === "canceled");
    const refunded = stats.find((s) => s.order_status === "refunded");

    const report = [
      { Metric: "Canceled Order Count", Value: canceled?._count.id || 0 },
      { Metric: "Canceled Order Loss Amount (₹)", Value: Number(canceled?._sum.order_amount || 0).toFixed(2) },
      { Metric: "Refunded Order Count", Value: refunded?._count.id || 0 },
      { Metric: "Refunded Value Given (₹)", Value: Number(refunded?._sum.order_amount || 0).toFixed(2) },
    ];

    return serializeBigInts(report);
  } catch (err) {
    console.error("getWastageReportData error:", err);
    return [];
  }
}
