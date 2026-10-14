import { prisma } from "@/lib/prisma";

export class PickRepository {
  // Find orders awaiting picking
  static async findAwaitingPickingOrders() {
    return await prisma.orders.findMany({
      where: {
        order_status: "confirmed",
        panel_order_workflows: {
          none: {
            status: { in: ["Picking", "Pick Complete", "Packing", "Packed", "QC Pending", "QC Approved", "Staged", "Rider Called", "Handed Over"] }
          }
        }
      },
      select: {
        id: true,
        order_status: true,
        created_at: true,
        modules: true,
      },
      orderBy: {
        created_at: "asc",
      },
    });
  }

  // Create a new picking session for an order
  static async createPickSession(orderId: bigint, pickerId: bigint) {
    // 1. Fetch order details to generate picking items
    const details = await prisma.order_details.findMany({
      where: { order_id: orderId }
    });

    const itemIds = details
      .map((d) => d.item_id)
      .filter((id): id is bigint => id !== null);

    const items = await prisma.items.findMany({
      where: { id: { in: itemIds } },
      include: {
        panel_item_racks: true
      }
    });

    const itemsMap = new Map(items.map((i) => [String(i.id), i]));

    // 2. Start Transaction
    return await prisma.$transaction(async (tx) => {
      // Create session
      const session = await tx.panel_pick_sessions.create({
        data: {
          order_id: orderId,
          picker_id: pickerId,
          status: "picking",
          started_at: new Date(),
        },
      });

      // Populate picking items mapped to racks
      const pickItemsData = details.map((d) => {
        const itemObj = d.item_id ? itemsMap.get(String(d.item_id)) : null;
        return {
          pick_session_id: session.id,
          item_id: d.item_id || BigInt(0),
          quantity: d.quantity || 1,
          picked_qty: 0,
          status: "pending",
          rack_code: itemObj?.panel_item_racks?.rack_code || "Unassigned"
        };
      });

      await tx.panel_pick_items.createMany({
        data: pickItemsData,
      });

      // Write workflow status
      await tx.panel_order_workflows.create({
        data: {
          order_id: orderId,
          status: "Picking",
          updated_by: pickerId,
          notes: `Pick session created with ID ${session.id}`,
        },
      });

      // Update public order status to processing
      await tx.orders.update({
        where: { id: orderId },
        data: {
          order_status: "processing",
          processing: new Date(),
          updated_at: new Date(),
        },
      });

      return session;
    });
  }

  // Retrieve active pick session for a picker
  static async findActivePickSession(pickerId: bigint) {
    return await prisma.panel_pick_sessions.findFirst({
      where: {
        picker_id: pickerId,
        status: "picking",
      },
      include: {
        order: {
          include: {
            modules: true
          }
        },
        pick_items: true,
      },
    });
  }

  // Find pick session by ID
  static async findSessionById(sessionId: bigint) {
    return await prisma.panel_pick_sessions.findUnique({
      where: { id: sessionId },
      include: {
        pick_items: true,
        order: true
      }
    });
  }

  // Update status of single pick item
  static async updatePickItem(data: {
    pickItemId: bigint;
    pickedQty: number;
    status: string;
    replacementItemId?: bigint | null;
  }) {
    return await prisma.panel_pick_items.update({
      where: { id: data.pickItemId },
      data: {
        picked_qty: data.pickedQty,
        status: data.status,
        replacement_item_id: data.replacementItemId,
      },
    });
  }

  // Complete a picking session
  static async completePickSession(sessionId: bigint, walkingDistance: number, operatorId: bigint) {
    const session = await this.findSessionById(sessionId);
    if (!session) throw new Error("Pick session not found");

    return await prisma.$transaction(async (tx) => {
      // Update session
      await tx.panel_pick_sessions.update({
        where: { id: sessionId },
        data: {
          status: "completed",
          completed_at: new Date(),
          walking_distance: walkingDistance,
        },
      });

      // Update workflow state
      await tx.panel_order_workflows.create({
        data: {
          order_id: session.order_id,
          status: "Pick Complete",
          updated_by: operatorId,
          notes: `Picking completed. Walking distance: ${walkingDistance}m`,
        },
      });

      return true;
    });
  }
}
