import { prisma } from "@/lib/prisma";
import { getProductImageUrl } from "@/lib/images";
import {
  StealDealsConfig,
  StealStoreTab,
  StealCategoryChip,
  StealProductItem,
  DEFAULT_STEAL_DEALS_CONFIG,
} from "@/types/steal-deals";

export type {
  StealDealsConfig,
  StealStoreTab,
  StealCategoryChip,
  StealProductItem,
};
export { DEFAULT_STEAL_DEALS_CONFIG };

const SETTINGS_KEY = "grocery_steal_deals_config";
let memoryCache: StealDealsConfig | null = null;

export class StealDealsRepository {
  /**
   * Get the active Steal Deals configuration.
   * Reads from database business_settings, with memoryCache and default fallback.
   */
  static async getConfig(): Promise<StealDealsConfig> {
    try {
      const setting = await prisma.business_settings.findFirst({
        where: { key: SETTINGS_KEY },
      });

      if (setting && setting.value) {
        let parsed: any = setting.value;
        while (typeof parsed === "string") {
          try {
            parsed = JSON.parse(parsed);
          } catch {
            break;
          }
        }
        if (parsed && typeof parsed === "object") {
          const resolved: StealDealsConfig = {
            ...DEFAULT_STEAL_DEALS_CONFIG,
            ...parsed,
            storeTabs:
              Array.isArray(parsed.storeTabs) && parsed.storeTabs.length > 0
                ? parsed.storeTabs
                : DEFAULT_STEAL_DEALS_CONFIG.storeTabs,
            categories:
              Array.isArray(parsed.categories) && parsed.categories.length > 0
                ? parsed.categories
                : DEFAULT_STEAL_DEALS_CONFIG.categories,
            row1Products:
              Array.isArray(parsed.row1Products) && parsed.row1Products.length > 0
                ? parsed.row1Products
                : DEFAULT_STEAL_DEALS_CONFIG.row1Products,
            row2Products:
              Array.isArray(parsed.row2Products) && parsed.row2Products.length > 0
                ? parsed.row2Products
                : DEFAULT_STEAL_DEALS_CONFIG.row2Products,
          };

          memoryCache = resolved;
          return resolved;
        }
      }
    } catch (err) {
      console.warn("StealDealsRepository.getConfig fallback to memory/default:", err);
    }

    if (memoryCache) {
      return memoryCache;
    }

    memoryCache = { ...DEFAULT_STEAL_DEALS_CONFIG };
    return memoryCache;
  }

  /**
   * Save or update the Steal Deals configuration
   */
  static async saveConfig(data: Partial<StealDealsConfig>): Promise<StealDealsConfig> {
    const current = await this.getConfig();
    const updated: StealDealsConfig = {
      ...current,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    memoryCache = updated;

    try {
      const existing = await prisma.business_settings.findFirst({
        where: { key: SETTINGS_KEY },
      });

      if (existing) {
        await prisma.business_settings.update({
          where: { id: existing.id },
          data: {
            value: JSON.stringify(updated),
            updated_at: new Date(),
          },
        });
      } else {
        await prisma.business_settings.create({
          data: {
            key: SETTINGS_KEY,
            value: JSON.stringify(updated),
            created_at: new Date(),
            updated_at: new Date(),
          },
        });
      }
    } catch (err) {
      console.error("StealDealsRepository.saveConfig error persisting to DB:", err);
    }

    return updated;
  }
}
