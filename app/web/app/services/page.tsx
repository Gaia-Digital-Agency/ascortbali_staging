// This module defines the Services Page component, displaying a paginated list of available services.
import Link from "next/link";
import { API_BASE } from "../../lib/api";

// Type definition for a Service item displayed in the list.
type Service = {
  id: string;
  title: string;
  description: string;
  basePrice: string;
  durationMinutes: number;
  featuredRank: number | null;
};

// ServicesPage asynchronous server component.
export default async function ServicesPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string };
}) {
  // Parse and normalize search parameters for pagination and search query.
  const page = Number(searchParams.page ?? "1");
  const q = searchParams.q ?? "";
  const qs = new URLSearchParams({
    page: String(page),
    pageSize: "50",
    sort: "updated",
    ...(q ? { q } : {}),
  });

  // Fetch services data from the API.
  const res = await fetch(`${API_BASE}/services?${qs.toString()}`, { cache: "no-store" });
  const data = await res.json();

  return (
    <div className="space-y-7">
      {/* Header section with title, search input, and navigation. */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-xs tracking-luxe text-brand-muted">CATALOG</div>
          <h2 className="mt-2 font-display text-3xl">Services</h2>
          <p className="mt-2 text-sm text-brand-muted">
            Showing page {page} — {data.total} results.
          </p>
        </div>

        <Link className="text-xs tracking-[0.22em] text-brand-muted hover:text-brand-text" href="/">
          BACK HOME
        </Link>

        {/* Search form for services. */}
        <form className="flex w-full gap-3 md:w-auto" action="/services" method="get">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search..."
            className="w-full rounded-full border border-brand-line bg-brand-surface/40 px-4 py-2 text-sm text-brand-text placeholder:text-brand-muted/70 md:w-64"
          />
          <button className="btn btn-primary">SEARCH</button>
        </form>
      </div>

      {/* Grid displaying individual service cards. */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data.items.map((s: Service) => (
          <Link
            key={s.id}
            href={`/services/${s.id}`}
            className="group rounded-3xl border border-brand-line bg-brand-surface/45 p-6 transition hover:border-brand-gold/50"
          >
            <div className="text-xs tracking-luxe text-brand-muted">
              {s.durationMinutes} MIN • {s.basePrice}
            </div>
            <div className="mt-3 font-display text-xl leading-snug group-hover:text-white">{s.title}</div>
            <p className="mt-3 line-clamp-3 text-sm leading-6 text-brand-muted">{s.description}</p>
            <div className="mt-6 flex items-center justify-between">
              <span className="text-xs tracking-[0.22em] text-brand-gold/90">VIEW</span>
              <span className="h-px w-10 bg-brand-gold/60" />
            </div>
          </Link>
        ))}
      </div>

      {/* Pagination controls. */}
      <div className="flex items-center justify-between border-t border-brand-line pt-6 text-xs tracking-[0.22em] text-brand-muted">
        <Link
          className={page > 1 ? "hover:text-brand-text" : "pointer-events-none opacity-40"}
          href={`/services?page=${page - 1}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
        >
          PREV
        </Link>
        <Link
          className={data.items.length > 0 ? "hover:text-brand-text" : "pointer-events-none opacity-40"}
          href={`/services?page=${page + 1}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
        >
          NEXT
        </Link>
      </div>
    </div>
  );
}
