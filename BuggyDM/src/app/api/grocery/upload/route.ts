import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";

const MAX_MEDIA_BYTES = 50 * 1024 * 1024; // 50MB (supports high-res images and promotional videos)

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "No media file provided." },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    if (file.size === 0 || file.size > MAX_MEDIA_BYTES) {
      return NextResponse.json(
        { success: false, error: "File must be between 1 byte and 50 MB." },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Determine extension & media type
    const mime = file.type.toLowerCase();
    let extension = "png";
    let mediaType: "image" | "video" = "image";

    if (mime.includes("mp4") || file.name.endsWith(".mp4")) {
      extension = "mp4";
      mediaType = "video";
    } else if (mime.includes("webm") || file.name.endsWith(".webm")) {
      extension = "webm";
      mediaType = "video";
    } else if (mime.includes("quicktime") || mime.includes("mov") || file.name.endsWith(".mov")) {
      extension = "mov";
      mediaType = "video";
    } else if (mime.includes("ogg") || file.name.endsWith(".ogg")) {
      extension = "ogg";
      mediaType = "video";
    } else if (mime.includes("jpeg") || mime.includes("jpg")) {
      extension = "jpg";
    } else if (mime.includes("webp")) {
      extension = "webp";
    } else if (mime.includes("png")) {
      extension = "png";
    } else if (mime.includes("svg")) {
      extension = "svg";
    } else if (mime.includes("gif")) {
      extension = "gif";
    } else {
      return NextResponse.json(
        { success: false, error: "Unsupported format. Use JPG, PNG, WebP, GIF, MP4, WebM, or MOV." },
        { status: 415, headers: CORS_HEADERS }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Target upload folder in public/uploads
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadDir, { recursive: true });

    const filename = `hero_${Date.now()}_${crypto.randomUUID().slice(0, 8)}.${extension}`;
    const filePath = path.join(uploadDir, filename);
    await fs.writeFile(filePath, buffer);

    // Build absolute URL for User_app and browser
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const absoluteUrl = `${appUrl}/BuggyDm/uploads/${filename}`;
    const relativeUrl = `/BuggyDm/uploads/${filename}`;

    return NextResponse.json(
      {
        success: true,
        url: absoluteUrl,
        relativeUrl: relativeUrl,
        data: {
          url: absoluteUrl,
          relativeUrl: relativeUrl,
          filename: filename,
        },
        filename: filename,
        mediaType: mediaType,
        message: `${mediaType === "video" ? "Video" : "Image"} uploaded successfully`,
      },
      { headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error("POST /api/grocery/upload error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to upload image to server." },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
