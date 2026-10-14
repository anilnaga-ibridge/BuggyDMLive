import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { validateAuthoringDocument } from "@/lib/qcos/authoring";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const body: unknown = await request.json().catch(() => null);
  const validation = validateAuthoringDocument(body);
  return NextResponse.json({
    success: Boolean(validation.document) && !validation.findings.some((finding) => finding.level === "error"),
    findings: validation.findings,
  }, { status: validation.document ? 200 : 422 });
}
