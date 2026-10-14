import { prisma } from "@/lib/prisma";
import { getProductImageUrl } from "@/lib/images";

export interface SponsorTag {
  label: string;
  name: string;
  badgeColor: string;
}

export interface DealsZoneConfig {
  title: string;
  badgeText: string;
  itemId?: number | null;
  itemName: string;
  itemImage: string;
  originalPrice: number;
  discountedPrice: number;
  unit?: string;
}

export interface MiniDealCardConfig {
  id: string;
  title: string;
  priceText: string;
  emoji: string;
  image?: string;
  searchKeyword: string;
}

export interface HeroFestConfig {
  enabled: boolean;
  title: string;
  headerEmoji: string;
  sponsors: SponsorTag[];
  dealsZone: DealsZoneConfig;
  miniCards: MiniDealCardConfig[];
  updatedAt?: string;
}

export const DEFAULT_HERO_FEST_CONFIG: HeroFestConfig = {
  enabled: true,
  title: "Hot Sips & Snack Fest",
  headerEmoji: "🫖",
  sponsors: [
    { label: "Powered By", name: "Red Label", badgeColor: "#DC2626" },
    { label: "", name: "Maggi", badgeColor: "#D97706" },
    { label: "Co-powered By", name: "Nescafe", badgeColor: "#78350F" },
  ],
  dealsZone: {
    title: "Deals Zone",
    badgeText: "PURE COW GHEE",
    itemId: null,
    itemName: "Aashirvaad Svasti Cow Ghee",
    itemImage: "https://images.unsplash.com/photo-1589927986089-35812388d1f4?w=500&auto=format&fit=crop&q=80",
    originalPrice: 185,
    discountedPrice: 86,
    unit: "500 ml",
  },
  miniCards: [
    {
      id: "card_1",
      title: "Hot Sips & Mixes",
      priceText: "Starts at ₹40",
      emoji: "☕",
      image: "",
      searchKeyword: "tea coffee",
    },
    {
      id: "card_2",
      title: "Frozen Bites",
      priceText: "Starts at ₹129",
      emoji: "🍟",
      image: "",
      searchKeyword: "frozen snacks",
    },
    {
      id: "card_3",
      title: "Munch & Slurp",
      priceText: "Starts at ₹15",
      emoji: "🍜",
      image: "",
      searchKeyword: "noodles pasta",
    },
    {
      id: "card_4",
      title: "Cookies & Cake",
      priceText: "Starts at ₹15",
      emoji: "🍪",
      image: "",
      searchKeyword: "biscuits cookies",
    },
  ],
  updatedAt: new Date().toISOString(),
};

const SETTINGS_KEY = "grocery_hero_fest_config";
let memoryCache: HeroFestConfig | null = null;

export class HeroFestRepository {
  /**
   * Get the active Hero Fest showcase configuration.
   * Reads from database business_settings, with memoryCache and default fallback.
   */
  static async getConfig(): Promise<HeroFestConfig> {
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
          const resolved: HeroFestConfig = {
            ...DEFAULT_HERO_FEST_CONFIG,
            ...parsed,
            dealsZone: {
              ...DEFAULT_HERO_FEST_CONFIG.dealsZone,
              ...(parsed.dealsZone || {}),
            },
            miniCards:
              Array.isArray(parsed.miniCards) && parsed.miniCards.length === 4
                ? parsed.miniCards
                : DEFAULT_HERO_FEST_CONFIG.miniCards,
          };

          // If an itemId is linked, ensure image url is properly resolved
          if (resolved.dealsZone.itemImage) {
            let img = getProductImageUrl(resolved.dealsZone.itemImage);
            if (img.startsWith("/")) {
              const host = process.env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:3000";
              img = `${host}${img}`;
            }
            resolved.dealsZone.itemImage = img;
          }

          if (Array.isArray(resolved.miniCards)) {
            resolved.miniCards = resolved.miniCards.map((card) => {
              if (card.image) {
                let img = getProductImageUrl(card.image);
                if (img.startsWith("/")) {
                  const host = process.env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:3000";
                  img = `${host}${img}`;
                }
                return { ...card, image: img };
              }
              return card;
            });
          }

          memoryCache = resolved;
          return resolved;
        }
      }
    } catch (err) {
      console.warn("HeroFestRepository.getConfig fallback to memory/default:", err);
    }

    if (memoryCache) {
      return memoryCache;
    }

    memoryCache = { ...DEFAULT_HERO_FEST_CONFIG };
    return memoryCache;
  }

  /**
   * Save or update the Hero Fest showcase configuration
   */
  static async saveConfig(data: Partial<HeroFestConfig>): Promise<HeroFestConfig> {
    const current = await this.getConfig();
    const updated: HeroFestConfig = {
      ...current,
      ...data,
      dealsZone: {
        ...current.dealsZone,
        ...(data.dealsZone || {}),
      },
      miniCards:
        data.miniCards && data.miniCards.length > 0
          ? data.miniCards
          : current.miniCards,
      updatedAt: new Date().toISOString(),
    };

    if (updated.dealsZone.itemImage) {
      let img = getProductImageUrl(updated.dealsZone.itemImage);
      if (img.startsWith("/")) {
        const host = process.env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:3000";
        img = `${host}${img}`;
      }
      updated.dealsZone.itemImage = img;
    }

    if (Array.isArray(updated.miniCards)) {
      updated.miniCards = updated.miniCards.map((card) => {
        if (card.image) {
          let img = getProductImageUrl(card.image);
          if (img.startsWith("/")) {
            const host = process.env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:3000";
            img = `${host}${img}`;
          }
          return { ...card, image: img };
        }
        return card;
      });
    }

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
      console.error("HeroFestRepository.saveConfig error persisting to DB:", err);
    }

    return updated;
  }
}
