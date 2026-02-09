"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../lib/api";
import { withBasePath } from "../../../../lib/paths";

type Props = {
  title: string;
  subtitle: string;
  creatorName: string;
  primaryImageUrl: string;
  primaryImageFile: string;
  fields: Array<[string, string | number | undefined]>;
  images: Array<{ id?: string; file?: string; imageUrl?: string }>;
  sourceUrl: string;
};

export default function CreatorPreviewClient(props: Props) {
  // Any authenticated role (user/creator/admin) should be able to view the full preview.
  const [canViewFull, setCanViewFull] = useState(false);

  useEffect(() => {
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
          <div className="text-xs tracking-luxe text-brand-muted">CREATOR PREVIEW</div>
          <h1 className="mt-2 font-display text-3xl">{props.title}</h1>
          <p className="mt-2 text-sm text-brand-muted">{props.subtitle}</p>
        </div>
        <Link className="btn btn-outline" href="/">
          BACK HOME
        </Link>
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-brand-line bg-brand-surface/55 p-6">
          <div className="text-xs tracking-luxe text-brand-muted">PRIMARY IMAGE</div>
          <div className="mt-4 aspect-[9/16] overflow-hidden rounded-2xl border border-brand-line">
            <img src={props.primaryImageUrl} alt={props.creatorName} className="h-full w-full object-cover" />
          </div>
          <div className="mt-3 text-xs text-brand-muted">Source image file: {props.primaryImageFile}</div>
        </div>

        <div className="rounded-3xl border border-brand-line bg-brand-surface/55 p-6">
          {!canViewFull ? (
            <div className="mb-3 rounded-xl border border-brand-gold/40 bg-brand-surface2/60 p-3 text-xs text-brand-muted">
              Visitor view: details are blurred. Login to view full profile.
              <div className="mt-2 flex gap-2">
                <Link className="btn btn-outline px-3 py-2 text-[10px]" href="/user">
                  USER LOGIN
                </Link>
                <Link className="btn btn-outline px-3 py-2 text-[10px]" href="/user/register">
                  REGISTER
                </Link>
              </div>
            </div>
          ) : null}
          <div className={`text-xs tracking-luxe text-brand-muted ${blurClass}`}>DETAILS (SCHEMA-ALIGNED)</div>
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
                  <img
                    src={img.imageUrl ?? withBasePath("/placeholders/card-1.jpg")}
                    alt={img.id ?? "Clean image"}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="p-3 text-xs text-brand-muted">{img.file ?? "—"}</div>
              </a>
            ))
          )}
        </div>
      </section>

      <section className={`rounded-3xl border border-brand-gold/60 bg-brand-surface/50 p-6 ${blurClass}`}>
        <div className="text-xs tracking-luxe text-brand-muted">SOURCE LINK</div>
        <div className="mt-3 text-sm text-brand-muted">{props.sourceUrl}</div>
      </section>
    </div>
  );
}
