import { prisma } from "@/lib/prisma";
import {
  LifestyleCategoriesConfig,
  FashionLifestyleConfig,
  BeautyPersonalCareConfig,
  HouseholdEssentialsConfig,
  HobbiesInterestsConfig,
  FashionLifestyleCard,
  BeautyPersonalCareCard,
  HouseholdEssentialsCard,
  HobbiesInterestsCard,
  DEFAULT_LIFESTYLE_CATEGORIES_CONFIG,
} from "@/types/lifestyle-categories";

export { DEFAULT_LIFESTYLE_CATEGORIES_CONFIG };
export type {
  LifestyleCategoriesConfig,
  FashionLifestyleConfig,
  BeautyPersonalCareConfig,
  HouseholdEssentialsConfig,
  HobbiesInterestsConfig,
  FashionLifestyleCard,
  BeautyPersonalCareCard,
  HouseholdEssentialsCard,
  HobbiesInterestsCard,
};

const SETTINGS_KEY = "grocery_lifestyle_categories_config";
let memoryCache: LifestyleCategoriesConfig | null = null;

export class LifestyleCategoriesRepository {
  /**
   * Get active Lifestyle & Specialty Categories configuration
   */
  static async getConfig(): Promise<LifestyleCategoriesConfig> {
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
          const resolved: LifestyleCategoriesConfig = {
            ...DEFAULT_LIFESTYLE_CATEGORIES_CONFIG,
            ...parsed,
            fashionLifestyle: {
              ...DEFAULT_LIFESTYLE_CATEGORIES_CONFIG.fashionLifestyle,
              ...(parsed.fashionLifestyle || {}),
              cards:
                Array.isArray(parsed.fashionLifestyle?.cards) &&
                parsed.fashionLifestyle.cards.length > 0
                  ? parsed.fashionLifestyle.cards
                  : DEFAULT_LIFESTYLE_CATEGORIES_CONFIG.fashionLifestyle.cards,
            },
            beautyPersonalCare: {
              ...DEFAULT_LIFESTYLE_CATEGORIES_CONFIG.beautyPersonalCare,
              ...(parsed.beautyPersonalCare || {}),
              row1Cards:
                Array.isArray(parsed.beautyPersonalCare?.row1Cards) &&
                parsed.beautyPersonalCare.row1Cards.length > 0
                  ? parsed.beautyPersonalCare.row1Cards
                  : DEFAULT_LIFESTYLE_CATEGORIES_CONFIG.beautyPersonalCare.row1Cards,
              row2Cards:
                Array.isArray(parsed.beautyPersonalCare?.row2Cards) &&
                parsed.beautyPersonalCare.row2Cards.length > 0
                  ? parsed.beautyPersonalCare.row2Cards
                  : DEFAULT_LIFESTYLE_CATEGORIES_CONFIG.beautyPersonalCare.row2Cards,
              row3Cards:
                Array.isArray(parsed.beautyPersonalCare?.row3Cards) &&
                parsed.beautyPersonalCare.row3Cards.length > 0
                  ? parsed.beautyPersonalCare.row3Cards
                  : DEFAULT_LIFESTYLE_CATEGORIES_CONFIG.beautyPersonalCare.row3Cards,
            },
            householdEssentials: {
              ...DEFAULT_LIFESTYLE_CATEGORIES_CONFIG.householdEssentials,
              ...(parsed.householdEssentials || {}),
              row1Cards:
                Array.isArray(parsed.householdEssentials?.row1Cards) &&
                parsed.householdEssentials.row1Cards.length > 0
                  ? parsed.householdEssentials.row1Cards
                  : DEFAULT_LIFESTYLE_CATEGORIES_CONFIG.householdEssentials.row1Cards,
              row2Cards:
                Array.isArray(parsed.householdEssentials?.row2Cards) &&
                parsed.householdEssentials.row2Cards.length > 0
                  ? parsed.householdEssentials.row2Cards
                  : DEFAULT_LIFESTYLE_CATEGORIES_CONFIG.householdEssentials.row2Cards,
            },
            hobbiesInterests: {
              ...DEFAULT_LIFESTYLE_CATEGORIES_CONFIG.hobbiesInterests,
              ...(parsed.hobbiesInterests || {}),
              cards:
                Array.isArray(parsed.hobbiesInterests?.cards) &&
                parsed.hobbiesInterests.cards.length > 0
                  ? parsed.hobbiesInterests.cards
                  : DEFAULT_LIFESTYLE_CATEGORIES_CONFIG.hobbiesInterests.cards,
            },
          };
          memoryCache = resolved;
          return resolved;
        }
      }
    } catch (error) {
      console.warn("Error reading lifestyle categories config from DB, falling back to cache/default:", error);
    }

    return memoryCache || DEFAULT_LIFESTYLE_CATEGORIES_CONFIG;
  }

  /**
   * Update or create the active Lifestyle & Specialty Categories configuration
   */
  static async saveConfig(
    config: Partial<LifestyleCategoriesConfig>
  ): Promise<LifestyleCategoriesConfig> {
    const current = await this.getConfig();
    const updated: LifestyleCategoriesConfig = {
      ...current,
      ...config,
      fashionLifestyle: {
        ...current.fashionLifestyle,
        ...(config.fashionLifestyle || {}),
      },
      beautyPersonalCare: {
        ...current.beautyPersonalCare,
        ...(config.beautyPersonalCare || {}),
      },
      householdEssentials: {
        ...current.householdEssentials,
        ...(config.householdEssentials || {}),
      },
      hobbiesInterests: {
        ...current.hobbiesInterests,
        ...(config.hobbiesInterests || {}),
      },
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
      console.error("Error saving lifestyle categories config to database:", error);
    }

    return updated;
  }
}
