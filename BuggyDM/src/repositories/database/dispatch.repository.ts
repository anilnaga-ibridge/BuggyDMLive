import { prisma } from "@/lib/prisma";

export class DispatchRepository {
  // Find packages approved and ready for dispatch staging
  static async findPendingStagingPackages() {
    return await prisma.panel_packages.findMany({
      where: {
        status: "qc_approved"
      },
      include: {
        order: {
          include: {
            modules: true
          }
        }
      },
      orderBy: {
        created_at: "asc"
      }
    });
  }

  // Get list of dispatch shelves/racks
  static async findDispatchRacks() {
    const racks = await prisma.panel_dispatch_racks.findMany({
      include: {
        dispatch: {
          where: { status: "staged" },
          include: {
            package: true
          }
        }
      }
    });

    return racks.map((r) => {
      const occupied = r.dispatch.length;
      return {
        id: String(r.id),
        name: r.name,
        capacity: r.capacity,
        occupied,
        status: occupied >= r.capacity ? "full" : r.status,
        packages: r.dispatch.map((d) => ({
          packageId: d.package.package_id,
          orderId: String(d.package.order_id),
          stagedAt: d.dispatched_at.toISOString()
        }))
      };
    });
  }

  // Stage a package on a shelf/rack slot
  static async stagePackage(packageId: bigint, rackId: bigint, dispatcherId: bigint) {
    return await prisma.$transaction(async (tx) => {
      const [pkg, rack, occupied, existingStage] = await Promise.all([
        tx.panel_packages.findUnique({ where: { id: packageId } }),
        tx.panel_dispatch_racks.findUnique({ where: { id: rackId } }),
        tx.panel_dispatch.count({ where: { rack_id: rackId, status: "staged" } }),
        tx.panel_dispatch.findFirst({
          where: { package_id: packageId, status: "staged" },
        }),
      ]);

      if (!pkg) throw new Error("Package not found");
      if (pkg.status !== "qc_approved") {
        throw new Error("Only QC-approved packages can be staged");
      }
      if (!rack) throw new Error("Dispatch shelf not found");
      if (existingStage) throw new Error("Package is already staged");
      if (occupied >= rack.capacity) throw new Error("Dispatch shelf is full");

      // Stage package
      const stage = await tx.panel_dispatch.create({
        data: {
          package_id: packageId,
          dispatcher_id: dispatcherId,
          rack_id: rackId,
          status: "staged",
          dispatched_at: new Date()
        }
      });

      // Update package status
      await tx.panel_packages.update({
        where: { id: packageId },
        data: { status: "staged" }
      });

      // Update order workflow
      await tx.panel_order_workflows.create({
        data: {
          order_id: pkg.order_id,
          status: "Staged",
          updated_by: dispatcherId,
          notes: `Staged package ${pkg.package_id} on Rack/Shelf ID ${rackId}`
        }
      });

      return stage;
    });
  }

  // Find waiting riders with pending assignments
  static async findWaitingRiders() {
    // Delivery men that have active orders in handover state
    return await prisma.delivery_men.findMany({
      where: {
        active: true,
        status: true,
        current_orders: { gt: 0 }
      },
      select: {
        id: true,
        f_name: true,
        l_name: true,
        phone: true,
        current_orders: true
      }
    });
  }

  // Perform rider handover scanning validation
  static async handoverPackages(data: {
    riderId: bigint;
    packageBarcodes: string[];
    dispatcherId: bigint;
  }) {
    // 1. Fetch package IDs matching barcodes
    const packages = await prisma.panel_packages.findMany({
      where: {
        package_id: { in: data.packageBarcodes },
        status: "staged"
      }
    });

    if (packages.length !== data.packageBarcodes.length) {
      throw new Error("Some packages were not found in staged status");
    }

    const packageIds = packages.map((p) => p.id);

    return await prisma.$transaction(async (tx) => {
      // Insert handover logs
      const handoverLogs = packageIds.map((pid) => ({
        rider_id: data.riderId,
        package_id: pid,
        handover_by: data.dispatcherId,
        handed_over_at: new Date()
      }));

      await tx.panel_rider_handover.createMany({
        data: handoverLogs
      });

      // Update packages status to handed_over
      await tx.panel_packages.updateMany({
        where: { id: { in: packageIds } },
        data: { status: "handed_over" }
      });

      // Update dispatch listings to handed_over status
      await tx.panel_dispatch.updateMany({
        where: { package_id: { in: packageIds }, status: "staged" },
        data: { status: "handed_over" }
      });

      // Group packages by order to update status
      const orderIds = Array.from(new Set(packages.map((p) => p.order_id)));

      for (const orderId of orderIds) {
        // Find if any sibling packages for this order are still staged or not handed over
        const remaining = await tx.panel_packages.findMany({
          where: {
            order_id: orderId,
            status: { not: "handed_over" }
          }
        });

        if (remaining.length === 0) {
          // Complete order handover
          await tx.panel_order_workflows.create({
            data: {
              order_id: orderId,
              status: "Handed Over",
              updated_by: data.dispatcherId,
              notes: `All packages handed over to Rider ID: ${data.riderId}`
            }
          });

          // Update main orders table to picked_up
          await tx.orders.update({
            where: { id: orderId },
            data: {
              order_status: "picked_up",
              picked_up: new Date(),
              updated_at: new Date(),
              delivery_man_id: data.riderId
            }
          });
        }
      }

      return true;
    });
  }
}
