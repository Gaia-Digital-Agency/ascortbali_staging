"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { apiFetch, clearTokens } from "../../../lib/api";
import { withBasePath } from "../../../lib/paths";

type Me = { username: string; role: string };
type AdminStats = { creatorCount: number; userCount: number };
type AdSpace = {
  slot: "home-1" | "home-2" | "home-3" | "bottom";
  image: string | null;
  text: string | null;
};

const defaultAds: AdSpace[] = [
  { slot: "home-1", image: withBasePath("/api/admin-asset/unique.png"), text: null },
  { slot: "home-2", image: withBasePath("/api/admin-asset/humapedia.png"), text: null },
  { slot: "home-3", image: null, text: null },
  { slot: "bottom", image: null, text: "Your Ads Here" },
];
const APP_BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/+$/g, "");

function normalizeAdImage(image: string | null) {
  const raw = (image ?? "").trim();
  if (!raw) return null;
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  if (raw.startsWith("/api/")) return withBasePath(raw);
  if (APP_BASE_PATH && raw.startsWith(`${APP_BASE_PATH}/`)) return raw;
  return raw;
}

function toStoredImage(image: string | null) {
  const raw = (image ?? "").trim();
  if (!raw) return null;
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  if (APP_BASE_PATH && raw.startsWith(`${APP_BASE_PATH}/`)) {
    const stripped = raw.slice(APP_BASE_PATH.length);
    return stripped.startsWith("/") ? stripped : `/${stripped}`;
  }
  return raw;
}

function normalizeAdSpace(ad: AdSpace): AdSpace {
  return { ...ad, image: normalizeAdImage(ad.image) };
}

export default function AdminDashboard() {
  const [me, setMe] = useState<Me | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [ads, setAds] = useState<AdSpace[]>(defaultAds);
  const [error, setError] = useState<string | null>(null);
  const [savingSlot, setSavingSlot] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const profile = await apiFetch("/me");
        if (profile.role !== "admin") {
          clearTokens();
          window.location.href = withBasePath("/admin");
          return;
        }
        setMe(profile);
        const [statsData, adsData] = await Promise.all([apiFetch("/admin/stats"), apiFetch("/admin/ads")]);
        setStats(statsData);
        if (Array.isArray(adsData) && adsData.length) setAds(adsData.map(normalizeAdSpace));
      } catch {
        clearTokens();
        window.location.href = withBasePath("/admin");
      }
    })();
  }, []);

  const updateAd = (slot: AdSpace["slot"], patch: Partial<AdSpace>) => {
    setAds((prev) => prev.map((ad) => (ad.slot === slot ? { ...ad, ...patch } : ad)));
  };

  const saveSlot = async (slot: AdSpace["slot"]) => {
    const ad = ads.find((item) => item.slot === slot);
    if (!ad) return;
    setSavingSlot(slot);
    setError(null);
    try {
      await apiFetch(`/admin/ads/${slot}`, {
        method: "PUT",
        body: JSON.stringify({
          image: slot === "bottom" ? null : toStoredImage(ad.image),
          text: slot === "bottom" ? ad.text : null,
        }),
      });
    } catch (err: any) {
      setError(err.message ?? "Failed to save ad slot.");
    } finally {
      setSavingSlot(null);
    }
  };

  const clearSlot = async (slot: AdSpace["slot"]) => {
    setSavingSlot(slot);
    setError(null);
    try {
      await apiFetch(`/admin/ads/${slot}`, { method: "DELETE" });
      if (slot === "bottom") {
        updateAd("bottom", { text: "Your Ads Here" });
      } else {
        updateAd(slot, { image: null });
      }
    } catch (err: any) {
      setError(err.message ?? "Failed to clear ad slot.");
    } finally {
      setSavingSlot(null);
    }
  };

  const logout = () => {
    clearTokens();
    window.location.assign(withBasePath("/"));
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs tracking-luxe text-brand-muted">ADMIN</div>
          <h1 className="mt-2 font-display text-3xl">Ads CRUD</h1>
          <p className="mt-2 text-sm text-brand-muted">{me ? `Signed in as ${me.username}` : "Loading..."}</p>
        </div>
        <div className="flex gap-3">
          <Link className="btn btn-outline" href="/">
            BACK HOME
          </Link>
          <button onClick={logout} className="btn btn-outline">
            LOGOUT
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-brand-line bg-brand-surface/55 p-6 shadow-luxe">
          <div className="text-xs tracking-[0.22em] text-brand-muted">REGISTERED CREATORS</div>
          <div className="mt-4 font-display text-3xl text-brand-text">{stats?.creatorCount ?? "—"}</div>
        </div>
        <div className="rounded-3xl border border-brand-line bg-brand-surface/55 p-6 shadow-luxe">
          <div className="text-xs tracking-[0.22em] text-brand-muted">REGISTERED USERS</div>
          <div className="mt-4 font-display text-3xl text-brand-text">{stats?.userCount ?? "—"}</div>
        </div>
      </div>

      <div className="rounded-3xl border border-brand-line bg-brand-surface/55 p-7 shadow-luxe">
        <div className="text-xs tracking-[0.22em] text-brand-muted">HOMEPAGE IMAGE ADS (1, 2, 3)</div>
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {(["home-1", "home-2", "home-3"] as const).map((slot) => {
            const ad = ads.find((item) => item.slot === slot);
            return (
              <ImageAdEditor
                key={slot}
                slot={slot}
                image={ad?.image ?? null}
                busy={savingSlot === slot}
                onChange={(image) => updateAd(slot, { image })}
                onSave={() => saveSlot(slot)}
                onClear={() => clearSlot(slot)}
              />
            );
          })}
        </div>
      </div>

      <div className="rounded-3xl border border-brand-line bg-brand-surface/55 p-7 shadow-luxe">
        <div className="text-xs tracking-[0.22em] text-brand-muted">BOTTOM CARD TEXT</div>
        <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto_auto]">
          <input
            className="rounded-2xl border border-brand-line bg-brand-surface2/40 px-4 py-3 text-sm outline-none focus:border-brand-gold/60"
            value={ads.find((a) => a.slot === "bottom")?.text ?? "Your Ads Here"}
            onChange={(e) => updateAd("bottom", { text: e.target.value })}
          />
          <button onClick={() => saveSlot("bottom")} disabled={savingSlot === "bottom"} className="btn btn-primary py-3">
            {savingSlot === "bottom" ? "SAVING..." : "SAVE"}
          </button>
          <button onClick={() => clearSlot("bottom")} disabled={savingSlot === "bottom"} className="btn btn-outline py-3">
            RESET
          </button>
        </div>
      </div>

      {error ? <div className="text-xs text-red-400">{error}</div> : null}
    </div>
  );
}

function ImageAdEditor({
  slot,
  image,
  busy,
  onChange,
  onSave,
  onClear,
}: {
  slot: "home-1" | "home-2" | "home-3";
  image: string | null;
  busy: boolean;
  onChange: (value: string) => void;
  onSave: () => void;
  onClear: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${APP_BASE_PATH}/api/upload`, { method: "POST", body: form });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error ?? "Upload failed");
    onChange(data.url);
  };

  return (
    <div className="space-y-3 rounded-2xl border border-brand-line bg-brand-surface2/40 p-4">
      <div className="text-xs tracking-[0.22em] text-brand-muted uppercase">{slot}</div>
      <div className="aspect-[9/16] overflow-hidden rounded-xl border border-brand-line">
        {image ? (
          <img src={image} alt={slot} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs tracking-[0.22em] text-brand-muted">
            EMPTY
          </div>
        )}
      </div>
      <input
        className="w-full rounded-xl border border-brand-line bg-brand-surface2/40 px-3 py-2 text-xs outline-none focus:border-brand-gold/60"
        value={image ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Image URL or /uploads path"
      />
      <div className="flex gap-2">
        <button onClick={onSave} disabled={busy} className="btn btn-primary px-3 py-2 text-xs">
          {busy ? "..." : "SAVE"}
        </button>
        <button onClick={onClear} disabled={busy} className="btn btn-outline px-3 py-2 text-xs">
          CLEAR
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="btn btn-outline px-3 py-2 text-xs"
        >
          UPLOAD
        </button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          try {
            await upload(file);
          } catch {
            // silent; parent save handles persistence
          }
        }}
      />
    </div>
  );
}
