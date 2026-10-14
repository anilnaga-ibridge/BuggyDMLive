import type { ParsedThemeTokens } from "@/components/qcos/experience-preview/preview-theme";
import type {
  FestivalTheme,
  FestivalBackgroundOverride,
  FestivalWatermarkOverride,
  FestivalDecorationOverride,
  FestivalIconOverride,
  FestivalOverrideScope,
  TypographyRole,
  ProductCardComponentOverride,
  CategoryCardComponentOverride,
  StoreCardComponentOverride,
  ButtonComponentOverride,
  BadgeComponentOverride,
} from "./types";

export interface ResolvedFestivalExperience {
  isActive: boolean;
  festivalId?: string;
  festivalName?: string;
  campaignName?: string;
  
  // Resolved Theme Tokens (Permission-Gated)
  resolvedTokens: ParsedThemeTokens;
  
  // Scoped Overrides
  backgrounds: Record<FestivalOverrideScope, FestivalBackgroundOverride | undefined>;
  watermarks: FestivalWatermarkOverride[];
  decorations: FestivalDecorationOverride[];
  icons: Record<string, FestivalIconOverride>;
  
  // Component Overrides
  productCardOverride?: ProductCardComponentOverride;
  categoryCardOverride?: CategoryCardComponentOverride;
  storeCardOverride?: StoreCardComponentOverride;
  buttonOverride?: ButtonComponentOverride;
  badgeOverride?: BadgeComponentOverride;

  // Custom Typography & Font Family
  customFontFamily?: string;
  fontScale: number;
}

/**
 * Check if the festival schedule is active for a given timestamp
 */
export function isFestivalScheduleActive(
  schedule: FestivalTheme["schedule"],
  status: FestivalTheme["status"],
  evaluationTime?: string | Date
): boolean {
  if (status === "archived") return false;

  const now = evaluationTime ? new Date(evaluationTime) : new Date();
  if (isNaN(now.getTime())) return false;

  const start = new Date(`${schedule.startDate}T${schedule.startTime}:00`);
  const end = new Date(`${schedule.endDate}T${schedule.endTime}:00`);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) return false;

  return now >= start && now <= end;
}

/**
 * Deterministic Permission & Scope Resolver
 * 
 * RESOLUTION ORDER:
 * 1. Base CXP Theme (Default fallback)
 * 2. If Festival Schedule Active AND Permission Enabled -> apply override
 * 3. If Permission Disabled -> retain Base CXP Theme
 * 4. Stored Base CXP Theme is NEVER mutated.
 */
export function resolveFestivalTheme(
  baseTokens: ParsedThemeTokens,
  festival: FestivalTheme | null,
  options?: {
    evaluationDate?: string | Date;
    forcePreviewActive?: boolean;
  }
): ResolvedFestivalExperience {
  // 1. Default base experience
  const fallbackExperience: ResolvedFestivalExperience = {
    isActive: false,
    resolvedTokens: { ...baseTokens },
    backgrounds: {} as any,
    watermarks: [],
    decorations: [],
    icons: {},
    fontScale: baseTokens.fontScale || 1,
  };

  if (!festival) {
    return fallbackExperience;
  }

  // 2. Evaluate schedule unless forcePreviewActive is requested in Studio
  const isTimeActive = isFestivalScheduleActive(
    festival.schedule,
    festival.status,
    options?.evaluationDate
  );

  const isActive = options?.forcePreviewActive ?? (festival.status === "published" && isTimeActive);

  if (!isActive) {
    return fallbackExperience;
  }

  const permissions = festival.permissions;
  const resolved: ParsedThemeTokens = { ...baseTokens };

  // 3. COLOR & BACKGROUND & GRADIENT OVERRIDES (Permission Gated)
  const colorsPermitted = Boolean(permissions.design.colors);
  const backgroundsPermitted = Boolean(permissions.design.backgrounds || permissions.design.colors);
  const gradientsPermitted = Boolean(permissions.design.gradients || permissions.design.colors || permissions.design.backgrounds);

  if (festival.colors) {
    const c = festival.colors;
    if (backgroundsPermitted && c.appBackground?.enabled) resolved.background = c.appBackground.color;
    if (backgroundsPermitted && c.surfaceElevated?.enabled) resolved.surfaceElevated = c.surfaceElevated.color;
    if (colorsPermitted && c.surface?.enabled) resolved.surface = c.surface.color;
    if (colorsPermitted && c.primaryAction?.enabled) resolved.primary = c.primaryAction.color;
    if (colorsPermitted && c.secondaryAccent?.enabled) resolved.secondary = c.secondaryAccent.color;
    if (colorsPermitted && c.accentHighlight?.enabled) resolved.accent = c.accentHighlight.color;
    if (colorsPermitted && c.mainText?.enabled) resolved.textPrimary = c.mainText.color;
    if (colorsPermitted && c.secondaryText?.enabled) resolved.textSecondary = c.secondaryText.color;
    if (colorsPermitted && c.mutedText?.enabled) resolved.textMuted = c.mutedText.color;
    if (colorsPermitted && c.success?.enabled) resolved.success = c.success.color;
    if (colorsPermitted && c.warning?.enabled) resolved.warning = c.warning.color;
    if (colorsPermitted && c.error?.enabled) resolved.error = c.error.color;
    if (colorsPermitted && c.info?.enabled) resolved.info = c.info.color;
    if (gradientsPermitted && c.heroGradientStart?.enabled) resolved.gradientFrom = c.heroGradientStart.color;
    if (gradientsPermitted && c.heroGradientEnd?.enabled) resolved.gradientTo = c.heroGradientEnd.color;
  }

  // 4. SPACING OVERRIDES (Permission Gated)
  if (permissions.design.spacing && festival.spacing) {
    if (festival.spacing.sectionGap !== undefined) resolved.sectionGap = festival.spacing.sectionGap;
    if (festival.spacing.cardGap !== undefined) resolved.cardGap = festival.spacing.cardGap;
    if (festival.spacing.gridGap !== undefined) resolved.gridGap = festival.spacing.gridGap;
    if (festival.spacing.cardPadding !== undefined) resolved.cardPadding = festival.spacing.cardPadding;
    if (festival.spacing.buttonPadding !== undefined) resolved.buttonPadding = festival.spacing.buttonPadding;
  }

  // 5. MOTION OVERRIDES (Permission Gated)
  if (permissions.design.motion && festival.motion) {
    if (festival.motion.style) resolved.motionStyle = festival.motion.style;
    if (festival.motion.duration) resolved.motionDuration = festival.motion.duration;
    if (festival.motion.easing) resolved.motionEasing = festival.motion.easing;
  }

  // 6. TYPOGRAPHY & FONT FAMILY (Permission Gated)
  let customFontFamily: string | undefined = undefined;
  let resolvedFontScale = baseTokens.fontScale || 1;

  if ((permissions.design.fontFamily || permissions.design.typography) && festival.typography.fontFamily) {
    customFontFamily = festival.typography.fontFamily;
  }
  if ((permissions.design.fontScale || permissions.design.typography) && festival.typography.fontScale) {
    resolvedFontScale = festival.typography.fontScale;
    resolved.fontScale = resolvedFontScale;
  }

  // 7. BACKGROUND SCOPES (Permission Gated)
  const scopedBackgrounds: Record<FestivalOverrideScope, FestivalBackgroundOverride | undefined> = {} as any;
  if (permissions.design.backgrounds && festival.backgrounds) {
    for (const bg of festival.backgrounds) {
      if (bg.enabled) {
        scopedBackgrounds[bg.scope] = bg;
        if (bg.scope === "GLOBAL" && bg.color) {
          resolved.background = bg.color;
        }
        if (bg.scope === "HERO" && bg.gradientFrom && bg.gradientTo) {
          resolved.gradientFrom = bg.gradientFrom;
          resolved.gradientTo = bg.gradientTo;
        }
      }
    }
  }

  // 8. WATERMARKS (Permission Gated)
  const permittedWatermarks: FestivalWatermarkOverride[] = [];
  if (permissions.visuals.watermarks && festival.watermarks) {
    for (const wm of festival.watermarks) {
      if (wm.enabled) {
        permittedWatermarks.push(wm);
      }
    }
  }

  // 9. DECORATIONS (Permission Gated)
  const permittedDecorations: FestivalDecorationOverride[] = [];
  if (permissions.visuals.decorativeArtwork && festival.decorations) {
    for (const dec of festival.decorations) {
      if (dec.enabled) {
        permittedDecorations.push(dec);
      }
    }
  }

  // 10. ICONS (Permission Gated)
  const iconMap: Record<string, FestivalIconOverride> = {};
  if (permissions.visuals.icons && festival.icons) {
    for (const ic of festival.icons) {
      if (ic.enabled) {
        iconMap[ic.iconKey] = ic;
      }
    }
  }

  // 11. COMPONENTS (Permission Gated)
  let productCardOverride: ProductCardComponentOverride | undefined = undefined;
  let categoryCardOverride: CategoryCardComponentOverride | undefined = undefined;
  let storeCardOverride: StoreCardComponentOverride | undefined = undefined;
  let buttonOverride: ButtonComponentOverride | undefined = undefined;
  let badgeOverride: BadgeComponentOverride | undefined = undefined;

  if (permissions.components.productCards && festival.components.productCard?.enabled) {
    productCardOverride = festival.components.productCard;
  }
  if (permissions.components.categoryCards && festival.components.categoryCard?.enabled) {
    categoryCardOverride = festival.components.categoryCard;
  }
  if (permissions.components.storeCards && festival.components.storeCard?.enabled) {
    storeCardOverride = festival.components.storeCard;
  }
  if (permissions.components.buttons && festival.components.button?.enabled) {
    buttonOverride = festival.components.button;
  }
  if (permissions.components.badges && festival.components.badge?.enabled) {
    badgeOverride = festival.components.badge;
  }

  return {
    isActive: true,
    festivalId: festival.id,
    festivalName: festival.name,
    campaignName: festival.campaignName,
    resolvedTokens: resolved,
    backgrounds: scopedBackgrounds,
    watermarks: permittedWatermarks,
    decorations: permittedDecorations,
    icons: iconMap,
    productCardOverride,
    categoryCardOverride,
    storeCardOverride,
    buttonOverride,
    badgeOverride,
    customFontFamily,
    fontScale: resolvedFontScale,
  };
}
