import { prisma } from "@/lib/prisma";
import {
  HomeSalonShowcaseConfig,
  DEFAULT_SALON_SHOWCASE_CONFIG,
} from "@/types/salon-showcase";

export { DEFAULT_SALON_SHOWCASE_CONFIG };
export type { HomeSalonShowcaseConfig };

const SETTINGS_KEY = "grocery_salon_showcase_config";
let memoryCache: HomeSalonShowcaseConfig | null = null;

export class SalonShowcaseRepository {
  /**
   * Get active Salon at Home & Bloom Banner config
   */
  static async getConfig(): Promise<HomeSalonShowcaseConfig> {
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
          const resolved: HomeSalonShowcaseConfig = {
            ...DEFAULT_SALON_SHOWCASE_CONFIG,
            ...parsed,
            salon: {
              ...DEFAULT_SALON_SHOWCASE_CONFIG.salon,
              ...(parsed.salon || {}),
              heroDeal: {
                ...DEFAULT_SALON_SHOWCASE_CONFIG.salon.heroDeal,
                ...(parsed.salon?.heroDeal || {}),
              },
              miniCards:
                Array.isArray(parsed.salon?.miniCards) && parsed.salon.miniCards.length > 0
                  ? parsed.salon.miniCards
                  : DEFAULT_SALON_SHOWCASE_CONFIG.salon.miniCards,
            },
            bloom: {
              ...DEFAULT_SALON_SHOWCASE_CONFIG.bloom,
              ...(parsed.bloom || {}),
            },
          };

          memoryCache = resolved;
          return resolved;
        }
      }
    } catch (err) {
      console.warn("SalonShowcaseRepository.getConfig fallback to default:", err);
    }

    if (memoryCache) {
      return memoryCache;
    }

    memoryCache = { ...DEFAULT_SALON_SHOWCASE_CONFIG };
    return memoryCache;
  }

  /**
   * Save configuration to database
   */
  static async saveConfig(
    data: Partial<HomeSalonShowcaseConfig>
  ): Promise<HomeSalonShowcaseConfig> {
    const current = await this.getConfig();
    const updated: HomeSalonShowcaseConfig = {
      ...current,
      ...data,
      salon: {
        ...current.salon,
        ...(data.salon || {}),
        heroDeal: {
          ...current.salon.heroDeal,
          ...(data.salon?.heroDeal || {}),
        },
        miniCards: data.salon?.miniCards || current.salon.miniCards,
      },
      bloom: {
        ...current.bloom,
        ...(data.bloom || {}),
      },
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
      console.error("SalonShowcaseRepository.saveConfig error persisting to DB:", err);
    }

    return updated;
  }
}
