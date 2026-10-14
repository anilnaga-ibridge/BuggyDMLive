"use server";

import { prisma } from "@/lib/prisma";
import { serializeBigInts } from "@/lib/prisma-extension";
import { SpatialIndexer } from "@/lib/qcom/spatial.indexer";
import { IncentiveGateEngine } from "@/lib/qcom/incentive-gate.engine";
import { Permissions, requirePermission } from "@/lib/security/authorization";
import { getErrorMessage } from "@/lib/errors";

export async function getRidersForDashboard() {
  await requirePermission(Permissions.ridersRead);
  try {
    const riders = await prisma.delivery_men.findMany({
      where: { active: true },
      select: {
        id: true,
        f_name: true,
        l_name: true,
        phone: true,
        shift_status: true,
      },
      orderBy: [{ f_name: "asc" }, { id: "asc" }],
      take: 200,
    });
    return serializeBigInts(riders.map((rider) => ({
      id: rider.id.toString(),
      name: `${rider.f_name || ""} ${rider.l_name || ""}`.trim() || `Rider #${rider.id}`,
      phone: rider.phone,
      shiftStatus: rider.shift_status || "Offline",
    })));
  } catch (error) {
    console.error("getRidersForDashboard error:", error);
    throw new Error(getErrorMessage(error, "Failed to fetch riders"));
  }
}

export async function getRiderProfile(riderId: string) {
  await requirePermission(Permissions.ridersRead);

  try {
    const rider = await prisma.delivery_men.findUnique({
      where: { id: BigInt(riderId) },
      include: {
        sessions: {
          orderBy: { check_in_at: "desc" },
          take: 1
        },
        payout_logs: {
          take: 10,
          orderBy: { created_at: "desc" }
        }
      }
    });

    if (!rider) throw new Error("Rider not found");

    const [latestSession] = rider.sessions;
    const sessionMetrics = latestSession || {
      orders_completed: 0,
      orders_accepted: 0,
      orders_rejected: 0,
      payout_total: 0
    };

    const incentiveState = IncentiveGateEngine.evaluateMilestones(
      sessionMetrics.orders_completed,
      sessionMetrics.orders_accepted,
      sessionMetrics.orders_rejected
    );

    const assignedOrders = await prisma.orders.findMany({
      where: {
        delivery_man_id: rider.id,
        order_status: { in: ["handover", "picked_up"] },
      },
      select: {
        id: true,
        order_status: true,
        qcom_stage: true,
        delivery_address: true,
        distance: true,
        delivery_charge: true,
        dm_tips: true,
        picked_up: true,
      },
      orderBy: { updated_at: "desc" },
      take: 20,
    });

    const fullName = [rider.f_name, rider.l_name].filter(Boolean).join(" ") || `Rider #${rider.id}`;

    return serializeBigInts({
      rider: {
        id: rider.id.toString(),
        name: fullName,
        phone: rider.phone,
        vehicleType: rider.vehicle_type,
        status: rider.shift_status,
        latitude: rider.latitude,
        longitude: rider.longitude,
        rating: rider.rating
      },
      session: sessionMetrics,
      incentiveState,
      payoutLogs: rider.payout_logs,
      assignedOrders,
    });
  } catch (error) {
    console.error("getRiderProfile error:", error);
    throw new Error(getErrorMessage(error, "Failed to fetch rider profile"));
  }
}

export async function toggleRiderShiftStatus(riderId: string, status: string) {
  await requirePermission(Permissions.ridersManage);

  try {
    const allowedStatuses = ["Online", "On Break", "Offline", "Cash Settlement"];
    if (!allowedStatuses.includes(status)) throw new Error("Invalid rider shift status");
    const updated = await prisma.delivery_men.update({
      where: { id: BigInt(riderId) },
      data: { shift_status: status }
    });

    return serializeBigInts(updated);
  } catch (err) {
    console.error("toggleRiderShiftStatus error:", err);
    throw new Error("Failed to update shift status");
  }
}

export async function updateRiderGpsLocation(riderId: string, latitude: number, longitude: number) {
  await requirePermission(Permissions.ridersManage);

  try {
    // 1. Update MariaDB
    await prisma.delivery_men.update({
      where: { id: BigInt(riderId) },
      data: {
        latitude,
        longitude,
        last_ping_at: new Date()
      }
    });

    // 2. Update Redis Spatial Index (sub-10ms)
    await SpatialIndexer.updateRiderLocation(riderId, latitude, longitude);

    return { success: true };
  } catch (err) {
    console.error("updateRiderGpsLocation error:", err);
    return { success: false };
  }
}
