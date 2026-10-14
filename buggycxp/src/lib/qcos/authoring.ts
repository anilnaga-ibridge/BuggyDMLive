import { authoringDocumentSchema, assertPayloadBudget, type AuthoringDocument } from "./contracts.ts";
import { getWidgetDefinition } from "./widget-registry.ts";

export interface ValidationFinding {
  level: "error" | "warning";
  path: string;
  code: string;
  message: string;
}

interface PropertyRule {
  type?: "string" | "number" | "integer" | "boolean" | "array";
  enum?: unknown[];
  minimum?: number;
  maximum?: number;
  maxItems?: number;
}

const EMBEDDED_COMMERCE_TRUTH_KEYS = new Set([
  "price",
  "currentPrice",
  "compareAtPrice",
  "stock",
  "stockQuantity",
  "inventory",
  "etaMinutes",
  "cartAmount",
  "thresholdAmount",
  "orderStatus",
]);

function embeddedCommerceTruthFindings(value: unknown, path: string): ValidationFinding[] {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => embeddedCommerceTruthFindings(item, `${path}.${index}`));
  }
  if (!value || typeof value !== "object") return [];

  return Object.entries(value as Record<string, unknown>).flatMap(([key, nested]) => [
    ...(EMBEDDED_COMMERCE_TRUTH_KEYS.has(key) ? [{
      level: "error" as const,
      path: `${path}.${key}`,
      code: "COMMERCE_TRUTH_EMBEDDED",
      message: `'${key}' must come from an authoritative Core data source`,
    }] : []),
    ...embeddedCommerceTruthFindings(nested, `${path}.${key}`),
  ]);
}

function validateWidgetProperties(props: Record<string, unknown>, schema: Record<string, unknown>, path: string): ValidationFinding[] {
  const findings: ValidationFinding[] = [];
  const properties = (schema.properties ?? {}) as Record<string, PropertyRule>;
  const required = (schema.required ?? []) as string[];
  for (const key of required) {
    if (props[key] === undefined || props[key] === null || props[key] === "") {
      findings.push({ level: "error", path: `${path}.props.${key}`, code: "PROPERTY_REQUIRED", message: `'${key}' is required` });
    }
  }
  if (schema.additionalProperties === false) {
    for (const key of Object.keys(props)) {
      if (!properties[key]) findings.push({ level: "warning", path: `${path}.props.${key}`, code: "UNKNOWN_PROPERTY", message: `'${key}' is not defined by the widget contract` });
    }
  }
  for (const [key, value] of Object.entries(props)) {
    const rule = properties[key];
    if (!rule || value === undefined || value === null) continue;
    const validType = !rule.type
      || (rule.type === "array" ? Array.isArray(value) : rule.type === "integer" ? Number.isInteger(value) : typeof value === rule.type);
    if (!validType) findings.push({ level: "error", path: `${path}.props.${key}`, code: "PROPERTY_TYPE_INVALID", message: `'${key}' must be ${rule.type}` });
    if (rule.enum && !rule.enum.includes(value)) findings.push({ level: "error", path: `${path}.props.${key}`, code: "PROPERTY_VALUE_INVALID", message: `'${key}' must be one of: ${rule.enum.join(", ")}` });
    if (typeof value === "number" && rule.minimum !== undefined && value < rule.minimum) findings.push({ level: "error", path: `${path}.props.${key}`, code: "PROPERTY_OUT_OF_RANGE", message: `'${key}' must be at least ${rule.minimum}` });
    if (typeof value === "number" && rule.maximum !== undefined && value > rule.maximum) findings.push({ level: "error", path: `${path}.props.${key}`, code: "PROPERTY_OUT_OF_RANGE", message: `'${key}' must be at most ${rule.maximum}` });
    if (Array.isArray(value) && rule.maxItems !== undefined && value.length > rule.maxItems) findings.push({ level: "error", path: `${path}.props.${key}`, code: "PROPERTY_LIMIT_EXCEEDED", message: `'${key}' supports at most ${rule.maxItems} items` });
  }
  return findings;
}

export function validateAuthoringDocument(input: unknown): { document?: AuthoringDocument; findings: ValidationFinding[] } {
  const parsed = authoringDocumentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      findings: parsed.error.issues.map((issue) => ({
        level: "error",
        path: issue.path.join("."),
        code: "SCHEMA_INVALID",
        message: issue.message,
      })),
    };
  }

  const findings: ValidationFinding[] = [];
  const ids = new Set<string>();
  try {
    assertPayloadBudget(parsed.data);
  } catch (error) {
    findings.push({ level: "error", path: "$", code: "PAYLOAD_TOO_LARGE", message: error instanceof Error ? error.message : "Payload is too large" });
  }

  if (!parsed.data.experienceShell) {
    findings.push({ level: "warning", path: "experienceShell", code: "LEGACY_SHELL", message: "Legacy document has no governed module theme or menu; the native fallback shell will be used" });
  } else {
    const shell = parsed.data.experienceShell;
    const menuIds = new Set<string>();
    shell.menu.forEach((item, index) => {
      if (menuIds.has(item.id)) {
        findings.push({ level: "error", path: `experienceShell.menu.${index}.id`, code: "DUPLICATE_MENU_ID", message: `Duplicate menu ID: ${item.id}` });
      }
      menuIds.add(item.id);
    });
    if (shell.module === "food" && shell.themeFamily !== "food_dark") {
      findings.push({ level: "error", path: "experienceShell.themeFamily", code: "MODULE_THEME_MISMATCH", message: "Food experiences must use the food_dark semantic theme family" });
    }
    if (shell.module === "quick_commerce" && shell.themeFamily !== "quick_commerce_mint") {
      findings.push({ level: "error", path: "experienceShell.themeFamily", code: "MODULE_THEME_MISMATCH", message: "Quick Commerce experiences must use the quick_commerce_mint semantic theme family" });
    }
    if (parsed.data.templateFamily === "food_home" && shell.module !== "food") {
      findings.push({ level: "error", path: "experienceShell.module", code: "TEMPLATE_MODULE_MISMATCH", message: "Food Home must use the food module" });
    }
    if (parsed.data.templateFamily === "quick_commerce_home" && shell.module !== "quick_commerce") {
      findings.push({ level: "error", path: "experienceShell.module", code: "TEMPLATE_MODULE_MISMATCH", message: "Quick Commerce Home must use the quick_commerce module" });
    }
    if (parsed.data.templateFamily === "grocery_home" && shell.module !== "grocery") {
      findings.push({ level: "error", path: "experienceShell.module", code: "TEMPLATE_MODULE_MISMATCH", message: "Grocery Home must use the grocery module" });
    }
  }

  parsed.data.sections.forEach((section, sectionIndex) => {
    if (ids.has(section.id)) findings.push({ level: "error", path: `sections.${sectionIndex}.id`, code: "DUPLICATE_ID", message: `Duplicate ID: ${section.id}` });
    ids.add(section.id);
    section.widgets.forEach((widget, widgetIndex) => {
      const path = `sections.${sectionIndex}.widgets.${widgetIndex}`;
      if (ids.has(widget.id)) findings.push({ level: "error", path: `${path}.id`, code: "DUPLICATE_ID", message: `Duplicate ID: ${widget.id}` });
      ids.add(widget.id);
      const definition = getWidgetDefinition(widget.type);
      if (!definition) {
        findings.push({ level: "error", path: `${path}.type`, code: "UNKNOWN_WIDGET", message: `Widget '${widget.type}' is not registered` });
        return;
      }
      if (definition.version.split(".")[0] !== widget.version.split(".")[0]) {
        findings.push({ level: "error", path: `${path}.version`, code: "INCOMPATIBLE_WIDGET", message: `Widget '${widget.type}' requires compatible version ${definition.version}` });
      }
      findings.push(...validateWidgetProperties(widget.props, definition.schema, path));
      findings.push(...embeddedCommerceTruthFindings(widget.props, `${path}.props`));
      widget.actions.forEach((action, actionIndex) => {
        if (!definition.allowedActions.includes(action.type)) {
          findings.push({ level: "error", path: `${path}.actions.${actionIndex}`, code: "ACTION_NOT_ALLOWED", message: `'${action.type}' is not allowed for '${widget.type}'` });
        }
      });
      if (widget.type === "hero_campaign" && typeof widget.props.accessibilityLabel !== "string") {
        findings.push({ level: "error", path: `${path}.props.accessibilityLabel`, code: "ACCESSIBILITY_LABEL_REQUIRED", message: "Campaign media requires an accessibility label" });
      }
    });
  });

  const sortedOrders = [...parsed.data.sections].sort((a, b) => a.order - b.order).map((section) => section.order);
  sortedOrders.forEach((order, index) => {
    if (order !== index) findings.push({ level: "warning", path: "sections", code: "NON_CONTIGUOUS_ORDER", message: "Section order should be contiguous from zero" });
  });

  return { document: parsed.data, findings };
}
