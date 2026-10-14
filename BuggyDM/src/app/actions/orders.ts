"use server";

import { OrderRepository } from "@/repositories/database/order.repository";
import { revalidatePath } from "next/cache";
import { Permissions, requirePermission } from "@/lib/security/authorization";

const ORDER_TRANSITIONS: Readonly<Record<string, readonly string[]>> = {
  pending: ["accepted", "canceled"],
  accepted: ["confirmed", "canceled"],
  confirmed: ["processing", "canceled"],
  processing: ["handover", "canceled"],
  handover: ["picked_up"],
  picked_up: ["delivered"],
  delivered: [],
  canceled: [],
};

export interface OrderData {
  id: string;
  order_amount: number;
  payment_status: string;
  order_status: string;
  created_at: string;
  delivery_address: string;
  riderName: string;
  riderPhone: string;
  itemsCount: number;
}

export async function getActiveOrders(): Promise<OrderData[]> {
  await requirePermission(Permissions.ordersRead);

  try {
    const orders = await OrderRepository.findActiveOrders();
    const orderIds = orders.map((o) => o.id);
    const riderIds = orders
      .map((o) => o.delivery_man_id)
      .filter((id): id is bigint => id !== null);

    // Fetch details count and riders in parallel using repositories
    const [details, riders] = await Promise.all([
      OrderRepository.countItemsForOrders(orderIds),
      OrderRepository.findRidersByIds(riderIds),
    ]);

    const detailsMap = new Map(details.map((d) => [String(d.order_id), d._count.id]));
    const ridersMap = new Map(
      riders.map((r) => [
        String(r.id),
        { name: `${r.f_name || ""} ${r.l_name || ""}`.trim() || "Rider", phone: r.phone },
      ])
    );

    return orders.map((order) => {
      const rider = order.delivery_man_id ? ridersMap.get(String(order.delivery_man_id)) : null;
      return {
        id: String(order.id),
        order_amount: Number(order.order_amount),
        payment_status: order.payment_status,
        order_status: order.order_status,
        created_at: order.created_at ? order.created_at.toISOString() : new Date().toISOString(),
        delivery_address: order.delivery_address || "",
        riderName: rider?.name || "Unassigned",
        riderPhone: rider?.phone || "",
        itemsCount: detailsMap.get(String(order.id)) || 0,
      };
    });
  } catch (error) {
    console.error("Error fetching active orders:", error);
    return [];
  }
}

export async function updateOrderStatus(orderId: string, newStatus: string): Promise<{ success: boolean; error?: string }> {
  await requirePermission(Permissions.ordersManage);

  try {
    if (!/^\d+$/.test(orderId) || !(newStatus in ORDER_TRANSITIONS)) {
      return { success: false, error: "Invalid order status value." };
    }

    const id = BigInt(orderId);
    const current = await OrderRepository.findOrderStatus(id);
    if (!current) return { success: false, error: "Order not found." };
    if (!ORDER_TRANSITIONS[current.order_status]?.includes(newStatus)) {
      return {
        success: false,
        error: `Cannot move an order from ${current.order_status} to ${newStatus}.`,
      };
    }

    const result = await OrderRepository.transitionOrderStatus(
      id,
      current.order_status,
      newStatus,
    );
    if (result.count !== 1) {
      return {
        success: false,
        error: "The order changed elsewhere. Refresh and try again.",
      };
    }

    revalidatePath("/orders");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to update status." };
  }
}
