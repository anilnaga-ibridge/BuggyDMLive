"use server";

import { PickRepository } from "@/repositories/database/pick.repository";
import { PackRepository } from "@/repositories/database/pack.repository";
import { QcRepository } from "@/repositories/database/qc.repository";
import { DispatchRepository } from "@/repositories/database/dispatch.repository";
import { ReturnsRepository } from "@/repositories/database/returns.repository";
import { prisma } from "@/lib/prisma";
import { Permissions, requirePermission } from "@/lib/security/authorization";
import { serializeBigInts } from "@/lib/prisma-extension";
import { getErrorMessage } from "@/lib/errors";

type ReturnAction = "restock" | "damage" | "waste";

function isReturnAction(value: string): value is ReturnAction {
  return value === "restock" || value === "damage" || value === "waste";
}

// ==========================================
// 1. PICKING WORKSTATION ACTIONS
// ==========================================

export async function getAwaitingPickingOrders() {
  await requirePermission(Permissions.operationsRead);

  try {
    const dbOrders = await PickRepository.findAwaitingPickingOrders();
    const mapped = dbOrders.map((o) => ({
      id: o.id.toString(),
      customer: `Customer #${o.id}`,
      itemsCount: 0,
      status: "Awaiting Picking",
    }));
    return serializeBigInts(mapped);
  } catch (error) {
    console.error("getAwaitingPickingOrders error:", error);
    throw new Error(getErrorMessage(error, "Failed to fetch orders"));
  }
}

export async function startPickingSession(orderId: string, _pickerId: string) {
  const actor = await requirePermission(Permissions.operationsExecute);
  void _pickerId;

  try {
    const pickerId = BigInt(actor.userId);
    await PickRepository.createPickSession(BigInt(orderId), pickerId);
    const active = await PickRepository.findActivePickSession(pickerId);
    if (!active) throw new Error("Picking session was not created");
    const itemIds = active.pick_items.map((item) => item.item_id);
    const items = await prisma.items.findMany({
      where: { id: { in: itemIds } }
    });
    const itemsMap = new Map(items.map((item) => [item.id.toString(), item]));
    const pickItemsWithNames = active.pick_items.map((item) => ({
      ...item,
      name: itemsMap.get(item.item_id.toString())?.name || `Item #${item.item_id}`,
    }));

    return serializeBigInts({ ...active, pick_items: pickItemsWithNames });
  } catch (error) {
    console.error("startPickingSession error:", error);
    throw new Error(getErrorMessage(error, "Failed to start picking session"));
  }
}

export async function getActivePickSession(pickerId: string) {
  await requirePermission(Permissions.operationsRead);

  try {
    const active = await PickRepository.findActivePickSession(BigInt(pickerId));
    if (!active) return null;
    const itemIds = active.pick_items.map((item) => item.item_id);
    const items = await prisma.items.findMany({
      where: { id: { in: itemIds } }
    });
    const itemsMap = new Map(items.map((item) => [item.id.toString(), item]));
    const pickItemsWithNames = active.pick_items.map((item) => ({
      ...item,
      name: itemsMap.get(item.item_id.toString())?.name || `Item #${item.item_id}`,
    }));

    return serializeBigInts({ ...active, pick_items: pickItemsWithNames });
  } catch (error) {
    console.error("getActivePickSession error:", error);
    throw new Error(getErrorMessage(error, "Failed to fetch active session"));
  }
}

export async function updatePickItemStatus(
  pickItemId: string,
  pickedQty: number,
  status: string,
  replacementItemId?: string
) {
  await requirePermission(Permissions.operationsExecute);

  try {
    const res = await PickRepository.updatePickItem({
      pickItemId: BigInt(pickItemId),
      pickedQty,
      status,
      replacementItemId: replacementItemId ? BigInt(replacementItemId) : null,
    });
    return serializeBigInts(res);
  } catch (error) {
    console.error("updatePickItemStatus error:", error);
    throw new Error(getErrorMessage(error, "Failed to update pick item"));
  }
}

export async function completePickingSession(sessionId: string, walkingDistance: number, _operatorId: string) {
  const actor = await requirePermission(Permissions.operationsExecute);
  void _operatorId;

  try {
    const res = await PickRepository.completePickSession(BigInt(sessionId), walkingDistance, BigInt(actor.userId));
    return serializeBigInts(res);
  } catch (error) {
    console.error("completePickingSession error:", error);
    throw new Error(getErrorMessage(error, "Failed to complete picking"));
  }
}

// ==========================================
// 2. PACKING WORKSTATION ACTIONS
// ==========================================

export async function getAwaitingPackingOrders() {
  await requirePermission(Permissions.operationsRead);

  try {
    const dbOrders = await PackRepository.findAwaitingPackingOrders();
    const mapped = dbOrders.map((o) => ({
      id: o.id.toString(),
      customer: `Customer #${o.id}`,
      itemsCount: 0,
      status: "Packing Queue",
    }));
    return serializeBigInts(mapped);
  } catch (error) {
    console.error("getAwaitingPackingOrders error:", error);
    throw new Error(getErrorMessage(error, "Failed to fetch packing orders"));
  }
}

export async function startPackingSession(orderId: string, _packerId: string) {
  const actor = await requirePermission(Permissions.operationsExecute);
  void _packerId;

  try {
    const session = await PackRepository.createPackSession(BigInt(orderId), BigInt(actor.userId));
    const items = await PackRepository.getItemsToPack(BigInt(orderId));
    return serializeBigInts({
      session,
      items: items.map((i) => ({
        id: i.id.toString(),
        itemId: i.item_id ? i.item_id.toString() : "0",
        name: i.items?.name || `Item #${i.item_id}`,
        quantity: i.quantity,
      })),
    });
  } catch (error) {
    console.error("startPackingSession error:", error);
    throw new Error(getErrorMessage(error, "Failed to start packing session"));
  }
}

export async function createPackedPackage(data: {
  orderId: string;
  packSessionId: string;
  weight: number;
  packagingType: string;
  items: { itemId: string; quantity: number }[];
}) {
  await requirePermission(Permissions.operationsExecute);

  try {
    const pkg = await PackRepository.createPackage({
      orderId: BigInt(data.orderId),
      packSessionId: BigInt(data.packSessionId),
      weight: data.weight,
      packagingType: data.packagingType,
      items: data.items.map((i) => ({
        itemId: BigInt(i.itemId),
        quantity: i.quantity,
      })),
    });
    return serializeBigInts({
      ...pkg,
      packaging_type: data.packagingType,
    });
  } catch (error) {
    console.error("createPackedPackage error:", error);
    throw new Error(getErrorMessage(error, "Failed to create packed package"));
  }
}

export async function completePackingSession(packSessionId: string, _packerId: string) {
  const actor = await requirePermission(Permissions.operationsExecute);
  void _packerId;

  try {
    const res = await PackRepository.completePackSession(BigInt(packSessionId), BigInt(actor.userId));
    return serializeBigInts(res);
  } catch (error) {
    console.error("completePackingSession error:", error);
    throw new Error(getErrorMessage(error, "Failed to finalize packing"));
  }
}

// ==========================================
// 3. QC WORKSTATION ACTIONS
// ==========================================

export async function getAwaitingQcPackages() {
  await requirePermission(Permissions.operationsRead);

  try {
    const pkgs = await QcRepository.findPendingQcPackages();
    return serializeBigInts(pkgs.map((p) => ({
      id: p.id.toString(),
      orderId: p.order_id.toString(),
      weight: p.weight,
      packagingType: p.pack_session.packaging_type,
      status: "QC Pending",
    })));
  } catch (error) {
    console.error("getAwaitingQcPackages error:", error);
    throw new Error(getErrorMessage(error, "Failed to fetch packages for QC"));
  }
}

export async function submitQualityCheck(data: {
  packageId: string;
  status: "approved" | "rejected";
  notes?: string;
  checklist: {
    correctProducts: boolean;
    correctQuantity: boolean;
    sealChecked: boolean;
    labelPrinted: boolean;
    tempItemsChecked: boolean;
    fragileItemsChecked: boolean;
  };
}) {
  const actor = await requirePermission(Permissions.operationsExecute);

  try {
    const res = await QcRepository.createQcSession({
      packageId: BigInt(data.packageId),
      checkerId: BigInt(actor.userId),
      status: data.status,
      notes: data.notes,
      checklist: data.checklist,
    });
    return serializeBigInts(res);
  } catch (error) {
    console.error("submitQualityCheck error:", error);
    throw new Error(getErrorMessage(error, "Failed to submit quality check"));
  }
}

// ==========================================
// 4. DISPATCH WORKSTATION ACTIONS
// ==========================================

export async function getStagedShelves() {
  await requirePermission(Permissions.operationsRead);

  try {
    const racks = await DispatchRepository.findDispatchRacks();
    return serializeBigInts(racks);
  } catch (error) {
    console.error("getStagedShelves error:", error);
    throw new Error(getErrorMessage(error, "Failed to fetch staged shelves"));
  }
}

export async function getPendingWaitingRiders() {
  await requirePermission(Permissions.operationsRead);

  try {
    const riders = await DispatchRepository.findWaitingRiders();
    return serializeBigInts(riders);
  } catch (error) {
    console.error("getPendingWaitingRiders error:", error);
    throw new Error(getErrorMessage(error, "Failed to fetch riders"));
  }
}

export async function stagePackageToShelf(packageBarcode: string, rackCode: string) {
  const actor = await requirePermission(Permissions.operationsExecute);

  try {
    const normalizedBarcode = packageBarcode.trim();
    const normalizedRackCode = rackCode.trim();
    if (!normalizedBarcode || !normalizedRackCode) {
      throw new Error("Package barcode and shelf are required");
    }

    const isNumeric = /^\d+$/.test(normalizedBarcode);
    const pkg = await prisma.panel_packages.findFirst({
      where: {
        OR: [
          { package_id: normalizedBarcode },
          ...(isNumeric ? [{ id: BigInt(normalizedBarcode) }] : []),
        ],
      },
      select: { id: true },
    });
    if (!pkg) throw new Error("Package not found");

    const rack = await prisma.panel_dispatch_racks.findFirst({
      where: { name: normalizedRackCode },
      select: { id: true },
    });
    if (!rack) throw new Error("Dispatch shelf not found");

    const res = await DispatchRepository.stagePackage(pkg.id, rack.id, BigInt(actor.userId));
    return serializeBigInts(res);
  } catch (error) {
    console.error("stagePackageToShelf error:", error);
    throw new Error(getErrorMessage(error, "Failed to stage package to shelf"));
  }
}

export async function reconcileHandover(packageBarcodes: string[], deliveryManId: string) {
  const actor = await requirePermission(Permissions.operationsExecute);

  try {
    const res = await DispatchRepository.handoverPackages({
      riderId: BigInt(deliveryManId),
      packageBarcodes: packageBarcodes,
      dispatcherId: BigInt(actor.userId)
    });
    return serializeBigInts(res);
  } catch (error) {
    console.error("reconcileHandover error:", error);
    throw new Error(getErrorMessage(error, "Failed to complete handover"));
  }
}

// ==========================================
// 5. INVENTORY & STOCK ADJUSTMENT ACTIONS
// ==========================================

export async function searchItemByBarcode(barcode: string) {
  await requirePermission(Permissions.operationsRead);

  try {
    const isNumeric = /^\d+$/.test(barcode);
    const item = await prisma.items.findFirst({
      where: isNumeric
        ? { OR: [{ id: BigInt(barcode) }, { name: { contains: barcode } }] }
        : { name: { contains: barcode } },
      include: {
        panel_item_racks: true,
      },
    });
    return serializeBigInts(item);
  } catch (error) {
    console.error("searchItemByBarcode error:", error);
    return null;
  }
}

export async function adjustInventoryItem(itemId: string, stock: number, rackCode: string) {
  const actor = await requirePermission(Permissions.operationsExecute);

  try {
    const normalizedRackCode = rackCode.trim().toUpperCase();
    if (!Number.isSafeInteger(stock) || stock < 0) {
      throw new Error("Stock must be a non-negative whole number");
    }
    if (!normalizedRackCode || normalizedRackCode.length > 100) {
      throw new Error("A valid rack code is required");
    }

    const rack = await prisma.$transaction(async (tx) => {
      const current = await tx.items.findUnique({
        where: { id: BigInt(itemId) },
        select: { stock: true },
      });
      if (!current) throw new Error("Inventory item not found");

      await tx.items.update({
        where: { id: BigInt(itemId) },
        data: { stock },
      });
      const updatedRack = await tx.panel_item_racks.upsert({
        where: { item_id: BigInt(itemId) },
        update: { rack_code: normalizedRackCode },
        create: { item_id: BigInt(itemId), rack_code: normalizedRackCode },
      });
      await tx.panel_activity_logs.create({
        data: {
          admin_id: BigInt(actor.userId),
          action: "INVENTORY_ADJUSTMENT",
          table_name: "items",
          record_id: BigInt(itemId),
          old_value: JSON.stringify({ stock: current.stock }),
          new_value: JSON.stringify({ stock, rackCode: normalizedRackCode }),
          ip_address: "server-action",
        },
      });
      return updatedRack;
    });

    return serializeBigInts(rack);
  } catch (error) {
    console.error("adjustInventoryItem error:", error);
    throw new Error(getErrorMessage(error, "Failed to adjust inventory item"));
  }
}

// ==========================================
// 6. RETURNS WORKSTATION ACTIONS
// ==========================================

export async function getReturnsQueue() {
  await requirePermission(Permissions.operationsRead);

  try {
    const returns = await ReturnsRepository.findReturnsHistory();
    return serializeBigInts(returns);
  } catch (error) {
    console.error("getReturnsQueue error:", error);
    throw new Error(getErrorMessage(error, "Failed to fetch returns history"));
  }
}

export async function reconcileReturnedOrder(
  orderId: string,
  reason: string,
  action: string,
  packageId?: string,
  images: string[] = [],
) {
  const actor = await requirePermission(Permissions.operationsExecute);

  try {
    if (!isReturnAction(action)) throw new Error("Invalid return action");
    const normalizedReason = reason.trim();
    if (normalizedReason.length < 3 || normalizedReason.length > 500) {
      throw new Error("Return reason must be between 3 and 500 characters");
    }
    if (images.length > 5 || images.some((image) => !image.startsWith("/BuggyDm/uploads/"))) {
      throw new Error("Invalid return proof images");
    }
    const res = await ReturnsRepository.createReturn({
      orderId: BigInt(orderId),
      packageId: packageId ? BigInt(packageId) : null,
      reason: normalizedReason,
      images,
      action,
      operatorId: BigInt(actor.userId)
    });
    return serializeBigInts(res);
  } catch (error) {
    console.error("reconcileReturnedOrder error:", error);
    throw new Error(getErrorMessage(error, "Failed to process returned order"));
  }
}

export async function getReturnedOrderDetails(orderIdOrBarcode: string) {
  await requirePermission(Permissions.operationsRead);

  try {
    let orderId = orderIdOrBarcode;
    let packageId: string | null = null;
    let packageRecordId: string | null = null;
    
    if (orderIdOrBarcode.startsWith("PKG-") || orderIdOrBarcode.includes("-")) {
      const pkg = await prisma.panel_packages.findUnique({
        where: { package_id: orderIdOrBarcode }
      });
      if (pkg) {
        orderId = pkg.order_id.toString();
        packageId = pkg.package_id;
        packageRecordId = pkg.id.toString();
      }
    }
    
    const order = await prisma.orders.findUnique({
      where: { id: BigInt(orderId) },
      include: {
        modules: true
      }
    });
    
    if (!order) {
      throw new Error(`Order #${orderId} not found`);
    }
    
    const details = await prisma.order_details.findMany({
      where: { order_id: BigInt(orderId) }
    });
    
    const itemIds = details.map((d) => d.item_id).filter((id): id is bigint => id !== null);
    const items = await prisma.items.findMany({
      where: { id: { in: itemIds } }
    });
    
    const itemsMap = new Map(items.map((i) => [i.id.toString(), i]));
    
    return serializeBigInts({
      orderId: order.id.toString(),
      packageId: packageId || `PKG-ORDER-${order.id}`,
      packageRecordId,
      customer: `Customer #${order.id}`,
      amount: Number(order.order_amount || 0.0),
      items: details.map((d) => {
        const itemObj = itemsMap.get(d.item_id?.toString() || "");
        return itemObj?.name || `Item #${d.item_id}`;
      })
    });
  } catch (error) {
    console.error("getReturnedOrderDetails error:", error);
    throw new Error(getErrorMessage(error, "Failed to fetch returned order details"));
  }
}

// ==========================================
// 7. SUPERVISOR & MANAGER LIVE DATA ACTIONS
// ==========================================

export async function getSupervisorDashboardMetrics() {
  await requirePermission(Permissions.operationsRead);

  try {
    const [delayedPicks, qcPending, activePackers, ridersWaiting, rawExceptions, adminsList, assignments] = await Promise.all([
      prisma.orders.count({
        where: { order_status: { in: ["pending", "accepted", "confirmed"] } }
      }),
      prisma.orders.count({
        where: { order_status: "processing" }
      }),
      prisma.admins.count({
        where: { is_logged_in: true }
      }),
      prisma.orders.count({
        where: { order_status: "handover" }
      }),
      prisma.panel_exception_logs.findMany({
        take: 10,
        orderBy: { reported_at: "desc" }
      }),
      prisma.admins.findMany({
        select: { id: true, f_name: true, l_name: true, email: true }
      }),
      prisma.panel_station_assignments.findMany({
        include: {
          operator: {
            select: { f_name: true, l_name: true, email: true },
          },
        },
        orderBy: { assigned_at: "desc" },
      })
    ]);

    const exceptions = rawExceptions.map((ex) => ({
      id: ex.id.toString(),
      orderId: ex.order_id ? ex.order_id.toString() : "N/A",
      type: ex.exception_type,
      details: ex.details,
      status: ex.resolved_at ? "resolved" : "pending",
    }));

    const operators = adminsList.map((a) => ({
      id: a.id.toString(),
      name: `${a.f_name || ""} ${a.l_name || ""}`.trim() || a.email,
    }));

    const stations = assignments.map((assignment) => ({
      id: assignment.id.toString(),
      stationType: assignment.station_type,
      stationIdentifier: assignment.station_identifier,
      name: `${assignment.station_type}${assignment.station_identifier ? ` — ${assignment.station_identifier}` : ""}`,
      status: assignment.status,
      operatorName:
        `${assignment.operator.f_name || ""} ${assignment.operator.l_name || ""}`.trim() ||
        assignment.operator.email,
      assignedAt: assignment.assigned_at,
    }));

    return serializeBigInts({
      delayedPicks,
      qcPending,
      activePackers,
      ridersWaiting,
      exceptions,
      operators,
      stations,
    });
  } catch (error) {
    console.error("getSupervisorDashboardMetrics error:", error);
    return {
      delayedPicks: 0,
      qcPending: 0,
      activePackers: 0,
      ridersWaiting: 0,
      exceptions: [],
      operators: [],
      stations: [],
    };
  }
}

const STATION_TYPES = ["Picking", "Packing", "QC", "Dispatch", "Inventory", "Returns"] as const;
type StationType = (typeof STATION_TYPES)[number];

function isStationType(value: string): value is StationType {
  return STATION_TYPES.some((type) => type === value);
}

export async function assignOperatorToStation(
  adminId: string,
  stationType: string,
  stationIdentifier?: string,
) {
  const actor = await requirePermission(Permissions.operationsManage);
  void actor;
  if (!isStationType(stationType)) throw new Error("Invalid station type");
  const identifier = stationIdentifier?.trim() || null;
  if (identifier && identifier.length > 100) throw new Error("Station identifier is too long");

  try {
    const result = await prisma.$transaction(async (tx) => {
      const admin = await tx.admins.findUnique({
        where: { id: BigInt(adminId) },
        select: { id: true },
      });
      if (!admin) throw new Error("Operator not found");

      await tx.panel_station_assignments.updateMany({
        where: { admin_id: admin.id, status: { in: ["active", "paused"] } },
        data: { status: "inactive" },
      });
      return tx.panel_station_assignments.create({
        data: {
          admin_id: admin.id,
          station_type: stationType,
          station_identifier: identifier,
          status: "active",
        },
      });
    });
    return serializeBigInts(result);
  } catch (error) {
    console.error("assignOperatorToStation error:", error);
    throw new Error(getErrorMessage(error, "Failed to assign operator"));
  }
}

export async function updateStationAssignmentStatus(
  assignmentId: string,
  status: "active" | "paused",
) {
  await requirePermission(Permissions.operationsManage);
  try {
    const result = await prisma.panel_station_assignments.update({
      where: { id: BigInt(assignmentId) },
      data: { status },
    });
    return serializeBigInts(result);
  } catch (error) {
    console.error("updateStationAssignmentStatus error:", error);
    throw new Error(getErrorMessage(error, "Failed to update station status"));
  }
}

export async function resolveOperationsException(exceptionId: string, resolution: string) {
  const actor = await requirePermission(Permissions.operationsManage);
  const normalizedResolution = resolution.trim();
  if (normalizedResolution.length < 3 || normalizedResolution.length > 500) {
    throw new Error("Resolution must be between 3 and 500 characters");
  }
  try {
    const result = await prisma.panel_exception_logs.updateMany({
      where: { id: BigInt(exceptionId), resolved_at: null },
      data: {
        resolved_by: BigInt(actor.userId),
        resolved_at: new Date(),
        resolution_action: normalizedResolution,
      },
    });
    if (result.count !== 1) throw new Error("Exception is missing or already resolved");
    return { success: true };
  } catch (error) {
    console.error("resolveOperationsException error:", error);
    throw new Error(getErrorMessage(error, "Failed to resolve exception"));
  }
}

export async function getManagerDashboardMetrics() {
  await requirePermission(Permissions.operationsRead);

  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [totalOrdersToday, deliveredToday, pendingOrders, recommendations] = await Promise.all([
      prisma.orders.count({
        where: { created_at: { gte: todayStart } }
      }),
      prisma.orders.count({
        where: { order_status: "delivered", updated_at: { gte: todayStart } }
      }),
      prisma.orders.count({
        where: { order_status: { in: ["pending", "processing", "handover"] } }
      }),
      prisma.panel_ai_recommendations.findMany({
        where: { status: "pending" },
        orderBy: { created_at: "desc" },
        take: 10,
      }),
    ]);

    const processedOrders = deliveredToday;
    const slaPercentage = totalOrdersToday > 0 ? ((deliveredToday / totalOrdersToday) * 100).toFixed(1) : "0.0";

    return serializeBigInts({
      processedOrders: processedOrders.toString(),
      slaCompliance: `${slaPercentage}%`,
      pendingOrders,
      avgPickTime: "N/A",
      avgPackTime: "N/A",
      handoverSlaSecs: 0,
      recommendations: recommendations.map((recommendation) => ({
        id: recommendation.id.toString(),
        title: recommendation.title,
        description: recommendation.description,
        action: recommendation.suggestion,
        type: recommendation.type,
      })),
    });
  } catch (error) {
    console.error("getManagerDashboardMetrics error:", error);
    return {
      processedOrders: "0",
      slaCompliance: "0.0%",
      pendingOrders: 0,
      avgPickTime: "N/A",
      avgPackTime: "N/A",
      handoverSlaSecs: 0,
      recommendations: []
    };
  }
}

export async function resolveManagerRecommendation(
  recommendationId: string,
  status: "applied" | "dismissed",
) {
  await requirePermission(Permissions.operationsManage);
  try {
    const result = await prisma.panel_ai_recommendations.updateMany({
      where: { id: BigInt(recommendationId), status: "pending" },
      data: { status },
    });
    if (result.count !== 1) throw new Error("Recommendation is missing or already resolved");
    return { success: true };
  } catch (error) {
    console.error("resolveManagerRecommendation error:", error);
    throw new Error(getErrorMessage(error, "Failed to resolve recommendation"));
  }
}
