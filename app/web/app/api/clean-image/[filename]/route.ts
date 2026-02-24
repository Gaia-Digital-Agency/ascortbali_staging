// This route serves "clean" (watermark-free) images for creators.
import { NextResponse } from "next/server";
import { downloadObject, getObjectKey } from "../../../../lib/gcs";

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

  try {
    const objectKey = getObjectKey(filename);
    const file = await downloadObject(objectKey);
    if (!file) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const ext = filename.slice(filename.lastIndexOf(".")).toLowerCase();
    const contentType = MIME_BY_EXT[ext] ?? "application/octet-stream";
    return new NextResponse(new Uint8Array(file.data), {
      status: 200,
      headers: {
        "content-type": file.contentType || contentType,
        "cache-control": "public, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
