"use server";

import { prisma } from "@/lib/prisma";
import { serializeBigInts } from "@/lib/prisma-extension";
import { Permissions, requirePermission } from "@/lib/security/authorization";

export async function getOrganizations() {
  await requirePermission(Permissions.operationsRead);

  try {
    const orgs = await prisma.qcom_organizations.findMany({
      include: {
        hierarchies: true,
        stores: true,
      },
      orderBy: { created_at: "desc" }
    });

    return serializeBigInts(orgs);
  } catch (err) {
    console.error("getOrganizations error:", err);
    throw new Error("Failed to fetch organizations");
  }
}

export async function createOrganization(name: string, code: string, taxId?: string) {
  await requirePermission(Permissions.operationsExecute);

  try {
    const org = await prisma.qcom_organizations.create({
      data: {
        name,
        code: code.toUpperCase().trim(),
        tax_id: taxId || null,
      }
    });

    return serializeBigInts(org);
  } catch (err) {
    console.error("createOrganization error:", err);
    throw new Error("Failed to create organization");
  }
}

export async function addHierarchyNode(
  organizationId: string,
  name: string,
  levelType: string,
  parentId?: string
) {
  await requirePermission(Permissions.operationsExecute);

  try {
    const node = await prisma.qcom_organizational_hierarchy.create({
      data: {
        organization_id: BigInt(organizationId),
        name,
        level_type: levelType,
        parent_id: parentId ? BigInt(parentId) : null
      }
    });

    return serializeBigInts(node);
  } catch (err) {
    console.error("addHierarchyNode error:", err);
    throw new Error("Failed to create hierarchy node");
  }
}
