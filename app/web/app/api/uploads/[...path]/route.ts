// This route serves uploaded files from Google Cloud Storage.
import { NextResponse } from "next/server";
import { downloadObject } from "../../../../lib/gcs";

// GET handler for serving a single uploaded file from GCS.
export async function GET(
  _req: Request,
  { params }: { params: { path: string[] } }
) {
  const objectKey = (params.path || []).join("/");
  if (!objectKey) {
    return NextResponse.json({ error: "Missing object path" }, { status: 400 });
  }
  // Basic traversal guard.
  if (objectKey.includes("..")) {
    return NextResponse.json({ error: "Invalid object path" }, { status: 400 });
  }

  // Download the requested object from GCS and serve it.
  const file = await downloadObject(objectKey);
  if (!file) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(file.data), {
    status: 200,
    headers: {
      "content-type": file.contentType,
      "cache-control": "public, max-age=3600",
    },
  });
}
