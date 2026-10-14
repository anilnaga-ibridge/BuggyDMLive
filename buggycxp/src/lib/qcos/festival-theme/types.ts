/**
 * CXP Admin-Defined Festival Theme & Permission Engine
 * 
 * Data-driven architecture where festivals have NO hardcoded presets.
 * Admin decides which permissions are enabled, what scopes apply,
 * and what visual values override the base CXP Design System.
 */

export type FestivalStatus = "draft" | "scheduled" | "published" | "archived";

export type FestivalOverrideScope =
  | "GLOBAL"
  | "HOME"
  | "HEADER"
  | "SEARCH"
  | "HERO"
  | "CATEGORIES"
  | "PRODUCTS"
  | "STORES"
  | "OFFERS"
  | "COUPONS"
  | "FLASH_DEALS"
  | "BOTTOM_NAV"
  | "SPECIFIC_SECTION";

export interface FestivalSchedule {
  startDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endDate: string;   // YYYY-MM-DD
  endTime: string;   // HH:mm
  timezone: string;  // e.g. "Asia/Kolkata"
  status?: "draft" | "active" | "expired" | "paused";
  priority?: number; // 1 to 100
}

// -------------------------------------------------------------
// 1. GRANULAR PERMISSIONS MODEL
// -------------------------------------------------------------

export interface FestivalDesignPermissions {
  colors: boolean;
  backgrounds: boolean;
  gradients: boolean;
  shapes: boolean;
  typography: boolean;
  fontFamily: boolean;
  fontWeight: boolean;
  fontScale: boolean;
  spacing: boolean;
  motion: boolean;
  elevation: boolean;
}

export interface FestivalComponentPermissions {
  productCards: boolean;
  categoryCards: boolean;
  storeCards: boolean;
  dealCards: boolean;
  buttons: boolean;
  badges: boolean;
  chips: boolean;
  sectionHeaders: boolean;
  search: boolean;
  deliveryHeader: boolean;
  bottomNavigation: boolean;
}

export interface FestivalVisualPermissions {
  heroImages: boolean;
  bannerImages: boolean;
  categoryImages: boolean;
  storeImages: boolean;
  productDecorations: boolean;
  icons: boolean;
  watermarks: boolean;
  patterns: boolean;
  decorativeArtwork: boolean;
  backgroundArtwork: boolean;
}

export interface FestivalThemePermissions {
  design: FestivalDesignPermissions;
  components: FestivalComponentPermissions;
  visuals: FestivalVisualPermissions;
}

export const DEFAULT_FESTIVAL_PERMISSIONS: FestivalThemePermissions = {
  design: {
    colors: false,
    backgrounds: false,
    gradients: false,
    shapes: false,
    typography: false,
    fontFamily: false,
    fontWeight: false,
    fontScale: false,
    spacing: false,
    motion: false,
    elevation: false,
  },
  components: {
    productCards: false,
    categoryCards: false,
    storeCards: false,
    dealCards: false,
    buttons: false,
    badges: false,
    chips: false,
    sectionHeaders: false,
    search: false,
    deliveryHeader: false,
    bottomNavigation: false,
  },
  visuals: {
    heroImages: false,
    bannerImages: false,
    categoryImages: false,
    storeImages: false,
    productDecorations: false,
    icons: false,
    watermarks: false,
    patterns: false,
    decorativeArtwork: false,
    backgroundArtwork: false,
  },
};

// -------------------------------------------------------------
// 2. GRANULAR COLOR OVERRIDES
// -------------------------------------------------------------

export interface ColorTargetApplication {
  primaryButtons?: boolean;
  addButtons?: boolean;
  activeIndicators?: boolean;
  bottomNavigation?: boolean;
  cardSurfaces?: boolean;
  screenCanvas?: boolean;
  headings?: boolean;
  prices?: boolean;
  discountBadges?: boolean;
}

export interface FestivalColorOverride {
  enabled: boolean;
  color: string;
  appliesTo?: ColorTargetApplication;
}

export interface FestivalColorsConfig {
  appBackground?: FestivalColorOverride;
  surface?: FestivalColorOverride;
  surfaceElevated?: FestivalColorOverride;
  primaryAction?: FestivalColorOverride;
  secondaryAccent?: FestivalColorOverride;
  accentHighlight?: FestivalColorOverride;
  mainText?: FestivalColorOverride;
  secondaryText?: FestivalColorOverride;
  mutedText?: FestivalColorOverride;
  success?: FestivalColorOverride;
  warning?: FestivalColorOverride;
  error?: FestivalColorOverride;
  info?: FestivalColorOverride;
  heroGradientStart?: FestivalColorOverride;
  heroGradientEnd?: FestivalColorOverride;
}

// -------------------------------------------------------------
// 3. BACKGROUND OVERRIDES PER SCOPE
// -------------------------------------------------------------

export type BackgroundType = "color" | "gradient" | "image" | "pattern" | "image_gradient";
export type BackgroundFit = "cover" | "contain" | "tile" | "center";
export type BackgroundPosition = "center" | "top" | "bottom" | "left" | "right";

export interface FestivalBackgroundOverride {
  scope: FestivalOverrideScope;
  targetSectionId?: string;
  enabled: boolean;
  type: BackgroundType;
  color?: string;
  gradientFrom?: string;
  gradientTo?: string;
  gradientAngle?: number; // e.g. 135deg
  imageUrl?: string;
  fit?: BackgroundFit;
  position?: BackgroundPosition;
  opacity?: number; // 0.0 to 1.0
  overlayTint?: string;
}

// -------------------------------------------------------------
// 4. TYPOGRAPHY & FONT OVERRIDES
// -------------------------------------------------------------

export type TypographyRole =
  | "display"
  | "h1"
  | "h2"
  | "h3"
  | "sectionTitle"
  | "bodyLarge"
  | "body"
  | "bodySmall"
  | "caption"
  | "price"
  | "discount"
  | "button"
  | "navigation";

export interface TypographyRoleConfig {
  enabled: boolean;
  fontFamily?: string;
  fontSize?: number; // px
  fontWeight?: number; // 400, 500, 600, 700, 800, 900
  lineHeight?: number; // e.g. 1.2
  letterSpacing?: string; // e.g. "-0.01em"
  color?: string;
}

export interface FestivalTypographyConfig {
  fontFamily?: string; // Global festival font override
  fontScale?: number;  // Multiplier e.g. 1.05
  roles: Partial<Record<TypographyRole, TypographyRoleConfig>>;
}

export interface FestivalFont {
  id: string;
  name: string;
  family: string;
  category: "sans-serif" | "serif" | "display" | "handwriting" | "monospace";
  googleFontUrl?: string;
  weights: number[];
  isCustom?: boolean;
}

// -------------------------------------------------------------
// 5. COMPONENT OVERRIDES
// -------------------------------------------------------------

export interface ProductCardComponentOverride {
  enabled: boolean;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  elevation?: "none" | "subtle" | "card" | "raised" | "floating";
  titleColor?: string;
  priceColor?: string;
  discountBadgeBg?: string;
  discountBadgeColor?: string;
  addButtonBg?: string;
  addButtonColor?: string;
  addButtonRadius?: number;
}

export interface CategoryCardComponentOverride {
  enabled: boolean;
  backgroundColor?: string;
  borderColor?: string;
  borderRadius?: number;
  iconBgColor?: string;
  labelColor?: string;
}

export interface StoreCardComponentOverride {
  enabled: boolean;
  backgroundColor?: string;
  borderColor?: string;
  borderRadius?: number;
  ratingBadgeBg?: string;
  ratingBadgeColor?: string;
  etaPillBg?: string;
  etaPillColor?: string;
  titleColor?: string;
}

export interface ButtonComponentOverride {
  enabled: boolean;
  primaryBg?: string;
  primaryTextColor?: string;
  secondaryBg?: string;
  secondaryTextColor?: string;
  borderRadius?: number;
  elevation?: "none" | "subtle" | "card" | "raised";
  fontWeight?: number;
}

export interface BadgeComponentOverride {
  enabled: boolean;
  discountBg?: string;
  discountTextColor?: string;
  dealBg?: string;
  dealTextColor?: string;
  statusBg?: string;
  statusTextColor?: string;
  borderRadius?: number;
}

export interface FestivalComponentsConfig {
  productCard?: ProductCardComponentOverride;
  categoryCard?: CategoryCardComponentOverride;
  storeCard?: StoreCardComponentOverride;
  button?: ButtonComponentOverride;
  badge?: BadgeComponentOverride;
}

// -------------------------------------------------------------
// 6. ICON OVERRIDES
// -------------------------------------------------------------

export type StandardIconKey =
  | "home"
  | "grocery"
  | "food"
  | "ecommerce"
  | "search"
  | "cart"
  | "profile"
  | "category"
  | "back"
  | "close"
  | "location"
  | "orders"
  | "offers"
  | "flash";

export interface FestivalIconOverride {
  iconKey: StandardIconKey | string;
  enabled: boolean;
  customAssetUrl: string;
  altText?: string;
  tintColor?: string;
}

// -------------------------------------------------------------
// 7. WATERMARK OVERRIDES
// -------------------------------------------------------------

export interface FestivalWatermarkOverride {
  id: string;
  name: string;
  enabled: boolean;
  scope: FestivalOverrideScope;
  targetSectionId?: string;
  assetUrl: string;
  position: "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right";
  size: "xs" | "sm" | "md" | "lg" | "xl" | "full";
  opacity: number; // 0.0 to 1.0 (e.g. 0.12)
  rotation?: number; // -180 to 180 degrees
  mobileEnabled: boolean;
  desktopEnabled: boolean;
  nonBlocking: boolean; // pointer-events: none
}

// -------------------------------------------------------------
// 8. GENERIC DECORATION OVERRIDES
// -------------------------------------------------------------

export type GenericDecorationType =
  | "image"
  | "pattern"
  | "glow"
  | "sparkle"
  | "paint"
  | "confetti"
  | "shape"
  | "custom_artwork";

export interface FestivalDecorationOverride {
  id: string;
  name: string;
  enabled: boolean;
  type: GenericDecorationType;
  scope: FestivalOverrideScope;
  targetSectionId?: string;
  assetUrl: string;
  altText?: string;
  positionX: "left" | "center" | "right";
  positionY: "top" | "center" | "bottom";
  size: "xs" | "sm" | "md" | "lg" | "xl" | "full";
  scale?: number; // 0.5 to 2.0
  opacity: number; // 0.0 to 1.0
  rotation?: number;
  animation?: "none" | "fade" | "float" | "pulse" | "shimmer";
  blendMode?: "normal" | "multiply" | "screen" | "overlay" | "soft_overlay";
  mobileEnabled: boolean;
  desktopEnabled: boolean;
  nonBlocking: boolean;
}

// -------------------------------------------------------------
// 9. SPACING, MOTION & ELEVATION OVERRIDES
// -------------------------------------------------------------

export interface FestivalSpacingConfig {
  contentPadding?: number; // px
  sectionGap?: number;     // px
  cardGap?: number;        // px
  gridGap?: number;        // px
  cardPadding?: number;    // px
  buttonPadding?: number;  // px
}

export interface FestivalMotionConfig {
  style?: "none" | "calm" | "spring" | "energetic";
  duration?: string; // e.g. "280ms"
  easing?: string;
  heroMotion?: boolean;
  decorativeMotion?: boolean;
}

export interface FestivalElevationConfig {
  cardElevation?: "none" | "subtle" | "card" | "raised" | "floating";
  buttonElevation?: "none" | "subtle" | "card" | "raised";
}

// -------------------------------------------------------------
// 10. ASSET MODEL
// -------------------------------------------------------------

export interface FestivalAsset {
  id: string;
  name: string;
  category: "hero" | "banner" | "icon" | "watermark" | "decoration" | "background" | "pattern";
  fileType: "svg" | "png" | "jpg" | "webp";
  url: string;
  previewUrl?: string;
  dimensions?: { width: number; height: number };
  fileSizeBytes?: number;
  tags?: string[];
  createdAt: string;
}

// -------------------------------------------------------------
// 11. COMPLETE ROOT FESTIVAL THEME MODEL
// -------------------------------------------------------------

export interface FestivalTheme {
  id: string;
  name: string;                  // e.g. "Diwali"
  campaignName: string;          // e.g. "Golden Celebration 2027"
  description: string;
  year: number;                  // e.g. 2027
  status: FestivalStatus;
  schedule: FestivalSchedule;
  permissions: FestivalThemePermissions;
  
  // Overrides configured by Admin
  colors: FestivalColorsConfig;
  backgrounds: FestivalBackgroundOverride[];
  typography: FestivalTypographyConfig;
  components: FestivalComponentsConfig;
  icons: FestivalIconOverride[];
  watermarks: FestivalWatermarkOverride[];
  decorations: FestivalDecorationOverride[];
  spacing: FestivalSpacingConfig;
  motion: FestivalMotionConfig;
  elevation: FestivalElevationConfig;

  // Metadata
  version: number;
  createdBy?: string;
  updatedAt: string;
}

export function createEmptyFestivalTheme(name = "New Festival", year = new Date().getFullYear()): FestivalTheme {
  const currentYear = year || new Date().getFullYear();
  return {
    id: `festival_${Date.now()}`,
    name,
    campaignName: `${name} ${currentYear}`,
    description: `Admin-configured festive design system for ${name}`,
    year: currentYear,
    status: "draft",
    schedule: {
      startDate: `${currentYear}-10-01`,
      startTime: "00:00",
      endDate: `${currentYear}-10-31`,
      endTime: "23:59",
      timezone: "Asia/Kolkata",
      status: "draft",
      priority: 1,
    },
    permissions: structuredClone(DEFAULT_FESTIVAL_PERMISSIONS),
    colors: {},
    backgrounds: [],
    typography: { roles: {} },
    components: {},
    icons: [],
    watermarks: [],
    decorations: [],
    spacing: {},
    motion: {},
    elevation: {},
    version: 1,
    updatedAt: new Date().toISOString(),
  };
}

export function createDiwali2026FestivalTheme(): FestivalTheme {
  return {
    id: "festival_diwali_2026",
    name: "Diwali 2026",
    campaignName: "Diwali 2026 · Shubh Deepavali Celebration",
    description: "Grand Diwali festive experience with royal purple canvas, glowing diyas, radiant golden accents, and festive product cards.",
    year: 2026,
    status: "published",
    schedule: {
      startDate: "2026-10-20",
      startTime: "00:00",
      endDate: "2026-10-25",
      endTime: "23:59",
      timezone: "Asia/Kolkata",
      priority: 10,
      status: "active",
    },
    permissions: {
      design: {
        colors: true,
        backgrounds: true,
        gradients: true,
        shapes: true,
        typography: true,
        fontFamily: true,
        fontWeight: true,
        fontScale: true,
        spacing: true,
        motion: true,
        elevation: true,
      },
      components: {
        productCards: true,
        categoryCards: true,
        storeCards: true,
        dealCards: true,
        buttons: true,
        badges: true,
        chips: true,
        sectionHeaders: true,
        search: true,
        deliveryHeader: true,
        bottomNavigation: true,
      },
      visuals: {
        heroImages: true,
        bannerImages: true,
        categoryImages: true,
        storeImages: true,
        productDecorations: true,
        icons: true,
        watermarks: true,
        patterns: true,
        decorativeArtwork: true,
        backgroundArtwork: true,
      },
    },
    colors: {
      appBackground: { enabled: true, color: "#240630" },
      surface: { enabled: true, color: "#370e44" },
      surfaceElevated: { enabled: true, color: "#481657" },
      primaryAction: { enabled: true, color: "#eab308" },
      secondaryAccent: { enabled: true, color: "#f97316" },
      accentHighlight: { enabled: true, color: "#fef08a" },
      mainText: { enabled: true, color: "#fef08a" },
      secondaryText: { enabled: true, color: "#e9d5ff" },
      mutedText: { enabled: true, color: "#a855f7" },
      success: { enabled: true, color: "#22c55e" },
      warning: { enabled: true, color: "#f59e0b" },
      error: { enabled: true, color: "#ef4444" },
      info: { enabled: true, color: "#38bdf8" },
      heroGradientStart: { enabled: true, color: "#4a0e17" },
      heroGradientEnd: { enabled: true, color: "#180222" },
    },
    backgrounds: [
      {
        scope: "GLOBAL",
        enabled: true,
        type: "color",
        color: "#240630",
        opacity: 1,
      },
      {
        scope: "HERO",
        enabled: true,
        type: "gradient",
        gradientFrom: "#4a0e17",
        gradientTo: "#180222",
        opacity: 1,
      },
    ],
    typography: {
      fontFamily: "'Playfair Display', serif",
      fontScale: 1.04,
      roles: {
        h1: { enabled: true, fontSize: 24, fontWeight: 800 },
        h2: { enabled: true, fontSize: 18, fontWeight: 700 },
        price: { enabled: true, fontSize: 13, fontWeight: 900 },
      },
    },
    components: {
      productCard: {
        enabled: true,
        borderRadius: 20,
        backgroundColor: "#370e44",
        borderColor: "#eab308",
        borderWidth: 1,
        elevation: "card",
      },
      categoryCard: {
        enabled: true,
        borderRadius: 22,
        backgroundColor: "#481657",
        borderColor: "#f97316",
      },
      button: {
        enabled: true,
        borderRadius: 14,
        primaryBg: "#eab308",
        primaryTextColor: "#240630",
        fontWeight: 800,
      },
      badge: {
        enabled: true,
        borderRadius: 8,
        discountBg: "#f97316",
        discountTextColor: "#ffffff",
      },
    },
    icons: [
      { iconKey: "cart", enabled: true, customAssetUrl: "" },
      { iconKey: "search", enabled: true, customAssetUrl: "" },
    ],
    watermarks: [
      {
        id: "wm_diwali_rangoli",
        name: "Shimmering Rangoli Watermark",
        scope: "GLOBAL",
        enabled: true,
        assetUrl: "https://images.unsplash.com/photo-1605647540924-852290f6b0d5?w=500&auto=format&fit=crop&q=60",
        position: "bottom-right",
        size: "xl",
        opacity: 0.14,
        mobileEnabled: true,
        desktopEnabled: true,
        nonBlocking: true,
      },
    ],
    decorations: [
      {
        id: "dec_diwali_sparkles",
        name: "Golden Sparkles",
        scope: "HERO",
        enabled: true,
        type: "confetti",
        assetUrl: "",
        size: "md",
        opacity: 0.9,
        positionX: "center",
        positionY: "center",
        mobileEnabled: true,
        desktopEnabled: true,
        nonBlocking: true,
      },
    ],
    spacing: {
      sectionGap: 18,
      cardGap: 8,
      cardPadding: 12,
      buttonPadding: 8,
    },
    motion: {
      style: "spring",
      duration: "280ms",
      heroMotion: true,
      decorativeMotion: true,
    },
    elevation: {
      cardElevation: "card",
      buttonElevation: "subtle",
    },
    version: 1,
    updatedAt: new Date().toISOString(),
  };
}
