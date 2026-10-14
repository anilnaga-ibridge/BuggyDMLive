import { prisma } from "@/lib/prisma";
import {
  CategoryGridsConfig,
  GroceryKitchenConfig,
  SnacksDrinksConfig,
  CategoryCardItem,
  ShowcaseBannerItem,
  DEFAULT_CATEGORY_GRIDS_CONFIG,
} from "@/types/category-grids";

export { DEFAULT_CATEGORY_GRIDS_CONFIG };
export type {
  CategoryGridsConfig,
  GroceryKitchenConfig,
  SnacksDrinksConfig,
  CategoryCardItem,
  ShowcaseBannerItem,
};

const SETTINGS_KEY = "grocery_category_grids_config";
let memoryCache: CategoryGridsConfig | null = null;

export class CategoryGridsRepository {
  /**
   * Get active Grocery & Kitchen and Snacks & Drinks category grid configuration
   */
  static async getConfig(): Promise<CategoryGridsConfig> {
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
          const resolved: CategoryGridsConfig = {
            ...DEFAULT_CATEGORY_GRIDS_CONFIG,
            ...parsed,
            groceryKitchen: {
              ...DEFAULT_CATEGORY_GRIDS_CONFIG.groceryKitchen,
              ...(parsed.groceryKitchen || {}),
              heroBanner: {
                ...DEFAULT_CATEGORY_GRIDS_CONFIG.groceryKitchen.heroBanner,
                ...(parsed.groceryKitchen?.heroBanner || {}),
              },
              row1Cards:
                Array.isArray(parsed.groceryKitchen?.row1Cards) &&
                parsed.groceryKitchen.row1Cards.length > 0
                  ? parsed.groceryKitchen.row1Cards
                  : DEFAULT_CATEGORY_GRIDS_CONFIG.groceryKitchen.row1Cards,
              row2Cards:
                Array.isArray(parsed.groceryKitchen?.row2Cards) &&
                parsed.groceryKitchen.row2Cards.length > 0
                  ? parsed.groceryKitchen.row2Cards
                  : DEFAULT_CATEGORY_GRIDS_CONFIG.groceryKitchen.row2Cards,
            },
            snacksDrinks: {
              ...DEFAULT_CATEGORY_GRIDS_CONFIG.snacksDrinks,
              ...(parsed.snacksDrinks || {}),
              banners:
                Array.isArray(parsed.snacksDrinks?.banners) &&
                parsed.snacksDrinks.banners.length > 0
                  ? parsed.snacksDrinks.banners
                  : DEFAULT_CATEGORY_GRIDS_CONFIG.snacksDrinks.banners,
              bottomCards:
                Array.isArray(parsed.snacksDrinks?.bottomCards) &&
                parsed.snacksDrinks.bottomCards.length > 0
                  ? parsed.snacksDrinks.bottomCards
                  : DEFAULT_CATEGORY_GRIDS_CONFIG.snacksDrinks.bottomCards,
            },
          };

          memoryCache = resolved;
          return resolved;
        }
      }
    } catch (err) {
      console.warn("CategoryGridsRepository.getConfig fallback to default:", err);
    }

    if (memoryCache) {
      return memoryCache;
    }

    memoryCache = { ...DEFAULT_CATEGORY_GRIDS_CONFIG };
    return memoryCache;
  }

  /**
   * Save or update Category Grids configuration
   */
  static async saveConfig(
    data: Partial<CategoryGridsConfig>
  ): Promise<CategoryGridsConfig> {
    const current = await this.getConfig();
    const updated: CategoryGridsConfig = {
      ...current,
      ...data,
      groceryKitchen: {
        ...current.groceryKitchen,
        ...(data.groceryKitchen || {}),
      },
      snacksDrinks: {
        ...current.snacksDrinks,
        ...(data.snacksDrinks || {}),
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
      console.error("CategoryGridsRepository.saveConfig error persisting to DB:", err);
    }

    return updated;
  }
}
