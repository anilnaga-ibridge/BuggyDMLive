"use server";

import { prisma } from "@/lib/prisma";
import { serializeBigInts } from "@/lib/prisma-extension";
import { Permissions, requirePermission } from "@/lib/security/authorization";

export async function getRbacOverview() {
  await requirePermission(Permissions.rbacManage);

  try {
    const [staffList, permissions] = await Promise.all([
      prisma.admins.findMany({
        select: {
          id: true,
          f_name: true,
          l_name: true,
          email: true,
          role_id: true,
          organization_id: true,
          department_id: true,
          designation: true,
          shift_status: true,
          device_binding_id: true,
        },
        orderBy: { id: "asc" },
        take: 50
      }),
      prisma.qcom_rbac_roles_permissions.findMany({
        take: 100
      })
    ]);

    const staffWithNames = staffList.map((s) => ({
      ...s,
      fullName: `${s.f_name || ""} ${s.l_name || ""}`.trim() || s.email,
      departmentName: s.department_id ? `Dept #${s.department_id}` : "Unassigned",
      designation: s.designation || "Staff Member",
      shiftStatus: s.shift_status || "Offline",
      deviceBindingId: s.device_binding_id || "Unbound",
    }));

    return serializeBigInts({
      staff: staffWithNames,
      permissions
    });
  } catch (err) {
    console.error("getRbacOverview error:", err);
    throw new Error("Failed to fetch RBAC overview");
  }
}

export async function updateAdminRbac(
  adminId: string,
  designation: string,
  shiftStatus: string,
  deviceBindingId?: string
) {
  await requirePermission(Permissions.rbacManage);

  try {
    const updated = await prisma.admins.update({
      where: { id: BigInt(adminId) },
      data: {
        designation,
        shift_status: shiftStatus,
        device_binding_id: deviceBindingId || null,
        updated_at: new Date()
      }
    });

    return serializeBigInts(updated);
  } catch (err) {
    console.error("updateAdminRbac error:", err);
    throw new Error("Failed to update staff RBAC settings");
  }
}

export async function createRolePermission(
  roleId: string,
  permissionKey: string,
  approvalLevel: number = 1
) {
  await requirePermission(Permissions.rbacManage);

  try {
    const perm = await prisma.qcom_rbac_roles_permissions.create({
      data: {
        role_id: BigInt(roleId),
        permission_key: permissionKey,
        approval_level: approvalLevel
      }
    });

    return serializeBigInts(perm);
  } catch (err) {
    console.error("createRolePermission error:", err);
    throw new Error("Failed to assign role permission");
  }
}
