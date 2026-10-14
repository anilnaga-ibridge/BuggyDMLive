import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { serializeBigInts } from "@/lib/prisma-extension";
import { experienceRuleSchema } from "@/lib/qcos/validation";

// GET /api/qcos/campaigns - List all experience rules & active A/B experiments
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const [rules, experiments] = await Promise.all([
      prisma.qcos_experience_rules.findMany({
        orderBy: { created_at: "desc" },
      }),
      prisma.qcos_experiments.findMany({
        include: {
          variants: true,
          flag: true,
        },
        orderBy: { created_at: "desc" },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        rules: serializeBigInts(rules),
        experiments: serializeBigInts(experiments),
      },
    });
  } catch (error: unknown) {
    console.error("GET campaigns / experience rules error:", error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Failed to load campaigns" }, { status: 500 });
  }
}

// POST /api/qcos/campaigns - Create a new experience rule
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = experienceRuleSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ success: false, error: "Validation failed", details: result.error.format() }, { status: 400 });
    }

    const { name, conditions_json, actions_json, is_active } = result.data;

    const rule = await prisma.$transaction(async (tx) => {
      const newRule = await tx.qcos_experience_rules.create({
        data: {
          name,
          conditions_json,
          actions_json,
          is_active,
        },
      });

      // Write Audit Log
      await tx.qcos_audit_logs.create({
        data: {
          user_id: session.userId,
          action: "CREATE",
          target_table: "qcos_experience_rules",
          record_id: newRule.id,
          new_value: JSON.stringify(newRule),
          ip_address: "127.0.0.1",
          user_agent: request.headers.get("user-agent") || "unknown",
        },
      });

      return newRule;
    });

    return NextResponse.json({
      success: true,
      data: serializeBigInts(rule),
    });
  } catch (error: unknown) {
    console.error("POST experience rules error:", error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Failed to create experience rule" }, { status: 500 });
  }
}
