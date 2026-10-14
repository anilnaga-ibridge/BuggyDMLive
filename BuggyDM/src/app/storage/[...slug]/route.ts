import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Sleek fallback SVG for missing images (matching the dark theme)
const FALLBACK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="#475569" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" fill="#0f172a"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/><circle cx="9" cy="9" r="2"/></svg>`;

const STORAGE_ROOT = "/Applications/MAMP/htdocs/Buggy_Aplications/Buggy2026/storage/app/public";

const MIME_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

const SEARCH_SUBDIRS = ["product", "delivery-man", "category", "banner", "store", "profile", "vendor"];

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  if (!slug || slug.length === 0) {
    return new NextResponse(FALLBACK_SVG, {
      status: 200,
      headers: { "Content-Type": "image/svg+xml" },
    });
  }

  const relativePath = slug.join("/");
  const targetPath = path.resolve(STORAGE_ROOT, relativePath);

  // Security: prevent path traversal out of storage root
  if (!targetPath.startsWith(STORAGE_ROOT)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // If directly found
  if (fs.existsSync(targetPath) && fs.statSync(targetPath).isFile()) {
    const ext = path.extname(targetPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    const fileBuffer = fs.readFileSync(targetPath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  }

  // If slug was just a filename (e.g. 2024-05-11-663f7ae23d35d.png), check common subdirectories
  if (slug.length === 1) {
    const filename = slug[0];
    for (const subdir of SEARCH_SUBDIRS) {
      const candidate = path.resolve(STORAGE_ROOT, subdir, filename);
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        const ext = path.extname(candidate).toLowerCase();
        const contentType = MIME_TYPES[ext] || "application/octet-stream";
        const fileBuffer = fs.readFileSync(candidate);

        return new NextResponse(fileBuffer, {
          status: 200,
          headers: {
            "Content-Type": contentType,
            "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
          },
        });
      }
    }
  }

  // If the requested file is missing from disk, return a sleek SVG placeholder with HTTP 200
  // This prevents browser console 404 errors while gracefully rendering a dark-mode placeholder.
  return new NextResponse(FALLBACK_SVG, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
