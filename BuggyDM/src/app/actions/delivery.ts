"use server";

import { DeliveryRepository } from "@/repositories/database/delivery.repository";
import { revalidatePath } from "next/cache";
import { Permissions, requirePermission } from "@/lib/security/authorization";

export interface DeliveryBoyData {
  id: string;
  f_name: string;
  l_name: string;
  phone: string;
  email: string;
  image: string;
  active: boolean;
  status: boolean;
  current_orders: number;
  order_count: number;
}

type DeliveryManRecord = Awaited<
  ReturnType<typeof DeliveryRepository.findPaginated>
>["deliveryMen"][number];

const serializeDeliveryMan = (dm: DeliveryManRecord): DeliveryBoyData => ({
  id: String(dm.id),
  f_name: dm.f_name || "",
  l_name: dm.l_name || "",
  phone: dm.phone || "",
  email: dm.email || "",
  image: dm.image || "",
  active: Boolean(dm.active),
  status: Boolean(dm.status),
  current_orders: Number(dm.current_orders || 0),
  order_count: Number(dm.order_count || 0),
});

export async function getDeliveryBoysList(params: {
  search?: string;
  statusFilter?: string;
  page: number;
  limit: number;
}) {
  await requirePermission(Permissions.ridersRead);

  try {
    const { deliveryMen, total } = await DeliveryRepository.findPaginated(params);
    return {
      deliveryBoys: deliveryMen.map(serializeDeliveryMan),
      total,
    };
  } catch (error) {
    console.error("Error loading delivery boys:", error);
    return { deliveryBoys: [], total: 0 };
  }
}

export async function getDeliveryBoysMetrics() {
  await requirePermission(Permissions.ridersRead);

  try {
    return await DeliveryRepository.getMetrics();
  } catch (error) {
    console.error("Error loading delivery boys metrics:", error);
    return {
      total: 0,
      online: 0,
      offline: 0,
      delivering: 0,
    };
  }
}

export async function updateDeliveryBoyStatusAction(id: number, active: boolean) {
  await requirePermission(Permissions.ridersManage);

  try {
    await DeliveryRepository.updateActiveStatus(id, active);
    revalidatePath("/delivery");
    return { success: true };
  } catch (error) {
    console.error("Error updating delivery boy status:", error);
    return { success: false, error: "Failed to update status." };
  }
}
