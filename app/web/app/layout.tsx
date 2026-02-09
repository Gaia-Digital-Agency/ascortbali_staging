import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import { AnalyticsBeacon } from "../components/AnalyticsBeacon";

import { FooterStatus } from "../components/FooterStatus";
import { AuthNavButton } from "../components/AuthNavButton";
import { withBasePath } from "../lib/paths";

export const metadata: Metadata = {
  title: "BaliGirls",
  description: "Service marketplace scaffold",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AnalyticsBeacon />

        <header className="sticky top-0 z-10 border-b border-brand-line bg-brand-bg/70 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
            <Link href="/" className="group flex items-center gap-3">
              <img
                src={withBasePath("/api/admin-asset/baligirls_logo.png")}
                alt="BaliGirls"
                className="h-8 w-8 object-contain"
              />
              <span className="font-display text-lg tracking-[0.22em] text-brand-gold">BALIGIRLS</span>
              <span className="hidden text-xs tracking-luxe text-brand-muted md:block">
                premium marketplace
              </span>
              <span className="ml-1 h-[1px] w-10 bg-brand-gold/70 opacity-70 transition group-hover:opacity-100" />
            </Link>

            <nav className="flex flex-wrap items-center gap-2">
              <AuthNavButton />
              {[1, 2, 3].map((p) => (
                <Link
                  key={p}
                  href={`/?page=${p}`}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-brand-line text-[10px] font-semibold tracking-[0.22em] text-brand-muted hover:border-brand-gold hover:text-brand-gold"
                >
                  {p}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        <main id="top" className="mx-auto max-w-6xl px-4 py-10">
          {children}
          <div className="mt-12 flex justify-center">
            <a
              href="#top"
              className="rounded-full border border-brand-gold/60 px-6 py-2 text-xs font-semibold tracking-[0.22em] text-brand-text hover:border-brand-gold hover:text-white"
            >
              BACK TO TOP
            </a>
          </div>
        </main>

        <footer className="border-t border-brand-line">
          <FooterStatus />
        </footer>
      </body>
    </html>
  );
}
