import type { FestivalOverlay } from "@/lib/qcos/contracts";

export interface ThemeToken {
  token_key: string;
  token_value: string;
  category?: string;
}

export interface ParsedThemeTokens {
  // Colors
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  surfaceElevated: string;
  surfaceMuted: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  gradientFrom: string;
  gradientTo: string;
  isDark: boolean;

  // Shapes & Radii
  radiusXs: number;
  radiusSm: number;
  radiusMd: number;
  radiusLg: number;
  cardRadius: number;
  buttonRadius: number;
  chipRadius: number;
  inputRadius: number;

  // Spacing & Layout
  screenPadding: number;
  sectionGap: number;
  cardGap: number;
  gridGap: number;
  cardPadding: number;
  buttonPadding: number;
  spacingXs: number;
  spacingSm: number;
  spacingMd: number;
  spacingLg: number;
  spacing: number;

  // Typography Scale & Motion
  fontScale: number;
  motionStyle: "instant" | "fast" | "standard" | "emphasized" | "spring" | "energetic" | "calm" | "none" | string;
  motionDuration: string;
  motionEasing: string;

  // Atmosphere & Overlay
  heroImage: string;
  sparkle: boolean;
  overlay?: FestivalOverlay | null;
}

export function parseTokensToTheme(tokensInput?: Record<string, string> | ThemeToken[] | null): ParsedThemeTokens {
  const map: Record<string, string> = {};
  if (Array.isArray(tokensInput)) {
    tokensInput.forEach((t) => {
      if (t && t.token_key) map[t.token_key] = t.token_value;
    });
  } else if (tokensInput && typeof tokensInput === "object") {
    Object.assign(map, tokensInput);
  }

  const normalizeHex = (val: string | undefined, fallback: string) => {
    if (!val) return fallback;
    return /^#[0-9a-f]{6}$/i.test(val) ? val : fallback;
  };

  const parsePx = (val: string | undefined, fallback: number) => {
    if (!val) return fallback;
    const num = parseFloat(val.replace("px", "").replace("rem", "").trim());
    return isNaN(num) ? fallback : num;
  };

  const isDark = map["sys.color.scheme"] === "dark";

  // Colors
  const primary = normalizeHex(map["sys.color.primary"], "#039d55");
  const secondary = normalizeHex(map["sys.color.secondary"], "#ff9900");
  const accent = normalizeHex(map["sys.color.accent"], "#ffd700");
  const background = normalizeHex(map["sys.color.background"], isDark ? "#09090b" : "#f7fbfa");
  const surface = normalizeHex(map["sys.color.surface"], isDark ? "#18181b" : "#ffffff");
  const surfaceElevated = normalizeHex(map["sys.color.surface_elevated"], isDark ? "#27272a" : "#f8fafc");
  const surfaceMuted = normalizeHex(map["sys.color.surface_muted"], isDark ? "#27272a" : "#f1f5f9");
  const textPrimary = normalizeHex(map["sys.color.text_primary"], isDark ? "#fafafa" : "#1e293b");
  const textSecondary = normalizeHex(map["sys.color.text_secondary"], isDark ? "#d4d4d8" : "#475569");
  const textMuted = normalizeHex(map["sys.color.text_muted"], isDark ? "#a1a1aa" : "#94a3b8");
  const success = normalizeHex(map["sys.color.success"], "#16834a");
  const warning = normalizeHex(map["sys.color.warning"], "#f59e0b");
  const error = normalizeHex(map["sys.color.error"], "#e11d48");
  const info = normalizeHex(map["sys.color.info"], "#0284c7");
  const gradientFrom = normalizeHex(map["sys.color.gradient_from"] || primary, primary);
  const gradientTo = normalizeHex(map["sys.color.gradient_to"] || (isDark ? "#18181b" : "#004d2e"), isDark ? "#18181b" : "#004d2e");

  // Shapes
  const radiusXs = parsePx(map["sys.shape.radius_xs"], 4);
  const radiusSm = parsePx(map["sys.shape.radius_sm"], 8);
  const radiusMd = parsePx(map["sys.shape.radius_md"], 14);
  const radiusLg = parsePx(map["sys.shape.radius_lg"], 20);
  const cardRadius = parsePx(map["sys.shape.card_radius"], radiusLg);
  const buttonRadius = parsePx(map["sys.shape.button_radius"], radiusMd);
  const chipRadius = parsePx(map["sys.shape.chip_radius"], Math.max(6, radiusSm));
  const inputRadius = parsePx(map["sys.shape.input_radius"], radiusMd);

  // Spacing
  const spacingXs = parsePx(map["sys.spacing.xs"], 4);
  const spacingSm = parsePx(map["sys.spacing.sm"], 8);
  const spacingMd = parsePx(map["sys.spacing.md"], 16);
  const spacingLg = parsePx(map["sys.spacing.lg"], 24);
  const spacing = parsePx(map["sys.spacing.md"], 16);
  const screenPadding = spacing;
  const sectionGap = parsePx(map["sys.spacing.section_gap"] || map["sys.spacing.lg"], 20);
  const cardGap = parsePx(map["sys.spacing.card_gap"], 8);
  const gridGap = parsePx(map["sys.spacing.grid_gap"], 8);
  const cardPadding = parsePx(map["sys.spacing.card_padding"], 12);
  const buttonPadding = parsePx(map["sys.spacing.button_padding"], 8);

  // Typography & Motion
  const fontScale = parseFloat(map["sys.scale.font"] || map["sys.typography.scale"] || "1") || 1;
  const motionStyle = map["sys.motion.style"] || "spring";
  const motionDuration = map["sys.motion.duration"] || (
    motionStyle === "none" || motionStyle === "instant"
      ? "0ms"
      : motionStyle === "energetic" || motionStyle === "emphasized"
      ? "380ms"
      : motionStyle === "fast"
      ? "180ms"
      : "260ms"
  );
  const motionEasing = map["sys.motion.easing"] || (
    motionStyle === "spring"
      ? "cubic-bezier(0.2, 0.9, 0.2, 1.2)"
      : motionStyle === "energetic"
      ? "cubic-bezier(0.2, 0.8, 0.2, 1)"
      : "cubic-bezier(0.4, 0, 0.2, 1)"
  );

  const heroImage = map["sys.asset.hero_image"] || "";
  const sparkle = map["sys.decoration.sparkle"] === "true";

  let overlay: FestivalOverlay | null = null;
  const rawOverlay = map["sys.overlay.data"] || map["sys.overlay.config"];
  if (rawOverlay) {
    try {
      const parsed = typeof rawOverlay === "string" ? JSON.parse(rawOverlay) : rawOverlay;
      if (parsed && typeof parsed === "object") {
        overlay = parsed as FestivalOverlay;
      }
    } catch {
      overlay = null;
    }
  }

  return {
    primary,
    secondary,
    accent,
    background,
    surface,
    surfaceElevated,
    surfaceMuted,
    textPrimary,
    textSecondary,
    textMuted,
    success,
    warning,
    error,
    info,
    gradientFrom,
    gradientTo,
    isDark,
    radiusXs,
    radiusSm,
    radiusMd,
    radiusLg,
    cardRadius,
    buttonRadius,
    chipRadius,
    inputRadius,
    screenPadding,
    sectionGap,
    cardGap,
    gridGap,
    cardPadding,
    buttonPadding,
    spacingXs,
    spacingSm,
    spacingMd,
    spacingLg,
    spacing,
    fontScale,
    motionStyle,
    motionDuration,
    motionEasing,
    heroImage,
    sparkle,
    overlay,
  };
}

// =========================================================================
// COMPONENT RECIPES ENGINE
// =========================================================================

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

/**
 * 1. recipeTypography: Deterministically scales font sizes using theme.fontScale
 */
export function recipeTypography(theme: ParsedThemeTokens, role: TypographyRole): React.CSSProperties {
  const scale = theme.fontScale || 1;
  const roundPx = (base: number) => `${Math.max(6, Math.round(base * scale * 10) / 10)}px`;

  switch (role) {
    case "display":
      return { fontSize: roundPx(24), lineHeight: "1.2", fontWeight: 900, color: theme.textPrimary, letterSpacing: "-0.02em" };
    case "h1":
      return { fontSize: roundPx(20), lineHeight: "1.25", fontWeight: 800, color: theme.textPrimary, letterSpacing: "-0.015em" };
    case "h2":
      return { fontSize: roundPx(16), lineHeight: "1.3", fontWeight: 800, color: theme.textPrimary, letterSpacing: "-0.01em" };
    case "h3":
      return { fontSize: roundPx(14), lineHeight: "1.35", fontWeight: 700, color: theme.textPrimary };
    case "sectionTitle":
      return { fontSize: roundPx(15), lineHeight: "1.2", fontWeight: 900, color: theme.textPrimary, letterSpacing: "-0.01em" };
    case "bodyLarge":
      return { fontSize: roundPx(14), lineHeight: "1.4", fontWeight: 500, color: theme.textPrimary };
    case "body":
      return { fontSize: roundPx(12), lineHeight: "1.4", fontWeight: 400, color: theme.textSecondary };
    case "bodySmall":
      return { fontSize: roundPx(10.5), lineHeight: "1.35", fontWeight: 500, color: theme.textSecondary };
    case "caption":
      return { fontSize: roundPx(9), lineHeight: "1.3", fontWeight: 500, color: theme.textMuted };
    case "price":
      return { fontSize: roundPx(11), lineHeight: "1.1", fontWeight: 900, color: theme.textPrimary };
    case "discount":
      return { fontSize: roundPx(8.5), lineHeight: "1.1", fontWeight: 800, color: theme.success };
    case "button":
      return { fontSize: roundPx(10.5), lineHeight: "1", fontWeight: 800, letterSpacing: "0.02em" };
    case "navigation":
      return { fontSize: roundPx(8.5), lineHeight: "1.1", fontWeight: 700 };
    default:
      return { fontSize: roundPx(12), lineHeight: "1.4", color: theme.textPrimary };
  }
}

export type ElevationLevel = "none" | "subtle" | "card" | "raised" | "floating" | "modal";

/**
 * 2. recipeElevation: Reusable box-shadows responding to dark / light modes
 */
export function recipeElevation(theme: ParsedThemeTokens, level: ElevationLevel = "card"): string {
  if (theme.isDark) {
    switch (level) {
      case "none": return "none";
      case "subtle": return "0 1px 2px rgba(0, 0, 0, 0.4)";
      case "card": return "0 2px 8px rgba(0, 0, 0, 0.35)";
      case "raised": return "0 4px 14px rgba(0, 0, 0, 0.5)";
      case "floating": return "0 8px 24px rgba(0, 0, 0, 0.65)";
      case "modal": return "0 16px 40px rgba(0, 0, 0, 0.85)";
    }
  }

  switch (level) {
    case "none": return "none";
    case "subtle": return "0 1px 2px rgba(0, 0, 0, 0.03)";
    case "card": return "0 2px 6px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)";
    case "raised": return "0 4px 12px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.03)";
    case "floating": return "0 8px 20px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04)";
    case "modal": return "0 16px 36px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.06)";
  }
}

/**
 * 3. recipeProductCard: Styles for product cards in grids and rails
 */
export function recipeProductCard(theme: ParsedThemeTokens, opts?: { elevated?: boolean; tight?: boolean }): {
  card: React.CSSProperties;
  imageWell: React.CSSProperties;
  title: React.CSSProperties;
  unit: React.CSSProperties;
  price: React.CSSProperties;
  mrp: React.CSSProperties;
  discount: React.CSSProperties;
} {
  return {
    card: {
      backgroundColor: opts?.elevated ? theme.surfaceElevated : theme.surface,
      borderColor: theme.isDark ? "#3f3f46" : (opts?.elevated ? "#f1f5f9" : "#e2e8f0"),
      borderRadius: `${theme.cardRadius}px`,
      boxShadow: recipeElevation(theme, "card"),
      transition: `all ${theme.motionDuration} ${theme.motionEasing}`,
    },
    imageWell: {
      backgroundColor: theme.isDark ? theme.surfaceElevated : "#f8fafc",
      borderRadius: `${Math.max(4, theme.cardRadius - 4)}px`,
    },
    title: {
      ...recipeTypography(theme, "bodySmall"),
      fontWeight: 700,
      color: theme.textPrimary,
    },
    unit: {
      ...recipeTypography(theme, "caption"),
      color: theme.textMuted,
    },
    price: {
      ...recipeTypography(theme, "price"),
      color: theme.textPrimary,
    },
    mrp: {
      ...recipeTypography(theme, "caption"),
      color: theme.textMuted,
      textDecoration: "line-through",
    },
    discount: {
      ...recipeTypography(theme, "discount"),
      color: theme.success,
    },
  };
}

/**
 * 4. recipeCategoryCard: Styles for circular, squircle or pill category items
 */
export function recipeCategoryCard(theme: ParsedThemeTokens, opts?: { customBg?: string; pill?: boolean }): {
  container: React.CSSProperties;
  iconWell: React.CSSProperties;
  label: React.CSSProperties;
} {
  return {
    container: {
      transition: `all ${theme.motionDuration} ${theme.motionEasing}`,
    },
    iconWell: {
      backgroundColor: opts?.customBg || (theme.isDark ? theme.surfaceElevated : "#f8fafc"),
      borderColor: theme.isDark ? "#3f3f46" : "#f1f5f9",
      borderRadius: opts?.pill ? `${theme.buttonRadius}px` : `${Math.max(8, theme.cardRadius - 2)}px`,
      boxShadow: recipeElevation(theme, "subtle"),
      transition: `all ${theme.motionDuration} ${theme.motionEasing}`,
    },
    label: {
      ...recipeTypography(theme, "caption"),
      fontWeight: 700,
      color: theme.textPrimary,
    },
  };
}

/**
 * 5. recipeStoreCard: Styles for store explorer cards
 */
export function recipeStoreCard(theme: ParsedThemeTokens): {
  card: React.CSSProperties;
  title: React.CSSProperties;
  tagline: React.CSSProperties;
  ratingBadge: React.CSSProperties;
  etaPill: React.CSSProperties;
} {
  return {
    card: {
      backgroundColor: theme.surface,
      borderColor: theme.isDark ? "#3f3f46" : "#e2e8f0",
      borderRadius: `${theme.cardRadius}px`,
      boxShadow: recipeElevation(theme, "card"),
      transition: `all ${theme.motionDuration} ${theme.motionEasing}`,
    },
    title: {
      ...recipeTypography(theme, "h3"),
      color: theme.textPrimary,
    },
    tagline: {
      ...recipeTypography(theme, "bodySmall"),
      color: theme.textSecondary,
    },
    ratingBadge: {
      backgroundColor: `${theme.accent}20`,
      color: theme.isDark ? theme.accent : "#b45309",
      borderColor: `${theme.accent}40`,
      borderRadius: `${theme.radiusSm}px`,
    },
    etaPill: {
      backgroundColor: theme.isDark ? theme.surfaceElevated : "#f1f5f9",
      color: theme.textSecondary,
      borderRadius: `${theme.buttonRadius}px`,
    },
  };
}

/**
 * 6. recipeDealCard: Styles for flash deals and steal deal shelf containers
 */
export function recipeDealCard(theme: ParsedThemeTokens, variant: "flash" | "steal" | "featured" = "flash"): {
  container: React.CSSProperties;
  badge: React.CSSProperties;
  title: React.CSSProperties;
} {
  const accentColor = variant === "flash" ? theme.warning : variant === "steal" ? theme.secondary : theme.primary;
  return {
    container: {
      backgroundColor: theme.surface,
      borderColor: theme.isDark ? "#3f3f46" : "#e2e8f0",
      borderRadius: `${theme.cardRadius}px`,
      boxShadow: recipeElevation(theme, "card"),
      transition: `all ${theme.motionDuration} ${theme.motionEasing}`,
    },
    badge: {
      backgroundColor: `${accentColor}18`,
      borderColor: `${accentColor}40`,
      color: accentColor,
      borderRadius: `${theme.buttonRadius}px`,
      ...recipeTypography(theme, "caption"),
      fontWeight: 800,
    },
    title: {
      ...recipeTypography(theme, "h2"),
      color: theme.textPrimary,
    },
  };
}

/**
 * 7. recipeButton: Reusable button styles
 */
export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "mini_add" | "action";

export function recipeButton(theme: ParsedThemeTokens, variant: ButtonVariant = "primary"): React.CSSProperties {
  const base: React.CSSProperties = {
    borderRadius: `${theme.buttonRadius}px`,
    transition: `all ${theme.motionDuration} ${theme.motionEasing}`,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  };

  switch (variant) {
    case "primary":
      return {
        ...base,
        backgroundColor: theme.primary,
        color: "#ffffff",
        border: "none",
        boxShadow: recipeElevation(theme, "subtle"),
        ...recipeTypography(theme, "button"),
      };
    case "secondary":
      return {
        ...base,
        backgroundColor: theme.secondary,
        color: "#ffffff",
        border: "none",
        ...recipeTypography(theme, "button"),
      };
    case "outline":
      return {
        ...base,
        backgroundColor: "transparent",
        color: theme.primary,
        border: `1.5px solid ${theme.primary}`,
        ...recipeTypography(theme, "button"),
      };
    case "ghost":
      return {
        ...base,
        backgroundColor: theme.isDark ? theme.surfaceElevated : "#f8fafc",
        color: theme.textPrimary,
        border: `1px solid ${theme.isDark ? "#3f3f46" : "#e2e8f0"}`,
        ...recipeTypography(theme, "button"),
      };
    case "mini_add":
      return {
        ...base,
        backgroundColor: `${theme.primary}12`,
        color: theme.primary,
        border: `1.2px solid ${theme.primary}`,
        ...recipeTypography(theme, "button"),
        fontSize: `${Math.max(7.5, Math.round(9 * theme.fontScale * 10) / 10)}px`,
        fontWeight: 900,
        padding: "2px 8px",
      };
    case "action":
      return {
        ...base,
        backgroundColor: theme.surface,
        color: theme.primary,
        border: `1px solid ${theme.isDark ? "#3f3f46" : "#e2e8f0"}`,
        boxShadow: recipeElevation(theme, "subtle"),
        ...recipeTypography(theme, "button"),
      };
  }
}

/**
 * 8. recipeBadge: Reusable badge styling
 */
export type BadgeVariant = "discount" | "deal" | "status" | "delivery" | "rating" | "select" | "custom";

export function recipeBadge(
  theme: ParsedThemeTokens,
  variant: BadgeVariant = "discount",
  customColor?: string
): React.CSSProperties {
  const base: React.CSSProperties = {
    borderRadius: `${theme.radiusSm}px`,
    ...recipeTypography(theme, "caption"),
    fontWeight: 800,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  };

  switch (variant) {
    case "discount":
      return {
        ...base,
        backgroundColor: theme.success,
        color: "#ffffff",
      };
    case "deal":
      return {
        ...base,
        backgroundColor: theme.secondary,
        color: "#ffffff",
      };
    case "status":
      return {
        ...base,
        backgroundColor: `${theme.warning}20`,
        borderColor: `${theme.warning}40`,
        color: theme.warning,
      };
    case "delivery":
      return {
        ...base,
        backgroundColor: `${theme.primary}16`,
        borderColor: `${theme.primary}35`,
        color: theme.primary,
      };
    case "rating":
      return {
        ...base,
        backgroundColor: `${theme.accent}25`,
        borderColor: `${theme.accent}50`,
        color: theme.isDark ? theme.accent : "#b45309",
      };
    case "select":
      return {
        ...base,
        backgroundColor: theme.primary,
        color: "#ffffff",
      };
    case "custom":
      return {
        ...base,
        backgroundColor: customColor || theme.primary,
        color: "#ffffff",
      };
  }
}

/**
 * 9. recipeChip: Reusable filter and navigation chips
 */
export function recipeChip(theme: ParsedThemeTokens, isSelected: boolean): React.CSSProperties {
  return {
    borderRadius: `${theme.chipRadius}px`,
    backgroundColor: isSelected ? theme.primary : theme.surface,
    borderColor: isSelected ? theme.primary : (theme.isDark ? "#3f3f46" : "#e2e8f0"),
    color: isSelected ? "#ffffff" : theme.textSecondary,
    boxShadow: isSelected ? recipeElevation(theme, "subtle") : "none",
    transition: `all ${theme.motionDuration} ${theme.motionEasing}`,
    ...recipeTypography(theme, "bodySmall"),
    fontWeight: isSelected ? 800 : 600,
  };
}

/**
 * 10. recipeSectionHeader: Section headers with titles and view all links
 */
export function recipeSectionHeader(theme: ParsedThemeTokens): {
  container: React.CSSProperties;
  title: React.CSSProperties;
  subtitle: React.CSSProperties;
  actionLink: React.CSSProperties;
  iconContainer: React.CSSProperties;
} {
  return {
    container: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    },
    title: {
      ...recipeTypography(theme, "sectionTitle"),
      color: theme.textPrimary,
    },
    subtitle: {
      ...recipeTypography(theme, "caption"),
      color: theme.textSecondary,
    },
    actionLink: {
      ...recipeTypography(theme, "bodySmall"),
      fontWeight: 700,
      color: theme.primary,
      cursor: "pointer",
    },
    iconContainer: {
      borderRadius: `${theme.radiusSm}px`,
      backgroundColor: `${theme.primary}18`,
      color: theme.primary,
    },
  };
}
