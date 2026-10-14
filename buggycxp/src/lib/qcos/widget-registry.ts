import type { AuthoringDocument } from "./contracts";

export interface WidgetDefinition {
  name: string;
  version: string;
  description: string;
  requiredCapabilities: string[];
  schema: Record<string, unknown>;
  allowedActions: string[];
  defaultProps: Record<string, unknown>;
}

const objectSchema = (properties: Record<string, unknown>, required: string[] = []) => ({
  type: "object",
  additionalProperties: false,
  properties,
  required,
});

export const widgetRegistry: WidgetDefinition[] = [
  {
    name: "module_selector", version: "1.2.0", description: "Module-aware service tabs with capability-gated availability",
    requiredCapabilities: ["module_context"], allowedActions: ["select_module", "track_event"], defaultProps: { style: "arched_cards", showEta: true, showLabels: true, showBadges: true, enabledModules: ["food", "quick_commerce"], disabledModules: ["dineout", "scenes"] },
    schema: objectSchema({ style: { enum: ["arched_cards", "floating_cards", "segmented"] }, showEta: { type: "boolean" }, showLabels: { type: "boolean" }, showBadges: { type: "boolean" }, enabledModules: { type: "array", maxItems: 4 }, disabledModules: { type: "array", maxItems: 4 } }),
  },
  {
    name: "search_entry", version: "1.2.0", description: "Module-scoped native search entry point",
    requiredCapabilities: ["search"], allowedActions: ["open_search", "navigate", "track_event"], defaultProps: { hintKey: "search_products", sticky: true, voice: true, trailingAction: "none", hintMode: "rotating", presentation: "floating", showCompanion: false },
    schema: objectSchema({ hintKey: { type: "string" }, sticky: { type: "boolean" }, voice: { type: "boolean" }, trailingAction: { enum: ["none", "dietary", "saved", "scan"] }, hintMode: { enum: ["static", "rotating"] }, presentation: { enum: ["floating", "outlined", "embedded"] }, showCompanion: { type: "boolean" } }),
  },
  {
    name: "hero_campaign", version: "1.0.0", description: "Responsive campaign hero",
    requiredCapabilities: ["responsive_image"], allowedActions: ["navigate", "open_external_url", "track_event"], defaultProps: { campaignId: "featured_campaign", aspectRatio: 1.8, accessibilityLabel: "Featured campaign" },
    schema: objectSchema({ campaignId: { type: "string" }, aspectRatio: { type: "number", minimum: 0.5, maximum: 4 }, accessibilityLabel: { type: "string" } }, ["campaignId", "accessibilityLabel"]),
  },
  {
    name: "promo_grid", version: "1.0.0", description: "Campaign benefit/card grid",
    requiredCapabilities: ["responsive_image"], allowedActions: ["navigate", "track_event"], defaultProps: { collectionId: "featured_promotions", columns: 2, titleKey: "offers_for_you" },
    schema: objectSchema({ collectionId: { type: "string" }, columns: { type: "integer", minimum: 2, maximum: 4 }, titleKey: { type: "string" } }, ["collectionId"]),
  },
  {
    name: "segmented_collection", version: "1.0.0", description: "Segmented merchandising collection",
    requiredCapabilities: ["catalog"], allowedActions: ["navigate", "add_to_cart"], defaultProps: { segments: ["For you", "Popular"], defaultSegment: "For you" },
    schema: objectSchema({ segments: { type: "array", maxItems: 5 }, defaultSegment: { type: "string" } }, ["segments"]),
  },
  {
    name: "product_rail", version: "1.0.0", description: "Horizontal product collection",
    requiredCapabilities: ["catalog", "cart"], allowedActions: ["navigate", "add_to_cart"], defaultProps: { collectionId: "recommended", titleKey: "recommended_for_you", limit: 12, cardVariant: "grocery" },
    schema: objectSchema({ collectionId: { type: "string" }, titleKey: { type: "string" }, limit: { type: "integer", minimum: 1, maximum: 30 }, cardVariant: { enum: ["food", "grocery", "compact"] } }, ["collectionId"]),
  },
  {
    name: "store_rail", version: "1.0.0", description: "Horizontal store/provider collection",
    requiredCapabilities: ["catalog"], allowedActions: ["navigate"], defaultProps: { collectionId: "nearby_stores", titleKey: "popular_near_you", limit: 12 },
    schema: objectSchema({ collectionId: { type: "string" }, titleKey: { type: "string" }, limit: { type: "integer", minimum: 1, maximum: 30 } }, ["collectionId"]),
  },
  {
    name: "reorder_rail", version: "1.0.0", description: "Previous-order recommendations",
    requiredCapabilities: ["orders"], allowedActions: ["navigate", "add_to_cart"], defaultProps: { titleKey: "reorder", limit: 12 },
    schema: objectSchema({ titleKey: { type: "string" }, limit: { type: "integer", minimum: 1, maximum: 20 } }),
  },
  {
    name: "order_rating_prompt", version: "1.0.0", description: "Eligible previous-order rating prompt",
    requiredCapabilities: ["orders", "reviews"], allowedActions: ["navigate", "track_event"], defaultProps: { titleKey: "rate_previous_order", dismissible: true },
    schema: objectSchema({ titleKey: { type: "string" }, dismissible: { type: "boolean" } }),
  },
  {
    name: "catalog_merchandising", version: "1.1.0", description: "Native catalog configuration with subcategory rail and governed card fields",
    requiredCapabilities: ["catalog", "pagination"], allowedActions: ["navigate", "add_to_cart", "track_event"], defaultProps: { collectionId: "category_context", defaultSort: "relevance", enabledFilters: ["sort", "price_drop", "dietary"], columns: 2, subcategoryRail: true, showResultCount: true, productCardFields: ["rating", "delivery", "variant", "discount", "saved"] },
    schema: objectSchema({ collectionId: { type: "string" }, defaultSort: { enum: ["relevance", "price_asc", "price_desc", "discount"] }, enabledFilters: { type: "array", maxItems: 12 }, columns: { type: "integer", minimum: 2, maximum: 5 }, subcategoryRail: { type: "boolean" }, showResultCount: { type: "boolean" }, productCardFields: { type: "array", maxItems: 12 } }, ["collectionId"]),
  },
  {
    name: "commerce_notice", version: "1.0.0", description: "Sticky delivery/cart threshold notice",
    requiredCapabilities: ["cart"], allowedActions: ["navigate"], defaultProps: { messageKey: "free_delivery_threshold", ruleKey: "delivery.free_threshold" },
    schema: objectSchema({ messageKey: { type: "string" }, ruleKey: { type: "string" } }, ["messageKey", "ruleKey"]),
  },
  {
    name: "banner_carousel", version: "1.0.0", description: "Auto-playing responsive campaign carousel",
    requiredCapabilities: ["responsive_image", "carousel"], allowedActions: ["navigate", "track_event"], defaultProps: { collectionId: "home_banners", aspectRatio: 2.1, autoplayMs: 4500, indicator: "dots", accessibilityLabel: "Featured offers" },
    schema: objectSchema({ collectionId: { type: "string" }, aspectRatio: { type: "number", minimum: 0.8, maximum: 4 }, autoplayMs: { type: "integer", minimum: 0, maximum: 15000 }, indicator: { enum: ["dots", "fraction", "none"] }, accessibilityLabel: { type: "string" } }, ["collectionId", "accessibilityLabel"]),
  },
  {
    name: "story_rail", version: "1.0.0", description: "Short-lived circular campaign stories",
    requiredCapabilities: ["responsive_image"], allowedActions: ["navigate", "track_event"], defaultProps: { collectionId: "brand_stories", titleKey: "discover", itemSize: "medium" },
    schema: objectSchema({ collectionId: { type: "string" }, titleKey: { type: "string" }, itemSize: { enum: ["small", "medium", "large"] } }, ["collectionId"]),
  },
  {
    name: "category_grid", version: "1.0.0", description: "Responsive icon-led category discovery grid",
    requiredCapabilities: ["catalog", "responsive_image"], allowedActions: ["navigate", "track_event"], defaultProps: { collectionId: "top_categories", titleKey: "shop_by_category", columns: 4, showLabels: true },
    schema: objectSchema({ collectionId: { type: "string" }, titleKey: { type: "string" }, columns: { type: "integer", minimum: 2, maximum: 6 }, showLabels: { type: "boolean" } }, ["collectionId"]),
  },
  {
    name: "deal_countdown", version: "1.0.0", description: "Time-bound offer with server-authoritative expiry",
    requiredCapabilities: ["clock_sync"], allowedActions: ["navigate", "track_event"], defaultProps: { campaignId: "flash_sale", titleKey: "deal_ends_in", endsAt: "2027-01-01T00:00:00Z", expiredBehavior: "hide" },
    schema: objectSchema({ campaignId: { type: "string" }, titleKey: { type: "string" }, endsAt: { type: "string" }, expiredBehavior: { enum: ["hide", "show_expired", "fallback"] } }, ["campaignId", "endsAt"]),
  },
  {
    name: "loyalty_wallet", version: "1.0.0", description: "Personalized loyalty, pass and savings summary",
    requiredCapabilities: ["identity", "loyalty"], allowedActions: ["navigate", "track_event"], defaultProps: { titleKey: "your_rewards", style: "compact", signedOutBehavior: "join_prompt" },
    schema: objectSchema({ titleKey: { type: "string" }, style: { enum: ["compact", "card", "banner"] }, signedOutBehavior: { enum: ["hide", "join_prompt"] } }),
  },
  {
    name: "personalized_recommendations", version: "1.0.0", description: "Explainable recommendation collection",
    requiredCapabilities: ["catalog", "personalization", "cart"], allowedActions: ["navigate", "add_to_cart", "track_event"], defaultProps: { strategy: "recent_affinity", titleKey: "picked_for_you", limit: 10, cardVariant: "grocery" },
    schema: objectSchema({ strategy: { enum: ["recent_affinity", "repeat_purchase", "trending_local", "contextual"] }, titleKey: { type: "string" }, limit: { type: "integer", minimum: 1, maximum: 30 }, cardVariant: { enum: ["food", "grocery", "compact"] } }, ["strategy"]),
  },
  {
    name: "intent_tab_rail", version: "1.1.0", description: "Module-scoped quick intent and merchandising tabs",
    requiredCapabilities: ["collections"], allowedActions: ["navigate", "track_event"], defaultProps: { collectionId: "home_intents", titleKey: "browse", labels: ["All", "Offers", "Popular"], maxItems: 6, style: "icon_underline", activeIndex: 0 },
    schema: objectSchema({ collectionId: { type: "string" }, titleKey: { type: "string" }, labels: { type: "array", maxItems: 8 }, maxItems: { type: "integer", minimum: 2, maximum: 8 }, style: { enum: ["icon_underline", "pills", "segmented"] }, activeIndex: { type: "integer", minimum: 0, maximum: 7 } }, ["collectionId", "labels"]),
  },
  {
    name: "campaign_mosaic", version: "1.1.0", description: "Responsive campaign mosaic with governed media and collection references",
    requiredCapabilities: ["responsive_image"], allowedActions: ["navigate", "track_event"], defaultProps: { collectionId: "home_campaigns", titleKey: "featured", eyebrowKey: "limited_time", ctaKey: "explore", layout: "hero_plus_side", visualStyle: "deal_story", maxItems: 4, peekNext: true },
    schema: objectSchema({ collectionId: { type: "string" }, titleKey: { type: "string" }, eyebrowKey: { type: "string" }, ctaKey: { type: "string" }, layout: { enum: ["hero_plus_side", "two_column", "horizontal"] }, visualStyle: { enum: ["deal_story", "seasonal", "product_grid"] }, maxItems: { type: "integer", minimum: 1, maximum: 6 }, peekNext: { type: "boolean" } }, ["collectionId"]),
  },
  {
    name: "operational_notice", version: "1.0.0", description: "Core-backed weather, availability, or delivery operations notice",
    requiredCapabilities: ["serviceability"], allowedActions: ["navigate", "track_event"], defaultProps: { titleKey: "delivery_update", tone: "info", dismissible: false },
    schema: objectSchema({ titleKey: { type: "string" }, tone: { enum: ["info", "warning", "success"] }, dismissible: { type: "boolean" } }),
  },
  {
    name: "order_again_mosaic", version: "1.0.0", description: "Personalized prior-purchase category mosaic",
    requiredCapabilities: ["orders", "catalog"], allowedActions: ["navigate", "add_to_cart", "track_event"], defaultProps: { titleKey: "order_again", maxGroups: 4, previewItems: 4 },
    schema: objectSchema({ titleKey: { type: "string" }, maxGroups: { type: "integer", minimum: 1, maximum: 8 }, previewItems: { type: "integer", minimum: 1, maximum: 6 } }),
  },
  {
    name: "recently_viewed_rail", version: "1.0.0", description: "Privacy-bounded recently viewed catalog rail",
    requiredCapabilities: ["catalog", "recently_viewed"], allowedActions: ["navigate", "add_to_cart", "track_event"], defaultProps: { titleKey: "recently_viewed", limit: 12, cardVariant: "grocery" },
    schema: objectSchema({ titleKey: { type: "string" }, limit: { type: "integer", minimum: 1, maximum: 30 }, cardVariant: { enum: ["food", "grocery", "compact"] } }),
  },
  {
    name: "grouped_category_directory", version: "1.0.0", description: "Grouped category destination using Core-owned category identities",
    requiredCapabilities: ["catalog", "responsive_image"], allowedActions: ["navigate", "track_event"], defaultProps: { titleKey: "categories", groupStyle: "sectioned_grid", columns: 4, showSearch: true },
    schema: objectSchema({ titleKey: { type: "string" }, groupStyle: { enum: ["sectioned_grid", "store_then_grid"] }, columns: { type: "integer", minimum: 2, maximum: 6 }, showSearch: { type: "boolean" } }),
  },
  {
    name: "reorder_catalog", version: "1.0.0", description: "Full prior-purchase destination with live catalog reconciliation",
    requiredCapabilities: ["orders", "catalog", "pagination", "cart"], allowedActions: ["navigate", "open_search", "add_to_cart", "track_event"], defaultProps: { titleKey: "reordered_items", groupRail: true, search: true, enabledFilters: ["sort", "price_drop", "type"], columns: 2 },
    schema: objectSchema({ titleKey: { type: "string" }, groupRail: { type: "boolean" }, search: { type: "boolean" }, enabledFilters: { type: "array", maxItems: 10 }, columns: { type: "integer", minimum: 2, maximum: 4 } }),
  },
  {
    name: "mini_cart_bar", version: "1.0.0", description: "Native cart summary and threshold progress presentation",
    requiredCapabilities: ["cart"], allowedActions: ["navigate", "track_event"], defaultProps: { style: "floating", showItemPreview: true, showThresholdProgress: true },
    schema: objectSchema({ style: { enum: ["floating", "sticky"] }, showItemPreview: { type: "boolean" }, showThresholdProgress: { type: "boolean" } }),
  },
  {
    name: "rich_content", version: "1.0.0", description: "Localized editorial text with safe formatting",
    requiredCapabilities: ["rich_text"], allowedActions: ["navigate", "open_external_url", "track_event"], defaultProps: { titleKey: "whats_new", bodyKey: "campaign_description", alignment: "start", tone: "neutral" },
    schema: objectSchema({ titleKey: { type: "string" }, bodyKey: { type: "string" }, alignment: { enum: ["start", "center", "end"] }, tone: { enum: ["neutral", "info", "success", "warning"] } }, ["bodyKey"]),
  },
  {
    name: "spacer", version: "1.0.0", description: "Token-based responsive layout spacing",
    requiredCapabilities: [], allowedActions: [], defaultProps: { size: "md", showDivider: false },
    schema: objectSchema({ size: { enum: ["xs", "sm", "md", "lg", "xl"] }, showDivider: { type: "boolean" } }),
  },
  {
    name: "flavour_fest", version: "1.0.0", description: "Dynamic festive banner with custom mascots, 3D titles, and offer cards",
    requiredCapabilities: ["responsive_image", "catalog"], allowedActions: ["navigate", "track_event"],
    defaultProps: { title: "FLAVOURFEST", orderButtonText: "ORDER NOW", orderButtonQuery: "offer" },
    schema: objectSchema({ title: { type: "string" }, orderButtonText: { type: "string" }, orderButtonQuery: { type: "string" } }),
  },
];

const widget = (id: string, type: string, props: Record<string, unknown>, dataSource?: string) => ({
  id, type, version: getWidgetDefinition(type)?.version || "1.0.0", props,
  ...(dataSource ? { dataSource: { key: dataSource, params: {}, emptyBehavior: "hide_section" as const } } : {}),
  actions: [],
});

const foodShell: NonNullable<AuthoringDocument["experienceShell"]> = {
  module: "food",
  themeFamily: "food_dark",
  showDeliveryContext: true,
  cartCompatibilityPolicy: "confirm_switch",
  nativeCartSurface: "mini_cart",
  appearance: { headerStyle: "immersive", moduleTabStyle: "arched_cards", searchStyle: "floating", navigationStyle: "edge_bar", contentDensity: "comfortable", cardStyle: "squircle", campaignMotion: "lively" },
  menu: [
    { id: "food_home", labelKey: "menu.food", iconToken: "nav.food", destination: "home_food" },
    { id: "food_rapid", labelKey: "menu.rapid", iconToken: "nav.rapid", destination: "collection_listing", params: { collectionId: "food_rapid" } },
    { id: "food_gourmet", labelKey: "menu.gourmet", iconToken: "nav.gourmet", destination: "collection_listing", params: { collectionId: "food_gourmet" } },
    { id: "food_wellbeing", labelKey: "menu.eat_well", iconToken: "nav.wellbeing", destination: "collection_listing", params: { collectionId: "food_wellbeing" } },
    { id: "food_reorder", labelKey: "menu.reorder", iconToken: "nav.reorder", destination: "reorder", requiresCapabilities: ["orders"] },
  ],
};

const quickCommerceShell: NonNullable<AuthoringDocument["experienceShell"]> = {
  module: "quick_commerce",
  themeFamily: "quick_commerce_mint",
  showDeliveryContext: true,
  cartCompatibilityPolicy: "confirm_switch",
  nativeCartSurface: "mini_cart",
  appearance: { headerStyle: "immersive", moduleTabStyle: "arched_cards", searchStyle: "outlined", navigationStyle: "edge_bar", contentDensity: "comfortable", cardStyle: "rounded", campaignMotion: "subtle" },
  menu: [
    { id: "qc_home", labelKey: "menu.quick_shop", iconToken: "nav.quick_shop", destination: "home_quick_commerce" },
    { id: "qc_categories", labelKey: "menu.categories", iconToken: "nav.categories", destination: "category_directory" },
    { id: "qc_reorder", labelKey: "menu.reorder", iconToken: "nav.reorder", destination: "reorder", requiresCapabilities: ["orders"] },
    { id: "qc_services", labelKey: "menu.services", iconToken: "nav.services", destination: "collection_listing", params: { collectionId: "quick_services" } },
  ],
};

const groceryShell: NonNullable<AuthoringDocument["experienceShell"]> = {
  module: "grocery",
  themeFamily: "grocery_fresh",
  showDeliveryContext: true,
  cartCompatibilityPolicy: "confirm_switch",
  nativeCartSurface: "mini_cart",
  appearance: { headerStyle: "immersive", moduleTabStyle: "arched_cards", searchStyle: "floating", navigationStyle: "edge_bar", contentDensity: "comfortable", cardStyle: "squircle", campaignMotion: "lively" },
  menu: [
    { id: "grocery_home", labelKey: "menu.grocery", iconToken: "nav.grocery", destination: "home_grocery" },
    { id: "grocery_categories", labelKey: "menu.categories", iconToken: "nav.categories", destination: "category_directory" },
    { id: "grocery_reorder", labelKey: "menu.reorder", iconToken: "nav.reorder", destination: "reorder", requiresCapabilities: ["orders"] },
    { id: "grocery_cart", labelKey: "menu.cart", iconToken: "nav.cart", destination: "cart" },
  ],
};

export const referenceTemplates: AuthoringDocument[] = [
  {
    schemaVersion: "1.0", pageName: "home_grocery", displayName: "Grocery Home", description: "Quick Grocery home with admin-controlled dynamic experience layout", layoutName: "Grocery Home v1", themeId: null, templateFamily: "grocery_home", experienceShell: groceryShell,
    sections: [
      { id: "hero_fest_deals", name: "Hero Fest Deals", order: 0, enabled: true, visible: true, constraints: { enabled: true, visible: true }, widgets: [widget("hero_fest_banner", "hero_campaign", { campaignId: "hero_fest_grocery", aspectRatio: 1.8, accessibilityLabel: "Hero Fest Deals" })] },
      { id: "steal_deals", name: "Steal Deals", order: 1, enabled: true, visible: true, constraints: { enabled: true, visible: true }, widgets: [widget("steal_deals_shelf", "product_rail", { collectionId: "steal_deals", titleKey: "steal_deals", limit: 6, cardVariant: "grocery" })] },
      { id: "featured_offers", name: "Featured & Offers", order: 2, enabled: true, visible: true, constraints: { enabled: true, visible: true }, widgets: [widget("featured_offers_grid", "promo_grid", { collectionId: "featured_promotions", columns: 2, titleKey: "featured_offers" })] },
      { id: "salon_bloom", name: "Salon & Bloom", order: 3, enabled: true, visible: true, constraints: { enabled: true, visible: true }, widgets: [widget("salon_bloom_banner", "hero_campaign", { campaignId: "salon_bloom", aspectRatio: 2.1, accessibilityLabel: "Salon & Bloom at home" })] },
      { id: "category_grids", name: "Category Grids", order: 4, enabled: true, visible: true, constraints: { enabled: true, visible: true }, widgets: [widget("grocery_categories_grid", "category_grid", { collectionId: "top_categories", titleKey: "shop_by_category", columns: 4, showLabels: true })] },
      { id: "curated_products", name: "Curated Products", order: 5, enabled: true, visible: true, constraints: { enabled: true, visible: true }, widgets: [widget("curated_products_rail", "product_rail", { collectionId: "curated_products", titleKey: "curated_for_you", limit: 10, cardVariant: "grocery" })] },
      { id: "lifestyle_categories", name: "Lifestyle Categories", order: 6, enabled: true, visible: true, constraints: { enabled: true, visible: true }, widgets: [widget("lifestyle_promo_grid", "promo_grid", { collectionId: "lifestyle_categories", columns: 2, titleKey: "lifestyle_and_more" })] },
      { id: "flash_deals", name: "Flash Deals", order: 7, enabled: true, visible: true, constraints: { enabled: true, visible: true }, widgets: [widget("flash_deals_countdown", "deal_countdown", { campaignId: "flash_sale", titleKey: "deal_ends_in", endsAt: "2027-01-01T00:00:00Z", expiredBehavior: "fallback" })] },
      { id: "store_explorer", name: "Explore Stores", order: 8, enabled: true, visible: true, constraints: { enabled: true, visible: true }, widgets: [widget("store_explorer_rail", "store_rail", { collectionId: "explore_stores", titleKey: "explore_stores", limit: 10 })] },
    ],
  },
  {
    schemaVersion: "1.0", pageName: "home_grocery_diwali", displayName: "Diwali 2026", description: "Diwali 2026 Grand Celebration Experience with Flash Deals elevated and Salon & Bloom hidden during peak rush", layoutName: "Diwali 2026 Celebration", themeId: null, templateFamily: "grocery_home", experienceShell: groceryShell,
    sections: [
      { id: "hero_fest_deals", name: "Hero Fest Deals (Diwali Grand Sweets & Lights)", order: 0, enabled: true, visible: true, constraints: { enabled: true, visible: true }, widgets: [widget("hero_fest_diwali", "hero_campaign", { campaignId: "diwali_grand_sale", aspectRatio: 1.8, accessibilityLabel: "Diwali Grand Sweets & Lights Festival" })] },
      { id: "flash_deals", name: "Flash Deals (Diwali Midnight Mega Rush)", order: 1, enabled: true, visible: true, constraints: { enabled: true, visible: true }, widgets: [widget("flash_deals_diwali", "deal_countdown", { campaignId: "diwali_midnight_deals", titleKey: "diwali_sale_ends_in", endsAt: "2026-11-15T00:00:00Z", expiredBehavior: "fallback" })] },
      { id: "steal_deals", name: "Steal Deals (Festive Steals)", order: 2, enabled: true, visible: true, constraints: { enabled: true, visible: true }, widgets: [widget("steal_deals_diwali", "product_rail", { collectionId: "festive_steals", titleKey: "festive_steals", limit: 8, cardVariant: "grocery" })] },
      { id: "featured_offers", name: "Featured & Offers (Diwali Combos)", order: 3, enabled: true, visible: true, constraints: { enabled: true, visible: true }, widgets: [widget("featured_offers_diwali", "promo_grid", { collectionId: "diwali_combos", columns: 2, titleKey: "diwali_special_offers" })] },
      { id: "category_grids", name: "Category Grids (Pooja & Sweets Categories)", order: 4, enabled: true, visible: true, constraints: { enabled: true, visible: true }, widgets: [widget("categories_diwali", "category_grid", { collectionId: "diwali_categories", titleKey: "shop_festive_essentials", columns: 4, showLabels: true })] },
      { id: "curated_products", name: "Curated Products (Handpicked for Pooja)", order: 5, enabled: true, visible: true, constraints: { enabled: true, visible: true }, widgets: [widget("curated_diwali", "product_rail", { collectionId: "pooja_essentials", titleKey: "handpicked_for_pooja", limit: 12, cardVariant: "grocery" })] },
      { id: "lifestyle_categories", name: "Lifestyle Categories (Ethnic Wear & Home Decor)", order: 6, enabled: true, visible: true, constraints: { enabled: true, visible: true }, widgets: [widget("lifestyle_diwali", "promo_grid", { collectionId: "ethnic_decor", columns: 2, titleKey: "ethnic_fashion_and_decor" })] },
      { id: "salon_bloom", name: "Salon & Bloom", order: 7, enabled: false, visible: false, constraints: { enabled: false, visible: false }, widgets: [widget("salon_bloom_diwali", "hero_campaign", { campaignId: "salon_bloom", aspectRatio: 2.1, accessibilityLabel: "Salon & Bloom at home" })] },
    ],
  },
  {
    schemaVersion: "1.0", pageName: "home_grocery_summer", displayName: "Summer Fest 2027", description: "Summer Fest 2027 with cool drinks, hydration categories moved to position 2, and fresh summer bloom", layoutName: "Summer Cool Fest 2027", themeId: null, templateFamily: "grocery_home", experienceShell: groceryShell,
    sections: [
      { id: "hero_fest_deals", name: "Hero Fest Deals (Chill Summer Splash)", order: 0, enabled: true, visible: true, constraints: { enabled: true, visible: true }, widgets: [widget("hero_fest_summer", "hero_campaign", { campaignId: "summer_cool_sale", aspectRatio: 1.8, accessibilityLabel: "Chill Summer Splash" })] },
      { id: "category_grids", name: "Category Grids (Cold Drinks & Ice Creams)", order: 1, enabled: true, visible: true, constraints: { enabled: true, visible: true }, widgets: [widget("categories_summer", "category_grid", { collectionId: "summer_hydration", titleKey: "cold_drinks_and_icecreams", columns: 4, showLabels: true })] },
      { id: "steal_deals", name: "Steal Deals (Summer Steals)", order: 2, enabled: true, visible: true, constraints: { enabled: true, visible: true }, widgets: [widget("steal_deals_summer", "product_rail", { collectionId: "summer_steals", titleKey: "summer_steals", limit: 6, cardVariant: "grocery" })] },
      { id: "curated_products", name: "Curated Products (Watermelons & Mangoes)", order: 3, enabled: true, visible: true, constraints: { enabled: true, visible: true }, widgets: [widget("curated_summer", "product_rail", { collectionId: "seasonal_fruits", titleKey: "fresh_mangoes_and_fruits", limit: 10, cardVariant: "grocery" })] },
      { id: "featured_offers", name: "Featured & Offers", order: 4, enabled: true, visible: true, constraints: { enabled: true, visible: true }, widgets: [widget("featured_summer", "promo_grid", { collectionId: "summer_offers", columns: 2, titleKey: "cool_summer_discounts" })] },
      { id: "salon_bloom", name: "Salon & Bloom (Summer Sunscreen & Care)", order: 5, enabled: true, visible: true, constraints: { enabled: true, visible: true }, widgets: [widget("salon_summer", "hero_campaign", { campaignId: "summer_glow", aspectRatio: 2.1, accessibilityLabel: "Summer Sunscreen & Care" })] },
      { id: "lifestyle_categories", name: "Lifestyle Categories (Beach & Summer Gear)", order: 6, enabled: true, visible: true, constraints: { enabled: true, visible: true }, widgets: [widget("lifestyle_summer", "promo_grid", { collectionId: "summer_lifestyle", columns: 2, titleKey: "summer_wardrobe_and_sunglasses" })] },
      { id: "flash_deals", name: "Flash Deals", order: 7, enabled: true, visible: true, constraints: { enabled: true, visible: true }, widgets: [widget("flash_summer", "deal_countdown", { campaignId: "summer_flash", titleKey: "flash_deal_ends_in", endsAt: "2027-05-30T00:00:00Z", expiredBehavior: "fallback" })] },
    ],
  },
  {
    schemaVersion: "1.0", pageName: "home_grocery_monster", displayName: "Monster Sale 2027", description: "Monster Sale 2027 with Steal Deals #1, Monster Hero #2, and massive deal countdowns", layoutName: "Monster Mega Deals 2027", themeId: null, templateFamily: "grocery_home", experienceShell: groceryShell,
    sections: [
      { id: "steal_deals", name: "Steal Deals (Monster Steals #1)", order: 0, enabled: true, visible: true, constraints: { enabled: true, visible: true }, widgets: [widget("steal_monster", "product_rail", { collectionId: "monster_steals", titleKey: "monster_unbeatable_steals", limit: 8, cardVariant: "grocery" })] },
      { id: "hero_fest_deals", name: "Hero Fest Deals (Monster 90% Off Mega Sale)", order: 1, enabled: true, visible: true, constraints: { enabled: true, visible: true }, widgets: [widget("hero_monster", "hero_campaign", { campaignId: "monster_sale_banner", aspectRatio: 1.8, accessibilityLabel: "Monster 90% Off Mega Sale" })] },
      { id: "flash_deals", name: "Flash Deals (Monster Hourly Drop)", order: 2, enabled: true, visible: true, constraints: { enabled: true, visible: true }, widgets: [widget("flash_monster", "deal_countdown", { campaignId: "monster_hourly_countdown", titleKey: "monster_hourly_ends_in", endsAt: "2027-08-31T00:00:00Z", expiredBehavior: "fallback" })] },
      { id: "featured_offers", name: "Featured & Offers", order: 3, enabled: true, visible: true, constraints: { enabled: true, visible: true }, widgets: [widget("featured_monster", "promo_grid", { collectionId: "monster_offers", columns: 2, titleKey: "monster_bank_offers" })] },
      { id: "curated_products", name: "Curated Products", order: 4, enabled: true, visible: true, constraints: { enabled: true, visible: true }, widgets: [widget("curated_monster", "product_rail", { collectionId: "monster_picks", titleKey: "top_monster_picks", limit: 12, cardVariant: "grocery" })] },
      { id: "category_grids", name: "Category Grids", order: 5, enabled: true, visible: true, constraints: { enabled: true, visible: true }, widgets: [widget("categories_monster", "category_grid", { collectionId: "all_grocery_categories", titleKey: "explore_all_categories", columns: 4, showLabels: true })] },
      { id: "lifestyle_categories", name: "Lifestyle Categories", order: 6, enabled: true, visible: true, constraints: { enabled: true, visible: true }, widgets: [widget("lifestyle_monster", "promo_grid", { collectionId: "monster_lifestyle", columns: 2, titleKey: "lifestyle_mega_discounts" })] },
      { id: "salon_bloom", name: "Salon & Bloom", order: 7, enabled: true, visible: true, constraints: { enabled: true, visible: true }, widgets: [widget("salon_monster", "hero_campaign", { campaignId: "salon_bloom_monster", aspectRatio: 2.1, accessibilityLabel: "Salon & Bloom Deals" })] },
    ],
  },
  {
    schemaVersion: "1.0", pageName: "home_food", displayName: "Food Home", description: "Quick food marketplace home with governed discovery, campaigns, collections, and navigation", layoutName: "Food Home v2", themeId: null, templateFamily: "food_home", experienceShell: foodShell,
    sections: [
      { id: "food_discovery", name: "Discovery", order: 0, constraints: { nativeHeader: true }, widgets: [widget("food_modules", "module_selector", { style: "arched_cards", showEta: true, showLabels: true, showBadges: true, enabledModules: ["food", "quick_commerce"], disabledModules: ["dineout", "scenes"] }), widget("food_search", "search_entry", { hintKey: "search_for_food", sticky: true, voice: true, trailingAction: "dietary", hintMode: "rotating", presentation: "floating", showCompanion: true }), widget("food_intents", "intent_tab_rail", { collectionId: "food_home_intents", titleKey: "browse_food", labels: ["All", "Gourmet", "Offers", "Rapid"], maxItems: 6, style: "icon_underline", activeIndex: 0 }, "campaign.collection.v1")] },
      { id: "food_campaigns", name: "Campaigns", order: 1, constraints: {}, widgets: [widget("food_campaign_mosaic", "campaign_mosaic", { collectionId: "food_home_campaigns", titleKey: "up_to_70_percent_off", eyebrowKey: "festival_of_flavours", ctaKey: "view_deals", layout: "horizontal", visualStyle: "deal_story", maxItems: 5, peekNext: true }, "campaign.collection.v1"), widget("food_operations", "operational_notice", { titleKey: "delivery_update", tone: "info", dismissible: false }, "context.operational_notice.v1")] },
      { id: "food_merchandising", name: "Merchandising", order: 2, constraints: {}, widgets: [widget("food_reorder", "reorder_rail", { titleKey: "reorder", limit: 12 }, "orders.reorder.v1"), widget("food_stores", "store_rail", { collectionId: "food_rapid", titleKey: "food_delivered_rapidly", limit: 12 }, "catalog.stores.v1"), widget("food_collections", "product_rail", { collectionId: "food_curated", titleKey: "popular_near_you", limit: 12, cardVariant: "food" }, "catalog.items.v2")] },
    ],
  },
  {
    schemaVersion: "1.0", pageName: "home_quick_commerce", displayName: "Quick Commerce Home", description: "Quick quick-commerce home with campaigns, repeat purchase, recent views, and category discovery", layoutName: "Quick Commerce Home v2", themeId: null, templateFamily: "quick_commerce_home", experienceShell: quickCommerceShell,
    sections: [
      { id: "qc_discovery", name: "Discovery", order: 0, constraints: { nativeHeader: true }, widgets: [widget("qc_modules", "module_selector", { style: "arched_cards", showEta: true, showLabels: true, showBadges: true, enabledModules: ["food", "quick_commerce"], disabledModules: ["dineout", "scenes"] }), widget("qc_search", "search_entry", { hintKey: "search_fresh_products", sticky: true, voice: false, trailingAction: "saved", hintMode: "rotating", presentation: "outlined", showCompanion: true }), widget("qc_intents", "intent_tab_rail", { collectionId: "quick_home_intents", titleKey: "quick_actions", labels: ["Fresh", "Switch", "Delivery fee", "Seasonal", "Gifts"], maxItems: 6, style: "pills", activeIndex: 0 }, "campaign.collection.v1")] },
      { id: "qc_campaigns", name: "Campaigns", order: 1, constraints: {}, widgets: [widget("qc_campaign_mosaic", "campaign_mosaic", { collectionId: "quick_home_campaigns", titleKey: "seasonal_store", eyebrowKey: "curated_for_you", ctaKey: "shop_now", layout: "hero_plus_side", visualStyle: "seasonal", maxItems: 4, peekNext: true }, "campaign.collection.v1")] },
      { id: "qc_personal", name: "For you", order: 2, constraints: {}, widgets: [widget("qc_order_again", "order_again_mosaic", { titleKey: "order_again", maxGroups: 4, previewItems: 4 }, "orders.reorder_groups.v1"), widget("qc_recent", "recently_viewed_rail", { titleKey: "recently_viewed", limit: 12, cardVariant: "grocery" }, "catalog.recently_viewed.v1"), widget("qc_categories", "category_grid", { collectionId: "quick_top_categories", titleKey: "shop_by_category", columns: 4, showLabels: true }, "catalog.category_groups.v1"), widget("qc_products", "product_rail", { collectionId: "quick_curated", titleKey: "popular_near_you", limit: 12, cardVariant: "grocery" }, "catalog.items.v2"), widget("qc_cart", "mini_cart_bar", { style: "floating", showItemPreview: true, showThresholdProgress: true }, "cart.summary.v1")] },
    ],
  },
  {
    schemaVersion: "1.0", pageName: "category_directory", displayName: "Category Directory", description: "Grouped quick-commerce category destination", layoutName: "Category Directory v1", themeId: null, templateFamily: "category_directory", experienceShell: quickCommerceShell,
    sections: [
      { id: "category_directory_content", name: "Categories", order: 0, constraints: { nativeSliverLayout: true }, widgets: [widget("category_directory", "grouped_category_directory", { titleKey: "categories", groupStyle: "store_then_grid", columns: 4, showSearch: true }, "catalog.category_groups.v1"), widget("category_campaigns", "campaign_mosaic", { collectionId: "category_directory_campaigns", titleKey: "featured_stores", layout: "horizontal", maxItems: 4 }, "campaign.collection.v1"), widget("category_notice", "commerce_notice", { messageKey: "delivery_threshold", ruleKey: "delivery.threshold" }, "cart.threshold.v1")] },
    ],
  },
  {
    schemaVersion: "1.0", pageName: "category_listing", displayName: "Category Listing", description: "Native high-performance product grid with governed rail, facets, and product-card presentation", layoutName: "Category Listing v2", themeId: null, templateFamily: "category_listing", experienceShell: quickCommerceShell,
    sections: [
      { id: "catalog_config", name: "Catalog", order: 0, constraints: { nativeSliverLayout: true }, widgets: [widget("catalog_merch", "catalog_merchandising", { collectionId: "category_context", defaultSort: "relevance", enabledFilters: ["sort", "price_drop", "dietary", "type"], columns: 2, subcategoryRail: true, showResultCount: true, productCardFields: ["rating", "delivery", "variant", "discount", "saved"] }, "catalog.items.v2"), widget("catalog_notice", "commerce_notice", { messageKey: "delivery_threshold", ruleKey: "delivery.threshold" }, "cart.threshold.v1"), widget("catalog_cart", "mini_cart_bar", { style: "sticky", showItemPreview: true, showThresholdProgress: true }, "cart.summary.v1")] },
    ],
  },
  {
    schemaVersion: "1.0", pageName: "reorder", displayName: "Reorder", description: "Dedicated prior-purchase destination with current catalog reconciliation", layoutName: "Reorder v1", themeId: null, templateFamily: "reorder_listing", experienceShell: quickCommerceShell,
    sections: [
      { id: "reorder_content", name: "Reordered items", order: 0, constraints: { nativeSliverLayout: true, requiresSignIn: true }, widgets: [widget("reorder_catalog", "reorder_catalog", { titleKey: "reordered_items", groupRail: true, search: true, enabledFilters: ["sort", "price_drop", "type"], columns: 2 }, "orders.reorder_catalog.v1"), widget("reorder_cart", "mini_cart_bar", { style: "sticky", showItemPreview: true, showThresholdProgress: true }, "cart.summary.v1")] },
    ],
  },
];

export function getWidgetDefinition(name: string): WidgetDefinition | undefined {
  return widgetRegistry.find((item) => item.name === name);
}
