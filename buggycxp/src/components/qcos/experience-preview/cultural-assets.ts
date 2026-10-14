/**
 * Phase 6: Culturally relevant visual assets, dynamic festival generator, and asset management.
 * Contains lightweight, high-fidelity vector/SVG assets and metadata for festivals.
 * These are data/asset definitions—no hardcoded Flutter widgets.
 * Designed to be completely dynamic: admin can configure any festival for any year.
 */

import type { FestivalOverlay, VisualDecoration } from "@/lib/qcos/contracts";

export interface CulturalAssetItem {
  id: string;
  name: string;
  category: "flag" | "historical_figure" | "ribbon" | "pattern" | "watermark" | "badge" | "symbol" | "illustration" | "background" | "icon" | "logo" | "custom";
  festival: string;
  url: string;
  altText?: string;
  previewUrl?: string;
  isCustom?: boolean;
}

// -------------------------------------------------------------
// High-Fidelity Vector Cultural SVGs
// -------------------------------------------------------------

// Indian Flag Vector SVG
export const SVG_INDIAN_FLAG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600"><rect width="900" height="200" fill="%23FF9933"/><rect y="200" width="900" height="200" fill="%23FFFFFF"/><rect y="400" width="900" height="200" fill="%23138808"/><circle cx="450" cy="300" r="70" fill="none" stroke="%23000080" stroke-width="12"/><circle cx="450" cy="300" r="14" fill="%23000080"/><g stroke="%23000080" stroke-width="4">${Array.from({ length: 24 }).map((_, i) => `<line x1="450" y1="300" x2="${(450 + 70 * Math.cos((i * 15 * Math.PI) / 180)).toFixed(1)}" y2="${(300 + 70 * Math.sin((i * 15 * Math.PI) / 180)).toFixed(1)}"/>`).join("")}</g></svg>`;

// Tricolor Decorative Ribbon Banner SVG
export const SVG_TRICOLOR_RIBBON = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 48" preserveAspectRatio="none"><defs><linearGradient id="tri" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="%23FF9933"/><stop offset="35%" stop-color="%23FF9933"/><stop offset="48%" stop-color="%23FFFFFF"/><stop offset="52%" stop-color="%23FFFFFF"/><stop offset="65%" stop-color="%23138808"/><stop offset="100%" stop-color="%23138808"/></linearGradient></defs><rect width="1200" height="6" fill="url(%23tri)"/><circle cx="600" cy="3" r="3" fill="%23000080"/></svg>`;

// Freedom Movement Ashoka Chakra Watermark SVG
export const SVG_CHAKRA_WATERMARK = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><circle cx="200" cy="200" r="180" fill="none" stroke="%23000080" stroke-width="12" stroke-opacity="0.6"/><circle cx="200" cy="200" r="28" fill="%23000080" fill-opacity="0.7"/><g stroke="%23000080" stroke-width="6" stroke-opacity="0.6">${Array.from({ length: 24 }).map((_, i) => `<line x1="200" y1="200" x2="${(200 + 180 * Math.cos((i * 15 * Math.PI) / 180)).toFixed(1)}" y2="${(200 + 180 * Math.sin((i * 15 * Math.PI) / 180)).toFixed(1)}"/>`).join("")}</g></svg>`;

// Freedom Movement Silhouette Artwork (Illustrative Heritage Silhouette)
export const SVG_FREEDOM_HERITAGE = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 300"><defs><linearGradient id="fadeG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="%23FF9933" stop-opacity="0.8"/><stop offset="50%" stop-color="%23FFFFFF" stop-opacity="0.5"/><stop offset="100%" stop-color="%23138808" stop-opacity="0.8"/></linearGradient></defs><path d="M50 250 L100 180 L130 210 L180 140 L230 220 L300 120 L360 210 L410 160 L460 250 Z" fill="url(%23fadeG)"/><circle cx="250" cy="80" r="45" fill="%23FF9933" fill-opacity="0.3"/><path d="M220 280 Q 250 240 280 280 Z" fill="%23138808" fill-opacity="0.4"/></svg>`;

// Historical Figure Artwork: Mahatma Gandhi Silhouette
export const SVG_GANDHI_SILHOUETTE = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"><circle cx="150" cy="110" r="55" fill="%23374151" fill-opacity="0.85"/><circle cx="130" cy="110" r="22" fill="none" stroke="%239CA3AF" stroke-width="4"/><circle cx="170" cy="110" r="22" fill="none" stroke="%239CA3AF" stroke-width="4"/><line x1="152" y1="110" x2="148" y2="110" stroke="%239CA3AF" stroke-width="4"/><path d="M80 270 Q 150 180 220 270 Z" fill="%23374151" fill-opacity="0.75"/><line x1="225" y1="90" x2="235" y2="280" stroke="%2378350F" stroke-width="6"/></svg>`;

// Historical Figure Artwork: Subhas Chandra Bose / INA Silhouette Badge
export const SVG_NETAJI_BADGE = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"><circle cx="150" cy="150" r="135" fill="%231E3A8A" fill-opacity="0.1" stroke="%231E3A8A" stroke-width="8"/><circle cx="150" cy="120" r="45" fill="%231E3A8A" fill-opacity="0.85"/><ellipse cx="150" cy="85" rx="55" ry="18" fill="%231E3A8A"/><path d="M90 260 Q 150 180 210 260 Z" fill="%231E3A8A" fill-opacity="0.8"/><text x="150" y="285" font-size="22" font-weight="bold" fill="%23B45309" text-anchor="middle" font-family="sans-serif">JAI HIND</text></svg>`;

// Historical Figure Artwork: Bhagat Singh / Freedom Fighter Silhouette
export const SVG_BHAGAT_SINGH_BADGE = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"><circle cx="150" cy="150" r="135" fill="%2378350F" fill-opacity="0.08" stroke="%23B45309" stroke-width="8"/><ellipse cx="150" cy="95" rx="65" ry="22" fill="%23451A03"/><circle cx="150" cy="125" r="40" fill="%2378350F" fill-opacity="0.9"/><path d="M135 145 Q 150 155 165 145" stroke="%23451A03" stroke-width="8" stroke-linecap="round"/><path d="M95 260 Q 150 190 205 260 Z" fill="%2378350F" fill-opacity="0.8"/><text x="150" y="285" font-size="20" font-weight="900" fill="%23B45309" text-anchor="middle" font-family="sans-serif">INQUILAB</text></svg>`;

// Historical Figure Artwork: Sardar Vallabhbhai Patel (Iron Man of India) Badge
export const SVG_SARDAR_PATEL_BADGE = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"><circle cx="150" cy="150" r="135" fill="%239A3412" fill-opacity="0.08" stroke="%23C2410C" stroke-width="8"/><circle cx="150" cy="120" r="46" fill="%239A3412" fill-opacity="0.85"/><path d="M85 260 Q 150 185 215 260 Z" fill="%239A3412" fill-opacity="0.8"/><path d="M110 220 Q 150 250 190 220" stroke="%23FED7AA" stroke-width="12" fill="none"/><text x="150" y="285" font-size="20" font-weight="bold" fill="%23C2410C" text-anchor="middle" font-family="sans-serif">UNITY</text></svg>`;

// Diwali Diya Lamp Vector SVG
export const SVG_DIWALI_DIYA = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"><defs><radialGradient id="flame" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="%23FFFBEB"/><stop offset="30%" stop-color="%23FBBF24"/><stop offset="80%" stop-color="%23EA580C"/><stop offset="100%" stop-color="%23DC2626"/></radialGradient></defs><path d="M150 30 C 130 90, 115 130, 150 160 C 185 130, 170 90, 150 30 Z" fill="url(%23flame)"/><path d="M60 170 Q 150 150 240 170 C 230 240, 70 240, 60 170 Z" fill="%23B45309" stroke="%2378350F" stroke-width="6"/><ellipse cx="150" cy="170" rx="90" ry="16" fill="%23D97706"/><circle cx="150" cy="95" r="70" fill="%23FEF08A" fill-opacity="0.25"/></svg>`;

// Rangoli Pattern Vector SVG
export const SVG_RANGOLI_PATTERN = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><g fill="none" stroke="%23F59E0B" stroke-width="3" stroke-opacity="0.6">${Array.from({ length: 8 }).map((_, i) => `<ellipse cx="200" cy="200" rx="140" ry="60" transform="rotate(${i * 22.5} 200 200)"/>`).join("")}</g><circle cx="200" cy="200" r="30" fill="%23DC2626" fill-opacity="0.4"/></svg>`;

// Republic Day Ashoka Lion Emblem Badge
export const SVG_REPUBLIC_DAY_EMBLEM = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"><circle cx="150" cy="150" r="140" fill="%231E3A8A" fill-opacity="0.06" stroke="%23000080" stroke-width="8"/><circle cx="150" cy="150" r="75" fill="none" stroke="%23000080" stroke-width="8"/><circle cx="150" cy="150" r="14" fill="%23000080"/><g stroke="%23000080" stroke-width="3">${Array.from({ length: 24 }).map((_, i) => `<line x1="150" y1="150" x2="${(150 + 75 * Math.cos((i * 15 * Math.PI) / 180)).toFixed(1)}" y2="${(150 + 75 * Math.sin((i * 15 * Math.PI) / 180)).toFixed(1)}"/>`).join("")}</g><text x="150" y="275" font-size="18" font-weight="bold" fill="%23000080" text-anchor="middle" font-family="sans-serif">SATYAMEVA JAYATE</text></svg>`;

// Holi Color Gulal Splash SVG
export const SVG_HOLI_SPLASH = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><defs><radialGradient id="pinkG" cx="40%" cy="40%" r="50%"><stop offset="0%" stop-color="%23F43F5E"/><stop offset="100%" stop-color="%23BE123C" stop-opacity="0.8"/></radialGradient><radialGradient id="yelG" cx="60%" cy="50%" r="50%"><stop offset="0%" stop-color="%23FACC15"/><stop offset="100%" stop-color="%23CA8A04" stop-opacity="0.8"/></radialGradient><radialGradient id="cyanG" cx="50%" cy="60%" r="50%"><stop offset="0%" stop-color="%2306B6D4"/><stop offset="100%" stop-color="%230891B2" stop-opacity="0.8"/></radialGradient></defs><circle cx="150" cy="130" r="75" fill="url(%23pinkG)"/><circle cx="250" cy="140" r="65" fill="url(%23yelG)"/><circle cx="200" cy="190" r="55" fill="url(%23cyanG)"/><circle cx="100" cy="90" r="18" fill="%23F43F5E"/><circle cx="310" cy="110" r="22" fill="%23FACC15"/><circle cx="270" cy="240" r="16" fill="%2306B6D4"/><circle cx="120" cy="220" r="14" fill="%23A855F7"/></svg>`;

// Eid Crescent Moon & Star Vector SVG
export const SVG_EID_CRESCENT = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"><defs><linearGradient id="goldM" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%23FDE047"/><stop offset="50%" stop-color="%23EAB308"/><stop offset="100%" stop-color="%23CA8A04"/></linearGradient></defs><path d="M160 50 A 100 100 0 1 0 240 210 A 85 85 0 1 1 160 50 Z" fill="url(%23goldM)" stroke="%23B45309" stroke-width="2"/><polygon points="205,100 212,122 235,122 217,135 224,157 205,143 186,157 193,135 175,122 198,122" fill="url(%23goldM)"/></svg>`;

// Christmas Festive Bells with Holly Vector SVG
export const SVG_CHRISTMAS_BELLS = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"><defs><linearGradient id="goldB" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="%23FEF08A"/><stop offset="100%" stop-color="%23D97706"/></linearGradient></defs><path d="M130 90 C130 60, 90 60, 90 90 L80 150 C70 170, 60 180, 110 180 C160 180, 150 170, 140 150 Z" fill="url(%23goldB)" stroke="%23B45309" stroke-width="3"/><path d="M210 100 C210 70, 170 70, 170 100 L160 160 C150 180, 140 190, 190 190 C240 190, 230 180, 220 160 Z" fill="url(%23goldB)" stroke="%23B45309" stroke-width="3"/><circle cx="150" cy="70" r="16" fill="%23DC2626"/><circle cx="134" cy="80" r="14" fill="%23DC2626"/><circle cx="166" cy="80" r="14" fill="%23DC2626"/><path d="M120 60 Q100 30 130 40 Q150 30 140 60 Z" fill="%2315803D"/><path d="M180 60 Q200 30 170 40 Q150 30 160 60 Z" fill="%2315803D"/></svg>`;

// New Year Celebration Fireworks Vector SVG
export const SVG_NEW_YEAR_FIREWORKS = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"><defs><radialGradient id="starF" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="%23FFFFFF"/><stop offset="30%" stop-color="%23FDE047"/><stop offset="80%" stop-color="%23F97316"/><stop offset="100%" stop-color="%23DC2626" stop-opacity="0"/></radialGradient></defs><circle cx="150" cy="150" r="80" fill="url(%23starF)"/><g stroke="%23FACC15" stroke-width="3" stroke-linecap="round">${Array.from({ length: 16 }).map((_, i) => `<line x1="150" y1="150" x2="${(150 + (i % 2 === 0 ? 110 : 70) * Math.cos((i * 22.5 * Math.PI) / 180)).toFixed(1)}" y2="${(150 + (i % 2 === 0 ? 110 : 70) * Math.sin((i * 22.5 * Math.PI) / 180)).toFixed(1)}"/>`).join("")}</g><circle cx="150" cy="150" r="12" fill="%23FFFFFF"/></svg>`;

// Sankranti & Pongal Festive Kite Vector SVG
export const SVG_SANKRANTI_KITE = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"><polygon points="150,30 250,150 150,230 50,150" fill="%23F59E0B" stroke="%23B45309" stroke-width="4"/><path d="M50 150 Q150 80 250 150" fill="none" stroke="%23DC2626" stroke-width="5"/><line x1="150" y1="30" x2="150" y2="230" stroke="%23B45309" stroke-width="4"/><polygon points="150,230 180,270 120,270" fill="%2310B981"/></svg>`;

// -------------------------------------------------------------
// Standard Cultural Asset Registry
// -------------------------------------------------------------
export const STANDARD_CULTURAL_ASSETS: CulturalAssetItem[] = [
  {
    id: "asset_flag_india",
    name: "Indian Flag (Tiranga)",
    category: "flag",
    festival: "independence_day",
    url: SVG_INDIAN_FLAG,
    previewUrl: SVG_INDIAN_FLAG,
    altText: "Flag of India",
  },
  {
    id: "asset_tricolor_ribbon",
    name: "Tricolor Decorative Ribbon",
    category: "ribbon",
    festival: "independence_day",
    url: SVG_TRICOLOR_RIBBON,
    previewUrl: SVG_TRICOLOR_RIBBON,
    altText: "Tricolor Ribbon Accent",
  },
  {
    id: "asset_chakra_watermark",
    name: "Ashoka Chakra Watermark",
    category: "watermark",
    festival: "independence_day",
    url: SVG_CHAKRA_WATERMARK,
    previewUrl: SVG_CHAKRA_WATERMARK,
    altText: "Ashoka Chakra Emblem",
  },
  {
    id: "asset_freedom_heritage",
    name: "Freedom Movement Artwork",
    category: "pattern",
    festival: "independence_day",
    url: SVG_FREEDOM_HERITAGE,
    previewUrl: SVG_FREEDOM_HERITAGE,
    altText: "Freedom Movement Illustrative Heritage",
  },
  {
    id: "asset_gandhi",
    name: "Mahatma Gandhi Heritage",
    category: "historical_figure",
    festival: "gandhi_jayanti",
    url: SVG_GANDHI_SILHOUETTE,
    previewUrl: SVG_GANDHI_SILHOUETTE,
    altText: "Mahatma Gandhi Artwork",
  },
  {
    id: "asset_bhagat_singh",
    name: "Bhagat Singh Heritage",
    category: "historical_figure",
    festival: "independence_day",
    url: SVG_BHAGAT_SINGH_BADGE,
    previewUrl: SVG_BHAGAT_SINGH_BADGE,
    altText: "Bhagat Singh Artwork",
  },
  {
    id: "asset_netaji",
    name: "Subhas Chandra Bose Heritage",
    category: "historical_figure",
    festival: "independence_day",
    url: SVG_NETAJI_BADGE,
    previewUrl: SVG_NETAJI_BADGE,
    altText: "Netaji Subhas Chandra Bose Artwork",
  },
  {
    id: "asset_sardar_patel",
    name: "Sardar Vallabhbhai Patel",
    category: "historical_figure",
    festival: "independence_day",
    url: SVG_SARDAR_PATEL_BADGE,
    previewUrl: SVG_SARDAR_PATEL_BADGE,
    altText: "Sardar Vallabhbhai Patel Artwork",
  },
  {
    id: "asset_diwali_diya",
    name: "Diya Flame Lamp",
    category: "symbol",
    festival: "diwali",
    url: SVG_DIWALI_DIYA,
    previewUrl: SVG_DIWALI_DIYA,
    altText: "Diwali Diya Lamp",
  },
  {
    id: "asset_rangoli_pattern",
    name: "Rangoli Festive Pattern",
    category: "pattern",
    festival: "diwali",
    url: SVG_RANGOLI_PATTERN,
    previewUrl: SVG_RANGOLI_PATTERN,
    altText: "Rangoli Geometry Pattern",
  },
  {
    id: "asset_republic_day_emblem",
    name: "Republic Day Ashoka Emblem",
    category: "badge",
    festival: "republic_day",
    url: SVG_REPUBLIC_DAY_EMBLEM,
    previewUrl: SVG_REPUBLIC_DAY_EMBLEM,
    altText: "Ashoka Pillar Emblem",
  },
  {
    id: "asset_holi_splash",
    name: "Holi Gulal Colors Splash",
    category: "illustration",
    festival: "holi",
    url: SVG_HOLI_SPLASH,
    previewUrl: SVG_HOLI_SPLASH,
    altText: "Holi Colors Splash",
  },
  {
    id: "asset_eid_crescent",
    name: "Eid Golden Crescent Moon & Star",
    category: "symbol",
    festival: "eid",
    url: SVG_EID_CRESCENT,
    previewUrl: SVG_EID_CRESCENT,
    altText: "Eid Mubarak Crescent",
  },
  {
    id: "asset_christmas_bells",
    name: "Christmas Bells & Holly",
    category: "badge",
    festival: "christmas",
    url: SVG_CHRISTMAS_BELLS,
    previewUrl: SVG_CHRISTMAS_BELLS,
    altText: "Christmas Bells",
  },
  {
    id: "asset_new_year_fireworks",
    name: "New Year Fireworks Burst",
    category: "illustration",
    festival: "new_year",
    url: SVG_NEW_YEAR_FIREWORKS,
    previewUrl: SVG_NEW_YEAR_FIREWORKS,
    altText: "New Year Celebration Fireworks",
  },
  {
    id: "asset_sankranti_kite",
    name: "Sankranti / Pongal Kite",
    category: "symbol",
    festival: "sankranti",
    url: SVG_SANKRANTI_KITE,
    previewUrl: SVG_SANKRANTI_KITE,
    altText: "Sankranti Festival Kite",
  },
];

// -------------------------------------------------------------
// Dynamic Custom Assets Storage (Local + Token Shared)
// -------------------------------------------------------------
const STORAGE_KEY_CUSTOM_ASSETS = "buggy_custom_cultural_assets";

export function loadCustomCulturalAssets(): CulturalAssetItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOM_ASSETS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCustomCulturalAsset(asset: CulturalAssetItem): CulturalAssetItem[] {
  if (typeof window === "undefined") return [];
  try {
    const current = loadCustomCulturalAssets().filter((a) => a.id !== asset.id);
    const updated = [{ ...asset, isCustom: true }, ...current];
    localStorage.setItem(STORAGE_KEY_CUSTOM_ASSETS, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function deleteCustomCulturalAsset(assetId: string): CulturalAssetItem[] {
  if (typeof window === "undefined") return [];
  try {
    const current = loadCustomCulturalAssets().filter((a) => a.id !== assetId);
    localStorage.setItem(STORAGE_KEY_CUSTOM_ASSETS, JSON.stringify(current));
    return current;
  } catch {
    return [];
  }
}

export function getAllCulturalAssets(): CulturalAssetItem[] {
  const custom = loadCustomCulturalAssets();
  return [...custom, ...STANDARD_CULTURAL_ASSETS];
}

// -------------------------------------------------------------
// Dynamic Festival Catalog & Generator
// Supports ANY festival for ANY year dynamically
// -------------------------------------------------------------
export interface FestivalCatalogEntry {
  key: string;
  name: string;
  emoji: string;
  description: string;
  defaultAccentColors: { primary: string; secondary: string; tertiary: string };
  getDateRange: (year: number) => { startDate: string; startTime: string; endDate: string; endTime: string };
  buildDecorations: (year: number) => VisualDecoration[];
}

export const FESTIVAL_CATALOG: FestivalCatalogEntry[] = [
  {
    key: "independence_day",
    name: "Independence Day",
    emoji: "🇮🇳",
    description: "Indian Independence Day cultural visual overlay with Tiranga, Freedom Movement artwork, and patriotic badges.",
    defaultAccentColors: { primary: "#FF9933", secondary: "#FFFFFF", tertiary: "#138808" },
    getDateRange: (year) => ({
      startDate: `${year}-08-15`,
      startTime: "00:00",
      endDate: `${year}-08-16`,
      endTime: "23:59",
    }),
    buildDecorations: (year) => [
      {
        id: `dec_header_flag_${year}`,
        name: `Header Indian Flag ${year}`,
        type: "flag",
        placement: "header",
        assetUrl: SVG_INDIAN_FLAG,
        opacity: 1.0,
        scale: 1.0,
        size: "sm",
        positionX: "right",
        positionY: "center",
        mobileEnabled: true,
        desktopEnabled: true,
        decorative: true,
        altText: "Tiranga Flag",
      },
      {
        id: `dec_hero_artwork_${year}`,
        name: "Freedom Movement Heritage Artwork",
        type: "illustration",
        placement: "hero",
        assetUrl: SVG_FREEDOM_HERITAGE,
        opacity: 0.15,
        blendMode: "soft-overlay",
        size: "lg",
        positionX: "center",
        positionY: "center",
        mobileEnabled: true,
        desktopEnabled: true,
        decorative: true,
      },
      {
        id: `dec_hero_figure_${year}`,
        name: "Historical Freedom Artwork",
        type: "illustration",
        placement: "hero",
        assetUrl: SVG_NETAJI_BADGE,
        opacity: 0.12,
        blendMode: "watermark",
        size: "md",
        positionX: "right",
        positionY: "bottom",
        mobileEnabled: true,
        desktopEnabled: true,
        decorative: true,
        altText: "Netaji Artwork",
      },
      {
        id: `dec_section_ribbon_${year}`,
        name: "Tricolor Ribbon Accent",
        type: "ribbon",
        placement: "section",
        assetUrl: SVG_TRICOLOR_RIBBON,
        opacity: 0.8,
        size: "full",
        positionX: "center",
        positionY: "top",
        mobileEnabled: true,
        desktopEnabled: true,
        decorative: true,
      },
      {
        id: `dec_card_badge_${year}`,
        name: "Small Flag Product Badge",
        type: "badge",
        placement: "product_card",
        assetUrl: SVG_INDIAN_FLAG,
        opacity: 1.0,
        size: "sm",
        scale: 0.85,
        positionX: "right",
        positionY: "top",
        mobileEnabled: true,
        desktopEnabled: true,
        decorative: true,
        altText: "Indian Flag Badge",
      },
      {
        id: `dec_bg_watermark_${year}`,
        name: "Historical Ashoka Chakra Watermark",
        type: "watermark",
        placement: "global_background",
        assetUrl: SVG_CHAKRA_WATERMARK,
        opacity: 0.05,
        blendMode: "subtle",
        size: "lg",
        positionX: "center",
        positionY: "top",
        rotation: 15,
        mobileEnabled: true,
        desktopEnabled: true,
        decorative: true,
      },
    ],
  },
  {
    key: "republic_day",
    name: "Republic Day",
    emoji: "🏛️",
    description: "Honoring the Constitution of India with national emblems and tricolor visual accents.",
    defaultAccentColors: { primary: "#FF9933", secondary: "#000080", tertiary: "#138808" },
    getDateRange: (year) => ({
      startDate: `${year}-01-26`,
      startTime: "00:00",
      endDate: `${year}-01-27`,
      endTime: "23:59",
    }),
    buildDecorations: (year) => [
      {
        id: `dec_rep_header_flag_${year}`,
        name: "Header Republic Flag",
        type: "flag",
        placement: "header",
        assetUrl: SVG_INDIAN_FLAG,
        opacity: 1.0,
        size: "sm",
        positionX: "right",
        positionY: "center",
        mobileEnabled: true,
        desktopEnabled: true,
        decorative: true,
      },
      {
        id: `dec_rep_hero_emblem_${year}`,
        name: "Hero Ashoka Emblem",
        type: "badge",
        placement: "hero",
        assetUrl: SVG_REPUBLIC_DAY_EMBLEM,
        opacity: 0.16,
        blendMode: "soft-overlay",
        size: "lg",
        positionX: "center",
        positionY: "center",
        mobileEnabled: true,
        desktopEnabled: true,
        decorative: true,
      },
      {
        id: `dec_rep_ribbon_${year}`,
        name: "Tricolor Ribbon Border",
        type: "ribbon",
        placement: "section",
        assetUrl: SVG_TRICOLOR_RIBBON,
        opacity: 0.85,
        size: "full",
        positionX: "center",
        positionY: "top",
        mobileEnabled: true,
        desktopEnabled: true,
        decorative: true,
      },
      {
        id: `dec_rep_card_badge_${year}`,
        name: "Product Card Flag Badge",
        type: "badge",
        placement: "product_card",
        assetUrl: SVG_INDIAN_FLAG,
        opacity: 1.0,
        size: "sm",
        scale: 0.8,
        positionX: "right",
        positionY: "top",
        mobileEnabled: true,
        desktopEnabled: true,
        decorative: true,
      },
    ],
  },
  {
    key: "gandhi_jayanti",
    name: "Gandhi Jayanti",
    emoji: "🕊️",
    description: "Commemorating Mahatma Gandhi with peaceful heritage silhouette and inspirational symbols.",
    defaultAccentColors: { primary: "#78350F", secondary: "#F3F4F6", tertiary: "#15803D" },
    getDateRange: (year) => ({
      startDate: `${year}-10-02`,
      startTime: "00:00",
      endDate: `${year}-10-03`,
      endTime: "23:59",
    }),
    buildDecorations: (year) => [
      {
        id: `dec_gandhi_hero_${year}`,
        name: "Mahatma Gandhi Heritage Silhouette",
        type: "illustration",
        placement: "hero",
        assetUrl: SVG_GANDHI_SILHOUETTE,
        opacity: 0.15,
        blendMode: "soft-overlay",
        size: "lg",
        positionX: "right",
        positionY: "center",
        mobileEnabled: true,
        desktopEnabled: true,
        decorative: true,
      },
      {
        id: `dec_gandhi_bg_${year}`,
        name: "Ashoka Chakra Peaceful Watermark",
        type: "watermark",
        placement: "global_background",
        assetUrl: SVG_CHAKRA_WATERMARK,
        opacity: 0.05,
        blendMode: "subtle",
        size: "lg",
        positionX: "center",
        positionY: "top",
        mobileEnabled: true,
        desktopEnabled: true,
        decorative: true,
      },
    ],
  },
  {
    key: "diwali",
    name: "Diwali (Festival of Lights)",
    emoji: "🪔",
    description: "Luminous festive theme with glowing Diyas and Rangoli patterns.",
    defaultAccentColors: { primary: "#F59E0B", secondary: "#DC2626", tertiary: "#FEF08A" },
    getDateRange: (year) => ({
      startDate: `${year}-10-28`,
      startTime: "00:00",
      endDate: `${year}-11-03`,
      endTime: "23:59",
    }),
    buildDecorations: (year) => [
      {
        id: `dec_diwali_header_${year}`,
        name: "Header Glowing Diya",
        type: "badge",
        placement: "header",
        assetUrl: SVG_DIWALI_DIYA,
        opacity: 1.0,
        size: "sm",
        positionX: "right",
        positionY: "center",
        animation: "float",
        mobileEnabled: true,
        desktopEnabled: true,
        decorative: true,
      },
      {
        id: `dec_diwali_hero_${year}`,
        name: "Hero Festive Rangoli",
        type: "pattern",
        placement: "hero",
        assetUrl: SVG_RANGOLI_PATTERN,
        opacity: 0.2,
        blendMode: "soft-overlay",
        size: "lg",
        positionX: "right",
        positionY: "center",
        mobileEnabled: true,
        desktopEnabled: true,
        decorative: true,
      },
      {
        id: `dec_diwali_card_${year}`,
        name: "Product Card Corner Diya",
        type: "corner_decoration",
        placement: "product_card",
        assetUrl: SVG_DIWALI_DIYA,
        opacity: 0.95,
        size: "sm",
        scale: 0.8,
        positionX: "right",
        positionY: "top",
        mobileEnabled: true,
        desktopEnabled: true,
        decorative: true,
      },
      {
        id: `dec_diwali_bg_${year}`,
        name: "Background Rangoli Watermark",
        type: "watermark",
        placement: "global_background",
        assetUrl: SVG_RANGOLI_PATTERN,
        opacity: 0.05,
        blendMode: "subtle",
        size: "lg",
        positionX: "center",
        positionY: "top",
        mobileEnabled: true,
        desktopEnabled: true,
        decorative: true,
      },
    ],
  },
  {
    key: "holi",
    name: "Holi (Festival of Colors)",
    emoji: "🎨",
    description: "Vibrant and cheerful theme filled with festive color splashes and joy.",
    defaultAccentColors: { primary: "#EC4899", secondary: "#EAB308", tertiary: "#06B6D4" },
    getDateRange: (year) => ({
      startDate: `${year}-03-12`,
      startTime: "00:00",
      endDate: `${year}-03-16`,
      endTime: "23:59",
    }),
    buildDecorations: (year) => [
      {
        id: `dec_holi_hero_${year}`,
        name: "Hero Color Splash",
        type: "illustration",
        placement: "hero",
        assetUrl: SVG_HOLI_SPLASH,
        opacity: 0.25,
        blendMode: "soft-overlay",
        size: "lg",
        positionX: "right",
        positionY: "center",
        animation: "fade",
        mobileEnabled: true,
        desktopEnabled: true,
        decorative: true,
      },
      {
        id: `dec_holi_header_${year}`,
        name: "Header Splash Badge",
        type: "badge",
        placement: "header",
        assetUrl: SVG_HOLI_SPLASH,
        opacity: 0.9,
        size: "sm",
        scale: 0.9,
        positionX: "right",
        positionY: "center",
        mobileEnabled: true,
        desktopEnabled: true,
        decorative: true,
      },
      {
        id: `dec_holi_card_${year}`,
        name: "Product Card Color Dot",
        type: "corner_decoration",
        placement: "product_card",
        assetUrl: SVG_HOLI_SPLASH,
        opacity: 0.85,
        size: "xs",
        scale: 0.75,
        positionX: "right",
        positionY: "top",
        mobileEnabled: true,
        desktopEnabled: true,
        decorative: true,
      },
    ],
  },
  {
    key: "sankranti",
    name: "Sankranti / Pongal",
    emoji: "🪁",
    description: "Harvest celebration visual overlay with vibrant festive kites and festive accents.",
    defaultAccentColors: { primary: "#F59E0B", secondary: "#DC2626", tertiary: "#10B981" },
    getDateRange: (year) => ({
      startDate: `${year}-01-14`,
      startTime: "00:00",
      endDate: `${year}-01-16`,
      endTime: "23:59",
    }),
    buildDecorations: (year) => [
      {
        id: `dec_sankranti_header_${year}`,
        name: "Header Kite Badge",
        type: "badge",
        placement: "header",
        assetUrl: SVG_SANKRANTI_KITE,
        opacity: 1.0,
        size: "sm",
        positionX: "right",
        positionY: "center",
        animation: "float",
        mobileEnabled: true,
        desktopEnabled: true,
        decorative: true,
      },
      {
        id: `dec_sankranti_hero_${year}`,
        name: "Hero Sky Kite",
        type: "illustration",
        placement: "hero",
        assetUrl: SVG_SANKRANTI_KITE,
        opacity: 0.22,
        blendMode: "soft-overlay",
        size: "md",
        positionX: "right",
        positionY: "top",
        mobileEnabled: true,
        desktopEnabled: true,
        decorative: true,
      },
      {
        id: `dec_sankranti_card_${year}`,
        name: "Product Card Kite Badge",
        type: "badge",
        placement: "product_card",
        assetUrl: SVG_SANKRANTI_KITE,
        opacity: 0.95,
        size: "sm",
        scale: 0.75,
        positionX: "right",
        positionY: "top",
        mobileEnabled: true,
        desktopEnabled: true,
        decorative: true,
      },
    ],
  },
  {
    key: "eid",
    name: "Eid-ul-Fitr / Eid Mubarak",
    emoji: "🌙",
    description: "Golden crescent moon and luminous festive overlays for festive joy.",
    defaultAccentColors: { primary: "#047857", secondary: "#EAB308", tertiary: "#FDE047" },
    getDateRange: (year) => ({
      startDate: `${year}-04-09`,
      startTime: "00:00",
      endDate: `${year}-04-12`,
      endTime: "23:59",
    }),
    buildDecorations: (year) => [
      {
        id: `dec_eid_header_${year}`,
        name: "Header Crescent Badge",
        type: "badge",
        placement: "header",
        assetUrl: SVG_EID_CRESCENT,
        opacity: 1.0,
        size: "sm",
        positionX: "right",
        positionY: "center",
        animation: "float",
        mobileEnabled: true,
        desktopEnabled: true,
        decorative: true,
      },
      {
        id: `dec_eid_hero_${year}`,
        name: "Hero Golden Crescent Artwork",
        type: "illustration",
        placement: "hero",
        assetUrl: SVG_EID_CRESCENT,
        opacity: 0.18,
        blendMode: "soft-overlay",
        size: "lg",
        positionX: "right",
        positionY: "center",
        mobileEnabled: true,
        desktopEnabled: true,
        decorative: true,
      },
      {
        id: `dec_eid_card_${year}`,
        name: "Product Card Crescent",
        type: "corner_decoration",
        placement: "product_card",
        assetUrl: SVG_EID_CRESCENT,
        opacity: 0.9,
        size: "sm",
        scale: 0.75,
        positionX: "right",
        positionY: "top",
        mobileEnabled: true,
        desktopEnabled: true,
        decorative: true,
      },
    ],
  },
  {
    key: "christmas",
    name: "Christmas Celebration",
    emoji: "🎄",
    description: "Warm festive holiday theme with golden bells, holly, and winter joy.",
    defaultAccentColors: { primary: "#DC2626", secondary: "#15803D", tertiary: "#FEF08A" },
    getDateRange: (year) => ({
      startDate: `${year}-12-24`,
      startTime: "00:00",
      endDate: `${year}-12-26`,
      endTime: "23:59",
    }),
    buildDecorations: (year) => [
      {
        id: `dec_xmas_header_${year}`,
        name: "Header Christmas Bells",
        type: "badge",
        placement: "header",
        assetUrl: SVG_CHRISTMAS_BELLS,
        opacity: 1.0,
        size: "sm",
        positionX: "right",
        positionY: "center",
        animation: "float",
        mobileEnabled: true,
        desktopEnabled: true,
        decorative: true,
      },
      {
        id: `dec_xmas_hero_${year}`,
        name: "Hero Holiday Bells Artwork",
        type: "illustration",
        placement: "hero",
        assetUrl: SVG_CHRISTMAS_BELLS,
        opacity: 0.18,
        blendMode: "soft-overlay",
        size: "lg",
        positionX: "right",
        positionY: "center",
        mobileEnabled: true,
        desktopEnabled: true,
        decorative: true,
      },
      {
        id: `dec_xmas_card_${year}`,
        name: "Product Card Bells Badge",
        type: "corner_decoration",
        placement: "product_card",
        assetUrl: SVG_CHRISTMAS_BELLS,
        opacity: 0.95,
        size: "sm",
        scale: 0.8,
        positionX: "right",
        positionY: "top",
        mobileEnabled: true,
        desktopEnabled: true,
        decorative: true,
      },
    ],
  },
  {
    key: "new_year",
    name: "New Year Bash",
    emoji: "🎆",
    description: "Exciting countdown and celebration fireworks visual overlay.",
    defaultAccentColors: { primary: "#7C3AED", secondary: "#FACC15", tertiary: "#EC4899" },
    getDateRange: (year) => ({
      startDate: `${year - 1}-12-31`,
      startTime: "18:00",
      endDate: `${year}-01-02`,
      endTime: "23:59",
    }),
    buildDecorations: (year) => [
      {
        id: `dec_ny_header_${year}`,
        name: "Header Fireworks Burst",
        type: "badge",
        placement: "header",
        assetUrl: SVG_NEW_YEAR_FIREWORKS,
        opacity: 1.0,
        size: "sm",
        positionX: "right",
        positionY: "center",
        animation: "float",
        mobileEnabled: true,
        desktopEnabled: true,
        decorative: true,
      },
      {
        id: `dec_ny_hero_${year}`,
        name: "Hero Fireworks Display",
        type: "illustration",
        placement: "hero",
        assetUrl: SVG_NEW_YEAR_FIREWORKS,
        opacity: 0.22,
        blendMode: "soft-overlay",
        size: "lg",
        positionX: "center",
        positionY: "center",
        animation: "fade",
        mobileEnabled: true,
        desktopEnabled: true,
        decorative: true,
      },
      {
        id: `dec_ny_card_${year}`,
        name: "Product Card Sparkle",
        type: "corner_decoration",
        placement: "product_card",
        assetUrl: SVG_NEW_YEAR_FIREWORKS,
        opacity: 0.9,
        size: "sm",
        scale: 0.75,
        positionX: "right",
        positionY: "top",
        mobileEnabled: true,
        desktopEnabled: true,
        decorative: true,
      },
    ],
  },
  {
    key: "custom",
    name: "Custom Campaign / Festival",
    emoji: "✨",
    description: "Fully customizable visual overlay for any local festival, anniversary, or promotional event.",
    defaultAccentColors: { primary: "#6366F1", secondary: "#A855F7", tertiary: "#EC4899" },
    getDateRange: (year) => ({
      startDate: `${year}-01-01`,
      startTime: "00:00",
      endDate: `${year}-01-07`,
      endTime: "23:59",
    }),
    buildDecorations: (year) => [
      {
        id: `dec_custom_header_${year}`,
        name: "Header Campaign Badge",
        type: "badge",
        placement: "header",
        assetUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"><polygon points="150,30 182,120 280,120 205,175 232,265 150,210 68,265 95,175 20,120 118,120" fill="%236366F1" stroke="%234F46E5" stroke-width="6"/></svg>`,
        opacity: 1.0,
        size: "sm",
        positionX: "right",
        positionY: "center",
        mobileEnabled: true,
        desktopEnabled: true,
        decorative: true,
      },
      {
        id: `dec_custom_hero_${year}`,
        name: "Hero Campaign Artwork",
        type: "illustration",
        placement: "hero",
        assetUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><circle cx="200" cy="150" r="100" fill="none" stroke="%236366F1" stroke-width="8" stroke-dasharray="20 10" opacity="0.4"/><circle cx="200" cy="150" r="60" fill="none" stroke="%23A855F7" stroke-width="6" stroke-dasharray="15 8" opacity="0.35"/><circle cx="200" cy="150" r="20" fill="%23EC4899" fill-opacity="0.4"/><circle cx="80" cy="60" r="12" fill="%236366F1" fill-opacity="0.3"/><circle cx="320" cy="80" r="10" fill="%23A855F7" fill-opacity="0.3"/><circle cx="100" cy="240" r="14" fill="%23EC4899" fill-opacity="0.25"/><circle cx="300" cy="230" r="8" fill="%236366F1" fill-opacity="0.25"/></svg>`,
        opacity: 0.2,
        blendMode: "soft-overlay",
        size: "lg",
        positionX: "center",
        positionY: "center",
        mobileEnabled: true,
        desktopEnabled: true,
        decorative: true,
      },
    ],
  },
];

/**
 * Dynamically generates a complete FestivalOverlay for ANY festival and ANY year.
 * Allows the admin to configure festivals dynamically every year without manual hardcoding.
 */
export function createDynamicFestivalOverlay(
  festivalKey: string,
  year: number = new Date().getFullYear(),
  options?: { activeToday?: boolean }
): FestivalOverlay {
  const entry = FESTIVAL_CATALOG.find((f) => f.key === festivalKey) || FESTIVAL_CATALOG[0];
  const dates = entry.getDateRange(year);

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const endDateObj = new Date(today);
  endDateObj.setDate(endDateObj.getDate() + 30);
  const endStr = endDateObj.toISOString().split("T")[0];

  const useActiveToday = options?.activeToday === true;

  return {
    id: `overlay_${entry.key}_${year}`,
    name: `${entry.key}_${year}`,
    displayName: `${entry.name} ${year}`,
    description: `${entry.description} (Configured for ${year})`,
    enabled: true,
    opacity: 1,
    schedule: {
      startDate: useActiveToday ? todayStr : dates.startDate,
      startTime: dates.startTime || "00:00",
      endDate: useActiveToday ? endStr : dates.endDate,
      endTime: dates.endTime || "23:59",
      timezone: "Asia/Kolkata",
      status: useActiveToday ? "active" : "scheduled",
    },
    accentColors: { ...entry.defaultAccentColors },
    decorations: entry.buildDecorations(year),
  };
}

// -------------------------------------------------------------
// Backwards Compatibility Presets
// -------------------------------------------------------------
export const PRESET_INDEPENDENCE_DAY_2027: FestivalOverlay = createDynamicFestivalOverlay("independence_day", 2027);
export const PRESET_DIWALI_2027: FestivalOverlay = createDynamicFestivalOverlay("diwali", 2027);

export const EMPTY_FESTIVAL_OVERLAY: FestivalOverlay = {
  id: "overlay_none",
  name: "normal",
  displayName: "Normal Experience",
  description: "Standard Quick Experience with no festival visual overlay",
  enabled: false,
  opacity: 1,
  schedule: {
    startDate: `${new Date().getFullYear()}-01-01`,
    startTime: "00:00",
    endDate: `${new Date().getFullYear()}-12-31`,
    endTime: "23:59",
    timezone: "Asia/Kolkata",
    status: "draft",
  },
  decorations: [],
};
