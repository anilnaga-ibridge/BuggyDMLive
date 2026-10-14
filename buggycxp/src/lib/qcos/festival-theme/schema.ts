import { z } from "zod";
import type { FestivalTheme, FestivalSchedule, FestivalAsset } from "./types";

export const festivalScheduleSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  timezone: z.string().default("Asia/Kolkata"),
  status: z.enum(["draft", "active", "expired", "paused"]).optional(),
  priority: z.number().int().min(1).max(100).optional(),
}).refine((data) => {
  const start = new Date(`${data.startDate}T${data.startTime}:00`);
  const end = new Date(`${data.endDate}T${data.endTime}:00`);
  return !isNaN(start.getTime()) && !isNaN(end.getTime()) && end > start;
}, {
  message: "End date/time must be strictly after start date/time",
});

export const festivalColorOverrideSchema = z.object({
  enabled: z.boolean(),
  color: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/),
  appliesTo: z.object({
    primaryButtons: z.boolean().optional(),
    addButtons: z.boolean().optional(),
    activeIndicators: z.boolean().optional(),
    bottomNavigation: z.boolean().optional(),
    cardSurfaces: z.boolean().optional(),
    screenCanvas: z.boolean().optional(),
    headings: z.boolean().optional(),
    prices: z.boolean().optional(),
    discountBadges: z.boolean().optional(),
  }).optional(),
});

export const festivalBackgroundOverrideSchema = z.object({
  scope: z.enum([
    "GLOBAL",
    "HOME",
    "HEADER",
    "SEARCH",
    "HERO",
    "CATEGORIES",
    "PRODUCTS",
    "STORES",
    "OFFERS",
    "COUPONS",
    "FLASH_DEALS",
    "BOTTOM_NAV",
    "SPECIFIC_SECTION",
  ]),
  targetSectionId: z.string().optional(),
  enabled: z.boolean(),
  type: z.enum(["color", "gradient", "image", "pattern", "image_gradient"]),
  color: z.string().optional(),
  gradientFrom: z.string().optional(),
  gradientTo: z.string().optional(),
  gradientAngle: z.number().optional(),
  imageUrl: z.string().optional(),
  fit: z.enum(["cover", "contain", "tile", "center"]).optional(),
  position: z.enum(["center", "top", "bottom", "left", "right"]).optional(),
  opacity: z.number().min(0).max(1).optional(),
  overlayTint: z.string().optional(),
});

export const festivalWatermarkOverrideSchema = z.object({
  id: z.string(),
  name: z.string(),
  enabled: z.boolean(),
  scope: z.enum([
    "GLOBAL",
    "HOME",
    "HEADER",
    "SEARCH",
    "HERO",
    "CATEGORIES",
    "PRODUCTS",
    "STORES",
    "OFFERS",
    "COUPONS",
    "FLASH_DEALS",
    "BOTTOM_NAV",
    "SPECIFIC_SECTION",
  ]),
  targetSectionId: z.string().optional(),
  assetUrl: z.string(),
  position: z.enum(["center", "top-left", "top-right", "bottom-left", "bottom-right"]),
  size: z.enum(["xs", "sm", "md", "lg", "xl", "full"]),
  opacity: z.number().min(0).max(1),
  rotation: z.number().min(-180).max(180).optional(),
  mobileEnabled: z.boolean().default(true),
  desktopEnabled: z.boolean().default(true),
  nonBlocking: z.boolean().default(true),
});

export const festivalDecorationOverrideSchema = z.object({
  id: z.string(),
  name: z.string(),
  enabled: z.boolean(),
  type: z.enum(["image", "pattern", "glow", "sparkle", "paint", "confetti", "shape", "custom_artwork"]),
  scope: z.enum([
    "GLOBAL",
    "HOME",
    "HEADER",
    "SEARCH",
    "HERO",
    "CATEGORIES",
    "PRODUCTS",
    "STORES",
    "OFFERS",
    "COUPONS",
    "FLASH_DEALS",
    "BOTTOM_NAV",
    "SPECIFIC_SECTION",
  ]),
  targetSectionId: z.string().optional(),
  assetUrl: z.string(),
  altText: z.string().optional(),
  positionX: z.enum(["left", "center", "right"]),
  positionY: z.enum(["top", "center", "bottom"]),
  size: z.enum(["xs", "sm", "md", "lg", "xl", "full"]),
  scale: z.number().min(0.2).max(3).optional(),
  opacity: z.number().min(0).max(1),
  rotation: z.number().min(-180).max(180).optional(),
  animation: z.enum(["none", "fade", "float", "pulse", "shimmer"]).optional(),
  blendMode: z.enum(["normal", "multiply", "screen", "overlay", "soft_overlay"]).optional(),
  mobileEnabled: z.boolean().default(true),
  desktopEnabled: z.boolean().default(true),
  nonBlocking: z.boolean().default(true),
});

export const festivalThemeSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(80),
  campaignName: z.string().min(1).max(120),
  description: z.string().max(500),
  year: z.number().int().min(2020).max(2100),
  status: z.enum(["draft", "scheduled", "published", "archived"]),
  schedule: festivalScheduleSchema,
  permissions: z.object({
    design: z.object({
      colors: z.boolean(),
      backgrounds: z.boolean(),
      gradients: z.boolean(),
      shapes: z.boolean(),
      typography: z.boolean(),
      fontFamily: z.boolean(),
      fontWeight: z.boolean(),
      fontScale: z.boolean(),
      spacing: z.boolean(),
      motion: z.boolean(),
      elevation: z.boolean(),
    }),
    components: z.object({
      productCards: z.boolean(),
      categoryCards: z.boolean(),
      storeCards: z.boolean(),
      dealCards: z.boolean(),
      buttons: z.boolean(),
      badges: z.boolean(),
      chips: z.boolean(),
      sectionHeaders: z.boolean(),
      search: z.boolean(),
      deliveryHeader: z.boolean(),
      bottomNavigation: z.boolean(),
    }),
    visuals: z.object({
      heroImages: z.boolean(),
      bannerImages: z.boolean(),
      categoryImages: z.boolean(),
      storeImages: z.boolean(),
      productDecorations: z.boolean(),
      icons: z.boolean(),
      watermarks: z.boolean(),
      patterns: z.boolean(),
      decorativeArtwork: z.boolean(),
      backgroundArtwork: z.boolean(),
    }),
  }),
  colors: z.record(z.string(), festivalColorOverrideSchema).optional().default({}),
  backgrounds: z.array(festivalBackgroundOverrideSchema).default([]),
  typography: z.object({
    fontFamily: z.string().optional(),
    fontScale: z.number().optional(),
    roles: z.record(z.string(), z.object({
      enabled: z.boolean(),
      fontFamily: z.string().optional(),
      fontSize: z.number().optional(),
      fontWeight: z.number().optional(),
      lineHeight: z.number().optional(),
      letterSpacing: z.string().optional(),
      color: z.string().optional(),
    })).default({}),
  }).default({ roles: {} }),
  components: z.record(z.string(), z.any()).default({}),
  icons: z.array(z.object({
    iconKey: z.string(),
    enabled: z.boolean(),
    customAssetUrl: z.string(),
    altText: z.string().optional(),
    tintColor: z.string().optional(),
  })).default([]),
  watermarks: z.array(festivalWatermarkOverrideSchema).default([]),
  decorations: z.array(festivalDecorationOverrideSchema).default([]),
  spacing: z.record(z.string(), z.number()).default({}),
  motion: z.object({
    style: z.enum(["none", "calm", "spring", "energetic"]).optional(),
    duration: z.string().optional(),
    easing: z.string().optional(),
    heroMotion: z.boolean().optional(),
    decorativeMotion: z.boolean().optional(),
  }).default({}),
  elevation: z.object({
    cardElevation: z.enum(["none", "subtle", "card", "raised", "floating"]).optional(),
    buttonElevation: z.enum(["none", "subtle", "card", "raised"]).optional(),
  }).default({}),
  version: z.number().default(1),
  updatedAt: z.string(),
});

/**
 * Sanitize SVG strings against XSS attacks and executable payloads
 */
export function sanitizeSvgContent(rawSvg: string): string {
  if (!rawSvg || typeof rawSvg !== "string") return "";

  let cleaned = rawSvg
    // Strip <script>...</script>
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    // Strip on* event handlers (onload, onclick, onerror, etc.)
    .replace(/\son\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, "")
    // Strip javascript: URLs
    .replace(/href\s*=\s*['"]\s*javascript:[^'"]*['"]/gi, 'href="#"')
    .replace(/xlink:href\s*=\s*['"]\s*javascript:[^'"]*['"]/gi, 'xlink:href="#"')
    // Strip data: HTML/JS execution
    .replace(/href\s*=\s*['"]\s*data:text\/html[^'"]*['"]/gi, 'href="#"');

  return cleaned.trim();
}

/**
 * Validate asset file before upload/registration
 */
export function validateAssetUpload(file: {
  name: string;
  type: string;
  size: number;
}): { valid: boolean; error?: string } {
  const allowedMimeTypes = ["image/svg+xml", "image/png", "image/jpeg", "image/webp"];
  const maxSizeBytes = 2 * 1024 * 1024; // 2MB max

  if (!allowedMimeTypes.includes(file.type)) {
    return { valid: false, error: `Unsupported file type "${file.type}". Allowed types: PNG, JPEG, WebP, SVG.` };
  }

  if (file.size > maxSizeBytes) {
    return { valid: false, error: `File size exceeds 2MB limit (current: ${(file.size / 1024 / 1024).toFixed(2)}MB).` };
  }

  return { valid: true };
}
