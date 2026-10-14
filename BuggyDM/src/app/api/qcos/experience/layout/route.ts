import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeBigInts } from "@/lib/prisma-extension";
import { LayoutCacheManager } from "@/lib/qcos/cache";
import { evaluateCondition, applyActions } from "@/lib/qcos/rules";
import { LayoutCircuitBreaker } from "@/lib/qcos/circuit-breaker";
import crypto from "crypto";
import { authorizeApi, Permissions } from "@/lib/security/authorization";
import type { Prisma } from "@prisma/client";
import type { RuleContext } from "@/lib/qcos/rules";
import type {
  CompiledLayoutTree,
  LayoutPatch,
} from "@/lib/qcos/types";

const pageVersionInclude = {
  layouts: {
    where: { is_enabled: true },
    include: {
      theme: { include: { tokens: true } },
      sections: {
        orderBy: { display_order: "asc" as const },
        include: {
          widgets: {
            orderBy: { display_order: "asc" as const },
            include: {
              widget: true,
              actions: true,
              conditions: true,
              analytics: true,
              data_source: true,
            },
          },
        },
      },
    },
  },
} satisfies Prisma.qcos_page_versionsInclude;

type PublishedPageVersion = Prisma.qcos_page_versionsGetPayload<{
  include: typeof pageVersionInclude;
}>;

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

// Compile layout for a given page version record and context
async function compileLayoutTree(
  publishedVersion: PublishedPageVersion,
  ruleContext: RuleContext,
  pageName: string,
): Promise<CompiledLayoutTree | null> {
  if (!publishedVersion || !publishedVersion.layouts || publishedVersion.layouts.length === 0) {
    return null;
  }

  const activeLayout = publishedVersion.layouts[0];
  const appVersion = ruleContext.appVersion || "1.0.0";

  // Perform App Version Handshake, Visibility checks & Fallbacks
  const resolvedSections = [];
  for (const section of activeLayout.sections) {
    if (section.visibility_rules) {
      const isSectionVisible = evaluateCondition(section.visibility_rules, ruleContext);
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
          if (!evaluateCondition(cond.condition_expr, ruleContext)) {
            isWidgetVisible = false;
            break;
          }
        }
      }
      if (!isWidgetVisible) {
        continue;
      }

      const isSupported = isVersionSupported(appVersion, widgetSpec.min_version, widgetSpec.max_version);

      if (isSupported) {
        resolvedWidgets.push(widgetInst);
      } else if (widgetSpec.fallback_id) {
        const fallbackWidget = await prisma.qcos_widgets.findUnique({
          where: { id: widgetSpec.fallback_id },
        });

        if (fallbackWidget) {
          resolvedWidgets.push({
            ...widgetInst,
            widget_id: fallbackWidget.id,
            widget: fallbackWidget,
          });
        }
      }
    }

    if (resolvedWidgets.length > 0) {
      resolvedSections.push({
        id: section.id,
        name: section.name,
        display_order: section.display_order,
        visibility_rules: section.visibility_rules,
        constraints_json: section.constraints_json,
        widgets: resolvedWidgets,
      });
    }
  }

  const tree: CompiledLayoutTree = {
    layoutId: activeLayout.id,
    layoutName: activeLayout.name,
    pageName,
    versionNumber: publishedVersion.version_number,
    theme: activeLayout.theme ? {
      id: activeLayout.theme.id,
      name: activeLayout.theme.name,
      tokens: activeLayout.theme.tokens.map((t) => ({
        id: t.id,
        theme_id: t.theme_id,
        token_key: t.token_key,
        token_value: t.token_value,
        category: t.category,
        created_at: t.created_at
      })),
    } : null,
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

  return tree;
}

// Generate patches between client layout and current server layout
async function generateDiffPatches(
  clientLayoutHash: string,
  compiledLayoutTree: CompiledLayoutTree,
  pageName: string,
  ruleContext: RuleContext,
): Promise<LayoutPatch[] | null> {
  const allVersions = await prisma.qcos_page_versions.findMany({
    where: {
      template: { page_name: pageName }
    },
    include: pageVersionInclude,
  });

  let clientLayoutTree: CompiledLayoutTree | null = null;
  for (const ver of allVersions) {
    const potentialTree = await compileLayoutTree(ver, ruleContext, pageName);
    if (potentialTree) {
      const potHash = crypto.createHash("md5").update(JSON.stringify(serializeBigInts(potentialTree))).digest("hex");
      if (potHash === clientLayoutHash) {
        clientLayoutTree = potentialTree;
        break;
      }
    }
  }

  if (clientLayoutTree) {
    const patches: LayoutPatch[] = [];
    const clientSecs = clientLayoutTree.sections || [];
    const serverSecs = compiledLayoutTree.sections || [];

    const clientMap = new Map(clientSecs.map((section) => [section.id, section] as const));
    const serverMap = new Map(serverSecs.map((section) => [section.id, section] as const));

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
            display_order: serverSec.display_order,
            constraints_json: serverSec.constraints_json,
            visibility_rules: serverSec.visibility_rules,
            widgets: serverSec.widgets
          });
        }
      }
    }

    return patches;
  }

  return null;
}

// POST /api/qcos/experience/layout - Resolves screen layout based on context
export async function POST(request: Request) {
  const authorization = await authorizeApi(Permissions.cxpRead);
  if (!authorization.ok) return authorization.response;

  try {
    const body = await request.json().catch(() => ({}));

    // 1. Resolve request context properties
    const userId = body.userId ? BigInt(body.userId) : null;
    const city = body.city || request.headers.get("X-Client-City") || "Hyderabad";
    const appVersion = body.appVersion || request.headers.get("X-App-Version") || "1.0.0";
    const platform = body.platform || request.headers.get("X-Client-Platform") || "mobile";
    const pageName = body.pageName || "home";
    const channelCode = request.headers.get("X-Release-Channel") || body.channel || "prod";

    const clientLayoutHash = request.headers.get("X-Layout-Hash") || body.layoutHash;

    // Compile targeting context rules payload
    const ruleContext = {
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

    // Check Redis cache first
    const cachedTree = await LayoutCacheManager.getCachedLayout(pageName, appVersion, platform);
    if (cachedTree) {
      const serializedData = JSON.stringify(serializeBigInts(cachedTree));
      const serverLayoutHash = crypto.createHash("md5").update(serializedData).digest("hex");

      if (clientLayoutHash === serverLayoutHash) {
        return NextResponse.json({
          success: true,
          notModified: true,
          version: cachedTree.versionNumber,
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
          });
        }
      }

      return NextResponse.json({
        success: true,
        notModified: false,
        hash: serverLayoutHash,
        diff: false,
        data: cachedTree,
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

    // 3. Find published version and compile layout inside Circuit Breaker
    const compiledLayoutTree = await LayoutCircuitBreaker.execute<CompiledLayoutTree | null>(async () => {
      const activePublish = await prisma.qcos_publish_history.findFirst({
        where: {
          channel: { code: channelCode },
          rolled_back_at: null,
          page_version: {
            template: { page_name: pageName }
          }
        },
        orderBy: {
          published_at: "desc"
        },
        include: {
          page_version: {
            include: {
              ...pageVersionInclude,
            },
          }
        }
      });

      let publishedVersion = null;
      if (activePublish && activePublish.page_version) {
        publishedVersion = activePublish.page_version;
      } else {
        publishedVersion = await prisma.qcos_page_versions.findFirst({
          where: {
            template: { page_name: pageName },
            status: "published",
          },
          orderBy: {
            version_number: "desc"
          },
          include: pageVersionInclude,
        });
      }

      if (!publishedVersion) {
        throw new Error(`No published layout version found for page: ${pageName}`);
      }

      return await compileLayoutTree(publishedVersion, ruleContext, pageName);
    });

    if (!compiledLayoutTree) {
      return NextResponse.json({ success: false, error: "Failed to compile layout" }, { status: 500 });
    }

    // Save compiled tree to Redis cache
    await LayoutCacheManager.setCachedLayout(pageName, appVersion, platform, compiledLayoutTree);

    // Calculate Layout Hash for incremental cache verification
    const serializedData = JSON.stringify(serializeBigInts(compiledLayoutTree));
    const serverLayoutHash = crypto.createHash("md5").update(serializedData).digest("hex");

    if (clientLayoutHash === serverLayoutHash) {
      return NextResponse.json({
        success: true,
        notModified: true,
        version: compiledLayoutTree.versionNumber,
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
        });
      }
    }

    return NextResponse.json({
      success: true,
      notModified: false,
      hash: serverLayoutHash,
      diff: false,
      data: serializeBigInts(compiledLayoutTree),
    });
  } catch (error) {
    console.error("Layout resolution gateway error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to resolve layout" },
      { status: 500 },
    );
  }
}
