import test from "node:test";
import assert from "node:assert/strict";
import {
  createEmptyFestivalTheme,
  DEFAULT_FESTIVAL_PERMISSIONS,
  type FestivalTheme,
} from "../src/lib/qcos/festival-theme/types.ts";
import { resolveFestivalTheme, isFestivalScheduleActive } from "../src/lib/qcos/festival-theme/resolver.ts";
import { sanitizeSvgContent, validateAssetUpload, festivalThemeSchema } from "../src/lib/qcos/festival-theme/schema.ts";
import { parseTokensToTheme, type ParsedThemeTokens } from "../src/components/qcos/experience-preview/preview-theme.ts";

const MOCK_BASE_TOKENS: ParsedThemeTokens = parseTokensToTheme({
  "sys.color.primary": "#039d55",
  "sys.color.secondary": "#ff9900",
  "sys.color.accent": "#ffd700",
  "sys.color.background": "#f7fbfa",
  "sys.color.surface": "#ffffff",
  "sys.color.text_primary": "#1e293b",
  "sys.color.text_secondary": "#475569",
  "sys.shape.card_radius": "20px",
  "sys.shape.button_radius": "14px",
  "sys.typography.scale": "1",
});

// -------------------------------------------------------------
// TEST 1: Admin Creates Festival From Scratch (No Hardcoding)
// -------------------------------------------------------------
test("TEST 1: Admin Creates Blank Festival Theme with Zero Hardcoded Presets", () => {
  const festival = createEmptyFestivalTheme("Custom Festival 2027", 2027);

  assert.equal(festival.name, "Custom Festival 2027");
  assert.equal(festival.year, 2027);
  assert.equal(festival.status, "draft");

  // All permissions must default to OFF
  assert.equal(festival.permissions.design.colors, false);
  assert.equal(festival.permissions.design.backgrounds, false);
  assert.equal(festival.permissions.design.fontFamily, false);
  assert.equal(festival.permissions.components.productCards, false);
  assert.equal(festival.permissions.visuals.watermarks, false);

  const validated = festivalThemeSchema.safeParse(festival);
  assert.equal(validated.success, true, "Created festival must pass schema validation");
});

// -------------------------------------------------------------
// TEST 2: Permission Gating & Fallback to Base Theme
// -------------------------------------------------------------
test("TEST 2: Disabled Permissions Fallback to Base CXP Theme", () => {
  const festival = createEmptyFestivalTheme("Diwali 2027", 2027);
  festival.status = "published";
  festival.colors = {
    primaryAction: { enabled: true, color: "#c8acc6" },
  };

  // 1. Permission is OFF
  festival.permissions.design.colors = false;
  const expDisabled = resolveFestivalTheme(MOCK_BASE_TOKENS, festival, { forcePreviewActive: true });
  assert.equal(expDisabled.resolvedTokens.primary, "#039d55", "Should retain base primary when permission is OFF");

  // 2. Permission is ON
  festival.permissions.design.colors = true;
  const expEnabled = resolveFestivalTheme(MOCK_BASE_TOKENS, festival, { forcePreviewActive: true });
  assert.equal(expEnabled.resolvedTokens.primary, "#c8acc6", "Should apply override when permission is ON");
});

// -------------------------------------------------------------
// TEST 3: Granular Color Permissions
// -------------------------------------------------------------
test("TEST 3: Granular Color Overrides & Targets", () => {
  const festival = createEmptyFestivalTheme("Independence Celebration", 2027);
  festival.status = "published";
  festival.permissions.design.colors = true;

  festival.colors = {
    primaryAction: { enabled: true, color: "#FF9933" },
    secondaryAccent: { enabled: true, color: "#138808" },
    accentHighlight: { enabled: true, color: "#000080" },
    surface: { enabled: true, color: "#FAFAFA" },
    appBackground: { enabled: true, color: "#FFFFFF" },
  };

  const exp = resolveFestivalTheme(MOCK_BASE_TOKENS, festival, { forcePreviewActive: true });
  assert.equal(exp.resolvedTokens.primary, "#FF9933");
  assert.equal(exp.resolvedTokens.secondary, "#138808");
  assert.equal(exp.resolvedTokens.accent, "#000080");
  assert.equal(exp.resolvedTokens.surface, "#FAFAFA");
  assert.equal(exp.resolvedTokens.background, "#FFFFFF");
});

// -------------------------------------------------------------
// TEST 4: Typography & Font Family Permissions
// -------------------------------------------------------------
test("TEST 4: Typography and Font Family Overrides", () => {
  const festival = createEmptyFestivalTheme("Royal Festival", 2027);
  festival.status = "published";
  festival.permissions.design.fontFamily = true;
  festival.permissions.design.fontScale = true;

  festival.typography = {
    fontFamily: "'Poppins', sans-serif",
    fontScale: 1.15,
    roles: {
      price: { enabled: true, fontSize: 18, fontWeight: 700 },
      h1: { enabled: true, fontSize: 24, fontWeight: 800 },
    },
  };

  const exp = resolveFestivalTheme(MOCK_BASE_TOKENS, festival, { forcePreviewActive: true });
  assert.equal(exp.customFontFamily, "'Poppins', sans-serif");
  assert.equal(exp.fontScale, 1.15);
});

// -------------------------------------------------------------
// TEST 5: Background Overrides per Scope
// -------------------------------------------------------------
test("TEST 5: Scoped Background Overrides", () => {
  const festival = createEmptyFestivalTheme("Summer Gala", 2027);
  festival.status = "published";
  festival.permissions.design.backgrounds = true;

  festival.backgrounds = [
    {
      scope: "HERO",
      enabled: true,
      type: "gradient",
      gradientFrom: "#4a0e17",
      gradientTo: "#cdcac1",
      opacity: 1.0,
    },
    {
      scope: "CATEGORIES",
      enabled: true,
      type: "color",
      color: "#FFF5EB",
      opacity: 0.9,
    },
  ];

  const exp = resolveFestivalTheme(MOCK_BASE_TOKENS, festival, { forcePreviewActive: true });
  assert.ok(exp.backgrounds.HERO, "Hero background must be present");
  assert.equal(exp.backgrounds.HERO?.gradientFrom, "#4a0e17");
  assert.ok(exp.backgrounds.CATEGORIES, "Categories background must be present");
  assert.equal(exp.backgrounds.CATEGORIES?.color, "#FFF5EB");
});

// -------------------------------------------------------------
// TEST 6: Watermarks & Non-Blocking Guarantee
// -------------------------------------------------------------
test("TEST 6: Watermark Placement & Non-Blocking Rules", () => {
  const festival = createEmptyFestivalTheme("Winter Festival", 2027);
  festival.status = "published";
  festival.permissions.visuals.watermarks = true;

  festival.watermarks = [
    {
      id: "wm_canvas",
      name: "Background Emblem",
      enabled: true,
      scope: "GLOBAL",
      assetUrl: "https://example.com/emblem.svg",
      position: "bottom-right",
      size: "lg",
      opacity: 0.12,
      mobileEnabled: true,
      desktopEnabled: true,
      nonBlocking: true,
    },
  ];

  const exp = resolveFestivalTheme(MOCK_BASE_TOKENS, festival, { forcePreviewActive: true });
  assert.equal(exp.watermarks.length, 1);
  assert.equal(exp.watermarks[0].nonBlocking, true);
  assert.equal(exp.watermarks[0].opacity, 0.12);
});

// -------------------------------------------------------------
// TEST 7: Component Style Overrides
// -------------------------------------------------------------
test("TEST 7: Component Style Overrides (Product Card & Buttons)", () => {
  const festival = createEmptyFestivalTheme("Mega Sale Festival", 2027);
  festival.status = "published";
  festival.permissions.components.productCards = true;
  festival.permissions.components.buttons = true;

  festival.components = {
    productCard: {
      enabled: true,
      backgroundColor: "#18181b",
      borderRadius: 24,
      addButtonBg: "#f43f5e",
      addButtonColor: "#ffffff",
    },
    button: {
      enabled: true,
      primaryBg: "#f43f5e",
      borderRadius: 16,
    },
  };

  const exp = resolveFestivalTheme(MOCK_BASE_TOKENS, festival, { forcePreviewActive: true });
  assert.ok(exp.productCardOverride?.enabled);
  assert.equal(exp.productCardOverride?.backgroundColor, "#18181b");
  assert.equal(exp.productCardOverride?.borderRadius, 24);
  assert.ok(exp.buttonOverride?.enabled);
  assert.equal(exp.buttonOverride?.primaryBg, "#f43f5e");
});

// -------------------------------------------------------------
// TEST 8: Base CXP Theme Immutability & Schedule Expiry
// -------------------------------------------------------------
test("TEST 8: Base Theme Immutability & Automatic Expiry Resolution", () => {
  const originalPrimary = MOCK_BASE_TOKENS.primary;

  const festival = createEmptyFestivalTheme("Autumn Fest", 2027);
  festival.status = "published";
  festival.schedule = {
    startDate: "2027-10-01",
    startTime: "00:00",
    endDate: "2027-10-15",
    endTime: "23:59",
    timezone: "Asia/Kolkata",
  };
  festival.permissions.design.colors = true;
  festival.colors = {
    primaryAction: { enabled: true, color: "#d97706" },
  };

  // 1. During festival (2027-10-05) -> Active
  const activeExp = resolveFestivalTheme(MOCK_BASE_TOKENS, festival, { evaluationDate: "2027-10-05T12:00:00" });
  assert.equal(activeExp.isActive, true);
  assert.equal(activeExp.resolvedTokens.primary, "#d97706");

  // 2. After festival (2027-10-20) -> Inactive, reverts to Base Theme
  const expiredExp = resolveFestivalTheme(MOCK_BASE_TOKENS, festival, { evaluationDate: "2027-10-20T12:00:00" });
  assert.equal(expiredExp.isActive, false);
  assert.equal(expiredExp.resolvedTokens.primary, originalPrimary);

  // 3. Confirm base token object itself was never mutated
  assert.equal(MOCK_BASE_TOKENS.primary, originalPrimary);
});

// -------------------------------------------------------------
// TEST 9: SVG Security Sanitization & Upload Validation
// -------------------------------------------------------------
test("TEST 9: SVG Sanitization and Asset Upload Security", () => {
  const maliciousSvg = `<svg xmlns="http://www.w3.org/2000/svg" onload="alert('xss')">
    <script>alert('hack')</script>
    <a href="javascript:void(0)">Link</a>
    <circle cx="50" cy="50" r="40" fill="red" />
  </svg>`;

  const sanitized = sanitizeSvgContent(maliciousSvg);
  assert.equal(sanitized.includes("<script>"), false, "Must strip script tags");
  assert.equal(sanitized.includes("onload="), false, "Must strip event handlers");
  assert.equal(sanitized.includes("javascript:"), false, "Must strip javascript hrefs");
  assert.ok(sanitized.includes("<circle"), "Must preserve safe visual elements");

  // Asset validation
  const validFile = { name: "banner.png", type: "image/png", size: 500 * 1024 };
  const invalidFile = { name: "script.exe", type: "application/x-msdownload", size: 100 };
  const oversizedFile = { name: "huge.jpg", type: "image/jpeg", size: 5 * 1024 * 1024 };

  assert.equal(validateAssetUpload(validFile).valid, true);
  assert.equal(validateAssetUpload(invalidFile).valid, false);
  assert.equal(validateAssetUpload(oversizedFile).valid, false);
});

// -------------------------------------------------------------
// TEST 10: Canvas Background and Hero Gradient Direct Permission Resolution
// -------------------------------------------------------------
test("TEST 10: Canvas Color and Hero Gradient Resolve with Backgrounds Permission", () => {
  const festival = createEmptyFestivalTheme("New Festive Campaign", 2026);
  festival.permissions.design.backgrounds = true;
  festival.permissions.design.gradients = true;
  festival.colors = {
    appBackground: { enabled: true, color: "#a24e4e" },
    surfaceElevated: { enabled: true, color: "#f8fafc" },
    heroGradientStart: { enabled: true, color: "#4a0e17" },
    heroGradientEnd: { enabled: true, color: "#cdcac1" },
  };

  const exp = resolveFestivalTheme(MOCK_BASE_TOKENS, festival, { forcePreviewActive: true });
  assert.equal(exp.resolvedTokens.background, "#a24e4e");
  assert.equal(exp.resolvedTokens.surfaceElevated, "#f8fafc");
  assert.equal(exp.resolvedTokens.gradientFrom, "#4a0e17");
  assert.equal(exp.resolvedTokens.gradientTo, "#cdcac1");
});

// -------------------------------------------------------------
// TEST 11: Remote Automated Schedule Lifecycle (Scheduled -> Active -> Auto-Expiry)
// -------------------------------------------------------------
test("TEST 11: Remote Automated Campaign Lifecycle (Before Start -> Active Window -> After Expiry)", () => {
  const diwali = createEmptyFestivalTheme("Diwali 2026", 2026);
  diwali.status = "published";
  diwali.schedule = {
    startDate: "2026-10-20",
    startTime: "00:00",
    endDate: "2026-10-25",
    endTime: "23:59",
    timezone: "Asia/Kolkata",
    priority: 10,
    status: "active",
  };
  diwali.permissions.design.colors = true;
  diwali.colors = {
    primaryAction: { enabled: true, color: "#9333EA" }, // Purple
    secondaryAccent: { enabled: true, color: "#EAB308" }, // Gold
  };

  // 1. Before Festival: 19-Oct-2026 23:59:59 -> Base Theme (Inactive)
  const beforeExp = resolveFestivalTheme(MOCK_BASE_TOKENS, diwali, { evaluationDate: "2026-10-19T23:59:59" });
  assert.equal(beforeExp.isActive, false, "Must be inactive before start date/time");
  assert.equal(beforeExp.resolvedTokens.primary, MOCK_BASE_TOKENS.primary, "Must serve base theme before start");

  // 2. Festival Active Window: 20-Oct-2026 00:00:01 -> Diwali Theme (Active)
  const activeExp = resolveFestivalTheme(MOCK_BASE_TOKENS, diwali, { evaluationDate: "2026-10-20T00:00:01" });
  assert.equal(activeExp.isActive, true, "Must automatically activate at start time");
  assert.equal(activeExp.resolvedTokens.primary, "#9333EA", "Must apply Diwali purple primary");
  assert.equal(activeExp.resolvedTokens.secondary, "#EAB308", "Must apply Diwali gold secondary");

  // 3. After Expiry: 26-Oct-2026 00:00:01 -> Base Theme Automatically Restored
  const expiredExp = resolveFestivalTheme(MOCK_BASE_TOKENS, diwali, { evaluationDate: "2026-10-26T00:00:01" });
  assert.equal(expiredExp.isActive, false, "Must automatically expire after end date/time");
  assert.equal(expiredExp.resolvedTokens.primary, MOCK_BASE_TOKENS.primary, "Base theme must return with zero code changes");
});
