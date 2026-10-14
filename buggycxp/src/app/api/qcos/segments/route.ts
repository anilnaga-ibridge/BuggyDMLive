import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authorize } from "@/lib/qcos/authz";
import { AuditLogger } from "@/lib/qcos/audit-logger";

const ruleNode: z.ZodType = z.lazy(() => z.union([
  z.object({ operator: z.enum(["AND", "OR"]), rules: z.array(ruleNode).min(1).max(20) }),
  z.object({ operator: z.literal("NOT"), rule: ruleNode }),
  z.object({ field: z.enum(["city", "market", "locale", "module", "signedIn", "networkClass", "preferredCategories"]), operator: z.enum(["equals", "not_equals", "contains", "in"]), value: z.unknown() }),
]));
const segmentSchema = z.object({ segmentKey: z.string().regex(/^[a-z][a-z0-9_.-]*$/).max(100), name: z.string().min(1).max(100), description: z.string().max(1000).optional(), rules: ruleNode, isActive: z.boolean().default(true) });

export async function GET(request: Request) {
  const auth = await authorize(request, "cxp.view"); if (auth.response) return auth.response;
  return NextResponse.json({ success: true, data: await prisma.qcos_segments.findMany({ orderBy: { name: "asc" } }) });
}

export async function POST(request: Request) {
  const auth = await authorize(request, "cxp.audience.manage"); if (auth.response || !auth.session) return auth.response;
  const parsed = segmentSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, error: "Invalid segment", issues: parsed.error.issues }, { status: 422 });
  const input = parsed.data;
  const segment = await prisma.qcos_segments.create({ data: { segment_key: input.segmentKey, name: input.name, description: input.description, rules_json: JSON.stringify(input.rules), is_active: input.isActive, created_by: auth.session.userId } });
  await AuditLogger.log(auth.session.userId, "CREATE", "qcos_segments", segment.id, null, { segmentKey: segment.segment_key });
  return NextResponse.json({ success: true, data: segment }, { status: 201 });
}
