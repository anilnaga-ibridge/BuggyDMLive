import { prisma } from "@/lib/prisma";
import {
  CuratedProductsConfig,
  CuratedProductItem,
  DEFAULT_CURATED_PRODUCTS_CONFIG,
} from "@/types/curated-products";

export { DEFAULT_CURATED_PRODUCTS_CONFIG };
export type { CuratedProductsConfig, CuratedProductItem };

const SETTINGS_KEY = "grocery_curated_products_config";
let memoryCache: CuratedProductsConfig | null = null;

export class CuratedProductsRepository {
  /**
   * Get active Curated For You products configuration
   */
  static async getConfig(): Promise<CuratedProductsConfig> {
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
          const resolved: CuratedProductsConfig = {
            ...DEFAULT_CURATED_PRODUCTS_CONFIG,
            ...parsed,
            enabled: parsed.enabled !== undefined ? Boolean(parsed.enabled) : true,
            products:
              Array.isArray(parsed.products) && parsed.products.length > 0
                ? parsed.products
                : DEFAULT_CURATED_PRODUCTS_CONFIG.products,
          };

          memoryCache = resolved;
          return resolved;
        }
      }
    } catch (err) {
      console.warn("CuratedProductsRepository.getConfig fallback to default:", err);
    }

    if (memoryCache) {
      return memoryCache;
    }

    memoryCache = { ...DEFAULT_CURATED_PRODUCTS_CONFIG };
    return memoryCache;
  }

  /**
   * Save or update Curated For You products configuration
   */
  static async saveConfig(
    data: Partial<CuratedProductsConfig>
  ): Promise<CuratedProductsConfig> {
    const current = await this.getConfig();
    const updated: CuratedProductsConfig = {
      ...current,
      ...data,
      enabled: data.enabled !== undefined ? Boolean(data.enabled) : current.enabled,
      products: data.products ?? current.products,
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
      console.error("CuratedProductsRepository.saveConfig error persisting to DB:", err);
    }

    return updated;
  }
}
