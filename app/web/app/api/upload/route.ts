import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { randomUUID } from "crypto";
import { getObjectKey, uploadObject } from "../../../lib/gcs";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const contentType = file.type || "application/octet-stream";

  const ext = path.extname(file.name) || ".jpg";
  const filename = `${Date.now()}-${randomUUID().slice(0, 8)}${ext}`;
  const objectKey = getObjectKey(filename);
  await uploadObject({ objectKey, buffer, contentType });

  const basePath = (process.env.NEXT_BASE_PATH || "").replace(/\/+$/g, "");
  return NextResponse.json({ url: `${basePath}/api/uploads/${objectKey}` });
}
