import { z } from "zod";

export const SDUI_SCHEMA_VERSION = "1.0";
export const MAX_SECTIONS = 40;
export const MAX_WIDGETS_PER_SECTION = 60;
export const MAX_PAYLOAD_BYTES = 512 * 1024;
export const SUPPORTED_MOBILE_LOCALES = ["en-IN", "te-IN", "hi-IN"] as const;
export const SUPPORTED_LANGUAGE_MODES = ["english", "telugu_english", "hindi_english"] as const;
export const SUPPORTED_EXPERIENCE_MODULES = ["food", "quick_commerce", "grocery", "dineout", "scenes"] as const;
export const SUPPORTED_THEME_FAMILIES = ["food_dark", "quick_commerce_mint", "grocery_fresh"] as const;
export const SUPPORTED_EXPERIENCE_DESTINATIONS = [
  "home_food",
  "home_quick_commerce",
  "home_grocery",
  "category_directory",
  "category_listing",
  "reorder",
  "saved",
  "recently_viewed",
  "collection_listing",
  "cart",
] as const;
export const SUPPORTED_TEMPLATE_FAMILIES = [
  "food_home",
  "quick_commerce_home",
  "grocery_home",
  "category_directory",
  "category_listing",
  "reorder_listing",
  "saved_listing",
  "recently_viewed_listing",
  "collection_listing",
] as const;

export const supportedMobileLocaleSchema = z.enum(SUPPORTED_MOBILE_LOCALES);
export const languageModeSchema = z.enum(SUPPORTED_LANGUAGE_MODES);
export const experienceModuleSchema = z.enum(SUPPORTED_EXPERIENCE_MODULES);
export const themeFamilySchema = z.enum(SUPPORTED_THEME_FAMILIES);
export const experienceDestinationSchema = z.enum(SUPPORTED_EXPERIENCE_DESTINATIONS);
export const templateFamilySchema = z.enum(SUPPORTED_TEMPLATE_FAMILIES);

const LANGUAGE_MODE_BY_LOCALE: Record<(typeof SUPPORTED_MOBILE_LOCALES)[number], (typeof SUPPORTED_LANGUAGE_MODES)[number]> = {
  "en-IN": "english",
  "te-IN": "telugu_english",
  "hi-IN": "hindi_english",
};

export function languageModeMatchesLocale(locale: string, languageMode: string): boolean {
  return LANGUAGE_MODE_BY_LOCALE[locale as keyof typeof LANGUAGE_MODE_BY_LOCALE] === languageMode;
}

export function defaultLanguageModeForLocale(locale: string): string | undefined {
  return LANGUAGE_MODE_BY_LOCALE[locale as keyof typeof LANGUAGE_MODE_BY_LOCALE];
}

export function bilingualCopyFinding(locale: string, value: string): string | null {
  if (locale === "en-IN") return null;
  if (!/[A-Za-z]/.test(value)) return "Bilingual copy must retain a familiar English anchor";
  if (locale === "te-IN" && !/[\u0C00-\u0C7F]/.test(value)) return "Telugu + English copy must include Telugu script";
  if (locale === "hi-IN" && !/[\u0900-\u097F]/.test(value)) return "Hindi + English copy must include Devanagari script";
  return null;
}

export function localizationFieldFinding(entityType: string, fieldKey: string): string | null {
  if (entityType === "widget" && /^props\.[A-Za-z][A-Za-z0-9]*$/.test(fieldKey)) return null;
  if (entityType === "section" && fieldKey === "name") return null;
  if (entityType === "page" && fieldKey === "layoutName") return null;
  return "Unsupported localized field for this entity type";
}

export function releaseRequiresIndependentApproval(channelCode: string): boolean {
  return channelCode === "staging" || channelCode === "prod";
}

export function productionConfirmationValid(channelCode: string, confirmation: unknown): boolean {
  return channelCode !== "prod" || confirmation === "PUBLISH";
}

const identifier = z.string().min(1).max(100).regex(/^[a-z][a-z0-9_.-]*$/);
const jsonObject = z.record(z.string(), z.unknown());

export const experienceMenuItemSchema = z.object({
  id: identifier,
  labelKey: identifier,
  iconToken: identifier,
  destination: experienceDestinationSchema,
  params: jsonObject.optional(),
  requiresCapabilities: z.array(identifier).max(8).optional(),
  badgeSourceKey: identifier.optional(),
}).strict();

export const experienceAppearanceSchema = z.object({
  headerStyle: z.enum(["immersive", "compact", "clean"]),
  moduleTabStyle: z.enum(["arched_cards", "floating_cards", "segmented"]),
  searchStyle: z.enum(["floating", "outlined", "embedded"]),
  navigationStyle: z.enum(["edge_bar", "floating_dock", "minimal"]),
  contentDensity: z.enum(["comfortable", "compact"]),
  cardStyle: z.enum(["rounded", "squircle", "soft_square"]),
  campaignMotion: z.enum(["none", "subtle", "lively"]),
}).strict();

export const experienceShellSchema = z.object({
  module: experienceModuleSchema,
  themeFamily: themeFamilySchema,
  showDeliveryContext: z.boolean(),
  cartCompatibilityPolicy: z.enum(["confirm_switch", "module_scoped"]),
  nativeCartSurface: z.enum(["mini_cart", "menu_item", "both", "none"]),
  appearance: experienceAppearanceSchema.optional(),
  menu: z.array(experienceMenuItemSchema).min(2).max(6),
}).strict();

export const actionSchema = z.object({
  trigger: z.enum(["on_tap", "on_view", "on_submit", "on_change"]),
  type: z.enum([
    "navigate",
    "open_search",
    "select_module",
    "add_to_cart",
    "open_external_url",
    "track_event",
  ]),
  params: jsonObject.default({}),
});

export const telemetryEventSchema = z.object({
  widgetInstanceId: z.coerce.number().int().positive(),
  eventName: z.enum(["impression", "tap", "action_success", "action_rejected", "action_failure"]),
  metricKey: z.string().min(1).max(100).regex(/^[a-z][a-z0-9_.-]*$/).optional().nullable(),
}).strict();

export const dataSourceBindingSchema = z.object({
  key: identifier,
  params: jsonObject.default({}),
  emptyBehavior: z.enum(["hide_section", "show_empty", "show_fallback"]).default("hide_section"),
});

export const widgetInstanceContractSchema = z.object({
  id: identifier,
  type: identifier,
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  props: jsonObject.default({}),
  dataSource: dataSourceBindingSchema.optional(),
  actions: z.array(actionSchema).max(8).default([]),
  visibility: jsonObject.optional(),
});

export const sectionContractSchema = z.object({
  id: identifier,
  name: z.string().min(1).max(100),
  order: z.number().int().min(0),
  enabled: z.boolean().optional(),
  visible: z.boolean().optional(),
  constraints: jsonObject.default({}),
  visibility: jsonObject.optional(),
  widgets: z.array(widgetInstanceContractSchema).max(MAX_WIDGETS_PER_SECTION),
});

export const authoringDocumentSchema = z.object({
  schemaVersion: z.literal(SDUI_SCHEMA_VERSION),
  pageName: identifier,
  displayName: z.string().min(1).max(100),
  description: z.string().max(500).default(""),
  layoutName: z.string().min(1).max(100),
  themeId: z.number().int().positive().nullable().default(null),
  templateFamily: templateFamilySchema,
  experienceShell: experienceShellSchema.optional(),
  sections: z.array(sectionContractSchema).min(1).max(MAX_SECTIONS),
});

export const resolveRequestSchema = z.object({
  page: identifier.default("home"),
  channel: identifier.default("prod"),
  context: z.object({
    locale: supportedMobileLocaleSchema.default("en-IN"),
    languageMode: languageModeSchema.default("english"),
    market: z.string().min(2).max(20).default("IN"),
    city: z.string().max(100).default("Hyderabad"),
    zoneIds: z.array(z.number().int()).max(20).default([]),
    module: identifier.default("food"),
    platform: z.enum(["android", "ios", "web"]).default("android"),
    appVersion: z.string().regex(/^\d+\.\d+\.\d+$/).default("1.0.0"),
    signedIn: z.boolean().default(false),
    networkClass: z.enum(["offline", "slow", "cellular", "wifi"]).default("wifi"),
  }).default({ locale: "en-IN", languageMode: "english", market: "IN", city: "Hyderabad", zoneIds: [], module: "food", platform: "android", appVersion: "1.0.0", signedIn: false, networkClass: "wifi" }),
  capabilities: z.object({
    widgets: z.record(z.string(), z.string()).default({}),
    actions: z.array(z.string()).max(40).default([]),
    features: z.array(z.string()).max(40).default([]),
  }).default({ widgets: {}, actions: [], features: [] }),
  knownLayout: z.object({
    id: z.string().max(150),
    hash: z.string().max(100),
  }).optional(),
}).superRefine((input, context) => {
  if (!languageModeMatchesLocale(input.context.locale, input.context.languageMode)) {
    context.addIssue({ code: "custom", path: ["context", "languageMode"], message: "Language mode must match locale" });
  }
});

export type AuthoringDocument = z.infer<typeof authoringDocumentSchema>;
export type WidgetInstanceContract = z.infer<typeof widgetInstanceContractSchema>;
export type ExperienceShell = z.infer<typeof experienceShellSchema>;

export function assertPayloadBudget(value: unknown): void {
  const bytes = Buffer.byteLength(JSON.stringify(value), "utf8");
  if (bytes > MAX_PAYLOAD_BYTES) {
    throw new Error(`SDUI payload exceeds ${MAX_PAYLOAD_BYTES} byte limit`);
  }
}

export function formatValidationError(error: z.ZodError): Array<{ path: string; message: string }> {
  return error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message }));
}

// =========================================================================
// PHASE 6: FESTIVAL / CULTURAL OVERLAY & DECORATION SYSTEM CONTRACTS
// =========================================================================

export const DECORATION_TYPES = [
  "flag",
  "ribbon",
  "pattern",
  "illustration",
  "watermark",
  "badge",
  "corner_decoration",
  "border_decoration",
  "floating_element",
] as const;

export const DECORATION_PLACEMENTS = [
  "global_background",
  "header",
  "hero",
  "section",
  "card",
  "product_card",
  "category_card",
  "bottom_navigation",
  "floating",
] as const;

export const DECORATION_BLEND_MODES = [
  "normal",
  "subtle",
  "watermark",
  "soft_overlay",
  "soft-overlay",
  "tinted",
] as const;

export const DECORATION_ANIMATIONS = [
  "none",
  "fade",
  "float",
  "subtle_motion",
  "subtle-motion",
] as const;

export const DECORATION_SIZES = [
  "xs",
  "sm",
  "md",
  "lg",
  "xl",
  "full",
  "small",
  "medium",
  "large",
  "custom",
] as const;

export const decorationTypeSchema = z.enum(DECORATION_TYPES);
export const decorationPlacementSchema = z.enum(DECORATION_PLACEMENTS);
export const decorationBlendModeSchema = z.enum(DECORATION_BLEND_MODES);
export const decorationAnimationSchema = z.enum(DECORATION_ANIMATIONS);
export const decorationSizeSchema = z.enum(DECORATION_SIZES);

export const visualDecorationSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().min(1).max(100),
  type: decorationTypeSchema.default("illustration"),
  placement: decorationPlacementSchema.default("hero"),
  assetUrl: z.string().min(1),
  altText: z.string().max(255).optional(),
  isDecorative: z.boolean().default(true).optional(),
  decorative: z.boolean().default(true).optional(),
  opacity: z.number().min(0).max(1).default(1.0).optional(),
  size: decorationSizeSchema.default("medium").optional(),
  customWidth: z.number().positive().optional(),
  customHeight: z.number().positive().optional(),
  rotation: z.number().min(-360).max(360).default(0).optional(),
  positionX: z.string().default("center").optional(),
  positionY: z.string().default("center").optional(),
  scale: z.number().min(0.1).max(5.0).default(1.0).optional(),
  blendMode: decorationBlendModeSchema.default("normal").optional(),
  animation: decorationAnimationSchema.default("none").optional(),
  mobile: z.boolean().default(true).optional(),
  mobileEnabled: z.boolean().default(true).optional(),
  desktop: z.boolean().default(true).optional(),
  desktopEnabled: z.boolean().default(true).optional(),
  targetSectionId: z.string().max(100).optional(),
});

export const overlayScheduleSchema = z.object({
  status: z.enum(["draft", "scheduled", "active", "expired", "archived"]).default("draft"),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format: YYYY-MM-DD"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Format: HH:mm").default("00:00"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format: YYYY-MM-DD"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Format: HH:mm").default("23:59"),
  timezone: z.string().default("Asia/Kolkata"),
  priority: z.number().int().min(1).max(100).default(1).optional(),
});

export const festivalOverlaySchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().min(1).max(100),
  displayName: z.string().min(1).max(100),
  description: z.string().max(500).default(""),
  enabled: z.boolean().default(true),
  opacity: z.number().min(0).max(1).default(1.0).optional(),
  baseThemeId: z.number().int().positive().nullable().optional(),
  decorations: z.array(visualDecorationSchema).default([]),
  schedule: overlayScheduleSchema,
  accentColors: z.object({
    primary: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    secondary: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    tertiary: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    additional: z.array(z.string().regex(/^#[0-9a-fA-F]{6}$/)).optional(),
  }).optional(),
  targeting: z.object({
    mobile: z.boolean().default(true),
    desktop: z.boolean().default(true),
  }).default({ mobile: true, desktop: true }).optional(),
});

export type VisualDecoration = z.infer<typeof visualDecorationSchema>;
export type OverlaySchedule = z.infer<typeof overlayScheduleSchema>;
export type FestivalOverlay = z.infer<typeof festivalOverlaySchema>;

/**
 * Helper to parse a date and time string in Asia/Kolkata (IST = UTC+05:30) deterministically.
 */
function parseKolkataDateTime(dateStr: string, timeStr: string): number {
  if (!dateStr) return NaN;
  const time = timeStr ? (timeStr.length === 5 ? `${timeStr}:00` : timeStr) : "00:00:00";
  const isoWithOffset = `${dateStr}T${time}+05:30`;
  const ts = new Date(isoWithOffset).getTime();
  return isNaN(ts) ? NaN : ts;
}

/**
 * Helper to parse targetTime into epoch ms.
 * If given as an unadorned local datetime string (e.g. "2027-08-15T12:00"), evaluates as Asia/Kolkata (+05:30).
 */
function parseTargetTime(targetTime?: Date | string | number): number {
  if (!targetTime) return Date.now();
  if (typeof targetTime === "number") return targetTime;
  if (targetTime instanceof Date) return targetTime.getTime();
  if (typeof targetTime === "string") {
    if (/Z|[+-]\d{2}(?::?\d{2})?$/.test(targetTime)) {
      return new Date(targetTime).getTime();
    }
    const parts = targetTime.split("T");
    const datePart = parts[0];
    const timePart = parts[1] || "00:00:00";
    return parseKolkataDateTime(datePart, timePart);
  }
  return NaN;
}

/**
 * Evaluates whether an overlay schedule is active at a given target time.
 * Automatically and deterministically supports Indian Standard Time (Asia/Kolkata = UTC+05:30).
 */
export function evaluateOverlaySchedule(
  schedule: OverlaySchedule,
  targetTime?: Date | string | number
): { active: boolean; status: "draft" | "scheduled" | "active" | "expired" | "archived" } {
  if (!schedule || schedule.status === "draft" || schedule.status === "archived") {
    return { active: false, status: schedule?.status || "draft" };
  }

  const startTs = parseKolkataDateTime(schedule.startDate, schedule.startTime || "00:00:00");
  const endTs = parseKolkataDateTime(schedule.endDate, schedule.endTime || "23:59:59");
  const nowTs = parseTargetTime(targetTime);

  if (isNaN(startTs) || isNaN(endTs) || isNaN(nowTs)) {
    return { active: false, status: schedule.status || "draft" };
  }

  if (nowTs < startTs) {
    return { active: false, status: "scheduled" };
  }
  if (nowTs > endTs) {
    return { active: false, status: "expired" };
  }
  return { active: true, status: "active" };
}
