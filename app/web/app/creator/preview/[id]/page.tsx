// This module defines the server-side logic for displaying a single creator's preview page.
import { notFound } from "next/navigation";
import { API_BASE } from "../../../../lib/api";
import { APP_BASE_PATH, withBasePath } from "../../../../lib/paths";
import fs from "fs/promises";
import path from "path";
import CreatorPreviewClient from "./CreatorPreviewClient";

// Type definitions for raw creator data from JSON and images.
type PageRow = {
  ID?: string;
  uuid?: string;
  name?: string;
  Title?: string;
  Age?: number | string;
  Gender?: string;
  Nationality?: string;
  Languages?: string;
  City?: string;
  Country?: string;
  Location?: string;
  "Phone Number"?: string;
  "Telegram ID"?: string;
  "WeChat ID"?: string;
  "Hair color"?: string;
  "Hair lenght"?: string;
  "Hair length"?: string;
  Height?: string;
  Weight?: string;
  "Bust size"?: string;
  "Meeting with"?: string;
  Services?: string;
  url?: string;
  model_name?: string;
};

type ImageRow = {
  file?: string;
  profile_id?: string;
  page_uuid?: string;
  id?: string;
};

// Utility function to convert an image file path to a displayable URL.
const toImageUrl = (file?: string) => {
  if (!file) return null;
  if (file.startsWith("http://") || file.startsWith("https://")) return file;
  if (file.startsWith("/")) {
    if (APP_BASE_PATH && file.startsWith(`${APP_BASE_PATH}/`)) return file;
    return withBasePath(file);
  }
  const parts = file.split("/");
  const filename = parts[parts.length - 1];
  return withBasePath(`/api/clean-image/${encodeURIComponent(filename)}`);
};

const normalizeCreatorName = (value?: string | null) => {
  const raw = (value ?? "").trim();
  if (!raw) return "Creator";
  const stripped = raw
    .replace(/^\s*(?:Escort|Girl|Miss)\s+/i, "")
    .replace(/\s*-\s*.*$/, "")
    .replace(/\s*[|,].*$/, "")
    .trim();
  return stripped || raw;
};

// Default asynchronous server component for Creator Preview page.
export default async function CreatorPreview({ params }: { params: { id: string } }) {
  const uuid = params.id;

  let creator: PageRow | null = null;
  let images: ImageRow[] = [];
  let nextCreatorId: string | null = null;

  try {
    // Attempt to fetch creator data from the API.
    const res = await fetch(`${API_BASE}/creators/${uuid}`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      const raw = data.creator as any;
      creator = {
        uuid: raw.uuid,
        ID: raw.provider_id,
        model_name: raw.model_name,
        name: raw.model_name ?? raw.name,
        Title: raw.title,
        Age: raw.age,
        Gender: raw.gender,
        Nationality: raw.nationality,
        Languages: raw.languages,
        City: raw.city,
        Country: raw.country,
        Location: raw.location,
        "Phone Number": raw.phone_number,
        "Telegram ID": raw.telegram_id,
        "WeChat ID": raw.wechat_id,
        "Hair color": raw.hair_color,
        "Hair length": raw.hair_length,
        Height: raw.height,
        Weight: raw.weight,
        "Meeting with": raw.meeting_with,
        Services: raw.services,
        url: raw.url,
      };
      images = ((data.images as any[]) ?? []).map((img) => ({
        id: img.image_id,
        file: img.image_file,
        profile_id: raw.provider_id,
        page_uuid: raw.uuid,
      }));
    }
  } catch {
    // fallback to local data below
  }

  // Fallback to local JSON data if API fetch fails.
  if (!creator) {
    try {
      const repoRoot = path.join(process.cwd(), "..");
      const pageDataPath = path.join(repoRoot, "data", "page_data.json");
      const imageDataPath = path.join(repoRoot, "data", "image_data.json");
      const creators = JSON.parse(await fs.readFile(pageDataPath, "utf-8")) as PageRow[];
      const imageData = JSON.parse(await fs.readFile(imageDataPath, "utf-8")) as ImageRow[];
      creator = creators.find((c) => c.uuid === uuid) ?? null;
      if (creator) {
        images = imageData.filter((img) => img.page_uuid === creator?.uuid);
      }
    } catch {
      return notFound();
    }
  }

  // If no creator is found, return a 404.
  if (!creator) return notFound();

  // Prepare data for the client component.
  const imagesLimited = images.slice(0, 20);
  const primaryImageUrl = toImageUrl(imagesLimited[0]?.file);
  const hairLength = creator["Hair length"] || creator["Hair lenght"];
  const displayName = normalizeCreatorName(creator.model_name || creator.name || "Creator");

  const nextPageUrl = `${API_BASE}/creators?page=1&limit=500`;
  try {
    const listRes = await fetch(nextPageUrl, { cache: "no-store" });
    if (listRes.ok) {
      const listData = (await listRes.json()) as { items?: Array<{ uuid?: string }> };
      const list = Array.isArray(listData.items) ? listData.items : [];
      const index = list.findIndex((item) => item.uuid === uuid);
      if (index >= 0 && index + 1 < list.length) nextCreatorId = list[index + 1].uuid ?? null;
    }
  } catch {
    nextCreatorId = null;
  }

  // Define fields to display on the creator's profile.
  const fields: Array<[string, string | number | undefined]> = [
    ["Name", displayName],
    ["Age", creator.Age],
    ["Gender", creator.Gender],
    ["Nationality", creator.Nationality],
    ["Languages", creator.Languages],
    ["City", creator.City],
    ["Country", creator.Country],
    ["Location", creator.Location],
    ["Phone Number", creator["Phone Number"]],
    ["WeChat ID", creator["WeChat ID"]],
    ["Hair Color", creator["Hair color"]],
    ["Hair Length", hairLength],
    ["Height", creator.Height],
    ["Weight", creator.Weight],
    ["Meeting With", creator["Meeting with"]],
    ["Services", creator.Services],
  ];

  // Render the client-side CreatorPreviewClient component with fetched data.
  return (
    <CreatorPreviewClient
      title={displayName}
      creatorName={displayName}
      primaryImageUrl={primaryImageUrl}
      nextCreatorId={nextCreatorId}
      fields={fields}
      images={imagesLimited
        .map((img) => ({
          id: img.id,
          imageUrl: toImageUrl(img.file),
        }))
        .filter((img) => Boolean(img.imageUrl))}
    />
  );
}
