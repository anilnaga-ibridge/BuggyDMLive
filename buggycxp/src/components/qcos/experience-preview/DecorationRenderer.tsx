"use client";

import React, { useState } from "react";
import type { VisualDecoration } from "@/lib/qcos/contracts";

interface Props {
  decorations?: VisualDecoration[];
  placement: VisualDecoration["placement"];
  targetSectionId?: string;
  className?: string;
  isDesktop?: boolean;
}

function getSafeAssetUrl(url: string | undefined): string | undefined {
  if (!url) return url;
  if (url.startsWith("data:image/svg+xml")) {
    try {
      const rawContent = url.replace(/^data:image\/svg\+xml[^,]*,/, "");
      // Normalize percent-encoded SVG characters to raw text, then base64 encode
      const decoded = rawContent.includes("%3C") || rawContent.includes("%3c")
        ? decodeURIComponent(rawContent)
        : rawContent;
      // Convert %23 in hex colors back to # for proper SVG parsing
      const unescapedSvg = decoded.replace(/%23/g, "#");
      if (typeof window !== "undefined" && window.btoa) {
        return `data:image/svg+xml;base64,${window.btoa(unescape(encodeURIComponent(unescapedSvg)))}`;
      }
      return `data:image/svg+xml;utf8,${encodeURIComponent(unescapedSvg)}`;
    } catch {
      return url;
    }
  }
  return url;
}

export function DecorationRenderer({
  decorations = [],
  placement,
  targetSectionId,
  className = "",
  isDesktop = false,
}: Props) {
  const [failedAssets, setFailedAssets] = useState<Record<string, boolean>>({});

  if (!decorations || decorations.length === 0) {
    return null;
  }

  // Filter decorations matching the requested placement and targeting
  const activeDecorations = decorations.filter((d) => {
    if (!d || !d.assetUrl || failedAssets[d.id]) return false;
    if (d.opacity !== undefined && d.opacity <= 0) return false;
    if (isDesktop && (d.desktop === false || d.desktopEnabled === false)) return false;
    if (!isDesktop && (d.mobile === false || d.mobileEnabled === false)) return false;

    if (d.placement !== placement) return false;
    if (targetSectionId && d.targetSectionId && d.targetSectionId !== targetSectionId) {
      return false;
    }
    return true;
  });

  if (activeDecorations.length === 0) {
    return null;
  }

  return (
    <div
      className={`pointer-events-none select-none z-10 ${className}`}
      aria-hidden="true"
    >
      {activeDecorations.map((dec) => {
        const sizeStyle: React.CSSProperties = {};
        if (dec.size === "xs") {
          sizeStyle.maxHeight = 18;
          sizeStyle.maxWidth = 26;
        } else if (dec.size === "sm" || dec.size === "small") {
          sizeStyle.maxHeight = 32;
          sizeStyle.maxWidth = 48;
        } else if (dec.size === "md" || dec.size === "medium") {
          sizeStyle.maxHeight = 52;
          sizeStyle.maxWidth = 78;
        } else if (dec.size === "lg" || dec.size === "large") {
          sizeStyle.maxHeight = 84;
          sizeStyle.maxWidth = 126;
        } else if (dec.size === "xl") {
          sizeStyle.maxHeight = 128;
          sizeStyle.maxWidth = 192;
        } else if (dec.size === "full") {
          sizeStyle.width = "100%";
          sizeStyle.height = "auto";
        } else if (dec.size === "custom") {
          if (dec.customWidth) sizeStyle.width = dec.customWidth;
          if (dec.customHeight) sizeStyle.height = dec.customHeight;
        }

        // Blend mode CSS mapping
        const blendModeMap: Record<string, React.CSSProperties["mixBlendMode"]> = {
          normal: "normal",
          subtle: "multiply",
          watermark: "luminosity",
          soft_overlay: "overlay",
          tinted: "color-burn",
        };

        // Animation CSS class
        let animClass = "";
        if (dec.animation === "fade") {
          animClass = "animate-pulse";
        } else if (dec.animation === "float") {
          animClass = "animate-bounce";
        } else if (dec.animation === "subtle_motion") {
          animClass = "transition-transform duration-700 hover:scale-105";
        }

        // Positioning
        let positionClasses = "absolute";
        if (placement === "global_background") {
          positionClasses = "absolute inset-0 flex items-center justify-center overflow-hidden";
        } else if (placement === "header") {
          positionClasses = dec.positionX === "left"
            ? "absolute left-2 top-1/2 -translate-y-1/2"
            : dec.positionX === "center"
            ? "absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2"
            : "absolute right-0 top-1/2 -translate-y-1/2";
        } else if (placement === "hero") {
          positionClasses = dec.positionX === "left"
            ? "absolute left-3 bottom-2"
            : dec.positionX === "center"
            ? "absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2"
            : "absolute right-2 bottom-2";
        } else if (placement === "section" || placement === "card" || placement === "product_card") {
          positionClasses = dec.positionX === "left"
            ? "absolute left-1.5 top-1.5"
            : dec.positionX === "center"
            ? "absolute left-1/2 -translate-x-1/2 top-0"
            : "absolute right-1.5 top-1.5";
        } else if (placement === "floating") {
          positionClasses = "absolute right-3 bottom-4 shadow-lg";
        }

        const safeUrl = getSafeAssetUrl(dec.assetUrl);

        return (
          <div
            key={dec.id}
            className={`${positionClasses} ${animClass}`}
            style={{
              opacity: dec.opacity ?? 1,
              transform: `rotate(${dec.rotation || 0}deg) scale(${dec.scale || 1})`,
              mixBlendMode: (dec.blendMode ? blendModeMap[dec.blendMode] : "normal") || "normal",
              pointerEvents: "none",
            }}
          >
            {dec.type === "ribbon" ? (
              <img
                src={safeUrl}
                alt={dec.altText || ""}
                className="w-full h-auto object-cover"
                onError={() => setFailedAssets((prev) => ({ ...prev, [dec.id]: true }))}
              />
            ) : dec.type === "watermark" || placement === "global_background" ? (
              <img
                src={safeUrl}
                alt={dec.altText || ""}
                className="max-h-[85%] max-w-[85%] object-contain"
                onError={() => setFailedAssets((prev) => ({ ...prev, [dec.id]: true }))}
              />
            ) : (
              <img
                src={safeUrl}
                alt={dec.altText || ""}
                style={sizeStyle}
                className="object-contain drop-shadow-2xs rounded-xs"
                onError={() => setFailedAssets((prev) => ({ ...prev, [dec.id]: true }))}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
