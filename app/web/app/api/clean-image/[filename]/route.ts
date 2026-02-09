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

  // Construct the full path to the requested image file.
  const rootDir = process.cwd();
  const cleanDir = path.join(rootDir, "..", "Assets", "Creator", "clean_image");
  const filePath = path.join(cleanDir, filename);

  try {
    // Read the file and return it with the correct content type.
    const file = await fs.readFile(filePath);
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
