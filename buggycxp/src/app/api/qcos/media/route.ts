import crypto from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authorize } from "@/lib/qcos/authz";
import { serializeBigInts } from "@/lib/prisma-extension";
import { AuditLogger } from "@/lib/qcos/audit-logger";

const mediaSchema = z.object({
  name: z.string().min(1).max(255),
  fileType: z.enum(["image", "svg", "video", "lottie", "font", "audio"]),
  url: z.string().url().max(512).refine((value) => value.startsWith("https://"), "HTTPS media URL is required"),
  responsiveUrls: z.record(z.string(), z.string().url()).default({}),
  sizeBytes: z.number().int().min(0).max(100 * 1024 * 1024),
  mimeType: z.string().min(1).max(100),
  width: z.number().int().positive().nullable().default(null),
  height: z.number().int().positive().nullable().default(null),
  altText: z.string().max(255).nullable().default(null),
  checksumSha256: z.string().regex(/^[a-f0-9]{64}$/).optional(),
});

export async function GET(request: Request) {
  const auth = await authorize(request, "cxp.view");
  if (auth.response) return auth.response;
  const url = new URL(request.url);
  const status = url.searchParams.get("status") || "active";
  const media = await prisma.qcos_media_library.findMany({ where: { status }, orderBy: { created_at: "desc" }, take: 250 });
  return NextResponse.json({ success: true, data: serializeBigInts(media) });
}

export async function POST(request: Request) {
  const auth = await authorize(request, "cxp.media.manage");
  if (auth.response || !auth.session) return auth.response;
  const parsed = mediaSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, error: "Invalid media metadata", issues: parsed.error.issues }, { status: 422 });
  const input = parsed.data;
  const media = await prisma.qcos_media_library.create({ data: {
    name: input.name, file_type: input.fileType, url: input.url,
    responsive_urls: JSON.stringify(input.responsiveUrls), size_bytes: input.sizeBytes, mime_type: input.mimeType,
    width: input.width, height: input.height, alt_text: input.altText,
    checksum_sha256: input.checksumSha256 || crypto.createHash("sha256").update(input.url).digest("hex"),
    status: "active", created_by: auth.session.userId,
  } });
  await AuditLogger.log(auth.session.userId, "CREATE", "qcos_media_library", media.id, null, { name: media.name, url: media.url });
  return NextResponse.json({ success: true, data: media }, { status: 201 });
}
