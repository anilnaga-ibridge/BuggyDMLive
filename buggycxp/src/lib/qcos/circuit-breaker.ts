export type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

interface BootstrapFallbackContext {
  pageName?: string;
  module?: string;
  locale?: string;
  languageMode?: string;
}

const fallbackCopy = (locale = "en-IN") => {
  if (locale === "te-IN") {
    return {
      layoutName: "అత్యవసర హోమ్ · Emergency home",
      sectionName: "అవసరమైన సేవలు · Essential services",
      searchHint: "ఉత్పత్తులు, ఆహారం వెతకండి · Search",
      title: "సేవలు తాత్కాలికంగా పరిమితం · Limited service",
      accessibilityLabel: "పరిమిత సేవా సమాచారం · Limited service information",
    };
  }
  if (locale === "hi-IN") {
    return {
      layoutName: "आपातकालीन होम · Emergency home",
      sectionName: "ज़रूरी सेवाएँ · Essential services",
      searchHint: "उत्पाद और खाना खोजें · Search",
      title: "सेवाएँ अस्थायी रूप से सीमित · Limited service",
      accessibilityLabel: "सीमित सेवा की जानकारी · Limited service information",
    };
  }
  return {
    layoutName: "Emergency home",
    sectionName: "Essential services",
    searchHint: "Search products and food",
    title: "Service is temporarily limited",
    accessibilityLabel: "Limited service information",
  };
};

export function createBootstrapFallbackLayout(context: BootstrapFallbackContext = {}) {
  const locale = context.locale || "en-IN";
  const copy = fallbackCopy(locale);
  const isGrocery = context.pageName === "home_grocery" || context.pageName?.includes("grocery") || context.module === "grocery";
  const isQuick = !isGrocery && (context.pageName === "home_quick_commerce" || context.pageName?.includes("quick"));
  const defaultPageName = isGrocery ? "home_grocery" : (isQuick ? "home_quick_commerce" : "home_food");

  return {
    schemaVersion: "1.0",
    layoutId: isGrocery ? "bundled-grocery-home-v2" : (isQuick ? "bundled-quick-home-v2" : "bundled-food-home-v2"),
    layoutName: isGrocery ? "Grocery Home" : (isQuick ? "Quick Commerce Home" : copy.layoutName),
    pageName: context.pageName || defaultPageName,
    versionNumber: 1,
    locale,
    languageMode: context.languageMode || "english",
    experienceShell: {
      module: isGrocery ? "grocery" : (isQuick ? "quick_commerce" : "food"),
      themeFamily: isGrocery ? "grocery_fresh" : (isQuick ? "quick_commerce_mint" : "food_dark"),
      showDeliveryContext: true,
      cartCompatibilityPolicy: "confirm_switch",
      nativeCartSurface: "mini_cart",
      appearance: {
        headerStyle: "immersive",
        moduleTabStyle: "arched_cards",
        searchStyle: "outlined",
        navigationStyle: "edge_bar",
        contentDensity: "comfortable",
        cardStyle: isQuick ? "rounded" : "squircle",
        campaignMotion: isQuick ? "subtle" : "lively",
      },
      menu: [
        {
          id: isGrocery ? "grocery_home" : (isQuick ? "quick_home" : "food_home"),
          labelKey: isGrocery ? "menu.grocery" : (isQuick ? "menu.quick_shop" : "menu.food"),
          iconToken: isGrocery ? "nav.grocery" : (isQuick ? "nav.quick_shop" : "nav.food"),
          destination: isGrocery ? "home_grocery" : (isQuick ? "home_quick_commerce" : "home_food"),
        },
        {
          id: isGrocery ? "grocery_categories" : (isQuick ? "quick_categories" : "food_categories"),
          labelKey: "menu.categories",
          iconToken: "nav.categories",
          destination: "category_directory",
        },
        {
          id: isGrocery ? "grocery_reorder" : (isQuick ? "quick_reorder" : "food_reorder"),
          labelKey: "menu.reorder",
          iconToken: "nav.reorder",
          destination: "reorder",
          requiresCapabilities: ["orders"],
        },
        {
          id: isGrocery ? "grocery_cart" : (isQuick ? "quick_cart" : "food_cart"),
          labelKey: "menu.cart",
          iconToken: "nav.cart",
          destination: "cart",
        },
      ],
    },
    theme: {
      id: isGrocery ? "grocery-theme-v1" : (isQuick ? "quick-theme-v1" : "emergency-theme-v1"),
      name: isGrocery ? "Grocery fresh theme" : (isQuick ? "Quick commerce theme" : "Emergency accessible theme"),
      tokens: isGrocery ? {
        "sys.color.primary": "#10B981",
        "sys.color.secondary": "#3B82F6",
        "sys.color.background": "#F9FAFB",
        "sys.color.surface": "#FFFFFF",
        "sys.color.text_primary": "#111827",
        "sys.color.text_muted": "#6B7280",
        "sys.color.success": "#10B981",
        "sys.shape.radius_lg": "16px",
      } : (isQuick ? {
        "sys.color.primary": "#075B45",
        "sys.color.secondary": "#1769FF",
        "sys.color.background": "#F7FBFA",
        "sys.color.surface": "#FFFFFF",
        "sys.color.text_primary": "#173C33",
        "sys.color.text_muted": "#5B746D",
        "sys.color.success": "#12805C",
        "sys.shape.radius_lg": "22px",
      } : {
        "sys.color.primary": "#285943",
        "sys.color.secondary": "#A63D00",
        "sys.color.background": "#F7FAF8",
        "sys.color.surface": "#FFFFFF",
        "sys.color.text_primary": "#17211B",
        "sys.color.text_muted": "#4D5C53",
        "sys.shape.radius_lg": "18px",
      }),
    },
    sections: isGrocery ? [
      {
        id: "hero_fest_deals",
        name: "Hero Fest Deals",
        order: 0,
        enabled: true,
        visible: true,
        constraints: { enabled: true, visible: true },
        widgets: [
          {
            id: "hero_banner",
            type: "hero_campaign",
            version: "1.0.0",
            props: { campaignId: "hero_fest_campaign", aspectRatio: 1.8, accessibilityLabel: "Hero Fest Deals" },
            actions: [],
          },
        ],
      },
      {
        id: "steal_deals",
        name: "Steal Deals",
        order: 1,
        enabled: true,
        visible: true,
        constraints: { enabled: true, visible: true },
        widgets: [
          {
            id: "steal_deals_rail",
            type: "product_rail",
            version: "1.0.0",
            props: { collectionId: "steal_deals", titleKey: "steal_deals", limit: 6, cardVariant: "grocery" },
            actions: [],
          },
        ],
      },
      {
        id: "featured_offers",
        name: "Featured & Offers",
        order: 2,
        enabled: true,
        visible: true,
        constraints: { enabled: true, visible: true },
        widgets: [
          {
            id: "featured_promo",
            type: "promo_grid",
            version: "1.0.0",
            props: { collectionId: "featured_promotions", columns: 2, titleKey: "featured_offers" },
            actions: [],
          },
        ],
      },
      {
        id: "salon_bloom",
        name: "Salon & Bloom",
        order: 3,
        enabled: true,
        visible: true,
        constraints: { enabled: true, visible: true },
        widgets: [
          {
            id: "salon_campaign",
            type: "hero_campaign",
            version: "1.0.0",
            props: { campaignId: "salon_bloom", aspectRatio: 2.1, accessibilityLabel: "Salon & Bloom at home" },
            actions: [],
          },
        ],
      },
      {
        id: "category_grids",
        name: "Category Grids",
        order: 4,
        enabled: true,
        visible: true,
        constraints: { enabled: true, visible: true },
        widgets: [
          {
            id: "top_categories",
            type: "category_grid",
            version: "1.0.0",
            props: { collectionId: "grocery_categories", titleKey: "shop_by_category", columns: 4, showLabels: true },
            actions: [],
          },
        ],
      },
      {
        id: "curated_products",
        name: "Curated Products",
        order: 5,
        enabled: true,
        visible: true,
        constraints: { enabled: true, visible: true },
        widgets: [
          {
            id: "curated_rail",
            type: "product_rail",
            version: "1.0.0",
            props: { collectionId: "curated_products", titleKey: "curated_for_you", limit: 10, cardVariant: "grocery" },
            actions: [],
          },
        ],
      },
      {
        id: "lifestyle_categories",
        name: "Lifestyle Categories",
        order: 6,
        enabled: true,
        visible: true,
        constraints: { enabled: true, visible: true },
        widgets: [
          {
            id: "lifestyle_promo",
            type: "promo_grid",
            version: "1.0.0",
            props: { collectionId: "lifestyle_categories", columns: 2, titleKey: "lifestyle_and_more" },
            actions: [],
          },
        ],
      },
      {
        id: "flash_deals",
        name: "Flash Deals",
        order: 7,
        enabled: true,
        visible: true,
        constraints: { enabled: true, visible: true },
        widgets: [
          {
            id: "flash_countdown",
            type: "deal_countdown",
            version: "1.0.0",
            props: { campaignId: "flash_deals", titleKey: "flash_deal_ends_in", endsAt: "2027-01-01T00:00:00Z", expiredBehavior: "fallback" },
            actions: [],
          },
        ],
      },
    ] : [
      {
        id: "discovery",
        name: copy.sectionName,
        order: 0,
        constraints: {},
        widgets: [
          {
            id: "modules",
            type: "module_selector",
            version: "1.2.0",
            props: { style: "arched_cards", showEta: true, enabledModules: ["food", "quick_commerce"] },
            actions: [],
          },
          {
            id: "search",
            type: "search_entry",
            version: "1.2.0",
            props: { hintKey: isQuick ? "Search fresh groceries" : copy.searchHint, sticky: true, voice: false },
            actions: [],
          },
          {
            id: "intent_tabs",
            type: "intent_tab_rail",
            version: "1.1.0",
            props: {
              labels: isQuick ? ["Fresh", "Switch", "Delivery fee", "Seasonal"] : ["All", "Gourmet", "Offers", "Rapid"],
              activeIndex: 0,
            },
            actions: [],
          },
        ],
      },
      {
        id: "commerce",
        name: "Commerce",
        order: 1,
        constraints: {},
        widgets: [
          {
            id: "categories",
            type: "category_grid",
            version: "1.0.0",
            props: { titleKey: "Shop by category", columns: 4 },
            actions: [],
          },
          {
            id: "featured_products",
            type: "product_rail",
            version: "1.0.0",
            props: { title: isQuick ? "Popular Groceries" : "Popular Items" },
            actions: [],
          },
        ],
      },
    ],
  };
}

export class LayoutCircuitBreaker {
  private static state: CircuitState = "CLOSED";
  private static failureCount = 0;
  private static lastFailureTime: number | null = null;
  private static lastStateChangeTime = Date.now();

  private static readonly FAILURE_THRESHOLD = 3;
  private static readonly COOL_DOWN_PERIOD = 30000;

  public static async execute<T>(
    operation: () => Promise<T>,
    fallbackContext: BootstrapFallbackContext = {},
  ): Promise<T> {
    const now = Date.now();

    if (this.state === "OPEN" && this.lastStateChangeTime + this.COOL_DOWN_PERIOD < now) {
      this.transitionTo("HALF_OPEN");
    }

    if (this.state === "OPEN") {
      console.warn("[CircuitBreaker] Circuit is OPEN. Serving the canonical emergency layout.");
      return createBootstrapFallbackLayout(fallbackContext) as unknown as T;
    }

    try {
      const result = await operation();
      if (this.state === "HALF_OPEN") this.transitionTo("CLOSED");
      return result;
    } catch (error) {
      this.recordFailure();
      const reason = error instanceof Error ? error.message : "Unknown layout resolution failure";
      console.error(`[CircuitBreaker] Layout resolution failed (${reason}). Serving canonical fallback.`);
      return createBootstrapFallbackLayout(fallbackContext) as unknown as T;
    }
  }

  private static recordFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === "CLOSED" && this.failureCount >= this.FAILURE_THRESHOLD) {
      this.transitionTo("OPEN");
    } else if (this.state === "HALF_OPEN") {
      this.transitionTo("OPEN");
    }
  }

  private static transitionTo(newState: CircuitState) {
    console.warn(`[CircuitBreaker] State transitioning from ${this.state} to ${newState}`);
    this.state = newState;
    this.lastStateChangeTime = Date.now();
    if (newState === "CLOSED") {
      this.failureCount = 0;
      this.lastFailureTime = null;
    }
  }

  public static getDiagnostics() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime,
      cooldownRemainingMs: this.state === "OPEN"
        ? Math.max(0, (this.lastStateChangeTime + this.COOL_DOWN_PERIOD) - Date.now())
        : 0,
    };
  }
}
