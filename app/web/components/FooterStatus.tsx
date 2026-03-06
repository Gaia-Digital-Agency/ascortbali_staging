// This module defines the FooterStatus component, which displays various application status details.
"use client";
import { withBasePath } from "../lib/paths";

// FooterStatus functional component.
export function FooterStatus() {
  return (
    // Render the footer with application status details.
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 text-xs tracking-[0.18em] text-brand-muted md:flex-row md:items-start md:justify-center">
      {/* Copyright and developer information. */}
      <div className="space-y-2 text-center md:text-left">
        <a
          href={withBasePath("/terms")}
          className="block underline-offset-2 hover:text-brand-gold hover:underline"
        >
          Terms &amp; Condition
        </a>
        <a
          href={withBasePath("/privacy")}
          className="block underline-offset-2 hover:text-brand-gold hover:underline"
        >
          Privacy Statement
        </a>
      </div>
    </div>
  );
}
