import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export interface NavigationItemFilter {
  tenantId?: number | null;
  warehouseId?: number | null;
  platform?: string;
  isEnabledOnly?: boolean;
}

export interface NavigationMutationInput {
  title?: string;
  slug?: string;
  route?: string;
  icon?: string | null;
  description?: string | null;
  category?: string;
  display_order?: number;
  badge_provider?: string | null;
  badge_refresh_interval?: number;
  feature_flag?: string | null;
  minimum_role?: number;
  permissions?: string | null;
  supports_offline?: boolean;
  tenant_id?: number | null;
  warehouse_id?: number | null;
  platform?: string;
  is_enabled?: boolean;
  is_visible?: boolean;
  parent_id?: number | null;
}

export class NavigationRepository {
  /**
   * Fetch all raw ops_navigation records with relations
   */
  static async findAll(filter: NavigationItemFilter = {}) {
    const where: Prisma.ops_navigationWhereInput = {};
    const scopeConditions: Prisma.ops_navigationWhereInput[] = [];

    if (filter.isEnabledOnly !== false) {
      where.is_enabled = true;
      where.is_visible = true;
    }

    if (filter.platform && filter.platform !== "all") {
      scopeConditions.push({ OR: [
        { platform: "all" },
        { platform: filter.platform }
      ] });
    }

    if (filter.tenantId !== undefined && filter.tenantId !== null) {
      scopeConditions.push({ OR: [
        { tenant_id: null },
        { tenant_id: BigInt(filter.tenantId) }
      ] });
    }

    if (filter.warehouseId !== undefined && filter.warehouseId !== null) {
      scopeConditions.push({ OR: [
        { warehouse_id: null },
        { warehouse_id: BigInt(filter.warehouseId) }
      ] });
    }

    if (scopeConditions.length > 0) where.AND = scopeConditions;

    try {
      return await prisma.ops_navigation.findMany({
        where,
        include: {
          roles: true,
          navigation_permissions: true,
          features: true,
        },
        orderBy: [
          { display_order: "asc" },
          { id: "asc" }
        ]
      });
    } catch (err) {
      console.error("NavigationRepository.findAll error:", err);
      return [];
    }
  }

  /**
   * Find single item by ID
   */
  static async findById(id: number) {
    return await prisma.ops_navigation.findUnique({
      where: { id: BigInt(id) },
      include: {
        roles: true,
        navigation_permissions: true,
        features: true,
      }
    });
  }

  /**
   * Create new navigation record
   */
  static async create(data: Required<Pick<NavigationMutationInput, "title" | "slug" | "route">> & NavigationMutationInput) {
    return await prisma.ops_navigation.create({
      data: {
        title: data.title,
        slug: data.slug,
        route: data.route,
        icon: data.icon || "Package",
        description: data.description,
        category: data.category || "Operations",
        display_order: data.display_order ?? 0,
        badge_provider: data.badge_provider || null,
        badge_refresh_interval: data.badge_refresh_interval ?? 30,
        feature_flag: data.feature_flag || null,
        minimum_role: data.minimum_role ?? 0,
        permissions: data.permissions || null,
        supports_offline: data.supports_offline ?? true,
        tenant_id: data.tenant_id ? BigInt(data.tenant_id) : null,
        warehouse_id: data.warehouse_id ? BigInt(data.warehouse_id) : null,
        platform: data.platform || "all",
        is_enabled: data.is_enabled ?? true,
        is_visible: data.is_visible ?? true,
        parent_id: data.parent_id ? BigInt(data.parent_id) : null,
      }
    });
  }

  /**
   * Update existing record
   */
  static async update(id: number, data: NavigationMutationInput) {
    return await prisma.ops_navigation.update({
      where: { id: BigInt(id) },
      data: {
        title: data.title,
        slug: data.slug,
        route: data.route,
        icon: data.icon,
        description: data.description,
        category: data.category,
        display_order: data.display_order,
        badge_provider: data.badge_provider,
        badge_refresh_interval: data.badge_refresh_interval,
        feature_flag: data.feature_flag,
        minimum_role: data.minimum_role,
        permissions: data.permissions,
        supports_offline: data.supports_offline,
        platform: data.platform,
        is_enabled: data.is_enabled,
        is_visible: data.is_visible,
        parent_id: data.parent_id ? BigInt(data.parent_id) : null,
        updated_at: new Date(),
      }
    });
  }

  /**
   * Delete navigation record
   */
  static async delete(id: number) {
    return await prisma.ops_navigation.delete({
      where: { id: BigInt(id) }
    });
  }
}
