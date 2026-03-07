"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch, getAccessToken, getRefreshToken } from "../../../../lib/api";

type Props = {
  title: string;
  creatorName: string;
  primaryImageUrl: string | null;
  fields: Array<[string, string | number | undefined]>;
  images: Array<{ id?: string; imageUrl?: string | null }>;
  nextCreatorId?: string | null;
};

export default function CreatorPreviewClient(props: Props) {
  const [canViewFull, setCanViewFull] = useState(false);

  useEffect(() => {
    const hasAuthToken = Boolean(getAccessToken() || getRefreshToken());
    if (!hasAuthToken) {
      setCanViewFull(false);
      return;
    }
    (async () => {
      try {
        const me = await apiFetch("/me");
        setCanViewFull(Boolean(me?.role));
      } catch {
        setCanViewFull(false);
      }
    })();
  }, []);

  const blurClass = canViewFull ? "" : "blur-md pointer-events-none select-none";

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs tracking-luxe text-brand-muted">PREVIEW</div>
          <h1 className="mt-2 font-display text-3xl">{props.title}</h1>
        </div>
        <div className="flex gap-2">
          {props.nextCreatorId && canViewFull ? (
            <Link className="btn btn-outline" href={`/creator/preview/${props.nextCreatorId}`}>
              NEXT
            </Link>
          ) : null}
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-brand-line bg-brand-surface/55 p-6">
          <div className="text-xs tracking-luxe text-brand-muted">PRIMARY IMAGE</div>
          <div className="mt-4 aspect-[9/16] overflow-hidden rounded-2xl border border-brand-line">
            {props.primaryImageUrl ? (
              <img src={props.primaryImageUrl} alt={props.creatorName} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-brand-muted">NO IMAGE</div>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-brand-line bg-brand-surface/55 p-6">
          <div className={`text-xs tracking-luxe text-brand-muted ${blurClass}`}>DETAILS</div>
          <div className={`mt-4 grid gap-3 ${blurClass}`}>
            {props.fields.map(([label, value]) => (
              <div key={label} className="flex items-center justify-between border-b border-brand-line/60 pb-2 text-sm">
                <span className="text-brand-muted">{label}</span>
                <span className="text-brand-text">{value ?? "—"}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-brand-line bg-brand-surface/55 p-6">
        <div className={`text-xs tracking-luxe text-brand-muted ${blurClass}`}>IMAGE GALLERY</div>
        <div className={`mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 ${blurClass}`}>
          {props.images.length === 0 ? (
            <div className="text-sm text-brand-muted">No cleaned image files found.</div>
          ) : (
            props.images.map((img) => (
              <a
                key={img.id}
                href={img.imageUrl ?? "#"}
                className="group overflow-hidden rounded-2xl border border-brand-line bg-brand-surface2/40"
                target="_blank"
                rel="noreferrer"
              >
                <div className="aspect-[9/16] w-full overflow-hidden">
                  {img.imageUrl ? (
                    <img
                      src={img.imageUrl}
                      alt={img.id ?? "Clean image"}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-brand-muted">NO IMAGE</div>
                  )}
                </div>
              </a>
            ))
          )}
        </div>
      </section>

      {!canViewFull ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-3xl border border-brand-line bg-brand-surface p-6 shadow-luxe">
            <div className="text-sm text-brand-muted">
              This page is available for members only. Please login to your account or register to continue.
            </div>
            <div className="mt-4 flex gap-2">
              <Link className="btn btn-outline px-3 py-2 text-[10px]" href="/user">
                LOGIN
              </Link>
              <Link className="btn btn-outline px-3 py-2 text-[10px]" href="/user/register">
                REGISTER
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
