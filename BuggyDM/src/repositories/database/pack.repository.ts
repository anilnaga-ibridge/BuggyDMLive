import { prisma } from "@/lib/prisma";

export class PackRepository {
  // Find orders awaiting packing
  static async findAwaitingPackingOrders() {
    return await prisma.orders.findMany({
      where: {
        panel_order_workflows: {
          some: {
            status: "Pick Complete"
          },
          none: {
            status: { in: ["Packing", "Packed", "QC Pending", "QC Approved", "Staged", "Rider Called", "Handed Over"] }
          }
        }
      },
      select: {
        id: true,
        order_status: true,
        updated_at: true,
        modules: true,
      },
      orderBy: {
        updated_at: "asc",
      },
    });
  }

  // Start packing session
  static async createPackSession(orderId: bigint, packerId: bigint) {
    return await prisma.$transaction(async (tx) => {
      const session = await tx.panel_pack_sessions.create({
        data: {
          order_id: orderId,
          packer_id: packerId,
          status: "packing",
          started_at: new Date(),
          packaging_type: "Medium Bag",
          weight: 0.0
        }
      });

      await tx.panel_order_workflows.create({
        data: {
          order_id: orderId,
          status: "Packing",
          updated_by: packerId,
          notes: `Packing session initiated with ID ${session.id}`
        }
      });

      return session;
    });
  }

  // Find active packing session for packer
  static async findActivePackSession(packerId: bigint) {
    return await prisma.panel_pack_sessions.findFirst({
      where: {
        packer_id: packerId,
        status: "packing"
      },
      include: {
        order: {
          include: {
            order_edit_logs: true
          }
        },
        packages: {
          include: {
            package_items: true
          }
        }
      }
    });
  }

  // Get order items that need to be packed
  static async getItemsToPack(orderId: bigint) {
    const details = await prisma.order_details.findMany({
      where: { order_id: orderId }
    });

    const itemIds = details
      .map((d) => d.item_id)
      .filter((id): id is bigint => id !== null);

    const items = await prisma.items.findMany({
      where: { id: { in: itemIds } }
    });

    const itemsMap = new Map(items.map((i) => [String(i.id), i]));

    return details.map((d) => {
      const itemObj = d.item_id ? itemsMap.get(String(d.item_id)) : null;
      return {
        ...d,
        items: itemObj
      };
    });
  }

  // Create package inside session
  static async createPackage(data: {
    orderId: bigint;
    packSessionId: bigint;
    weight: number;
    packagingType: string;
    items: { itemId: bigint; quantity: number }[];
  }) {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    
    // Calculate increment suffix
    const countToday = await prisma.panel_packages.count({
      where: {
        package_id: {
          startsWith: `PKG-${dateStr}`
        }
      }
    });
    
    const suffix = String(countToday + 1).padStart(5, "0");
    const packageId = `PKG-${dateStr}-${suffix}`;

    return await prisma.$transaction(async (tx) => {
      const pkg = await tx.panel_packages.create({
        data: {
          package_id: packageId,
          order_id: data.orderId,
          pack_session_id: data.packSessionId,
          weight: data.weight,
          barcode: packageId,
          qr_code: `https://buggyops.com/pkg/${packageId}`,
          status: "packed"
        }
      });

      const packageItems = data.items.map((i) => ({
        package_id: pkg.id,
        item_id: i.itemId,
        quantity: i.quantity
      }));

      await tx.panel_package_items.createMany({
        data: packageItems
      });

      // Add to printer queue automatically
      const zplContent = `
^XA
^FO50,50^A0N,36,36^FDStore Label^FS
^FO50,100^A0N,24,24^FDPackage ID: ${packageId}^FS
^FO50,130^A0N,24,24^FDOrder ID: ${data.orderId}^FS
^FO50,160^A0N,24,24^FDWeight: ${data.weight} KG^FS
^FO50,190^A0N,24,24^FDBag: ${data.packagingType}^FS
^FO50,230^BY2,2.0,100^BCN,100,Y,N,N^FD${packageId}^FS
^XZ`;

      await tx.panel_printer_queue.create({
        data: {
          printer_id: "TSC-01",
          package_id: pkg.id,
          label_type: "package",
          raw_content: zplContent,
          status: "pending"
        }
      });

      return pkg;
    });
  }

  // Complete packing session
  static async completePackSession(sessionId: bigint, operatorId: bigint) {
    const session = await prisma.panel_pack_sessions.findUnique({
      where: { id: sessionId },
      include: { packages: true }
    });

    if (!session) throw new Error("Pack session not found");

    const totalWeight = session.packages.reduce((sum, p) => sum + p.weight, 0);

    return await prisma.$transaction(async (tx) => {
      await tx.panel_pack_sessions.update({
        where: { id: sessionId },
        data: {
          status: "completed",
          completed_at: new Date(),
          weight: totalWeight
        }
      });

      // Update package statuses to qc_pending
      await tx.panel_packages.updateMany({
        where: { pack_session_id: sessionId },
        data: { status: "qc_pending" }
      });

      await tx.panel_order_workflows.create({
        data: {
          order_id: session.order_id,
          status: "QC Pending",
          updated_by: operatorId,
          notes: `Packing complete. Total packages: ${session.packages.length}, Weight: ${totalWeight}kg`
        }
      });

      // Update public status to handover
      await tx.orders.update({
        where: { id: session.order_id },
        data: {
          order_status: "handover",
          handover: new Date(),
          updated_at: new Date()
        }
      });

      return true;
    });
  }
}
