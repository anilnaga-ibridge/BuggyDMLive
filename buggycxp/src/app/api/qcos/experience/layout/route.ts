import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeBigInts } from "@/lib/prisma-extension";
import { LayoutCacheManager } from "@/lib/qcos/cache";
import { evaluateCondition, evaluateConditionAsync, applyActions } from "@/lib/qcos/rules";
import { createBootstrapFallbackLayout, LayoutCircuitBreaker } from "@/lib/qcos/circuit-breaker";
import crypto from "crypto";
import {
  SDUI_SCHEMA_VERSION,
  assertPayloadBudget,
  defaultLanguageModeForLocale,
  experienceShellSchema,
  languageModeMatchesLocale,
  languageModeSchema,
  supportedMobileLocaleSchema,
  evaluateOverlaySchedule,
  festivalOverlaySchema,
  type ExperienceShell,
  type FestivalOverlay,
} from "@/lib/qcos/contracts";
import { checkResolveRateLimit } from "@/lib/qcos/rate-limit";
import { FestivalThemeService } from "@/lib/qcos/festival-theme/festival-service";
import { resolveFestivalTheme } from "@/lib/qcos/festival-theme/resolver";
import { parseTokensToTheme } from "@/components/qcos/experience-preview/preview-theme";
import type { Prisma } from "@prisma/client";
import type { RuleContext } from "@/lib/qcos/rules";

const publishedVersionInclude = {
  layouts: {
    where: { is_enabled: true },
    include: {
      theme: { include: { tokens: true } },
      sections: {
        orderBy: { display_order: "asc" as const },
        include: {
          widgets: {
            orderBy: { display_order: "asc" as const },
            include: { widget: true, actions: true, conditions: true, analytics: true, data_source: true },
          },
        },
      },
    },
  },
} satisfies Prisma.qcos_page_versionsInclude;

type PublishedVersion = Prisma.qcos_page_versionsGetPayload<{ include: typeof publishedVersionInclude }>;
type StoredWidgetInstance = PublishedVersion["layouts"][number]["sections"][number]["widgets"][number];
type StoredWidget = StoredWidgetInstance["widget"];

interface ResolutionRuleContext extends RuleContext {
  locale: string;
  languageMode: string;
  appVersion: string;
  clientCapabilities: string[];
  clientWidgetVersions: Record<string, string>;
  clientActions: string[];
  targetTime?: string;
}

interface CompiledWidgetAction {
  trigger: string;
  type: string;
  params: Record<string, unknown>;
}

interface CompiledWidget {
  id: string;
  analyticsId?: number;
  type: string;
  version: string;
  props: Record<string, unknown>;
  dataSource?: { key: string; params: Record<string, unknown>; emptyBehavior: string } | null;
  actions: CompiledWidgetAction[];
}

interface CompiledSection {
  id: string;
  name: string;
  order: number;
  constraints: Record<string, unknown>;
  widgets: CompiledWidget[];
}

interface CompiledLayoutTree extends Record<string, unknown> {
  schemaVersion: string;
  layoutId: string | number;
  layoutName: string;
  pageName: string;
  locale: string;
  languageMode: string;
  versionNumber: number;
  experienceShell?: ExperienceShell;
  theme: {
    id: string | number;
    name: string;
    tokens: Record<string, string>;
    overlay?: FestivalOverlay | null;
  } | null;
  overlay?: FestivalOverlay | null;
  sections: CompiledSection[];
}

function layoutMetadata(layout: CompiledLayoutTree) {
  return {
    schemaVersion: layout.schemaVersion,
    layoutId: layout.layoutId,
    layoutName: layout.layoutName,
    pageName: layout.pageName,
    locale: layout.locale,
    languageMode: layout.languageMode,
    versionNumber: layout.versionNumber,
    experienceShell: layout.experienceShell,
    theme: layout.theme,
  };
}

function parseJsonObject(value: string | null | undefined): Record<string, unknown> {
  if (!value) return {};
  try {
    const parsed: unknown = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

type LocalizationIndex = Map<string, string>;

function localizationKey(entityType: string, entityId: number, fieldKey: string) {
  return `${entityType}:${entityId}:${fieldKey}`;
}

function localizedValue(
  localizations: LocalizationIndex,
  entityType: string,
  entityId: number,
  fieldKey: string,
  fallback: unknown,
) {
  return localizations.get(localizationKey(entityType, entityId, fieldKey)) ?? fallback;
}

function localizeWidgetProps(widgetId: number, props: Record<string, unknown>, localizations: LocalizationIndex) {
  return Object.fromEntries(
    Object.entries(props).map(([key, value]) => [
      key,
      typeof value === "string" ? localizedValue(localizations, "widget", widgetId, `props.${key}`, value) : value,
    ]),
  );
}

function normalizeWidgetInstance(
  widgetInst: StoredWidgetInstance,
  overrideWidget?: StoredWidget,
  localizations: LocalizationIndex = new Map(),
  supportedActions: ReadonlySet<string> = new Set(),
): CompiledWidget {
  const widget = overrideWidget || widgetInst.widget;
  const schema = parseJsonObject(widget.schema_def);
  const storedProps = parseJsonObject(widgetInst.properties_json);
  const instanceId = typeof storedProps.id === "string" ? storedProps.id : `widget-${widgetInst.id}`;
  const version = typeof storedProps.version === "string" ? storedProps.version : typeof schema.version === "string" ? schema.version : "1.0.0";
  const props = { ...storedProps };
  delete props.id;
  delete props.version;
  return {
    id: instanceId,
    analyticsId: widgetInst.id,
    type: widget.name,
    version,
    props: localizeWidgetProps(widgetInst.id, props, localizations),
    dataSource: widgetInst.data_source ? {
      key: widgetInst.data_source.name,
      params: parseJsonObject(widgetInst.data_source.filters_json),
      emptyBehavior: "hide_section",
    } : null,
    actions: (widgetInst.actions || [])
      .filter((action) => supportedActions.has(action.action_type))
      .map((action) => ({
        trigger: action.trigger,
        type: action.action_type,
        params: parseJsonObject(action.params_json),
      })),
  };
}

async function resolveExperimentAssignments(identity: string) {
  const now = new Date();
  const experiments = await prisma.qcos_experiments.findMany({
    where: { status: "active", starts_at: { lte: now }, ends_at: { gt: now }, flag: { is_enabled: true } },
    include: { variants: { orderBy: { id: "asc" } }, flag: true },
  });
  return experiments.flatMap((experiment) => {
    const bucket = crypto.createHash("sha256").update(`${experiment.id}:${identity}`).digest().readUInt32BE(0) / 0xffffffff * 100;
    let cursor = 0;
    const variant = experiment.variants.find((candidate) => { cursor += Number(candidate.traffic_pct); return bucket < cursor; });
    return variant ? [{ experiment: experiment.name, flag: experiment.flag.flag_key, variant: variant.name }] : [];
  });
}

// SemVer comparison utility
function isVersionSupported(appVersion: string, minVersion: string, maxVersion?: string | null): boolean {
  const parse = (v: string) => v.split(".").map((x) => parseInt(x, 10) || 0);
  const app = parse(appVersion);
  const min = parse(minVersion);
  
  // Compare against min version
  for (let i = 0; i < Math.max(app.length, min.length); i++) {
    const a = app[i] || 0;
    const m = min[i] || 0;
    if (a > m) break;
    if (a < m) return false;
  }
  
  // Compare against max version
  if (maxVersion) {
    const max = parse(maxVersion);
    for (let i = 0; i < Math.max(app.length, max.length); i++) {
      const a = app[i] || 0;
      const mx = max[i] || 0;
      if (a < mx) break;
      if (a > mx) return false;
    }
  }
  
  return true;
}

// Dynamic Production Festival Theme Resolver
async function resolveMergedThemeAndOverlay(
  activeGlobalTheme: { id: number; name: string; tokens: Array<{ token_key: string; token_value: string }> } | null,
  targetTime?: string
) {
  const baseTokensMap: Record<string, string> = activeGlobalTheme
    ? Object.fromEntries(activeGlobalTheme.tokens.map((t) => [t.token_key, t.token_value]))
    : {};

  // 1. Find active published festival campaign based on server clock / target time
  const activeFestival = await FestivalThemeService.findActiveFestival(targetTime);

  if (!activeFestival) {
    return {
      theme: activeGlobalTheme ? {
        id: activeGlobalTheme.id,
        name: activeGlobalTheme.name,
        tokens: baseTokensMap,
        overlay: null,
      } : null,
      overlay: null,
    };
  }

  // 2. Active campaign exists -> resolve through permission engine
  const parsedBase = parseTokensToTheme(baseTokensMap);
  const resolvedExp = resolveFestivalTheme(parsedBase, activeFestival, {
    evaluationDate: targetTime,
  });

  const cardRadius = activeFestival.components.productCard?.borderRadius !== undefined
    ? `${activeFestival.components.productCard.borderRadius}px`
    : `${resolvedExp.resolvedTokens.cardRadius}px`;
  const buttonRadius = activeFestival.components.button?.borderRadius !== undefined
    ? `${activeFestival.components.button.borderRadius}px`
    : `${resolvedExp.resolvedTokens.buttonRadius}px`;

  const mergedTokens: Record<string, string> = {
    ...baseTokensMap,
    "sys.color.primary": resolvedExp.resolvedTokens.primary,
    "sys.color.secondary": resolvedExp.resolvedTokens.secondary,
    "sys.color.accent": resolvedExp.resolvedTokens.accent,
    "sys.color.background": resolvedExp.resolvedTokens.background,
    "sys.color.surface": resolvedExp.resolvedTokens.surface,
    "sys.color.surface_elevated": resolvedExp.resolvedTokens.surfaceElevated,
    "sys.color.text_primary": resolvedExp.resolvedTokens.textPrimary,
    "sys.color.text_secondary": resolvedExp.resolvedTokens.textSecondary,
    "sys.color.text_muted": resolvedExp.resolvedTokens.textMuted,
    "sys.color.success": resolvedExp.resolvedTokens.success,
    "sys.color.warning": resolvedExp.resolvedTokens.warning,
    "sys.color.error": resolvedExp.resolvedTokens.error,
    "sys.color.info": resolvedExp.resolvedTokens.info,
    "sys.color.gradient_from": resolvedExp.resolvedTokens.gradientFrom,
    "sys.color.gradient_to": resolvedExp.resolvedTokens.gradientTo,
    "sys.shape.card_radius": cardRadius,
    "sys.shape.button_radius": buttonRadius,
    "sys.shape.chip_radius": `${resolvedExp.resolvedTokens.chipRadius}px`,
    "sys.shape.input_radius": `${resolvedExp.resolvedTokens.inputRadius}px`,
    "sys.spacing.md": `${resolvedExp.resolvedTokens.spacingMd}px`,
    "sys.spacing.section_gap": `${resolvedExp.resolvedTokens.sectionGap}px`,
    "sys.typography.scale": `${resolvedExp.resolvedTokens.fontScale || 1}`,
    ...(resolvedExp.customFontFamily ? { "sys.typography.font_family": resolvedExp.customFontFamily } : {}),
  };

  const allDecorations = [
    ...resolvedExp.decorations.map((d) => {
      let placement: any = "hero";
      if (d.scope === "HEADER") placement = "header";
      else if (d.scope === "GLOBAL") placement = "global_background";
      else if (d.scope === "PRODUCTS") placement = "product_card";
      else if (d.scope === "CATEGORIES") placement = "category_card";

      let decType: any = "illustration";
      if (d.type === "pattern") decType = "pattern";
      else if (d.type === "glow" || d.type === "confetti") decType = "floating_element";
      else if (d.type === "shape") decType = "corner_decoration";

      return {
        id: d.id,
        name: d.name,
        type: decType,
        placement,
        assetUrl: d.assetUrl,
        opacity: d.opacity ?? 1,
        size: (d.size || "md") as any,
        scale: d.scale || 1,
        positionX: d.positionX || "center",
        positionY: d.positionY || "center",
        rotation: d.rotation || 0,
        mobile: d.mobileEnabled !== false,
        desktop: d.desktopEnabled !== false,
        isDecorative: true,
      };
    }),
    ...resolvedExp.watermarks.map((wm) => ({
      id: wm.id,
      name: wm.name,
      type: "watermark" as const,
      placement: (wm.scope === "GLOBAL" ? "global_background" : "hero") as any,
      assetUrl: wm.assetUrl,
      opacity: wm.opacity,
      size: (wm.size || "lg") as any,
      positionX: wm.position.includes("left") ? "left" : wm.position.includes("right") ? "right" : "center",
      positionY: wm.position.includes("top") ? "top" : wm.position.includes("bottom") ? "bottom" : "center",
      rotation: wm.rotation || 0,
      mobile: wm.mobileEnabled !== false,
      desktop: wm.desktopEnabled !== false,
      isDecorative: true,
    })),
  ];

  const resolvedOverlay: FestivalOverlay = {
    id: activeFestival.id,
    name: activeFestival.name,
    displayName: activeFestival.campaignName,
    description: activeFestival.description,
    enabled: true,
    opacity: 1,
    schedule: {
      startDate: activeFestival.schedule.startDate,
      startTime: activeFestival.schedule.startTime,
      endDate: activeFestival.schedule.endDate,
      endTime: activeFestival.schedule.endTime,
      timezone: activeFestival.schedule.timezone,
      status: "active" as const,
    },
    accentColors: {
      primary: activeFestival.colors.primaryAction?.color || undefined,
      secondary: activeFestival.colors.secondaryAccent?.color || undefined,
      tertiary: activeFestival.colors.accentHighlight?.color || undefined,
      additional: [],
    },
    decorations: allDecorations,
  };

  return {
    theme: {
      id: activeGlobalTheme?.id || 1,
      name: `${activeGlobalTheme?.name || "Base Theme"} (${activeFestival.campaignName})`,
      tokens: mergedTokens,
      overlay: resolvedOverlay,
    },
    overlay: resolvedOverlay,
  };
}

// Compile layout for a given page version record and context
async function compileLayoutTree(publishedVersion: PublishedVersion | null, ruleContext: ResolutionRuleContext, pageName: string): Promise<CompiledLayoutTree | null> {
  if (!publishedVersion || !publishedVersion.layouts || publishedVersion.layouts.length === 0) {
    return null;
  }

  const activeLayout = publishedVersion.layouts[0];
  const supportedActions = new Set(ruleContext.clientActions);
  const appVersion = ruleContext.appVersion || "1.0.0";
  const localizationRows = await prisma.qcos_localizations.findMany({
    where: { locale: ruleContext.locale, status: "approved" },
    select: { entity_type: true, entity_id: true, field_key: true, value_text: true },
  });
  const localizations: LocalizationIndex = new Map(
    localizationRows.map((row) => [
      localizationKey(row.entity_type, row.entity_id, row.field_key),
      row.value_text,
    ]),
  );

  // Perform App Version Handshake, Visibility checks & Fallbacks
  const resolvedSections = [];
  for (const section of activeLayout.sections) {
    if (section.visibility_rules) {
      const isSectionVisible = await evaluateConditionAsync(section.visibility_rules, ruleContext);
      if (!isSectionVisible) {
        continue;
      }
    }

    const resolvedWidgets = [];
    for (const widgetInst of section.widgets) {
      const widgetSpec = widgetInst.widget;
      
      let isWidgetVisible = true;
      if (widgetInst.conditions && widgetInst.conditions.length > 0) {
        for (const cond of widgetInst.conditions) {
          const isCondSatisfied = await evaluateConditionAsync(cond.condition_expr, ruleContext);
          if (!isCondSatisfied) {
            isWidgetVisible = false;
            break;
          }
        }
      }
      if (!isWidgetVisible) {
        continue;
      }

      let isSupported = isVersionSupported(appVersion, widgetSpec.min_version, widgetSpec.max_version);

      // Client Capability & Widget Version Negotiation
      if (isSupported) {
        try {
          if (widgetSpec.schema_def) {
            const schema = JSON.parse(widgetSpec.schema_def);
            
            // 1. Required Capabilities negotiation
            if (schema.requiredCapabilities && Array.isArray(schema.requiredCapabilities) && ruleContext.clientCapabilities && ruleContext.clientCapabilities.length > 0) {
              const clientCaps = ruleContext.clientCapabilities;
              for (const cap of schema.requiredCapabilities) {
                if (!clientCaps.includes(cap)) {
                  isSupported = false;
                  break;
                }
              }
            }

            // 2. Widget version negotiation
            if (isSupported && schema.version && ruleContext.clientWidgetVersions) {
              const clientVerSupported = ruleContext.clientWidgetVersions[widgetSpec.name];
              if (clientVerSupported) {
                const parseVer = (v: string) => v.split(".").map((x) => parseInt(x, 10) || 0);
                const wVer = parseVer(schema.version);
                const cVer = parseVer(clientVerSupported);
                // Incompatible if major versions differ, or minor/patch is lower than layout spec
                if (wVer[0] !== cVer[0] || cVer[1] < wVer[1]) {
                  isSupported = false;
                }
              }
            }
          }
        } catch (e) {
          console.warn("Failed to negotiate widget capability:", e);
        }
      }
      
      if (isSupported) {
        resolvedWidgets.push(normalizeWidgetInstance(widgetInst, undefined, localizations, supportedActions));
      } else if (widgetSpec.fallback_id) {
        const fallbackWidget = await prisma.qcos_widgets.findUnique({
          where: { id: widgetSpec.fallback_id },
        });
        
        if (fallbackWidget) {
          resolvedWidgets.push(normalizeWidgetInstance(widgetInst, fallbackWidget, localizations, supportedActions));
        }
      }
    }

    const constraintsObj = parseJsonObject(section.constraints_json);
    const configuredSectionId = constraintsObj.id;
    const isVisible = constraintsObj.visible !== false && constraintsObj.enabled !== false;
    resolvedSections.push({
      id: typeof configuredSectionId === "string" ? configuredSectionId : `section-${section.id}`,
      name: String(localizedValue(localizations, "section", section.id, "name", section.name)),
      order: section.display_order,
      enabled: isVisible,
      visible: isVisible,
      constraints: constraintsObj,
      widgets: resolvedWidgets,
    });
  }

  const shellCandidate = resolvedSections
    .map((section) => section.constraints.experienceShell)
    .find((value) => value !== undefined);
  const parsedShell = experienceShellSchema.safeParse(shellCandidate);

    const activeGlobalTheme = await prisma.qcos_themes.findFirst({
      where: { is_active: true },
      include: { tokens: true },
    }) || activeLayout.theme;

    const { theme: finalTheme, overlay: finalOverlay } = await resolveMergedThemeAndOverlay(
      activeGlobalTheme,
      ruleContext.targetTime
    );

    const tree: CompiledLayoutTree = {
      schemaVersion: SDUI_SCHEMA_VERSION,
      layoutId: activeLayout.id,
      layoutName: String(localizedValue(localizations, "page", publishedVersion.id, "layoutName", activeLayout.name)),
      pageName,
      locale: ruleContext.locale,
      languageMode: ruleContext.languageMode,
      versionNumber: publishedVersion.version_number,
      ...(parsedShell.success ? { experienceShell: parsedShell.data } : {}),
      theme: finalTheme,
      overlay: finalOverlay,
      sections: resolvedSections,
    };

  const activeRules = await prisma.qcos_experience_rules.findMany({
    where: { is_active: true }
  });
  for (const rule of activeRules) {
    if (evaluateCondition(rule.conditions_json, ruleContext)) {
      applyActions(rule.actions_json, tree);
    }
  }

  assertPayloadBudget(tree);
  return tree;
}

// Generate patches between client layout and current server layout
async function generateDiffPatches(clientLayoutHash: string, compiledLayoutTree: CompiledLayoutTree, pageName: string, ruleContext: ResolutionRuleContext) {
  const allVersions = await prisma.qcos_page_versions.findMany({
    where: {
      template: { page_name: pageName }
    },
    include: publishedVersionInclude,
  });

  let clientLayoutTree: CompiledLayoutTree | null = null;
  for (const ver of allVersions) {
    const potentialTree = await compileLayoutTree(ver, ruleContext, pageName);
    if (potentialTree) {
      const potHash = crypto.createHash("sha256").update(JSON.stringify(serializeBigInts(potentialTree))).digest("hex");
      if (potHash === clientLayoutHash) {
        clientLayoutTree = potentialTree;
        break;
      }
    }
  }

  if (clientLayoutTree) {
    if (JSON.stringify(layoutMetadata(clientLayoutTree)) !== JSON.stringify(layoutMetadata(compiledLayoutTree))) {
      return null;
    }
    const patches: Array<Record<string, unknown>> = [];
    const clientSecs = clientLayoutTree.sections || [];
    const serverSecs = compiledLayoutTree.sections || [];
    
    const clientMap = new Map(clientSecs.map((section) => [section.id, section]));
    const serverMap = new Map(serverSecs.map((section) => [section.id, section]));

    // Detect removals
    for (const clientSec of clientSecs) {
      if (!serverMap.has(clientSec.id)) {
        patches.push({
          op: "remove",
          sectionId: clientSec.id
        });
      }
    }

    // Detect additions & updates
    for (const serverSec of serverSecs) {
      const clientSec = clientMap.get(serverSec.id);
      if (!clientSec) {
        patches.push({
          op: "add",
          section: serverSec
        });
      } else {
        const clientSecStr = JSON.stringify(serializeBigInts(clientSec));
        const serverSecStr = JSON.stringify(serializeBigInts(serverSec));
        if (clientSecStr !== serverSecStr) {
          patches.push({
            op: "update",
            sectionId: serverSec.id,
            name: serverSec.name,
            order: serverSec.order,
            constraints: serverSec.constraints,
            widgets: serverSec.widgets
          });
        }
      }
    }

    return patches;
  }

  return null;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

// POST /api/qcos/experience/layout - Resolves screen layout based on context
export async function POST(request: Request) {
  try {
    const rateLimit = await checkResolveRateLimit(request);
    if (!rateLimit.allowed) {
      return NextResponse.json({ success: false, error: "Rate limit exceeded" }, { status: 429, headers: { "Retry-After": String(rateLimit.retryAfter) } });
    }
    const body = await request.json().catch(() => ({}));
    
    // 1. Resolve request context properties
    const gatewayUserId = request.headers.get("X-CXP-User-Id");
    const gatewayKey = request.headers.get("X-CXP-Gateway-Key");
    const expectedGatewayHash = process.env.CXP_GATEWAY_KEY ? crypto.createHash("sha256").update(process.env.CXP_GATEWAY_KEY).digest() : null;
    const suppliedGatewayHash = gatewayKey ? crypto.createHash("sha256").update(gatewayKey).digest() : null;
    const trustedGateway = Boolean(expectedGatewayHash && suppliedGatewayHash && crypto.timingSafeEqual(expectedGatewayHash, suppliedGatewayHash));
    const userId = trustedGateway && gatewayUserId && /^\d+$/.test(gatewayUserId) ? BigInt(gatewayUserId) : null;
    const requestContext = body.context || {};
    const city = requestContext.city || body.city || request.headers.get("X-Client-City") || "Hyderabad";
    const appVersion = requestContext.appVersion || body.appVersion || request.headers.get("X-App-Version") || "1.0.0";
    const platform = requestContext.platform || body.platform || request.headers.get("X-Client-Platform") || "android";
    const pageName = body.page || body.pageName || "home";
    const channelCode = request.headers.get("X-Release-Channel") || body.channel || "prod";
    const market = requestContext.market || "IN";
    const explicitLocale = requestContext.locale;
    const acceptedLocale = request.headers.get("Accept-Language")?.split(",")[0];
    const localeCandidate = explicitLocale || acceptedLocale || "en-IN";
    const locale = supportedMobileLocaleSchema.safeParse(localeCandidate).success
      ? localeCandidate
      : explicitLocale
        ? localeCandidate
        : "en-IN";
    const languageMode = requestContext.languageMode || defaultLanguageModeForLocale(locale) || "english";
    if (!supportedMobileLocaleSchema.safeParse(locale).success || !languageModeSchema.safeParse(languageMode).success || !languageModeMatchesLocale(locale, languageMode)) {
      return NextResponse.json({ success: false, error: "Unsupported locale or language mode" }, { status: 422 });
    }
    const moduleCode = body.module || requestContext.module || "grocery";
    
    const clientLayoutHash = request.headers.get("If-None-Match")?.replace(/^W\//, "").replaceAll('"', "") || request.headers.get("X-Layout-Hash") || body.knownLayout?.hash?.replace(/^sha256:/, "") || body.layoutHash;

    // Extract client capabilities and widget version registry parameters
    const capabilitiesHeader = request.headers.get("X-Client-Capabilities") || body.capabilities?.features || body.capabilities;
    const widgetVersionsHeader = request.headers.get("X-Client-Widget-Versions") || body.capabilities?.widgets || body.widgetVersions;

    let clientCapabilities: string[] = [];
    try {
      if (capabilitiesHeader) {
        clientCapabilities = typeof capabilitiesHeader === "string" ? JSON.parse(capabilitiesHeader) : capabilitiesHeader;
      }
    } catch (e) {
      console.warn("Failed to parse X-Client-Capabilities header:", e);
    }

    let clientWidgetVersions: Record<string, string> = {};
    try {
      if (widgetVersionsHeader) {
        clientWidgetVersions = typeof widgetVersionsHeader === "string" ? JSON.parse(widgetVersionsHeader) : widgetVersionsHeader;
      }
    } catch (e) {
      console.warn("Failed to parse X-Client-Widget-Versions header:", e);
    }
    const rawClientActions: unknown = body.capabilities?.actions;
    const clientActions: string[] = Array.isArray(rawClientActions)
      ? rawClientActions.filter((action: unknown): action is string => typeof action === "string")
      : [];
    const cacheCapabilities = [
      ...clientCapabilities,
      ...clientActions.map((action) => `action:${action}`),
    ];

    const previewTime = request.headers.get("X-Preview-Time") || (body as Record<string, any>).previewTime || (body as Record<string, any>).context?.previewTime || undefined;

    // Compile targeting context rules payload
    const ruleContext: ResolutionRuleContext = {
      userId: userId ? userId.toString() : null,
      isLoggedIn: !!userId,
      loggedIn: !!userId,
      city,
      deviceType: platform,
      networkSpeed: "wifi",
      timezone: "UTC",
      preferredCategories: [],
      weatherCode: "clear",
      appVersion,
      platform,
      clientCapabilities,
      clientWidgetVersions,
      clientActions,
      market,
      locale,
      languageMode,
      module: moduleCode,
      signedIn: Boolean(userId),
      networkClass: requestContext.networkClass || "wifi",
      segments: [] as string[],
      targetTime: previewTime,
    };

    // If userId is provided, load rich user context details
    if (userId) {
      const contextProfile = await prisma.qcos_experience_context.findUnique({
        where: { user_id: userId },
      });
      if (contextProfile) {
        ruleContext.city = contextProfile.city || city;
        ruleContext.deviceType = contextProfile.device_type || platform;
        ruleContext.networkSpeed = contextProfile.network_speed || "wifi";
        ruleContext.timezone = contextProfile.timezone || "UTC";
        ruleContext.preferredCategories = contextProfile.preferred_categories ? JSON.parse(contextProfile.preferred_categories) : [];
        ruleContext.weatherCode = contextProfile.weather_code || "clear";
      }
    }

    const activeSegments = await prisma.qcos_segments.findMany({ where: { is_active: true }, select: { segment_key: true, rules_json: true } });
    ruleContext.segments = activeSegments.filter((segment) => evaluateCondition(segment.rules_json, ruleContext)).map((segment) => segment.segment_key);
    const assignmentIdentity = userId?.toString() || request.headers.get("X-Device-Id") || "anonymous";
    const assignments = await resolveExperimentAssignments(assignmentIdentity);

    // Check Redis cache first
    const cacheVariation = { channelCode, market, locale, languageMode, moduleCode, city, signedIn: Boolean(userId), previewTime: previewTime || undefined };
    const cachedRecord = await LayoutCacheManager.getCachedLayout(pageName, appVersion, platform, cacheCapabilities, clientWidgetVersions, cacheVariation);
    const cachedTree = cachedRecord as CompiledLayoutTree | null;
    if (cachedTree) {
      const serializedData = JSON.stringify(serializeBigInts(cachedTree));
      const serverLayoutHash = crypto.createHash("sha256").update(serializedData).digest("hex");

      if (clientLayoutHash === serverLayoutHash) {
        return NextResponse.json({
          success: true,
          notModified: true,
          version: cachedTree.versionNumber,
          assignments,
        });
      }

      // Check if client sent an outdated hash for diff sync
      if (clientLayoutHash) {
        const patches = await generateDiffPatches(clientLayoutHash, cachedTree, pageName, ruleContext);
        if (patches) {
          return NextResponse.json({
            success: true,
            notModified: false,
            hash: serverLayoutHash,
            diff: true,
            patch: serializeBigInts(patches)
            , assignments
          });
        }
      }

      return NextResponse.json({
        success: true,
        notModified: false,
        hash: serverLayoutHash,
        diff: false,
        data: cachedTree,
        assignments,
      });
    }

    // Lazy scheduler run
    const now = new Date();
    await prisma.qcos_experiments.updateMany({
      where: { starts_at: { lte: now }, status: "draft" },
      data: { status: "active" }
    });
    await prisma.qcos_experiments.updateMany({
      where: { ends_at: { lte: now }, status: "active" },
      data: { status: "ended" }
    });

    const candidatePageNames = Array.from(new Set([
      pageName,
      `${pageName}_${moduleCode}`,
      moduleCode === "grocery" ? "home_grocery" : null,
      moduleCode === "grocery" ? "home_grocery_diwali" : null,
      moduleCode === "grocery" ? "home_grocery_summer" : null,
      moduleCode === "grocery" ? "home_grocery_monster" : null,
    ].filter(Boolean) as string[]));

    // 3. Find published version and compile layout inside Circuit Breaker
    const compiledLayoutTree = await LayoutCircuitBreaker.execute<CompiledLayoutTree | null>(async () => {
      const activePublish = await prisma.qcos_publish_history.findFirst({
        where: {
          channel: { code: channelCode },
          rolled_back_at: null,
          page_version: {
            template: { page_name: { in: candidatePageNames } }
          }
        },
        orderBy: {
          published_at: "desc"
        },
        include: {
          page_version: {
            include: {
              ...publishedVersionInclude,
            },
          }
        }
      });

      let publishedVersion: PublishedVersion | null = null;
      if (activePublish && activePublish.page_version) {
        publishedVersion = activePublish.page_version;
      } else {
        publishedVersion = await prisma.qcos_page_versions.findFirst({
          where: {
            template: { page_name: { in: candidatePageNames } },
            status: "published",
          },
          orderBy: {
            version_number: "desc"
          },
          include: publishedVersionInclude,
        });
      }

      if (!publishedVersion) {
        const fallback = createBootstrapFallbackLayout({ pageName, module: moduleCode, locale, languageMode }) as unknown as CompiledLayoutTree;
        const activeGlobalTheme = await prisma.qcos_themes.findFirst({
          where: { is_active: true },
          include: { tokens: true },
        });
        const { theme: finalTheme, overlay: finalOverlay } = await resolveMergedThemeAndOverlay(
          activeGlobalTheme,
          ruleContext.targetTime
        );
        fallback.theme = finalTheme;
        fallback.overlay = finalOverlay;
        return fallback;
      }

      return await compileLayoutTree(publishedVersion, ruleContext, pageName);
    }, { pageName, module: moduleCode, locale, languageMode });

    if (!compiledLayoutTree) {
      return NextResponse.json({ success: false, error: "Failed to compile layout" }, { status: 500 });
    }

    // Save compiled tree to Redis cache
    await LayoutCacheManager.setCachedLayout(pageName, appVersion, platform, compiledLayoutTree, cacheCapabilities, clientWidgetVersions, cacheVariation);

    // Calculate Layout Hash for incremental cache verification
    const serializedData = JSON.stringify(serializeBigInts(compiledLayoutTree));
    const serverLayoutHash = crypto.createHash("sha256").update(serializedData).digest("hex");

    if (clientLayoutHash === serverLayoutHash) {
      return NextResponse.json({
        success: true,
        notModified: true,
        version: compiledLayoutTree.versionNumber,
        assignments,
      });
    }

    // Handle Incremental Diff Sync logic
    if (clientLayoutHash) {
      const patches = await generateDiffPatches(clientLayoutHash, compiledLayoutTree, pageName, ruleContext);
      if (patches) {
        return NextResponse.json({
          success: true,
          notModified: false,
          hash: serverLayoutHash,
          diff: true,
          patch: serializeBigInts(patches)
          , assignments
        });
      }
    }

    return NextResponse.json({
      success: true,
      notModified: false,
      hash: serverLayoutHash,
      diff: false,
      data: serializeBigInts(compiledLayoutTree),
      assignments,
    });
  } catch (error: unknown) {
    console.error("Layout resolution gateway error:", error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Failed to resolve layout" }, { status: 500 });
  }
}
