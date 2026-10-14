import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authorize, CXP_PERMISSIONS } from "@/lib/qcos/authz";
import { AuditLogger } from "@/lib/qcos/audit-logger";

const grantSchema = z.object({ roleId: z.union([z.string().regex(/^\d+$/), z.number().int().positive()]), permissions: z.array(z.enum(CXP_PERMISSIONS)).max(CXP_PERMISSIONS.length) });

export async function GET(request: Request) {
  const auth = await authorize(request, "cxp.admin"); if (auth.response) return auth.response;
  const grants = await prisma.qcos_role_permissions.findMany({ orderBy: [{ role_id: "asc" }, { permission: "asc" }] });
  return NextResponse.json({ success: true, available: CXP_PERMISSIONS, data: grants.map((grant) => ({ ...grant, role_id: grant.role_id.toString() })) });
}

export async function PUT(request: Request) {
  const auth = await authorize(request, "cxp.admin"); if (auth.response || !auth.session) return auth.response;
  const parsed = grantSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, error: "Invalid permission grant", issues: parsed.error.issues }, { status: 422 });
  const roleId = BigInt(parsed.data.roleId);
  await prisma.$transaction(async (tx) => {
    await tx.qcos_role_permissions.deleteMany({ where: { role_id: roleId } });
    if (parsed.data.permissions.length) await tx.qcos_role_permissions.createMany({ data: parsed.data.permissions.map((permission) => ({ role_id: roleId, permission })) });
  });
  await AuditLogger.log(auth.session.userId, "UPDATE", "qcos_role_permissions", Number(roleId), null, { permissions: parsed.data.permissions });
  return NextResponse.json({ success: true });
}
