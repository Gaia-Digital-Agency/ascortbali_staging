// This is the root layout component for the entire Next.js application.
import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import { AnalyticsBeacon } from "../components/AnalyticsBeacon";

import { AgeGateModal } from "../components/AgeGateModal";
import { FooterStatus } from "../components/FooterStatus";
import { AuthNavButton } from "../components/AuthNavButton";
import { withBasePath } from "../lib/paths";

// Metadata for the application, used for SEO and browser tabs.
export const metadata: Metadata = {
  title: "FREE BALI GIRLS",
  description: "Service marketplace scaffold",
  icons: {
    // Force base-path-aware favicon URL so mounted deployments load the tab icon.
    icon: [{ url: withBasePath("/icon.png"), type: "image/png" }],
    shortcut: [withBasePath("/icon.png")],
  },
};

// RootLayout component defines the overall structure of the HTML page.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* Analytics beacon for tracking visitor data. */}
        <AnalyticsBeacon />

        {/* Header section with site logo, title, and navigation. */}
        <header className="sticky top-0 z-10 border-b border-brand-line bg-brand-bg/70 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
            <Link href="/" className="group flex items-center gap-3">
              <img
                src={withBasePath("/api/admin-asset/baligirls_logo.png")}
                alt="BaliGirls"
                className="h-8 w-8 object-contain"
              />
              <div className="leading-none">
                <span className="font-display text-lg tracking-[0.22em] text-brand-gold">FREE BALI GIRLS</span>
                <div className="mt-1 text-[10px] tracking-[0.22em] text-brand-muted">Tagline Goes Here</div>
              </div>
              <span className="ml-1 h-[1px] w-10 bg-brand-gold/70 opacity-70 transition group-hover:opacity-100" />
            </Link>

            {/* Navigation buttons including authentication and pagination links. */}
            <nav className="flex w-full min-w-0 flex-nowrap items-center justify-center gap-1 overflow-hidden whitespace-nowrap md:w-auto md:justify-start">
              <Link href="/" className="btn btn-outline px-2 py-2 text-[9px] tracking-[0.14em] sm:px-3 sm:text-[10px]">
                BACK HOME
              </Link>
              <AuthNavButton />
            </nav>
          </div>
        </header>

        <AgeGateModal />

        {/* Main content area where page-specific content is rendered. */}
        <main id="top" className="mx-auto max-w-6xl px-4 py-10">
          {children}
          {/* Back to top button. */}
          <div className="mt-12 flex justify-center">
            <a
              href="#top"
              className="rounded-full border border-brand-gold/60 px-6 py-2 text-xs font-semibold tracking-[0.22em] text-brand-text hover:border-brand-gold hover:text-white"
            >
              BACK TO TOP
            </a>
          </div>
        </main>

        {/* Footer section displaying application status. */}
        <footer className="border-t border-brand-line">
          <FooterStatus />
        </footer>
      </body>
    </html>
  );
}
