"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Calendar,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  Copy,
  Edit3,
  Eye,
  EyeOff,
  Flag,
  Image as ImageIcon,
  Layers,
  Loader2,
  Maximize2,
  Moon,
  Move,
  Palette,
  Paintbrush,
  Pipette,
  Play,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Tag,
  Trash2,
  Type,
  Upload,
  FolderPlus,
  X,
  WandSparkles,
  Sliders,
  CheckSquare,
  Square,
  Globe,
  Settings,
  AlertCircle,
  FileText,
} from "lucide-react";
import { ExperienceSimulator, type SimulatorDocument } from "@/components/qcos/experience-simulator";
import type { FestivalOverlay } from "@/lib/qcos/contracts";
import { parseTokensToTheme, type ParsedThemeTokens } from "@/components/qcos/experience-preview/preview-theme";
import type {
  FestivalTheme,
  FestivalThemePermissions,
  FestivalOverrideScope,
  FestivalBackgroundOverride,
  FestivalWatermarkOverride,
  FestivalDecorationOverride,
  FestivalIconOverride,
  TypographyRole,
  FestivalAsset,
} from "@/lib/qcos/festival-theme/types";
import { createEmptyFestivalTheme, createDiwali2026FestivalTheme } from "@/lib/qcos/festival-theme/types";
import { resolveFestivalTheme } from "@/lib/qcos/festival-theme/resolver";
import { STANDARD_FESTIVAL_FONTS, loadCustomFestivalFonts, saveCustomFestivalFont } from "@/lib/qcos/festival-theme/font-registry";
import { sanitizeSvgContent, validateAssetUpload } from "@/lib/qcos/festival-theme/schema";

type FestivalTab =
  | "permissions"
  | "colors"
  | "backgrounds"
  | "typography"
  | "components"
  | "icons"
  | "watermarks"
  | "decorations"
  | "schedule";

type PreviewScreen = "home" | "hero" | "categories" | "flash";

const DEFAULT_BASE_TOKENS: Record<string, string> = {
  "sys.color.primary": "#039d55",
  "sys.color.secondary": "#ff9900",
  "sys.color.accent": "#ffd700",
  "sys.color.background": "#f7fbfa",
  "sys.color.surface": "#ffffff",
  "sys.color.surface_elevated": "#f8fafc",
  "sys.color.text_primary": "#1e293b",
  "sys.color.text_secondary": "#475569",
  "sys.color.text_muted": "#94a3b8",
  "sys.color.success": "#16834a",
  "sys.color.warning": "#f59e0b",
  "sys.color.error": "#e11d48",
  "sys.color.info": "#0284c7",
  "sys.shape.card_radius": "20px",
  "sys.shape.button_radius": "14px",
  "sys.shape.chip_radius": "8px",
  "sys.shape.input_radius": "14px",
  "sys.spacing.md": "16px",
  "sys.spacing.section_gap": "20px",
  "sys.typography.scale": "1",
};

const simulatorDocument = (screen: PreviewScreen): SimulatorDocument => ({
  pageName:
    screen === "categories"
      ? "category_directory"
      : screen === "hero"
      ? "hero_fest"
      : screen === "flash"
      ? "flash_deals"
      : "home_grocery",
  displayName:
    screen === "categories"
      ? "Categories"
      : screen === "hero"
      ? "Hero Fest"
      : screen === "flash"
      ? "Flash Deals"
      : "Grocery Home",
  sections: [
    { id: "hero_fest_deals", name: "Hero Fest Deals" },
    { id: "steal_deals", name: "Steal Deals" },
    { id: "featured_offers", name: "Featured & Offers" },
    { id: "salon_bloom", name: "Salon & Bloom" },
    { id: "category_grids", name: "Category Grids" },
    { id: "curated_products", name: "Curated Products" },
    { id: "lifestyle_categories", name: "Lifestyle Categories" },
    { id: "flash_deals", name: "Flash Deals" },
    { id: "store_explorer", name: "Explore Stores" },
  ],
});

export default function FestivalStudioPage() {
  const [activeTab, setActiveTab] = useState<FestivalTab>("permissions");
  const [festivals, setFestivals] = useState<FestivalTheme[]>([]);
  const [selectedFestivalId, setSelectedFestivalId] = useState<string | null>("festival_diwali_2026");
  const [draft, setDraft] = useState<FestivalTheme>(() => createDiwali2026FestivalTheme());
  const [baseTokens, setBaseTokens] = useState<ParsedThemeTokens>(() => parseTokensToTheme(DEFAULT_BASE_TOKENS));

  const [screen, setScreen] = useState<PreviewScreen>("home");
  const [viewportWidth, setViewportWidth] = useState<number>(390);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [showBaseOnly, setShowBaseOnly] = useState(false);

  // Asset & Font Library State
  const [availableFonts, setAvailableFonts] = useState(STANDARD_FESTIVAL_FONTS);
  const [newFontName, setNewFontName] = useState("");
  const [newFontFamily, setNewFontFamily] = useState("");
  const [newFontUrl, setNewFontUrl] = useState("");

  // Load Festivals on Mount
  const loadFestivals = useCallback(async () => {
    try {
      const res = await fetch("/BuggyCxp/api/qcos/festival-themes");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setFestivals(json.data);
        if (json.data.length > 0 && !selectedFestivalId) {
          setSelectedFestivalId(json.data[0].id);
          setDraft(json.data[0]);
        }
      }
    } catch {
      // Fallback
    }
  }, [selectedFestivalId]);

  useEffect(() => {
    void loadFestivals();
    setAvailableFonts([...STANDARD_FESTIVAL_FONTS, ...loadCustomFestivalFonts()]);
  }, [loadFestivals]);

  const patchDraft = <K extends keyof FestivalTheme>(key: K, value: FestivalTheme[K]) => {
    setDraft((prev) => {
      const nextPerms = structuredClone(prev.permissions);
      if (key === "colors") {
        nextPerms.design.colors = true;
        nextPerms.design.backgrounds = true;
        nextPerms.design.gradients = true;
      } else if (key === "backgrounds") {
        nextPerms.design.backgrounds = true;
        nextPerms.design.gradients = true;
      } else if (key === "typography") {
        nextPerms.design.typography = true;
        nextPerms.design.fontFamily = true;
        nextPerms.design.fontScale = true;
      } else if (key === "components") {
        nextPerms.components.productCards = true;
        nextPerms.components.categoryCards = true;
        nextPerms.components.storeCards = true;
        nextPerms.components.buttons = true;
        nextPerms.design.shapes = true;
      } else if (key === "watermarks") {
        nextPerms.visuals.watermarks = true;
      } else if (key === "decorations") {
        nextPerms.visuals.decorativeArtwork = true;
      } else if (key === "icons") {
        nextPerms.visuals.icons = true;
      }

      return {
        ...prev,
        [key]: value,
        permissions: nextPerms,
        updatedAt: new Date().toISOString(),
      };
    });
  };

  const patchPermissions = (category: keyof FestivalThemePermissions, perm: string, val: boolean) => {
    setDraft((prev) => {
      const nextPerms = structuredClone(prev.permissions);
      (nextPerms[category] as any)[perm] = val;
      return {
        ...prev,
        permissions: nextPerms,
        updatedAt: new Date().toISOString(),
      };
    });
  };

  const [simulationDate, setSimulationDate] = useState<string>("");

  // Save Festival Theme
  const handleSave = async (themeOverride?: FestivalTheme) => {
    setBusy(true);
    setMessage("");
    const toSave = themeOverride || draft;
    try {
      const res = await fetch("/BuggyCxp/api/qcos/festival-themes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toSave),
      });
      const json = await res.json();
      if (json.success) {
        setMessage(`Campaign "${toSave.name}" saved successfully.`);
        void loadFestivals();
        return true;
      } else {
        setMessage(`Save failed: ${json.error || "Unknown error"}`);
        return false;
      }
    } catch (e: any) {
      setMessage(`Save error: ${e.message}`);
      return false;
    } finally {
      setBusy(false);
    }
  };

  // Publish Campaign
  const handlePublish = async () => {
    const published: FestivalTheme = {
      ...draft,
      status: "published",
      schedule: {
        ...draft.schedule,
        status: "active",
      },
      updatedAt: new Date().toISOString(),
    };
    setDraft(published);
    const ok = await handleSave(published);
    if (ok) {
      setMessage(`🚀 "${published.campaignName}" is now PUBLISHED! The server will automatically activate it on ${published.schedule.startDate} at ${published.schedule.startTime} (${published.schedule.timezone}).`);
    }
  };

  // Revert to Draft / Unpublish
  const handleUnpublish = async () => {
    const unpub: FestivalTheme = {
      ...draft,
      status: "draft",
      schedule: {
        ...draft.schedule,
        status: "draft",
      },
      updatedAt: new Date().toISOString(),
    };
    setDraft(unpub);
    const ok = await handleSave(unpub);
    if (ok) {
      setMessage(`Campaign "${unpub.name}" reverted to Draft status.`);
    }
  };

  // Delete Campaign
  const handleDelete = async () => {
    if (!confirm(`Delete campaign "${draft.name}"?`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/BuggyCxp/api/qcos/festival-themes?id=${draft.id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        setMessage(`Campaign "${draft.name}" deleted.`);
        handleCreateNew();
        void loadFestivals();
      }
    } catch (e: any) {
      setMessage(`Delete failed: ${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  // Create New Festival
  const handleCreateNew = () => {
    const fresh = createEmptyFestivalTheme("New Festive Campaign");
    setSelectedFestivalId(null);
    setDraft(fresh);
    setActiveTab("permissions");
    setMessage("Created new blank festival theme draft. Choose permissions below.");
  };

  // Resolve Experience for Live Simulator
  const resolvedExperience = useMemo(() => {
    if (showBaseOnly) {
      return resolveFestivalTheme(baseTokens, null);
    }
    return resolveFestivalTheme(baseTokens, draft, {
      forcePreviewActive: !simulationDate,
      evaluationDate: simulationDate || undefined,
    });
  }, [baseTokens, draft, showBaseOnly, simulationDate]);

  const simulatorTheme = useMemo(() => {
    const tokens = resolvedExperience.resolvedTokens;
    const cardRadius = draft.components.productCard?.borderRadius !== undefined
      ? `${draft.components.productCard.borderRadius}px`
      : `${tokens.cardRadius}px`;
    const buttonRadius = draft.components.button?.borderRadius !== undefined
      ? `${draft.components.button.borderRadius}px`
      : `${tokens.buttonRadius}px`;

    const tokenMap: Record<string, string> = {
      "sys.color.primary": tokens.primary,
      "sys.color.secondary": tokens.secondary,
      "sys.color.accent": tokens.accent,
      "sys.color.background": tokens.background,
      "sys.color.surface": tokens.surface,
      "sys.color.surface_elevated": tokens.surfaceElevated,
      "sys.color.text_primary": tokens.textPrimary,
      "sys.color.text_secondary": tokens.textSecondary,
      "sys.color.text_muted": tokens.textMuted,
      "sys.color.success": tokens.success,
      "sys.color.warning": tokens.warning,
      "sys.color.error": tokens.error,
      "sys.color.info": tokens.info,
      "sys.color.gradient_from": tokens.gradientFrom,
      "sys.color.gradient_to": tokens.gradientTo,
      "sys.shape.card_radius": cardRadius,
      "sys.shape.button_radius": buttonRadius,
      "sys.shape.chip_radius": `${tokens.chipRadius}px`,
      "sys.shape.input_radius": `${tokens.inputRadius}px`,
      "sys.spacing.md": `${tokens.spacingMd}px`,
      "sys.spacing.section_gap": `${tokens.sectionGap}px`,
      "sys.typography.scale": `${tokens.fontScale || 1}`,
      ...(resolvedExperience.customFontFamily ? { "sys.typography.font_family": resolvedExperience.customFontFamily } : {}),
    };

    return {
      id: 999,
      name: draft.name,
      is_active: true,
      tokens: tokenMap,
    };
  }, [resolvedExperience, draft]);

  const simulatorOverlay = useMemo((): FestivalOverlay | null => {
    if (showBaseOnly) return null;

    const allDecorations = [
      ...resolvedExperience.decorations.map((d) => {
        let placement: any = "hero";
        if (d.scope === "HEADER") placement = "header";
        else if (d.scope === "GLOBAL") placement = "global_background";
        else if (d.scope === "PRODUCTS") placement = "product_card";
        else if (d.scope === "CATEGORIES") placement = "category_card";

        let decType: "pattern" | "illustration" | "floating_element" | "corner_decoration" = "illustration";
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
      ...resolvedExperience.watermarks.map((wm) => ({
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

    return {
      id: draft.id,
      name: draft.name,
      displayName: draft.campaignName,
      description: draft.description,
      enabled: true,
      opacity: 1,
      schedule: {
        startDate: draft.schedule.startDate,
        startTime: draft.schedule.startTime,
        endDate: draft.schedule.endDate,
        endTime: draft.schedule.endTime,
        timezone: draft.schedule.timezone,
        status: "active" as const,
      },
      accentColors: {
        primary: draft.colors.primaryAction?.color || undefined,
        secondary: draft.colors.secondaryAccent?.color || undefined,
        tertiary: draft.colors.accentHighlight?.color || undefined,
        additional: [],
      },
      decorations: allDecorations,
    };
  }, [resolvedExperience, draft, showBaseOnly]);

  return (
    <div className="p-5 xl:p-6 max-w-[1700px] mx-auto space-y-5 text-slate-900">
      {/* Top Header */}
      <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-800 pb-5 text-white">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-orange-600 text-[11px] font-bold uppercase tracking-wider text-white">
              Data-Driven Campaign Engine
            </span>
            <span className="text-xs text-slate-400">Zero Hardcoded Presets · Remote Automated Schedules · IST Clock</span>
          </div>
          <h1 className="text-3xl font-extrabold flex items-center gap-3 mt-1">
            <Sparkles className="text-orange-400 w-8 h-8" />
            Festival Campaign Studio
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Create completely custom seasonal campaigns (Diwali, Holi, Eid, Christmas, Summer Sale, etc.). Configure visual overrides, set IST schedules, and publish. The CXP server automatically activates and reverts experiences without app store releases.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Saved Campaigns Selector */}
          {festivals.length > 0 && (
            <select
              value={selectedFestivalId || draft.id}
              onChange={(e) => {
                const found = festivals.find((f) => f.id === e.target.value);
                if (found) {
                  setSelectedFestivalId(found.id);
                  setDraft(found);
                  setMessage(`Loaded campaign: "${found.campaignName}" (${found.status.toUpperCase()})`);
                }
              }}
              className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold text-white cursor-pointer"
            >
              <option value="" disabled>📂 Load Saved Campaign...</option>
              {festivals.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.status === "published" ? "🟢 [LIVE/PUB] " : "⚪ [DRAFT] "} {f.name} ({f.year})
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={handleCreateNew}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4 text-orange-400" />
            Create Campaign
          </button>

          <button
            type="button"
            onClick={() => handleSave()}
            disabled={busy}
            className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 transition"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Draft
          </button>

          {draft.status === "published" ? (
            <button
              type="button"
              onClick={handleUnpublish}
              disabled={busy}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition"
            >
              Revert to Draft
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePublish}
              disabled={busy}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-950/50 transition"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-emerald-200" />}
              Publish Campaign
            </button>
          )}
        </div>
      </header>

      {/* Message alert */}
      {message && (
        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-orange-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-orange-400" />
            <span>{message}</span>
          </div>
          <button onClick={() => setMessage("")} className="text-slate-500 hover:text-white">✕</button>
        </div>
      )}

      {/* Main 3-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Controls & Permission Matrix */}
        <aside className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-5 space-y-4 max-h-[900px] overflow-y-auto sim-scroll shadow-sm">
          {/* Festival Campaign Meta */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5">
            <div className="grid grid-cols-12 gap-2 text-xs">
              <div className="col-span-7">
                <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">Festival Name</label>
                <input
                  type="text"
                  value={draft.name}
                  onChange={(e) => patchDraft("name", e.target.value)}
                  placeholder="e.g. Diwali, Holi, Christmas, Summer Gala"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-semibold text-slate-900"
                />
              </div>
              <div className="col-span-5">
                <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">Year</label>
                <input
                  type="number"
                  value={draft.year}
                  onChange={(e) => patchDraft("year", parseInt(e.target.value, 10) || 2027)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-semibold text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">Campaign Title</label>
              <input
                type="text"
                value={draft.campaignName}
                onChange={(e) => patchDraft("campaignName", e.target.value)}
                placeholder="e.g. Golden Radiance 2027"
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900"
              />
            </div>
          </div>

          {/* Master Tabs */}
          <div className="grid grid-cols-5 gap-1 rounded-xl border border-slate-200 p-1 bg-slate-100 text-xs">
            {[
              { id: "permissions", label: "Permissions", icon: ShieldCheck },
              { id: "colors", label: "Colors", icon: Palette },
              { id: "backgrounds", label: "Canvas", icon: Layers },
              { id: "typography", label: "Fonts", icon: Type },
              { id: "components", label: "Cards", icon: Maximize2 },
              { id: "watermarks", label: "Watermark", icon: ImageIcon },
              { id: "decorations", label: "Artwork", icon: Sparkles },
              { id: "icons", label: "Icons", icon: Tag },
              { id: "schedule", label: "Schedule", icon: Calendar },
            ].slice(0, 5).map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as FestivalTab)}
                  className={`py-2 px-1 rounded-lg font-medium transition text-center flex flex-col items-center justify-center gap-1 ${
                    isActive
                      ? "bg-white text-orange-600 shadow-xs font-bold border border-slate-200/80"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-orange-600" : "text-slate-500"}`} />
                  <span className="text-[11px] truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>
          <div className="grid grid-cols-4 gap-1 rounded-xl border border-slate-200 p-1 bg-slate-100 text-xs">
            {[
              { id: "watermarks", label: "Watermarks", icon: ImageIcon },
              { id: "decorations", label: "Artwork", icon: Sparkles },
              { id: "icons", label: "Icons", icon: Tag },
              { id: "schedule", label: "Schedule", icon: Calendar },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as FestivalTab)}
                  className={`py-2 px-1 rounded-lg font-medium transition text-center flex flex-col items-center justify-center gap-1 ${
                    isActive
                      ? "bg-white text-orange-600 shadow-xs font-bold border border-slate-200/80"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-orange-600" : "text-slate-500"}`} />
                  <span className="text-[11px] truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: PERMISSION MATRIX */}
          {activeTab === "permissions" && (
            <div className="space-y-4 pt-2">
              <div className="p-3 rounded-xl bg-orange-50 border border-orange-200 text-xs text-orange-950">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-orange-600" />
                  Festival Theme Permissions
                </div>
                <p className="text-[11px] mt-1 text-orange-900/80">
                  Select what this festival theme is allowed to override. Unchecked items strictly preserve normal brand theme defaults.
                </p>
              </div>

              {/* Design Permissions */}
              <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-white">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">Design &amp; Styling</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { id: "colors", label: "Colors Palette" },
                    { id: "backgrounds", label: "Backgrounds" },
                    { id: "gradients", label: "Hero Gradients" },
                    { id: "shapes", label: "Corner Radii" },
                    { id: "typography", label: "Typography" },
                    { id: "fontFamily", label: "Font Family" },
                    { id: "fontScale", label: "Font Scale" },
                    { id: "spacing", label: "Layout Spacing" },
                    { id: "motion", label: "Motion Style" },
                  ].map((p) => {
                    const isChecked = (draft.permissions.design as any)[p.id];
                    return (
                      <label key={p.id} className="flex items-center gap-2 cursor-pointer p-1.5 rounded hover:bg-slate-50">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => patchPermissions("design", p.id, e.target.checked)}
                          className="rounded text-orange-600 accent-orange-600 w-4 h-4"
                        />
                        <span className={`text-xs ${isChecked ? "font-bold text-slate-900" : "text-slate-600"}`}>{p.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Component Permissions */}
              <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-white">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">Component Overrides</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { id: "productCards", label: "Product Cards" },
                    { id: "categoryCards", label: "Category Tiles" },
                    { id: "storeCards", label: "Store Cards" },
                    { id: "dealCards", label: "Deal Containers" },
                    { id: "buttons", label: "Action Buttons" },
                    { id: "badges", label: "Offer Badges" },
                    { id: "chips", label: "Filter Chips" },
                    { id: "sectionHeaders", label: "Section Titles" },
                  ].map((p) => {
                    const isChecked = (draft.permissions.components as any)[p.id];
                    return (
                      <label key={p.id} className="flex items-center gap-2 cursor-pointer p-1.5 rounded hover:bg-slate-50">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => patchPermissions("components", p.id, e.target.checked)}
                          className="rounded text-orange-600 accent-orange-600 w-4 h-4"
                        />
                        <span className={`text-xs ${isChecked ? "font-bold text-slate-900" : "text-slate-600"}`}>{p.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Content / Visual Permissions */}
              <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-white">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">Content &amp; Visuals</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { id: "heroImages", label: "Hero Banner Art" },
                    { id: "icons", label: "Custom Icons" },
                    { id: "watermarks", label: "Watermarks" },
                    { id: "patterns", label: "Decorative Patterns" },
                    { id: "decorativeArtwork", label: "Festive Artwork" },
                  ].map((p) => {
                    const isChecked = (draft.permissions.visuals as any)[p.id];
                    return (
                      <label key={p.id} className="flex items-center gap-2 cursor-pointer p-1.5 rounded hover:bg-slate-50">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => patchPermissions("visuals", p.id, e.target.checked)}
                          className="rounded text-orange-600 accent-orange-600 w-4 h-4"
                        />
                        <span className={`text-xs ${isChecked ? "font-bold text-slate-900" : "text-slate-600"}`}>{p.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: COLORS OVERRIDES */}
          {activeTab === "colors" && (
            <div className="space-y-4 pt-2">
              {!draft.permissions.design.colors && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Color permissions are currently <strong>OFF</strong>. Enable in Permissions tab to apply overrides.</span>
                </div>
              )}

              <div className="space-y-3">
                {[
                  { key: "primaryAction", label: "Primary Action", desc: "ADD buttons & indicators", defaultHex: "#c8acc6" },
                  { key: "secondaryAccent", label: "Secondary Accent", desc: "Deal shelf & promo ribbons", defaultHex: "#8b0000" },
                  { key: "accentHighlight", label: "Accent Highlight", desc: "Star ratings & VIP badges", defaultHex: "#ffd700" },
                  { key: "appBackground", label: "App Canvas Background", desc: "Screen background", defaultHex: "#ffffff" },
                  { key: "surface", label: "Card Surface", desc: "Product & store cards", defaultHex: "#ffffff" },
                  { key: "mainText", label: "Headings & Price Color", desc: "Titles & prices", defaultHex: "#c89b6a" },
                  { key: "heroGradientStart", label: "Hero Gradient (Start)", desc: "Top hero start", defaultHex: "#4a0e17" },
                  { key: "heroGradientEnd", label: "Hero Gradient (End)", desc: "Top hero end", defaultHex: "#cdcac1" },
                ].map((item) => {
                  const current = (draft.colors as any)[item.key] || { enabled: false, color: item.defaultHex };
                  return (
                    <div key={item.key} className="p-3 rounded-xl border border-slate-200 bg-white space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={current.enabled}
                            onChange={(e) => {
                              const nextColors = { ...draft.colors, [item.key]: { ...current, enabled: e.target.checked } };
                              patchDraft("colors", nextColors);
                            }}
                            className="rounded text-orange-600 accent-orange-600 w-4 h-4"
                          />
                          <div>
                            <div className="text-xs font-bold text-slate-900">{item.label}</div>
                            <div className="text-[10px] text-slate-500">{item.desc}</div>
                          </div>
                        </label>
                        <div
                          className="w-6 h-6 rounded-md border border-slate-300 shadow-2xs"
                          style={{ backgroundColor: current.color }}
                        />
                      </div>

                      {current.enabled && (
                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="color"
                            value={current.color}
                            onChange={(e) => {
                              const nextColors = { ...draft.colors, [item.key]: { ...current, color: e.target.value } };
                              patchDraft("colors", nextColors);
                            }}
                            className="w-8 h-8 rounded border border-slate-200 cursor-pointer p-0"
                          />
                          <input
                            type="text"
                            value={current.color}
                            onChange={(e) => {
                              const nextColors = { ...draft.colors, [item.key]: { ...current, color: e.target.value } };
                              patchDraft("colors", nextColors);
                            }}
                            className="w-28 px-2 py-1 border border-slate-200 rounded font-mono text-xs text-slate-800"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: CANVAS & BACKGROUNDS */}
          {activeTab === "backgrounds" && (
            <div className="space-y-4 pt-2">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <div className="text-xs font-bold text-slate-800 uppercase">App Canvas & Hero Backgrounds</div>
                  <button
                    type="button"
                    onClick={() => {
                      const newBg: FestivalBackgroundOverride = {
                        scope: "GLOBAL",
                        enabled: true,
                        type: "gradient",
                        color: draft.colors.appBackground?.color || "#baa7cd",
                        gradientFrom: draft.colors.heroGradientStart?.color || "#4a0e17",
                        gradientTo: draft.colors.heroGradientEnd?.color || "#cdcac1",
                        opacity: 1,
                      };
                      patchDraft("backgrounds", [...draft.backgrounds, newBg]);
                    }}
                    className="px-2.5 py-1 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Background
                  </button>
                </div>
              </div>

              {/* Canvas Color & Hero Gradient Quick Controls */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-3">
                <div className="text-xs font-bold text-slate-900">Global Canvas Background</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-1">Canvas Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={draft.colors.appBackground?.color || "#ffffff"}
                        onChange={(e) => {
                          const nextColors = {
                            ...draft.colors,
                            appBackground: { enabled: true, color: e.target.value },
                          };
                          patchDraft("colors", nextColors);
                        }}
                        className="w-8 h-8 rounded border border-slate-200 cursor-pointer p-0"
                      />
                      <input
                        type="text"
                        value={draft.colors.appBackground?.color || "#ffffff"}
                        onChange={(e) => {
                          const nextColors = {
                            ...draft.colors,
                            appBackground: { enabled: true, color: e.target.value },
                          };
                          patchDraft("colors", nextColors);
                        }}
                        className="w-24 px-2 py-1 border border-slate-200 rounded font-mono text-xs text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 block mb-1">Elevated Surface (Search/Nav)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={draft.colors.surfaceElevated?.color || "#f8fafc"}
                        onChange={(e) => {
                          const nextColors = {
                            ...draft.colors,
                            surfaceElevated: { enabled: true, color: e.target.value },
                          };
                          patchDraft("colors", nextColors);
                        }}
                        className="w-8 h-8 rounded border border-slate-200 cursor-pointer p-0"
                      />
                      <input
                        type="text"
                        value={draft.colors.surfaceElevated?.color || "#f8fafc"}
                        onChange={(e) => {
                          const nextColors = {
                            ...draft.colors,
                            surfaceElevated: { enabled: true, color: e.target.value },
                          };
                          patchDraft("colors", nextColors);
                        }}
                        className="w-24 px-2 py-1 border border-slate-200 rounded font-mono text-xs text-slate-800"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <div className="text-xs font-bold text-slate-900 mb-2">Hero Banner Campaign Gradient</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-1">Gradient Start</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={draft.colors.heroGradientStart?.color || "#4a0e17"}
                          onChange={(e) => {
                            const nextColors = {
                              ...draft.colors,
                              heroGradientStart: { enabled: true, color: e.target.value },
                            };
                            patchDraft("colors", nextColors);
                          }}
                          className="w-8 h-8 rounded border border-slate-200 cursor-pointer p-0"
                        />
                        <input
                          type="text"
                          value={draft.colors.heroGradientStart?.color || "#4a0e17"}
                          onChange={(e) => {
                            const nextColors = {
                              ...draft.colors,
                              heroGradientStart: { enabled: true, color: e.target.value },
                            };
                            patchDraft("colors", nextColors);
                          }}
                          className="w-24 px-2 py-1 border border-slate-200 rounded font-mono text-xs text-slate-800"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-500 block mb-1">Gradient End</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={draft.colors.heroGradientEnd?.color || "#cdcac1"}
                          onChange={(e) => {
                            const nextColors = {
                              ...draft.colors,
                              heroGradientEnd: { enabled: true, color: e.target.value },
                            };
                            patchDraft("colors", nextColors);
                          }}
                          className="w-8 h-8 rounded border border-slate-200 cursor-pointer p-0"
                        />
                        <input
                          type="text"
                          value={draft.colors.heroGradientEnd?.color || "#cdcac1"}
                          onChange={(e) => {
                            const nextColors = {
                              ...draft.colors,
                              heroGradientEnd: { enabled: true, color: e.target.value },
                            };
                            patchDraft("colors", nextColors);
                          }}
                          className="w-24 px-2 py-1 border border-slate-200 rounded font-mono text-xs text-slate-800"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Scoped Background Overrides List */}
              {draft.backgrounds.map((bg, idx) => (
                <div key={idx} className="p-3 border border-slate-200 rounded-xl bg-white space-y-2">
                  <div className="flex items-center justify-between">
                    <select
                      value={bg.scope}
                      onChange={(e) => {
                        const updated = [...draft.backgrounds];
                        updated[idx] = { ...bg, scope: e.target.value as any };
                        patchDraft("backgrounds", updated);
                      }}
                      className="text-xs font-bold bg-slate-50 border border-slate-200 rounded px-2 py-1"
                    >
                      <option value="GLOBAL">Global Canvas Background</option>
                      <option value="HERO">Hero Banner Background</option>
                      <option value="CATEGORIES">Category Rail Background</option>
                      <option value="PRODUCTS">Products Rail Background</option>
                      <option value="STORES">Store Explorer Background</option>
                      <option value="FLASH_DEALS">Flash Deals Background</option>
                    </select>
                    <button
                      onClick={() => {
                        const updated = draft.backgrounds.filter((_, i) => i !== idx);
                        patchDraft("backgrounds", updated);
                      }}
                      className="text-slate-400 hover:text-red-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">Fill Type</label>
                      <select
                        value={bg.type}
                        onChange={(e) => {
                          const updated = [...draft.backgrounds];
                          updated[idx] = { ...bg, type: e.target.value as any };
                          patchDraft("backgrounds", updated);
                        }}
                        className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs"
                      >
                        <option value="color">Solid Color</option>
                        <option value="gradient">Linear Gradient</option>
                        <option value="image">Image / Banner</option>
                        <option value="pattern">Pattern / Texture</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">Image / Pattern URL</label>
                      <input
                        type="text"
                        placeholder="https://... or data:image/..."
                        value={bg.imageUrl || ""}
                        onChange={(e) => {
                          const updated = [...draft.backgrounds];
                          updated[idx] = { ...bg, imageUrl: e.target.value };
                          patchDraft("backgrounds", updated);
                        }}
                        className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: TYPOGRAPHY & FONTS */}
          {activeTab === "typography" && (
            <div className="space-y-4 pt-2">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="text-xs font-bold text-slate-800 uppercase">Global Festival Font Family</div>
                <select
                  value={draft.typography.fontFamily || ""}
                  onChange={(e) => {
                    patchDraft("typography", { ...draft.typography, fontFamily: e.target.value || undefined });
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                >
                  <option value="">Default App Font (System)</option>
                  {availableFonts.map((f) => (
                    <option key={f.id} value={f.family}>
                      {f.name} ({f.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                  <span>Festival Typography Scale</span>
                  <span className="font-mono">{(draft.typography.fontScale || 1).toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min={0.85}
                  max={1.35}
                  step={0.05}
                  value={draft.typography.fontScale || 1}
                  onChange={(e) => {
                    patchDraft("typography", { ...draft.typography, fontScale: parseFloat(e.target.value) });
                  }}
                  className="w-full accent-orange-600 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* TAB 5: CARDS & COMPONENT CUSTOMIZATION */}
          {activeTab === "components" && (
            <div className="space-y-4 pt-2">
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl text-xs text-orange-950 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Maximize2 className="w-4 h-4 text-orange-600" />
                  Cards &amp; Container Customization
                </div>
                <p className="text-[11px] text-orange-900/80">
                  Customize card surfaces, border colors, radii, titles, ADD buttons, and attach festive artwork or icons directly beside, above, or below cards.
                </p>
              </div>

              {/* 1. Product Cards Customizer */}
              <div className="p-3.5 border border-slate-200 rounded-xl bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-900">📦 Product Cards</div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-500">Surface:</span>
                    <input
                      type="color"
                      value={draft.colors.surface?.color || "#ffffff"}
                      onChange={(e) => {
                        const nextColors = {
                          ...draft.colors,
                          surface: { enabled: true, color: e.target.value },
                        };
                        patchDraft("colors", nextColors);
                      }}
                      className="w-6 h-6 rounded border border-slate-200 cursor-pointer p-0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-1">Card Radius</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={0}
                        max={32}
                        value={draft.components.productCard?.borderRadius || 20}
                        onChange={(e) => {
                          patchDraft("components", {
                            ...draft.components,
                            productCard: {
                              ...draft.components.productCard,
                              enabled: true,
                              borderRadius: parseInt(e.target.value, 10),
                            },
                          });
                        }}
                        className="w-full accent-orange-600"
                      />
                      <span className="font-mono text-[11px] w-8">
                        {draft.components.productCard?.borderRadius || 20}px
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 block mb-1">Border Width</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={0}
                        max={4}
                        step={0.5}
                        value={draft.components.productCard?.borderWidth || 1}
                        onChange={(e) => {
                          patchDraft("components", {
                            ...draft.components,
                            productCard: {
                              ...draft.components.productCard,
                              enabled: true,
                              borderWidth: parseFloat(e.target.value),
                            },
                          });
                        }}
                        className="w-full accent-orange-600"
                      />
                      <span className="font-mono text-[11px] w-8">
                        {draft.components.productCard?.borderWidth || 1}px
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 text-xs pt-1 border-t border-slate-100">
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-1">Card Border Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={draft.components.productCard?.borderColor || "#e2e8f0"}
                        onChange={(e) => {
                          patchDraft("components", {
                            ...draft.components,
                            productCard: {
                              ...draft.components.productCard,
                              enabled: true,
                              borderColor: e.target.value,
                            },
                          });
                        }}
                        className="w-7 h-7 rounded border border-slate-200 cursor-pointer p-0"
                      />
                      <input
                        type="text"
                        value={draft.components.productCard?.borderColor || "#e2e8f0"}
                        onChange={(e) => {
                          patchDraft("components", {
                            ...draft.components,
                            productCard: {
                              ...draft.components.productCard,
                              enabled: true,
                              borderColor: e.target.value,
                            },
                          });
                        }}
                        className="w-20 px-1.5 py-1 border border-slate-200 rounded font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 block mb-1">ADD Button Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={draft.colors.primaryAction?.color || "#039d55"}
                        onChange={(e) => {
                          const nextColors = {
                            ...draft.colors,
                            primaryAction: { enabled: true, color: e.target.value },
                          };
                          patchDraft("colors", nextColors);
                        }}
                        className="w-7 h-7 rounded border border-slate-200 cursor-pointer p-0"
                      />
                      <input
                        type="text"
                        value={draft.colors.primaryAction?.color || "#039d55"}
                        onChange={(e) => {
                          const nextColors = {
                            ...draft.colors,
                            primaryAction: { enabled: true, color: e.target.value },
                          };
                          patchDraft("colors", nextColors);
                        }}
                        className="w-20 px-1.5 py-1 border border-slate-200 rounded font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Category Tiles Customizer */}
              <div className="p-3.5 border border-slate-200 rounded-xl bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-900">🏷️ Category Tiles</div>
                </div>
                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-1">Tile Background</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={draft.components.categoryCard?.backgroundColor || "#f8fafc"}
                        onChange={(e) => {
                          patchDraft("components", {
                            ...draft.components,
                            categoryCard: {
                              ...draft.components.categoryCard,
                              enabled: true,
                              backgroundColor: e.target.value,
                            },
                          });
                        }}
                        className="w-7 h-7 rounded border border-slate-200 cursor-pointer p-0"
                      />
                      <input
                        type="text"
                        value={draft.components.categoryCard?.backgroundColor || "#f8fafc"}
                        onChange={(e) => {
                          patchDraft("components", {
                            ...draft.components,
                            categoryCard: {
                              ...draft.components.categoryCard,
                              enabled: true,
                              backgroundColor: e.target.value,
                            },
                          });
                        }}
                        className="w-20 px-1.5 py-1 border border-slate-200 rounded font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 block mb-1">Label Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={draft.components.categoryCard?.labelColor || "#1e293b"}
                        onChange={(e) => {
                          patchDraft("components", {
                            ...draft.components,
                            categoryCard: {
                              ...draft.components.categoryCard,
                              enabled: true,
                              labelColor: e.target.value,
                            },
                          });
                        }}
                        className="w-7 h-7 rounded border border-slate-200 cursor-pointer p-0"
                      />
                      <input
                        type="text"
                        value={draft.components.categoryCard?.labelColor || "#1e293b"}
                        onChange={(e) => {
                          patchDraft("components", {
                            ...draft.components,
                            categoryCard: {
                              ...draft.components.categoryCard,
                              enabled: true,
                              labelColor: e.target.value,
                            },
                          });
                        }}
                        className="w-20 px-1.5 py-1 border border-slate-200 rounded font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Card Visual Attachments & Badges */}
              <div className="p-3.5 border border-orange-200 rounded-xl bg-orange-50/50 space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-xs font-bold text-slate-900">✨ Card Attachments (Icons &amp; Artwork)</div>
                    <div className="text-[10px] text-slate-500">Attach festive emblems beside, above, or in corners of cards</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newDec: FestivalDecorationOverride = {
                        id: `card_dec_${Date.now()}`,
                        name: `Card Decoration ${draft.decorations.length + 1}`,
                        enabled: true,
                        type: "image",
                        scope: "PRODUCTS",
                        assetUrl: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmNWZlMGIiIHN0cm9rZS13aWR0aD0iMiI+PHBhdGggZD0iTTEyIDJMMTUuMDkgOC4yNkwyMiA5LjI3TDE3IDExNEwxOC4xOCAyMUwxMiAxNy43N0w1LjgyIDIxTDcgMTRMMS45OSA5LjI3TDguOTEgOC4yNkwxMiAyWiIvPjwvc3ZnPg==",
                        positionX: "right",
                        positionY: "top",
                        size: "sm",
                        scale: 1,
                        opacity: 1,
                        mobileEnabled: true,
                        desktopEnabled: true,
                        nonBlocking: true,
                      };
                      patchDraft("decorations", [...draft.decorations, newDec]);
                    }}
                    className="px-2.5 py-1 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Attach to Card
                  </button>
                </div>

                {draft.decorations.filter((d) => d.scope === "PRODUCTS" || d.scope === "CATEGORIES").length === 0 ? (
                  <div className="p-4 text-center border border-dashed border-orange-200 rounded-xl text-slate-400 text-xs bg-white">
                    No card attachments configured. Click &quot;Attach to Card&quot; to place ribbons, sparkles, or icons directly on product and category cards.
                  </div>
                ) : (
                  draft.decorations
                    .filter((d) => d.scope === "PRODUCTS" || d.scope === "CATEGORIES")
                    .map((dec) => (
                      <div key={dec.id} className="p-3 border border-slate-200 rounded-xl bg-white space-y-2">
                        <div className="flex items-center justify-between">
                          <input
                            type="text"
                            value={dec.name}
                            onChange={(e) => {
                              const updated = draft.decorations.map((item) =>
                                item.id === dec.id ? { ...item, name: e.target.value } : item
                              );
                              patchDraft("decorations", updated);
                            }}
                            className="font-bold text-xs text-slate-900 border-b border-transparent hover:border-slate-300 focus:border-orange-500 bg-transparent px-1"
                          />
                          <button
                            onClick={() => {
                              const updated = draft.decorations.filter((item) => item.id !== dec.id);
                              patchDraft("decorations", updated);
                            }}
                            className="text-slate-400 hover:text-red-600 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <label className="text-[10px] text-slate-500 block mb-0.5">Position on Card</label>
                            <select
                              value={`${dec.positionY}-${dec.positionX}`}
                              onChange={(e) => {
                                const [y, x] = e.target.value.split("-") as [any, any];
                                const updated = draft.decorations.map((item) =>
                                  item.id === dec.id ? { ...item, positionX: x, positionY: y } : item
                                );
                                patchDraft("decorations", updated);
                              }}
                              className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs"
                            >
                              <option value="top-right">Top Right (Corner Ribbon)</option>
                              <option value="top-left">Top Left (Corner Badge)</option>
                              <option value="top-center">Above Card (Top Center)</option>
                              <option value="bottom-center">Below Card (Bottom Strip)</option>
                              <option value="center-left">Left Side Accent</option>
                              <option value="center-right">Right Side Accent</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-[10px] text-slate-500 block mb-0.5">Scale / Size</label>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="range"
                                min={0.5}
                                max={2.0}
                                step={0.1}
                                value={dec.scale || 1}
                                onChange={(e) => {
                                  const updated = draft.decorations.map((item) =>
                                    item.id === dec.id ? { ...item, scale: parseFloat(e.target.value) } : item
                                  );
                                  patchDraft("decorations", updated);
                                }}
                                className="w-full accent-orange-600"
                              />
                              <span className="font-mono text-[10px] w-6">{(dec.scale || 1).toFixed(1)}x</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-500 block mb-0.5">Asset Image / SVG URL</label>
                          <input
                            type="text"
                            value={dec.assetUrl}
                            onChange={(e) => {
                              const updated = draft.decorations.map((item) =>
                                item.id === dec.id ? { ...item, assetUrl: e.target.value } : item
                              );
                              patchDraft("decorations", updated);
                            }}
                            placeholder="https://... or data:image/svg+xml..."
                            className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-mono"
                          />
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          )}

          {/* TAB 6: WATERMARKS */}
          {activeTab === "watermarks" && (
            <div className="space-y-4 pt-2">
              <div className="flex justify-between items-center">
                <div className="text-xs font-bold text-slate-800 uppercase">Custom Watermarks</div>
                <button
                  type="button"
                  onClick={() => {
                    const newWm: FestivalWatermarkOverride = {
                      id: `wm_${Date.now()}`,
                      name: `Watermark ${draft.watermarks.length + 1}`,
                      enabled: true,
                      scope: "GLOBAL",
                      assetUrl: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MCIgaGVpZ2h0PSI4MCIgdmlld0JveD0iMCAwIDEwMCAxMDAiPjxjaXJjbGUgY3g9IjUwIiBjeT0iNTAiIHI9IjQwIiBzdHJva2U9IiNmNWZlMGIiIHN0cm9rZS13aWR0aD0iNCIgZmlsbD0ibm9uZSIvPjwvc3ZnPg==",
                      position: "center",
                      size: "lg",
                      opacity: 0.12,
                      mobileEnabled: true,
                      desktopEnabled: true,
                      nonBlocking: true,
                    };
                    patchDraft("watermarks", [...draft.watermarks, newWm]);
                  }}
                  className="px-2.5 py-1 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Watermark
                </button>
              </div>

              {draft.watermarks.length === 0 ? (
                <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs">
                  No watermarks added yet. Click &quot;Add Watermark&quot; to place subtle brand/cultural emblems.
                </div>
              ) : (
                draft.watermarks.map((wm, idx) => (
                  <div key={wm.id} className="p-3 border border-slate-200 rounded-xl bg-white space-y-2">
                    <div className="flex items-center justify-between">
                      <input
                        type="text"
                        value={wm.name}
                        onChange={(e) => {
                          const updated = [...draft.watermarks];
                          updated[idx] = { ...wm, name: e.target.value };
                          patchDraft("watermarks", updated);
                        }}
                        className="font-bold text-xs text-slate-900 border-b border-transparent hover:border-slate-300 focus:border-orange-500 bg-transparent px-1"
                      />
                      <button
                        onClick={() => {
                          const updated = draft.watermarks.filter((_, i) => i !== idx);
                          patchDraft("watermarks", updated);
                        }}
                        className="text-slate-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-0.5">Scope / Location</label>
                        <select
                          value={wm.scope}
                          onChange={(e) => {
                            const updated = [...draft.watermarks];
                            updated[idx] = { ...wm, scope: e.target.value as any };
                            patchDraft("watermarks", updated);
                          }}
                          className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs"
                        >
                          <option value="GLOBAL">App Canvas (Full)</option>
                          <option value="HERO">Hero Banner</option>
                          <option value="CATEGORIES">Categories</option>
                          <option value="PRODUCTS">Products</option>
                        </select>
                      </div>

                      <div>
                        <div className="flex justify-between text-[10px] text-slate-500 mb-0.5">
                          <span>Opacity</span>
                          <span>{Math.round(wm.opacity * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min={0.02}
                          max={0.8}
                          step={0.02}
                          value={wm.opacity}
                          onChange={(e) => {
                            const updated = [...draft.watermarks];
                            updated[idx] = { ...wm, opacity: parseFloat(e.target.value) };
                            patchDraft("watermarks", updated);
                          }}
                          className="w-full accent-orange-600"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">Asset Image / SVG URL</label>
                      <input
                        type="text"
                        value={wm.assetUrl}
                        onChange={(e) => {
                          const updated = [...draft.watermarks];
                          updated[idx] = { ...wm, assetUrl: e.target.value };
                          patchDraft("watermarks", updated);
                        }}
                        placeholder="https://... or data:image/svg+xml..."
                        className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-mono"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 7: ARTWORK & FESTIVE ILLUSTRATIONS */}
          {activeTab === "decorations" && (
            <div className="space-y-4 pt-2">
              <div className="flex justify-between items-center">
                <div className="text-xs font-bold text-slate-800 uppercase">Festive Artwork &amp; Illustrations</div>
                <button
                  type="button"
                  onClick={() => {
                    const newDec: FestivalDecorationOverride = {
                      id: `art_${Date.now()}`,
                      name: `Artwork ${draft.decorations.length + 1}`,
                      enabled: true,
                      type: "illustration" as any,
                      scope: "HERO",
                      assetUrl: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmNWZlMGIiIHN0cm9rZS13aWR0aD0iMS41Ij48cGF0aCBkPSJNMjEgMTZWNjhBMiAyIDAgMCAwIDE5IDZINkEyIDIgMCAwIDAgNCA4VjE2QTIgMiAwIDAgMCA2IDE4SDE5QTIgMiAwIDAgMCAyMSAxNloiLz48Y2lyY2xlIGN4PSI5IiBjeT0iOSIgcj0iMiIvPjxwYXRoIGQ9Ik0yMSAxNUwxNiAxMEw1IDIxIi8+PC9zdmc+",
                      positionX: "right",
                      positionY: "top",
                      size: "md",
                      scale: 1,
                      opacity: 1,
                      mobileEnabled: true,
                      desktopEnabled: true,
                      nonBlocking: true,
                    };
                    patchDraft("decorations", [...draft.decorations, newDec]);
                  }}
                  className="px-2.5 py-1 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Artwork
                </button>
              </div>

              {draft.decorations.length === 0 ? (
                <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs">
                  No artworks added yet. Click &quot;Add Artwork&quot; to place illustrations, paint drips, or header flags.
                </div>
              ) : (
                draft.decorations.map((dec, idx) => (
                  <div key={dec.id} className="p-3 border border-slate-200 rounded-xl bg-white space-y-2">
                    <div className="flex items-center justify-between">
                      <input
                        type="text"
                        value={dec.name}
                        onChange={(e) => {
                          const updated = [...draft.decorations];
                          updated[idx] = { ...dec, name: e.target.value };
                          patchDraft("decorations", updated);
                        }}
                        className="font-bold text-xs text-slate-900 border-b border-transparent hover:border-slate-300 focus:border-orange-500 bg-transparent px-1"
                      />
                      <button
                        onClick={() => {
                          const updated = draft.decorations.filter((_, i) => i !== idx);
                          patchDraft("decorations", updated);
                        }}
                        className="text-slate-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-0.5">Placement Scope</label>
                        <select
                          value={dec.scope}
                          onChange={(e) => {
                            const updated = [...draft.decorations];
                            updated[idx] = { ...dec, scope: e.target.value as any };
                            patchDraft("decorations", updated);
                          }}
                          className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs"
                        >
                          <option value="HERO">Hero Banner</option>
                          <option value="HEADER">Header &amp; Search</option>
                          <option value="PRODUCTS">Product Rail</option>
                          <option value="CATEGORIES">Category Rail</option>
                          <option value="GLOBAL">Global Overlay</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-500 block mb-0.5">Artwork Type</label>
                        <select
                          value={dec.type}
                          onChange={(e) => {
                            const updated = [...draft.decorations];
                            updated[idx] = { ...dec, type: e.target.value as any };
                            patchDraft("decorations", updated);
                          }}
                          className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs"
                        >
                          <option value="illustration">Illustration</option>
                          <option value="paint">Paint Drip</option>
                          <option value="sparkle">Sparkle / Glow</option>
                          <option value="shape">Flag / Symbol</option>
                          <option value="custom_artwork">Badge</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-0.5">Alignment X / Y</label>
                        <div className="grid grid-cols-2 gap-1">
                          <select
                            value={dec.positionX}
                            onChange={(e) => {
                              const updated = [...draft.decorations];
                              updated[idx] = { ...dec, positionX: e.target.value as any };
                              patchDraft("decorations", updated);
                            }}
                            className="px-1.5 py-1 bg-slate-50 border border-slate-200 rounded text-xs"
                          >
                            <option value="left">Left</option>
                            <option value="center">Center</option>
                            <option value="right">Right</option>
                          </select>
                          <select
                            value={dec.positionY}
                            onChange={(e) => {
                              const updated = [...draft.decorations];
                              updated[idx] = { ...dec, positionY: e.target.value as any };
                              patchDraft("decorations", updated);
                            }}
                            className="px-1.5 py-1 bg-slate-50 border border-slate-200 rounded text-xs"
                          >
                            <option value="top">Top</option>
                            <option value="center">Center</option>
                            <option value="bottom">Bottom</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-500 block mb-0.5">Scale &amp; Opacity</label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="range"
                            min={0.5}
                            max={2.5}
                            step={0.1}
                            value={dec.scale || 1}
                            onChange={(e) => {
                              const updated = [...draft.decorations];
                              updated[idx] = { ...dec, scale: parseFloat(e.target.value) };
                              patchDraft("decorations", updated);
                            }}
                            className="w-full accent-orange-600"
                          />
                          <span className="font-mono text-[10px] w-6">{(dec.scale || 1).toFixed(1)}x</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">Asset Image / SVG URL</label>
                      <input
                        type="text"
                        value={dec.assetUrl}
                        onChange={(e) => {
                          const updated = [...draft.decorations];
                          updated[idx] = { ...dec, assetUrl: e.target.value };
                          patchDraft("decorations", updated);
                        }}
                        placeholder="https://... or data:image/svg+xml..."
                        className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-mono"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 8: ICONS OVERRIDES */}
          {activeTab === "icons" && (
            <div className="space-y-4 pt-2">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
                <div className="font-bold text-slate-800 uppercase">App Icons Override</div>
                <p className="text-[11px] text-slate-500">
                  Override standard CXP navigation, module, and deal icons with festive variants.
                </p>
              </div>

              <div className="space-y-2.5">
                {[
                  { key: "search", label: "Search Icon", defaultEmoji: "🔍" },
                  { key: "cart", label: "Cart & Basket Icon", defaultEmoji: "🛒" },
                  { key: "grocery", label: "Grocery Module Icon", defaultEmoji: "🥦" },
                  { key: "food", label: "Food Module Icon", defaultEmoji: "🍴" },
                  { key: "ecommerce", label: "Shop Module Icon", defaultEmoji: "🛍️" },
                  { key: "flash", label: "Flash Deals Bolt", defaultEmoji: "⚡" },
                  { key: "offers", label: "Offers Tab Icon", defaultEmoji: "🏷️" },
                ].map((iconItem) => {
                  const current = draft.icons.find((i) => i.iconKey === iconItem.key) || {
                    iconKey: iconItem.key,
                    enabled: false,
                    customAssetUrl: "",
                  };
                  return (
                    <div key={iconItem.key} className="p-3 rounded-xl border border-slate-200 bg-white space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-900">
                          <input
                            type="checkbox"
                            checked={current.enabled}
                            onChange={(e) => {
                              const updated = draft.icons.filter((i) => i.iconKey !== iconItem.key);
                              if (e.target.checked) {
                                updated.push({ ...current, enabled: true });
                              }
                              patchDraft("icons", updated);
                            }}
                            className="rounded text-orange-600 accent-orange-600 w-4 h-4"
                          />
                          <span>{iconItem.defaultEmoji} {iconItem.label}</span>
                        </label>
                      </div>

                      {current.enabled && (
                        <div className="space-y-2 pt-1 border-t border-slate-100 mt-2">
                          <div className="flex items-center gap-2">
                            <label className="cursor-pointer px-2.5 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition">
                              <Upload className="w-3.5 h-3.5 text-orange-600" />
                              <span>Upload Image</span>
                              <input
                                type="file"
                                accept="image/svg+xml,image/png,image/jpeg,image/webp"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onload = (ev) => {
                                      const result = ev.target?.result as string;
                                      if (result) {
                                        const updated = draft.icons.filter((i) => i.iconKey !== iconItem.key);
                                        updated.push({ ...current, enabled: true, customAssetUrl: result });
                                        patchDraft("icons", updated);
                                        setMessage(`Uploaded icon for "${iconItem.label}"`);
                                      }
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </label>

                            <span className="text-[10px] text-slate-400">or enter image URL below</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="https://... or data:image/svg+xml..."
                              value={current.customAssetUrl}
                              onChange={(e) => {
                                const updated = draft.icons.filter((i) => i.iconKey !== iconItem.key);
                                updated.push({ ...current, enabled: true, customAssetUrl: e.target.value });
                                patchDraft("icons", updated);
                              }}
                              className="flex-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                            />
                            {current.customAssetUrl && (
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = draft.icons.filter((i) => i.iconKey !== iconItem.key);
                                  patchDraft("icons", updated);
                                }}
                                className="text-slate-400 hover:text-red-500 p-1"
                                title="Clear custom icon"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          {current.customAssetUrl && (
                            <div className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-50 border border-slate-200 w-fit">
                              <span className="text-[10px] text-slate-500 font-medium">Icon Preview:</span>
                              <img
                                src={current.customAssetUrl}
                                alt={iconItem.label}
                                className="w-6 h-6 object-contain rounded bg-white p-0.5 border border-slate-200"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 9: SCHEDULE & AUTOMATION */}
          {activeTab === "schedule" && (
            <div className="space-y-4 pt-2">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="font-bold text-slate-800 uppercase flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-orange-600" />
                    Automated Campaign Schedule
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    draft.status === "published"
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      : "bg-slate-200 text-slate-700 border border-slate-300"
                  }`}>
                    {draft.status === "published" ? "🟢 Published" : "⚪ Draft"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">Start Date</label>
                    <input
                      type="date"
                      value={draft.schedule.startDate}
                      onChange={(e) => {
                        patchDraft("schedule", { ...draft.schedule, startDate: e.target.value });
                      }}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white font-mono text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">Start Time (24h)</label>
                    <input
                      type="time"
                      value={draft.schedule.startTime || "00:00"}
                      onChange={(e) => {
                        patchDraft("schedule", { ...draft.schedule, startTime: e.target.value });
                      }}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white font-mono text-xs text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">End Date</label>
                    <input
                      type="date"
                      value={draft.schedule.endDate}
                      onChange={(e) => {
                        patchDraft("schedule", { ...draft.schedule, endDate: e.target.value });
                      }}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white font-mono text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">End Time (24h)</label>
                    <input
                      type="time"
                      value={draft.schedule.endTime || "23:59"}
                      onChange={(e) => {
                        patchDraft("schedule", { ...draft.schedule, endTime: e.target.value });
                      }}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white font-mono text-xs text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">Timezone</label>
                    <select
                      value={draft.schedule.timezone || "Asia/Kolkata"}
                      onChange={(e) => {
                        patchDraft("schedule", { ...draft.schedule, timezone: e.target.value });
                      }}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-xs text-slate-800 font-medium"
                    >
                      <option value="Asia/Kolkata">Asia/Kolkata (IST · UTC+5:30)</option>
                      <option value="UTC">UTC (Coordinated Universal Time)</option>
                      <option value="America/New_York">America/New_York (EST)</option>
                      <option value="Asia/Dubai">Asia/Dubai (GST · UTC+4)</option>
                      <option value="Asia/Singapore">Asia/Singapore (SGT · UTC+8)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">Priority (1-100)</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={draft.schedule.priority || 1}
                      onChange={(e) => {
                        patchDraft("schedule", { ...draft.schedule, priority: parseInt(e.target.value, 10) || 1 });
                      }}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-xs font-mono text-slate-800"
                    />
                  </div>
                </div>

                {/* Server Lifecycle Summary Card */}
                <div className="p-3 rounded-lg bg-orange-50/80 border border-orange-200 text-orange-950 space-y-1.5">
                  <div className="font-bold flex items-center gap-1.5 text-xs text-orange-900">
                    <ShieldCheck className="w-4 h-4 text-orange-600" />
                    Zero-Code Production Lifecycle
                  </div>
                  <p className="text-[11px] leading-relaxed text-orange-950/80">
                    • <strong>Automatic Live:</strong> Starts on <code>{draft.schedule.startDate} {draft.schedule.startTime || "00:00"} {draft.schedule.timezone}</code>.<br />
                    • <strong>Automatic Expiry:</strong> Ends on <code>{draft.schedule.endDate} {draft.schedule.endTime || "23:59"} {draft.schedule.timezone}</code>.<br />
                    • <strong>Zero Flutter Code:</strong> Mobile apps reconcile via ETag/version without app store updates. When expired, the base theme returns instantly.
                  </p>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* MIDDLE COLUMN: Live Native CXP Preview */}
        <main className="lg:col-span-7 rounded-3xl border border-slate-800 bg-slate-950/80 overflow-hidden shadow-2xl space-y-0">
          <div className="p-4 border-b border-slate-800 flex flex-wrap gap-3 items-center justify-between bg-slate-900/40">
            <div className="flex rounded-xl border border-slate-800 p-1 bg-slate-950/60">
              {(
                [
                  ["home", "Grocery Home"],
                  ["hero", "Hero Fest"],
                  ["categories", "Categories"],
                  ["flash", "Flash Deals"],
                ] as Array<[PreviewScreen, string]>
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setScreen(key)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                    screen === key ? "bg-orange-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowBaseOnly(!showBaseOnly)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition ${
                  showBaseOnly
                    ? "border-emerald-500 bg-emerald-500/20 text-emerald-300"
                    : "border-slate-800 hover:border-slate-700 text-slate-300"
                }`}
              >
                {showBaseOnly ? "Viewing: Base Theme Only" : "Viewing: Festival Overrides"}
              </button>

              <div className="flex items-center rounded-lg border border-slate-800 p-0.5 bg-slate-950 text-[11px]">
                {[360, 390, 430].map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setViewportWidth(w)}
                    className={`px-2 py-1 rounded transition font-mono ${
                      viewportWidth === w ? "bg-slate-800 text-white font-bold" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {w}px
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Time-Travel Tester Bar */}
          <div className="px-4 py-2 border-b border-slate-800/80 bg-slate-900/80 flex flex-wrap items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-orange-400" />
              <span className="font-semibold text-slate-300 text-[11px]">Time-Travel Tester:</span>
              <input
                type="datetime-local"
                value={simulationDate}
                onChange={(e) => setSimulationDate(e.target.value)}
                className="px-2 py-0.5 rounded bg-slate-950 border border-slate-700 text-[11px] font-mono text-slate-200"
              />
              {simulationDate && (
                <button
                  type="button"
                  onClick={() => setSimulationDate("")}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300"
                >
                  Reset to Live
                </button>
              )}
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <span>Status:</span>
              {resolvedExperience.isActive ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1">🟢 Festival Active</span>
              ) : (
                <span className="text-amber-400 font-bold flex items-center gap-1">⚪ Normal Base Theme</span>
              )}
            </div>
          </div>

          <div
            className="p-6 min-h-[780px] grid place-items-center"
            style={{
              background: "radial-gradient(circle at top, #1e293b40, transparent 70%)",
            }}
          >
            <ExperienceSimulator
              document={simulatorDocument(screen)}
              theme={simulatorTheme}
              overlay={simulatorOverlay}
              media={[]}
              playing={true}
              sourceLabel={`Festival Studio Live Draft · ${draft.campaignName}`}
              viewportWidth={viewportWidth}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
