import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authorize } from "@/lib/qcos/authz";
import { AuditLogger } from "@/lib/qcos/audit-logger";
import { LayoutCacheManager } from "@/lib/qcos/cache";
import { bilingualCopyFinding, localizationFieldFinding, supportedMobileLocaleSchema } from "@/lib/qcos/contracts";

const localizationSchema = z.object({
  entityType: z.enum(["page", "section", "widget"]), entityId: z.number().int().positive(),
  locale: supportedMobileLocaleSchema, fieldKey: z.string().min(1).max(100), value: z.string().min(1).max(10000),
}).superRefine((input, context) => {
  const finding = bilingualCopyFinding(input.locale, input.value);
  if (finding) context.addIssue({ code: "custom", path: ["value"], message: finding });
  const fieldFinding = localizationFieldFinding(input.entityType, input.fieldKey);
  if (fieldFinding) context.addIssue({ code: "custom", path: ["fieldKey"], message: fieldFinding });
});

const reviewSchema = z.object({
  id: z.number().int().positive(),
  status: z.enum(["approved", "draft"]),
});

export async function GET(request: Request) {
  const auth = await authorize(request, "cxp.view");
  if (auth.response) return auth.response;
  const url = new URL(request.url);
  const locale = url.searchParams.get("locale") || undefined;
  if (locale && !supportedMobileLocaleSchema.safeParse(locale).success) {
    return NextResponse.json({ success: false, error: "Unsupported locale" }, { status: 400 });
  }
  const data = await prisma.qcos_localizations.findMany({ where: locale ? { locale } : undefined, orderBy: [{ locale: "asc" }, { field_key: "asc" }], take: 1000 });
  return NextResponse.json({ success: true, data });
}

export async function PUT(request: Request) {
  const auth = await authorize(request, "cxp.localization.manage");
  if (auth.response || !auth.session) return auth.response;
  const parsed = localizationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, error: "Invalid localization", issues: parsed.error.issues }, { status: 422 });
  const input = parsed.data;
  const row = await prisma.qcos_localizations.upsert({
    where: { entity_type_entity_id_locale_field_key: { entity_type: input.entityType, entity_id: input.entityId, locale: input.locale, field_key: input.fieldKey } },
    update: { value_text: input.value, status: "draft", approved_by: null },
    create: { entity_type: input.entityType, entity_id: input.entityId, locale: input.locale, field_key: input.fieldKey, value_text: input.value, created_by: auth.session.userId },
  });
  await AuditLogger.log(auth.session.userId, "UPDATE", "qcos_localizations", row.id, null, { locale: row.locale, fieldKey: row.field_key });
  await LayoutCacheManager.invalidateAllLayoutCaches();
  return NextResponse.json({ success: true, data: row });
}

export async function PATCH(request: Request) {
  const auth = await authorize(request, "cxp.localization.manage");
  if (auth.response || !auth.session) return auth.response;
  const parsed = reviewSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid localization review", issues: parsed.error.issues }, { status: 422 });
  }

  const existing = await prisma.qcos_localizations.findUnique({ where: { id: parsed.data.id } });
  if (!existing) return NextResponse.json({ success: false, error: "Localization not found" }, { status: 404 });
  if (parsed.data.status === "approved" && existing.created_by === auth.session.userId) {
    return NextResponse.json({ success: false, error: "A second reviewer must approve this translation" }, { status: 409 });
  }

  const row = await prisma.qcos_localizations.update({
    where: { id: parsed.data.id },
    data: {
      status: parsed.data.status,
      approved_by: parsed.data.status === "approved" ? auth.session.userId : null,
    },
  });
  await AuditLogger.log(
    auth.session.userId,
    parsed.data.status === "approved" ? "APPROVE" : "UPDATE",
    "qcos_localizations",
    row.id,
    { status: existing.status, approvedBy: existing.approved_by },
    { status: row.status, approvedBy: row.approved_by },
  );
  await LayoutCacheManager.invalidateAllLayoutCaches();
  return NextResponse.json({ success: true, data: row });
}
