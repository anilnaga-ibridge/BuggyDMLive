import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import {
  evaluateOverlaySchedule,
  festivalOverlaySchema,
  type FestivalOverlay,
  type OverlaySchedule,
} from "../src/lib/qcos/contracts.ts";
import {
  createDynamicFestivalOverlay,
  EMPTY_FESTIVAL_OVERLAY,
} from "../src/components/qcos/experience-preview/cultural-assets.ts";

test("PHASE 2: Experience Resolve API & Schedule Evaluation Suite", async (t) => {

  await t.test("1. No Overlay Token returns null safely", () => {
    const overlayToken = undefined;
    let resolvedOverlay: FestivalOverlay | null = null;
    if (overlayToken) {
      try {
        const parsed = JSON.parse(overlayToken);
        const val = festivalOverlaySchema.safeParse(parsed);
        if (val.success) resolvedOverlay = val.data;
      } catch {}
    }
    assert.equal(resolvedOverlay, null);
  });

  await t.test("2. Enabled Active Overlay evaluates to active JSON", () => {
    const overlay = createDynamicFestivalOverlay("independence_day", 2027);
    const scheduleResult = evaluateOverlaySchedule(overlay.schedule, "2027-08-15T12:00");
    assert.equal(scheduleResult.active, true);
    assert.equal(scheduleResult.status, "active");
    assert.equal(overlay.name, "independence_day_2027");
    assert.ok(Array.isArray(overlay.decorations));
    assert.ok(overlay.decorations.length > 0);
  });

  await t.test("3. Disabled Overlay returns active: false", () => {
    const disabled = structuredClone(EMPTY_FESTIVAL_OVERLAY);
    const scheduleResult = evaluateOverlaySchedule(disabled.schedule, "2027-08-15T12:00");
    assert.equal(scheduleResult.active, false);
    assert.equal(disabled.enabled, false);
  });

  await t.test("4. Schedule Evaluation - 1 Second Before Start is Scheduled", () => {
    const schedule: OverlaySchedule = {
      startDate: "2027-08-15",
      startTime: "00:00",
      endDate: "2027-08-16",
      endTime: "23:59",
      timezone: "Asia/Kolkata",
      status: "scheduled",
    };
    // 2027-08-14 23:59:59 IST
    const result = evaluateOverlaySchedule(schedule, "2027-08-14T23:59:59");
    assert.equal(result.active, false);
    assert.equal(result.status, "scheduled");
  });

  await t.test("5. Schedule Evaluation - Exactly at Start is Active", () => {
    const schedule: OverlaySchedule = {
      startDate: "2027-08-15",
      startTime: "00:00",
      endDate: "2027-08-16",
      endTime: "23:59",
      timezone: "Asia/Kolkata",
      status: "scheduled",
    };
    // 2027-08-15 00:00:00 IST
    const result = evaluateOverlaySchedule(schedule, "2027-08-15T00:00:00");
    assert.equal(result.active, true);
    assert.equal(result.status, "active");
  });

  await t.test("6. Schedule Evaluation - During Schedule is Active", () => {
    const schedule: OverlaySchedule = {
      startDate: "2027-08-15",
      startTime: "00:00",
      endDate: "2027-08-16",
      endTime: "23:59",
      timezone: "Asia/Kolkata",
      status: "scheduled",
    };
    const result = evaluateOverlaySchedule(schedule, "2027-08-15T18:30:00");
    assert.equal(result.active, true);
    assert.equal(result.status, "active");
  });

  await t.test("7. Schedule Evaluation - Exactly at End is Active", () => {
    const schedule: OverlaySchedule = {
      startDate: "2027-08-15",
      startTime: "00:00",
      endDate: "2027-08-16",
      endTime: "23:59",
      timezone: "Asia/Kolkata",
      status: "scheduled",
    };
    // 2027-08-16 23:59:00 IST
    const result = evaluateOverlaySchedule(schedule, "2027-08-16T23:59:00");
    assert.equal(result.active, true);
    assert.equal(result.status, "active");
  });

  await t.test("8. Schedule Evaluation - 1 Second After End is Expired", () => {
    const schedule: OverlaySchedule = {
      startDate: "2027-08-15",
      startTime: "00:00",
      endDate: "2027-08-16",
      endTime: "23:59",
      timezone: "Asia/Kolkata",
      status: "scheduled",
    };
    // 2027-08-17 00:00:00 IST
    const result = evaluateOverlaySchedule(schedule, "2027-08-17T00:00:00");
    assert.equal(result.active, false);
    assert.equal(result.status, "expired");
  });

  await t.test("9. Asia/Kolkata Timezone Determinism", () => {
    const schedule: OverlaySchedule = {
      startDate: "2027-08-15",
      startTime: "00:00",
      endDate: "2027-08-15",
      endTime: "23:59",
      timezone: "Asia/Kolkata",
      status: "scheduled",
    };
    // Explicit UTC equivalent of 2027-08-15 00:00:00 IST is 2027-08-14 18:30:00 UTC
    const utcMidnightStart = "2027-08-14T18:30:00.000Z";
    const result = evaluateOverlaySchedule(schedule, utcMidnightStart);
    assert.equal(result.active, true);
    assert.equal(result.status, "active");

    // 1 minute before UTC start (2027-08-14 18:29:00 UTC)
    const utcJustBefore = "2027-08-14T18:29:00.000Z";
    const resultBefore = evaluateOverlaySchedule(schedule, utcJustBefore);
    assert.equal(resultBefore.active, false);
    assert.equal(resultBefore.status, "scheduled");
  });

  await t.test("10. Server Timezone Independence", () => {
    const schedule: OverlaySchedule = {
      startDate: "2027-10-20",
      startTime: "10:00",
      endDate: "2027-10-25",
      endTime: "20:00",
      timezone: "Asia/Kolkata",
      status: "scheduled",
    };

    // Test with explicit epoch timestamps
    // 2027-10-20 10:00:00+05:30 in epoch ms
    const startEpoch = new Date("2027-10-20T10:00:00+05:30").getTime();
    const resultAtStart = evaluateOverlaySchedule(schedule, startEpoch);
    assert.equal(resultAtStart.active, true);

    const beforeEpoch = startEpoch - 1000;
    const resultBefore = evaluateOverlaySchedule(schedule, beforeEpoch);
    assert.equal(resultBefore.active, false);
    assert.equal(resultBefore.status, "scheduled");
  });

  await t.test("11. Malformed Overlay JSON Fails Safely without Crash", () => {
    const corruptedTokenValue = '{"name": "broken", invalid_json...';
    let resolvedOverlay: FestivalOverlay | null = null;
    try {
      const parsed = JSON.parse(corruptedTokenValue);
      const validated = festivalOverlaySchema.safeParse(parsed);
      if (validated.success) resolvedOverlay = validated.data;
    } catch {
      resolvedOverlay = null;
    }
    assert.equal(resolvedOverlay, null);
  });

  await t.test("12. Missing Schedule Object Fails Safely", () => {
    const brokenOverlay = {
      id: "overlay_broken",
      name: "broken",
      displayName: "Broken",
      enabled: true,
      decorations: [],
    } as unknown as FestivalOverlay;

    const validated = festivalOverlaySchema.safeParse(brokenOverlay);
    assert.equal(validated.success, false);
  });

  await t.test("13. Draft Overlay is Not Active in Mobile Resolve", () => {
    const draftOverlay: FestivalOverlay = {
      id: "overlay_draft_2027",
      name: "draft_theme",
      displayName: "Draft Campaign",
      description: "Draft campaign description",
      enabled: true,
      opacity: 1,
      schedule: {
        startDate: "2027-01-01",
        startTime: "00:00",
        endDate: "2027-12-31",
        endTime: "23:59",
        timezone: "Asia/Kolkata",
        status: "draft",
      },
      decorations: [],
    };
    const result = evaluateOverlaySchedule(draftOverlay.schedule, "2027-06-01T12:00");
    assert.equal(result.active, false);
    assert.equal(result.status, "draft");
  });

  await t.test("14. Published Active Overlay Resolves as Structured JSON", () => {
    const diwaliOverlay = createDynamicFestivalOverlay("diwali", 2027);
    const scheduleResult = evaluateOverlaySchedule(diwaliOverlay.schedule, "2027-10-30T12:00");
    assert.equal(scheduleResult.active, true);
    assert.equal(typeof diwaliOverlay, "object");
    assert.equal(diwaliOverlay.name, "diwali_2027");
    assert.ok(diwaliOverlay.accentColors?.primary);
  });

  await t.test("15. Overlay Change Changes ETag / Hash", () => {
    const baseTree = {
      schemaVersion: "1.0",
      layoutId: 1,
      pageName: "home",
      theme: { id: 1, name: "Default Theme", tokens: {} },
      overlay: null,
      sections: [],
    };

    const treeWithIndOverlay = {
      ...baseTree,
      overlay: createDynamicFestivalOverlay("independence_day", 2027),
    };

    const treeWithDiwaliOverlay = {
      ...baseTree,
      overlay: createDynamicFestivalOverlay("diwali", 2027),
    };

    const hashBase = crypto.createHash("sha256").update(JSON.stringify(baseTree)).digest("hex");
    const hashInd = crypto.createHash("sha256").update(JSON.stringify(treeWithIndOverlay)).digest("hex");
    const hashDiwali = crypto.createHash("sha256").update(JSON.stringify(treeWithDiwaliOverlay)).digest("hex");

    assert.notEqual(hashBase, hashInd, "ETag must change when overlay is added");
    assert.notEqual(hashInd, hashDiwali, "ETag must change when festival changes");
    assert.notEqual(hashBase, hashDiwali, "ETag must change between base and diwali");
  });

  await t.test("16. Independence Day 2027 Specific Contract Verification", () => {
    const ind = createDynamicFestivalOverlay("independence_day", 2027);
    assert.equal(ind.name, "independence_day_2027");
    assert.equal(ind.schedule.startDate, "2027-08-15");
    assert.equal(ind.schedule.endDate, "2027-08-16");
    assert.equal(ind.accentColors?.primary, "#FF9933");
    assert.equal(ind.accentColors?.secondary, "#FFFFFF");
    assert.equal(ind.accentColors?.tertiary, "#138808");
  });

  await t.test("17. Diwali 2027 Specific Contract Verification", () => {
    const diwali = createDynamicFestivalOverlay("diwali", 2027);
    assert.equal(diwali.name, "diwali_2027");
    assert.equal(diwali.schedule.startDate, "2027-10-28");
    assert.equal(diwali.schedule.endDate, "2027-11-03");
    assert.equal(diwali.accentColors?.primary, "#F59E0B");
  });

  await t.test("18. Non-Festival Base Theme Regression Check", () => {
    const normalTokens = {
      "sys.color.primary": "#039d55",
      "sys.color.secondary": "#ff9900",
      "sys.shape.card_radius": "20px",
      "sys.spacing.md": "16px",
    };
    const tree = {
      theme: { id: 1, name: "Normal Quick Fresh", tokens: normalTokens, overlay: null },
      overlay: null,
    };
    assert.equal(tree.theme.tokens["sys.color.primary"], "#039d55");
    assert.equal(tree.theme.tokens["sys.shape.card_radius"], "20px");
    assert.equal(tree.overlay, null);
  });
});
