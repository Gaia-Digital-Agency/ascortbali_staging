// This route handles file uploads to Google Cloud Storage.
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { randomUUID } from "crypto";
import { getObjectKey, uploadObject } from "../../../lib/gcs";

// POST handler for uploading a single file.
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // Read the file from the form data and prepare it for upload.
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const contentType = file.type || "application/octet-stream";

  // Generate a unique filename and upload the file to GCS.
  const ext = path.extname(file.name) || ".jpg";
  const filename = `${Date.now()}-${randomUUID().slice(0, 8)}${ext}`;
  const objectKey = getObjectKey(filename);
  await uploadObject({ objectKey, buffer, contentType });

  // Return the URL of the uploaded file.
  const basePath = (process.env.NEXT_BASE_PATH || "").replace(/\/+$/g, "");
  return NextResponse.json({ url: `${basePath}/api/uploads/${objectKey}` });
}
