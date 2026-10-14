import { prisma } from "@/lib/prisma";

export class QcRepository {
  // Find packages waiting for QC
  static async findPendingQcPackages() {
    return await prisma.panel_packages.findMany({
      where: {
        status: "qc_pending"
      },
      include: {
        order: {
          include: {
            modules: true
          }
        },
        pack_session: true,
        package_items: true
      },
      orderBy: {
        created_at: "asc"
      }
    });
  }

  // Find package by string ID (barcode/scanned id)
  static async findPackageByBarcode(barcode: string) {
    return await prisma.panel_packages.findUnique({
      where: { package_id: barcode },
      include: {
        order: {
          include: {
            order_edit_logs: true
          }
        },
        package_items: true
      }
    });
  }

  // Create Quality Check record
  static async createQcSession(data: {
    packageId: bigint;
    checkerId: bigint;
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
    // 1. Fetch package detail to identify order id
    const pkg = await prisma.panel_packages.findUnique({
      where: { id: data.packageId }
    });

    if (!pkg) throw new Error("Package not found");

    return await prisma.$transaction(async (tx) => {
      // Create session
      const qcSession = await tx.panel_qc_sessions.create({
        data: {
          package_id: data.packageId,
          checker_id: data.checkerId,
          status: data.status,
          checked_at: new Date(),
          correct_products: data.checklist.correctProducts,
          correct_quantity: data.checklist.correctQuantity,
          seal_checked: data.checklist.sealChecked,
          label_printed: data.checklist.labelPrinted,
          temp_items_checked: data.checklist.tempItemsChecked,
          fragile_items_checked: data.checklist.fragileItemsChecked,
          notes: data.notes
        }
      });

      // Update package status
      const updatedStatus = data.status === "approved" ? "qc_approved" : "qc_rejected";
      await tx.panel_packages.update({
        where: { id: data.packageId },
        data: { status: updatedStatus }
      });

      if (data.status === "approved") {
        // Check if all packages for this order are approved
        const siblings = await tx.panel_packages.findMany({
          where: { order_id: pkg.order_id }
        });

        const allApproved = siblings.every((p) => p.status === "qc_approved");
        if (allApproved) {
          await tx.panel_order_workflows.create({
            data: {
              order_id: pkg.order_id,
              status: "QC Approved",
              updated_by: data.checkerId,
              notes: "All packages approved at QC inspection."
            }
          });
        }
      } else {
        // Rejected package -> returns order back to Packing state
        await tx.panel_order_workflows.create({
          data: {
            order_id: pkg.order_id,
            status: "Packing",
            updated_by: data.checkerId,
            notes: `Package ${pkg.package_id} rejected at QC: ${data.notes || "check failed"}`
          }
        });

        // Log exception
        await tx.panel_exception_logs.create({
          data: {
            order_id: pkg.order_id,
            package_id: pkg.id,
            exception_type: "qc_rejected",
            details: `QC Failed checklist items: ${JSON.stringify(data.checklist)}. Operator notes: ${data.notes || "None"}`,
            reported_by: data.checkerId,
            reported_at: new Date()
          }
        });

        // Reset pack session status back to active so packer can re-pack
        await tx.panel_pack_sessions.update({
          where: { id: pkg.pack_session_id },
          data: { status: "packing" }
        });
      }

      return qcSession;
    });
  }
}
