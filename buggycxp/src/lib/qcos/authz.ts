import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export const CXP_PERMISSIONS = [
  "cxp.view", "cxp.author", "cxp.review", "cxp.publish", "cxp.rollback",
  "cxp.media.manage", "cxp.localization.manage", "cxp.audience.manage", "cxp.admin",
] as const;

export type CxpPermission = typeof CXP_PERMISSIONS[number];

export async function authorize(request: Request, permission: CxpPermission) {
  const session = await getSession();
  if (!session) return { response: NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }) };

  if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    const origin = request.headers.get("origin");
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
    if (origin && host && new URL(origin).host !== host) {
      return { response: NextResponse.json({ success: false, error: "Origin validation failed" }, { status: 403 }) };
    }
  }

  const superAdminRoles = (process.env.CXP_SUPERADMIN_ROLE_IDS || "1").split(",").map((value) => value.trim());
  if (superAdminRoles.includes(String(session.roleId))) return { session };

  const grant = await prisma.qcos_role_permissions.findFirst({
    where: { role_id: BigInt(session.roleId), permission: { in: [permission, "cxp.admin"] } },
  });
  if (!grant) return { response: NextResponse.json({ success: false, error: "Forbidden", requiredPermission: permission }, { status: 403 }) };
  return { session };
}
