import { Storage } from "@google-cloud/storage";

// Use bracket access so Next/webpack doesn't eagerly inline env vars at build time.
// We want the runtime env from `next start` / PM2 to be honored.
const bucketName = process.env["GCS_BUCKET_NAME"] ?? "gda-s01";
const rawPrefix = process.env["GCS_UPLOAD_PREFIX"] ?? "baligirls/uploads";
const objectPrefix = rawPrefix.replace(/^\/+|\/+$/g, "");
const storage = new Storage();

function bucket() {
  return storage.bucket(bucketName);
}

export function getObjectKey(filename: string) {
  return `${objectPrefix}/${filename}`.replace(/\/{2,}/g, "/");
}

export async function uploadObject(params: {
  objectKey: string;
  buffer: Buffer;
  contentType: string;
}) {
  const { objectKey, buffer, contentType } = params;
  const file = bucket().file(objectKey);
  await file.save(buffer, {
    resumable: false,
    contentType,
    metadata: {
      cacheControl: "public, max-age=3600",
    },
  });
}

export async function downloadObject(objectKey: string) {
  const file = bucket().file(objectKey);
  const [exists] = await file.exists();
  if (!exists) return null;

  const [metadataResponse, downloadResponse] = await Promise.all([file.getMetadata(), file.download()]);
  const [metadata] = metadataResponse;
  const [data] = downloadResponse;
  return {
    contentType: metadata.contentType ?? "application/octet-stream",
    data,
  };
}
