import { prisma } from "@/lib/prisma";
import type { CompiledLayoutTree } from "@/lib/qcos/types";

type RuleContextValue = string | boolean | string[] | null | undefined;

export interface RuleContext {
  [key: string]: RuleContextValue;
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
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function evaluateCondition(
  expression: string | null,
  context: RuleContext,
): boolean {
  if (!expression) return true;

  try {
    return evaluateRuleNode(JSON.parse(expression) as unknown, context);
  } catch (error) {
    console.error("[Rules] Failed to parse rule expression:", error);
    return false;
  }
}

function evaluateRuleNode(node: unknown, context: RuleContext): boolean {
  if (node === null || node === undefined) return true;
  if (!isRecord(node)) return false;

  const operator = typeof node.operator === "string" ? node.operator : null;
  const field = typeof node.field === "string" ? node.field : null;

  if (!operator && !field) {
    return Object.entries(node).every(([key, value]) => {
      const contextValue = context[key];
      return (
        contextValue !== undefined &&
        contextValue !== null &&
        String(contextValue).toLowerCase() === String(value).toLowerCase()
      );
    });
  }

  if (operator === "AND" && Array.isArray(node.rules)) {
    return node.rules.every((rule) => evaluateRuleNode(rule, context));
  }
  if (operator === "OR" && Array.isArray(node.rules)) {
    return node.rules.some((rule) => evaluateRuleNode(rule, context));
  }
  if (operator === "NOT") {
    return !evaluateRuleNode(node.rule, context);
  }
  if (!field) return false;

  const contextValue = context[field];
  if (contextValue === undefined || contextValue === null) return false;
  const comparisonValue = node.value;

  switch (operator) {
    case "equals":
      return String(contextValue).toLowerCase() === String(comparisonValue).toLowerCase();
    case "not_equals":
      return String(contextValue).toLowerCase() !== String(comparisonValue).toLowerCase();
    case "contains":
      return Array.isArray(contextValue)
        ? contextValue.some(
            (item) =>
              String(item).toLowerCase() === String(comparisonValue).toLowerCase(),
          )
        : String(contextValue)
            .toLowerCase()
            .includes(String(comparisonValue).toLowerCase());
    case "in":
      return (
        Array.isArray(comparisonValue) &&
        comparisonValue.some(
          (value) =>
            String(value).toLowerCase() === String(contextValue).toLowerCase(),
        )
      );
    case "greater_than":
      return Number(contextValue) > Number(comparisonValue);
    case "less_than":
      return Number(contextValue) < Number(comparisonValue);
    default:
      return false;
  }
}

export function applyActions(
  actionsExpression: string | null,
  compiledTree: CompiledLayoutTree,
): void {
  if (!actionsExpression) return;

  try {
    const actions = JSON.parse(actionsExpression) as unknown;
    if (!Array.isArray(actions)) return;

    for (const action of actions) {
      if (!isRecord(action) || !isRecord(action.params)) continue;

      if (action.type === "OVERRIDE_TOKEN" && compiledTree.theme) {
        const tokenKey = action.params.token_key;
        const tokenValue = action.params.token_value;
        if (typeof tokenKey !== "string" || typeof tokenValue !== "string") {
          continue;
        }
        const existingToken = compiledTree.theme.tokens.find(
          (token) => token.token_key === tokenKey,
        );
        if (existingToken) {
          existingToken.token_value = tokenValue;
        } else {
          compiledTree.theme.tokens.push({
            id: 0,
            theme_id: compiledTree.theme.id,
            token_key: tokenKey,
            token_value: tokenValue,
            category: "color",
            created_at: new Date().toISOString(),
          });
        }
      }

      if (action.type === "INJECT_WIDGET") {
        const sectionName = action.params.sectionName;
        if (typeof sectionName !== "string") continue;
        const targetSection = compiledTree.sections.find(
          (section) => section.name === sectionName,
        );
        if (targetSection && "widgetInstance" in action.params) {
          targetSection.widgets.push(action.params.widgetInstance);
        }
      }
    }
  } catch (error) {
    console.error("[Rules] Failed to apply rules actions:", error);
  }
}

export async function validateCoupon(
  code: string,
  userId: bigint,
  orderValue: number,
): Promise<{
  success: boolean;
  error?: string;
  discountType?: string;
  discountValue?: number;
}> {
  try {
    const coupon = await prisma.coupons.findUnique({ where: { code } });
    if (!coupon) return { success: false, error: "Coupon not found" };
    if (!coupon.status) return { success: false, error: "Coupon is disabled" };

    const now = new Date();
    if (coupon.start_date && now < coupon.start_date) {
      return { success: false, error: "Coupon has not started yet" };
    }
    if (coupon.expire_date && now > coupon.expire_date) {
      return { success: false, error: "Coupon has expired" };
    }
    if (orderValue < Number(coupon.min_purchase)) {
      return {
        success: false,
        error: `Minimum order value of ${coupon.min_purchase} required`,
      };
    }

    if (coupon.customer_id && coupon.customer_id !== '["all"]') {
      try {
        const customerIds = JSON.parse(coupon.customer_id) as unknown;
        if (
          Array.isArray(customerIds) &&
          !customerIds.some((id) => String(id) === String(userId))
        ) {
          return {
            success: false,
            error: "User is not targeted for this coupon",
          };
        }
      } catch (error) {
        console.warn("Failed to parse coupon customer_id field:", error);
      }
    }

    return {
      success: true,
      discountType: coupon.discount_type,
      discountValue: Number(coupon.discount),
    };
  } catch (error) {
    console.error("[Rules] validateCoupon failed:", error);
    return { success: false, error: "Internal validation failure" };
  }
}
