"use client";

import React, { useMemo, useState } from "react";
import { Zap, ChevronDown, User, Percent, FileText, Heart } from "lucide-react";
import {
  parseTokensToTheme,
  type ThemeToken,
  type ParsedThemeTokens,
  recipeTypography,
  recipeElevation,
} from "./preview-theme";
import { ExperiencePreviewSection, type PreviewSectionModel } from "./ExperiencePreviewSection";
import { PreviewWidgetRegistry } from "./PreviewWidgetRegistry";
import { DecorationRenderer } from "./DecorationRenderer";
import { TirangaDripHeader } from "./TirangaDripHeader";
import type { FestivalOverlay } from "@/lib/qcos/contracts";

export interface ExperiencePreviewDocument {
  schemaVersion?: string;
  pageName?: string;
  displayName?: string;
  layoutName?: string;
  templateFamily?: string;
  themeId?: number | null;
  experienceShell?: {
    module?: string;
    themeFamily?: string;
    showDeliveryContext?: boolean;
    appearance?: {
      headerStyle?: string;
      moduleTabStyle?: string;
      searchStyle?: string;
      navigationStyle?: string;
      contentDensity?: string;
      cardStyle?: string;
      campaignMotion?: string;
    };
    menu?: Array<{
      id: string;
      labelKey: string;
      iconToken: string;
      destination: string;
    }>;
  };
  sections?: PreviewSectionModel[];
}

export interface ExperiencePreviewTheme {
  name?: string;
  tokens?: ThemeToken[] | Record<string, string>;
}

interface Props {
  experience?: ExperiencePreviewDocument | null;
  theme?: ExperiencePreviewTheme | null;
  overlay?: FestivalOverlay | null;
  previewMode?: boolean;
}

export function ExperiencePreviewRenderer({ experience, theme, overlay, previewMode = true }: Props) {
  const [activeBottomNav, setActiveBottomNav] = useState<"offers" | "orders" | "favourite" | "profile">("offers");

  // Parse theme tokens reactively from local state
  const parsedTheme: ParsedThemeTokens = useMemo(() => {
    const pt = parseTokensToTheme(theme?.tokens);
    if (overlay !== undefined) {
      pt.overlay = overlay;
    }
    return pt;
  }, [theme?.tokens, overlay]);

  // Sort sections by order
  const sortedSections = useMemo(() => {
    const rawSections = experience?.sections || [
      { id: "hero_fest_deals", name: "Hero Fest Deals", order: 0 },
      { id: "steal_deals", name: "Steal Deals", order: 1 },
      { id: "featured_offers", name: "Featured & Offers", order: 2 },
      { id: "salon_bloom", name: "Salon & Bloom", order: 3 },
      { id: "category_grids", name: "Category Grids", order: 4 },
      { id: "curated_products", name: "Curated Products", order: 5 },
      { id: "lifestyle_categories", name: "Lifestyle Categories", order: 6 },
      { id: "flash_deals", name: "Flash Deals", order: 7 },
      { id: "store_explorer", name: "Explore Stores", order: 8 },
    ];
    const list = [...rawSections].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    // Ensure Explore Stores is always appended at the bottom, matching User_app grocery_module_screen.dart
    const hasStores = list.some(
      (s) =>
        s.id === "store_explorer" ||
        s.id === "explore_stores" ||
        s.id === "store_rail" ||
        s.name?.toLowerCase().includes("explore store") ||
        s.name?.toLowerCase().includes("store explorer")
    );
    if (!hasStores) {
      list.push({ id: "store_explorer", name: "Explore Stores", order: 999 });
    }

    return list;
  }, [experience?.sections]);

  const overlayDecorations = parsedTheme.overlay?.enabled ? (parsedTheme.overlay.decorations || []) : [];

  return (
    <div
      className="flex-1 min-h-0 flex flex-col h-full relative overflow-hidden transition-colors"
      style={{
        background: parsedTheme.isDark ? parsedTheme.surface : (parsedTheme.background || "#FBF9F5"),
        color: parsedTheme.textPrimary,
      }}
    >
      {/* Global Background Festival Overlay (Watermark / Pattern) */}
      {overlayDecorations.length > 0 && (
        <DecorationRenderer
          decorations={overlayDecorations}
          placement="global_background"
          className="absolute inset-0 z-0 pointer-events-none"
        />
      )}

      {/* 1. Header with Delivery Context & Location */}
      {(() => {
        const isPatriotic = Boolean(
          parsedTheme.overlay?.enabled &&
          (parsedTheme.overlay.name.toLowerCase().includes("independence") ||
           parsedTheme.overlay.name.toLowerCase().includes("republic") ||
           parsedTheme.overlay.id.toLowerCase().includes("independence") ||
           parsedTheme.overlay.id.toLowerCase().includes("republic") ||
           parsedTheme.overlay.name.toLowerCase().includes("tiranga"))
        );

        if (isPatriotic) {
          return (
            <header className="shrink-0 px-3.5 pt-7 pb-2.5 flex items-center justify-between border-b border-orange-200/50 z-20 relative overflow-hidden min-h-[96px]">
              {/* Dripping Tiranga Paint, Ashoka Chakra & Monuments Watermark */}
              <TirangaDripHeader />

              {/* Floating Delivery Time & Location Card */}
              <div
                className="bg-white/95 backdrop-blur-md shadow-xs px-3.5 py-1.5 border border-slate-100/90 relative z-10 transition-all"
                style={{ borderRadius: `${parsedTheme.cardRadius}px` }}
              >
                <div className="flex items-center gap-1.5">
                  <Zap className="w-4 h-4 fill-rose-500 text-rose-500" />
                  <span
                    className="font-black tracking-tight"
                    style={{ ...recipeTypography(parsedTheme, "h2"), color: "#92400E" }}
                  >
                    8-10 minutes
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-0.5 text-slate-800" style={recipeTypography(parsedTheme, "caption")}>
                  <span className="text-rose-500 text-[10px]">📍</span>
                  <span className="font-bold">Unknown Location Found</span>
                  <ChevronDown className="w-3 h-3 text-slate-600" />
                </div>
              </div>

              {/* Right Wallet & Profile Floating Pills */}
              <div className="flex items-center gap-2 relative z-10">
                <div
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/95 backdrop-blur-md border border-slate-100/90 shadow-xs font-bold text-slate-800 transition-all"
                  style={{ borderRadius: `${parsedTheme.buttonRadius}px`, ...recipeTypography(parsedTheme, "caption") }}
                >
                  <span className="w-4 h-4 rounded-md text-white grid place-items-center text-[9px] font-black bg-rose-500">💳</span>
                  <span className="text-amber-800 font-extrabold">₹ 0</span>
                </div>
                <div
                  className="w-8 h-8 rounded-full bg-white/95 backdrop-blur-md grid place-items-center text-xs font-bold border border-slate-100/90 shadow-xs text-slate-700"
                >
                  <User className="w-4 h-4 text-slate-700" />
                </div>
              </div>
            </header>
          );
        }

        // Standard / Normal & Other Festivals Header
        return (
          <>
            <header
              className="shrink-0 px-4 pt-2 pb-2 flex items-center justify-between border-b z-20 transition-all relative overflow-hidden"
              style={{
                background: parsedTheme.isDark
                  ? "linear-gradient(180deg, #18181b 0%, #09090b 100%)"
                  : `linear-gradient(180deg, ${parsedTheme.background} 0%, ${parsedTheme.surfaceElevated || parsedTheme.background} 100%)`,
                borderColor: parsedTheme.isDark ? "#27272a" : "#e2e8f0",
              }}
            >
              <div>
                <div className="flex items-center gap-1.5">
                  <Zap className="w-4 h-4 transition-colors" style={{ fill: parsedTheme.primary, color: parsedTheme.primary }} />
                  <span
                    className="font-black tracking-tight transition-colors"
                    style={{ ...recipeTypography(parsedTheme, "h2"), color: parsedTheme.textPrimary }}
                  >
                    8-10 minutes
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-0.5" style={{ ...recipeTypography(parsedTheme, "caption"), color: parsedTheme.textSecondary }}>
                  <span className="font-semibold">Unknown Location Found</span>
                  <ChevronDown className="w-3 h-3" style={{ color: parsedTheme.textMuted }} />
                </div>
              </div>

              {/* Header Overlay Decoration (e.g. Flag or Festival Emblem) */}
              {overlayDecorations.length > 0 && (
                <DecorationRenderer
                  decorations={overlayDecorations}
                  placement="header"
                  className="absolute inset-y-0 right-28 flex items-center"
                />
              )}

              <div className="flex items-center gap-2 relative z-10">
                <div
                  className="flex items-center gap-1.5 px-3 py-1 border font-bold shadow-2xs transition-all"
                  style={{
                    background: parsedTheme.surface,
                    borderColor: parsedTheme.isDark ? "#3f3f46" : "#e2e8f0",
                    color: parsedTheme.textPrimary,
                    borderRadius: `${parsedTheme.buttonRadius}px`,
                    ...recipeTypography(parsedTheme, "caption"),
                  }}
                >
                  <span className="w-4 h-4 rounded-md text-white grid place-items-center text-[9px] font-black" style={{ background: parsedTheme.primary }}>💳</span>
                  <span>₹ 0</span>
                </div>
                <div
                  className="w-8 h-8 rounded-full grid place-items-center text-xs font-bold border shadow-2xs transition-all"
                  style={{
                    background: parsedTheme.surface,
                    borderColor: parsedTheme.isDark ? "#3f3f46" : "#e2e8f0",
                    color: parsedTheme.textPrimary,
                  }}
                >
                  <User className="w-4 h-4" style={{ color: parsedTheme.textSecondary }} />
                </div>
              </div>
            </header>

            {/* Harmonized Festival Multi-Color Ribbon Accent */}
            {parsedTheme.overlay?.enabled && parsedTheme.overlay.accentColors?.primary && (
              <div className="h-1.5 w-full flex shrink-0 z-20 shadow-2xs">
                <div className="flex-1" style={{ backgroundColor: parsedTheme.overlay.accentColors.primary }} />
                <div className="flex-1" style={{ backgroundColor: parsedTheme.overlay.accentColors.secondary || "#FFFFFF" }} />
                <div className="flex-1" style={{ backgroundColor: parsedTheme.overlay.accentColors.tertiary || "#138808" }} />
              </div>
            )}
          </>
        );
      })()}

      {/* 2. Top Module Selector & Search Bar */}
      <div
        className="shrink-0 px-3 py-1.5 border-b space-y-1.5 z-20 transition-all"
        style={{
          background: parsedTheme.isDark ? parsedTheme.surface : (parsedTheme.background || "#ffffff"),
          borderColor: parsedTheme.isDark ? "#27272a" : "#e2e8f0",
        }}
      >
        <PreviewWidgetRegistry
          id="top_module_selector"
          type="module_selector"
          props={{ enabledModules: ["food", "quick_commerce"] }}
          theme={parsedTheme}
        />
        <PreviewWidgetRegistry
          id="top_search_entry"
          type="search_entry"
          props={{ hintKey: "atta & more" }}
          theme={parsedTheme}
        />
      </div>

      {/* 3. Dynamic Section Stream (Only this area scrolls) */}
      <div
        className="flex-1 min-h-0 overflow-y-auto sim-scroll pb-20 flex flex-col transition-all"
        style={{
          padding: `${parsedTheme.screenPadding || parsedTheme.spacing}px`,
          gap: `${parsedTheme.sectionGap}px`,
        }}
      >
        {sortedSections.map((section) => (
          <ExperiencePreviewSection
            key={section.id}
            section={section}
            theme={parsedTheme}
          />
        ))}
      </div>

      {/* 4. Docked Customer Bottom Navigation (Always pinned at bottom of phone screen) */}
      <div
        className="shrink-0 px-4 py-2.5 backdrop-blur-md border-t z-30 transition-all"
        style={{
          background: parsedTheme.isDark ? `${parsedTheme.surface}f2` : "rgba(255, 255, 255, 0.95)",
          borderColor: parsedTheme.isDark ? "#27272a" : "#f1f5f9",
        }}
      >
        <nav
          className="h-12 border flex items-center justify-around px-2 relative transition-all"
          style={{
            background: parsedTheme.surface,
            borderColor: parsedTheme.isDark ? "#3f3f46" : "#e2e8f0",
            borderRadius: `${parsedTheme.buttonRadius * 1.5}px`,
            boxShadow: recipeElevation(parsedTheme, "floating"),
          }}
        >
          <div
            className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-white font-black shadow-xs flex items-center gap-0.5 transition-all"
            style={{
              background: parsedTheme.secondary || "#f43f5e",
              ...recipeTypography(parsedTheme, "navigation"),
            }}
          >
            <span>Offers</span>
            <span>⌃</span>
          </div>

          {[
            { id: "offers", label: "Offers", icon: Percent },
            { id: "orders", label: "Orders", icon: FileText },
            { id: "favourite", label: "Favourite", icon: Heart },
            { id: "profile", label: "Profile", icon: User },
          ].map((item) => {
            const IconComp = item.icon;
            const active = activeBottomNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveBottomNav(item.id as never)}
                className="flex flex-col items-center justify-center flex-1 transition-colors"
                style={{ color: active ? parsedTheme.primary : parsedTheme.textMuted }}
              >
                <IconComp className="w-4 h-4" />
                <span className="mt-0.5" style={recipeTypography(parsedTheme, "navigation")}>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
