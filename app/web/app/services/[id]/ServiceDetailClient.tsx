"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiFetch, getAccessToken } from "../../../lib/api";
import { BuyButton } from "../../../components/BuyButton";
import { FavoriteButton } from "../../../components/FavoriteButton";

export type Service = {
  id: string;
  creatorId: string;
  title: string;
  description: string;
  basePrice: string;
  durationMinutes: number;
  mainImageUrl?: string | null;
  galleryImages?: string[] | null;
  category?: { name: string } | null;
  creator?: { email?: string; providerProfile?: { displayName?: string; city?: string; country?: string } | null } | null;
};

export function ServiceDetailClient({ service }: { service: Service }) {
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const run = async () => {
      const token = getAccessToken();
      if (!token) return;
      try {
        await apiFetch("/me");
        setAuthenticated(true);
      } catch {
        setAuthenticated(false);
      }
    };
    run();
  }, []);

  const thumbnailImages = useMemo(() => {
    const galleryImages = Array.isArray(service.galleryImages) ? service.galleryImages : [];
    return [
      galleryImages[0] || "/placeholders/card-2.jpg",
      galleryImages[1] || "/placeholders/card-3.jpg",
      galleryImages[2] || "/placeholders/hero-1.jpg",
      galleryImages[3] || "/placeholders/card-2.jpg",
    ];
  }, [service.galleryImages]);

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-end">
        <Link className="text-xs tracking-[0.22em] text-brand-muted hover:text-brand-text" href="/">
          BACK HOME
        </Link>
      </div>

      <div className="relative">
        <section className={`grid gap-8 lg:grid-cols-[1.4fr_1fr] ${!authenticated ? "pointer-events-none select-none blur-sm" : ""}`}>
          <div className="space-y-5">
            <div className="relative h-[420px] overflow-hidden rounded-3xl border border-brand-line">
              <img
                src={service.mainImageUrl || "/placeholders/hero-1.jpg"}
                alt={service.title}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {thumbnailImages.map((image, index) => (
                <div key={index} className="relative h-32 overflow-hidden rounded-2xl border border-brand-line">
                  <img src={image} alt={`${service.title} ${index + 1}`} className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-brand-line bg-brand-surface/55 p-8 shadow-luxe">
            <div className="text-xs tracking-luxe text-brand-muted">
              {service.durationMinutes} MIN • {service.basePrice}
            </div>

            <h1 className="mt-3 font-display text-4xl leading-[1.05]">{service.title}</h1>

            <div className="mt-5 h-px w-14 bg-brand-gold/70" />

            <div className="mt-6 space-y-4 text-sm text-brand-muted">
              <div>
                <div className="text-xs tracking-[0.22em]">CREATOR</div>
                <div className="mt-2 text-base text-brand-text">
                  {service.creator?.providerProfile?.displayName || service.creator?.email}
                </div>
                <div className="mt-1">
                  {[service.creator?.providerProfile?.city, service.creator?.providerProfile?.country]
                    .filter(Boolean)
                    .join(", ")}
                </div>
              </div>

              <div>
                <div className="text-xs tracking-[0.22em]">CATEGORY</div>
                <div className="mt-2 text-base text-brand-text">{service.category?.name || "Uncategorized"}</div>
              </div>
            </div>

            <p className="mt-6 whitespace-pre-wrap text-sm leading-7 text-brand-muted md:text-base">
              {service.description}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <BuyButton serviceId={service.id} />
              <FavoriteButton serviceId={service.id} />
            </div>
          </div>
        </section>
      </div>

      {!authenticated && (
        <div className="flex justify-center gap-4">
          <Link
            href="/user/register"
            className="rounded-full bg-brand-gold px-7 py-3 text-xs font-semibold tracking-[0.22em] text-black hover:bg-brand-gold2"
          >
            REGISTER
          </Link>
          <Link
            href="/user"
            className="rounded-full border border-brand-gold/60 px-7 py-3 text-xs font-semibold tracking-[0.22em] text-brand-text hover:border-brand-gold hover:text-white"
          >
            LOGIN
          </Link>
        </div>
      )}
    </div>
  );
}
