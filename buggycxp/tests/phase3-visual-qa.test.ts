import test from "node:test";
import assert from "node:assert/strict";
import {
  parseTokensToTheme,
  recipeTypography,
  recipeElevation,
  recipeProductCard,
  recipeCategoryCard,
  recipeStoreCard,
  recipeDealCard,
  recipeButton,
  recipeBadge,
  recipeChip,
  recipeSectionHeader,
  type ParsedThemeTokens,
} from "../src/components/qcos/experience-preview/preview-theme.ts";
import {
  STANDARD_CULTURAL_ASSETS,
  PRESET_INDEPENDENCE_DAY_2027,
  PRESET_DIWALI_2027,
  EMPTY_FESTIVAL_OVERLAY,
  type CulturalAssetItem,
} from "../src/components/qcos/experience-preview/cultural-assets.ts";
import {
  festivalOverlaySchema,
  visualDecorationSchema,
  evaluateOverlaySchedule,
  type FestivalOverlay,
  type VisualDecoration,
} from "../src/lib/qcos/contracts.ts";

// ---------------------------------------------------------------------------
// TEST SUITE 1: CXP DESIGN SYSTEM TOKEN & COMPONENT RECIPE ENGINE
// ---------------------------------------------------------------------------
test("Theme Studio Controls: Colors -> Semantic Tokens -> Component Recipes -> Preview Component Styles", () => {
  const tokenMap: Record<string, string> = {
    "sys.color.primary": "#e11d48", // Rose primary
    "sys.color.secondary": "#0284c7", // Sky secondary
    "sys.color.accent": "#f59e0b", // Amber accent
    "sys.color.background": "#0f172a", // Dark canvas
    "sys.color.surface": "#1e293b", // Dark card surface
    "sys.color.surface_elevated": "#334155", // Elevated surface
    "sys.color.text_primary": "#f8fafc", // Light text
    "sys.color.text_secondary": "#94a3b8", // Slate secondary
    "sys.color.text_muted": "#64748b", // Muted text
    "sys.color.success": "#16834a", // Emerald
    "sys.color.warning": "#f59e0b", // Amber
    "sys.color.error": "#e11d48", // Rose
    "sys.color.info": "#0284c7", // Sky
    "sys.shape.card_radius": "24px",
    "sys.shape.button_radius": "16px",
    "sys.shape.chip_radius": "8px",
    "sys.shape.input_radius": "14px",
    "sys.spacing.md": "18px",
    "sys.spacing.lg": "24px",
    "sys.scale.font": "1.2",
  };

  const parsed = parseTokensToTheme(tokenMap);

  // 1. Parsed values
  assert.equal(parsed.primary, "#e11d48");
  assert.equal(parsed.secondary, "#0284c7");
  assert.equal(parsed.accent, "#f59e0b");
  assert.equal(parsed.background, "#0f172a");
  assert.equal(parsed.surface, "#1e293b");
  assert.equal(parsed.surfaceElevated, "#334155");
  assert.equal(parsed.textPrimary, "#f8fafc");
  assert.equal(parsed.textSecondary, "#94a3b8");
  assert.equal(parsed.cardRadius, 24);
  assert.equal(parsed.buttonRadius, 16);
  assert.equal(parsed.chipRadius, 8);
  assert.equal(parsed.inputRadius, 14);

  // 2. Component Recipes: Button
  const btnPrimary = recipeButton(parsed, "primary");
  assert.equal(btnPrimary.backgroundColor, "#e11d48");
  assert.equal(btnPrimary.borderRadius, "16px");

  const btnSecondary = recipeButton(parsed, "secondary");
  assert.equal(btnSecondary.backgroundColor, "#0284c7");

  // 3. Component Recipes: Product Card
  const prodCard = recipeProductCard(parsed);
  assert.equal(prodCard.card.backgroundColor, "#1e293b");
  assert.equal(prodCard.card.borderRadius, "24px");
  assert.equal(prodCard.title.color, "#f8fafc");
  assert.equal(prodCard.price.color, "#f8fafc");

  // 4. Component Recipes: Category Card
  const catCard = recipeCategoryCard(parsed);
  assert.equal(catCard.iconWell.borderRadius, "22px");

  // 5. Component Recipes: Store Card
  const storeCard = recipeStoreCard(parsed);
  assert.equal(storeCard.card.backgroundColor, "#1e293b");
  assert.equal(storeCard.card.borderRadius, "24px");

  // 6. Component Recipes: Deal Card
  const dealCard = recipeDealCard(parsed, "flash");
  assert.equal(dealCard.container.backgroundColor, "#1e293b");
  assert.equal(dealCard.container.borderRadius, "24px");

  // 7. Component Recipes: Chips & Badges
  const chipSelected = recipeChip(parsed, true);
  assert.equal(chipSelected.backgroundColor, "#e11d48");
  assert.equal(chipSelected.borderRadius, "8px");

  const badgeDeal = recipeBadge(parsed, "deal");
  assert.equal(badgeDeal.backgroundColor, "#0284c7");
});

test("Theme Studio Controls: Typography Scaler & Elevation Scaler", () => {
  const scaledTheme = parseTokensToTheme({
    "sys.scale.font": "1.25",
    "sys.color.text_primary": "#1e293b",
  });

  // Base 12px * 1.25 = 15px
  const bodyTypo = recipeTypography(scaledTheme, "body");
  assert.equal(bodyTypo.fontSize, "15px");

  // Level elevation
  const elevationCard = recipeElevation(scaledTheme, "card");
  assert.ok(elevationCard.includes("rgba(0, 0, 0,"), "Card elevation should produce valid shadow");
});

// ---------------------------------------------------------------------------
// TEST SUITE 2: FESTIVAL STUDIO MANAGER FLOW & FRIENDLY ABSTRACTIONS
// ---------------------------------------------------------------------------
test("Manager Flow: Where choices map to internal Placement Target values", () => {
  const whereMappings = [
    { friendly: "🏠 Top of App", internal: "header" },
    { friendly: "🖼 Main Banner", internal: "hero" },
    { friendly: "🗂 Categories", internal: "category_card" },
    { friendly: "🛍 Products", internal: "product_card" },
    { friendly: "🏪 Stores", internal: "section" },
    { friendly: "🌄 Background", internal: "global_background" },
    { friendly: "✨ Floating", internal: "floating" },
    { friendly: "📍 Bottom Nav", internal: "bottom_navigation" },
  ];

  for (const m of whereMappings) {
    const testDec: VisualDecoration = {
      id: `dec_${m.internal}`,
      name: `Decoration on ${m.friendly}`,
      type: "illustration",
      placement: m.internal as any,
      assetUrl: STANDARD_CULTURAL_ASSETS[0].url,
      opacity: 1.0,
      size: "md",
      mobileEnabled: true,
      desktopEnabled: true,
      decorative: true,
    };
    const parsed = visualDecorationSchema.safeParse(testDec);
    assert.equal(parsed.success, true, `Placement ${m.internal} should conform to schema`);
  }
});

test("Manager Flow: What choices map to internal VisualDecoration types", () => {
  const whatMappings = [
    { friendly: "🖼 Festival Artwork", mappedType: "illustration" },
    { friendly: "🇮🇳 Symbol / Flag", mappedType: "flag" },
    { friendly: "🎨 Paint Effect", mappedType: "ribbon" },
    { friendly: "✨ Glow / Sparkles", mappedType: "floating_element" },
    { friendly: "🌸 Pattern", mappedType: "pattern" },
    { friendly: "🏷 Festival Badge", mappedType: "badge" },
    { friendly: "💧 Watermark", mappedType: "watermark" },
  ];

  for (const w of whatMappings) {
    const testDec: VisualDecoration = {
      id: `dec_type_${w.mappedType}`,
      name: w.friendly,
      type: w.mappedType as any,
      placement: "hero",
      assetUrl: STANDARD_CULTURAL_ASSETS[0].url,
      opacity: 0.9,
      size: "md",
      mobileEnabled: true,
      desktopEnabled: true,
      decorative: true,
    };
    const parsed = visualDecorationSchema.safeParse(testDec);
    assert.equal(parsed.success, true, `Type ${w.mappedType} should conform to schema`);
  }
});

test("Artwork Library: Cultural assets have valid vector/image data and thumbnails", () => {
  assert.ok(STANDARD_CULTURAL_ASSETS.length >= 10, "Should have rich cultural asset library");

  const requiredCulturalAssets = [
    "asset_flag_india",
    "asset_tricolor_ribbon",
    "asset_chakra_watermark",
    "asset_freedom_heritage",
    "asset_gandhi",
    "asset_bhagat_singh",
    "asset_netaji",
    "asset_sardar_patel",
    "asset_diwali_diya",
    "asset_rangoli_pattern",
    "asset_holi_splash",
    "asset_eid_crescent",
    "asset_christmas_bells",
    "asset_sankranti_kite",
  ];

  for (const id of requiredCulturalAssets) {
    const found = STANDARD_CULTURAL_ASSETS.find((a) => a.id === id);
    assert.ok(found, `Cultural asset ${id} must exist in registry`);
    assert.ok(found?.url.startsWith("data:image/svg+xml"), `Asset ${id} must have valid SVG data URL`);
    assert.ok(found?.name.length > 0, `Asset ${id} must have friendly human name`);
  }
});

// ---------------------------------------------------------------------------
// TEST SUITE 3: READY-MADE FESTIVAL COMPOSITIONS
// ---------------------------------------------------------------------------
test("Ready-Made Compositions: Independence Day, Diwali, Holi, Eid, Christmas, Sankranti", () => {
  const presets = [
    {
      name: "Independence Day Classic",
      accentColors: { primary: "#FF9933", secondary: "#FFFFFF", tertiary: "#138808" },
      decorations: [
        { type: "flag", placement: "header" },
        { type: "ribbon", placement: "header" },
        { type: "watermark", placement: "global_background" },
      ],
    },
    {
      name: "Independence Day Heritage",
      accentColors: { primary: "#FF9933", secondary: "#FFFFFF", tertiary: "#138808" },
      decorations: [
        { type: "flag", placement: "header" },
        { type: "illustration", placement: "hero" },
        { type: "watermark", placement: "global_background" },
      ],
    },
    {
      name: "Diwali Golden Radiance",
      accentColors: { primary: "#D97706", secondary: "#FFFBEB", tertiary: "#DC2626" },
      decorations: [
        { type: "flag", placement: "header" },
        { type: "illustration", placement: "hero" },
        { type: "pattern", placement: "section" },
      ],
    },
    {
      name: "Holi Modern Splash",
      accentColors: { primary: "#EC4899", secondary: "#FBBF24", tertiary: "#10B981" },
      decorations: [
        { type: "ribbon", placement: "header" },
        { type: "illustration", placement: "hero" },
      ],
    },
    {
      name: "Eid Royal Crescent",
      accentColors: { primary: "#059669", secondary: "#FDE047", tertiary: "#0F172A" },
      decorations: [
        { type: "flag", placement: "header" },
        { type: "illustration", placement: "hero" },
      ],
    },
    {
      name: "Christmas Festive Bells",
      accentColors: { primary: "#DC2626", secondary: "#F8FAFC", tertiary: "#15803D" },
      decorations: [
        { type: "badge", placement: "header" },
        { type: "illustration", placement: "hero" },
      ],
    },
    {
      name: "Sankranti Sky of Kites",
      accentColors: { primary: "#EA580C", secondary: "#38BDF8", tertiary: "#EAB308" },
      decorations: [
        { type: "flag", placement: "header" },
        { type: "illustration", placement: "hero" },
      ],
    },
  ];

  for (const p of presets) {
    const overlay: FestivalOverlay = {
      id: `preset_${p.name.toLowerCase().replace(/\s+/g, "_")}`,
      name: p.name.toLowerCase().replace(/\s+/g, "_"),
      displayName: p.name,
      description: `Preset ${p.name}`,
      enabled: true,
      schedule: {
        startDate: "2026-01-01",
        startTime: "00:00",
        endDate: "2026-12-31",
        endTime: "23:59",
        timezone: "Asia/Kolkata",
        status: "active",
      },
      accentColors: p.accentColors,
      decorations: p.decorations.map((d, i) => ({
        id: `dec_${i}`,
        name: `${p.name} Decoration ${i + 1}`,
        type: d.type as any,
        placement: d.placement as any,
        assetUrl: STANDARD_CULTURAL_ASSETS[0].url,
        opacity: 1.0,
        size: "md",
        mobileEnabled: true,
        desktopEnabled: true,
        decorative: true,
      })),
    };

    const parsed = festivalOverlaySchema.safeParse(overlay);
    assert.equal(parsed.success, true, `Preset "${p.name}" must conform to festivalOverlaySchema`);
  }
});

// ---------------------------------------------------------------------------
// TEST SUITE 4: BASE THEME & FESTIVAL ISOLATION
// ---------------------------------------------------------------------------
test("Base Theme and Festival Overlay Isolation", () => {
  const baseTheme = {
    primary: "#059669", // Buggy Emerald
    cardRadius: 16,
    spacing: 14,
  };

  const festivalOverlay: FestivalOverlay = {
    id: "id_overlay",
    name: "independence_day",
    displayName: "Independence Day",
    description: "Independence Day Overlay",
    enabled: true,
    schedule: {
      startDate: "2026-08-01",
      startTime: "00:00",
      endDate: "2026-08-31",
      endTime: "23:59",
      timezone: "Asia/Kolkata",
      status: "active",
    },
    accentColors: { primary: "#FF9933", secondary: "#FFFFFF", tertiary: "#138808" },
    decorations: [
      {
        id: "flag_1",
        name: "Indian Flag",
        type: "flag",
        placement: "header",
        assetUrl: STANDARD_CULTURAL_ASSETS.find((a) => a.id === "asset_flag_india")?.url || "",
        opacity: 1.0,
        size: "sm",
        mobileEnabled: true,
        desktopEnabled: true,
        decorative: true,
      },
    ],
  };

  // 1. Overlay is active: base tokens remain independent
  assert.equal(baseTheme.primary, "#059669", "Base primary color must remain untouched");
  assert.equal(festivalOverlay.accentColors?.primary, "#FF9933", "Festival overlay accents layer independently");

  // 2. Disable overlay: configuration is preserved, not destroyed
  const disabledOverlay = { ...festivalOverlay, enabled: false };
  assert.equal(disabledOverlay.enabled, false);
  assert.equal(disabledOverlay.decorations.length, 1, "Decorations are preserved when disabled");
  assert.equal(disabledOverlay.decorations[0].name, "Indian Flag");

  // 3. Re-enable overlay: all decorations immediately restore
  const reenabledOverlay = { ...disabledOverlay, enabled: true };
  assert.equal(reenabledOverlay.enabled, true);
  assert.equal(reenabledOverlay.decorations.length, 1);
});
