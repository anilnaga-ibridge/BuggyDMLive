import { prisma } from "@/lib/prisma";
import {
  HomeFeaturedOffersConfig,
  DEFAULT_FEATURED_OFFERS_CONFIG,
} from "@/types/featured-offers";

export { DEFAULT_FEATURED_OFFERS_CONFIG };
export type { HomeFeaturedOffersConfig };

const SETTINGS_KEY = "grocery_featured_offers_config";
let memoryCache: HomeFeaturedOffersConfig | null = null;

export class FeaturedOffersRepository {
  /**
   * Get active Featured Categories, Today's Offers & Coupons config
   */
  static async getConfig(): Promise<HomeFeaturedOffersConfig> {
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
          const resolved: HomeFeaturedOffersConfig = {
            ...DEFAULT_FEATURED_OFFERS_CONFIG,
            ...parsed,
            featured: {
              ...DEFAULT_FEATURED_OFFERS_CONFIG.featured,
              ...(parsed.featured || {}),
              cards:
                Array.isArray(parsed.featured?.cards) && parsed.featured.cards.length > 0
                  ? parsed.featured.cards
                  : DEFAULT_FEATURED_OFFERS_CONFIG.featured.cards,
            },
            todaysOffers: {
              ...DEFAULT_FEATURED_OFFERS_CONFIG.todaysOffers,
              ...(parsed.todaysOffers || {}),
              offers:
                Array.isArray(parsed.todaysOffers?.offers) && parsed.todaysOffers.offers.length > 0
                  ? parsed.todaysOffers.offers
                  : DEFAULT_FEATURED_OFFERS_CONFIG.todaysOffers.offers,
            },
            coupons: {
              ...DEFAULT_FEATURED_OFFERS_CONFIG.coupons,
              ...(parsed.coupons || {}),
              coupons:
                Array.isArray(parsed.coupons?.coupons) && parsed.coupons.coupons.length > 0
                  ? parsed.coupons.coupons
                  : DEFAULT_FEATURED_OFFERS_CONFIG.coupons.coupons,
            },
          };

          memoryCache = resolved;
          return resolved;
        }
      }
    } catch (err) {
      console.warn("FeaturedOffersRepository.getConfig fallback to default:", err);
    }

    if (memoryCache) {
      return memoryCache;
    }

    memoryCache = { ...DEFAULT_FEATURED_OFFERS_CONFIG };
    return memoryCache;
  }

  /**
   * Save configuration to database
   */
  static async saveConfig(
    data: Partial<HomeFeaturedOffersConfig>
  ): Promise<HomeFeaturedOffersConfig> {
    const current = await this.getConfig();
    const updated: HomeFeaturedOffersConfig = {
      ...current,
      ...data,
      featured: {
        ...current.featured,
        ...(data.featured || {}),
      },
      todaysOffers: {
        ...current.todaysOffers,
        ...(data.todaysOffers || {}),
      },
      coupons: {
        ...current.coupons,
        ...(data.coupons || {}),
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
      console.error("FeaturedOffersRepository.saveConfig error persisting to DB:", err);
    }

    return updated;
  }
}
