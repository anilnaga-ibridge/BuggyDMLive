export class FeatureFlagEngine {
  private static defaultFlags: Record<string, boolean> = {
    inventory_v2: true,
    returns_v3: true,
    fleet: true,
    warehouse_ai: false,
    dark_store: true,
    multi_vendor: false,
    offline_sync: true,
    analytics_dashboard: true,
  };

  /**
   * Check if a feature flag is enabled
   */
  static isEnabled(featureFlag: string | null | undefined, customFlags?: Record<string, boolean>): boolean {
    if (!featureFlag) return true;
    
    const flags = { ...this.defaultFlags, ...(customFlags || {}) };
    
    // Default to true if flag is not listed, otherwise return flag state
    return flags[featureFlag] !== undefined ? flags[featureFlag] : true;
  }

  /**
   * Filter navigation items by active feature flags
   */
  static filterFeatured<T extends { feature_flag?: string | null }>(
    items: T[],
    customFlags?: Record<string, boolean>,
  ): T[] {
    return items.filter((item) => this.isEnabled(item.feature_flag, customFlags));
  }
}
