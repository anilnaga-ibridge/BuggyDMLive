"use client";

import React from "react";
import type { ParsedThemeTokens } from "./preview-theme";
import { PreviewWidgetRegistry } from "./PreviewWidgetRegistry";
import { DecorationRenderer } from "./DecorationRenderer";

export interface PreviewWidgetModel {
  id: string;
  type: string;
  version?: string;
  props?: Record<string, unknown>;
}

export interface PreviewSectionModel {
  id: string;
  name: string;
  order?: number;
  enabled?: boolean;
  visible?: boolean;
  constraints?: Record<string, unknown>;
  widgets?: PreviewWidgetModel[];
}

interface Props {
  section: PreviewSectionModel;
  theme: ParsedThemeTokens;
}

export function ExperiencePreviewSection({ section, theme }: Props) {
  // Check visibility flags
  if (section.enabled === false || section.visible === false) {
    return null;
  }

  // Primary: Always route core Quick-Commerce sections to their dedicated live simulator widgets
  const SPECIALIZED_SECTION_WIDGETS: Record<string, string> = {
    hero_fest_deals: "hero_fest_deals",
    steal_deals: "steal_deals",
    featured_offers: "featured_offers",
    salon_bloom: "salon_bloom",
    category_grids: "category_grids",
    curated_products: "curated_products",
    lifestyle_categories: "lifestyle_categories",
    flash_deals: "flash_deals",
    store_explorer: "store_explorer",
    explore_stores: "store_explorer",
    store_rail: "store_explorer",
    explore_restaurant: "store_explorer",
  };

  const overlayDecorations = theme.overlay?.enabled ? (theme.overlay.decorations || []) : [];

  if (SPECIALIZED_SECTION_WIDGETS[section.id]) {
    return (
      <section 
        className="space-y-3 relative"
        data-section-id={section.id}
        data-section-name={section.name}
      >
        {/* Section Ribbon / Cultural Decoration Overlay */}
        {overlayDecorations.length > 0 && (
          <DecorationRenderer
            decorations={overlayDecorations}
            placement="section"
            targetSectionId={section.id}
            className="w-full mb-1"
          />
        )}
        <PreviewWidgetRegistry
          id={`sec_${section.id}`}
          type={SPECIALIZED_SECTION_WIDGETS[section.id]}
          props={{ name: section.name, ...section.constraints }}
          theme={theme}
        />
      </section>
    );
  }

  // If section has dedicated widgets defined in its array, render them sequentially
  if (Array.isArray(section.widgets) && section.widgets.length > 0) {
    return (
      <section 
        className="space-y-3 relative"
        data-section-id={section.id}
        data-section-name={section.name}
      >
        {overlayDecorations.length > 0 && (
          <DecorationRenderer
            decorations={overlayDecorations}
            placement="section"
            targetSectionId={section.id}
            className="w-full mb-1"
          />
        )}
        {section.widgets.map((widget, idx) => (
          <PreviewWidgetRegistry
            key={widget.id || `${section.id}_w_${idx}`}
            id={widget.id || `${section.id}_w_${idx}`}
            type={widget.type}
            version={widget.version}
            props={widget.props}
            theme={theme}
          />
        ))}
      </section>
    );
  }

  // Otherwise, fallback to the section-level renderer mapped in the widget registry
  return (
    <section 
      className="space-y-3"
      data-section-id={section.id}
      data-section-name={section.name}
    >
      <PreviewWidgetRegistry
        id={`sec_${section.id}`}
        type={section.id}
        props={{ name: section.name, ...section.constraints }}
        theme={theme}
      />
    </section>
  );
}
