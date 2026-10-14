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
} from "lucide-react";
import { ExperienceSimulator, type SimulatorDocument } from "@/components/qcos/experience-simulator";
import type { FestivalOverlay, VisualDecoration } from "@/lib/qcos/contracts";
import { evaluateOverlaySchedule, festivalOverlaySchema } from "@/lib/qcos/contracts";
import {
  PRESET_INDEPENDENCE_DAY_2027,
  PRESET_DIWALI_2027,
  EMPTY_FESTIVAL_OVERLAY,
  STANDARD_CULTURAL_ASSETS,
  FESTIVAL_CATALOG,
  createDynamicFestivalOverlay,
  loadCustomCulturalAssets,
  saveCustomCulturalAsset,
  deleteCustomCulturalAsset,
  type CulturalAssetItem,
} from "@/components/qcos/experience-preview/cultural-assets";

type PreviewScreen = "home" | "hero" | "categories" | "flash";
type MotionStyle = "calm" | "spring" | "energetic" | "none";
type MasterTab = "colors" | "geometry" | "motion" | "all";
type ColorSubTab = "all" | "background" | "cards" | "brand" | "typography" | "status" | "gradients";
type ControlTab = MasterTab;

interface ThemeRecord {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  tokens: Array<{ token_key: string; token_value: string; category: string }>;
}

interface MediaRecord {
  id: number;
  name: string;
  url: string;
  file_type: string;
  alt_text?: string;
}

interface ThemeDraft {
  name: string;
  description: string;
  // 1. Brand & Accents
  primary: string;
  secondary: string;
  accent: string;
  // 2. Surfaces & Canvas
  background: string;
  surface: string;
  surfaceElevated: string;
  // 3. Typography
  text: string;
  textSecondary: string;
  muted: string;
  // 4. Status & Badges
  success: string;
  warning: string;
  error: string;
  // 5. Gradients
  gradientFrom: string;
  gradientTo: string;
  // 6. Geometry & Shapes
  radiusSm: number;
  radius: number; // radiusMd / buttonRadius
  cardRadius: number; // radiusLg
  // 7. Layout & Spacing
  spacing: number;
  sectionGap: number;
  fontScale: number;
  // 8. Motion & Atmosphere
  motion: MotionStyle;
  heroImage: string;
  sparkle: boolean;
  dark: boolean;
  // 9. Festival & Cultural Overlay
  overlay: FestivalOverlay;
}

const API = "/BuggyCxp/api/qcos";

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

const PRESETS: Array<{ id: string; label: string; description: string; draft: ThemeDraft }> = [
  {
    id: "fresh",
    label: "Quick Fresh 2026",
    description: "Classic fresh grocery daily theme with crisp emeralds and high legibility.",
    draft: {
      name: "Quick Fresh 2026",
      description: "Default fresh grocery daily theme",
      primary: "#039d55",
      secondary: "#ff9900",
      accent: "#ffd700",
      background: "#f7fbfa",
      surface: "#ffffff",
      surfaceElevated: "#f8fafc",
      text: "#1e293b",
      textSecondary: "#475569",
      muted: "#94a3b8",
      success: "#16834a",
      warning: "#f59e0b",
      error: "#e11d48",
      gradientFrom: "#039d55",
      gradientTo: "#004d2e",
      radiusSm: 8,
      radius: 14,
      cardRadius: 20,
      spacing: 16,
      sectionGap: 20,
      fontScale: 1,
      motion: "spring",
      heroImage: "",
      sparkle: false,
      dark: false,
      overlay: structuredClone(EMPTY_FESTIVAL_OVERLAY),
    },
  },
  {
    id: "diwali_2027",
    label: "Diwali 2027 - Golden Radiance",
    description: "Diwali 2027 festive visual theme with #c464bc Primary, #8b0000 Accent, and Pure White Background.",
    draft: {
      name: "Diwali 2027 - Golden Radiance",
      description: "Diwali 2027 festive visual theme",
      primary: "#c464bc",
      secondary: "#8b0000",
      accent: "#ffd700",
      background: "#ffffff",
      surface: "#ffffff",
      surfaceElevated: "#f8fafc",
      text: "#2d1802",
      textSecondary: "#475569",
      muted: "#7d5220",
      success: "#16834a",
      warning: "#f59e0b",
      error: "#e11d48",
      gradientFrom: "#4a0e17",
      gradientTo: "#cdcac1",
      radiusSm: 8,
      radius: 14,
      cardRadius: 21,
      spacing: 23,
      sectionGap: 20,
      fontScale: 1,
      motion: "energetic",
      heroImage: "",
      sparkle: true,
      dark: false,
      overlay: structuredClone(PRESET_DIWALI_2027),
    },
  },
  {
    id: "diwali_2028",
    label: "Diwali 2028",
    description: "Completely distinct 2028 festival theme with Royal Purple & Electric Gold.",
    draft: {
      name: "Diwali 2028 - Royal Glow",
      description: "Diwali 2028 royal festival theme",
      primary: "#7c3aed",
      secondary: "#ffd700",
      accent: "#f59e0b",
      background: "#fdf4ff",
      surface: "#ffffff",
      surfaceElevated: "#faf5ff",
      text: "#3b0764",
      textSecondary: "#581c87",
      muted: "#7e22ce",
      success: "#16834a",
      warning: "#f59e0b",
      error: "#e11d48",
      gradientFrom: "#3b0764",
      gradientTo: "#7c3aed",
      radiusSm: 10,
      radius: 18,
      cardRadius: 24,
      spacing: 16,
      sectionGap: 22,
      fontScale: 1.02,
      motion: "energetic",
      heroImage: "",
      sparkle: true,
      dark: false,
      overlay: createDynamicFestivalOverlay("diwali", 2028),
    },
  },
  {
    id: "summer_2027",
    label: "Summer Fest 2027",
    description: "Bright citrus splash with mango yellow, fresh mint, and light airy cards.",
    draft: {
      name: "Summer Fest 2027 - Citrus Splash",
      description: "Summer seasonal festival theme",
      primary: "#ff6b00",
      secondary: "#00d084",
      accent: "#f59e0b",
      background: "#fffbf0",
      surface: "#ffffff",
      surfaceElevated: "#fffef9",
      text: "#1c1917",
      textSecondary: "#44403c",
      muted: "#78716c",
      success: "#16834a",
      warning: "#f59e0b",
      error: "#e11d48",
      gradientFrom: "#ea580c",
      gradientTo: "#f59e0b",
      radiusSm: 8,
      radius: 16,
      cardRadius: 20,
      spacing: 14,
      sectionGap: 18,
      fontScale: 1,
      motion: "spring",
      heroImage: "",
      sparkle: false,
      dark: false,
      overlay: createDynamicFestivalOverlay("summer", 2027),
    },
  },
  {
    id: "christmas_2027",
    label: "Christmas 2027",
    description: "Winter wonderland with rich ruby red, pine emerald, and snow white surfaces.",
    draft: {
      name: "Christmas 2027 - Winter Magic",
      description: "Christmas & New Year festive theme",
      primary: "#dc2626",
      secondary: "#15803d",
      accent: "#fbbf24",
      background: "#f8fafc",
      surface: "#ffffff",
      surfaceElevated: "#f1f5f9",
      text: "#0f172a",
      textSecondary: "#334155",
      muted: "#475569",
      success: "#15803d",
      warning: "#f59e0b",
      error: "#b91c1c",
      gradientFrom: "#991b1b",
      gradientTo: "#166534",
      radiusSm: 10,
      radius: 18,
      cardRadius: 22,
      spacing: 16,
      sectionGap: 22,
      fontScale: 1,
      motion: "spring",
      heroImage: "",
      sparkle: true,
      dark: false,
      overlay: createDynamicFestivalOverlay("christmas", 2027),
    },
  },
  {
    id: "monster_sale",
    label: "Monster Sale 2027",
    description: "Hyper-energy dark sale theme with neon magenta and electrifying contrast.",
    draft: {
      name: "Monster Sale 2027",
      description: "Mega discount campaign theme",
      primary: "#f43f5e",
      secondary: "#facc15",
      accent: "#38bdf8",
      background: "#09090b",
      surface: "#18181b",
      surfaceElevated: "#27272a",
      text: "#fafafa",
      textSecondary: "#d4d4d8",
      muted: "#a1a1aa",
      success: "#22c55e",
      warning: "#facc15",
      error: "#fb7185",
      gradientFrom: "#18181b",
      gradientTo: "#881337",
      radiusSm: 10,
      radius: 18,
      cardRadius: 22,
      spacing: 16,
      sectionGap: 24,
      fontScale: 1.04,
      motion: "energetic",
      heroImage: "",
      sparkle: true,
      dark: true,
      overlay: structuredClone(EMPTY_FESTIVAL_OVERLAY),
    },
  },
];

function contrastRatio(a: string, b: string) {
  const lum = (hex: string) => {
    const c = [1, 3, 5]
      .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const x = lum(a),
    y = lum(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

function tokenMap(theme: ThemeRecord) {
  return Object.fromEntries(theme.tokens.map((token) => [token.token_key, token.token_value]));
}

function fromTheme(theme: ThemeRecord): ThemeDraft {
  const t = tokenMap(theme);
  let overlay: FestivalOverlay = structuredClone(EMPTY_FESTIVAL_OVERLAY);
  if (t["sys.overlay.data"]) {
    try {
      const parsed = JSON.parse(t["sys.overlay.data"]);
      const val = festivalOverlaySchema.safeParse(parsed);
      if (val.success) overlay = val.data;
    } catch (e) {
      console.warn("Failed to parse overlay from theme tokens", e);
    }
  }
  return {
    name: theme.name,
    description: theme.description || "",
    primary: t["sys.color.primary"] || "#039d55",
    secondary: t["sys.color.secondary"] || "#ff9900",
    accent: t["sys.color.accent"] || "#ffd700",
    background: t["sys.color.background"] || "#f8fafc",
    surface: t["sys.color.surface"] || "#ffffff",
    surfaceElevated: t["sys.color.surface_elevated"] || "#f8fafc",
    text: t["sys.color.text_primary"] || "#1e293b",
    textSecondary: t["sys.color.text_secondary"] || "#475569",
    muted: t["sys.color.text_muted"] || "#94a3b8",
    success: t["sys.color.success"] || "#16834a",
    warning: t["sys.color.warning"] || "#f59e0b",
    error: t["sys.color.error"] || "#e11d48",
    gradientFrom: t["sys.color.gradient_from"] || "#039d55",
    gradientTo: t["sys.color.gradient_to"] || "#004d2e",
    radiusSm: parseInt(t["sys.shape.radius_sm"] || "8", 10),
    radius: parseInt(t["sys.shape.button_radius"] || t["sys.shape.radius_md"] || "14", 10),
    cardRadius: parseInt(t["sys.shape.card_radius"] || t["sys.shape.radius_lg"] || "20", 10),
    spacing: parseInt(t["sys.spacing.md"] || "16", 10),
    sectionGap: parseInt(t["sys.spacing.lg"] || "20", 10),
    fontScale: parseFloat(t["sys.typography.scale"] || "1"),
    motion: (t["sys.motion.style"] as MotionStyle) || "spring",
    heroImage: t["sys.asset.hero_image"] || "",
    sparkle: t["sys.decoration.sparkle"] === "true",
    dark: t["sys.color.scheme"] === "dark",
    overlay,
  };
}

function toTokens(d: ThemeDraft) {
  return [
    ["sys.color.primary", d.primary, "color"],
    ["sys.color.secondary", d.secondary, "color"],
    ["sys.color.accent", d.accent, "color"],
    ["sys.color.background", d.background, "color"],
    ["sys.color.surface", d.surface, "color"],
    ["sys.color.surface_elevated", d.surfaceElevated, "color"],
    ["sys.color.text_primary", d.text, "color"],
    ["sys.color.text_secondary", d.textSecondary, "color"],
    ["sys.color.text_muted", d.muted, "color"],
    ["sys.color.success", d.success, "color"],
    ["sys.color.warning", d.warning, "color"],
    ["sys.color.error", d.error, "color"],
    ["sys.color.gradient_from", d.gradientFrom, "color"],
    ["sys.color.gradient_to", d.gradientTo, "color"],
    ["sys.color.scheme", d.dark ? "dark" : "light", "color"],
    ["sys.shape.radius_sm", `${d.radiusSm}px`, "shape"],
    ["sys.shape.radius_md", `${d.radius}px`, "shape"],
    ["sys.shape.radius_lg", `${d.cardRadius}px`, "shape"],
    ["sys.shape.button_radius", `${d.radius}px`, "shape"],
    ["sys.shape.card_radius", `${d.cardRadius}px`, "shape"],
    ["sys.spacing.xs", "4px", "spacing"],
    ["sys.spacing.sm", `${Math.max(6, Math.round(d.spacing * 0.6))}px`, "spacing"],
    ["sys.spacing.md", `${d.spacing}px`, "spacing"],
    ["sys.spacing.lg", `${d.sectionGap}px`, "spacing"],
    ["sys.spacing.section_gap", `${d.sectionGap}px`, "spacing"],
    ["sys.typography.scale", String(d.fontScale), "typography"],
    ["sys.motion.style", d.motion, "motion"],
    [
      "sys.motion.duration",
      d.motion === "none" ? "0ms" : d.motion === "energetic" ? "420ms" : d.motion === "spring" ? "320ms" : "220ms",
      "motion",
    ],
    [
      "sys.motion.easing",
      d.motion === "spring"
        ? "cubic-bezier(.2,.9,.2,1.2)"
        : d.motion === "energetic"
        ? "cubic-bezier(.2,.8,.2,1)"
        : "ease-out",
      "motion",
    ],
    ["sys.asset.hero_image", d.heroImage, "asset"],
    ["sys.decoration.sparkle", d.sparkle ? "true" : "false", "decoration"],
    ["sys.overlay.data", JSON.stringify(d.overlay || EMPTY_FESTIVAL_OVERLAY), "overlay"],
  ].map(([token_key, token_value, category]) => ({ token_key, token_value, category }));
}

/**
 * Ergonomic color input row with clickable swatch + direct hex text field
 */
function ColorItem({
  label,
  subtitle,
  value,
  onChange,
  onDelete,
  palette,
}: {
  label: string;
  subtitle: string;
  value: string;
  onChange: (val: string) => void;
  onDelete?: () => void;
  palette?: string[];
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard?.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const handleHexChange = (text: string) => {
    let clean = text.trim();
    if (!clean.startsWith("#") && clean.length > 0) clean = "#" + clean;
    onChange(clean);
  };

  return (
    <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:border-slate-300 transition flex flex-col gap-1.5 shadow-2xs">
      <div className="flex items-center justify-between gap-1.5">
        <span className="text-xs font-semibold text-slate-800 truncate">{label}</span>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleCopy}
            title="Copy hex code"
            className="text-[10px] text-slate-500 hover:text-slate-800 font-mono tracking-wider transition flex items-center gap-1"
          >
            <span>{value}</span>
            {copied ? <Check className="w-2.5 h-2.5 text-emerald-600" /> : <Copy className="w-2.5 h-2.5 text-slate-400" />}
          </button>
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              title="Remove color"
              className="text-slate-400 hover:text-rose-600 transition p-0.5 rounded hover:bg-rose-50"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
      <p className="text-[10px] text-slate-500 line-clamp-1">{subtitle}</p>
      <div className="flex items-center gap-2 mt-1">
        <div
          className="relative w-8 h-8 rounded-lg overflow-hidden border border-slate-300 shrink-0 shadow-xs cursor-pointer"
          style={{ backgroundColor: value }}
        >
          <input
            type="color"
            value={value.length === 7 ? value : "#000000"}
            onChange={(e) => onChange(e.target.value)}
            className="absolute -top-3 -left-3 w-14 h-14 cursor-pointer opacity-0"
          />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => handleHexChange(e.target.value)}
          className="flex-1 min-w-0 bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-900 font-mono uppercase tracking-wider focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          placeholder="#000000"
        />
        {palette && palette.length > 0 && (
          <div className="flex items-center gap-1 shrink-0">
            {palette.slice(0, 4).map((col, ci) => (
              <button
                key={ci}
                type="button"
                onClick={() => onChange(col)}
                title={`Use ${col}`}
                className="w-4 h-4 rounded-full border border-slate-300 shrink-0 hover:scale-110 transition shadow-2xs"
                style={{ backgroundColor: col }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ThemeStudio() {
  const [draft, setDraft] = useState<ThemeDraft>(structuredClone(PRESETS[0].draft));
  const [themes, setThemes] = useState<ThemeRecord[]>([]);
  const [media, setMedia] = useState<MediaRecord[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [screen, setScreen] = useState<PreviewScreen>("home");
  const [masterTab, setMasterTab] = useState<MasterTab>("colors");
  const [colorSubTab, setColorSubTab] = useState<ColorSubTab>("all");
  const [expandedDecs, setExpandedDecs] = useState<Record<number, boolean>>({ 0: true });

  const toggleDecExpanded = (idx: number) => {
    setExpandedDecs((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const expandAllDecs = (count: number) => {
    const all: Record<number, boolean> = {};
    for (let i = 0; i < count; i++) all[i] = true;
    setExpandedDecs(all);
  };

  const collapseAllDecs = () => {
    setExpandedDecs({});
  };
  const [searchFilter, setSearchFilter] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [playing, setPlaying] = useState(true);

  type PreviewDateMode = "current" | "scheduled_start" | "custom";
  const [previewDateMode, setPreviewDateMode] = useState<PreviewDateMode>("scheduled_start");
  const [customPreviewDate, setCustomPreviewDate] = useState(() => `${new Date().getFullYear()}-08-15T10:00`);
  const [previewViewportWidth, setPreviewViewportWidth] = useState<number>(390);

  // Dynamic Festival Generation & Asset Management State
  const [selectedFestivalKey, setSelectedFestivalKey] = useState("independence_day");
  const [selectedFestivalYear, setSelectedFestivalYear] = useState<number>(new Date().getFullYear());
  const [showAssetManager, setShowAssetManager] = useState(false);
  const [customAssets, setCustomAssets] = useState<CulturalAssetItem[]>([]);

  const [newAssetName, setNewAssetName] = useState("");
  const [newAssetCategory, setNewAssetCategory] = useState<CulturalAssetItem["category"]>("badge");
  const [newAssetFestival, setNewAssetFestival] = useState("general");
  const [newAssetUrl, setNewAssetUrl] = useState("");
  const [newAssetAlt, setNewAssetAlt] = useState("");

  useEffect(() => {
    setCustomAssets(loadCustomCulturalAssets());
  }, []);

  const handleAddCustomAsset = () => {
    if (!newAssetName.trim() || !newAssetUrl.trim()) {
      setMessage("Asset name and URL/file are required!");
      return;
    }
    const created: CulturalAssetItem = {
      id: `custom_asset_${Date.now()}`,
      name: newAssetName.trim(),
      category: newAssetCategory,
      festival: newAssetFestival,
      url: newAssetUrl.trim(),
      previewUrl: newAssetUrl.trim(),
      altText: newAssetAlt.trim() || newAssetName.trim(),
      isCustom: true,
    };
    const updated = saveCustomCulturalAsset(created);
    setCustomAssets(updated);
    setNewAssetName("");
    setNewAssetUrl("");
    setNewAssetAlt("");
    setMessage(`Added "${created.name}" to Cultural Asset Library!`);
  };

  const handleDeleteCustomAsset = (id: string) => {
    const updated = deleteCustomCulturalAsset(id);
    setCustomAssets(updated);
    setMessage("Asset removed from library.");
  };

  const allAvailableAssets = useMemo(() => {
    return [...customAssets, ...STANDARD_CULTURAL_ASSETS];
  }, [customAssets]);

  const simulatedTime = useMemo(() => {
    if (previewDateMode === "current") return undefined;
    if (previewDateMode === "scheduled_start") {
      const sch = draft.overlay?.schedule;
      if (sch?.startDate && sch?.startTime) {
        return `${sch.startDate}T${sch.startTime}:00`;
      }
      return `${new Date().getFullYear()}-08-15T00:00:00`;
    }
    return customPreviewDate ? `${customPreviewDate}:00` : undefined;
  }, [previewDateMode, customPreviewDate, draft.overlay?.schedule]);

  const previewOverlay = useMemo(() => {
    if (!draft.overlay || !draft.overlay.enabled) return null;
    if (previewDateMode === "custom") {
      const scheduleResult = evaluateOverlaySchedule(draft.overlay.schedule, customPreviewDate);
      return scheduleResult.active ? draft.overlay : null;
    }
    // In Theme Studio, ALWAYS show enabled overlay so the designer/developer immediately sees live visual decorations and artwork
    return draft.overlay;
  }, [draft.overlay, previewDateMode, customPreviewDate]);

  const load = useCallback(async () => {
    const [a, b] = await Promise.all([
      fetch(`${API}/themes`, { cache: "no-store" }),
      fetch(`${API}/media`, { cache: "no-store" }),
    ]);
    const x = await a.json(),
      y = await b.json();
    if (a.ok) {
      const loadedThemes = x.data || [];
      setThemes(loadedThemes);
      const active = loadedThemes.find((t: ThemeRecord) => t.is_active);
      if (active && selectedId === null) {
        setSelectedId(active.id);
        setDraft(fromTheme(active));
      }
    }
    if (b.ok) {
      setMedia((y.data || []).filter((item: MediaRecord) => ["image", "svg", "video", "lottie"].includes(item.file_type)));
    }
  }, [selectedId]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  const contrast = useMemo(() => contrastRatio(draft.text, draft.surface), [draft.text, draft.surface]);

  function patch<K extends keyof ThemeDraft>(key: K, value: ThemeDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setMessage("");
  }

  function applyPreset(index: number) {
    setSelectedId(null);
    const p = PRESETS[index];
    const newDraft = structuredClone(p.draft);
    setDraft(newDraft);
    if (newDraft.overlay?.enabled && newDraft.overlay.schedule?.startDate) {
      setPreviewDateMode("scheduled_start");
      setCustomPreviewDate(`${newDraft.overlay.schedule.startDate}T${newDraft.overlay.schedule.startTime || "10:00"}`);
      if (p.id.includes("diwali")) {
        setSelectedFestivalKey("diwali");
        setSelectedFestivalYear(p.id.includes("2028") ? 2028 : 2027);
      } else if (p.id.includes("independence")) {
        setSelectedFestivalKey("independence_day");
        setSelectedFestivalYear(2027);
      } else if (p.id.includes("christmas")) {
        setSelectedFestivalKey("christmas");
        setSelectedFestivalYear(2027);
      } else if (p.id.includes("summer")) {
        setSelectedFestivalKey("summer");
        setSelectedFestivalYear(2027);
      }
    }
    setPlaying(false);
    requestAnimationFrame(() => setPlaying(true));
  }

  async function activateTheme(id: number) {
    setBusy(true);
    const response = await fetch(`${API}/themes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: true }),
    });
    const payload = await response.json();
    setMessage(response.ok ? "Theme activated! Real app layout caches invalidated." : payload.error || "Unable to activate theme");
    if (response.ok) {
      setSelectedId(id);
      await load();
    }
    setBusy(false);
  }

  async function save(active: boolean) {
    setBusy(true);
    const body = {
      name: draft.name,
      description: draft.description,
      is_active: active,
      tokens: toTokens(draft),
    };
    const response = await fetch(selectedId ? `${API}/themes/${selectedId}` : `${API}/themes`, {
      method: selectedId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = await response.json();
    setMessage(
      response.ok
        ? active
          ? "Theme saved, activated and layout caches refreshed."
          : "Theme draft saved."
        : payload.details
        ? `Validation failed: ${JSON.stringify(payload.details)}`
        : payload.error || "Unable to save theme"
    );
    if (response.ok) {
      setSelectedId(payload.data.id);
      await load();
    }
    setBusy(false);
  }

  const normalizedQuery = searchFilter.trim().toLowerCase();
  const isSearching = normalizedQuery.length > 0;
  const matchesSearch = (...terms: (string | undefined)[]) => {
    if (!isSearching) return true;
    const q = normalizedQuery === "backend" ? "background" : normalizedQuery;
    return terms.some((t) => {
      if (!t) return false;
      const lower = t.toLowerCase();
      return lower.includes(q) || (q === "bg" && lower.includes("background"));
    });
  };

  const showBackground =
    (isSearching && (matchesSearch("background", "canvas", "app canvas", "backend", "bg") || matchesSearch(draft.background))) ||
    (!isSearching && (masterTab === "all" || (masterTab === "colors" && (colorSubTab === "all" || colorSubTab === "background"))));

  const showCards =
    (isSearching && (matchesSearch("card", "surface", "container", "box") || matchesSearch(draft.surface))) ||
    (!isSearching && (masterTab === "all" || (masterTab === "colors" && (colorSubTab === "all" || colorSubTab === "cards"))));

  const showBrand =
    (isSearching && (matchesSearch("brand", "primary", "secondary", "accent", "button", "action") || matchesSearch(draft.primary, draft.secondary, draft.accent))) ||
    (!isSearching && (masterTab === "all" || (masterTab === "colors" && (colorSubTab === "all" || colorSubTab === "brand"))));

  const showTypography =
    (isSearching && (matchesSearch("text", "typography", "heading", "price", "font", "muted", "subtitles") || matchesSearch(draft.text, draft.textSecondary, draft.muted))) ||
    (!isSearching && (masterTab === "all" || (masterTab === "colors" && (colorSubTab === "all" || colorSubTab === "typography"))));

  const showStatus =
    (isSearching && (matchesSearch("badge", "status", "deal", "discount", "success", "warning", "error", "alert") || matchesSearch(draft.success, draft.warning, draft.error))) ||
    (!isSearching && (masterTab === "all" || (masterTab === "colors" && (colorSubTab === "all" || colorSubTab === "status"))));

  const showGradients =
    (isSearching && (matchesSearch("gradient", "hero", "banner") || matchesSearch(draft.gradientFrom, draft.gradientTo))) ||
    (!isSearching && (masterTab === "all" || (masterTab === "colors" && (colorSubTab === "all" || colorSubTab === "gradients"))));

  const showGeometry =
    (isSearching && matchesSearch("shape", "radius", "corner", "round", "pill", "chip")) ||
    (!isSearching && (masterTab === "all" || masterTab === "geometry"));

  const showLayout =
    (isSearching && matchesSearch("spacing", "layout", "padding", "gap", "scale", "type scale", "font scale")) ||
    (!isSearching && (masterTab === "all" || masterTab === "geometry"));

  const showMotion =
    (isSearching && matchesSearch("motion", "animation", "atmosphere", "sparkle", "hero image")) ||
    (!isSearching && (masterTab === "all" || masterTab === "motion"));


  return (
    <div className="p-5 xl:p-6 max-w-[1650px] mx-auto space-y-5">
      <style>{`
        @keyframes cxpFloat { 0%, 100% { transform: translateY(0) scale(1) } 50% { transform: translateY(-6px) scale(1.02) } }
        @keyframes cxpPulse { 0%, 100% { filter: saturate(1) } 50% { filter: saturate(1.35) brightness(1.08) } }
        @keyframes cxpSlide { from { opacity: 0; transform: translateX(18px) } to { opacity: 1; transform: translateX(0) } }
        @media (prefers-reduced-motion: reduce) { .cxp-motion { animation: none !important; transition: none !important } }
      `}</style>

      {/* Top Header */}
      <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <Palette className="text-indigo-400 w-8 h-8" />
            Theme Studio{" "}
            <span className="text-xs border border-emerald-500/20 bg-emerald-500/10 text-emerald-300 px-2.5 py-1 rounded-full font-semibold">
              Live SDUI Design Engine
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Fine-tune every brand element, card surface, typography tone, and interaction geometry with instant mobile preview.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => void save(false)}
            disabled={busy}
            className="px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-200 text-sm font-semibold flex items-center gap-2 transition"
          >
            <Save className="w-4 h-4" />
            Save draft
          </button>
          <button
            onClick={() => void save(true)}
            disabled={busy}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Save & activate
          </button>
        </div>
      </header>

      {/* Status banner */}
      {message && (
        <div className="p-3.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-200 text-sm flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage("")} className="text-xs text-indigo-400 hover:text-white underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Main 3-Column Layout: Controls (Left) | Simulator (Middle) | Saved Themes & Meta (Right) */}
      <div className="grid xl:grid-cols-[430px_1fr_300px] gap-5 items-start">
        {/* LEFT COLUMN: Detailed Design Controls */}
        <aside className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 max-h-[880px] overflow-y-auto sim-scroll shadow-sm text-slate-900">
          {/* Header & Theme Mode Switcher */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
              <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
              <span>Design Controls</span>
            </div>
            <button
              type="button"
              onClick={() => patch("dark", !draft.dark)}
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition flex items-center gap-1.5 shadow-2xs ${
                draft.dark
                  ? "bg-slate-800 text-amber-300 border-slate-700 hover:bg-slate-700"
                  : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
              }`}
              title="Click to toggle Light / Dark preview"
            >
              {draft.dark ? <Moon className="w-3 h-3 text-amber-300" /> : <Sun className="w-3 h-3 text-amber-500" />}
              <span>{draft.dark ? "Dark theme" : "Light theme"}</span>
            </button>
          </div>

          {/* Theme Meta Inputs */}
          <div className="space-y-2">
            <label className="text-xs text-slate-600 block font-medium">
              Theme Name
              <input
                value={draft.name}
                onChange={(e) => patch("name", e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                placeholder="e.g. Diwali Royal Glow"
              />
            </label>
            <label className="text-xs text-slate-600 block font-medium">
              Description
              <input
                value={draft.description}
                onChange={(e) => patch("description", e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                placeholder="e.g. Festive theme with electric gold accents"
              />
            </label>
          </div>

          {/* Quick Search & Filter */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search controls (e.g. canvas, radius, sparkle, diwali)..."
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition shadow-2xs"
            />
            {searchFilter && (
              <button
                type="button"
                onClick={() => setSearchFilter("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-slate-700 bg-slate-200 hover:bg-slate-300 w-4 h-4 rounded-full flex items-center justify-center transition"
              >
                ✕
              </button>
            )}
          </div>

          {/* Master Workspace Tabs */}
          <div className="grid grid-cols-4 gap-1 rounded-xl border border-slate-200 p-1 bg-slate-100 text-xs">
            {[
              { id: "colors", label: "Colors", icon: Palette },
              { id: "geometry", label: "Shapes", icon: Maximize2 },
              { id: "motion", label: "Motion", icon: Sparkles },
              { id: "all", label: "All", icon: Layers },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = masterTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setMasterTab(tab.id as MasterTab);
                    setSearchFilter("");
                  }}
                  className={`py-2 px-1 rounded-lg font-medium transition text-center flex flex-col items-center justify-center gap-1 relative ${
                    isActive
                      ? "bg-white text-indigo-700 shadow-xs font-bold border border-slate-200/80"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-indigo-600" : "text-slate-500"}`} />
                  <span className="text-[11px] truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Sub-Category Filter for Colors */}
          {masterTab === "colors" && !isSearching && (
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sim-scroll text-[11px]">
              {[
                ["all", "All Colors"],
                ["background", "Canvas"],
                ["cards", "Cards"],
                ["brand", "Brand"],
                ["typography", "Text"],
                ["status", "Badges"],
                ["gradients", "Gradient"],
              ].map(([subKey, subLabel]) => (
                <button
                  key={subKey}
                  type="button"
                  onClick={() => setColorSubTab(subKey as ColorSubTab)}
                  className={`shrink-0 px-2.5 py-1 rounded-full font-medium transition text-[11px] ${
                    colorSubTab === subKey
                      ? "bg-indigo-600 text-white font-semibold shadow-2xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
                  }`}
                >
                  {subLabel}
                </button>
              ))}
            </div>
          )}

          {/* SECTION 1: Background & Canvas */}
          {showBackground && (
            <div className="space-y-3 pt-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 uppercase tracking-wider">
                <Paintbrush className="w-3.5 h-3.5" />
                Background &amp; Canvas
              </div>
              <div className="grid grid-cols-1 gap-2.5">
                <ColorItem
                  label="Background (Canvas)"
                  subtitle="App canvas background behind cards and shelves"
                  value={draft.background}
                  onChange={(val) => patch("background", val)}
                  palette={["#ffffff", "#fafafa", "#f7fbfa", "#fff9e6", "#09090b"]}
                />
                <ColorItem
                  label="Elevated Surface"
                  subtitle="Floating search bar, bottom nav bar, modals"
                  value={draft.surfaceElevated}
                  onChange={(val) => patch("surfaceElevated", val)}
                  palette={["#ffffff", "#f8fafc", "#fdf8f6", "#27272a"]}
                />
              </div>
            </div>
          )}

          {/* SECTION 2: Cards & Surfaces */}
          {showCards && (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 uppercase tracking-wider">
                <Layers className="w-3.5 h-3.5" />
                Cards &amp; Containers
              </div>
              <div className="grid grid-cols-1 gap-2.5">
                <ColorItem
                  label="Cards (Surface)"
                  subtitle="Product containers, deal shelves, category boxes"
                  value={draft.surface}
                  onChange={(val) => patch("surface", val)}
                  palette={["#ffffff", "#f8fafc", "#18181b", draft.surfaceElevated]}
                />
              </div>
            </div>
          )}

          {/* SECTION 3: Brand & Theme Accents */}
          {showBrand && (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 uppercase tracking-wider">
                <Palette className="w-3.5 h-3.5" />
                Brand &amp; Actions
              </div>
              <div className="grid grid-cols-1 gap-2.5">
                <ColorItem
                  label="Primary Action"
                  subtitle="Buttons, delivery speed bolt, active indicators"
                  value={draft.primary}
                  onChange={(val) => patch("primary", val)}
                  palette={[draft.primary, draft.secondary, draft.accent, draft.background]}
                />
                <ColorItem
                  label="Secondary Accent"
                  subtitle="Promotional badges, category ribbons, tags"
                  value={draft.secondary}
                  onChange={(val) => patch("secondary", val)}
                  palette={[draft.secondary, draft.primary, draft.accent]}
                />
                <ColorItem
                  label="Accent Highlight"
                  subtitle="VIP tags, festive sparkle highlights, star ratings"
                  value={draft.accent}
                  onChange={(val) => patch("accent", val)}
                  palette={[draft.accent, draft.secondary, draft.primary]}
                />
              </div>
            </div>
          )}

          {/* SECTION 4: Typography Colors */}
          {showTypography && (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-1.5 text-xs font-bold text-sky-700 uppercase tracking-wider">
                <Type className="w-3.5 h-3.5" />
                Typography Colors
              </div>
              <div className="grid grid-cols-1 gap-2.5">
                <ColorItem
                  label="Text (Main Headings &amp; Prices)"
                  subtitle="Section titles, product titles, price tags"
                  value={draft.text}
                  onChange={(val) => patch("text", val)}
                  palette={["#2d1802", "#1e293b", "#3b0764", "#0f172a"]}
                />
                <ColorItem
                  label="Secondary Text"
                  subtitle="Subtitles, pack sizes, store details"
                  value={draft.textSecondary}
                  onChange={(val) => patch("textSecondary", val)}
                  palette={["#475569", "#523616", "#64748b", "#334155"]}
                />
                <ColorItem
                  label="Muted (Strikethrough Price)"
                  subtitle="Struck-through MRP, delivery eta notes"
                  value={draft.muted}
                  onChange={(val) => patch("muted", val)}
                  palette={["#7d5220", "#94a3b8", "#7e22ce", "#a1a1aa"]}
                />
              </div>
            </div>
          )}

          {/* SECTION 5: Status & Deal Alerts */}
          {showStatus && (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                Status &amp; Deal Badges
              </div>
              <div className="grid grid-cols-1 gap-2.5">
                <ColorItem
                  label="Success &amp; Savings"
                  subtitle="Discount badges, 'Flat ₹50 OFF', in-stock tags"
                  value={draft.success}
                  onChange={(val) => patch("success", val)}
                  palette={["#16834a", "#22c55e", "#15803d"]}
                />
                <ColorItem
                  label="Warning &amp; Flash Urgency"
                  subtitle="Flash deal clocks, 'Only 2 left', fast selling"
                  value={draft.warning}
                  onChange={(val) => patch("warning", val)}
                  palette={["#f59e0b", "#facc15", "#ea580c"]}
                />
                <ColorItem
                  label="Error &amp; Alert"
                  subtitle="Sold out badges, cancellation alerts"
                  value={draft.error}
                  onChange={(val) => patch("error", val)}
                  palette={["#dc2626", "#e11d48", "#b91c1c"]}
                />
              </div>
            </div>
          )}

          {/* SECTION 6: Hero Gradient */}
          {showGradients && (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">
                  Hero Campaign Gradient
                </span>
              </div>
              {/* Visual preview strip */}
              <div
                className="h-10 rounded-xl border border-slate-300 shadow-2xs flex items-center justify-center text-[10px] font-bold text-white tracking-widest uppercase transition-all"
                style={{
                  background: `linear-gradient(135deg, ${draft.gradientFrom} 0%, ${draft.gradientTo} 100%)`,
                }}
              >
                Live Gradient Preview ({draft.gradientFrom} → {draft.gradientTo})
              </div>
              <div className="grid grid-cols-1 gap-2.5">
                <ColorItem
                  label="Gradient (Start)"
                  subtitle="Hero banner top/left start color"
                  value={draft.gradientFrom}
                  onChange={(val) => patch("gradientFrom", val)}
                  palette={["#4a0e17", "#039d55", "#3b0764", "#18181b"]}
                />
                <ColorItem
                  label="Gradient destination"
                  subtitle="Hero banner bottom/right ending color"
                  value={draft.gradientTo}
                  onChange={(val) => patch("gradientTo", val)}
                  palette={["#cdcac1", "#b8860b", "#8b0000", "#c464bc"]}
                />
              </div>
            </div>
          )}

          {/* SECTION 7: Shapes & Radii */}
          {showGeometry && (
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700 uppercase tracking-wider">
                <Maximize2 className="w-3.5 h-3.5" />
                Shapes &amp; Radii
              </div>
              <label className="text-xs text-slate-700 block font-medium">
                <div className="flex justify-between items-center mb-1.5">
                  <span>Corner radius (Cards)</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={4}
                      max={48}
                      value={draft.cardRadius}
                      onChange={(e) => patch("cardRadius", Math.max(4, Math.min(48, Number(e.target.value) || 0)))}
                      className="w-14 px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-slate-900 font-mono text-xs text-right focus:bg-white"
                    />
                    <span className="text-slate-500 font-mono text-xs">px</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={4}
                  max={40}
                  value={draft.cardRadius}
                  onChange={(e) => patch("cardRadius", Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <span className="text-[10px] text-slate-500">Deals containers, product cards, category tiles</span>
              </label>

              <label className="text-xs text-slate-700 block font-medium">
                <div className="flex justify-between items-center mb-1.5">
                  <span>Button &amp; Pill Radius</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={4}
                      max={32}
                      value={draft.radius}
                      onChange={(e) => patch("radius", Math.max(4, Math.min(32, Number(e.target.value) || 0)))}
                      className="w-14 px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-slate-900 font-mono text-xs text-right focus:bg-white"
                    />
                    <span className="text-slate-500 font-mono text-xs">px</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={4}
                  max={32}
                  value={draft.radius}
                  onChange={(e) => patch("radius", Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <span className="text-[10px] text-slate-500">Primary action buttons, module switchers</span>
              </label>

              <label className="text-xs text-slate-700 block font-medium">
                <div className="flex justify-between items-center mb-1.5">
                  <span>Small Chip / Tag Radius</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={2}
                      max={20}
                      value={draft.radiusSm}
                      onChange={(e) => patch("radiusSm", Math.max(2, Math.min(20, Number(e.target.value) || 0)))}
                      className="w-14 px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-slate-900 font-mono text-xs text-right focus:bg-white"
                    />
                    <span className="text-slate-500 font-mono text-xs">px</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={2}
                  max={20}
                  value={draft.radiusSm}
                  onChange={(e) => patch("radiusSm", Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <span className="text-[10px] text-slate-500">Discount labels, offer badges, filter chips</span>
              </label>
            </div>
          )}

          {/* SECTION 8: Layout Spacing & Type Scale */}
          {showLayout && (
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-1.5 text-xs font-bold text-teal-700 uppercase tracking-wider">
                <Move className="w-3.5 h-3.5" />
                Layout &amp; Sizing
              </div>
              <label className="text-xs text-slate-700 block font-medium">
                <div className="flex justify-between items-center mb-1.5">
                  <span>Content spacing (Padding)</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={8}
                      max={40}
                      value={draft.spacing}
                      onChange={(e) => patch("spacing", Math.max(8, Math.min(40, Number(e.target.value) || 0)))}
                      className="w-14 px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-slate-900 font-mono text-xs text-right focus:bg-white"
                    />
                    <span className="text-slate-500 font-mono text-xs">px</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={8}
                  max={36}
                  value={draft.spacing}
                  onChange={(e) => patch("spacing", Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </label>

              <label className="text-xs text-slate-700 block font-medium">
                <div className="flex justify-between items-center mb-1.5">
                  <span>Section Vertical Gap</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={10}
                      max={48}
                      value={draft.sectionGap}
                      onChange={(e) => patch("sectionGap", Math.max(10, Math.min(48, Number(e.target.value) || 0)))}
                      className="w-14 px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-slate-900 font-mono text-xs text-right focus:bg-white"
                    />
                    <span className="text-slate-500 font-mono text-xs">px</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={10}
                  max={48}
                  value={draft.sectionGap}
                  onChange={(e) => patch("sectionGap", Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </label>

              <label className="text-xs text-slate-700 block font-medium">
                <div className="flex justify-between items-center mb-1.5">
                  <span>Type scale</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0.8}
                      max={1.4}
                      step={0.01}
                      value={draft.fontScale}
                      onChange={(e) => patch("fontScale", Number(e.target.value))}
                      className="w-16 px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-slate-900 font-mono text-xs text-right focus:bg-white"
                    />
                    <span className="text-slate-500 font-mono text-xs">x</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={0.85}
                  max={1.25}
                  step={0.01}
                  value={draft.fontScale}
                  onChange={(e) => patch("fontScale", Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </label>
            </div>
          )}

          {/* SECTION 9: Motion & Atmosphere */}
          {showMotion && (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-1.5 text-xs font-bold text-pink-700 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                Motion personality &amp; Atmosphere
              </div>
              <label className="text-xs text-slate-600 block font-medium">
                Motion personality
                <select
                  value={draft.motion}
                  onChange={(e) => patch("motion", e.target.value as MotionStyle)}
                  className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-indigo-500 focus:bg-white"
                >
                  <option value="energetic">Energetic campaign (fast festive pulse)</option>
                  <option value="spring">Responsive spring (modern micro-bounce)</option>
                  <option value="calm">Calm fade (gentle transitions)</option>
                  <option value="none">No motion (high performance)</option>
                </select>
              </label>

              <label className="text-xs text-slate-600 block font-medium">
                Hero image / animation
                <select
                  value={draft.heroImage}
                  onChange={(e) => patch("heroImage", e.target.value)}
                  className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-indigo-500 focus:bg-white"
                >
                  <option value="">Generated gradient</option>
                  {media.map((item) => (
                    <option key={item.id} value={item.url}>
                      {item.name} ({item.file_type})
                    </option>
                  ))}
                </select>
              </label>

              <div className="pt-2 flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50">
                <div>
                  <div className="text-xs font-semibold text-slate-900">Festive Sparkle Effect</div>
                  <div className="text-[10px] text-slate-500">Celebration shimmer highlight on cards</div>
                </div>
                <button
                  type="button"
                  onClick={() => patch("sparkle", !draft.sparkle)}
                  className={`w-11 h-6 rounded-full transition-colors relative ${
                    draft.sparkle ? "bg-indigo-600" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                      draft.sparkle ? "right-1" : "left-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          )}
        </aside>

        {/* MIDDLE COLUMN: Phone Simulator Canvas */}
        <main className="rounded-3xl border border-slate-800 bg-slate-950/60 overflow-hidden shadow-2xl">
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
                    screen === key ? "bg-indigo-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              {/* Responsive Viewport Width Switcher */}
              <div className="flex items-center rounded-lg border border-slate-800 p-0.5 bg-slate-950/80 text-[11px]">
                {[
                  { w: 360, label: "360px" },
                  { w: 390, label: "390px" },
                  { w: 430, label: "430px" },
                ].map((vw) => (
                  <button
                    key={vw.w}
                    type="button"
                    onClick={() => setPreviewViewportWidth(vw.w)}
                    className={`px-2 py-1 rounded transition font-mono ${
                      previewViewportWidth === vw.w
                        ? "bg-slate-800 text-white font-bold shadow-2xs"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {vw.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  setPlaying(false);
                  requestAnimationFrame(() => setPlaying(true));
                }}
                className="px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 text-xs text-indigo-300 flex items-center gap-1.5 transition"
              >
                <Play className="w-3.5 h-3.5" />
                Replay motion
              </button>
            </div>
          </div>

          {/* Preview Simulation Time Controls */}
          <div className="p-3 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-orange-400" />
              <span className="text-white font-semibold">Simulate Date:</span>
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px]">
                <button
                  type="button"
                  onClick={() => setPreviewDateMode("current")}
                  className={`px-2.5 py-1 rounded transition ${
                    previewDateMode === "current"
                      ? "bg-indigo-600 text-white font-semibold"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Current Time
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDateMode("scheduled_start")}
                  className={`px-2.5 py-1 rounded transition ${
                    previewDateMode === "scheduled_start"
                      ? "bg-orange-600 text-white font-semibold"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Scheduled Start ({draft.overlay?.schedule?.startDate || "Active"})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPreviewDateMode("custom");
                    const endDate = draft.overlay?.schedule?.endDate;
                    if (endDate) {
                      try {
                        const d = new Date(endDate);
                        d.setDate(d.getDate() + 1);
                        setCustomPreviewDate(d.toISOString().split("T")[0] + "T12:00");
                      } catch {
                        setCustomPreviewDate("2028-01-01T12:00");
                      }
                    } else {
                      setCustomPreviewDate("2028-01-01T12:00");
                    }
                  }}
                  className={`px-2.5 py-1 rounded transition ${
                    previewDateMode === "custom" && draft.overlay?.schedule?.endDate && customPreviewDate.startsWith(
                      (() => {
                        try {
                          const d = new Date(draft.overlay.schedule.endDate);
                          d.setDate(d.getDate() + 1);
                          return d.toISOString().split("T")[0];
                        } catch {
                          return "impossible";
                        }
                      })()
                    )
                      ? "bg-slate-700 text-white font-semibold"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Expired ({draft.overlay?.schedule?.endDate ? `+1d after end` : "Future"})
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDateMode("custom")}
                  className={`px-2.5 py-1 rounded transition ${
                    previewDateMode === "custom" && (!draft.overlay?.schedule?.endDate || !customPreviewDate.startsWith(
                      (() => {
                        try {
                          const d = new Date(draft.overlay.schedule.endDate);
                          d.setDate(d.getDate() + 1);
                          return d.toISOString().split("T")[0];
                        } catch {
                          return "";
                        }
                      })()
                    ))
                      ? "bg-indigo-600 text-white font-semibold"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Custom Date
                </button>
              </div>
            </div>

            {previewDateMode === "custom" && (
              <input
                type="datetime-local"
                value={customPreviewDate}
                onChange={(e) => setCustomPreviewDate(e.target.value)}
                className="px-2 py-1 rounded bg-slate-950 border border-slate-700 text-white text-xs font-mono"
              />
            )}

            <div className="flex items-center gap-2">
              <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase ${
                previewOverlay
                  ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                  : "bg-slate-800 text-slate-400 border border-slate-700"
              }`}>
                {previewOverlay ? `Active: ${previewOverlay.displayName || previewOverlay.name}` : "Overlay Inactive (Base Theme Only)"}
              </span>
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
              theme={{ name: draft.name, tokens: toTokens(draft) }}
              overlay={previewOverlay}
              media={media}
              playing={playing}
              sourceLabel="Theme Studio live draft"
              viewportWidth={previewViewportWidth}
            />
          </div>
        </main>

        {/* RIGHT COLUMN: Saved Themes List, Accessibility & Mode */}
        <aside className="space-y-4">
          {/* Saved Themes Section */}
          <section className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 shadow-lg">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-white flex items-center gap-2 text-sm">
                <WandSparkles className="w-4 h-4 text-indigo-400" />
                Saved Themes
              </h2>
              <span className="text-[11px] text-slate-400">{themes.length} saved</span>
            </div>

            <div className="mt-3 space-y-2.5 max-h-[380px] overflow-y-auto sim-scroll">
              <button
                onClick={() => {
                  setSelectedId(null);
                  setDraft(structuredClone(PRESETS[0].draft));
                }}
                className="w-full p-2.5 rounded-xl border border-dashed border-slate-700 hover:border-indigo-500 hover:text-white text-xs text-slate-400 flex items-center justify-center gap-2 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Create New Theme
              </button>

              {themes.map((theme) => (
                <div
                  key={theme.id}
                  className={`w-full p-3 rounded-xl border flex flex-col gap-2 transition ${
                    selectedId === theme.id ? "border-indigo-500 bg-indigo-500/10" : "border-slate-800 bg-slate-950/40"
                  }`}
                >
                  <button
                    onClick={() => {
                      setSelectedId(theme.id);
                      setDraft(fromTheme(theme));
                    }}
                    className="text-left w-full"
                  >
                    <div className="flex justify-between items-center text-sm text-white">
                      <span className="font-semibold text-xs">{theme.name}</span>
                      {theme.is_active && (
                        <span className="flex items-center gap-1 text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30 font-semibold">
                          <Check className="w-3 h-3" /> Active
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">{theme.tokens.length} design tokens</div>
                  </button>

                  {!theme.is_active && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        void activateTheme(theme.id);
                      }}
                      disabled={busy}
                      className="text-xs py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium flex items-center justify-center gap-1.5 shadow-sm transition"
                    >
                      <Sparkles className="w-3 h-3" />
                      Activate in Real App
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Accessibility Card */}
          <section className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 shadow-lg">
            <h2 className="font-bold text-white text-sm">Contrast & Legibility</h2>
            <div
              className={`mt-3 p-3.5 rounded-xl border ${
                contrast >= 4.5
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                  : "border-amber-500/30 bg-amber-500/10 text-amber-200"
              }`}
            >
              <div className="text-2xl font-bold font-mono">{contrast.toFixed(2)}:1</div>
              <div className="text-xs mt-0.5">
                Text on Card: {contrast >= 4.5 ? "Passes WCAG AA ✓" : "Low contrast (recommend darker text)"}
              </div>
            </div>
            <div className="mt-3 text-xs text-slate-400 space-y-1.5">
              <p>✓ All tokens map to Flutter design extensions</p>
              <p>✓ Micro-animations respect reduced-motion</p>
              <p>✓ Live cache auto-invalidated on save</p>
            </div>
          </section>

          {/* Mode Switcher */}
          <section className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 shadow-lg">
            <h2 className="font-bold text-white text-sm mb-3">Color Mode</h2>
            <button
              onClick={() => patch("dark", !draft.dark)}
              className="w-full p-2.5 rounded-xl border border-slate-700 hover:border-slate-600 flex items-center justify-between text-xs font-semibold text-slate-200 bg-slate-950 transition"
            >
              {draft.dark ? (
                <>
                  <span className="flex items-center gap-2">
                    <Moon className="w-4 h-4 text-indigo-400" /> Dark experience
                  </span>
                  <span className="text-[10px] text-slate-400">Switch to Light</span>
                </>
              ) : (
                <>
                  <span className="flex items-center gap-2">
                    <Sun className="w-4 h-4 text-amber-400" /> Light experience
                  </span>
                  <span className="text-[10px] text-slate-400">Switch to Dark</span>
                </>
              )}
            </button>
          </section>
        </aside>
      </div>
    </div>
  );
}
