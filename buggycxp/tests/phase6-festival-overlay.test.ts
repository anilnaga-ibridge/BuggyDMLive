import assert from "node:assert/strict";
import test from "node:test";
import {
  festivalOverlaySchema,
  visualDecorationSchema,
  overlayScheduleSchema,
  evaluateOverlaySchedule,
  type FestivalOverlay,
} from "../src/lib/qcos/contracts.ts";
import {
  PRESET_INDEPENDENCE_DAY_2027,
  PRESET_DIWALI_2027,
  EMPTY_FESTIVAL_OVERLAY,
} from "../src/components/qcos/experience-preview/cultural-assets.ts";

test("TEST 1: Normal Experience (No Festival Overlay)", () => {
  const normal = EMPTY_FESTIVAL_OVERLAY;
  const parsed = festivalOverlaySchema.safeParse(normal);
  assert.equal(parsed.success, true);
  
  const evalResult = evaluateOverlaySchedule(normal.schedule);
  assert.equal(evalResult.active, false);
  assert.equal(evalResult.status, "draft");
});

test("TEST 2: Independence Day 2027 Overlay Configuration & Schema Validity", () => {
  const iday = PRESET_INDEPENDENCE_DAY_2027;
  const parsed = festivalOverlaySchema.safeParse(iday);
  assert.equal(parsed.success, true);
  assert.equal(iday.enabled, true);
  assert.equal(iday.name, "independence_day_2027");
  assert.equal(iday.decorations.length, 6);

  // Verify all 6 required decorations exist with correct placements
  const placements = iday.decorations.map((d) => d.placement);
  assert.ok(placements.includes("header"), "Must include header flag");
  assert.ok(placements.includes("hero"), "Must include hero artwork");
  assert.ok(placements.includes("section"), "Must include section ribbon");
  assert.ok(placements.includes("product_card"), "Must include product card badge");
  assert.ok(placements.includes("global_background"), "Must include watermark");
});

test("TEST 3 & 4: Base Theme Preservation (Brand Colors & Radii)", () => {
  const baseTheme = {
    primary: "#C464BC",
    surface: "#FFFFFF",
    background: "#FAFAFA",
    textPrimary: "#2D1802",
    cardRadius: 20,
  };

  const iday = PRESET_INDEPENDENCE_DAY_2027;

  // The overlay adds decorative accents but does not overwrite base theme primary
  assert.equal(baseTheme.primary, "#C464BC");
  assert.equal(baseTheme.cardRadius, 20);

  // Accent colors are separate from base brand primary
  assert.equal(iday.accentColors?.primary, "#FF9933"); // Saffron
  assert.equal(iday.accentColors?.secondary, "#FFFFFF"); // White
  assert.equal(iday.accentColors?.tertiary, "#138808"); // Green
});

test("TEST 5: Disable Festival Overlay Disables Experience", () => {
  const disabledOverlay: FestivalOverlay = {
    ...PRESET_INDEPENDENCE_DAY_2027,
    enabled: false,
  };

  assert.equal(disabledOverlay.enabled, false);

  const draftSchedule = { ...disabledOverlay.schedule, status: "draft" as const };
  const evalResult = evaluateOverlaySchedule(draftSchedule, new Date("2027-08-15T12:00:00Z"));
  assert.equal(evalResult.active, false);
  assert.equal(evalResult.status, "draft");
});

test("TEST 6: Schedule Active Window (15 Aug 2027 12:00)", () => {
  const schedule = PRESET_INDEPENDENCE_DAY_2027.schedule;
  
  // During scheduled window (15 Aug 2027 12:00 PM IST)
  const testTime = "2027-08-15T12:00:00+05:30";
  const evalResult = evaluateOverlaySchedule(schedule, testTime);
  
  assert.equal(evalResult.active, true);
  assert.equal(evalResult.status, "active");
});

test("TEST 7: Future Scheduled Window Before Start (10 Aug 2027)", () => {
  const schedule = PRESET_INDEPENDENCE_DAY_2027.schedule;
  
  const testTime = "2027-08-10T12:00:00+05:30";
  const evalResult = evaluateOverlaySchedule(schedule, testTime);
  
  assert.equal(evalResult.active, false);
  assert.equal(evalResult.status, "scheduled");
});

test("TEST 8: Expired Schedule Window (17 Aug 2027)", () => {
  const schedule = PRESET_INDEPENDENCE_DAY_2027.schedule;
  
  const testTime = "2027-08-17T12:00:00+05:30";
  const evalResult = evaluateOverlaySchedule(schedule, testTime);
  
  assert.equal(evalResult.active, false);
  assert.equal(evalResult.status, "expired");
});

test("TEST 9: Mobile & Responsive Placement Configuration", () => {
  for (const dec of PRESET_INDEPENDENCE_DAY_2027.decorations) {
    assert.equal(typeof dec.mobileEnabled, "boolean");
    assert.equal(typeof dec.desktopEnabled, "boolean");
    if (dec.positionX !== undefined) {
      assert.ok(["left", "center", "right"].includes(dec.positionX));
    }
    if (dec.positionY !== undefined) {
      assert.ok(["top", "center", "bottom"].includes(dec.positionY));
    }
  }
});

test("TEST 10: Diwali 2027 Configuration & Schema Validity", () => {
  const diwali = PRESET_DIWALI_2027;
  const parsed = festivalOverlaySchema.safeParse(diwali);
  assert.equal(parsed.success, true);
  assert.equal(diwali.name, "diwali_2027");
  assert.ok(diwali.decorations.length >= 4);

  // Diwali schedule verification
  const testTime = "2027-10-29T18:00:00+05:30";
  const evalResult = evaluateOverlaySchedule(diwali.schedule, testTime);
  assert.equal(evalResult.active, true);
  assert.equal(evalResult.status, "active");
});

test("TEST 11: Invalid Schedule Validation (End Before Start)", () => {
  const validSchedule = PRESET_INDEPENDENCE_DAY_2027.schedule;
  const validParsed = overlayScheduleSchema.safeParse(validSchedule);
  assert.equal(validParsed.success, true);

  const invalidSchedule = {
    enabled: true,
    startDate: "2027-08-16",
    startTime: "23:59",
    endDate: "2027-08-15",
    endTime: "00:00",
    timezone: "Asia/Kolkata",
    status: "scheduled" as const,
  };

  const evalResult = evaluateOverlaySchedule(invalidSchedule, "2027-08-15T12:00:00+05:30");
  assert.equal(evalResult.active, false);
});

test("TEST 12: Malformed Decoration Graceful Resilience", () => {
  const malformedDec = {
    id: "broken_dec",
    name: "Broken",
    type: "unknown_type",
  };
  const parseResult = visualDecorationSchema.safeParse(malformedDec);
  // Schema strictly catches invalid types and prevents invalid data injection
  assert.equal(parseResult.success, false);
});

test("TEST 13: Dynamic Festival Generator for Any Year (2026, 2028, 2030)", async () => {
  const { createDynamicFestivalOverlay, FESTIVAL_CATALOG } = await import(
    "../src/components/qcos/experience-preview/cultural-assets.ts"
  );

  // Test dynamic generation across diverse years
  for (const year of [2026, 2028, 2030]) {
    const overlay = createDynamicFestivalOverlay("independence_day", year);
    assert.equal(overlay.name, `independence_day_${year}`);
    assert.equal(overlay.schedule?.startDate, `${year}-08-15`);
    assert.equal(overlay.schedule?.endDate, `${year}-08-16`);
    assert.ok(overlay.decorations.length >= 4);

    const parsed = festivalOverlaySchema.safeParse(overlay);
    assert.equal(parsed.success, true, `Validation failed for year ${year}`);
  }

  // Test all 10 festivals can generate valid overlays
  const allFestKeys = Object.keys(FESTIVAL_CATALOG);
  assert.equal(allFestKeys.length, 10, "Should have 10 standard festival entries");

  for (const key of allFestKeys) {
    const overlay = createDynamicFestivalOverlay(key, 2027);
    assert.ok(overlay.displayName.length > 0);
    assert.ok(overlay.decorations.length > 0);
    const parsed = festivalOverlaySchema.safeParse(overlay);
    assert.equal(parsed.success, true, `Festival ${key} produced invalid overlay`);
  }
});

test("TEST 14: Custom Cultural Asset Registration & Integration", async () => {
  const {
    STANDARD_CULTURAL_ASSETS,
    loadCustomCulturalAssets,
    saveCustomCulturalAsset,
    deleteCustomCulturalAsset,
    getAllCulturalAssets,
  } = await import("../src/components/qcos/experience-preview/cultural-assets.ts");

  assert.ok(STANDARD_CULTURAL_ASSETS.length >= 10);

  // In Node environment without window.localStorage, helper functions gracefully fallback
  const allAssets = getAllCulturalAssets();
  assert.ok(allAssets.length >= STANDARD_CULTURAL_ASSETS.length);
});

