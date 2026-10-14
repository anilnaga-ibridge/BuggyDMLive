export interface UserContext {
  userId: number;
  roleId: number;
  permissions?: string[];
  tenantId?: number | null;
  warehouseId?: number | null;
}

interface NavigationAccessItem {
  minimum_role?: number;
  roles?: Array<{ role_id: bigint }>;
  permissions?: string | null;
  navigation_permissions?: Array<{ permission_key: string }>;
  tenant_id?: bigint | null;
  warehouse_id?: bigint | null;
}

export class PermissionEngine {
  /**
   * Evaluate whether a user context has access to a navigation item
   */
  static isAuthorized(item: NavigationAccessItem, user: UserContext): boolean {
    if (!user) return false;

    // Admin override (Role 1 = Admin)
    if (user.roleId === 1) {
      return true;
    }

    // 1. Role level check
    if ((item.minimum_role ?? 0) > 0 && user.roleId > (item.minimum_role ?? 0)) {
      return false;
    }

    // Explicit roles list check if assigned
    if (item.roles && item.roles.length > 0) {
      const allowedRoleIds = item.roles.map((role) => Number(role.role_id));
      if (!allowedRoleIds.includes(user.roleId)) {
        return false;
      }
    }

    // 2. Permission keys check
    let requiredPerms: string[] = [];
    if (item.permissions) {
      if (typeof item.permissions === "string") {
        requiredPerms = item.permissions.split(",").map((p: string) => p.trim()).filter(Boolean);
      } else if (Array.isArray(item.permissions)) {
        requiredPerms = item.permissions;
      }
    }

    if (item.navigation_permissions && item.navigation_permissions.length > 0) {
      const dbPerms = item.navigation_permissions.map(
        (permission) => permission.permission_key,
      );
      requiredPerms = [...requiredPerms, ...dbPerms];
    }

    if (requiredPerms.length > 0) {
      const userPerms = user.permissions || [];
      const hasAll = requiredPerms.every((perm) => userPerms.includes(perm));
      if (!hasAll) {
        return false;
      }
    }

    // 3. Tenant & Warehouse scoping
    if (item.tenant_id && Number(item.tenant_id) !== user.tenantId) {
      return false;
    }

    if (item.warehouse_id && Number(item.warehouse_id) !== user.warehouseId) {
      return false;
    }

    return true;
  }

  /**
   * Filter navigation items array by user authorization
   */
  static filterAuthorized<T extends NavigationAccessItem>(
    items: T[],
    user: UserContext,
  ): T[] {
    return items.filter((item) => this.isAuthorized(item, user));
  }
}
