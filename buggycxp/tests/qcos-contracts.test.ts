import assert from "node:assert/strict";
import test from "node:test";
import { authoringDocumentSchema, MAX_PAYLOAD_BYTES, SDUI_SCHEMA_VERSION, assertPayloadBudget, bilingualCopyFinding, defaultLanguageModeForLocale, localizationFieldFinding, productionConfirmationValid, releaseRequiresIndependentApproval, resolveRequestSchema, telemetryEventSchema } from "../src/lib/qcos/contracts.ts";
import { referenceTemplates, widgetRegistry } from "../src/lib/qcos/widget-registry.ts";
import { createBootstrapFallbackLayout } from "../src/lib/qcos/circuit-breaker.ts";
import { validateAuthoringDocument } from "../src/lib/qcos/authoring.ts";

test("reference templates conform to the canonical authoring contract", () => {
  assert.equal(referenceTemplates.length, 9);
  for (const template of referenceTemplates) {
    const parsed = authoringDocumentSchema.safeParse(template);
    assert.equal(parsed.success, true, parsed.success ? undefined : JSON.stringify(parsed.error?.issues));
    assert.equal(template.schemaVersion, SDUI_SCHEMA_VERSION);
  }
});

test("reference templates carry governed module themes and native menu destinations", () => {
  const expectedPages = new Set([
    "home_grocery",
    "home_grocery_diwali",
    "home_grocery_summer",
    "home_grocery_monster",
    "home_food",
    "home_quick_commerce",
    "category_directory",
    "category_listing",
    "reorder"
  ]);
  assert.deepEqual(new Set(referenceTemplates.map((template) => template.pageName)), expectedPages);
  for (const template of referenceTemplates) {
    assert.ok(template.experienceShell, `${template.pageName} is missing experienceShell`);
    assert.ok(template.experienceShell.appearance, `${template.pageName} is missing governed appearance variants`);
    assert.ok(template.experienceShell.menu.length >= 2);
    assert.equal(new Set(template.experienceShell.menu.map((item) => item.id)).size, template.experienceShell.menu.length);
    if (template.experienceShell.module === "food") assert.equal(template.experienceShell.themeFamily, "food_dark");
    if (template.experienceShell.module === "quick_commerce") assert.equal(template.experienceShell.themeFamily, "quick_commerce_mint");
  }
});

test("appearance variants stay within the governed mobile design system", () => {
  const candidate = structuredClone(referenceTemplates[0]);
  candidate.experienceShell!.appearance!.moduleTabStyle = "custom_css" as never;
  assert.equal(authoringDocumentSchema.safeParse(candidate).success, false);
});

test("authoring rejects embedded commerce truth and mismatched module themes", () => {
  const embeddedPrice = structuredClone(referenceTemplates[0]);
  embeddedPrice.sections[0].widgets[0].props.price = 199;
  const priceValidation = validateAuthoringDocument(embeddedPrice);
  assert.ok(priceValidation.findings.some((finding) => finding.code === "COMMERCE_TRUTH_EMBEDDED"));

  const foodTemplate = referenceTemplates.find((t) => t.experienceShell?.module === "food")!;
  const mismatchedTheme = structuredClone(foodTemplate);
  mismatchedTheme.experienceShell!.themeFamily = "quick_commerce_mint";
  const themeValidation = validateAuthoringDocument(mismatchedTheme);
  assert.ok(themeValidation.findings.some((finding) => finding.code === "MODULE_THEME_MISMATCH"));
});

test("every reference widget exists in the registry at a compatible version", () => {
  const registry = new Map(widgetRegistry.map((widget) => [widget.name, widget]));
  for (const template of referenceTemplates) {
    for (const section of template.sections) {
      for (const widget of section.widgets) {
        const definition = registry.get(widget.type);
        assert.ok(definition, `Missing widget definition: ${widget.type}`);
        assert.equal(definition.version.split(".")[0], widget.version.split(".")[0]);
      }
    }
  }
});

test("widget names and versions are unique and production-formatted", () => {
  const names = new Set<string>();
  for (const widget of widgetRegistry) {
    assert.match(widget.name, /^[a-z][a-z0-9_.-]*$/);
    assert.match(widget.version, /^\d+\.\d+\.\d+$/);
    assert.equal(names.has(widget.name), false, `Duplicate widget: ${widget.name}`);
    names.add(widget.name);
  }
});

test("payload budget rejects oversized documents", () => {
  assert.throws(() => assertPayloadBudget({ value: "x".repeat(MAX_PAYLOAD_BYTES + 1) }), /exceeds/);
});

test("unsafe action types are rejected by the contract", () => {
  const candidate = structuredClone(referenceTemplates[0]);
  candidate.sections[0].widgets[0].actions = [{ trigger: "on_tap", type: "execute_javascript", params: {} } as never];
  assert.equal(authoringDocumentSchema.safeParse(candidate).success, false);
});

test("telemetry accepts bounded dimensions and rejects customer text", () => {
  assert.equal(telemetryEventSchema.safeParse({ widgetInstanceId: 42, eventName: "tap", metricKey: "action.open_search" }).success, true);
  assert.equal(telemetryEventSchema.safeParse({ widgetInstanceId: 42, eventName: "purchase", metricKey: "action.open_search" }).success, false);
  assert.equal(telemetryEventSchema.safeParse({ widgetInstanceId: 42, eventName: "tap", metricKey: "customer@example.com" }).success, false);
  assert.equal(telemetryEventSchema.safeParse({ widgetInstanceId: 42, eventName: "tap", metricKey: "safe", customerEmail: "person@example.com" }).success, false);
});

test("every registered widget ships with valid authoring defaults", () => {
  for (const definition of widgetRegistry) {
    const required = (definition.schema.required ?? []) as string[];
    for (const key of required) assert.notEqual(definition.defaultProps[key], undefined, `${definition.name} default is missing '${key}'`);
    const properties = (definition.schema.properties ?? {}) as Record<string, unknown>;
    for (const key of Object.keys(definition.defaultProps)) assert.ok(properties[key], `${definition.name} default '${key}' is not declared in its schema`);
  }
});

test("mobile resolve accepts only governed South India language modes", () => {
  const telugu = resolveRequestSchema.safeParse({ context: { locale: "te-IN", languageMode: "telugu_english" } });
  assert.equal(telugu.success, true);
  const unsupported = resolveRequestSchema.safeParse({ context: { locale: "ar-SA", languageMode: "arabic" } });
  assert.equal(unsupported.success, false);
  const mismatched = resolveRequestSchema.safeParse({ context: { locale: "te-IN", languageMode: "hindi_english" } });
  assert.equal(mismatched.success, false);
  assert.equal(defaultLanguageModeForLocale("te-IN"), "telugu_english");
  assert.equal(defaultLanguageModeForLocale("hi-IN"), "hindi_english");
});

test("localization only targets compiled customer-facing string fields", () => {
  assert.equal(localizationFieldFinding("widget", "props.title"), null);
  assert.equal(localizationFieldFinding("section", "name"), null);
  assert.equal(localizationFieldFinding("page", "layoutName"), null);
  assert.match(localizationFieldFinding("widget", "props.price.amount") || "", /Unsupported/);
  assert.match(localizationFieldFinding("widget", "dataSource") || "", /Unsupported/);
});

test("bilingual content retains native script and an English anchor", () => {
  assert.equal(bilingualCopyFinding("te-IN", "ఆర్డర్లు · Orders"), null);
  assert.equal(bilingualCopyFinding("hi-IN", "कार्ट · Cart"), null);
  assert.match(bilingualCopyFinding("te-IN", "Orders") || "", /Telugu script/);
  assert.match(bilingualCopyFinding("hi-IN", "कार्ट") || "", /English anchor/);
});

test("emergency layouts remain canonical and bilingual", () => {
  for (const [locale, languageMode] of [["en-IN", "english"], ["te-IN", "telugu_english"], ["hi-IN", "hindi_english"]]) {
    const fallback = createBootstrapFallbackLayout({ pageName: "home_food", locale, languageMode });
    assert.equal(fallback.schemaVersion, SDUI_SCHEMA_VERSION);
    assert.match(fallback.layoutId, /^[a-z][a-z0-9_.-]*$/);
    assert.equal(fallback.pageName, "home_food");
    for (const section of fallback.sections) {
      assert.match(section.id, /^[a-z][a-z0-9_.-]*$/);
      assert.ok(Number.isInteger(section.order));
      for (const widget of section.widgets) {
        assert.match(widget.id, /^[a-z][a-z0-9_.-]*$/);
        assert.match(widget.type, /^[a-z][a-z0-9_.-]*$/);
        assert.match(widget.version, /^\d+\.\d+\.\d+$/);
      }
    }
    if (locale !== "en-IN") assert.equal(bilingualCopyFinding(locale, fallback.layoutName), null);
  }
});

test("release safety gates distinguish internal testing from customer publication", () => {
  assert.equal(releaseRequiresIndependentApproval("dev"), false);
  assert.equal(releaseRequiresIndependentApproval("qa"), false);
  assert.equal(releaseRequiresIndependentApproval("staging"), true);
  assert.equal(releaseRequiresIndependentApproval("prod"), true);
  assert.equal(productionConfirmationValid("dev", undefined), true);
  assert.equal(productionConfirmationValid("prod", undefined), false);
  assert.equal(productionConfirmationValid("prod", "publish"), false);
  assert.equal(productionConfirmationValid("prod", "PUBLISH"), true);
});
