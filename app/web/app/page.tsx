// This is the main homepage component, displaying creator listings and advertising spaces.
import Link from "next/link";
import { BottomAdCard, MainAdSpaces } from "../components/AdvertisingSpaces";
import { CreatorFilterControls } from "../components/CreatorFilterControls";
import { API_BASE } from "../lib/api";
import { APP_BASE_PATH, withBasePath } from "../lib/paths";
import fs from "fs/promises";
import path from "path";

// Type definitions for Creator and raw page/image data.
type Creator = {
  uuid: string;
  model_name?: string | null;
  username?: string | null;
  image_file?: string | null;
  age?: number | null;
  nationality?: string | null;
  height?: string | null;
};

type PageRow = {
  uuid?: string;
  ID?: string;
  name?: string;
  Age?: number | string;
  Nationality?: string;
  Height?: string;
};

type ImageRow = {
  page_uuid?: string;
  profile_id?: string;
  file?: string;
};

// Utility function to construct an image URL from a filename.
const toImageUrl = (file?: string | null) => {
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

const PAGE_SIZE = 50;

// Loads creator data from local JSON files as a fallback.
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
        height: creator.Height ?? null,
      };
    });
  } catch {
    return [];
  }
};

// Helper function to categorize age into bands.
const ageBand = (age?: number | null) => {
  if (!age || age < 18) return "unknown";
  if (age <= 24) return "18-24";
  if (age <= 29) return "25-29";
  if (age <= 34) return "30-34";
  return "35+";
};

// Helper function to normalize string values for comparison.
const normalize = (value?: string | null) => (value ?? "").trim().toLowerCase();

const normalizeName = (value?: string | null) => {
  const raw = (value ?? "").trim();
  if (!raw) return "Creator";
  const stripped = raw
    .replace(/^\s*(?:Escort|Girl|Miss)\s+/i, "")
    .replace(/\s*-\s*.*$/, "")
    .replace(/\s*[|,].*$/, "")
    .trim();
  return stripped || raw;
};

// Main page component.
export default async function Page({
  searchParams,
}: {
  searchParams?: { page?: string; nationality?: string; age?: string; height?: string };
}) {
  // Parse and normalize search parameters for filtering.
  const page = Math.max(Number(searchParams?.page ?? "1") || 1, 1);
  const selectedNationality = normalize(searchParams?.nationality);
  const selectedAge = normalize(searchParams?.age);
  const selectedHeight = normalize(searchParams?.height);
  let creators: Creator[] = [];

  try {
    // Fetch creators from the API.
    const res = await fetch(`${API_BASE}/creators?page=1&limit=500`, { cache: "no-store" });
    if (res.ok) {
      const data = (await res.json()) as { items?: Creator[] };
      creators = Array.isArray(data.items) ? data.items : [];
    }
  } catch {
    // Fallback to local creators if API fetch fails.
    creators = [];
  }
  if (creators.length === 0) {
    creators = await loadLocalCreators();
  }

  // Prepare options for filter dropdowns.
  const nationalityOptions = Array.from(new Set(creators.map((c) => (c.nationality ?? "").trim()).filter(Boolean))).sort();
  const heightOptions = Array.from(new Set(creators.map((c) => (c.height ?? "").trim()).filter(Boolean))).sort();
  const ageOptions = ["18-24", "25-29", "30-34", "35+"];

  // Apply filters to the creators list.
  const hasActiveFilters = Boolean(selectedNationality || selectedAge || selectedHeight);
  const filteredCreators = creators.filter((creator) => {
    if (selectedNationality && normalize(creator.nationality) !== selectedNationality) return false;
    if (selectedAge && ageBand(creator.age).toLowerCase() !== selectedAge) return false;
    if (selectedHeight && normalize(creator.height) !== selectedHeight) return false;
    return true;
  });

  const activeCreators = hasActiveFilters ? filteredCreators : creators;

  // Calculate pagination details based on filtered creators.
  const baselineSlots = 108;
  const totalSlots = hasActiveFilters ? activeCreators.length : Math.max(baselineSlots, activeCreators.length);
  const totalPages = Math.max(1, Math.ceil(totalSlots / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const pageEnd = Math.min(pageStart + PAGE_SIZE, totalSlots);
  const pageSlots = Array.from({ length: Math.max(pageEnd - pageStart, 0) }, (_, idx) => pageStart + idx);

  // Function to create pagination hrefs with current filters.
  const makePageHref = (targetPage: number) => {
    const params = new URLSearchParams();
    params.set("page", String(targetPage));
    if (selectedNationality) params.set("nationality", selectedNationality);
    if (selectedAge) params.set("age", selectedAge);
    if (selectedHeight) params.set("height", selectedHeight);
    return `/?${params.toString()}`;
  };

  return (
    <div className="space-y-14">
      {/* Main advertising section */}
      <section className="space-y-6">
        <MainAdSpaces />
      </section>

      <section className="space-y-6">
        <div className="space-y-3">
          <h2 className="font-display text-3xl md:text-4xl">Title Goes Here</h2>
          <p className="max-w-2xl text-sm text-brand-muted">Some Text About Site Goes Here</p>
        </div>

        {/* Creator filter dropdowns */}
        <CreatorFilterControls
          selectedNationality={selectedNationality}
          selectedAge={selectedAge}
          selectedHeight={selectedHeight}
          nationalityOptions={nationalityOptions}
          ageOptions={ageOptions}
          heightOptions={heightOptions}
          className="md:grid-cols-4"
        />

        {/* Creator listing header and pagination */}
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="mt-3 font-display text-3xl md:text-4xl">FREE BALI GIRLS</h2>
            {hasActiveFilters ? (
              <p className="mt-3 text-sm text-brand-muted">Matched creators: {activeCreators.length}.</p>
            ) : null}
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

        {/* Display filtered and paginated creators */}
        <div className="mx-auto grid max-w-xs gap-4 sm:max-w-none sm:grid-cols-2 lg:grid-cols-5">
          {pageSlots.map((slotIndex) => {
            const creator = activeCreators[slotIndex];
            if (!creator) {
              return (
                // Placeholder for empty slots
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

            const displayName = normalizeName(creator.model_name || creator.username || "Creator");
            const imageUrl = toImageUrl(creator.image_file);
            return (
              // Creator card link
              <Link
                key={creator.uuid}
                href={`/creator/preview/${creator.uuid}`}
                className="group aspect-[9/16] overflow-hidden rounded-2xl border border-brand-line bg-brand-surface/50"
              >
                <div className="h-[90%] overflow-hidden">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={displayName}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-black/30 text-xs tracking-[0.22em] text-brand-muted">
                      NO IMAGE
                    </div>
                  )}
                </div>
                <div className="flex h-[10%] items-center justify-center border-t border-brand-line bg-black/40 px-2 text-xs uppercase tracking-[0.14em]">
                  {displayName}
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Bottom advertising section */}
      <section className="space-y-4">
        <BottomAdCard />
      </section>
    </div>
  );
}
