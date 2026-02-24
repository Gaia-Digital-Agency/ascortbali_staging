// This module defines components and logic for displaying advertising spaces.
"use client";

import { useEffect, useState } from "react";
import { API_BASE } from "../lib/api";
import { withBasePath } from "../lib/paths";

// Type definition for an advertising space.
type AdSpace = {
  slot: "home-1" | "home-2" | "home-3" | "bottom";
  image: string | null;
  text: string | null;
  link_url: string | null;
};

// Default links in case DB has no URL yet.
const fallbackLinkBySlot: Record<string, string> = {
  "home-1": "https://lightcyan-horse-210187.hostingersite.com/",
  "home-2": "https://www.humanspedia.com/",
  "home-3": "https://www.baligirls.com/",
};

// Fallback advertising data to be used if API call fails or is empty.
const fallbackAds: AdSpace[] = [
  {
    slot: "home-1",
    image: withBasePath("/api/uploads/baligirls/ads/unique.png"),
    text: null,
    link_url: fallbackLinkBySlot["home-1"],
  },
  {
    slot: "home-2",
    image: withBasePath("/api/uploads/baligirls/ads/humapedia.png"),
    text: null,
    link_url: fallbackLinkBySlot["home-2"],
  },
  { slot: "home-3", image: null, text: null, link_url: fallbackLinkBySlot["home-3"] },
  { slot: "bottom", image: null, text: "Your Ads Here", link_url: null },
];

const fallbackImageBySlot: Partial<Record<AdSpace["slot"], string>> = {
  "home-1": fallbackAds[0].image!,
  "home-2": fallbackAds[1].image!,
};

// Normalizes an ad image URL to include the base path if necessary.
function normalizeAdImage(image: string | null) {
  const raw = (image ?? "").trim();
  if (!raw) return null;
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  // Backend stores dev-style paths ("/api/..."), but the app is mounted under `/baligirls`.
  if (raw.startsWith("/api/")) return withBasePath(raw);
  return raw;
}

// Normalizes an entire advertising space object.
function normalizeAdSpace(ad: AdSpace): AdSpace {
  return { ...ad, image: normalizeAdImage(ad.image), link_url: ad.link_url?.trim() || null };
}

// Custom hook to fetch and manage advertising spaces.
export function useAdSpaces() {
  const [ads, setAds] = useState<AdSpace[]>(fallbackAds);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/ads`, { signal: controller.signal });
        if (!res.ok) return;
        const data = (await res.json()) as AdSpace[];
        if (Array.isArray(data) && data.length) {
          const map = new Map(data.map((item) => [item.slot, normalizeAdSpace(item)]));
          const mergeSlot = (slot: AdSpace["slot"], fallback: AdSpace) => {
            const fromApi = map.get(slot);
            if (!fromApi) return fallback;
            return {
              ...fallback,
              ...fromApi,
              image: fromApi.image ?? fallback.image,
              link_url: fromApi.link_url ?? fallback.link_url,
            };
          };
          setAds([
            mergeSlot("home-1", fallbackAds[0]),
            mergeSlot("home-2", fallbackAds[1]),
            mergeSlot("home-3", fallbackAds[2]),
            mergeSlot("bottom", fallbackAds[3]),
          ]);
        }
      } catch {
        if (controller.signal.aborted) return;
      }
    })();
    return () => controller.abort();
  }, []);

  return ads;
}

// Component to display the main advertising spaces on the homepage.
export function MainAdSpaces() {
  const ads = useAdSpaces();
  const homeAds = ads.filter((ad) => ad.slot !== "bottom");

  return (
    <div className="mx-auto grid max-w-xs gap-5 sm:max-w-none sm:grid-cols-2 md:grid-cols-3">
      {homeAds.map((ad) => (
        <a
          key={ad.slot}
          href={ad.link_url ?? fallbackLinkBySlot[ad.slot] ?? "#"}
          target="_blank"
          rel="noreferrer noopener"
          className="aspect-[9/16] overflow-hidden rounded-3xl border border-brand-line bg-brand-surface/50 shadow-luxe"
        >
          {ad.image ? (
            <img
              src={ad.image}
              alt={ad.slot}
              className="h-full w-full object-cover"
              onError={(event) => {
                const fallbackImage = fallbackImageBySlot[ad.slot];
                if (!fallbackImage) return;
                if (event.currentTarget.src.endsWith(fallbackImage)) return;
                event.currentTarget.src = fallbackImage;
              }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs tracking-[0.22em] text-brand-muted">
              EMPTY SLOT
            </div>
          )}
        </a>
      ))}
    </div>
  );
}

// Component to display the bottom advertising card.
export function BottomAdCard() {
  const ads = useAdSpaces();
  const bottom = ads.find((ad) => ad.slot === "bottom");

  return (
    <div className="rounded-3xl border border-brand-gold/60 bg-brand-surface/40 p-8 text-center font-display text-2xl">
      {bottom?.text?.trim() || "Your Ads Here"}
    </div>
  );
}
