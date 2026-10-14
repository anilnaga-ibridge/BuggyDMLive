"use client";

import React from "react";
import { ExperiencePreviewRenderer, type ExperiencePreviewDocument, type ExperiencePreviewTheme } from "./experience-preview/ExperiencePreviewRenderer";
import type { FestivalOverlay } from "@/lib/qcos/contracts";

export interface SimulatorToken { token_key: string; token_value: string; category?: string }
export interface SimulatorTheme { id?: number; name: string; is_active?: boolean; tokens: SimulatorToken[] | Record<string, string> }
export interface SimulatorMedia { id: number; name: string; url: string; file_type: string; alt_text?: string }
export interface SimulatorWidget { id: string; type: string; version?: string; props?: Record<string, unknown> }
export interface SimulatorSection { id: string; name: string; order?: number; enabled?: boolean; visible?: boolean; widgets?: SimulatorWidget[] }
export interface SimulatorMenuItem { id: string; labelKey: string; iconToken: string; destination: string; params?: Record<string, unknown>; requiresCapabilities?: string[] }
export interface SimulatorAppearance { headerStyle: "immersive" | "compact" | "clean"; moduleTabStyle: "arched_cards" | "floating_cards" | "segmented"; searchStyle: "floating" | "outlined" | "embedded"; navigationStyle: "edge_bar" | "floating_dock" | "minimal"; contentDensity: "comfortable" | "compact"; cardStyle: "rounded" | "squircle" | "soft_square"; campaignMotion: "none" | "subtle" | "lively" }
export interface SimulatorShell { module: string; themeFamily: "food_dark" | "quick_commerce_mint"; showDeliveryContext: boolean; cartCompatibilityPolicy: string; nativeCartSurface: string; appearance?: SimulatorAppearance; menu: SimulatorMenuItem[] }
export interface SimulatorDocument { pageName?: string; displayName?: string; layoutName?: string; templateFamily?: string; themeId?: number | null; experienceShell?: SimulatorShell; sections?: SimulatorSection[] }

interface Props {
  document?: SimulatorDocument | null;
  theme?: SimulatorTheme | null;
  overlay?: FestivalOverlay | null;
  media?: SimulatorMedia[];
  playing?: boolean;
  sourceLabel?: string;
  viewportWidth?: number;
}

export function ExperienceSimulator({ document, theme: suppliedTheme, overlay, media: suppliedMedia, playing = true, sourceLabel, viewportWidth = 390 }: Props) {
  return (
    <div className="w-full space-y-3 font-sans" style={{ maxWidth: `${Math.max(viewportWidth + 24, 390)}px` }}>
      <style>{`
        .sim-scroll {
          overflow-y: scroll !important;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .sim-scroll::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      
      {/* Simulator Meta Header */}
      <div className="flex items-center justify-between gap-3 px-1 text-[11px] text-slate-400">
        <span className="whitespace-nowrap rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 font-bold text-emerald-400">
          Native CXP SDUI Preview
        </span>
        <span className="truncate text-right font-medium">
          {sourceLabel || "Theme Studio"} · <strong className="text-white">{suppliedTheme?.name || "Quick Fresh 2026"}</strong>
        </span>
      </div>

      {/* Phone Mockup Frame */}
      <div
        className="mx-auto flex h-[820px] max-w-full flex-col overflow-hidden rounded-[48px] border-[9px] border-[#0f172a] bg-white shadow-[0_30px_90px_rgba(0,0,0,0.6)] relative transition-all duration-300"
        style={{ width: `${viewportWidth - 12}px` }}
      >
        
        {/* iOS Status Bar */}
        <div
          className="flex h-9 shrink-0 items-center justify-between px-7 text-[11px] font-bold text-slate-900 z-20 border-b border-slate-100/60 transition-colors"
          style={{
            backgroundColor: suppliedTheme?.tokens
              ? Array.isArray(suppliedTheme.tokens)
                ? suppliedTheme.tokens.find((t) => t.token_key === "sys.color.background")?.token_value || "#ffffff"
                : suppliedTheme.tokens["sys.color.background"] || "#ffffff"
              : "#ffffff",
          }}
        >
          <span>9:41</span>
          <div className="h-3.5 w-24 rounded-full bg-black/90" />
          <div className="flex items-center gap-1.5 text-[10px]">
            <span>5G</span>
            <span>●●●</span>
            <span>▰</span>
          </div>
        </div>

        {/* Native React Experience Preview Renderer */}
        <ExperiencePreviewRenderer
          experience={document}
          theme={suppliedTheme}
          overlay={overlay}
          previewMode={true}
        />

      </div>
    </div>
  );
}
