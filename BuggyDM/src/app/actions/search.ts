"use server";

import { prisma } from "@/lib/prisma";
import { Permissions, requirePermission } from "@/lib/security/authorization";

export interface SearchResultItem {
  id: string;
  title: string;
  type: "product" | "order" | "store" | "category";
  subtitle?: string;
}

export async function globalSearch(query: string): Promise<SearchResultItem[]> {
  await requirePermission(Permissions.operationsRead);

  if (!query || query.trim().length < 2) return [];

  const sanitizedQuery = query.trim();
  const results: SearchResultItem[] = [];

  try {
    const isNumeric = /^\d+$/.test(sanitizedQuery);
    const [products, stores, categories, orders] = await Promise.all([
      prisma.items.findMany({
        where: { name: { contains: sanitizedQuery } },
        take: 5,
        select: { id: true, name: true, price: true },
      }),
      prisma.stores.findMany({
        where: { name: { contains: sanitizedQuery } },
        take: 3,
        select: { id: true, name: true, email: true },
      }),
      prisma.categories.findMany({
        where: { name: { contains: sanitizedQuery } },
        take: 3,
        select: { id: true, name: true },
      }),
      isNumeric
        ? prisma.orders.findMany({
          where: { id: BigInt(sanitizedQuery) },
          take: 3,
          select: { id: true, order_amount: true, order_status: true },
        })
        : Promise.resolve([]),
    ]);

    // Format products
    products.forEach((p) => {
      results.push({
        id: String(p.id),
        title: p.name || `Product #${p.id}`,
        type: "product",
        subtitle: `Price: ₹${Number(p.price).toFixed(2)}`,
      });
    });

    // Format stores
    stores.forEach((s) => {
      results.push({
        id: String(s.id),
        title: s.name || `Store #${s.id}`,
        type: "store",
        subtitle: s.email || "No email",
      });
    });

    // Format categories
    categories.forEach((c) => {
      results.push({
        id: String(c.id),
        title: c.name,
        type: "category",
      });
    });

    // Format orders if fetched
    if (orders) {
      orders.forEach((o) => {
        results.push({
          id: String(o.id),
          title: `Order #${o.id}`,
          type: "order",
          subtitle: `Amount: ₹${Number(o.order_amount).toFixed(2)} | Status: ${o.order_status}`,
        });
      });
    }

    return results;
  } catch (error) {
    console.error("Global search error:", error);
    return [];
  }
}
