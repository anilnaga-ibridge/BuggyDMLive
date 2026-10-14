import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { authorizeApi, Permissions } from "@/lib/security/authorization";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const IMAGE_TYPES = {
  "image/jpeg": {
    extension: "jpg",
    matches: (bytes: Uint8Array) =>
      bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
  },
  "image/png": {
    extension: "png",
    matches: (bytes: Uint8Array) =>
      Buffer.from(bytes.subarray(0, 8)).equals(
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      ),
  },
  "image/webp": {
    extension: "webp",
    matches: (bytes: Uint8Array) =>
      Buffer.from(bytes.subarray(0, 4)).toString("ascii") === "RIFF" &&
      Buffer.from(bytes.subarray(8, 12)).toString("ascii") === "WEBP",
  },
} as const;

export async function POST(request: NextRequest) {
  const authorization = await authorizeApi(Permissions.filesUpload);
  if (!authorization.ok) return authorization.response;

  try {
    const formData = await request.formData();
    const upload = formData.get("file");

    if (!(upload instanceof File)) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    if (upload.size === 0 || upload.size > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { error: "Image must be between 1 byte and 5 MB." },
        { status: 400 },
      );
    }

    const imageType = IMAGE_TYPES[upload.type as keyof typeof IMAGE_TYPES];
    if (!imageType) {
      return NextResponse.json(
        { error: "Only JPEG, PNG, and WebP images are supported." },
        { status: 415 },
      );
    }

    const buffer = Buffer.from(await upload.arrayBuffer());
    if (!imageType.matches(buffer)) {
      return NextResponse.json(
        { error: "The uploaded file content is not a valid image." },
        { status: 415 },
      );
    }

    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Production object storage is not configured." },
        { status: 503 },
      );
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadDir, { recursive: true });

    const filename = `${crypto.randomUUID()}.${imageType.extension}`;
    const filePath = path.join(uploadDir, filename);
    await fs.writeFile(filePath, buffer);

    const fileUrl = `/BuggyDm/uploads/${filename}`;
    return NextResponse.json({ success: true, url: fileUrl });
  } catch {
    return NextResponse.json({ error: "Failed to upload image." }, { status: 500 });
  }
}
