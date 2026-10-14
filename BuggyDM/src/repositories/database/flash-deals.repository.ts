import { prisma } from "@/lib/prisma";
import {
  FlashDealsConfig,
  FlashDealItem,
  DEFAULT_FLASH_DEALS_CONFIG,
} from "@/types/flash-deals";

export { DEFAULT_FLASH_DEALS_CONFIG };
export type { FlashDealsConfig, FlashDealItem };

const SETTINGS_KEY = "grocery_flash_deals_config";
let memoryCache: FlashDealsConfig | null = null;

export class FlashDealsRepository {
  /**
   * Get active Flash Deals configuration
   */
  static async getConfig(): Promise<FlashDealsConfig> {
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
          const resolved: FlashDealsConfig = {
            ...DEFAULT_FLASH_DEALS_CONFIG,
            ...parsed,
            deals:
              Array.isArray(parsed.deals) && parsed.deals.length > 0
                ? parsed.deals
                : DEFAULT_FLASH_DEALS_CONFIG.deals,
          };
          memoryCache = resolved;
          return resolved;
        }
      }
    } catch (error) {
      console.warn("Error reading flash deals config from DB, falling back to cache/default:", error);
    }

    return memoryCache || DEFAULT_FLASH_DEALS_CONFIG;
  }

  /**
   * Update or create the active Flash Deals configuration
   */
  static async saveConfig(
    config: Partial<FlashDealsConfig>
  ): Promise<FlashDealsConfig> {
    const current = await this.getConfig();
    const updated: FlashDealsConfig = {
      ...current,
      ...config,
      updatedAt: new Date().toISOString(),
    };

    memoryCache = updated;

    try {
      const serialized = JSON.stringify(updated);
      const existing = await prisma.business_settings.findFirst({
        where: { key: SETTINGS_KEY },
      });

      if (existing) {
        await prisma.business_settings.update({
          where: { id: existing.id },
          data: {
            value: serialized,
            updated_at: new Date(),
          },
        });
      } else {
        await prisma.business_settings.create({
          data: {
            key: SETTINGS_KEY,
            value: serialized,
            created_at: new Date(),
            updated_at: new Date(),
          },
        });
      }
    } catch (error) {
      console.error("Error saving flash deals config to database:", error);
    }

    return updated;
  }
}
