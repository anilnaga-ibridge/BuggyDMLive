import { prisma } from "@/lib/prisma";

export interface RuleContext {
  userId?: string | null;
  isLoggedIn: boolean;
  city?: string | null;
  deviceType?: string | null;
  networkSpeed?: string | null;
  timezone?: string | null;
  preferredCategories?: string[];
  weatherCode?: string | null;
  appVersion?: string | null;
  platform?: string | null;
  market?: string | null;
  locale?: string | null;
  module?: string | null;
  signedIn?: boolean;
  networkClass?: string | null;
  segments?: string[];
  loggedIn?: boolean;
  languageMode?: string;
  clientCapabilities?: string[];
  clientWidgetVersions?: Record<string, string>;
  clientActions?: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/**
 * Main evaluation entry for a JSON-structured visibility rule or condition
 */
export function evaluateCondition(expression: string | null, context: RuleContext): boolean {
  if (!expression) return true;
  
  try {
    const parsed = JSON.parse(expression);
    return evaluateRuleNode(parsed, context);
  } catch (error) {
    console.error("[Rules] Failed to parse rule expression:", error);
    return false;
  }
}

/**
 * Async evaluation entry that resolves decoupled rule templates starting with "rule:"
 */
export async function evaluateConditionAsync(expression: string | null, context: RuleContext): Promise<boolean> {
  if (!expression) return true;

  if (typeof expression === "string" && expression.startsWith("rule:")) {
    const ruleRef = expression.substring(5).trim();
    try {
      let ruleRecord = null;
      if (/^\d+$/.test(ruleRef)) {
        ruleRecord = await prisma.qcos_experience_rules.findUnique({
          where: { id: parseInt(ruleRef, 10) }
        });
      } else {
        ruleRecord = await prisma.qcos_experience_rules.findFirst({
          where: { name: ruleRef }
        });
      }

      if (ruleRecord && ruleRecord.is_active) {
        return evaluateCondition(ruleRecord.conditions_json, context);
      }
      return false;
    } catch (e) {
      console.error("[Rules] Failed to resolve decoupled rule reference:", e);
      return false;
    }
  }

  return evaluateCondition(expression, context);
}

/**
 * DFS evaluation of logical tree nodes (AND, OR, NOT) and comparison operations
 */
function evaluateRuleNode(node: unknown, context: RuleContext): boolean {
  if (!node) return true;
  if (!isRecord(node)) return false;
  const contextRecord = context as unknown as Record<string, unknown>;

  // Support plain key-value constraint dictionaries (e.g. {"loggedIn": true})
  if (!node.operator && !node.field) {
    return Object.entries(node).every(([key, value]) => {
      const contextValue = contextRecord[key];
      if (contextValue === undefined || contextValue === null) {
        return false;
      }
      return String(contextValue).toLowerCase() === String(value).toLowerCase();
    });
  }
  
  // Logical operations
  if (node.operator === "AND" && Array.isArray(node.rules)) {
    return node.rules.every((rule) => evaluateRuleNode(rule, context));
  }
  
  if (node.operator === "OR" && Array.isArray(node.rules)) {
    return node.rules.some((rule) => evaluateRuleNode(rule, context));
  }
  
  if (node.operator === "NOT" && node.rule) {
    return !evaluateRuleNode(node.rule, context);
  }
  
  // Single leaf comparison rule matching
  const { field, operator, value } = node;
  if (!field) return true;
  
  if (typeof field !== "string") return false;
  const contextValue = contextRecord[field];
  if (contextValue === undefined || contextValue === null) {
    return false;
  }
  
  switch (operator) {
    case "equals":
      return String(contextValue).toLowerCase() === String(value).toLowerCase();
    case "not_equals":
      return String(contextValue).toLowerCase() !== String(value).toLowerCase();
    case "contains":
      if (Array.isArray(contextValue)) {
        return contextValue.some(item => String(item).toLowerCase() === String(value).toLowerCase());
      }
      return String(contextValue).toLowerCase().includes(String(value).toLowerCase());
    case "in":
      if (Array.isArray(value)) {
        return value.some(v => String(v).toLowerCase() === String(contextValue).toLowerCase());
      }
      return false;
    case "greater_than":
      return Number(contextValue) > Number(value);
    case "less_than":
      return Number(contextValue) < Number(value);
    default:
      return false;
  }
}

/**
 * Apply experience rules action overrides directly on the resolved layout tree
 */
export function applyActions(actionsExpression: string | null, compiledTree: Record<string, unknown>) {
  if (!actionsExpression) return;
  
  try {
    const actions = JSON.parse(actionsExpression);
    if (!Array.isArray(actions)) return;
    
    for (const action of actions) {
      if (!isRecord(action) || !isRecord(action.params)) continue;
      if (action.type === "OVERRIDE_TOKEN" && isRecord(compiledTree.theme)) {
        const tokenKey = action.params.token_key;
        const tokenValue = action.params.token_value;
        if (typeof tokenKey === "string" && typeof tokenValue === "string" && isRecord(compiledTree.theme.tokens)) {
          compiledTree.theme.tokens[tokenKey] = tokenValue;
        }
      }
      
      if (action.type === "INJECT_WIDGET") {
        const sectionName = action.params.sectionName;
        const widgetInstance = action.params.widgetInstance;
        const sections = Array.isArray(compiledTree.sections) ? compiledTree.sections : [];
        const targetSection = sections.find((section) => isRecord(section) && section.name === sectionName);
        if (isRecord(targetSection) && Array.isArray(targetSection.widgets) && isRecord(widgetInstance)) {
          targetSection.widgets.push(widgetInstance);
        }
      }
    }
  } catch (error) {
    console.error("[Rules] Failed to apply rules actions:", error);
  }
}

/**
 * Validate dynamic checkout coupons against user profile and order metrics
 */
export async function validateCoupon(
  code: string,
  userId: bigint,
  orderValue: number
): Promise<{ success: boolean; error?: string; discountType?: string; discountValue?: number }> {
  try {
    const coupon = await prisma.coupons.findUnique({
      where: { code },
    });

    if (!coupon) {
      return { success: false, error: "Coupon not found" };
    }

    if (!coupon.status) {
      return { success: false, error: "Coupon is disabled" };
    }

    const now = new Date();
    if (coupon.start_date && now < coupon.start_date) {
      return { success: false, error: "Coupon has not started yet" };
    }
    if (coupon.expire_date && now > coupon.expire_date) {
      return { success: false, error: "Coupon has expired" };
    }

    if (orderValue < Number(coupon.min_purchase)) {
      return { success: false, error: `Minimum order value of ${coupon.min_purchase} required` };
    }

    // Customer targeting check using customer_id field (e.g. '["all"]' or list of numbers)
    if (coupon.customer_id && coupon.customer_id !== '["all"]') {
      try {
        const customerIds = JSON.parse(coupon.customer_id);
        if (Array.isArray(customerIds)) {
          const isUserTargeted = customerIds.some(id => String(id) === String(userId));
          if (!isUserTargeted) {
            return { success: false, error: "User is not targeted for this coupon" };
          }
        }
      } catch (err) {
        console.warn("Failed to parse coupon customer_id field:", err);
      }
    }

    return {
      success: true,
      discountType: coupon.discount_type,
      discountValue: Number(coupon.discount),
    };
  } catch (error: unknown) {
    console.error("[Rules] validateCoupon failed:", error);
    return { success: false, error: "Internal validation failure" };
  }
}
