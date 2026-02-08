import { notFound } from "next/navigation";
import { API_BASE } from "../../../../lib/api";
import { withBasePath } from "../../../../lib/paths";
import fs from "fs/promises";
import path from "path";
import CreatorPreviewClient from "./CreatorPreviewClient";

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
  "Bust type"?: string;
  "Pubic hair"?: string;
  "Meeting with"?: string;
  Services?: string;
  url?: string;
};

type ImageRow = {
  file?: string;
  profile_id?: string;
  page_uuid?: string;
  id?: string;
};

const toImageUrl = (file?: string) => {
  if (!file) return null;
  const parts = file.split("/");
  const filename = parts[parts.length - 1];
  return withBasePath(`/api/clean-image/${encodeURIComponent(filename)}`);
};

export default async function CreatorPreview({ params }: { params: { id: string } }) {
  const uuid = params.id;

  let creator: PageRow | null = null;
  let images: ImageRow[] = [];

  try {
    const res = await fetch(`${API_BASE}/creators/${uuid}`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      const raw = data.creator as any;
      creator = {
        uuid: raw.uuid,
        ID: raw.provider_id,
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
        "Pubic hair": raw.pubic_hair,
        Height: raw.height,
        Weight: raw.weight,
        "Bust size": raw.bust_size,
        "Bust type": raw.bust_type,
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

  if (!creator) return notFound();

  const imagesLimited = images.slice(0, 7);
  const primaryImageUrl = toImageUrl(imagesLimited[0]?.file);
  const hairLength = creator["Hair length"] || creator["Hair lenght"];

  const fields: Array<[string, string | number | undefined]> = [
    ["Provider ID", creator.ID],
    ["Name", creator.name],
    ["Title", creator.Title],
    ["Age", creator.Age],
    ["Gender", creator.Gender],
    ["Nationality", creator.Nationality],
    ["Languages", creator.Languages],
    ["City", creator.City],
    ["Country", creator.Country],
    ["Location", creator.Location],
    ["Phone Number", creator["Phone Number"]],
    ["Telegram ID", creator["Telegram ID"]],
    ["WeChat ID", creator["WeChat ID"]],
    ["Hair Color", creator["Hair color"]],
    ["Hair Length", hairLength],
    ["Height", creator.Height],
    ["Weight", creator.Weight],
    ["Bust Size", creator["Bust size"]],
    ["Bust Type", creator["Bust type"]],
    ["Pubic Hair", creator["Pubic hair"]],
    ["Meeting With", creator["Meeting with"]],
    ["Services", creator.Services],
  ];

  return (
    <CreatorPreviewClient
      title={creator.Title ?? creator.name ?? "Creator"}
      subtitle="Sample page populated from `app/data/page_data.json`."
      creatorName={creator.name ?? "Creator"}
      primaryImageUrl={primaryImageUrl ?? "/placeholders/hero-1.jpg"}
      primaryImageFile={imagesLimited[0]?.file ?? "—"}
      fields={fields}
      images={imagesLimited.map((img) => ({
        id: img.id,
        file: img.file,
        imageUrl: toImageUrl(img.file) ?? "/placeholders/card-1.jpg",
      }))}
      sourceUrl={creator.url ?? "—"}
    />
  );
}
