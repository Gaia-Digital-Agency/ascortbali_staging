import Link from "next/link";
import { BottomAdCard, MainAdSpaces } from "../components/AdvertisingSpaces";
import { API_BASE } from "../lib/api";
import { withBasePath } from "../lib/paths";
import fs from "fs/promises";
import path from "path";

type Creator = {
  uuid: string;
  model_name?: string | null;
  username?: string | null;
  image_file?: string | null;
  age?: number | null;
  nationality?: string | null;
  orientation?: string | null;
  height?: string | null;
  bust_size?: string | null;
};

type PageRow = {
  uuid?: string;
  ID?: string;
  name?: string;
  Age?: number | string;
  Nationality?: string;
  Orientation?: string;
  Height?: string;
  "Bust size"?: string;
};

type ImageRow = {
  page_uuid?: string;
  profile_id?: string;
  file?: string;
};

const toImageUrl = (file?: string | null) => {
  if (!file) return null;
  const parts = file.split("/");
  const filename = parts[parts.length - 1];
  return withBasePath(`/api/clean-image/${encodeURIComponent(filename)}`);
};

const getPageSize = (page: number) => {
  if (page === 1 || page === 2) return 50;
  if (page === 3) return 35;
  return 50;
};

const getPageStart = (page: number) => {
  if (page <= 1) return 0;
  if (page === 2) return 50;
  if (page === 3) return 100;
  return 135 + (page - 4) * 50;
};

const getTotalPages = (totalSlots: number) => {
  if (totalSlots <= 50) return 1;
  if (totalSlots <= 100) return 2;
  if (totalSlots <= 135) return 3;
  return 3 + Math.ceil((totalSlots - 135) / 50);
};

const loadLocalCreators = async (): Promise<Creator[]> => {
  try {
    const repoRoot = path.join(process.cwd(), "..");
    const pageDataPath = path.join(repoRoot, "data", "page_data.json");
    const imageDataPath = path.join(repoRoot, "data", "image_data.json");
    const pageData = JSON.parse(await fs.readFile(pageDataPath, "utf-8")) as PageRow[];
    const imageData = JSON.parse(await fs.readFile(imageDataPath, "utf-8")) as ImageRow[];

    return pageData.map((creator, index) => {
      const image = imageData.find((img) => img.page_uuid === creator.uuid || img.profile_id === creator.ID);
      return {
        uuid: creator.uuid ?? `sample-${index}`,
        model_name: creator.name ?? `Creator ${index + 1}`,
        username: creator.name ?? null,
        image_file: image?.file ?? null,
        age: Number(creator.Age ?? 0) || null,
        nationality: creator.Nationality ?? null,
        orientation: creator.Orientation ?? null,
        height: creator.Height ?? null,
        bust_size: creator["Bust size"] ?? null,
      };
    });
  } catch {
    return [];
  }
};

const ageBand = (age?: number | null) => {
  if (!age || age < 18) return "unknown";
  if (age <= 24) return "18-24";
  if (age <= 29) return "25-29";
  if (age <= 34) return "30-34";
  return "35+";
};

const normalize = (value?: string | null) => (value ?? "").trim().toLowerCase();

export default async function Page({
  searchParams,
}: {
  searchParams?: { page?: string; nationality?: string; orientation?: string; age?: string; height?: string; bust_size?: string };
}) {
  const page = Math.max(Number(searchParams?.page ?? "1") || 1, 1);
  const selectedNationality = normalize(searchParams?.nationality);
  const selectedOrientation = normalize(searchParams?.orientation);
  const selectedAge = normalize(searchParams?.age);
  const selectedHeight = normalize(searchParams?.height);
  const selectedBustSize = normalize(searchParams?.bust_size);
  let creators: Creator[] = [];

  try {
    const res = await fetch(`${API_BASE}/creators?page=1&limit=500`, { cache: "no-store" });
    if (res.ok) {
      const data = (await res.json()) as { items?: Creator[] };
      creators = Array.isArray(data.items) ? data.items : [];
    }
  } catch {
    creators = [];
  }
  if (creators.length === 0) {
    creators = await loadLocalCreators();
  }

  const nationalityOptions = Array.from(new Set(creators.map((c) => (c.nationality ?? "").trim()).filter(Boolean))).sort();
  const orientationOptions = Array.from(new Set(creators.map((c) => (c.orientation ?? "").trim()).filter(Boolean))).sort();
  const heightOptions = Array.from(new Set(creators.map((c) => (c.height ?? "").trim()).filter(Boolean))).sort();
  const bustSizeOptions = Array.from(new Set(creators.map((c) => (c.bust_size ?? "").trim()).filter(Boolean))).sort();
  const ageOptions = ["18-24", "25-29", "30-34", "35+"];

  const hasActiveFilters = Boolean(selectedNationality || selectedOrientation || selectedAge || selectedHeight || selectedBustSize);
  const filteredCreators = creators.filter((creator) => {
    if (selectedNationality && normalize(creator.nationality) !== selectedNationality) return false;
    if (selectedOrientation && normalize(creator.orientation) !== selectedOrientation) return false;
    if (selectedAge && ageBand(creator.age).toLowerCase() !== selectedAge) return false;
    if (selectedHeight && normalize(creator.height) !== selectedHeight) return false;
    if (selectedBustSize && normalize(creator.bust_size) !== selectedBustSize) return false;
    return true;
  });

  const activeCreators = hasActiveFilters ? filteredCreators : creators;

  const baselineSlots = 135;
  const totalSlots = hasActiveFilters ? activeCreators.length : Math.max(baselineSlots, activeCreators.length);
  const totalPages = getTotalPages(totalSlots);
  const safePage = Math.min(page, totalPages);
  const pageSize = getPageSize(safePage);
  const pageStart = getPageStart(safePage);
  const pageEnd = Math.min(pageStart + pageSize, totalSlots);
  const pageSlots = Array.from({ length: Math.max(pageEnd - pageStart, 0) }, (_, idx) => pageStart + idx);

  const makePageHref = (targetPage: number) => {
    const params = new URLSearchParams();
    params.set("page", String(targetPage));
    if (selectedNationality) params.set("nationality", selectedNationality);
    if (selectedOrientation) params.set("orientation", selectedOrientation);
    if (selectedAge) params.set("age", selectedAge);
    if (selectedHeight) params.set("height", selectedHeight);
    if (selectedBustSize) params.set("bust_size", selectedBustSize);
    return `/?${params.toString()}`;
  };

  return (
    <div className="space-y-14">
      <section className="space-y-6">
        <div>
          <div className="text-xs tracking-luxe text-brand-muted">HOMEPAGE ADS</div>
        </div>
        <MainAdSpaces />
      </section>

      <section className="space-y-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          <select className="rounded-full border border-brand-line bg-brand-bg/70 px-4 py-2 text-xs tracking-[0.18em] text-brand-muted" defaultValue={selectedNationality || ""} name="nationality" form="creator-filter-form">
            <option value="">ALL NATIONALITIES</option>
            {nationalityOptions.map((option) => (
              <option key={option} value={option.toLowerCase()}>
                {option}
              </option>
            ))}
          </select>
          <select className="rounded-full border border-brand-line bg-brand-bg/70 px-4 py-2 text-xs tracking-[0.18em] text-brand-muted" defaultValue={selectedOrientation || ""} name="orientation" form="creator-filter-form">
            <option value="">ALL ORIENTATIONS</option>
            {orientationOptions.map((option) => (
              <option key={option} value={option.toLowerCase()}>
                {option}
              </option>
            ))}
          </select>
          <select className="rounded-full border border-brand-line bg-brand-bg/70 px-4 py-2 text-xs tracking-[0.18em] text-brand-muted" defaultValue={selectedAge || ""} name="age" form="creator-filter-form">
            <option value="">ALL AGES</option>
            {ageOptions.map((option) => (
              <option key={option} value={option.toLowerCase()}>
                {option}
              </option>
            ))}
          </select>
          <select className="rounded-full border border-brand-line bg-brand-bg/70 px-4 py-2 text-xs tracking-[0.18em] text-brand-muted" defaultValue={selectedHeight || ""} name="height" form="creator-filter-form">
            <option value="">ALL HEIGHTS</option>
            {heightOptions.map((option) => (
              <option key={option} value={option.toLowerCase()}>
                {option}
              </option>
            ))}
          </select>
          <select className="rounded-full border border-brand-line bg-brand-bg/70 px-4 py-2 text-xs tracking-[0.18em] text-brand-muted" defaultValue={selectedBustSize || ""} name="bust_size" form="creator-filter-form">
            <option value="">ALL BUST SIZES</option>
            {bustSizeOptions.map((option) => (
              <option key={option} value={option.toLowerCase()}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <form id="creator-filter-form" action="/" className="flex gap-3">
          <button className="btn btn-outline py-2" type="submit">
            APPLY FILTERS
          </button>
          <Link className="btn btn-ghost py-2" href="/">
            CLEAR
          </Link>
        </form>

        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-xs tracking-luxe text-brand-muted">GIRLS</div>
            <h2 className="mt-3 font-display text-3xl md:text-4xl">BALI GIRLS</h2>
            <p className="mt-3 text-sm text-brand-muted">
              Page {safePage}: {pageSlots.length} slots. {hasActiveFilters ? `Matched creators: ${activeCreators.length}.` : "Baseline capacity is 135 slots (50 / 50 / 35)."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={makePageHref(p)}
                className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs ${
                  p === safePage
                    ? "border-brand-gold bg-brand-gold/20 text-brand-text"
                    : "border-brand-line text-brand-muted hover:border-brand-gold hover:text-brand-text"
                }`}
              >
                {p}
              </Link>
            ))}
          </div>
        </div>

        <div className="mx-auto grid max-w-xs gap-4 sm:max-w-none sm:grid-cols-2 lg:grid-cols-5">
          {pageSlots.map((slotIndex) => {
            const creator = activeCreators[slotIndex];
            if (!creator) {
              return (
                <div
                  key={`slot-${slotIndex + 1}`}
                  className="aspect-[9/16] overflow-hidden rounded-2xl border border-brand-line bg-brand-surface/40"
                >
                  <div className="flex h-[90%] items-center justify-center bg-black/30 text-xs tracking-[0.22em] text-brand-muted">
                    SLOT {slotIndex + 1}
                  </div>
                  <div className="flex h-[10%] items-center justify-center border-t border-brand-line text-xs text-brand-muted">
                    AVAILABLE
                  </div>
                </div>
              );
            }

            const displayName = creator.model_name || creator.username || "Creator";
            return (
              <Link
                key={creator.uuid}
                href={`/creator/preview/${creator.uuid}`}
                className="group aspect-[9/16] overflow-hidden rounded-2xl border border-brand-line bg-brand-surface/50"
              >
                <div className="h-[90%] overflow-hidden">
                  <img
                    src={toImageUrl(creator.image_file) ?? "/placeholders/card-1.jpg"}
                    alt={displayName}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="flex h-[10%] items-center justify-center border-t border-brand-line bg-black/40 px-2 text-xs uppercase tracking-[0.14em]">
                  {displayName}
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="space-y-4">
        <div className="text-xs tracking-luxe text-brand-muted">BOTTOM AD</div>
        <BottomAdCard />
      </section>
    </div>
  );
}
