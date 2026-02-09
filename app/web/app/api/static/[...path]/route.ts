import { NextResponse } from "next/server";
import { downloadObject, getStaticKey } from "../../../../lib/gcs";

export async function GET(_req: Request, { params }: { params: { path: string[] } }) {
  const parts = params.path || [];
  if (!parts.length) {
    return NextResponse.json({ error: "Missing path" }, { status: 400 });
  }

  // Basic traversal guard.
  if (parts.some((p) => !p || p === "." || p === ".." || p.includes("..") || p.includes("\\") || p.includes("\0"))) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const relPath = parts.join("/");
  const objectKey = getStaticKey(relPath);
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

