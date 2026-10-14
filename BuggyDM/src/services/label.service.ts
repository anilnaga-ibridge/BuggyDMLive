import { prisma } from "@/lib/prisma";

export class LabelService {
  // Generate Zebra Programming Language (ZPL) commands for Zebra printers
  static generateZpl(data: {
    packageId: string;
    orderId: string;
    weight: number;
    bagCount: string; // e.g. "1/2"
    storeName: string;
    packedBy: string;
    isFragile: boolean;
    isCod: boolean;
  }): string {
    const fragileStr = data.isFragile ? "^FO400,50^A0N,30,30^FDFRAGILE^FS" : "";
    const codStr = data.isCod ? "^FO400,90^A0N,30,30^FDC.O.D.^FS" : "";

    return `
^XA
^LH0,0
^FO50,50^A0N,36,36^FD${data.storeName}^FS
^FO50,100^A0N,20,20^FDPackage ID: ${data.packageId}^FS
^FO50,130^A0N,20,20^FDOrder Number: ${data.orderId}^FS
^FO50,160^A0N,20,20^FDWeight: ${data.weight} KG^FS
^FO50,190^A0N,20,20^FDBag: ${data.bagCount}^FS
^FO50,220^A0N,20,20^FDPacked By: ${data.packedBy}^FS
${fragileStr}
${codStr}
^FO50,260^BY2,2.0,80^BCN,80,Y,N,N^FD${data.packageId}^FS
^FO50,380^BQN,2,4^FDQA,${data.packageId}^FS
^XZ`.trim();
  }

  // Add print job to database queue
  static async queuePrintJob(data: {
    printerId: string;
    packageId: bigint;
    labelType: "package" | "returns" | "shelf";
    rawContent: string;
  }) {
    return await prisma.panel_printer_queue.create({
      data: {
        printer_id: data.printerId,
        package_id: data.packageId,
        label_type: data.labelType,
        raw_content: data.rawContent,
        status: "pending"
      }
    });
  }

  // Get pending print queue jobs
  static async getPendingJobs(printerId?: string) {
    return await prisma.panel_printer_queue.findMany({
      where: {
        status: "pending",
        ...(printerId ? { printer_id: printerId } : {})
      },
      orderBy: {
        created_at: "asc"
      }
    });
  }

  // Mark print job as completed/failed
  static async updateJobStatus(jobId: bigint, status: "printed" | "failed", errorMsg?: string) {
    return await prisma.panel_printer_queue.update({
      where: { id: jobId },
      data: {
        status,
        printed_at: status === "printed" ? new Date() : null,
        error_message: errorMsg || null
      }
    });
  }
}
