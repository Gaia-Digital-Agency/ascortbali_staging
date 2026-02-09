"use client";

import { useEffect, useState } from "react";
import { API_BASE } from "../lib/api";
import { withBasePath } from "../lib/paths";

type AdSpace = {
  slot: "home-1" | "home-2" | "home-3" | "bottom";
  image: string | null;
  text: string | null;
};

const adLinkBySlot: Record<string, string> = {
  "home-1": "https://lightcyan-horse-210187.hostingersite.com/",
  "home-2": "https://www.humanspedia.com/",
  "home-3": "https://www.baligirls.com/",
};

const fallbackAds: AdSpace[] = [
  { slot: "home-1", image: withBasePath("/api/admin-asset/unique.png"), text: null },
  { slot: "home-2", image: withBasePath("/api/admin-asset/humapedia.png"), text: null },
  { slot: "home-3", image: null, text: null },
  { slot: "bottom", image: null, text: "Your Ads Here" },
];

function normalizeAdImage(image: string | null) {
  const raw = (image ?? "").trim();
  if (!raw) return null;
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  // Backend stores dev-style paths ("/api/..."), but the app is mounted under `/baligirls`.
  if (raw.startsWith("/api/")) return withBasePath(raw);
  return raw;
}

function normalizeAdSpace(ad: AdSpace): AdSpace {
  return { ...ad, image: normalizeAdImage(ad.image) };
}

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
          setAds([
            map.get("home-1") ?? fallbackAds[0],
            map.get("home-2") ?? fallbackAds[1],
            map.get("home-3") ?? fallbackAds[2],
            map.get("bottom") ?? fallbackAds[3],
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

export function MainAdSpaces() {
  const ads = useAdSpaces();
  const homeAds = ads.filter((ad) => ad.slot !== "bottom");

  return (
    <div className="mx-auto grid max-w-xs gap-5 sm:max-w-none sm:grid-cols-2 md:grid-cols-3">
      {homeAds.map((ad) => (
        <a
          key={ad.slot}
          href={adLinkBySlot[ad.slot] ?? "#"}
          target="_blank"
          rel="noreferrer noopener"
          className="aspect-[9/16] overflow-hidden rounded-3xl border border-brand-line bg-brand-surface/50 shadow-luxe"
        >
          {ad.image ? (
            <img src={ad.image} alt={ad.slot} className="h-full w-full object-cover" />
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

export function BottomAdCard() {
  const ads = useAdSpaces();
  const bottom = ads.find((ad) => ad.slot === "bottom");

  return (
    <div className="rounded-3xl border border-brand-gold/60 bg-brand-surface/40 p-8 text-center font-display text-2xl">
      {bottom?.text?.trim() || "Your Ads Here"}
    </div>
  );
}
