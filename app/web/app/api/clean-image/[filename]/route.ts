// This route serves "clean" (watermark-free) images for creators.
import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

// Map file extensions to MIME types.
const MIME_BY_EXT: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

// GET handler for serving a single clean image.
export async function GET(
  _req: Request,
  { params }: { params: { filename: string } }
) {
  const filename = params.filename;
  if (!filename || filename.includes("/") || filename.includes("\\")) {
    return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
  }

  const cleanImageDirOverride = (process.env.CLEAN_IMAGE_DIR || "").trim().replace(/\/+$/g, "");

  // Be robust to differing `cwd` in production (e.g. `next start` vs standalone output).
  // On the VM, the canonical path is typically: `/var/www/baligirls/app/Assets/Creator/clean_image`.
  const candidateDirs: string[] = [];
  if (cleanImageDirOverride) candidateDirs.push(cleanImageDirOverride);

  const cwd = process.cwd();
  for (let up = 0; up <= 6; up++) {
    const base = path.resolve(cwd, ...Array(up).fill(".."));
    candidateDirs.push(path.join(base, "app", "Assets", "Creator", "clean_image"));
    candidateDirs.push(path.join(base, "Assets", "Creator", "clean_image"));
  }

  try {
    // Read the file from the first directory that contains it.
    let file: ArrayBuffer | null = null;
    for (const dir of candidateDirs) {
      try {
        const buf = await fs.readFile(path.join(dir, filename));
        // `NextResponse` typing in this Next.js version is picky; pass an ArrayBuffer.
        file = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
        break;
      } catch {
        // try next candidate
      }
    }
    if (!file) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const ext = path.extname(filename).toLowerCase();
    const contentType = MIME_BY_EXT[ext] ?? "application/octet-stream";
    return new NextResponse(file, {
      status: 200,
      headers: {
        "content-type": contentType,
        "cache-control": "public, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
