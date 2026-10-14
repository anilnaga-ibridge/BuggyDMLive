import { NavigationRepository, NavigationItemFilter } from "@/repositories/database/navigation.repository";
import { PermissionEngine, UserContext } from "@/lib/security/permission.engine";
import { FeatureFlagEngine } from "@/lib/feature-flags/feature-flag.engine";
import { BadgeProviderService } from "@/services/badge-provider.service";

export interface NavigationTreeDTO {
  id: number;
  parentId: number | null;
  title: string;
  slug: string;
  route: string;
  icon: string | null;
  description: string | null;
  category: string;
  displayOrder: number;
  badgeProvider: string | null;
  badgeRefreshInterval: number;
  badgeValue: number | null;
  featureFlag: string | null;
  minimumRole: number;
  supportsOffline: boolean;
  tenantId: number | null;
  warehouseId: number | null;
  platform: string;
  isEnabled: boolean;
  isVisible: boolean;
  children: NavigationTreeDTO[];
}

export class NavigationService {
  /**
   * Get authorized dynamic navigation tree for current user context
   */
  static async getNavigationTree(
    user: UserContext,
    filter: NavigationItemFilter = {},
    customFlags?: Record<string, boolean>
  ): Promise<NavigationTreeDTO[]> {
    try {
      // 1. Fetch raw navigation items from database
      const rawItems = await NavigationRepository.findAll(filter);

      // 2. Filter by permissions
      const authorizedItems = PermissionEngine.filterAuthorized(rawItems, user);

      // 3. Filter by feature flags
      const featureEnabledItems = FeatureFlagEngine.filterFeatured(authorizedItems, customFlags);

      // 4. Batch resolve badges for active providers
      const badgeProviders = featureEnabledItems
        .map((item) => item.badge_provider)
        .filter((p): p is string => Boolean(p));

      const badgeMap = await BadgeProviderService.batchResolveBadges(badgeProviders);

      // 5. Transform database records to clean DTOs
      const dtos: NavigationTreeDTO[] = featureEnabledItems.map((item) => {
        const provider = item.badge_provider;
        return {
          id: Number(item.id),
          parentId: item.parent_id ? Number(item.parent_id) : null,
          title: item.title,
          slug: item.slug,
          route: item.route,
          icon: item.icon,
          description: item.description,
          category: item.category,
          displayOrder: item.display_order,
          badgeProvider: provider,
          badgeRefreshInterval: item.badge_refresh_interval,
          badgeValue: provider ? (badgeMap[provider] ?? null) : null,
          featureFlag: item.feature_flag,
          minimumRole: item.minimum_role,
          supportsOffline: item.supports_offline,
          tenantId: item.tenant_id ? Number(item.tenant_id) : null,
          warehouseId: item.warehouse_id ? Number(item.warehouse_id) : null,
          platform: item.platform,
          isEnabled: item.is_enabled,
          isVisible: item.is_visible,
          children: [],
        };
      });

      // 6. Build hierarchical tree structure
      return this.buildTree(dtos);
    } catch (err) {
      console.error("NavigationService.getNavigationTree error:", err);
      return [];
    }
  }

  /**
   * Helper to build recursive tree from flat DTO array
   */
  private static buildTree(items: NavigationTreeDTO[]): NavigationTreeDTO[] {
    const itemMap = new Map<number, NavigationTreeDTO>();
    const roots: NavigationTreeDTO[] = [];

    // Map all items
    items.forEach((item) => {
      itemMap.set(item.id, { ...item, children: [] });
    });

    // Connect parents and children
    items.forEach((item) => {
      const node = itemMap.get(item.id)!;
      if (item.parentId && itemMap.has(item.parentId)) {
        const parentNode = itemMap.get(item.parentId)!;
        parentNode.children.push(node);
      } else {
        roots.push(node);
      }
    });

    // Sort nodes at every level by displayOrder
    const sortNodes = (nodes: NavigationTreeDTO[]) => {
      nodes.sort((a, b) => a.displayOrder - b.displayOrder);
      nodes.forEach((n) => sortNodes(n.children));
    };

    sortNodes(roots);
    return roots;
  }
}
