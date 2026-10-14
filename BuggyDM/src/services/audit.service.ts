import { prisma } from "@/lib/prisma";

export interface ActivityLogInput {
  adminId: number;
  action: string;
  tableName: string;
  recordId: number;
  oldValue?: string;
  newValue?: string;
  ipAddress: string;
  userAgent?: string;
}

export class AuditService {
  static async logActivity(data: ActivityLogInput) {
    try {
      return await prisma.panel_activity_logs.create({
        data: {
          admin_id: BigInt(data.adminId),
          action: data.action,
          table_name: data.tableName,
          record_id: BigInt(data.recordId),
          old_value: data.oldValue || null,
          new_value: data.newValue || null,
          ip_address: data.ipAddress,
          user_agent: data.userAgent || null,
        },
      });
    } catch (error) {
      console.error("Failed to write audit activity log:", error);
    }
  }
}
