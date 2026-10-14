import { prisma } from "@/lib/prisma";

export class AuditLogger {
  /**
   * Log administrative mutation to qcos_audit_logs table
   */
  static async log(
    userId: number,
    action: "CREATE" | "UPDATE" | "DELETE" | "PUBLISH",
    targetTable: string,
    recordId: number,
    oldValue?: unknown,
    newValue?: unknown,
    ipAddress = "127.0.0.1",
    userAgent = "CXP Admin Console"
  ) {
    try {
      await prisma.qcos_audit_logs.create({
        data: {
          user_id: userId,
          action,
          target_table: targetTable,
          record_id: recordId,
          old_value: oldValue ? JSON.stringify(oldValue) : null,
          new_value: newValue ? JSON.stringify(newValue) : null,
          ip_address: ipAddress,
          user_agent: userAgent
        }
      });
    } catch (err) {
      console.error("[AuditLogger] Failed to write database audit entry:", err);
    }
  }
}
